# TokenFlow Smart Contracts

This directory contains the Sui Move smart contracts for TokenFlow, a platform for distributing SUI tokens equally among multiple recipients.

## Contract Overview

### `fund_distributor.move`
The main contract that handles:
- Creating distribution events
- Adding funds to events
- Managing recipients
- Distributing funds equally among all recipients
- Emergency withdrawal functionality

## Features

- **Equal Distribution**: Automatically distributes SUI tokens equally among all recipients
- **Event Management**: Create and manage multiple distribution events
- **Recipient Management**: Add recipients to distribution events with duplicate prevention
- **Emergency Controls**: Event creators can withdraw funds if needed
- **Dust Handling**: Any remainder from division is returned to the event creator

## Contract Functions

### Public Functions

1. **`create_distribution_event`**: Creates a new distribution event
2. **`add_funds`**: Adds SUI tokens to a distribution event
3. **`add_recipients`**: Adds recipient addresses to an event
4. **`distribute_funds`**: Distributes funds equally among all recipients
5. **`emergency_withdraw`**: Allows event creator to withdraw all funds
6. **`get_event_details`**: View function to get event information
7. **`get_recipients`**: View function to get recipient list

### Events Emitted

- **`DistributionEventCreated`**: When a new event is created
- **`FundsDistributed`**: When funds are distributed to recipients

## Testing

Run the test suite:

```bash
cd contracts
sui move test
```

The test suite includes:
- Full distribution flow testing
- Emergency withdrawal scenarios
- Error condition testing (no recipients, insufficient funds)
- Duplicate recipient handling
- Fractional distribution with dust handling

## Deployment

To deploy the contract to Sui network:

1. **Build the contract**:
   ```bash
   sui move build
   ```

2. **Deploy to testnet**:
   ```bash
   sui client publish --gas-budget 100000000
   ```

3. **Deploy to mainnet** (when ready):
   ```bash
   sui client publish --gas-budget 100000000
   ```

4. **Update frontend configuration**:
   After deployment, update the `PACKAGE_ID` in `src/hooks/useContract.ts` with the deployed package ID.

## Security Considerations

- Only event creators can add funds and recipients
- Only event creators can initiate distribution or emergency withdrawal
- Events become inactive after distribution or emergency withdrawal
- Duplicate recipients are automatically filtered out
- All transactions require proper authentication

## Gas Estimation

Typical gas costs (approximate):
- Create event: ~1,000,000 MIST
- Add recipients (10 addresses): ~500,000 MIST
- Add funds: ~300,000 MIST
- Distribute funds (to 10 recipients): ~2,000,000 MIST

## Integration

The frontend integrates with these contracts through the `useContract` hook in `src/hooks/useContract.ts`. This hook provides:

- `createDistributionEvent()`: Creates a new event
- `addFundsToEvent()`: Adds SUI to an event
- `addRecipientsToEvent()`: Adds recipient addresses
- `distributeFunds()`: Distributes funds to all recipients
- `emergencyWithdraw()`: Emergency withdrawal function

## Example Usage

```typescript
const { createDistributionEvent, addFundsToEvent, addRecipientsToEvent, distributeFunds } = useContract();

// 1. Create event
const eventId = await createDistributionEvent({
  name: "Community Airdrop",
  totalAmount: 100, // SUI
  recipients: ["0x123...", "0x456..."]
});

// 2. Add funds
await addFundsToEvent(eventId, 100);

// 3. Add recipients
await addRecipientsToEvent(eventId, ["0x123...", "0x456..."]);

// 4. Distribute funds
await distributeFunds(eventId);
```

## Error Codes

- `EInsufficientFunds`: Not enough funds in the event
- `ENoRecipients`: No recipients added to the event
- `EInvalidAmount`: Invalid amount specified
- `ENotOwner`: Only event creator can perform this action

## Future Enhancements

Potential improvements for future versions:
- Support for custom token types (not just SUI)
- Weighted distribution (different amounts per recipient)
- Time-locked distributions
- Multi-signature support for event management
- Batch operations for large recipient lists