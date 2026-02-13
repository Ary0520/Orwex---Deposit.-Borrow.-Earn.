import { motion } from "framer-motion";
import { Book, Shield, Code, GitBranch, AlertTriangle, Layers } from "lucide-react";
import { CONTRACTS } from "@/config/contracts";

const sections = [
    { id: "overview", title: "Overview", icon: Book },
    { id: "how-it-works", title: "How It Works", icon: Layers },
    { id: "risk-model", title: "Risk Model", icon: Shield },
    { id: "architecture", title: "Smart Contract Architecture", icon: Code },
    { id: "developer", title: "Developer Resources", icon: GitBranch },
    { id: "security", title: "Security & Testing", icon: AlertTriangle },
];

export default function Docs() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        
                        <div>
                            <h1 className="text-xl font-bold">Orwex Protocol</h1>
                            <p className="text-xs text-slate-400">Technical Documentation</p>
                        </div>
                    </div>
                    <a
                        href="/"
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Back to Home
                    </a>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <nav className="lg:col-span-1">
                        <div className="sticky top-24 space-y-2">
                            {sections.map((section) => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800/50 transition-colors group"
                                >
                                    <section.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                        {section.title}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </nav>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-16">

                        {/* Overview Section */}
                        <Section id="overview" title="Overview" icon={Book}>
                            <Subsection title="What is Orwex Protocol?">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    Orwex is a minimalist decentralized lending protocol built on Ethereum. It enables users to deposit WETH as collateral and borrow USDC against it, with positions secured by real-time Chainlink price feeds and automated health factor monitoring.
                                </p>
                                <p className="text-slate-300 leading-relaxed">
                                    The protocol implements a single-collateral, single-borrow architecture focused on simplicity, transparency, and security.
                                </p>
                            </Subsection>

                            <Subsection title="Supported Assets">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoCard title="Collateral Asset" value="WETH" description="Wrapped Ether (18 decimals)" />
                                    <InfoCard title="Borrow Asset" value="USDC" description="USD Coin (6 decimals)" />
                                </div>
                            </Subsection>

                            <Subsection title="Core Features">
                                <ul className="space-y-3">
                                    <FeatureItem>Non-custodial: Users maintain full control of deposited assets</FeatureItem>
                                    <FeatureItem>Oracle-driven: Chainlink price feeds for accurate valuations</FeatureItem>
                                    <FeatureItem>Fixed rate: 10% APR with per-second compounding</FeatureItem>
                                    <FeatureItem>Automated liquidations: 10% bonus for liquidators</FeatureItem>
                                    <FeatureItem>Health factor monitoring: Real-time position safety tracking</FeatureItem>
                                </ul>
                            </Subsection>
                        </Section>

                        {/* How It Works Section */}
                        <Section id="how-it-works" title="How It Works" icon={Layers}>
                            <Subsection title="Collateral Deposit">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    Users deposit WETH into the protocol smart contract. The contract tracks each user's collateral balance in the <code className="text-blue-400 bg-slate-800 px-2 py-1 rounded">userToCollateralDeposited</code> mapping.
                                </p>
                                <CodeBlock>
                                    {`function depositCollateral(uint256 amount) external
// Transfers WETH from user to protocol
// Updates userToCollateralDeposited[msg.sender]
// Emits userAddedCollateral event`}
                                </CodeBlock>
                            </Subsection>

                            <Subsection title="USD Valuation">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    The protocol fetches real-time prices from Chainlink oracles:
                                </p>
                                <ul className="space-y-2 mb-4">
                                    <li className="text-slate-300">WETH/USD price feed for collateral valuation</li>
                                    <li className="text-slate-300">USDC/USD price feed for debt valuation</li>
                                </ul>
                                <p className="text-slate-300 leading-relaxed">
                                    All calculations normalize token amounts to 18 decimals for precision, then convert to USD using oracle prices.
                                </p>
                            </Subsection>

                            <Subsection title="Borrowing Mechanism">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    Users can borrow USDC up to 80% of their collateral value (Loan-to-Value ratio). The protocol enforces this through health factor checks.
                                </p>
                                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-4">
                                    <h4 className="text-white font-semibold mb-3">Health Factor Formula</h4>
                                    <CodeBlock>
                                        {`Health Factor = (Collateral USD × 80%) / Debt USD

Example:
- Collateral: 1 WETH = $3,000
- Max Borrow: $3,000 × 80% = $2,400 USDC
- Health Factor: 2,400 / 2,400 = 1.0 (minimum)`}
                                    </CodeBlock>
                                </div>
                                <p className="text-slate-300 leading-relaxed">
                                    Transactions revert if the resulting health factor would drop below 1.0.
                                </p>
                            </Subsection>

                            <Subsection title="Liquidation Process">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    When a user's health factor falls below 1.0, their position becomes liquidatable. Liquidators can repay part or all of the debt and receive the equivalent collateral plus a 10% bonus.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InfoCard title="Trigger" value="HF < 1.0" description="Position becomes unsafe" />
                                    <InfoCard title="Bonus" value="10%" description="Liquidator incentive" />
                                    <InfoCard title="Partial" value="Allowed" description="Can liquidate any amount" />
                                </div>
                            </Subsection>
                        </Section>

                        {/* Risk Model Section */}
                        <Section id="risk-model" title="Risk Model" icon={Shield}>
                            <Subsection title="Oracle Dependency">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    The protocol relies entirely on Chainlink price feeds for asset valuation. All critical operations (borrow, withdraw, liquidate) query oracle prices.
                                </p>
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                    <p className="text-yellow-200 text-sm">
                                        <strong>Risk:</strong> If oracle feeds become unavailable or return stale data, the protocol will revert all price-dependent operations.
                                    </p>
                                </div>
                            </Subsection>

                            <Subsection title="Staleness Protection">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    The protocol implements oracle staleness checks to prevent using outdated prices:
                                </p>
                                <CodeBlock>
                                    {`MAX_PRICE_AGE = 7 days

function _getSafePrice(AggregatorV3Interface feed) internal view {
    (, int256 answer, , uint256 updatedAt, ) = feed.latestRoundData();
    
    if (answer <= 0) revert LENDINGPROTOCOL__oracleError();
    if (block.timestamp - updatedAt > MAX_PRICE_AGE) {
        revert LENDINGPROTOCOL__oracleError();
    }
    
    return (uint256(answer), feed.decimals());
}`}
                                </CodeBlock>
                                <p className="text-slate-300 leading-relaxed mt-4">
                                    Transactions revert if price data is older than 7 days or if the price is zero or negative.
                                </p>
                            </Subsection>

                            <Subsection title="Interest Accrual">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    Debt accrues interest at 10% APR, compounded per-second:
                                </p>
                                <CodeBlock>
                                    {`BORROW_RATE_PER_SECOND = (10 * 1e18) / 100 / 365 days

Interest = Debt × Rate × Elapsed Time

// Accrued on every interaction
function _accrueInterest(address user) internal {
    uint256 elapsed = block.timestamp - lastAccrued[user];
    uint256 interest = (debt × BORROW_RATE_PER_SECOND × elapsed) / 1e18;
    userToAmountBorrowed[user] += interest;
}`}
                                </CodeBlock>
                            </Subsection>

                            <Subsection title="Liquidation Threshold Logic">
                                <div className="space-y-4">
                                    <InfoCard 
                                        title="Liquidation Threshold" 
                                        value="80%" 
                                        description="Maximum LTV before liquidation risk"
                                    />
                                    <p className="text-slate-300 leading-relaxed">
                                        The 80% threshold provides a 20% buffer between maximum borrowing capacity and liquidation. This buffer protects against small price fluctuations while ensuring the protocol remains solvent.
                                    </p>
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                                        <p className="text-slate-300 text-sm">
                                            <strong>Example:</strong> If collateral drops 15% in value, a user at 80% LTV would have a health factor of ~0.94, triggering liquidation eligibility.
                                        </p>
                                    </div>
                                </div>
                            </Subsection>

                            <Subsection title="Testnet Considerations">
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
                                    <p className="text-blue-200 text-sm">
                                        <strong>Network:</strong> Deployed on Ethereum Sepolia testnet
                                    </p>
                                    <p className="text-blue-200 text-sm">
                                        <strong>Oracle Reliability:</strong> Testnet oracles may update less frequently than mainnet
                                    </p>
                                    <p className="text-blue-200 text-sm">
                                        <strong>Liquidity:</strong> Protocol liquidity depends on manual USDC deposits for testing
                                    </p>
                                </div>
                            </Subsection>
                        </Section>

                        {/* Architecture Section */}
                        <Section id="architecture" title="Smart Contract Architecture" icon={Code}>
                            <Subsection title="State Variables">
                                <div className="space-y-3">
                                    <StateVariable 
                                        name="userToCollateralDeposited" 
                                        type="mapping(address => uint256)" 
                                        description="Tracks WETH collateral per user"
                                    />
                                    <StateVariable 
                                        name="userToAmountBorrowed" 
                                        type="mapping(address => uint256)" 
                                        description="Tracks USDC debt per user (includes accrued interest)"
                                    />
                                    <StateVariable 
                                        name="lastAccrued" 
                                        type="mapping(address => uint256)" 
                                        description="Timestamp of last interest accrual per user"
                                    />
                                    <StateVariable 
                                        name="totalBorrowed" 
                                        type="uint256" 
                                        description="Protocol-wide total debt"
                                    />
                                    <StateVariable 
                                        name="collateralToken" 
                                        type="IERC20" 
                                        description="WETH token contract"
                                    />
                                    <StateVariable 
                                        name="borrowToken" 
                                        type="IERC20" 
                                        description="USDC token contract"
                                    />
                                    <StateVariable 
                                        name="priceFeed" 
                                        type="AggregatorV3Interface" 
                                        description="Chainlink WETH/USD oracle"
                                    />
                                    <StateVariable 
                                        name="borrowPriceFeed" 
                                        type="AggregatorV3Interface" 
                                        description="Chainlink USDC/USD oracle"
                                    />
                                </div>
                            </Subsection>

                            <Subsection title="Constants">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoCard title="LIQUIDATION_THRESHOLD" value="80" description="80% max LTV" />
                                    <InfoCard title="LIQUIDATION_BONUS" value="10" description="10% liquidator bonus" />
                                    <InfoCard title="PRECISION" value="1e18" description="Calculation precision" />
                                    <InfoCard title="MAX_PRICE_AGE" value="7 days" description="Oracle staleness limit" />
                                    <InfoCard title="BORROW_RATE_PER_SECOND" value="~3.17e9" description="10% APR per-second" />
                                </div>
                            </Subsection>

                            <Subsection title="Core Functions">
                                <div className="space-y-4">
                                    <FunctionCard 
                                        name="depositCollateral(uint256 amount)" 
                                        description="Deposits WETH as collateral"
                                        access="External"
                                    />
                                    <FunctionCard 
                                        name="borrow(uint256 amount)" 
                                        description="Borrows USDC against collateral"
                                        access="External, NonReentrant"
                                    />
                                    <FunctionCard 
                                        name="repay(uint256 amount)" 
                                        description="Repays USDC debt"
                                        access="External, NonReentrant"
                                    />
                                    <FunctionCard 
                                        name="withdrawCollateral(uint256 amount)" 
                                        description="Withdraws WETH collateral"
                                        access="External, NonReentrant"
                                    />
                                    <FunctionCard 
                                        name="liquidate(address user, uint256 debtToCover)" 
                                        description="Liquidates undercollateralized position"
                                        access="External, NonReentrant"
                                    />
                                    <FunctionCard 
                                        name="getHealthFactor(address user)" 
                                        description="Returns user's health factor"
                                        access="Public View"
                                    />
                                </div>
                            </Subsection>

                            <Subsection title="Economic Flow">
                                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                                    <pre className="text-sm text-slate-300 overflow-x-auto">
{`1. User deposits WETH
   ↓
2. Protocol values WETH in USD (Chainlink)
   ↓
3. User borrows USDC (≤ 80% of collateral value)
   ↓
4. Interest accrues per-second at 10% APR
   ↓
5. Health factor monitored continuously
   ↓
6. If HF < 1.0: Liquidation eligible
   ↓
7. Liquidator repays debt, receives collateral + 10%`}
                                    </pre>
                                </div>
                            </Subsection>
                        </Section>

                        {/* Developer Resources Section */}
                        <Section id="developer" title="Developer Resources" icon={GitBranch}>
                            <Subsection title="Contract Addresses">
                                <div className="space-y-3">
                                    <AddressCard 
                                        label="Lending Protocol" 
                                        address={CONTRACTS.LENDING_PROTOCOL}
                                    />
                                    <AddressCard 
                                        label="WETH (Collateral)" 
                                        address={CONTRACTS.WETH}
                                    />
                                    <AddressCard 
                                        label="USDC (Borrow)" 
                                        address={CONTRACTS.USDC}
                                    />
                                </div>
                            </Subsection>

                            <Subsection title="Network Information">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoCard title="Network" value="Sepolia" description="Ethereum testnet" />
                                    <InfoCard title="Chain ID" value="11155111" description="Sepolia chain identifier" />
                                </div>
                            </Subsection>

                            <Subsection title="Oracle Feeds">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    The protocol uses Chainlink Price Feeds for asset valuation:
                                </p>
                                <ul className="space-y-2">
                                    <li className="text-slate-300">WETH/USD: Provides real-time WETH price</li>
                                    <li className="text-slate-300">USDC/USD: Provides real-time USDC price</li>
                                </ul>
                            </Subsection>

                            <Subsection title="Integration Guide">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    To integrate with Orwex Protocol:
                                </p>
                                <ol className="space-y-3 list-decimal list-inside text-slate-300">
                                    <li>Connect to Sepolia testnet</li>
                                    <li>Approve WETH spending to protocol contract</li>
                                    <li>Call <code className="text-blue-400 bg-slate-800 px-2 py-1 rounded">depositCollateral(amount)</code></li>
                                    <li>Call <code className="text-blue-400 bg-slate-800 px-2 py-1 rounded">borrow(amount)</code> with desired USDC amount</li>
                                    <li>Monitor health factor via <code className="text-blue-400 bg-slate-800 px-2 py-1 rounded">getHealthFactor(address)</code></li>
                                </ol>
                            </Subsection>

                            <Subsection title="ABI Access">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    The contract ABI is available in the frontend codebase at:
                                </p>
                                <CodeBlock>
                                    {`frontend/src/config/contracts.ts

export const LENDING_PROTOCOL_ABI = [
    // Full ABI available in source code
]`}
                                </CodeBlock>
                            </Subsection>
                        </Section>

                        {/* Security Section */}
                        <Section id="security" title="Security & Testing" icon={AlertTriangle}>
                            <Subsection title="Testing Approach">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    The protocol implements comprehensive testing including:
                                </p>
                                <ul className="space-y-3">
                                    <FeatureItem>Unit tests for individual functions</FeatureItem>
                                    <FeatureItem>Integration tests for complete user flows</FeatureItem>
                                    <FeatureItem>Invariant fuzzing for protocol invariants</FeatureItem>
                                    <FeatureItem>Edge case testing for boundary conditions</FeatureItem>
                                </ul>
                            </Subsection>

                            <Subsection title="Invariant Testing">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    Foundry-based invariant tests verify critical protocol properties:
                                </p>
                                <CodeBlock>
                                    {`// Example invariants tested:
- Total borrowed never exceeds sum of user debts
- Health factor calculations remain consistent
- Collateral accounting is always accurate
- Interest accrual is monotonically increasing`}
                                </CodeBlock>
                            </Subsection>

                            <Subsection title="Security Measures">
                                <div className="space-y-4">
                                    <SecurityItem 
                                        title="Reentrancy Protection" 
                                        description="All state-changing functions use OpenZeppelin's ReentrancyGuard"
                                    />
                                    <SecurityItem 
                                        title="Oracle Validation" 
                                        description="Staleness checks and zero-price protection on all oracle reads"
                                    />
                                    <SecurityItem 
                                        title="Integer Overflow Protection" 
                                        description="Solidity 0.8.20+ built-in overflow checks"
                                    />
                                    <SecurityItem 
                                        title="Access Control" 
                                        description="No admin functions; fully permissionless operation"
                                    />
                                </div>
                            </Subsection>

                            <Subsection title="Known Limitations">
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-3">
                                    <p className="text-yellow-200 text-sm">
                                        <strong>Single Collateral Type:</strong> Only WETH supported; no multi-collateral functionality
                                    </p>
                                    <p className="text-yellow-200 text-sm">
                                        <strong>Oracle Dependency:</strong> Complete reliance on Chainlink feeds; no fallback oracles
                                    </p>
                                    <p className="text-yellow-200 text-sm">
                                        <strong>Fixed Interest Rate:</strong> 10% APR is hardcoded; no dynamic rate adjustment
                                    </p>
                                    <p className="text-yellow-200 text-sm">
                                        <strong>No Governance:</strong> Protocol parameters cannot be updated post-deployment
                                    </p>
                                    <p className="text-yellow-200 text-sm">
                                        <strong>Testnet Only:</strong> Currently deployed on Sepolia; not audited for mainnet
                                    </p>
                                </div>
                            </Subsection>

                            <Subsection title="Audit Status">
                                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                                    <p className="text-slate-300 text-sm">
                                        This protocol has not undergone a professional security audit. It is deployed on testnet for educational and demonstration purposes only.
                                    </p>
                                    <p className="text-slate-400 text-sm mt-3">
                                        Do not use with real funds on mainnet without proper auditing.
                                    </p>
                                </div>
                            </Subsection>
                        </Section>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Component Helpers
function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) {
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="scroll-mt-24"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
                    <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">{title}</h2>
            </div>
            <div className="space-y-8">{children}</div>
        </motion.section>
    );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
            {children}
        </div>
    );
}

function InfoCard({ title, value, description }: { title: string; value: string; description: string }) {
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">{title}</div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-slate-500">{description}</div>
        </div>
    );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-3 text-slate-300">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span>{children}</span>
        </li>
    );
}

function CodeBlock({ children }: { children: string }) {
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-slate-300">
                <code>{children}</code>
            </pre>
        </div>
    );
}

function StateVariable({ name, type, description }: { name: string; type: string; description: string }) {
    return (
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4 mb-2">
                <code className="text-blue-400 font-mono text-sm">{name}</code>
                <span className="text-xs text-slate-500 font-mono">{type}</span>
            </div>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
    );
}

function FunctionCard({ name, description, access }: { name: string; description: string; access: string }) {
    return (
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4 mb-2">
                <code className="text-green-400 font-mono text-sm">{name}</code>
                <span className="text-xs text-slate-500 px-2 py-1 bg-slate-700 rounded">{access}</span>
            </div>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
    );
}

function AddressCard({ label, address }: { label: string; address: string }) {
    return (
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-2">{label}</div>
            <code className="text-sm text-blue-400 font-mono break-all">{address}</code>
        </div>
    );
}

function SecurityItem({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div>
                <h4 className="text-white font-semibold text-sm mb-1">{title}</h4>
                <p className="text-slate-400 text-sm">{description}</p>
            </div>
        </div>
    );
}
