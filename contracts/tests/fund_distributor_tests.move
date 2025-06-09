#[test_only]
module tokenflow::fund_distributor_tests {
    use tokenflow::fund_distributor;
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::test_scenario::{Self, Scenario};
    use sui::transfer;
    use std::vector;

    const ADMIN: address = @0x1;
    const RECIPIENT1: address = @0x2;
    const RECIPIENT2: address = @0x3;
    const RECIPIENT3: address = @0x4;

    #[test]
    public fun test_full_distribution_flow() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Create distribution event
        test_scenario::next_tx(scenario, ADMIN);
        {
            fund_distributor::create_distribution_event(b"Test Distribution", test_scenario::ctx(scenario));
        };

        // Add recipients
        test_scenario::next_tx(scenario, ADMIN);
        {
            let mut event = test_scenario::take_from_sender<tokenflow::fund_distributor::DistributionEvent>(scenario);
            let ctx = test_scenario::ctx(scenario);
            
            let recipients = vector[RECIPIENT1, RECIPIENT2, RECIPIENT3];
            fund_distributor::add_recipients(&mut event, recipients, ctx);
            
            test_scenario::return_to_sender(scenario, event);
        };

        // Add funds
        test_scenario::next_tx(scenario, ADMIN);
        {
            let mut event = test_scenario::take_from_sender<tokenflow::fund_distributor::DistributionEvent>(scenario);
            let ctx = test_scenario::ctx(scenario);
            
            // Create a coin with 300 SUI (will distribute 100 each)
            let payment = coin::mint_for_testing<SUI>(300_000_000_000, ctx); // 300 SUI in MIST
            fund_distributor::add_funds(&mut event, payment, ctx);
            
            let (_, _, total_deposited, recipients_count, is_active, _) = fund_distributor::get_event_details(&event);
            assert!(total_deposited == 300_000_000_000, 0);
            assert!(recipients_count == 3, 1);
            assert!(is_active == true, 2);
            
            test_scenario::return_to_sender(scenario, event);
        };

        // Distribute funds
        test_scenario::next_tx(scenario, ADMIN);
        {
            let mut event = test_scenario::take_from_sender<tokenflow::fund_distributor::DistributionEvent>(scenario);
            let ctx = test_scenario::ctx(scenario);
            
            fund_distributor::distribute_funds(&mut event, ctx);
            
            let (_, _, total_deposited, _, is_active, _) = fund_distributor::get_event_details(&event);
            assert!(total_deposited == 0, 0);
            assert!(is_active == false, 1);
            
            test_scenario::return_to_sender(scenario, event);
        };

        // Verify recipients received funds
        test_scenario::next_tx(scenario, RECIPIENT1);
        {
            let coin = test_scenario::take_from_sender<Coin<SUI>>(scenario);
            assert!(coin::value(&coin) == 100_000_000_000, 0); // 100 SUI in MIST
            test_scenario::return_to_sender(scenario, coin);
        };

        test_scenario::next_tx(scenario, RECIPIENT2);
        {
            let coin = test_scenario::take_from_sender<Coin<SUI>>(scenario);
            assert!(coin::value(&coin) == 100_000_000_000, 0); // 100 SUI in MIST
            test_scenario::return_to_sender(scenario, coin);
        };

        test_scenario::next_tx(scenario, RECIPIENT3);
        {
            let coin = test_scenario::take_from_sender<Coin<SUI>>(scenario);
            assert!(coin::value(&coin) == 100_000_000_000, 0); // 100 SUI in MIST
            test_scenario::return_to_sender(scenario, coin);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_emergency_withdraw() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Create distribution event
        test_scenario::next_tx(scenario, ADMIN);
        {
            fund_distributor::create_distribution_event(b"Emergency Test", test_scenario::ctx(scenario));
        };
        
        // Add funds
        test_scenario::next_tx(scenario, ADMIN);
        {
            let mut event = test_scenario::take_from_sender<tokenflow::fund_distributor::DistributionEvent>(scenario);
            let ctx = test_scenario::ctx(scenario);
            let payment = coin::mint_for_testing<SUI>(1000_000_000_000, ctx); // 1000 SUI
            fund_distributor::add_funds(&mut event, payment, ctx);
            test_scenario::return_to_sender(scenario, event);
        };

        // Emergency withdraw
        test_scenario::next_tx(scenario, ADMIN);
        {
            let mut event = test_scenario::take_from_sender<tokenflow::fund_distributor::DistributionEvent>(scenario);
            let ctx = test_scenario::ctx(scenario);
            
            fund_distributor::emergency_withdraw(&mut event, ctx);
            
            let (_, _, total_deposited, _, is_active, _) = fund_distributor::get_event_details(&event);
            assert!(total_deposited == 0, 0);
            assert!(is_active == false, 1);
            
            test_scenario::return_to_sender(scenario, event);
        };

        // Verify admin received the withdrawn funds
        test_scenario::next_tx(scenario, ADMIN);
        {
            let coin = test_scenario::take_from_sender<Coin<SUI>>(scenario);
            assert!(coin::value(&coin) == 1000_000_000_000, 0); // 1000 SUI
            test_scenario::return_to_sender(scenario, coin);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = fund_distributor::ENoRecipients)]
    public fun test_distribute_without_recipients() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        test_scenario::next_tx(scenario, ADMIN);
        {
            fund_distributor::create_distribution_event(b"No Recipients Test", test_scenario::ctx(scenario));
        };
        
        test_scenario::next_tx(scenario, ADMIN);
        {
            let mut event = test_scenario::take_from_sender<tokenflow::fund_distributor::DistributionEvent>(scenario);
            let ctx = test_scenario::ctx(scenario);
            let payment = coin::mint_for_testing<SUI>(100_000_000_000, ctx);
            fund_distributor::add_funds(&mut event, payment, ctx);
            
            // Try to distribute without recipients - should fail
            fund_distributor::distribute_funds(&mut event, ctx);
            
            test_scenario::return_to_sender(scenario, event);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = fund_distributor::EInsufficientFunds)]
    public fun test_distribute_without_funds() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        test_scenario::next_tx(scenario, ADMIN);
        {
            fund_distributor::create_distribution_event(b"No Funds Test", test_scenario::ctx(scenario));
        };
        
        test_scenario::next_tx(scenario, ADMIN);
        {
            let mut event = test_scenario::take_from_sender<tokenflow::fund_distributor::DistributionEvent>(scenario);
            let ctx = test_scenario::ctx(scenario);
            
            let recipients = vector[RECIPIENT1, RECIPIENT2];
            fund_distributor::add_recipients(&mut event, recipients, ctx);
            
            // Try to distribute without funds - should fail
            fund_distributor::distribute_funds(&mut event, ctx);
            
            test_scenario::return_to_sender(scenario, event);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_duplicate_recipients() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        test_scenario::next_tx(scenario, ADMIN);
        {
            fund_distributor::create_distribution_event(b"Duplicate Test", test_scenario::ctx(scenario));
        };
        
        test_scenario::next_tx(scenario, ADMIN);
        {
            let mut event = test_scenario::take_from_sender<tokenflow::fund_distributor::DistributionEvent>(scenario);
            let ctx = test_scenario::ctx(scenario);
            
            // Add recipients with duplicates
            let recipients1 = vector[RECIPIENT1, RECIPIENT2];
            let recipients2 = vector[RECIPIENT2, RECIPIENT3]; // RECIPIENT2 is duplicate
            
            fund_distributor::add_recipients(&mut event, recipients1, ctx);
            fund_distributor::add_recipients(&mut event, recipients2, ctx);
            
            let stored_recipients = fund_distributor::get_recipients(&event);
            assert!(vector::length(&stored_recipients) == 3, 0); // Should be 3, not 4
            
            test_scenario::return_to_sender(scenario, event);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_fractional_distribution() {
        let mut scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        // Test with amount that doesn't divide evenly
        test_scenario::next_tx(scenario, ADMIN);
        {
            fund_distributor::create_distribution_event(b"Fractional Test", test_scenario::ctx(scenario));
        };
        
        test_scenario::next_tx(scenario, ADMIN);
        {
            let mut event = test_scenario::take_from_sender<tokenflow::fund_distributor::DistributionEvent>(scenario);
            let ctx = test_scenario::ctx(scenario);
            
            let recipients = vector[RECIPIENT1, RECIPIENT2, RECIPIENT3];
            fund_distributor::add_recipients(&mut event, recipients, ctx);
            
            // 100 SUI divided by 3 = 33.333... SUI each, with 1 MIST remainder
            let payment = coin::mint_for_testing<SUI>(100_000_000_000, ctx); // 100 SUI in MIST
            fund_distributor::add_funds(&mut event, payment, ctx);
            
            fund_distributor::distribute_funds(&mut event, ctx);
            
            test_scenario::return_to_sender(scenario, event);
        };

        // Each recipient should get 33_333_333_333 MIST (33.333... SUI)
        test_scenario::next_tx(scenario, RECIPIENT1);
        {
            let coin = test_scenario::take_from_sender<Coin<SUI>>(scenario);
            assert!(coin::value(&coin) == 33_333_333_333, 0);
            test_scenario::return_to_sender(scenario, coin);
        };

        // Admin should receive the dust (1 MIST remainder)
        test_scenario::next_tx(scenario, ADMIN);
        {
            let coin = test_scenario::take_from_sender<Coin<SUI>>(scenario);
            assert!(coin::value(&coin) == 1, 0); // 1 MIST dust
            test_scenario::return_to_sender(scenario, coin);
        };

        test_scenario::end(scenario_val);
    }
}