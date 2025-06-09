import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useState } from 'react';
import type { SuiSignAndExecuteTransactionOutput } from '@mysten/wallet-standard';

// Contract configuration
const CONTRACT_CONFIG = {
  PACKAGE_ID: "0xb3aae90f6f074bb83d8b42ad52d6bb12c71fa0696ab8e0d783cb709542c515de", // Latest testnet deployment with events
  MODULE_NAME: 'fund_distributor',
  FUNCTIONS: {
    CREATE_DISTRIBUTION_EVENT: 'create_distribution_event',
    ADD_FUNDS: 'add_funds',
    ADD_RECIPIENTS: 'add_recipients',
    DISTRIBUTE_FUNDS: 'distribute_funds',
    EMERGENCY_WITHDRAW: 'emergency_withdraw',
    CREATE_AND_DISTRIBUTE: 'create_and_distribute',
  }
};

interface CreateEventParams {
  name: string;
  description?: string;
  totalAmount: number;
  recipients: string[];
}

interface CreateEventWithFundsParams {
  name: string;
  totalAmount: number;
  recipients: string[];
}

interface ContractError {
  message: string;
  code?: string;
}

export const useContract = () => {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ContractError | null>(null);

  const createDistributionEvent = async (params: CreateEventParams): Promise<string | null> => {
    if (!account) {
      setError({ message: 'Wallet not connected' });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction = new Transaction();
      
      // Create the distribution event
      const nameBytes = Array.from(new TextEncoder().encode(params.name));
      const [event] = transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_CONFIG.FUNCTIONS.CREATE_DISTRIBUTION_EVENT}`,
        arguments: [
          transaction.pure.vector('u8', nameBytes),
        ],
      });

      // Transfer the event object to the sender
      transaction.transferObjects([event], account.address);

      // Execute the transaction
      return new Promise((resolve, reject) => {
        signAndExecuteTransaction(
          {
            transaction,
          },
          {
            onSuccess: async (result: SuiSignAndExecuteTransactionOutput) => {
              console.log('Event created successfully:', result);
              
              // Wait for transaction to be indexed
              if (result.digest) {
                try {
                  const txDetails = await suiClient.waitForTransaction({
                    digest: result.digest,
                    options: {
                      showEffects: true,
                      showObjectChanges: true,
                    },
                  });
                  
                  // Find the created event object
                  const createdEvent = txDetails.objectChanges?.find(
                    (change) => change.type === 'created' && 
                    change.objectType?.includes('DistributionEvent')
                  );
                  
                  if (createdEvent && 'objectId' in createdEvent) {
                    resolve(createdEvent.objectId);
                  } else {
                    console.error('Could not find created event object');
                    setError({ message: 'Failed to get event ID from transaction' });
                    resolve(null);
                  }
                } catch (error) {
                  console.error('Error waiting for transaction:', error);
                  setError({ message: 'Failed to process transaction' });
                  resolve(null);
                }
              } else {
                setError({ message: 'Transaction digest not found' });
                resolve(null);
              }
            },
            onError: (error) => {
              console.error('Failed to create event:', error);
              setError({ message: error.message || 'Failed to create event' });
              reject(error);
            },
          },
        );
      });
    } catch (error: unknown) {
      console.error('Error creating distribution event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError({ message: errorMessage });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addFundsToEvent = async (eventId: string, amount: number): Promise<boolean> => {
    if (!account) {
      setError({ message: 'Wallet not connected' });
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction = new Transaction();
      
      // Split SUI coins to get the exact amount needed
      const [coin] = transaction.splitCoins(transaction.gas, [amount * 1_000_000_000]); // Convert SUI to MIST
      
      // Add funds to the event
      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_CONFIG.FUNCTIONS.ADD_FUNDS}`,
        arguments: [
          transaction.object(eventId),
          coin,
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecuteTransaction(
          {
            transaction,
          },
          {
            onSuccess: (result) => {
              console.log('Funds added successfully:', result);
              resolve(true);
            },
            onError: (error) => {
              console.error('Failed to add funds:', error);
              setError({ message: error.message || 'Failed to add funds' });
              reject(false);
            },
          },
        );
      });
    } catch (error: unknown) {
      console.error('Error adding funds:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError({ message: errorMessage });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addRecipientsToEvent = async (eventId: string, recipients: string[]): Promise<boolean> => {
    if (!account) {
      setError({ message: 'Wallet not connected' });
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction = new Transaction();
      
      // Add recipients to the event
      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_CONFIG.FUNCTIONS.ADD_RECIPIENTS}`,
        arguments: [
          transaction.object(eventId),
          transaction.pure.vector('address', recipients),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecuteTransaction(
          {
            transaction,
          },
          {
            onSuccess: (result) => {
              console.log('Recipients added successfully:', result);
              resolve(true);
            },
            onError: (error) => {
              console.error('Failed to add recipients:', error);
              setError({ message: error.message || 'Failed to add recipients' });
              reject(false);
            },
          },
        );
      });
    } catch (error: unknown) {
      console.error('Error adding recipients:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError({ message: errorMessage });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const distributeFunds = async (eventId: string): Promise<boolean> => {
    if (!account) {
      setError({ message: 'Wallet not connected' });
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction = new Transaction();
      
      // Distribute funds to all recipients
      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_CONFIG.FUNCTIONS.DISTRIBUTE_FUNDS}`,
        arguments: [
          transaction.object(eventId),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecuteTransaction(
          {
            transaction,
          },
          {
            onSuccess: (result) => {
              console.log('Funds distributed successfully:', result);
              resolve(true);
            },
            onError: (error) => {
              console.error('Failed to distribute funds:', error);
              setError({ message: error.message || 'Failed to distribute funds' });
              reject(false);
            },
          },
        );
      });
    } catch (error: unknown) {
      console.error('Error distributing funds:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError({ message: errorMessage });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const emergencyWithdraw = async (eventId: string): Promise<boolean> => {
    if (!account) {
      setError({ message: 'Wallet not connected' });
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction = new Transaction();
      
      // Emergency withdraw funds
      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_CONFIG.FUNCTIONS.EMERGENCY_WITHDRAW}`,
        arguments: [
          transaction.object(eventId),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecuteTransaction(
          {
            transaction,
          },
          {
            onSuccess: (result) => {
              console.log('Emergency withdrawal successful:', result);
              resolve(true);
            },
            onError: (error) => {
              console.error('Failed to withdraw funds:', error);
              setError({ message: error.message || 'Failed to withdraw funds' });
              reject(false);
            },
          },
        );
      });
    } catch (error: unknown) {
      console.error('Error withdrawing funds:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError({ message: errorMessage });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Utility function to get event details
  const getEventDetails = async (eventId: string) => {
    if (!suiClient) return null;

    try {
      const object = await suiClient.getObject({
        id: eventId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (object.data?.content?.dataType === 'moveObject') {
        const fields = object.data.content.fields as any;
        return {
          id: eventId,
          name: new TextDecoder().decode(new Uint8Array(fields.name)),
          creator: fields.creator,
          totalDeposited: fields.total_deposited,
          recipients: fields.recipients,
          isActive: fields.is_active,
          createdAt: fields.created_at,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching event details:', error);
      return null;
    }
  };

  // Get all events owned by the current user
  const getUserEvents = async () => {
    if (!suiClient || !account) return [];

    try {
      const objects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::DistributionEvent`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      const events = [];
      for (const obj of objects.data) {
        if (obj.data?.objectId) {
          const details = await getEventDetails(obj.data.objectId);
          if (details) {
            events.push(details);
          }
        }
      }

      return events;
    } catch (error) {
      console.error('Error fetching user events:', error);
      return [];
    }
  };

  // Combined function to create event, add funds, and add recipients in one transaction
  const createEventWithFundsAndRecipients = async (params: CreateEventWithFundsParams): Promise<string | null> => {
    if (!account) {
      setError({ message: 'Wallet not connected' });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction = new Transaction();
      
      // Step 1: Create the distribution event
      const nameBytes = Array.from(new TextEncoder().encode(params.name));
      const [event] = transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_CONFIG.FUNCTIONS.CREATE_DISTRIBUTION_EVENT}`,
        arguments: [
          transaction.pure.vector('u8', nameBytes),
        ],
      });

      // Step 2: Split SUI coins for the total amount
      const [coin] = transaction.splitCoins(transaction.gas, [params.totalAmount * 1_000_000_000]); // Convert SUI to MIST
      
      // Step 3: Add funds to the event
      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_CONFIG.FUNCTIONS.ADD_FUNDS}`,
        arguments: [
          event,
          coin,
        ],
      });

      // Step 4: Add recipients to the event
      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_CONFIG.FUNCTIONS.ADD_RECIPIENTS}`,
        arguments: [
          event,
          transaction.pure.vector('address', params.recipients),
        ],
      });

      // Step 5: Transfer the event object to the sender
      transaction.transferObjects([event], account.address);

      // Execute the transaction
      return new Promise((resolve, reject) => {
        signAndExecuteTransaction(
          {
            transaction,
          },
          {
            onSuccess: async (result: SuiSignAndExecuteTransactionOutput) => {
              console.log('Event created with funds and recipients:', result);
              
              // Wait for transaction to be indexed
              if (result.digest) {
                try {
                  const txDetails = await suiClient.waitForTransaction({
                    digest: result.digest,
                    options: {
                      showEffects: true,
                      showObjectChanges: true,
                    },
                  });
                  
                  // Find the created event object
                  const createdEvent = txDetails.objectChanges?.find(
                    (change) => change.type === 'created' && 
                    change.objectType?.includes('DistributionEvent')
                  );
                  
                  if (createdEvent && 'objectId' in createdEvent) {
                    resolve(createdEvent.objectId);
                  } else {
                    console.error('Could not find created event object');
                    setError({ message: 'Failed to get event ID from transaction' });
                    resolve(null);
                  }
                } catch (error) {
                  console.error('Error waiting for transaction:', error);
                  setError({ message: 'Failed to process transaction' });
                  resolve(null);
                }
              } else {
                setError({ message: 'Transaction digest not found' });
                resolve(null);
              }
            },
            onError: (error) => {
              console.error('Failed to create event:', error);
              setError({ message: error.message || 'Failed to create event' });
              reject(error);
            },
          },
        );
      });
    } catch (error: unknown) {
      console.error('Error creating distribution event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError({ message: errorMessage });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Create and distribute funds immediately (uses the new create_and_distribute function)
  const createAndDistribute = async (params: CreateEventWithFundsParams): Promise<boolean> => {
    if (!account) {
      setError({ message: 'Wallet not connected' });
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction = new Transaction();
      
      // Prepare name bytes
      const nameBytes = Array.from(new TextEncoder().encode(params.name));
      
      // Split SUI coins for the total amount
      const [coin] = transaction.splitCoins(transaction.gas, [params.totalAmount * 1_000_000_000]); // Convert SUI to MIST
      
      // Call create_and_distribute to immediately split coins among recipients
      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::${CONTRACT_CONFIG.FUNCTIONS.CREATE_AND_DISTRIBUTE}`,
        arguments: [
          transaction.pure.vector('u8', nameBytes),
          transaction.pure.vector('address', params.recipients),
          coin,
        ],
      });

      // Execute the transaction
      return new Promise((resolve, reject) => {
        signAndExecuteTransaction(
          {
            transaction,
          },
          {
            onSuccess: async (result: SuiSignAndExecuteTransactionOutput) => {
              console.log('Funds distributed successfully:', result);
              resolve(true);
            },
            onError: (error) => {
              console.error('Failed to distribute funds:', error);
              setError({ message: error.message || 'Failed to distribute funds' });
              reject(false);
            },
          },
        );
      });
    } catch (error: unknown) {
      console.error('Error distributing funds:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError({ message: errorMessage });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Get distribution history from events
  const getDistributionHistory = async (userAddress?: string) => {
    if (!suiClient) return [];

    try {
      // Query events from the package
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::InstantDistribution`
        },
        limit: 50,
        order: 'descending'
      });

      // Filter by user if address provided
      const distributions = events.data
        .map((event: any) => {
          const parsedEvent = event.parsedJson as any;
          return {
            id: event.id.txDigest,
            distributor: parsedEvent.distributor,
            eventName: new TextDecoder().decode(new Uint8Array(parsedEvent.event_name)),
            totalAmount: parseInt(parsedEvent.total_amount) / 1_000_000_000, // Convert from MIST to SUI
            recipients: parsedEvent.recipients,
            amountPerRecipient: parseInt(parsedEvent.amount_per_recipient) / 1_000_000_000,
            timestamp: new Date(parseInt(parsedEvent.timestamp)),
            txDigest: event.id.txDigest,
          };
        })
        .filter((dist: any) => !userAddress || dist.distributor === userAddress);

      return distributions;
    } catch (error) {
      console.error('Error fetching distribution history:', error);
      return [];
    }
  };

  // Get statistics from events
  const getDistributionStats = async (userAddress?: string) => {
    const distributions = await getDistributionHistory(userAddress);
    
    const totalSuiDonated = distributions.reduce((sum, dist) => sum + dist.totalAmount, 0);
    const uniqueWallets = new Set(distributions.flatMap(dist => dist.recipients)).size;
    const totalDistributions = distributions.length;

    return {
      totalSuiDonated,
      uniqueWallets,
      totalDistributions,
      distributions
    };
  };

  return {
    createDistributionEvent,
    createEventWithFundsAndRecipients,
    createAndDistribute,
    addFundsToEvent,
    addRecipientsToEvent,
    distributeFunds,
    emergencyWithdraw,
    getEventDetails,
    getUserEvents,
    getDistributionHistory,
    getDistributionStats,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};