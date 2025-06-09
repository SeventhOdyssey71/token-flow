# TokenFlow Deployment Guide

## Contract Deployment

### Prerequisites
- Sui CLI installed
- Sui wallet with test tokens (for testnet) or mainnet SUI

### Steps to Deploy

1. **Navigate to the contracts directory:**
   ```bash
   cd contracts
   ```

2. **Build the contract:**
   ```bash
   sui move build
   ```

3. **Deploy to testnet:**
   ```bash
   sui client publish --gas-budget 100000000
   ```

4. **Save the package ID from the deployment output:**
   The deployment will return a package ID that looks like:
   ```
   Published Objects:
   - Package ID: 0x1234567890abcdef...
   ```

5. **Update the frontend configuration:**
   Open `src/hooks/useContract.ts` and update the `CONTRACT_CONFIG`:
   ```typescript
   const CONTRACT_CONFIG = {
     PACKAGE_ID: "0xc6411424f875636bb79c402447cc3c68b8dddf0ba9feb97f7e2abdb03ca78bc5", // <-- Testnet deployment
     MODULE_NAME: 'fund_distributor',
     // ... rest of config
   };
   ```
   
   **Current Testnet Deployment:**
   - Package ID: `0x779a4e9f519b37747e48e2183fce63ad79f679910fa29582ef56f313709008c4`
   - Network: Sui Testnet
   - Deploy Date: June 9, 2025
   - Features: Instant token distribution with `create_and_distribute` function

## Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## User Flow

1. **Connect Wallet**: Users connect their Sui wallet on the landing page
2. **Create Event**: Click "Create Event" button to set up a new distribution event
   - Enter event name
   - Specify total SUI amount to distribute
   - Upload CSV or manually add recipient addresses
3. **Sign Transaction**: The app will create the event, add funds, and add recipients in a single transaction
4. **Distribute Funds**: From the dashboard, click "Distribute Funds" on active events to send tokens to recipients
5. **View History**: All events and their status are displayed on the dashboard

## Contract Functions

- `create_distribution_event`: Creates a new distribution event
- `add_funds`: Adds SUI tokens to an event
- `add_recipients`: Adds recipient addresses to an event
- `distribute_funds`: Distributes funds equally among all recipients
- `emergency_withdraw`: Allows event creator to withdraw funds before distribution
- `get_event_details`: View function to get event information

## Security Notes

- Only the event creator can add funds, add recipients, and distribute funds
- Events become inactive after distribution
- Emergency withdrawal is only available while the event is active
- All recipient addresses are validated as valid Sui addresses

## Testing

Run the Move tests:
```bash
cd contracts
sui move test
```