# Flipside

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-8B92A6.svg)](https://sepolia.etherscan.io/)

> **A decentralized prediction market platform on Ethereum Sepolia** - Trade on crypto, sports, politics, and real-world events with trustless settlement and dual trading systems.

🌐 **Live Demo:** [flipside.exchange](https://flipside.exchange)

---

## 🚀 Overview

Flipside is a full-stack prediction/opinion  market platform , enabling users to create, trade, and resolve prediction markets on blockchain. Built on Ethereum Sepolia testnet, it combines the best of DeFi with a modern, intuitive web interface.

### Key Features

- **🔄 Dual Trading Systems**
  - **CLOB (Central Limit Order Book)**: Gasless limit & market orders with EIP-712 meta-transactions
  - **AMM Pool**: Automated market maker with LP tokens and 2% fee structure

- **⚡ Gasless Trading**: ProxyWallet system enables meta-transactions - users pay zero gas fees for orders

- **🔮 Oracle-Powered Resolution**: Pyth Network integration for trustless, real-time price feeds

- **🤖 AI Market Analysis**: GPT-4o-mini powered insights for every market

- **📊 Real-Time Sports Odds**: ESPN BET integration displaying spread and over/under for NFL, NBA, MLB, NHL

- **💰 Developer API**: Monetizable REST API v1 with three-tier pricing (Free, Pro $99/mo, Enterprise $500+/mo)

- **📈 Advanced Order Types**: Fill-or-Kill, Stop-Loss, Good-til-Cancelled with backend monitoring

- **🔔 WebSocket Updates**: Real-time market data with polling fallback

- **🎨 Modern UI/UX**: Dark/light themes, mobile-first responsive design with shadcn/ui

---

## 🏗️ Architecture

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Wouter** for routing
- **TanStack Query** for data fetching
- **Ethers.js v6** for blockchain interactions
- **shadcn/ui** (Radix UI) + **Tailwind CSS**

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** (Neon serverless) + **Drizzle ORM**
- **WebSocket server** for real-time updates
- **Event indexer** for blockchain event monitoring
- **Pyth worker** for oracle price updates
- **Order matcher** for CLOB execution

### Blockchain (Ethereum Sepolia)
- **ConditionalTokens**: `0xdC8CB01c328795C007879B2C030AbF1c1b580D84`
- **MockUSDT**: `0xAf24D4DDbA993F6b11372528C678edb718a097Aa`
- **ProxyWallet Factory**: `0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2`
- **AMMPoolFactorySimple**: `0xAe14f8BC192306A891b172A3bc0e91132a4417EF`

### External Integrations
- **Pyth Network**: Real-time oracle price feeds
- **OpenAI**: AI-powered market analysis (GPT-4o-mini)
- **ESPN API**: Live sports odds and event data
- **WalletConnect**: Mobile wallet support

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Wouter, TanStack Query, Ethers.js v6 |
| **UI Components** | shadcn/ui, Radix UI, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, WebSocket |
| **Database** | PostgreSQL (Neon), Drizzle ORM |
| **Blockchain** | Solidity, Hardhat, Ethers.js, EIP-712 |
| **AI/ML** | OpenAI GPT-4o-mini |
| **DevOps** | Replit, GitHub Actions (optional) |

---

## 📦 Installation

### Prerequisites
- **Node.js** 18+ and **npm**
- **PostgreSQL** database
- **Ethereum wallet** (MetaMask, WalletConnect)
- **API Keys**: OpenAI, WalletConnect Project ID

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/flipside-markets/flipside.git
   cd flipside
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/flipside
   
   # Blockchain
   RELAYER_PRIVATE_KEY=your_relayer_private_key
   
   # APIs
   OPENAI_API_KEY=your_openai_key
   VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   
   # Admin (optional)
   ADMIN_WALLET_ADDRESSES=0x...
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   Navigate to `http://localhost:5000`

---

## 🎯 Usage

### Creating a Market
1. Click **"Create Market"** in navigation
2. Enter market question and description
3. Select category (Crypto, Sports, Politics, etc.)
4. Choose trading system (CLOB or AMM)
5. Set expiration date and optional price feed
6. Deploy to blockchain (gasless!)

### Trading
- **CLOB Markets**: Place limit or market orders with gasless meta-transactions
- **AMM Markets**: Instant swaps with liquidity pools
- **Advanced Orders**: Set stop-loss, fill-or-kill conditions

### Resolving Markets
Markets resolve automatically via Pyth oracles or manual admin resolution after expiration.

---

## 🔌 Developer API

Flipside offers a monetizable REST API for third-party integrations:

- **Free Tier**: 100 requests/hour
- **Pro ($99/mo)**: 1,000 requests/hour
- **Enterprise ($500+/mo)**: Unlimited requests

### Example API Call
```bash
curl -H "X-API-Key: your_api_key" \
  https://flipside.exchange/api/v1/markets
```

See [API Documentation](https://flipside.exchange/api/docs) for full details.

---

## 📚 Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System design and smart contracts
- [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute
- [Code of Conduct](./CODE_OF_CONDUCT.md) - Community standards
- [Market Seeding Guide](./MARKET_SEEDING_GUIDE.md) - Production deployment

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details on:

- Code style and conventions
- Pull request process
- Development workflow
- Testing requirements

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🌟 Roadmap

- [ ] **Mainnet Deployment** - Launch on BNB/BASE mainnet
- [ ] **Mobile App** - Native iOS/Android applications
- [ ] **Advanced Analytics** - Enhanced market statistics and charts
- [ ] **Social Features** - User profiles, following, comments
- [ ] **Multi-chain Support** - Polygon, Arbitrum, Optimism
- [ ] **DAO Governance** - Community-driven platform decisions

---

## 👥 Team

- **M. Tauheed** - CEO & Founder
- **Joe Fill** - Lead Engineer
- **Inoxx Infra** - Head of Product

---

## 📞 Contact & Support

- **Website**: [flipside.exchange](https://flipside.exchange)
- **GitHub Issues**: [Report a bug](https://github.com/flipside-markets/flipside/issues)
- **Investor Portal**: [Login](https://flipside.exchange/investor/login)
- **API Docs**: [Developer Documentation](https://flipside.exchange/api/docs)

---

## 🙏 Acknowledgments

- **Polymarket** - Inspiration for prediction market design
- **Gnosis Conditional Tokens** - Smart contract framework
- **Pyth Network** - Oracle infrastructure
- **Replit** - Development platform
- **shadcn/ui** - UI component library

---

**Made with ❤️ by the Flipside team**
