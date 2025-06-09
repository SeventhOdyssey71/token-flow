# TokenFlow

Token distribution platform, product by the 4dummies team

## Overview

TokenFlow is a decentralized application (dApp) built on the Sui blockchain that enables users to instantly distribute tokens among multiple recipients. The application consists of a Move smart contract deployed on Sui testnet and a React frontend interface with real-time blockchain data integration.

## Features

### Instant Token Distribution
- **One-Click Distribution**: Create and distribute tokens in a single transaction
- **CSV Upload**: Import recipient addresses from CSV files
- **Manual Entry**: Add recipients manually with validation
- **Real-time Processing**: Instant token distribution upon transaction signing

### Distribution Dashboard
- **My Distributions**: View personal distribution history (sent & received)
- **All Distributions**: Browse all distributions on the platform
- **Live Stats**: Real-time statistics including total SUI distributed, unique recipients
- **Transaction History**: Complete history with transaction links
- **Scrolling Distribution Bar**: Live feed of recent distributions

### Mobile-First Design
- **Responsive Interface**: Fully optimized for mobile devices
- **Hamburger Menu**: Clean mobile navigation
- **Touch-Friendly**: Optimized for touch interactions
- **Dark/Light Theme**: Toggle between themes for comfort

## Technical Stack

- **Blockchain**: Sui Network (Testnet)
- **Smart Contract**: Move language
- **Frontend**: React, TypeScript, Vite
- **Styling**: CSS with monochrome theme system
- **Wallet Connection**: @mysten/dapp-kit
- **State Management**: React hooks and context
- **Routing**: React Router

## Smart Contract Details

- **Package ID**: 0xb3aae90f6f074bb83d8b42ad52d6bb12c71fa0696ab8e0d783cb709542c515de
- **Module**: fund_distributor
- **Network**: Sui Testnet

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Sui wallet (e.g., Sui Wallet browser extension)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/SeventhOdyssey71/token-flow.git
   cd token-flow
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Creating a Distribution

1. Connect your Sui wallet
2. Click "New Distribution" button
3. Enter event name and amount
4. Add recipients via:
   - CSV upload (use template for format)
   - Manual entry (paste addresses)
5. Review and confirm
6. Sign the transaction

### Viewing Distributions

1. Navigate to Distribution Dashboard
2. Toggle between "My Distributions" and "All Distributions"
3. View detailed statistics:
   - Total SUI involved
   - Recipients reached
   - Distribution history
   - Your role (Distributor/Recipient)

## Development

### Project Structure

```
├── contracts/              # Move smart contracts
│   ├── sources/
│   │   └── fund_distributor.move
│   └── tests/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── CreateEvent.tsx # Distribution creation
│   │   ├── WalletStatus.tsx
│   │   └── ScrollingDistributionBar.tsx
│   ├── contexts/          # React contexts
│   ├── hooks/            # Custom hooks
│   │   └── useContract.ts
│   ├── App.tsx           # Main application
│   └── main.tsx          # Entry point
└── ...
```

### Key Components

- **FunctionalDashboard**: Main dashboard with distribution history
- **CreateEvent**: Multi-step form for creating distributions
- **useContract**: Hook for blockchain interactions
- **ScrollingDistributionBar**: Live distribution feed

### Building for Production

```bash
npm run build
```

## License

MIT

## Contact

For questions or support, please open an issue on GitHub or contact the maintainers.
