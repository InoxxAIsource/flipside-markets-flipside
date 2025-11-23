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
