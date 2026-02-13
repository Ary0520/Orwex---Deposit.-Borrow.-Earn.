// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";


contract LendingProtocol is ReentrancyGuard{
    //errors->
    error LENDINGPROTOCOL__valueMustBeMoreThanZero();
    error LENDINGPROTOCOL__amountMoreThanAllowed();
    error LENDINGPROTOCOL__oracleError();
    error LENDINGPROTOCOL__userHasZeroCollateral();
    error LENDINGPROTOCOL__insufficientLiquidity();
    error LENDINGPROTOCOL__userHasNoDebt();
    error LENDINGPROTOCOL__cantWithdrawMoreThanDeposited();

    event userAddedCollateral(address indexed user, uint256 collateralAmount);
    event userBorrowedToken(address indexed user, uint256 borrowAmount);
    event userRepaidDebt(address indexed user, uint256 repaidAmount);

    mapping(address user => uint256 collateralDeposited) public userToCollateralDeposited;
    mapping(address user => uint256 amountBorrowed) public userToAmountBorrowed;
    mapping(address => uint256) public lastAccrued;

    IERC20 public collateralToken;
    IERC20 public borrowToken;

    AggregatorV3Interface public priceFeed;
    AggregatorV3Interface public borrowPriceFeed;

    //Risk Parameters->

    //users can borrow upto 80% of their collateral value
    uint256 public constant LIQUIDATION_THRESHOLD = 80;
    uint256 public constant PRECISION = 1e18;
    uint256 public constant LIQUIDATION_BONUS = 10; // 10%
    // uint256 public constant MAX_PRICE_AGE = 1 hours;
    uint256 public constant MAX_PRICE_AGE = 7 days; // Instead of 1 hours
    uint256 public totalBorrowed; //total borrowed from the protocol
    
    // Seconds in one year (used for APR → per-second rate)
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // 10% APR scaled by PRECISION
    uint256 public constant BORROW_RATE_PER_SECOND = (10 * PRECISION) / 100 / SECONDS_PER_YEAR;


    constructor(address _collateralToken, address _borrowToken, address _priceFeed, address _borrowPriceFeed){
        collateralToken = IERC20(_collateralToken);
        borrowToken = IERC20(_borrowToken);
        priceFeed = AggregatorV3Interface(_priceFeed);
        borrowPriceFeed = AggregatorV3Interface(_borrowPriceFeed);
    }

    //functions->

    ///////////////////////
    //DEPOSIT COLLATERAL///
    ///////////////////////
    function depositCollateral(uint256 amount) external{
        if(amount == 0){
            revert LENDINGPROTOCOL__valueMustBeMoreThanZero();
        }
        bool success = collateralToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer Failed!");

        userToCollateralDeposited[msg.sender] += amount;
        emit userAddedCollateral(msg.sender, amount);
    }

    ///////////////////////////////
    //ORACLE STALENESS PROTECTION//
    ///////////////////////////////

    function _getSafePrice(AggregatorV3Interface feed) internal view returns(uint256 price, uint8 decimals){
        (, int256 answer, , uint256 updatedAt, ) = feed.latestRoundData();

        if(answer <= 0){
            revert LENDINGPROTOCOL__oracleError();
        }
        if(block.timestamp - updatedAt > MAX_PRICE_AGE){
            revert LENDINGPROTOCOL__oracleError();
        }

        return (uint256(answer), feed.decimals());
    }

    ////////////////////
    //BORROW FUNCTION///
    ////////////////////
    function borrow(uint256 amount) external nonReentrant{

    _accrueInterest(msg.sender);

    uint256 collateral = userToCollateralDeposited[msg.sender];
    uint256 existingDebt = userToAmountBorrowed[msg.sender]; // they may already be in debt

    if(amount == 0){
        revert LENDINGPROTOCOL__valueMustBeMoreThanZero();
    }
    if(collateral == 0){
        revert LENDINGPROTOCOL__userHasZeroCollateral();
    }

    // Normalize token amounts using token decimals
    uint8 collateralDecimals = IERC20Metadata(address(collateralToken)).decimals();
    uint8 borrowDecimals = IERC20Metadata(address(borrowToken)).decimals();

    uint256 normalizedCollateral =
        collateral * PRECISION / (10 ** collateralDecimals);

    uint256 normalizedAmount =
        amount * PRECISION / (10 ** borrowDecimals);

    uint256 normalizedExistingDebt =
        existingDebt * PRECISION / (10 ** borrowDecimals);

    // ===== Collateral Price =====
    (uint256 price, uint8 oracleDecimals) = _getSafePrice(priceFeed);

    uint256 collateralValueInUsd =
        (normalizedCollateral * price) / (10 ** oracleDecimals);

    // ===== Borrow Token Price =====
    (uint256 borrowPrice, uint8 oracleDecimals2) = _getSafePrice(borrowPriceFeed);

    uint256 newBorrowUsd =
        (normalizedAmount * borrowPrice) / (10 ** oracleDecimals2);

    uint256 existingDebtUsd =
        (normalizedExistingDebt * borrowPrice) / (10 ** oracleDecimals2);

    // ===== Health Factor Enforcement =====

    uint256 simulatedDebtUsd = existingDebtUsd + newBorrowUsd;

    uint256 adjustedCollateral =
        collateralValueInUsd * LIQUIDATION_THRESHOLD / 100;

    uint256 healthFactor =
        (adjustedCollateral * PRECISION) / simulatedDebtUsd;

    if(healthFactor < PRECISION){
        revert LENDINGPROTOCOL__amountMoreThanAllowed();
    }

    // ===== Liquidity Check =====
    uint256 protocolBalance = borrowToken.balanceOf(address(this));
    if(protocolBalance < amount){
        revert LENDINGPROTOCOL__insufficientLiquidity();
    }

    // ===== Transfer =====
    bool success = borrowToken.transfer(msg.sender, amount);
    require(success, "Transfer Failed!");

    userToAmountBorrowed[msg.sender] += amount;
    totalBorrowed += amount;
    emit userBorrowedToken(msg.sender, amount);
    }



    ///////////////////
    //repay function///
    //////////////////
    function repay(uint256 amount) external nonReentrant{
        _accrueInterest(msg.sender);

        if(amount == 0){
            revert LENDINGPROTOCOL__valueMustBeMoreThanZero();
        }
        uint256 userDebt = userToAmountBorrowed[msg.sender];
        if(userDebt == 0){
            revert LENDINGPROTOCOL__userHasNoDebt();
        }
        uint256 repayAmount = Math.min(amount, userDebt);

        bool success = borrowToken.transferFrom(msg.sender, address(this), repayAmount);
        require(success, "Transaction Failed");
        userToAmountBorrowed[msg.sender] -= repayAmount;
        totalBorrowed -= repayAmount;

        emit userRepaidDebt(msg.sender, repayAmount);
    }

    //////////////////////
    //GET HEALTH FACTOR///
    //////////////////////

    function getHealthFactor(address user) public view returns (uint256) {
    uint256 collateral = userToCollateralDeposited[user];
    uint256 debt = userToAmountBorrowed[user];

    // No debt = infinitely safe
    if (debt == 0) {
        return type(uint256).max;
    }

    // ===== Normalize token amounts =====
    uint8 collateralDecimals = IERC20Metadata(address(collateralToken)).decimals();
    uint8 borrowDecimals = IERC20Metadata(address(borrowToken)).decimals();

    uint256 normalizedCollateral =
        collateral * PRECISION / (10 ** collateralDecimals);

    uint256 normalizedDebt =
        debt * PRECISION / (10 ** borrowDecimals);

    // ===== Fetch collateral price =====
    (uint256 colPrice, uint8 colOracleDecimals) = _getSafePrice(priceFeed);

    // ===== Fetch borrow price =====
    (uint256 debtPrice, uint8 debtOracleDecimals) = _getSafePrice(borrowPriceFeed);

    // ===== Convert to USD values =====
    uint256 collateralUsd =
        (normalizedCollateral * colPrice) / (10 ** colOracleDecimals);

    uint256 debtUsd =
        (normalizedDebt * debtPrice) / (10 ** debtOracleDecimals);

    // ===== Apply threshold =====
    uint256 adjustedCollateral =
        collateralUsd * LIQUIDATION_THRESHOLD / 100;

    // ===== Health factor =====
    uint256 healthFactor =
        (adjustedCollateral * PRECISION) / debtUsd;

    return healthFactor;
    }

    //////////////////
    //LIQUIDATION/////
    //////////////////

    function liquidate(address user, uint256 debtToCover) external nonReentrant{
    _accrueInterest(user);

    uint256 health = getHealthFactor(user);
    if (health >= PRECISION) {
        revert LENDINGPROTOCOL__amountMoreThanAllowed();
    }

    uint256 userDebt = userToAmountBorrowed[user];
    uint256 repayAmount = Math.min(debtToCover, userDebt);

    // Pull tokens from liquidator
    bool success = borrowToken.transferFrom(msg.sender, address(this), repayAmount);
    require(success, "Transfer Failed");

    // ===== Price Data =====
    (uint256 colPrice, uint8 colOracleDecimals) = _getSafePrice(priceFeed);
    (uint256 debtPrice, uint8 debtOracleDecimals) = _getSafePrice(borrowPriceFeed);

    uint8 collateralDecimals = IERC20Metadata(address(collateralToken)).decimals();
    uint8 borrowDecimals = IERC20Metadata(address(borrowToken)).decimals();

    // ===== Convert debt repaid -> USD =====
    uint256 normalizedDebt =
        repayAmount * PRECISION / (10 ** borrowDecimals);

    uint256 debtUsd =
        (normalizedDebt * debtPrice) / (10 ** debtOracleDecimals);

    // ===== Convert USD -> collateral tokens =====
    uint256 collateralTokens =
        (debtUsd * (10 ** colOracleDecimals)) / colPrice;

    collateralTokens =
        collateralTokens * (10 ** collateralDecimals) / PRECISION;

    // Apply bonus
    collateralTokens =
        collateralTokens * (100 + LIQUIDATION_BONUS) / 100;

    // Clamp to user's collateral
    uint256 userCollateral = userToCollateralDeposited[user];
    if (collateralTokens > userCollateral) {
        collateralTokens = userCollateral;
    }

    // ===== State Updates =====
    userToAmountBorrowed[user] -= repayAmount;
    userToCollateralDeposited[user] -= collateralTokens;
    totalBorrowed -= repayAmount;

    // ===== Transfer collateral to liquidator =====
    bool success2 = collateralToken.transfer(msg.sender, collateralTokens);
    require(success2, "Collateral transfer failed");
    }

    ////////////////////////
    //WITHDRAW COLLATERAL///
    ////////////////////////

    function withdrawCollateral(uint256 amount) external nonReentrant{
        _accrueInterest(msg.sender);

        if(amount == 0){
            revert LENDINGPROTOCOL__valueMustBeMoreThanZero();
        }
        uint256 userCollateral = userToCollateralDeposited[msg.sender]; //existing collateral

        if(amount > userCollateral){
            revert LENDINGPROTOCOL__cantWithdrawMoreThanDeposited();
        }

        uint256 userDebt = userToAmountBorrowed[msg.sender]; //existing debt
        
        if(userDebt == 0){ //skip healthFactor simulation
            userToCollateralDeposited[msg.sender] -= amount;

            bool transferSuccess = collateralToken.transfer(msg.sender, amount);
            require(transferSuccess, "Transfer Failed!");
            return; //EXIT FUNCTION ⚠️
        } //else->
        //simulate health factor, pretend transfer happens->

        uint256 remainingCollateral = userCollateral - amount;

        // ===== Normalize token amounts =====
        uint8 collateralDecimals = IERC20Metadata(address(collateralToken)).decimals();
        uint8 borrowDecimals = IERC20Metadata(address(borrowToken)).decimals();

        uint256 normalizedRemainingCollateral = remainingCollateral * PRECISION / (10 ** collateralDecimals);

        uint256 normalizedDebt = userDebt * PRECISION / (10 ** borrowDecimals);

        (uint256 colPrice, uint8 colOracleDecimals) = _getSafePrice(priceFeed);

        uint256 remainingCollateralUsd =
            (normalizedRemainingCollateral * colPrice) / (10 ** colOracleDecimals);
        
        (uint256 debtPrice, uint8 debtOracleDecimals) = _getSafePrice(borrowPriceFeed);

        uint256 debtUsd =
            (normalizedDebt * debtPrice) / (10 ** debtOracleDecimals);

        // ===== Health factor check =====
        uint256 adjustedCollateral =
            remainingCollateralUsd * LIQUIDATION_THRESHOLD / 100;

        uint256 healthFactor =
            (adjustedCollateral * PRECISION) / debtUsd;

        if(healthFactor < PRECISION){
            revert LENDINGPROTOCOL__amountMoreThanAllowed();
        }

        //APPLY WITHDRAWAL->
        userToCollateralDeposited[msg.sender] -= amount;

        bool success = collateralToken.transfer(msg.sender, amount);
        require(success, "Transfer Failed!");

}
    /////////////////////////
    //ACCRUE INTEREST LOGIC//
    /////////////////////////

    function _accrueInterest(address user) internal{
        uint256 debt = userToAmountBorrowed[user];

        //initialize timestamp on the first interaction
        uint256 lastTime = lastAccrued[user];
        if(lastTime == 0){
            lastAccrued[user] = block.timestamp;
            return;
        }

        //if no debt -> just update timestamp and return
        if(debt == 0){
            lastAccrued[user] = block.timestamp;
            return;
        }

        uint256 elapsed = block.timestamp - lastTime;

        //interest = debt * rate * time
        uint256 interest= (debt * BORROW_RATE_PER_SECOND * elapsed) / PRECISION;

        userToAmountBorrowed[user] += interest;
        totalBorrowed += interest;
        lastAccrued[user] = block.timestamp;

    }


}