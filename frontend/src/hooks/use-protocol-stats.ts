import { useState, useEffect } from "react";
import { ethers, BrowserProvider, Contract } from "ethers";
import { CONTRACTS, LENDING_PROTOCOL_ABI } from "@/config/contracts";

export interface ProtocolStats {
    totalBorrowed: string;
    isLoading: boolean;
}

export function useProtocolStats() {
    const [stats, setStats] = useState<ProtocolStats>({
        totalBorrowed: "0",
        isLoading: true,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Use public provider (no wallet needed for reading)
                const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/YOUR_INFURA_KEY");
                
                // Fallback to window.ethereum if available
                let actualProvider;
                if (window.ethereum) {
                    actualProvider = new BrowserProvider(window.ethereum);
                } else {
                    // Use a public RPC endpoint for Sepolia
                    actualProvider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
                }

                const contract = new Contract(
                    CONTRACTS.LENDING_PROTOCOL,
                    LENDING_PROTOCOL_ABI,
                    actualProvider
                );

                // Fetch total borrowed from contract
                const totalBorrowedBig = await contract.totalBorrowed();
                const totalBorrowedFormatted = ethers.formatUnits(totalBorrowedBig, 6); // USDC has 6 decimals

                setStats({
                    totalBorrowed: totalBorrowedFormatted,
                    isLoading: false,
                });
            } catch (error) {
                console.error("Error fetching protocol stats:", error);
                setStats({
                    totalBorrowed: "0",
                    isLoading: false,
                });
            }
        };

        fetchStats();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        
        return () => clearInterval(interval);
    }, []);

    return stats;
}
