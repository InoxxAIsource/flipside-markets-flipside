# Contributing to Flipside

Thank you for your interest in contributing to Flipside! We welcome contributions from the community and appreciate your help in making this platform better.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

---

## 📜 Code of Conduct

This project adheres to a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Ethereum wallet (MetaMask recommended)
- Git

### Setup Development Environment

1. **Fork the repository**
   - Visit https://github.com/flipside-markets/flipside
   - Click the "Fork" button in the top right

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/flipside.git
   cd flipside
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/flipside-markets/flipside.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

6. **Push database schema**
   ```bash
   npm run db:push
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

---

## 🔄 Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Creating a Feature Branch

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write clean, readable code** following our style guide
2. **Add tests** for new functionality
3. **Update documentation** if needed
4. **Commit often** with clear, descriptive messages

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(trading): add stop-loss order functionality

Implements stop-loss monitoring service with WebSocket notifications.
Includes backend validation and frontend UI components.

Closes #123
```

```
fix(api): resolve rate limiting issue for free tier

Updates middleware to correctly apply 100 req/hr limit.
```

---

## 🎨 Code Style

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow **ESLint** configuration
- Use **functional components** and **hooks** in React
- Prefer **const** over **let**, avoid **var**
- Use **async/await** over promises chains
- Add **JSDoc comments** for public APIs

### React Components

```typescript
// Good
export function MarketCard({ market }: MarketCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Card data-testid="market-card">
      {/* Component content */}
    </Card>
  );
}

// Add data-testid to interactive elements
<Button data-testid="button-trade">Trade</Button>
```

### File Organization

```
client/src/
├── components/     # Reusable UI components
├── pages/          # Page components (routes)
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
└── types/          # TypeScript type definitions

server/
├── routes.ts       # API routes
├── storage.ts      # Database interface
├── services/       # Business logic
└── utils/          # Helper functions
```

### Styling

- Use **Tailwind CSS** utility classes
- Follow **shadcn/ui** component patterns
- Ensure **dark mode** compatibility
- Add **responsive** breakpoints for mobile

```tsx
// Good - Tailwind with dark mode
<div className="bg-background dark:bg-background-dark p-4 md:p-6">
  <h2 className="text-xl font-bold text-foreground dark:text-foreground-dark">
    Market Title
  </h2>
</div>
```

---

## 🔍 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- MarketCard.test.tsx

# Run with coverage
npm run test:coverage
```

### Writing Tests

- **Unit tests** for utility functions
- **Component tests** for React components
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows (optional)

```typescript
describe('MarketCard', () => {
  it('displays market question and price', () => {
    const market = { question: 'Will BTC hit $100k?', yesPrice: 0.75 };
    render(<MarketCard market={market} />);
    
    expect(screen.getByText('Will BTC hit $100k?')).toBeInTheDocument();
    expect(screen.getByText('75¢')).toBeInTheDocument();
  });
});
```

---

## 🔀 Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Check linting**
   ```bash
   npm run lint
   ```

4. **Build successfully**
   ```bash
   npm run build
   ```

### Submitting a PR

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create pull request** on GitHub
   - Target the `develop` branch
   - Fill out the PR template completely
   - Link related issues

3. **PR Review Process**
   - Maintainers will review within 2-3 business days
   - Address feedback and requested changes
   - Keep discussion professional and constructive

4. **After Approval**
   - PR will be merged to `develop`
   - Feature will be included in next release

### PR Title Format

```
[Type] Brief description (#issue-number)
```

**Examples:**
- `[Feature] Add stop-loss order monitoring (#45)`
- `[Bugfix] Fix liquidity display on market cards (#78)`
- `[Docs] Update API documentation for v1 endpoints (#92)`

---

## 🐛 Reporting Bugs

### Before Reporting

- Check [existing issues](https://github.com/flipside-markets/flipside/issues)
- Verify the bug in the latest version
- Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen instead.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome 120, Safari 17]
- Wallet: [e.g., MetaMask 11.0]
- Node version: [e.g., 18.17.0]

**Additional context**
Any other relevant information.
```

---

## 💡 Feature Requests

We welcome feature suggestions! Please open an issue with:

- **Clear description** of the feature
- **Use case** - why it's needed
- **Proposed solution** (if you have one)
- **Alternatives considered**

---

## 🏆 Recognition

Contributors will be recognized in:
- Release notes
- Contributors page
- Special mentions for significant contributions

---

## 📞 Getting Help

- **GitHub Discussions**: Ask questions and discuss ideas
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check our [docs](./ARCHITECTURE.md) first

---

## 📄 License

By contributing to Flipside, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---

Thank you for contributing to Flipside! 🎉
