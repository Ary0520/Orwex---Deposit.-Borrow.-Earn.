import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS, LENDING_PROTOCOL_ABI } from "@/config/contracts";

interface OracleData {
    price: string;
    updatedAt: string;
    age: number;
    decimals: number;
}

interface DevModeData {
    wethOracle: OracleData | null;
    usdcOracle: OracleData | null;
    totalBorrowed: string;
    lastAccrued: string;
    isLoading: boolean;
}

export function useDevModeData(account: string | null, provider: any) {
    const [data, setData] = useState<DevModeData>({
        wethOracle: null,
        usdcOracle: null,
        totalBorrowed: "0",
        lastAccrued: "0",
        isLoading: true,
    });

    useEffect(() => {
        if (!account || !provider) return;

        const fetchDevData = async () => {
            try {
                const contract = new ethers.Contract(
                    CONTRACTS.LENDING_PROTOCOL,
                    LENDING_PROTOCOL_ABI,
                    provider
                );

                // Get oracle addresses
                const wethPriceFeed = await contract.priceFeed();
                const usdcPriceFeed = await contract.borrowPriceFeed();

                // Oracle ABI
                const oracleABI = [
                    "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
                    "function decimals() external view returns (uint8)"
                ];

                // Fetch WETH oracle data
                const wethOracle = new ethers.Contract(wethPriceFeed, oracleABI, provider);
                const wethData = await wethOracle.latestRoundData();
                const wethDecimals = await wethOracle.decimals();
                const wethAge = Math.floor(Date.now() / 1000) - Number(wethData.updatedAt);

                // Fetch USDC oracle data
                const usdcOracle = new ethers.Contract(usdcPriceFeed, oracleABI, provider);
                const usdcData = await usdcOracle.latestRoundData();
                const usdcDecimals = await usdcOracle.decimals();
                const usdcAge = Math.floor(Date.now() / 1000) - Number(usdcData.updatedAt);

                // Fetch protocol metrics
                const totalBorrowed = await contract.totalBorrowed();
                const lastAccrued = await contract.lastAccrued(account);

                setData({
                    wethOracle: {
                        price: ethers.formatUnits(wethData.answer, wethDecimals),
                        updatedAt: new Date(Number(wethData.updatedAt) * 1000).toLocaleString(),
                        age: wethAge,
                        decimals: wethDecimals,
                    },
                    usdcOracle: {
                        price: ethers.formatUnits(usdcData.answer, usdcDecimals),
                        updatedAt: new Date(Number(usdcData.updatedAt) * 1000).toLocaleString(),
                        age: usdcAge,
                        decimals: usdcDecimals,
                    },
                    totalBorrowed: ethers.formatUnits(totalBorrowed, 6), // USDC 6 decimals
                    lastAccrued: lastAccrued.toString(),
                    isLoading: false,
                });
            } catch (error) {
                console.error("Error fetching dev mode data:", error);
                setData(prev => ({ ...prev, isLoading: false }));
            }
        };

        fetchDevData();
        const interval = setInterval(fetchDevData, 30000); // Refresh every 30s

        return () => clearInterval(interval);
    }, [account, provider]);

    return data;
}
