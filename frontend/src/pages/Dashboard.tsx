import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, Activity, AlertTriangle, Info, ChevronDown, ChevronUp, Zap, Clock, DollarSign } from "lucide-react";
import { useLendingProtocol } from "@/hooks/use-lending-protocol";
import { useDevModeData } from "@/hooks/use-dev-mode-data";
import { Button } from "@/components/ui/button";
import { Toaster } from "react-hot-toast";
import { formatNumber, calculateHealthFactorColor } from "@/lib/utils";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { CONTRACTS } from "@/config/contracts";

export default function Dashboard() {
    const {
        account,
        connectWallet,
        userData,
        isLoading,
        approveAndDeposit,
        executeBorrow,
        executeRepay,
        withdrawCollateral,
        executeLiquidation,
        provider,
    } = useLendingProtocol();

    const devData = useDevModeData(account, provider);

    const [collateralAmount, setCollateralAmount] = useState("");
    const [borrowAmount, setBorrowAmount] = useState("");
    const [repayAmount, setRepayAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [showDevMode, setShowDevMode] = useState(false);
    const [liquidateAddress, setLiquidateAddress] = useState("");
    const [liquidateAmount, setLiquidateAmount] = useState("");
    const [pendingInterest, setPendingInterest] = useState("0");

    // Real-time interest ticker
    useEffect(() => {
        const BORROW_RATE_PER_SECOND = 10 * 1e18 / 100 / (365 * 24 * 60 * 60);
        const principal = parseFloat(userData.principal);
        
        if (principal > 0 && userData.lastAccrued > 0) {
            const interval = setInterval(() => {
                const currentTime = Math.floor(Date.now() / 1000);
                const elapsed = currentTime - userData.lastAccrued;
                const interest = (principal * BORROW_RATE_PER_SECOND * elapsed) / 1e18;
                setPendingInterest(interest.toFixed(6));
            }, 1000); // Update every second
            
            return () => clearInterval(interval);
        } else {
            setPendingInterest("0");
        }
    }, [userData.principal, userData.lastAccrued]);

    const healthFactorNum = userData.healthFactor === "∞" ? Infinity : parseFloat(userData.healthFactor);
    const isWarning = healthFactorNum < 1.5 && healthFactorNum >= 1.2;
    const isDanger = healthFactorNum < 1.2 && healthFactorNum !== Infinity;

    if (!account) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
                <Toaster position="top-right" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <motion.div
                        className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                        animate={{
                            boxShadow: [
                                "0 0 20px rgba(59, 130, 246, 0.5)",
                                "0 0 60px rgba(147, 51, 234, 0.5)",
                                "0 0 20px rgba(59, 130, 246, 0.5)",
                            ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Wallet className="w-12 h-12 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-white mb-4">Connect Your Wallet</h1>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        Connect your MetaMask wallet to access the Orwex lending protocol
                    </p>
                    <Button
                        onClick={connectWallet}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                        Connect MetaMask
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <Toaster position="top-right" />
            
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        
                        <h1 className="text-2xl font-bold">Orwex Protocol</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                            <p className="text-xs text-slate-400">Connected</p>
                            <p className="text-sm font-mono">{account.slice(0, 6)}...{account.slice(-4)}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Health Factor Alert */}
                <AnimatePresence>
                    {(isWarning || isDanger) && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`mb-6 p-4 rounded-xl border ${
                                isDanger
                                    ? "bg-red-500/10 border-red-500/50"
                                    : "bg-yellow-500/10 border-yellow-500/50"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <AlertTriangle className={isDanger ? "text-red-500" : "text-yellow-500"} />
                                <div>
                                    <p className="font-semibold">
                                        {isDanger ? "Critical: Risk of Liquidation" : "Warning: Low Health Factor"}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {isDanger
                                            ? "Your position is at risk. Repay debt or add collateral immediately."
                                            : "Consider adding more collateral or repaying some debt."}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Health Factor"
                        value={userData.healthFactor === "∞" ? "∞" : parseFloat(userData.healthFactor).toFixed(2)}
                        icon={Activity}
                        color={calculateHealthFactorColor(healthFactorNum)}
                        subtitle={
                            healthFactorNum === Infinity
                                ? "No debt"
                                : healthFactorNum >= 1.5
                                ? "Healthy"
                                : healthFactorNum >= 1.2
                                ? "Warning"
                                : "At Risk"
                        }
                    />
                    <StatCard
                        title="Total Collateral"
                        value={`${formatNumber(userData.totalCollateral)} WETH`}
                        icon={TrendingUp}
                        color="blue"
                        subtitle="Deposited collateral"
                    />
                    <StatCard
                        title="Total Borrowed"
                        value={`${formatNumber(userData.totalBorrowed)} USDC`}
                        icon={TrendingDown}
                        color="purple"
                        subtitle="Current debt"
                    />
                    <StatCard
                        title="Borrow Capacity"
                        value="Contract Enforced"
                        icon={Info}
                        color="green"
                        subtitle="80% LTV - Try borrowing to test limits"
                    />
                </div>

                {/* Main Action Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Collateral Card */}
                    <ActionCard title="Manage Collateral" icon={TrendingUp}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">Your WETH Balance</label>
                                <div className="text-2xl font-bold">{formatNumber(userData.wethBalance)} WETH</div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-slate-400">Deposit Amount</label>
                                <input
                                    type="number"
                                    value={collateralAmount}
                                    onChange={(e) => setCollateralAmount(e.target.value)}
                                    placeholder="0.0"
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCollateralAmount((parseFloat(userData.wethBalance) * 0.25).toString())}
                                        className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                                    >
                                        25%
                                    </button>
                                    <button
                                        onClick={() => setCollateralAmount((parseFloat(userData.wethBalance) * 0.5).toString())}
                                        className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                                    >
                                        50%
                                    </button>
                                    <button
                                        onClick={() => setCollateralAmount((parseFloat(userData.wethBalance) * 0.75).toString())}
                                        className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                                    >
                                        75%
                                    </button>
                                    <button
                                        onClick={() => setCollateralAmount(userData.wethBalance)}
                                        className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                                    >
                                        MAX
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={() => approveAndDeposit(collateralAmount)}
                                disabled={isLoading || !collateralAmount || parseFloat(collateralAmount) <= 0}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Processing..." : "Deposit Collateral"}
                            </Button>

                            <div className="pt-4 border-t border-slate-800">
                                <label className="text-sm text-slate-400 mb-2 block">Withdraw Amount</label>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="0.0"
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all mb-2"
                                />
                                <Button
                                    onClick={() => withdrawCollateral(withdrawAmount)}
                                    disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50"
                                >
                                    Withdraw Collateral
                                </Button>
                            </div>
                        </div>
                    </ActionCard>

                    {/* Borrow/Repay Card */}
                    <ActionCard title="Borrow & Repay" icon={TrendingDown}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">Your USDC Balance</label>
                                <div className="text-2xl font-bold">{formatNumber(userData.usdcBalance)} USDC</div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-slate-400">Borrow Amount</label>
                                <input
                                    type="number"
                                    value={borrowAmount}
                                    onChange={(e) => setBorrowAmount(e.target.value)}
                                    placeholder="0.0"
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                />
                                {borrowAmount && parseFloat(borrowAmount) > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                                    >
                                        <p className="text-xs text-slate-400 mb-1">⚠️ Current Health Factor</p>
                                        <p className={`text-lg font-bold ${
                                            healthFactorNum === Infinity ? "text-green-500" :
                                            healthFactorNum >= 1.5 ? "text-green-500" :
                                            healthFactorNum >= 1.2 ? "text-yellow-500" : "text-red-500"
                                        }`}>
                                            {userData.healthFactor === "∞" ? "∞" : parseFloat(userData.healthFactor).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Transaction will revert if health factor drops below 1.0
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            💡 Try borrowing to see if contract accepts it
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                            <Button
                                onClick={() => executeBorrow(borrowAmount)}
                                disabled={isLoading || !borrowAmount || parseFloat(borrowAmount) <= 0}
                                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50"
                            >
                                {isLoading ? "Processing..." : "Borrow USDC"}
                            </Button>

                            <div className="pt-4 border-t border-slate-800">
                                <label className="text-sm text-slate-400 mb-2 block">Repay Amount</label>
                                <input
                                    type="number"
                                    value={repayAmount}
                                    onChange={(e) => setRepayAmount(e.target.value)}
                                    placeholder="0.0"
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all mb-2"
                                />
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => setRepayAmount((parseFloat(userData.totalBorrowed) * 0.5).toString())}
                                        className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                                    >
                                        50%
                                    </button>
                                    <button
                                        onClick={() => setRepayAmount(userData.totalBorrowed)}
                                        className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                                    >
                                        MAX
                                    </button>
                                </div>
                                <Button
                                    onClick={() => executeRepay(repayAmount)}
                                    disabled={isLoading || !repayAmount || parseFloat(repayAmount) <= 0}
                                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:opacity-50"
                                >
                                    Repay USDC
                                </Button>
                            </div>
                        </div>
                    </ActionCard>
                </div>

                {/* Interest Breakdown & Liquidation Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Interest Breakdown Card */}
                    <ActionCard title="Interest Breakdown" icon={Clock}>
                        <div className="space-y-4">
                            {parseFloat(userData.principal) > 0 ? (
                                <>
                                    <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-slate-400">Principal Debt</span>
                                            <span className="text-lg font-bold text-blue-400">
                                                {formatNumber(userData.principal)} USDC
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Original borrowed amount (on-chain)
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-slate-400">Accrued Interest</span>
                                            <span className="text-lg font-bold text-yellow-400">
                                                {formatNumber(userData.accruedInterest)} USDC
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Already added to your debt on-chain
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-slate-400">Pending Interest</span>
                                            <motion.span 
                                                className="text-lg font-bold text-purple-400 font-mono"
                                                animate={{ opacity: [1, 0.7, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                +{pendingInterest} USDC
                                            </motion.span>
                                        </div>
                                        <div className="text-xs text-slate-500 mb-3">
                                            Accruing in real-time (not yet on-chain)
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-purple-400">
                                            <Activity className="w-3 h-3 animate-pulse" />
                                            <span>Live ticker • Updates every second</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-semibold text-white">Total Debt</span>
                                            <span className="text-xl font-bold text-red-400">
                                                {formatNumber(userData.totalBorrowed)} USDC
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Interest Rate:</span>
                                                <span className="text-slate-400">10% APR</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Compounding:</span>
                                                <span className="text-slate-400">Per-second</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Last Accrued:</span>
                                                <span className="text-slate-400">
                                                    {userData.lastAccrued > 0 
                                                        ? new Date(userData.lastAccrued * 1000).toLocaleTimeString()
                                                        : "Never"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interest Projections */}
                                    <div className="p-4 bg-slate-800/20 rounded-lg border border-slate-700">
                                        <h4 className="text-sm font-semibold text-slate-300 mb-3">Interest Projections</h4>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">24 Hours:</span>
                                                <span className="text-slate-300 font-mono">
                                                    +{(parseFloat(userData.principal) * 0.1 / 365).toFixed(4)} USDC
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">30 Days:</span>
                                                <span className="text-slate-300 font-mono">
                                                    +{(parseFloat(userData.principal) * 0.1 / 12).toFixed(4)} USDC
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">1 Year:</span>
                                                <span className="text-slate-300 font-mono">
                                                    +{(parseFloat(userData.principal) * 0.1).toFixed(4)} USDC
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-xs text-slate-500">
                                            💡 Based on current principal of {formatNumber(userData.principal)} USDC
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No active debt</p>
                                    <p className="text-xs mt-1">Borrow USDC to see interest breakdown</p>
                                </div>
                            )}
                        </div>
                    </ActionCard>

                    {/* Professional Liquidation Interface */}
                    <ActionCard title="Liquidation Interface" icon={Zap}>
                        <div className="space-y-4">
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                                    <div className="text-xs text-yellow-200">
                                        <p className="font-semibold mb-1">Liquidation Requirements</p>
                                        <ul className="space-y-1 text-yellow-300/80">
                                            <li>• Target health factor must be &lt; 1.0</li>
                                            <li>• You receive 10% bonus collateral</li>
                                            <li>• Partial liquidations allowed</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">Target User Address</label>
                                    <input
                                        type="text"
                                        value={liquidateAddress}
                                        onChange={(e) => setLiquidateAddress(e.target.value)}
                                        placeholder="0x..."
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">Debt to Cover (USDC)</label>
                                    <input
                                        type="number"
                                        value={liquidateAmount}
                                        onChange={(e) => setLiquidateAmount(e.target.value)}
                                        placeholder="0.0"
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                    />
                                </div>

                                {liquidateAmount && parseFloat(liquidateAmount) > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                                    >
                                        <div className="text-xs text-slate-400 space-y-2">
                                            <div className="flex justify-between">
                                                <span>Debt Covering:</span>
                                                <span className="text-red-400 font-mono">{liquidateAmount} USDC</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Liquidation Bonus:</span>
                                                <span className="text-green-400 font-mono">10%</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-2">
                                                💡 You'll receive WETH collateral worth {liquidateAmount} USDC + 10% bonus
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <Button
                                    onClick={() => executeLiquidation(liquidateAddress, liquidateAmount)}
                                    disabled={
                                        isLoading || 
                                        !liquidateAddress || 
                                        !liquidateAmount || 
                                        parseFloat(liquidateAmount) <= 0
                                    }
                                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? "Processing..." : "🔥 Execute Liquidation"}
                                </Button>

                                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                    <h4 className="text-xs font-semibold text-slate-300 mb-2">How Liquidation Works</h4>
                                    <div className="text-xs text-slate-500 space-y-1">
                                        <p>1. Find a user with health factor &lt; 1.0</p>
                                        <p>2. Approve USDC to cover their debt</p>
                                        <p>3. Receive their WETH collateral + 10% bonus</p>
                                        <p>4. Profit from the liquidation bonus</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ActionCard>
                </div>

                {/* Protocol Utilization Metrics */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-6 rounded-xl bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-800"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
                            <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold">Protocol Metrics</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                            <div className="text-xs text-slate-400 mb-1">Total Borrowed</div>
                            <div className="text-xl font-bold text-purple-400">
                                {formatNumber(devData.totalBorrowed)} USDC
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Protocol-wide debt</div>
                        </div>
                        
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                            <div className="text-xs text-slate-400 mb-1">Borrow APR</div>
                            <div className="text-xl font-bold text-green-400">10.00%</div>
                            <div className="text-xs text-slate-500 mt-1">Fixed rate</div>
                        </div>
                        
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                            <div className="text-xs text-slate-400 mb-1">Liquidation Threshold</div>
                            <div className="text-xl font-bold text-yellow-400">80%</div>
                            <div className="text-xs text-slate-500 mt-1">Max LTV ratio</div>
                        </div>
                        
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                            <div className="text-xs text-slate-400 mb-1">Liquidation Bonus</div>
                            <div className="text-xl font-bold text-red-400">10%</div>
                            <div className="text-xs text-slate-500 mt-1">Liquidator reward</div>
                        </div>
                    </div>
                </motion.div>

                {/* Dev Mode Toggle */}
                <motion.button
                    onClick={() => setShowDevMode(!showDevMode)}
                    className="w-full mb-4 p-4 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700 rounded-xl transition-all flex items-center justify-between"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <span className="font-semibold">Developer Mode</span>
                    {showDevMode ? <ChevronUp /> : <ChevronDown />}
                </motion.button>

                {/* Dev Mode Panel */}
                <AnimatePresence>
                    {showDevMode && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                {/* Oracle Data - Real from Chainlink */}
                                <DevModeCard title="🔮 Oracle Feeds (Live)">
                                    <div className="space-y-3">
                                        <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-slate-500">WETH/USD</span>
                                                <span className="text-xs font-mono text-blue-400">Chainlink</span>
                                            </div>
                                            <div className="text-lg font-mono font-bold text-green-400">
                                                {devData.wethOracle ? `$${parseFloat(devData.wethOracle.price).toFixed(2)}` : "Loading..."}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Updated: {devData.wethOracle?.updatedAt || "--"}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Age: {devData.wethOracle ? `${devData.wethOracle.age}s (${(devData.wethOracle.age / 3600).toFixed(1)}h)` : "--"}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-slate-500">USDC/USD</span>
                                                <span className="text-xs font-mono text-blue-400">Chainlink</span>
                                            </div>
                                            <div className="text-lg font-mono font-bold text-green-400">
                                                {devData.usdcOracle ? `$${parseFloat(devData.usdcOracle.price).toFixed(4)}` : "Loading..."}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Updated: {devData.usdcOracle?.updatedAt || "--"}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Age: {devData.usdcOracle ? `${devData.usdcOracle.age}s (${(devData.usdcOracle.age / 3600).toFixed(1)}h)` : "--"}
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-2">
                                            💡 Max staleness: 7 days (604800s)
                                        </div>
                                    </div>
                                </DevModeCard>

                                {/* Protocol Metrics - Real from Contract */}
                                <DevModeCard title="📊 Protocol Metrics">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                                            <span className="text-slate-400">Total Borrowed</span>
                                            <span className="font-mono font-bold">{formatNumber(devData.totalBorrowed)} USDC</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                                            <span className="text-slate-400">Liquidation Threshold</span>
                                            <span className="font-mono font-bold text-yellow-400">80%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                                            <span className="text-slate-400">Liquidation Bonus</span>
                                            <span className="font-mono font-bold text-green-400">10%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                                            <span className="text-slate-400">Borrow APR</span>
                                            <span className="font-mono font-bold text-purple-400">10%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                                            <span className="text-slate-400">Interest Accrual</span>
                                            <span className="font-mono text-xs text-slate-500">Per-second</span>
                                        </div>
                                    </div>
                                </DevModeCard>

                                {/* User Position Details */}
                                <DevModeCard title="🎯 Position Details">
                                    <div className="space-y-3">
                                        <div className="p-3 bg-slate-800/30 rounded-lg">
                                            <div className="text-xs text-slate-500 mb-1">Collateral (Raw)</div>
                                            <div className="font-mono text-xs text-green-400 break-all">
                                                {userData.totalCollateral} WETH
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-800/30 rounded-lg">
                                            <div className="text-xs text-slate-500 mb-1">Debt (Raw)</div>
                                            <div className="font-mono text-xs text-red-400 break-all">
                                                {userData.totalBorrowed} USDC
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-800/30 rounded-lg">
                                            <div className="text-xs text-slate-500 mb-1">Health Factor (Raw)</div>
                                            <div className="font-mono text-xs text-blue-400 break-all">
                                                {userData.healthFactor}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-800/30 rounded-lg">
                                            <div className="text-xs text-slate-500 mb-1">Last Accrued</div>
                                            <div className="font-mono text-xs text-slate-400">
                                                {devData.lastAccrued !== "0" ? new Date(Number(devData.lastAccrued) * 1000).toLocaleString() : "Never"}
                                            </div>
                                        </div>
                                    </div>
                                </DevModeCard>
                            </div>

                            {/* Advanced Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Contract Addresses */}
                                <DevModeCard title="📝 Contract Addresses">
                                    <div className="space-y-2">
                                        <div className="p-2 bg-slate-800/30 rounded">
                                            <div className="text-xs text-slate-500">Protocol</div>
                                            <div className="font-mono text-xs text-blue-400 break-all">
                                                {CONTRACTS.LENDING_PROTOCOL}
                                            </div>
                                        </div>
                                        <div className="p-2 bg-slate-800/30 rounded">
                                            <div className="text-xs text-slate-500">WETH</div>
                                            <div className="font-mono text-xs text-green-400 break-all">
                                                {CONTRACTS.WETH}
                                            </div>
                                        </div>
                                        <div className="p-2 bg-slate-800/30 rounded">
                                            <div className="text-xs text-slate-500">USDC</div>
                                            <div className="font-mono text-xs text-purple-400 break-all">
                                                {CONTRACTS.USDC}
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-2">
                                            🔗 Network: Sepolia Testnet
                                        </div>
                                    </div>
                                </DevModeCard>
                            </div>

                            {/* Debug Console */}
                            <DevModeCard title="🐛 Debug Console">
                                <div className="space-y-2">
                                    <div className="p-3 bg-black/50 rounded-lg border border-slate-700 font-mono text-xs">
                                        <div className="text-green-400">$ Connected to Sepolia</div>
                                        <div className="text-blue-400">$ Account: {account?.slice(0, 10)}...{account?.slice(-8)}</div>
                                        <div className="text-yellow-400">$ Protocol: LendingProtocol v1.0</div>
                                        <div className="text-purple-400">$ Decimals: WETH(18) USDC(6)</div>
                                        <div className="text-slate-500">$ Precision: 1e18</div>
                                        <div className="text-slate-500">$ Ready for transactions...</div>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        💡 Open browser console for detailed logs
                                    </div>
                                </div>
                            </DevModeCard>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Transaction History */}
                <TransactionList account={account} />
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: string;
    icon: any;
    color: "green" | "blue" | "purple" | "yellow" | "red";
    subtitle: string;
}) {
    const colorClasses = {
        green: "from-green-500/20 to-emerald-500/20 border-green-500/50",
        blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/50",
        purple: "from-purple-500/20 to-pink-500/20 border-purple-500/50",
        yellow: "from-yellow-500/20 to-orange-500/20 border-yellow-500/50",
        red: "from-red-500/20 to-rose-500/20 border-red-500/50",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className={`p-6 rounded-xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm`}
        >
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-400">{title}</p>
                <Icon className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-2xl font-bold mb-1">{value}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
        </motion.div>
    );
}

// Action Card Component
function ActionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
                    <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">{title}</h2>
            </div>
            {children}
        </motion.div>
    );
}

// Dev Mode Card Component
function DevModeCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
            <h3 className="text-lg font-bold mb-4">{title}</h3>
            {children}
        </div>
    );
}
