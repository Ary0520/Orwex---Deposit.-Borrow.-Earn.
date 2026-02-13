// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import {LendingProtocol} from "../src/LendingProtocol.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

///////////////////////////////////////////////////////////
// Mock ERC20
///////////////////////////////////////////////////////////
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

///////////////////////////////////////////////////////////
// Mock Chainlink Price Feed
///////////////////////////////////////////////////////////
contract MockPriceFeed is AggregatorV3Interface {
    int256 public price;
    uint8 public override decimals = 8;

    constructor(int256 _price) {
        price = _price;
    }

    function setPrice(int256 _price) external {
        price = _price;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80,
            int256,
            uint256,
            uint256,
            uint80
        )
    {
        return (
            0,
            price,
            0,
            block.timestamp,
            0
        );
    }

    // unused but required
    function description() external pure returns (string memory) {
        return "";
    }

    function version() external pure returns (uint256) {
        return 0;
    }

    function getRoundData(uint80)
        external
        pure
        returns (uint80, int256, uint256, uint256, uint80)
    {
        revert();
    }
}

///////////////////////////////////////////////////////////
// TEST CONTRACT
///////////////////////////////////////////////////////////
contract LendingProtocolTest is Test {

    LendingProtocol protocol;

    MockERC20 collateral;
    MockERC20 borrow;

    MockPriceFeed collateralFeed;
    MockPriceFeed borrowFeed;

    address user = address(1);

    ///////////////////////////////////////////////////////
    // SETUP
    ///////////////////////////////////////////////////////
    function setUp() public {

        collateral = new MockERC20("WETH","WETH");
        borrow = new MockERC20("USDC","USDC");

        // price = $2000 (8 decimals)
        collateralFeed = new MockPriceFeed(2000e8);
        borrowFeed = new MockPriceFeed(1e8);

        protocol = new LendingProtocol(
            address(collateral),
            address(borrow),
            address(collateralFeed),
            address(borrowFeed)
        );

        // give protocol liquidity
        borrow.mint(address(protocol), 1_000_000e18);

        // give user collateral
        collateral.mint(user, 10e18);

        vm.startPrank(user);
        collateral.approve(address(protocol), type(uint256).max);
        vm.stopPrank();
    }

    ///////////////////////////////////////////////////////
    // TEST: Deposit
    ///////////////////////////////////////////////////////
    function testDepositCollateral() public {

        vm.startPrank(user);

        protocol.depositCollateral(5e18);

        vm.stopPrank();

        uint256 stored =
            protocol.userToCollateralDeposited(user);

        assertEq(stored, 5e18);
    }

    ///////////////////////////////////////////////////////
// TEST: Borrow
///////////////////////////////////////////////////////
function testBorrowAgainstCollateral() public {

    vm.startPrank(user);

    // Deposit 5 ETH collateral
    protocol.depositCollateral(5e18);

    // Borrow 1000 tokens
    protocol.borrow(1000e18);

    vm.stopPrank();

    uint256 debt =
        protocol.userToAmountBorrowed(user);

    assertEq(debt, 1000e18);

    uint256 balance =
        borrow.balanceOf(user);

    assertEq(balance, 1000e18);
}

///////////////////////////////////////////////////////
// TEST: Borrow Reverts When Over Limit
///////////////////////////////////////////////////////
function testCannotOverBorrow() public {

    vm.startPrank(user);

    // Deposit small collateral
    protocol.depositCollateral(1e18);

    // Try borrowing absurd amount
    vm.expectRevert();

    protocol.borrow(1_000_000e18);

    vm.stopPrank();
}

///////////////////////////////////////////////////////
// TEST: Repay Debt
///////////////////////////////////////////////////////
function testRepayDebt() public {

    vm.startPrank(user);

    // Deposit collateral
    protocol.depositCollateral(5e18);

    // Borrow
    protocol.borrow(1000e18);

    // Approve repayment
    borrow.approve(address(protocol), type(uint256).max);

    // Repay half
    protocol.repay(500e18);

    vm.stopPrank();

    uint256 remainingDebt =
        protocol.userToAmountBorrowed(user);

    assertEq(remainingDebt, 500e18);
}

///////////////////////////////////////////////////////
// TEST: Over Repay Clears Debt (Clamp)
///////////////////////////////////////////////////////
function testOverRepayClampsCorrectly() public {

    vm.startPrank(user);

    protocol.depositCollateral(5e18);
    protocol.borrow(1000e18);

    borrow.approve(address(protocol), type(uint256).max);

    // Repay more than owed
    protocol.repay(5000e18);

    vm.stopPrank();

    uint256 remaining =
        protocol.userToAmountBorrowed(user);

    assertEq(remaining, 0);
}

///////////////////////////////////////////////////////
// TEST: Interest Accrues Over Time(time travel type shit)
///////////////////////////////////////////////////////
function testInterestAccruesOverTime() public {

    vm.startPrank(user);

    protocol.depositCollateral(5e18);
    protocol.borrow(1000e18);

    vm.stopPrank();

    uint256 initialDebt =
        protocol.userToAmountBorrowed(user);

    // Move forward 1 year
    vm.warp(block.timestamp + 365 days);

    vm.startPrank(user);

    // Approve small repayment to trigger accrual
    borrow.approve(address(protocol), type(uint256).max);

    protocol.repay(1); // trigger accrual

    vm.stopPrank();

    uint256 newDebt =
        protocol.userToAmountBorrowed(user);

    assertGt(newDebt, initialDebt);
}

///////////////////////////////////////////////////////
// TEST: Cannot Withdraw If It Breaks Health Factor
///////////////////////////////////////////////////////
function testWithdrawRevertsIfUnsafe() public {

    vm.startPrank(user);

    protocol.depositCollateral(5e18);

    // Borrow close to limit
    protocol.borrow(3000e18);

    // Attempt unsafe withdraw
    vm.expectRevert();
    protocol.withdrawCollateral(4e18);

    vm.stopPrank();
}

///////////////////////////////////////////////////////
// TEST: Liquidation Works When Undercollateralized
///////////////////////////////////////////////////////
function testLiquidationFlow() public {

    address liquidator = address(2);

    // Give liquidator tokens to repay debt
    borrow.mint(liquidator, 5000e18);

    vm.startPrank(user);

    protocol.depositCollateral(5e18);
    protocol.borrow(3000e18);

    vm.stopPrank();

    // Crash collateral price (simulate market drop)
    collateralFeed.setPrice(500e8);

    // Liquidator approves protocol
    vm.startPrank(liquidator);
    borrow.approve(address(protocol), type(uint256).max);

    uint256 collateralBefore =
        collateral.balanceOf(liquidator);

    protocol.liquidate(user, 1000e18);

    vm.stopPrank();

    uint256 collateralAfter =
        collateral.balanceOf(liquidator);

    assertGt(collateralAfter, collateralBefore);

    uint256 remainingDebt =
        protocol.userToAmountBorrowed(user);

    assertLt(remainingDebt, 3000e18);
}


}
