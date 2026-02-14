import { Home, BookOpen, ArrowRight, Shield, Zap, BarChart3, Info, TrendingUp, Lock, Gauge, Globe } from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Hero } from "@/components/ui/hero-1";
import { GlowCard } from "@/components/ui/spotlight-card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useProtocolStats } from "@/hooks/use-protocol-stats";
import { formatNumber } from "@/lib/utils";

const navItems = [
    { name: "Home", url: "/", icon: Home },
    { name: "About", url: "#about", icon: Info },
    { name: "Docs", url: "/docs", icon: BookOpen },
    { name: "Get Started", url: "/dashboard", icon: ArrowRight },
];

const staticStats = [
    { label: "Active Users", value: "10+", change: "+8.3%" },
    { label: "Liquidation Threshold", value: "80%", change: "Stable" },
    { label: "Borrow APR", value: "10%", change: "Fixed" },
];

const features = [
    {
        icon: Lock,
        title: "Non-Custodial",
        description: "You maintain full control of your assets. Smart contracts handle all operations without intermediaries."
    },
    {
        icon: Gauge,
        title: "Real-Time Health Factor",
        description: "Monitor your position health in real-time with instant updates from Chainlink price feeds."
    },
    {
        icon: TrendingUp,
        title: "Competitive Rates",
        description: "Fixed 10% APR with per-second compounding. No hidden fees or variable rate surprises."
    },
    {
        icon: Globe,
        title: "Ethereum Network",
        description: "Built on Ethereum for maximum security and decentralization. Deployed on Sepolia testnet."
    },
];

const howItWorks = [
    {
        step: "01",
        title: "Connect Wallet",
        description: "Connect your MetaMask wallet to access the protocol. No registration or KYC required."
    },
    {
        step: "02",
        title: "Deposit Collateral",
        description: "Deposit WETH as collateral. Your assets remain in the smart contract under your control."
    },
    {
        step: "03",
        title: "Borrow USDC",
        description: "Borrow up to 80% of your collateral value in USDC. Monitor your health factor in real-time."
    },
    {
        step: "04",
        title: "Manage Position",
        description: "Repay debt, add collateral, or withdraw at any time. Full flexibility with your position."
    },
];

export default function Landing() {
    const { totalBorrowed, isLoading } = useProtocolStats();

    // Combine dynamic and static stats
    const stats = [
        { 
            label: "Total Debt Borrowed", 
            value: isLoading ? "Loading..." : `${formatNumber(totalBorrowed)} USDC`,
            change: "Live"
        },
        ...staticStats
    ];

    return (
        <>
            <NavBar items={navItems} />
            <Hero
                title="Orwex - Deposit. Borrow. Earn."
                subtitle="Deposit collateral, borrow against real-time oracle pricing, and maintain solvency through automated health factor enforcement and liquidation safeguards."
                eyebrow="V1 - LIVE (TestNet)"
                ctaLabel="Get Started"
                ctaHref="/dashboard"
            />

            {/* Stats Section */}
            <section className="relative z-10 bg-gradient-to-b from-background to-slate-950 px-6 py-16 md:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300">
                                    <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                                    <div className="text-sm text-slate-400 mb-2">{stat.label}</div>
                                    <div className="text-xs text-green-400">{stat.change}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Spotlight Cards Section */}
            <section id="about" className="relative z-10 bg-slate-950 px-6 py-24 md:px-8">
                <div className="mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl mb-4">
                            Why Choose Orwex Protocol
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Built on Ethereum with Chainlink oracles, offering transparent lending with real-time price feeds and automated risk management.
                        </p>
                    </motion.div>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-10 px-4 md:px-0">
                        <GlowCard glowColor="blue" size="lg" className="flex flex-col items-start justify-end w-full max-w-[85vw] md:max-w-none">
                            <div className="relative z-10 flex flex-col gap-3">
                                <Shield className="w-8 h-8 text-blue-400" />
                                <h3 className="text-lg font-semibold text-white">Secure & Transparent</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Smart contract-based lending with Chainlink price feeds. Every transaction is verifiable on-chain with full transparency.
                                </p>
                            </div>
                        </GlowCard>

                        <GlowCard glowColor="purple" size="lg" className="flex flex-col items-start justify-end w-full max-w-[85vw] md:max-w-none">
                            <div className="relative z-10 flex flex-col gap-3">
                                <Zap className="w-8 h-8 text-purple-400" />
                                <h3 className="text-lg font-semibold text-white">Real-Time Oracles</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Powered by Chainlink price feeds for accurate WETH and USDC valuations. Borrow with confidence using live market data.
                                </p>
                            </div>
                        </GlowCard>

                        <GlowCard glowColor="green" size="lg" className="flex flex-col items-start justify-end w-full max-w-[85vw] md:max-w-none">
                            <div className="relative z-10 flex flex-col gap-3">
                                <BarChart3 className="w-8 h-8 text-emerald-400" />
                                <h3 className="text-lg font-semibold text-white">Automated Risk Management</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Health factor monitoring with 80% LTV ratio. Automated liquidations protect the protocol and reward liquidators with 10% bonus.
                                </p>
                            </div>
                        </GlowCard>
                    </div>
                </div>
            </section>

            {/* Features Grid Section */}
            <section className="relative z-10 bg-gradient-to-b from-slate-950 to-slate-900 px-6 py-24 md:px-8 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />
                
                <div className="relative mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl mb-4">
                            Built for DeFi Natives
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Every feature designed with security, transparency, and user experience in mind.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                                <div className="relative bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 h-full">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <feature.icon className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="relative z-10 bg-slate-900 px-6 py-24 md:px-8">
                <div className="mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl mb-4">
                            How It Works
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Get started with Orwex in four simple steps. No complex processes, just straightforward DeFi lending.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {howItWorks.map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                className="relative"
                            >
                                {index < howItWorks.length - 1 && (
                                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent" />
                                )}
                                <div className="relative">
                                    <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-600 mb-4">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 bg-gradient-to-b from-slate-900 to-black px-6 py-24 md:px-8">
                <div className="mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-12 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Orwex's code is open source.
                            </h2>
                            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                                Learn, modify or just explore the code. Make the future of decentralized finance.
                            </p>
                            <Button
                                onClick={() => window.open('https://github.com/Ary0520/Orwex---Deposit.-Borrow.-Earn.', '_blank', 'noopener,noreferrer')}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group"
                            >
                                Github
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 bg-black border-t border-slate-800 px-6 py-12 md:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            
                            <div>
                                <div className="text-white font-semibold">Orwex Protocol</div>
                                <div className="text-slate-500 text-sm">Decentralized Lending</div>
                            </div>
                        </div>
                        <div className="flex gap-8 text-sm text-slate-400">
                            <a href="#" className="hover:text-white transition-colors">Documentation</a>
                            <a href="#" className="hover:text-white transition-colors">GitHub</a>
                            <a href="#" className="hover:text-white transition-colors">Twitter</a>
                            <a href="#" className="hover:text-white transition-colors">Discord</a>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
                        <p>© 2026 Orwex Protocol. Built on Ethereum. Powered by Chainlink.</p>
                    </div>
                </div>
            </footer>
        </>
    );
}
