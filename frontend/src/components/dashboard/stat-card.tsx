import { ArrowUpRight, ArrowDownLeft, Activity, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: string;
    subValue?: string;
    icon?: "deposit" | "borrow" | "health" | "wallet";
    trend?: "up" | "down" | "neutral";
    className?: string;
}

export function StatCard({ label, value, subValue, icon, trend, className }: StatCardProps) {
    const icons = {
        deposit: ArrowDownLeft,
        borrow: ArrowUpRight,
        health: Activity,
        wallet: Wallet,
    };

    const Icon = icon ? icons[icon] : Activity;

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:bg-white/10",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-medium text-muted-foreground">{label}</p>
                    <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</h3>
                    {subValue && (
                        <p className={cn("mt-1 text-sm font-medium",
                            trend === "up" ? "text-emerald-400" :
                                trend === "down" ? "text-rose-400" : "text-muted-foreground"
                        )}>
                            {subValue}
                        </p>
                    )}
                </div>
                <div className="rounded-full bg-white/10 p-3">
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Glow effect */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl transition-all group-hover:bg-primary/30" />
        </div>
    );
}
