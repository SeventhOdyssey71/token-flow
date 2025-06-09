/// TokenFlow Fund Distribution Contract
/// Distributes SUI tokens equally among multiple recipients
module tokenflow::fund_distributor {
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID};
    use sui::event;
    use std::vector;

    /// Error codes
    const EInsufficientFunds: u64 = 1;
    const ENoRecipients: u64 = 2;
    const EInvalidAmount: u64 = 3;
    const ENotOwner: u64 = 4;

    /// Event emitted when funds are distributed
    public struct FundsDistributed has copy, drop {
        event_id: address,
        total_amount: u64,
        recipients_count: u64,
        amount_per_recipient: u64,
        timestamp: u64,
    }

    /// Event emitted for instant distributions
    public struct InstantDistribution has copy, drop {
        distributor: address,
        event_name: vector<u8>,
        total_amount: u64,
        recipients: vector<address>,
        amount_per_recipient: u64,
        timestamp: u64,
        tx_digest: vector<u8>,
    }

    /// Event emitted when a distribution event is created
    public struct DistributionEventCreated has copy, drop {
        event_id: address,
        creator: address,
        name: vector<u8>,
        timestamp: u64,
    }

    /// Distribution event object
    public struct DistributionEvent has key, store {
        id: UID,
        name: vector<u8>,
        creator: address,
        total_deposited: Balance<SUI>,
        recipients: vector<address>,
        is_active: bool,
        created_at: u64,
    }

    /// Create a new distribution event (internal)
    fun create_distribution_event_internal(
        name: vector<u8>,
        ctx: &mut TxContext
    ): DistributionEvent {
        let event_id = object::new(ctx);
        let event_address = object::uid_to_address(&event_id);
        let creator = tx_context::sender(ctx);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);

        // Emit event creation
        event::emit(DistributionEventCreated {
            event_id: event_address,
            creator,
            name,
            timestamp,
        });

        DistributionEvent {
            id: event_id,
            name,
            creator,
            total_deposited: balance::zero(),
            recipients: vector::empty(),
            is_active: true,
            created_at: timestamp,
        }
    }

    /// Create a new distribution event (entry function)
    public entry fun create_distribution_event(
        name: vector<u8>,
        ctx: &mut TxContext
    ) {
        let event = create_distribution_event_internal(name, ctx);
        transfer::transfer(event, tx_context::sender(ctx));
    }

    /// Add funds to the distribution event
    public entry fun add_funds(
        event: &mut DistributionEvent,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(event.is_active, ENotOwner);
        assert!(tx_context::sender(ctx) == event.creator, ENotOwner);
        
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut event.total_deposited, payment_balance);
    }

    /// Add recipients to the distribution event
    public entry fun add_recipients(
        event: &mut DistributionEvent,
        recipients: vector<address>,
        ctx: &TxContext
    ) {
        assert!(event.is_active, ENotOwner);
        assert!(tx_context::sender(ctx) == event.creator, ENotOwner);
        
        let mut i = 0;
        let len = vector::length(&recipients);
        while (i < len) {
            let recipient = *vector::borrow(&recipients, i);
            if (!vector::contains(&event.recipients, &recipient)) {
                vector::push_back(&mut event.recipients, recipient);
            };
            i = i + 1;
        };
    }

    /// Distribute funds equally among all recipients
    public entry fun distribute_funds(
        event: &mut DistributionEvent,
        ctx: &mut TxContext
    ) {
        assert!(event.is_active, ENotOwner);
        assert!(tx_context::sender(ctx) == event.creator, ENotOwner);
        
        let recipients_count = vector::length(&event.recipients);
        assert!(recipients_count > 0, ENoRecipients);

        let total_amount = balance::value(&event.total_deposited);
        assert!(total_amount > 0, EInsufficientFunds);

        let amount_per_recipient = total_amount / recipients_count;
        assert!(amount_per_recipient > 0, EInvalidAmount);

        let event_address = object::uid_to_address(&event.id);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);

        // Distribute to each recipient
        let mut i = 0;
        while (i < recipients_count) {
            let recipient = *vector::borrow(&event.recipients, i);
            let distribution_balance = balance::split(&mut event.total_deposited, amount_per_recipient);
            let distribution_coin = coin::from_balance(distribution_balance, ctx);
            transfer::public_transfer(distribution_coin, recipient);
            i = i + 1;
        };

        // Handle any remaining dust (due to division)
        let remaining = balance::value(&event.total_deposited);
        if (remaining > 0) {
            let dust_balance = balance::split(&mut event.total_deposited, remaining);
            let dust_coin = coin::from_balance(dust_balance, ctx);
            transfer::public_transfer(dust_coin, event.creator);
        };

        // Mark event as inactive
        event.is_active = false;

        // Emit distribution event
        event::emit(FundsDistributed {
            event_id: event_address,
            total_amount,
            recipients_count,
            amount_per_recipient,
            timestamp,
        });
    }

    /// Get event details (view function)
    public fun get_event_details(event: &DistributionEvent): (
        vector<u8>, // name
        address,    // creator
        u64,        // total_deposited
        u64,        // recipients_count
        bool,       // is_active
        u64         // created_at
    ) {
        (
            event.name,
            event.creator,
            balance::value(&event.total_deposited),
            vector::length(&event.recipients),
            event.is_active,
            event.created_at
        )
    }

    /// Get recipients list
    public fun get_recipients(event: &DistributionEvent): vector<address> {
        event.recipients
    }

    /// Create event and distribute funds immediately (all in one transaction)
    public entry fun create_and_distribute(
        name: vector<u8>,
        recipients: vector<address>,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        let recipients_count = vector::length(&recipients);
        assert!(recipients_count > 0, ENoRecipients);
        
        let total_amount = coin::value(&payment);
        assert!(total_amount > 0, EInsufficientFunds);
        
        let amount_per_recipient = total_amount / recipients_count;
        assert!(amount_per_recipient > 0, EInvalidAmount);
        
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        
        // Split coins and distribute
        let mut i = 0;
        while (i < recipients_count - 1) {
            let recipient = *vector::borrow(&recipients, i);
            let split_coin = coin::split(&mut payment, amount_per_recipient, ctx);
            transfer::public_transfer(split_coin, recipient);
            i = i + 1;
        };
        
        // Send remaining balance to the last recipient (handles dust)
        let last_recipient = *vector::borrow(&recipients, recipients_count - 1);
        transfer::public_transfer(payment, last_recipient);
        
        // Emit event for tracking
        event::emit(InstantDistribution {
            distributor: tx_context::sender(ctx),
            event_name: name,
            total_amount,
            recipients,
            amount_per_recipient,
            timestamp,
            tx_digest: vector::empty(), // Will be filled by indexer
        });
    }

    /// Emergency withdraw for creator (only if event is still active)
    public entry fun emergency_withdraw(
        event: &mut DistributionEvent,
        ctx: &mut TxContext
    ) {
        assert!(event.is_active, ENotOwner);
        assert!(tx_context::sender(ctx) == event.creator, ENotOwner);

        let total_balance = balance::withdraw_all(&mut event.total_deposited);
        let withdrawal_coin = coin::from_balance(total_balance, ctx);
        transfer::public_transfer(withdrawal_coin, event.creator);
        
        event.is_active = false;
    }

    /// Delete the distribution event (only if no funds remain)
    public entry fun delete_event(event: DistributionEvent, ctx: &TxContext) {
        assert!(tx_context::sender(ctx) == event.creator, ENotOwner);
        assert!(balance::value(&event.total_deposited) == 0, EInsufficientFunds);
        
        let DistributionEvent {
            id,
            name: _,
            creator: _,
            total_deposited,
            recipients: _,
            is_active: _,
            created_at: _,
        } = event;
        
        object::delete(id);
        balance::destroy_zero(total_deposited);
    }

    #[test_only]
    use sui::test_scenario;
    #[test_only]
    use sui::test_utils;

    #[test]
    public fun test_create_distribution_event() {
        let mut scenario_val = test_scenario::begin(@0x1);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, @0x1);
        {
            create_distribution_event(b"Test Event", test_scenario::ctx(scenario));
        };
        
        test_scenario::next_tx(scenario, @0x1);
        {
            let event = test_scenario::take_from_sender<DistributionEvent>(scenario);
            let (name, creator, total, recipients_count, is_active, _) = get_event_details(&event);
            
            assert!(name == b"Test Event", 0);
            assert!(creator == @0x1, 1);
            assert!(total == 0, 2);
            assert!(recipients_count == 0, 3);
            assert!(is_active == true, 4);
            
            test_scenario::return_to_sender(scenario, event);
        };
        
        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_add_recipients() {
        let mut scenario_val = test_scenario::begin(@0x1);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, @0x1);
        {
            create_distribution_event(b"Test Event", test_scenario::ctx(scenario));
        };
        
        test_scenario::next_tx(scenario, @0x1);
        {
            let mut event = test_scenario::take_from_sender<DistributionEvent>(scenario);
            let ctx = test_scenario::ctx(scenario);
            
            let recipients = vector[@0x2, @0x3, @0x4];
            add_recipients(&mut event, recipients, ctx);
            
            let stored_recipients = get_recipients(&event);
            assert!(vector::length(&stored_recipients) == 3, 0);
            assert!(vector::contains(&stored_recipients, &@0x2), 1);
            assert!(vector::contains(&stored_recipients, &@0x3), 2);
            assert!(vector::contains(&stored_recipients, &@0x4), 3);
            
            test_scenario::return_to_sender(scenario, event);
        };
        
        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_create_and_distribute() {
        let mut scenario_val = test_scenario::begin(@0x1);
        let scenario = &mut scenario_val;
        
        // Mint some test coins
        test_scenario::next_tx(scenario, @0x1);
        {
            let ctx = test_scenario::ctx(scenario);
            let coin = coin::mint_for_testing<SUI>(1000000, ctx);
            transfer::public_transfer(coin, @0x1);
        };
        
        // Test create_and_distribute
        test_scenario::next_tx(scenario, @0x1);
        {
            let coin = test_scenario::take_from_sender<Coin<SUI>>(scenario);
            let recipients = vector[@0x2, @0x3, @0x4];
            
            create_and_distribute(
                b"Quick Distribution",
                recipients,
                coin,
                test_scenario::ctx(scenario)
            );
        };
        
        // Verify recipients received coins
        test_scenario::next_tx(scenario, @0x2);
        {
            let coin = test_scenario::take_from_sender<Coin<SUI>>(scenario);
            assert!(coin::value(&coin) == 333333, 0); // 1000000 / 3
            test_scenario::return_to_sender(scenario, coin);
        };
        
        test_scenario::end(scenario_val);
    }
}