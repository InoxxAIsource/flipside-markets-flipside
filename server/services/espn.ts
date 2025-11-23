import type { Market } from "@shared/schema";

// ESPN API base URL
const ESPN_API_BASE = "https://site.api.espn.com/apis/site/v2/sports";

// Supported sports and their ESPN league codes
export const SPORTS_CONFIG = {
  NFL: { path: "football/nfl", name: "NFL", category: "Sports - NFL" },
  NBA: { path: "basketball/nba", name: "NBA", category: "Sports - NBA" },
  MLB: { path: "baseball/mlb", name: "MLB", category: "Sports - MLB" },
  NHL: { path: "hockey/nhl", name: "NHL", category: "Sports - NHL" },
  Soccer: { path: "soccer/eng.1", name: "Soccer", category: "Sports - Soccer" }, // Premier League
} as const;

export type Sport = keyof typeof SPORTS_CONFIG;

// Parsed game data structure
export interface ESPNGame {
  espnEventId: string;
  sport: Sport;
  category: string;
  
  // Teams
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeTeamColor: string;
  awayTeamColor: string;
  homeTeamRecord: string;
  awayTeamRecord: string;
  
  // Game details
  gameDate: Date;
  venue: string;
  venueCity: string;
  venueState: string;
  
  // Odds (from ESPN consensus)
  spread?: string;
  overUnder?: number;
  
  // Calculated market prices (derived from odds)
  yesPrice: number; // Away team win probability
  noPrice: number;  // Home team win probability
  
  // Status
  gameStatus: "pre" | "in" | "post";
  homeScore: number;
  awayScore: number;
  statusDetail: string; // "Scheduled", "Final", "Q3 8:42", etc.
  
  // Market metadata
  question: string; // "Will [Away Team] beat [Home Team]?"
  description: string;
}

/**
 * Convert American odds (moneyline) to implied probability
 * @param odds - American odds format (e.g., -150 for favorite, +130 for underdog)
 * @returns Implied probability as decimal (0 to 1)
 */
export function americanOddsToProb(odds: number): number {
  if (odds < 0) {
    // Favorite: -150 means bet $150 to win $100
    // Probability = |odds| / (|odds| + 100)
    return Math.abs(odds) / (Math.abs(odds) + 100);
  } else {
    // Underdog: +130 means bet $100 to win $130
    // Probability = 100 / (odds + 100)
    return 100 / (odds + 100);
  }
}

/**
 * Convert spread to implied probabilities for home and away teams
 * Standard spread odds are typically -110 on both sides (4.55% vig)
 * @param spread - Spread string like "BUF -7" or "SF -3.5"
 * @param homeTeam - Home team abbreviation
 * @returns { homeProb, awayProb } - Probabilities for home and away teams
 */
export function spreadToProb(spread: string | undefined, homeTeam: string): { homeProb: number; awayProb: number } {
  if (!spread) {
    // No spread data, return 50-50
    return { homeProb: 0.5, awayProb: 0.5 };
  }

  // Parse spread (e.g., "BUF -7" → -7 for BUF)
  const spreadMatch = spread.match(/([\-+]?\d+\.?\d*)/);
  if (!spreadMatch) {
    return { homeProb: 0.5, awayProb: 0.5 };
  }

  const spreadValue = parseFloat(spreadMatch[1]);
  const favoredTeam = spread.split(' ')[0];
  
  // Standard -110 odds on both sides = 52.38% implied probability (with vig)
  // Remove vig: 52.38% / (52.38% + 52.38%) = 50% true probability each side
  // But larger spreads imply stronger favorites
  
  // Simple heuristic: each point of spread = ~3% shift in probability
  // This is approximate but reasonable for market making
  const probabilityShift = Math.min(Math.abs(spreadValue) * 0.03, 0.25); // Cap at 25% shift
  
  const isFavoredHome = favoredTeam.toUpperCase().includes(homeTeam.substring(0, 3).toUpperCase());
  
  if (isFavoredHome) {
    // Home team is favored
    return {
      homeProb: Math.min(0.5 + probabilityShift, 0.80), // Cap at 80%
      awayProb: Math.max(0.5 - probabilityShift, 0.20), // Floor at 20%
    };
  } else {
    // Away team is favored
    return {
      homeProb: Math.max(0.5 - probabilityShift, 0.20),
      awayProb: Math.min(0.5 + probabilityShift, 0.80),
    };
  }
}

/**
 * Fetch scoreboard data from ESPN API for a specific sport
 */
export async function fetchESPNScoreboard(sport: Sport): Promise<ESPNGame[]> {
  const config = SPORTS_CONFIG[sport];
  const url = `${ESPN_API_BASE}/${config.path}/scoreboard`;
  
  try {
    console.log(`[ESPN] Fetching ${sport} scoreboard from ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.events || !Array.isArray(data.events)) {
      console.warn(`[ESPN] No events found for ${sport}`);
      return [];
    }
    
    const games = data.events.map((event: any) => parseESPNEvent(event, sport));
    console.log(`[ESPN] Found ${games.length} ${sport} games`);
    
    return games;
  } catch (error) {
    console.error(`[ESPN] Error fetching ${sport} scoreboard:`, error);
    return [];
  }
}

/**
 * Fetch all sports scoreboards
 */
export async function fetchAllSportsScoreboards(): Promise<ESPNGame[]> {
  const sports: Sport[] = ["NFL", "NBA", "MLB", "NHL", "Soccer"];
  
  const results = await Promise.allSettled(
    sports.map(sport => fetchESPNScoreboard(sport))
  );
  
  const allGames: ESPNGame[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      allGames.push(...result.value);
    } else {
      console.error(`[ESPN] Failed to fetch ${sports[index]}:`, result.reason);
    }
  });
  
  return allGames;
}

/**
 * Parse an ESPN event into our standardized game format
 */
function parseESPNEvent(event: any, sport: Sport): ESPNGame {
  const config = SPORTS_CONFIG[sport];
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors || [];
  
  // Find home and away teams
  const homeTeam = competitors.find((c: any) => c.homeAway === "home");
  const awayTeam = competitors.find((c: any) => c.homeAway === "away");
  
  // Parse status
  const status = event.status?.type;
  let gameStatus: "pre" | "in" | "post" = "pre";
  if (status?.state === "in") gameStatus = "in";
  if (status?.state === "post" || status?.completed) gameStatus = "post";
  
  // Parse scores
  const homeScore = parseInt(homeTeam?.score || "0", 10);
  const awayScore = parseInt(awayTeam?.score || "0", 10);
  
  // Parse odds
  const odds = competition?.odds?.[0];
  const spread = odds?.details || undefined;
  const overUnder = odds?.overUnder || undefined;
  
  // Parse venue
  const venue = competition?.venue;
  const venueName = venue?.fullName || "TBD";
  const venueCity = venue?.address?.city || "";
  const venueState = venue?.address?.state || "";
  const venueStr = venueCity && venueState 
    ? `${venueName}, ${venueCity}, ${venueState}`
    : venueName;
  
  // Parse team records
  const homeRecord = homeTeam?.records?.[0]?.summary || "";
  const awayRecord = awayTeam?.records?.[0]?.summary || "";
  
  // Generate market question
  const question = `Will ${awayTeam?.team?.displayName || "Away"} beat ${homeTeam?.team?.displayName || "Home"}?`;
  
  // Generate description with context
  const description = [
    `${sport} Game: ${awayTeam?.team?.displayName || "Away"} @ ${homeTeam?.team?.displayName || "Home"}`,
    homeRecord && awayRecord ? `Records: ${awayTeam?.team?.abbreviation} ${awayRecord} vs ${homeTeam?.team?.abbreviation} ${homeRecord}` : "",
    spread ? `Spread: ${spread}` : "",
    overUnder ? `Over/Under: ${overUnder}` : "",
    `Venue: ${venueStr}`,
  ].filter(Boolean).join("\n");
  
  // Calculate market prices from spread odds
  // Question is "Will [Away Team] beat [Home Team]?" so YES = away wins, NO = home wins
  const homeTeamAbbr = homeTeam?.team?.abbreviation || homeTeam?.team?.displayName || "HOME";
  const probabilities = spreadToProb(spread, homeTeamAbbr);
  const yesPrice = probabilities.awayProb; // YES = away team wins
  const noPrice = probabilities.homeProb;  // NO = home team wins
  
  return {
    espnEventId: event.id,
    sport,
    category: config.category,
    
    // Teams
    homeTeam: homeTeam?.team?.displayName || "Home Team",
    awayTeam: awayTeam?.team?.displayName || "Away Team",
    homeTeamLogo: homeTeam?.team?.logo || "",
    awayTeamLogo: awayTeam?.team?.logo || "",
    homeTeamColor: homeTeam?.team?.color || "000000",
    awayTeamColor: awayTeam?.team?.color || "000000",
    homeTeamRecord: homeRecord,
    awayTeamRecord: awayRecord,
    
    // Game details
    gameDate: new Date(event.date),
    venue: venueName,
    venueCity,
    venueState,
    
    // Odds
    spread,
    overUnder,
    
    // Calculated market prices (from odds)
    yesPrice,
    noPrice,
    
    // Status
    gameStatus,
    homeScore,
    awayScore,
    statusDetail: status?.detail || "Scheduled",
    
    // Market metadata
    question,
    description,
  };
}

/**
 * Fetch updated game status for an existing market
 */
export async function fetchGameUpdate(espnEventId: string, sport: Sport): Promise<Partial<ESPNGame> | null> {
  try {
    const config = SPORTS_CONFIG[sport];
    const url = `${ESPN_API_BASE}/${config.path}/scoreboard`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const event = data.events?.find((e: any) => e.id === espnEventId);
    
    if (!event) return null;
    
    const fullGame = parseESPNEvent(event, sport);
    
    // Return only the fields that change during/after games
    return {
      gameStatus: fullGame.gameStatus,
      homeScore: fullGame.homeScore,
      awayScore: fullGame.awayScore,
      statusDetail: fullGame.statusDetail,
    };
  } catch (error) {
    console.error(`[ESPN] Error fetching game update for ${espnEventId}:`, error);
    return null;
  }
}

/**
 * Determine if a game should be resolved based on its status
 */
export function shouldResolveGame(game: ESPNGame): boolean {
  return game.gameStatus === "post";
}

/**
 * Determine the outcome of a finished game
 * Returns true if away team won, false if home team won
 */
export function getGameOutcome(game: ESPNGame): boolean {
  if (game.gameStatus !== "post") {
    throw new Error("Cannot determine outcome of unfinished game");
  }
  return game.awayScore > game.homeScore;
}

/**
 * Filter games to only include upcoming games (not started yet)
 */
export function filterUpcomingGames(games: ESPNGame[]): ESPNGame[] {
  return games.filter(game => game.gameStatus === "pre");
}

/**
 * Filter games that are currently in progress
 */
export function filterLiveGames(games: ESPNGame[]): ESPNGame[] {
  return games.filter(game => game.gameStatus === "in");
}

/**
 * Filter games that have finished
 */
export function filterFinishedGames(games: ESPNGame[]): ESPNGame[] {
  return games.filter(game => game.gameStatus === "post");
}
