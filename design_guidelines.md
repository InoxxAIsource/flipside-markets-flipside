# Design Guidelines: Prediction Market Platform

## Design Approach

**Reference-Based Strategy**: Drawing primary inspiration from **Polymarket** and **Limitless Exchange**, with additional influence from **Binance** (for trading UI) and **TradingView** (for charting). This platform requires a sophisticated financial trading aesthetic with data-dense layouts optimized for decision-making.

### Core Design Principles
1. **Data-First Hierarchy**: Price movements, probabilities, and market metrics are the primary visual focus
2. **Trust & Clarity**: Clean layouts that inspire confidence in financial decisions
3. **Scan-ability**: Users should quickly parse multiple markets and trading data
4. **Precision Trading**: Interface supports both quick trades and detailed order placement

## Typography System

**Font Stack**:
- Primary: Inter (via Google Fonts) - for UI elements, numbers, data
- Monospace: JetBrains Mono (via Google Fonts) - for prices, addresses, token IDs

**Type Scale**:
- Hero/Market Titles: text-2xl to text-4xl, font-semibold
- Market Questions: text-lg to text-xl, font-medium
- Body Text: text-sm to text-base, font-normal
- Data/Metrics: text-xs to text-sm, font-medium (monospace for numbers)
- Probabilities/Prices: text-xl to text-3xl, font-bold (monospace)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8
- Grid gaps: gap-4, gap-6
- Container max-widths: max-w-7xl for main content, max-w-6xl for forms

**Grid Structures**:
- Market Cards: 3-column grid on desktop (lg:grid-cols-3), 2-column tablet (md:grid-cols-2), single column mobile
- Trading Layout: Sidebar navigation (w-64) + main content area + right panel (w-80) for order book on large screens
- Dashboard: 2-column metrics grid with stacked mobile view

## Component Library

### Navigation
- **Top Bar**: Fixed position, dark background, logo left, wallet connection right, search bar center
- **Sidebar** (Desktop): Persistent navigation with market categories, portfolio link, create market CTA
- **Mobile Nav**: Bottom tab bar with 4-5 key actions (Markets, Trade, Portfolio, Create)

### Market Components

**Market Card**:
- Compact card design (h-48 to h-64)
- Question as heading (2 lines max with ellipsis)
- Large probability display (YES/NO percentages)
- Price chart thumbnail (if space permits)
- Volume, liquidity, time remaining badges
- Hover: subtle lift effect (shadow-lg transition)

**Market Detail View**:
- Hero section with market question (text-3xl)
- Twin trading panels (Buy YES / Buy NO) with prominent CTAs
- Live price chart (TradingView-style) full width
- Order book table with bid/ask spreads
- Market info sidebar: resolution criteria, creator, creation date, category tags

**Trading Interface**:
- Order entry form with amount input, price slider
- Position size calculator showing potential profit/loss
- Recent trades table (real-time updates)
- User's open orders list with cancel actions
- Balance display showing USDT collateral

### Data Display

**Stats Cards**:
- Border card with rounded-lg
- Large number display (monospace, text-2xl)
- Label below (text-xs, muted)
- Optional trend indicator (arrow + percentage)

**Tables**:
- Dense information display (text-xs to text-sm)
- Sticky header row
- Alternating row backgrounds for readability
- Right-aligned numbers (monospace)
- Action buttons in last column

**Charts**:
- Primary: Candlestick/line charts for price movement
- Secondary: Donut charts for position breakdowns
- Minimal chrome, focus on data
- Grid lines subdued

### Forms

**Market Creation**:
- Multi-step wizard OR single-page form with clear sections
- Large text input for market question (textarea, 3-4 rows)
- Pyth price feed selector (dropdown with search)
- Date/time picker for expiration (calendar UI)
- Category tags (multi-select chips)
- Preview panel showing how market will appear
- Prominent "Create Market" CTA

**Trade Forms**:
- Amount input with max button
- Price input (for limit orders) with market price reference
- Outcome selector (YES/NO toggle or tabs)
- Summary panel showing: fees, total cost, potential return
- Large "Buy YES" / "Buy NO" buttons

### Utility Components

**Wallet Connection**:
- Button showing truncated address when connected (0x1234...5678)
- Balance display (USDT amount)
- Network indicator (Sepolia badge)
- Dropdown menu: view on Etherscan, disconnect

**Status Indicators**:
- Market status badges: Active, Closed, Resolved (rounded-full px-3 py-1)
- Transaction status: Pending (spinner), Success (checkmark), Failed (x)
- Network status: Connected (green dot), Disconnected (red dot)

**Empty States**:
- Centered icon + message + CTA
- "No markets found" with create market button
- "No positions yet" with browse markets link

## Page Layouts

**Homepage/Market Browse**:
- Hero banner: Platform tagline, key metrics (total volume, markets, traders), primary CTA
- Featured markets carousel (3-4 cards, auto-scroll)
- Category filters (horizontal tabs)
- Search bar (prominent, full-width on mobile)
- Market grid (infinite scroll or pagination)

**Market Detail Page**:
- Full-width layout
- Left 2/3: Chart + trading interface
- Right 1/3: Order book, market info, related markets
- Mobile: Stacked sections with tabs for Chart/Trade/Orders

**Portfolio Dashboard**:
- Summary cards row: Total Value, Unrealized P&L, Active Positions, Pending Orders
- Tabs: Positions, Order History, Trade History, Resolved Markets
- Position cards showing: market question, shares held, current value, P&L

**Create Market Page**:
- Centered form (max-w-3xl)
- Preview panel sticky on right (desktop)
- Step indicators if multi-step
- Helpful tooltips and field descriptions

## Images

**Hero Section**: Feature a dynamic, abstract visualization representing prediction markets - interconnected nodes, probability curves, or data streams. Not a traditional hero image, but more like an animated background gradient with geometric shapes suggesting market movements and data flows.

**Empty States**: Use simple line illustrations for empty portfolio, no search results, etc.

**Market Icons**: Small category icons (16x16 to 24x24) from icon library

## Animations

Use sparingly, only for:
- Market card hover (scale: 1.02, shadow increase)
- Button press states (scale: 0.98)
- Loading spinners (spin animation)
- Toast notifications (slide-in from top)
- Chart updates (smooth line transitions)

**NO complex scroll animations or parallax effects** - this is a data-focused trading interface where stability > flashiness.

## Accessibility

- All interactive elements keyboard accessible
- Focus states visible (ring-2 ring-offset-2)
- Color is not the only indicator (use icons + text)
- Sufficient contrast for all text
- ARIA labels for icon-only buttons
- Form validation errors clearly marked