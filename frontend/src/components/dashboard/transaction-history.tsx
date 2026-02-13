import { formatDistanceToNow } from "date-fns";
import { Activity, ArrowUpRight, ArrowDownLeft, AlertTriangle } from "lucide-react";

export type TransactionType = "deposit" | "borrow" | "repay" | "liquidate";

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: string;
    token: string;
    timestamp: Date;
    hash: string;
}

interface TransactionHistoryProps {
    transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
    if (transactions.length === 0) {
        return (
            <div className="flex h-48 w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <Activity className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <div className="border-b border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="divide-y divide-white/10">
                {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 transition-colors hover:bg-white/5">
                        <div className="flex items-center gap-4">
                            <div className={`rounded-full p-2 ${tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-500' :
                                    tx.type === 'borrow' ? 'bg-blue-500/20 text-blue-500' :
                                        tx.type === 'repay' ? 'bg-purple-500/20 text-purple-500' :
                                            'bg-rose-500/20 text-rose-500'
                                }`}>
                                {tx.type === 'deposit' && <ArrowDownLeft className="h-4 w-4" />}
                                {tx.type === 'borrow' && <ArrowUpRight className="h-4 w-4" />}
                                {tx.type === 'repay' && <ArrowDownLeft className="h-4 w-4" />}
                                {tx.type === 'liquidate' && <AlertTriangle className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="font-medium text-white capitalize">{tx.type} {tx.token}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-medium text-white">
                                {tx.type === 'borrow' ? '+' : ''}
                                {tx.type === 'repay' ? '-' : ''}
                                {tx.amount}
                            </p>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                            >
                                View on Explorer
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
