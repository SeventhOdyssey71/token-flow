# Token Flow

## Overview

Token Flow is a decentralized application (dApp) built on the Sui blockchain that enables users to split tokens among multiple recipients. The application consists of a Move smart contract deployed on Sui mainnet and a React frontend interface.

## Features

### Token Splitting

- **Equal Distribution**: Split tokens equally among multiple recipients
- **Custom Distribution**: Specify custom amounts for each recipient
- **CSV Upload**: Import recipient addresses from a CSV file
- **Transaction Tracking**: View transaction status and explorer links

### Address Collection Dashboard

- **Form Creation**: Create custom forms to collect wallet addresses
- **Shareable Links**: Generate unique links for recipients to submit their addresses
- **Data Management**: View and manage all collected addresses
- **CSV Export**: Export collected addresses for use with token splitting feature

## Technical Stack

- **Blockchain**: Sui Network (Mainnet)
- **Smart Contract**: Move language
- **Frontend**: React, TypeScript, Vite
- **Styling**: CSS with light/dark theme support
- **Wallet Connection**: @mysten/dapp-kit
- **Backend Storage**: Firebase Firestore
- **Routing**: React Router

## Smart Contract Details

- **Package ID**: 0x0b06ccbf49c99410c3f1584cebaaf1e027c73f5407e1608804d7a2c23bb9bea1
- **Splitter Object ID**: 0x3b2dc3d948be777433677be129102a1cde8d9410b555127043f1779e7cb77b27

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Sui wallet (e.g., Sui Wallet browser extension)
- Firebase account (for address collection dashboard)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/shaibuafeez/Tokenflow.git
   cd Tokenflow
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure Firebase (for address collection dashboard)
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Firestore database
   - Update the Firebase configuration in `src/firebase.ts` with your project details

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

### Token Splitting

1. Connect your Sui wallet
2. Enter the total amount of SUI to split
3. Add recipient addresses manually or import from CSV
4. Choose between equal or custom distribution
5. Execute the transaction

### Address Collection

1. Navigate to the dashboard using the "Address Dashboard" button
2. Create a new form with a name
3. Share the generated link with potential recipients
4. Recipients submit their wallet addresses through the form
5. View submissions and export as CSV
6. Use the exported CSV in the token splitting feature

## Development

### Project Structure

```
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── dashboard/      # Address collection components
│   │   │   ├── AirdropDashboard.tsx
│   │   │   ├── SubmissionForm.tsx
│   │   │   └── Dashboard.css
│   │   ├── CSVUploader.tsx # CSV import component
│   │   └── ...
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point with routing
│   ├── firebase.ts        # Firebase configuration
│   └── ...
└── ...
```

### Building for Production

```bash
npm run build
```

## License

MIT

## Contact

For questions or support, please open an issue on GitHub or contact the maintainers.
