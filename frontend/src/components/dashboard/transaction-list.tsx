import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import { CONTRACTS, LENDING_PROTOCOL_ABI } from "@/config/contracts";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, ExternalLink } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface Transaction {
    type: "deposit" | "borrow" | "repay" | "withdraw";
    amount: string;
    timestamp: number;
    txHash: string;
}

export function TransactionList({ account }: { account: string }) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchTransactions = async () => {
        if (!account || !window.ethereum) return;
        setIsLoading(true);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(
                CONTRACTS.LENDING_PROTOCOL,
                LENDING_PROTOCOL_ABI,
                provider
            );

            // Events are NOW indexed! We can filter by user address directly
            const depositFilter = contract.filters.userAddedCollateral(account);
            const borrowFilter = contract.filters.userBorrowedToken(account);
            const repayFilter = contract.filters.userRepaidDebt(account);

            const [depositEvents, borrowEvents, repayEvents] = await Promise.all([
                contract.queryFilter(depositFilter, -10000),
                contract.queryFilter(borrowFilter, -10000),
                contract.queryFilter(repayFilter, -10000),
            ]);

            const txs: Transaction[] = [];

            // No need for client-side filtering - events are already filtered by user
            depositEvents.forEach((event: any) => {
                txs.push({
                    type: "deposit",
                    amount: ethers.formatUnits(event.args.collateralAmount, 18), // WETH 18 decimals
                    timestamp: Date.now(),
                    txHash: event.transactionHash,
                });
            });

            borrowEvents.forEach((event: any) => {
                txs.push({
                    type: "borrow",
                    amount: ethers.formatUnits(event.args.borrowAmount, 6), // USDC 6 decimals
                    timestamp: Date.now(),
                    txHash: event.transactionHash,
                });
            });

            repayEvents.forEach((event: any) => {
                txs.push({
                    type: "repay",
                    amount: ethers.formatUnits(event.args.repaidAmount, 6), // USDC 6 decimals
                    timestamp: Date.now(),
                    txHash: event.transactionHash,
                });
            });

            // Sort by timestamp descending
            txs.sort((a, b) => b.timestamp - a.timestamp);
            setTransactions(txs.slice(0, 10)); // Show last 10
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [account]);

    const getIcon = (type: string) => {
        switch (type) {
            case "deposit":
                return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
            case "borrow":
                return <ArrowUpCircle className="w-5 h-5 text-blue-500" />;
            case "repay":
                return <RefreshCw className="w-5 h-5 text-purple-500" />;
            default:
                return <ArrowUpCircle className="w-5 h-5 text-slate-500" />;
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case "deposit":
                return "Deposited";
            case "borrow":
                return "Borrowed";
            case "repay":
                return "Repaid";
            case "withdraw":
                return "Withdrew";
            default:
                return type;
        }
    };

    return (
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Recent Transactions</h2>
                <button
                    onClick={fetchTransactions}
                    disabled={isLoading}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <p>No transactions yet</p>
                    <p className="text-sm mt-2">Your transaction history will appear here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map((tx, index) => (
                        <motion.div
                            key={tx.txHash + index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {getIcon(tx.type)}
                                <div>
                                    <p className="font-semibold">{getLabel(tx.type)}</p>
                                    <p className="text-sm text-slate-400">
                                        {formatNumber(tx.amount)} {tx.type === "deposit" ? "WETH" : "USDC"}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <ExternalLink className="w-4 h-4 text-slate-400" />
                            </a>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
