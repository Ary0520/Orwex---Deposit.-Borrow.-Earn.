// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {LendingProtocol} from "../src/LendingProtocol.sol";

contract Deploy is Script {

    function run() external {

        address collateral = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9;      // WETH
        address borrow = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;          // USDC
        address collateralFeed = 0x694AA1769357215DE4FAC081bf1f309aDC325306;  // ETH/USD
        address borrowFeed = 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E;     

        
        vm.startBroadcast();

        new LendingProtocol(
            collateral,
            borrow,
            collateralFeed,
            borrowFeed
        );

        vm.stopBroadcast();
    }
}
