# Orwex Protocol

A minimalist decentralized lending protocol enabling WETH-collateralized USDC borrowing with Chainlink oracle integration and automated liquidation mechanisms.

## Protocol Summary

### Problem Domain
Decentralized lending protocols require robust collateralization mechanisms, real-time price feeds, and automated liquidation systems to maintain solvency. Orwex addresses this through a simplified single-collateral, single-borrow architecture.

### Protocol Category
Collateralized debt position (CDP) lending protocol with fixed interest rates and oracle-driven valuations.

### Key Mechanics
* Deposit WETH as collateral
* Borrow USDC up to 80% loan-to-value ratio
* Per-second interest accrual at 10% APR
* Automated liquidations with 10% bonus incentive
* Health factor monitoring via Chainlink price feeds

## Design Philosophy
Orwex prioritizes simplicity and transparency over feature complexity. The protocol implements a minimal viable lending system focused on correctness, auditability, and educational clarity rather than capital efficiency optimization.

### Scope Limitations
* Single collateral asset (WETH only)
* Single borrow asset (USDC only)
* Fixed interest rate (no utilization curves)
* No governance mechanisms
* No multi-market support
* Testnet deployment only

## Architecture Overview

### System Diagram
```
User
  ↓
  ├─→ depositCollateral(WETH) → Protocol Contract
  ├─→ borrow(USDC) → Chainlink Oracles → Health Factor Check
  ├─→ repay(USDC) → Interest Accrual
  └─→ withdrawCollateral(WETH) → Health Factor Validation

Liquidator
  └─→ liquidate(user, debt) → Collateral Transfer + 10% Bonus
```

### Contract Responsibilities
**LendingProtocol.sol**

* Collateral accounting (userToCollateralDeposited mapping)
* Debt tracking with interest (userToAmountBorrowed mapping)
* Oracle price fetching with staleness protection
* Health factor calculation and enforcement
* Liquidation execution with bonus distribution
* Interest accrual per-second compounding

### Data Flow
1. User deposits WETH → Contract stores balance
2. User requests USDC borrow → Contract queries Chainlink oracles
3. Contract normalizes token decimals (WETH: 18, USDC: 6)
4. Contract converts amounts to USD using oracle prices
5. Contract calculates health factor: (Collateral USD × 80%) / Debt USD
6. If HF ≥ 1.0: Transfer USDC to user
7. If HF < 1.0: Revert transaction

### Oracle Interaction
```solidity
function _getSafePrice(AggregatorV3Interface feed) internal view returns (uint256, uint8) {
    (, int256 answer, , uint256 updatedAt, ) = feed.latestRoundData();
    
    // Validation checks
    require(answer > 0, "Invalid price");
    require(block.timestamp - updatedAt <= MAX_PRICE_AGE, "Stale price");
    
    return (uint256(answer), feed.decimals());
}
```

Oracles queried:

* WETH/USD for collateral valuation
* USDC/USD for debt valuation

### Liquidation Flow
1. Monitor user health factors off-chain
2. When HF < 1.0: Call liquidate(user, debtToCover)
3. Liquidator transfers USDC to protocol
4. Protocol calculates collateral equivalent in USD
5. Protocol applies 10% bonus to collateral amount
6. Protocol transfers collateral to liquidator
7. Protocol reduces user's debt and collateral balances

## Economic Model

### Collateral Valuation Logic
Collateral value determined by Chainlink WETH/USD price feed:

* Normalized Collateral = (WETH Amount × 1e18) / 10^18
* Collateral USD = (Normalized Collateral × WETH Price) / 10^(Oracle Decimals)

All calculations use 18-decimal precision internally to prevent rounding errors across different token decimal standards.

### Borrow Limits
Maximum borrow capacity enforced through health factor:

* Adjusted Collateral = Collateral USD × 80%
* Health Factor = (Adjusted Collateral × 1e18) / Debt USD

**Requirement:** Health Factor ≥ 1e18 (1.0)

**Example:**

* Collateral: 1 WETH = $3,000
* Max Borrow: $3,000 × 0.80 = $2,400 USDC
* At max borrow: HF = 2,400 / 2,400 = 1.0

### Health Factor Reasoning
The 80% liquidation threshold provides:

* 20% price buffer before liquidation
* Liquidator profit margin (10% bonus)
* Protocol solvency protection (10% buffer)

**Trade-off:** Lower capital efficiency for higher security.

### Interest Model Choice
Fixed 10% APR with per-second compounding:

* BORROW_RATE_PER_SECOND = (10 × 1e18) / 100 / 365 days
* Interest = Debt × Rate × Elapsed Time / 1e18

**Rationale:**

* Simplicity: No utilization curve complexity
* Predictability: Users know exact cost
* Educational: Clear interest calculation

**Trade-off:** No market-responsive rates

### Liquidation Incentives
10% bonus structure:

* Collateral Seized = (Debt Covered in USD) × 1.10

**Incentive analysis:**

* Liquidators profit from 10% bonus
* Protocol maintains solvency through early liquidation
* Users penalized for poor position management
* Gas costs offset by bonus on larger liquidations

## Risk Analysis

### Oracle Failure Risk
**Scenario:** Chainlink feed becomes unavailable or returns stale data

**Impact:** All price-dependent operations revert (borrow, withdraw, liquidate)

**Mitigation:**

* Staleness checks (MAX_PRICE_AGE = 7 days)
* Zero/negative price validation
* Revert on oracle errors (fail-safe design)

**Residual Risk:** Protocol becomes temporarily unusable if oracles fail. No fallback oracle implemented.

### Liquidity Exhaustion
**Scenario:** Protocol USDC balance insufficient for borrow requests

**Impact:** Users cannot borrow even with healthy positions

**Mitigation:**

* Liquidity check before transfer
* Clear error message (LENDINGPROTOCOL__insufficientLiquidity)

**Residual Risk:** No supply-side incentives. Protocol relies on manual USDC deposits for testnet operation.

### Interest Drift
**Scenario:** Interest accrues between user interactions, potentially degrading health factor

**Impact:** User's position may become liquidatable without explicit action

**Mitigation:**

* Interest accrued on every interaction (_accrueInterest called first)
* Frontend displays pending interest in real-time
* Users can monitor position continuously

**Residual Risk:** Users must actively manage positions. No automatic health factor maintenance.

### Bad Debt Scenarios
**Scenario:** Collateral value drops faster than liquidators can act

**Impact:** Protocol holds debt exceeding collateral value

**Mitigation:**

* 20% liquidation buffer (80% LTV)
* 10% liquidation bonus incentivizes fast action
* Continuous health factor monitoring

**Residual Risk:** Extreme volatility (>20% drop before liquidation) could create bad debt. No insurance fund implemented.

### Testnet Assumptions
**Critical Limitations:**

* Oracle update frequency may be lower than mainnet
* Test tokens have no real value (reduced liquidation incentive)
* Limited liquidity for testing
* No economic security guarantees

**Production Considerations:**

* Mainnet deployment requires professional audit
* Oracle reliability must be verified
* Liquidation bot infrastructure needed
* Insurance mechanisms should be considered

## Security Considerations

### Reentrancy Handling
All state-changing functions use OpenZeppelin's ReentrancyGuard:
```solidity
function borrow(uint256 amount) external nonReentrant { ... }
function repay(uint256 amount) external nonReentrant { ... }
function withdrawCollateral(uint256 amount) external nonReentrant { ... }
function liquidate(address user, uint256 debtToCover) external nonReentrant { ... }
```

**Protection against:**

* Cross-function reentrancy
* Same-function reentrancy
* Callback-based attacks

### State Ordering
Interest accrual occurs before all operations:
```solidity
function borrow(uint256 amount) external nonReentrant {
    _accrueInterest(msg.sender);  // Always first
    // ... rest of logic
}
```

**Ensures:**

* Debt calculations use current values
* Health factor checks include accrued interest
* No stale state exploitation

### Oracle Staleness Checks
```solidity
if (block.timestamp - updatedAt > MAX_PRICE_AGE) {
    revert LENDINGPROTOCOL__oracleError();
}
```

**Prevents:**

* Using outdated prices
* Manipulation via stale data
* Incorrect liquidations

### Input Validation
All user inputs validated:
```solidity
if (amount == 0) revert LENDINGPROTOCOL__valueMustBeMoreThanZero();
if (collateral == 0) revert LENDINGPROTOCOL__userHasZeroCollateral();
```

**Prevents:**

* Zero-value operations
* Gas waste
* State corruption

### Known Attack Surfaces
* **Price Manipulation:** Relies entirely on Chainlink oracle integrity. No TWAP or multi-oracle validation.
* **Flash Loan Attacks:** Not directly vulnerable (no same-block price dependencies), but liquidations could be front-run.
* **Griefing:** Liquidators could liquidate minimal amounts repeatedly. No minimum liquidation size enforced.
* **Decimal Precision:** Extensive normalization logic. Potential for rounding errors in edge cases.

## Testing Strategy

### Unit Tests
Located in `LendingProtocol.t.sol`:

* Deposit collateral functionality
* Borrow limit enforcement
* Repayment mechanics
* Withdrawal with health factor validation
* Liquidation execution
* Interest accrual accuracy

### Edge Case Tests
* Zero amount operations
* Maximum uint256 values
* Dust amounts (1 wei)
* Exact liquidation threshold
* Oracle price edge cases (zero, negative, max)

### Invariant Fuzzing
Located in `LendingProtocolInvariant.t.sol`:

**Invariants tested:**

* Total borrowed equals sum of user debts
* Collateral accounting consistency
* Health factor calculation correctness
* Interest accrual monotonicity
* No negative balances

### Economic Correctness Checks
* Interest calculation precision
* Health factor formula accuracy
* Liquidation bonus calculation
* USD conversion correctness across decimals

### Time-Based Tests
* Interest accrual over multiple blocks
* Oracle staleness triggering
* Long-duration position management

**Run tests:**
```bash
forge test -vvv
```

## Deployment Details

### Network Information
* **Network:** Ethereum Sepolia Testnet
* **Chain ID:** 11155111
* **Block Explorer:** https://sepolia.etherscan.io

### Contract Addresses
* **Lending Protocol:** 0x3db2787AE4258B4aA30872a972516A0e51e93cFc
* **WETH (Collateral):** 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9
* **USDC (Borrow):** 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

### Oracle Feeds
* **WETH/USD Price Feed:** Chainlink Sepolia
* **USDC/USD Price Feed:** Chainlink Sepolia

### Verification
Contract verified on Etherscan. View source code and interact directly through block explorer.

## Frontend Integration Notes

### Decimals Handling
Critical precision requirements:
```javascript
// WETH: 18 decimals
const wethAmount = parseUnits(amount, 18);

// USDC: 6 decimals
const usdcAmount = parseUnits(amount, 6);

// Health Factor: 18 decimals (1e18 = 1.0)
const healthFactor = formatUnits(hfBig, 18);
```

### Health Factor Sync
Frontend polls contract every 10 seconds:
```javascript
const hfBig = await contract.getHealthFactor(userAddress);
const hf = formatUnits(hfBig, 18);
```

Real-time pending interest calculated client-side between polls.

### Event Indexing
Events are indexed for efficient filtering:
```solidity
event userAddedCollateral(address indexed user, uint256 collateralAmount);
event userBorrowedToken(address indexed user, uint256 borrowAmount);
event userRepaidDebt(address indexed user, uint256 repaidAmount);
```

**Frontend filters:**
```javascript
const filter = contract.filters.userAddedCollateral(userAddress);
const events = await contract.queryFilter(filter);
```

### ABI Coordination
Frontend uses complete ABI from `contracts.ts`. All function signatures must match deployed contract exactly.

## Design Tradeoffs

### Fixed APR vs Utilization Curves
**Choice:** Fixed 10% APR

**Alternative:** Utilization-based rates (Aave/Compound model)

**Rationale:**

* Simplicity: No complex rate calculations
* Predictability: Users know exact cost
* Educational: Easier to understand and audit

**Trade-off:** No market efficiency. Rate doesn't respond to supply/demand.

### Single Asset Support
**Choice:** WETH collateral, USDC borrow only

**Alternative:** Multi-collateral, multi-borrow markets

**Rationale:**

* Reduced complexity: Single price feed pair
* Clear accounting: No cross-market interactions
* Focused scope: Demonstrates core mechanics

**Trade-off:** Limited utility. Real protocols need asset diversity.

### Simplified Accounting Model
**Choice:** Direct user balance mappings

**Alternative:** Share-based accounting (aTokens/cTokens)

**Rationale:**

* Transparency: Balances directly readable
* Simplicity: No share price calculations
* Auditability: Clear state representation

**Trade-off:** No composability. Positions can't be tokenized or transferred.

### Oracle Tolerance Window
**Choice:** 7-day staleness tolerance

**Alternative:** 1-hour window (production standard)

**Rationale:**

* Testnet reliability: Oracles update less frequently
* Usability: Prevents constant reverts during testing
* Explicit: MAX_PRICE_AGE is contract constant

**Trade-off:** Accepts stale prices. Unsuitable for mainnet.

## Limitations / Future Work

### Missing Accounting Features
* No supply-side interest (lenders earn nothing)
* No reserve factor or protocol fees
* No bad debt socialization mechanism
* No liquidation penalty distribution

### No Governance
* Parameters are immutable post-deployment
* No admin functions or upgrade paths
* No emergency pause mechanism
* No parameter adjustment capability

### No Multi-Market Support
* Single collateral/borrow pair only
* No isolated lending pools
* No cross-collateral borrowing
* No asset listing process

### No Rate Curve Model
* Fixed 10% APR regardless of utilization
* No supply/demand price discovery
* No incentive balancing mechanism
* No optimal utilization targeting

### No Insurance Module
* No safety fund for bad debt
* No liquidation backstop
* No protocol-owned liquidity
* No risk tranching

### Testnet-Only Limitations
* Not audited for production use
* Oracle assumptions unsuitable for mainnet
* No economic security guarantees
* Limited liquidity and testing scope

## Developer Instructions

### Build
```bash
forge build
```

### Test
```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testBorrow

# Run invariant tests
forge test --match-contract Invariant
```

### Deploy
```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=your_rpc_url

# Deploy
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

### Verify
```bash
forge verify-contract <CONTRACT_ADDRESS> src/LendingProtocol.sol:LendingProtocol \
  --chain-id 11155111 \
  --constructor-args $(cast abi-encode "constructor(address,address,address,address)" <WETH> <USDC> <WETH_FEED> <USDC_FEED>)
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Glossary

**Health Factor:** Ratio of adjusted collateral value to debt value. Values below 1.0 trigger liquidation eligibility. Calculated as (Collateral USD × 80%) / Debt USD.

**LTV (Loan-to-Value):** Percentage of collateral value that can be borrowed. Orwex uses 80% LTV, meaning users can borrow up to 80% of their collateral's USD value.

**Liquidation Bonus:** Additional collateral awarded to liquidators as incentive. Orwex provides 10% bonus, meaning liquidators receive 110% of the debt value in collateral.

**Oracle Staleness:** Age of price data from Chainlink feeds. Orwex rejects prices older than 7 days (MAX_PRICE_AGE) to prevent using outdated valuations.

**Normalized Amount:** Token amount converted to 18-decimal precision for consistent calculations across different token decimal standards (WETH: 18, USDC: 6).

**Accrued Interest:** Interest that has been calculated and added to user's debt balance on-chain through _accrueInterest function calls.

**Pending Interest:** Interest that has accumulated since last accrual but not yet added to on-chain debt balance. Calculated client-side for real-time display.
