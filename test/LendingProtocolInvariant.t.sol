// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";

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
// Mock Oracle
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
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (0, price, 0, block.timestamp, 0);
    }

    function description() external pure returns (string memory) { return ""; }
    function version() external pure returns (uint256) { return 0; }
    function getRoundData(uint80)
        external pure
        returns (uint80,int256,uint256,uint256,uint80)
    { revert(); }
}

///////////////////////////////////////////////////////////
// Handler (Random Actor)
///////////////////////////////////////////////////////////
contract Handler is Test{

    LendingProtocol protocol;
    MockERC20 collateral;
    MockERC20 borrow;

    address actor;

    constructor(
        LendingProtocol _protocol,
        MockERC20 _collateral,
        MockERC20 _borrow
    ) {
        protocol = _protocol;
        collateral = _collateral;
        borrow = _borrow;

        actor = address(this);

        collateral.approve(address(protocol), type(uint256).max);
        borrow.approve(address(protocol), type(uint256).max);
    }

    function deposit(uint256 amount) public {
        amount = bound(amount, 1e16, 5e18);

        collateral.mint(actor, amount);
        protocol.depositCollateral(amount);
    }

    function borrowFunds(uint256 amount) public {
        amount = bound(amount, 1e16, 1000e18);

        try protocol.borrow(amount) {} catch {}
    }

    function repayFunds(uint256 amount) public {
        amount = bound(amount, 1e16, 1000e18);

        borrow.mint(actor, amount);
        try protocol.repay(amount) {} catch {}
    }
}

///////////////////////////////////////////////////////////
// INVARIANT TEST
///////////////////////////////////////////////////////////
contract LendingProtocolInvariant is StdInvariant, Test {

    LendingProtocol protocol;
    Handler handler;

    MockERC20 collateral;
    MockERC20 borrow;

    MockPriceFeed collateralFeed;
    MockPriceFeed borrowFeed;

    function setUp() public {

        collateral = new MockERC20("WETH","WETH");
        borrow = new MockERC20("USDC","USDC");

        collateralFeed = new MockPriceFeed(2000e8);
        borrowFeed = new MockPriceFeed(1e8);

        protocol = new LendingProtocol(
            address(collateral),
            address(borrow),
            address(collateralFeed),
            address(borrowFeed)
        );

        borrow.mint(address(protocol), 1_000_000e18);

        handler = new Handler(protocol, collateral, borrow);

        targetContract(address(handler));
    }

//////////////////////////////////////////////////////
// INVARIANT: Protocol Never Insolvent
//////////////////////////////////////////////////////
function invariant_protocolSolvent() public {

    uint256 debt =
        protocol.totalBorrowed();

    uint256 liquidity =
        borrow.balanceOf(address(protocol));

    assertLe(debt, liquidity);
}


}
