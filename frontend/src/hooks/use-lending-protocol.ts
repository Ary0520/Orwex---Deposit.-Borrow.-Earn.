import { useState, useEffect, useCallback } from "react";
import { ethers, BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import { CONTRACTS, LENDING_PROTOCOL_ABI, ERC20_ABI } from "@/config/contracts";
import { toast } from "react-hot-toast";

export interface UserData {
    healthFactor: string;
    totalCollateral: string;
    totalBorrowed: string;
    wethBalance: string;
    usdcBalance: string;
    lastAccrued: number;
    accruedInterest: string;
    principal: string;
}

export function useLendingProtocol() {
    const [account, setAccount] = useState<string | null>(null);
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [protocolContract, setProtocolContract] = useState<Contract | null>(null);

    const [userData, setUserData] = useState<UserData>({
        healthFactor: "0",
        totalCollateral: "0",
        totalBorrowed: "0",
        wethBalance: "0",
        usdcBalance: "0",
        lastAccrued: 0,
        accruedInterest: "0",
        principal: "0",
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error("Please install MetaMask!");
            return;
        }

        try {
            const _provider = new ethers.BrowserProvider(window.ethereum);
            const _signer = await _provider.getSigner();
            const _account = await _signer.getAddress();

            setProvider(_provider);
            setSigner(_signer);
            setAccount(_account);

            const _contract = new ethers.Contract(
                CONTRACTS.LENDING_PROTOCOL,
                LENDING_PROTOCOL_ABI,
                _signer
            );
            setProtocolContract(_contract);

            toast.success("Wallet connected!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to connect wallet");
        }
    };

    const fetchUserData = useCallback(async () => {
        if (!account || !protocolContract || !provider) return;

        try {
            // Fetch Health Factor from contract
            let hf = "0";
            try {
                const hfBig = await protocolContract.getHealthFactor(account);
                const maxUint = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
                hf = hfBig.toString() === maxUint ? "∞" : formatUnits(hfBig, 18);
            } catch (e: any) {
                if (e.message.includes("userHasNoDebt") || e.message.includes("division by zero")) {
                    hf = "∞";
                }
            }

            // Fetch Collateral Deposited (WETH - 18 decimals)
            const collateralBig = await protocolContract.userToCollateralDeposited(account);

            // Fetch Amount Borrowed (USDC - 6 decimals) - This includes accrued interest
            const borrowedBig = await protocolContract.userToAmountBorrowed(account);
            
            // Fetch last accrued timestamp
            const lastAccruedBig = await protocolContract.lastAccrued(account);
            const lastAccruedTimestamp = Number(lastAccruedBig);

            // Calculate pending interest (not yet added to contract)
            const BORROW_RATE_PER_SECOND = 10 * 1e18 / 100 / (365 * 24 * 60 * 60);
            const currentTime = Math.floor(Date.now() / 1000);
            const elapsed = lastAccruedTimestamp > 0 ? currentTime - lastAccruedTimestamp : 0;
            const borrowedNum = Number(formatUnits(borrowedBig, 6));
            const pendingInterest = borrowedNum > 0 ? (borrowedNum * BORROW_RATE_PER_SECOND * elapsed) / 1e18 : 0;

            // Total debt = on-chain debt + pending interest
            const totalDebt = borrowedNum + pendingInterest;

            // Fetch Token Balances
            const wethContract = new ethers.Contract(CONTRACTS.WETH, ERC20_ABI, provider);
            const usdcContract = new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, provider);

            const wethBal = await wethContract.balanceOf(account);
            const usdcBal = await usdcContract.balanceOf(account);

            setUserData({
                healthFactor: hf,
                totalCollateral: formatUnits(collateralBig, 18),
                totalBorrowed: totalDebt.toFixed(6),
                wethBalance: formatUnits(wethBal, 18),
                usdcBalance: formatUnits(usdcBal, 6),
                lastAccrued: lastAccruedTimestamp,
                accruedInterest: pendingInterest.toFixed(6),
                principal: borrowedNum.toFixed(6),
            });
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }, [account, protocolContract, provider]);

    // Initial fetch loop
    useEffect(() => {
        if (account) {
            fetchUserData();
            const interval = setInterval(fetchUserData, 10000); // Refresh every 10s
            return () => clearInterval(interval);
        }
    }, [account, fetchUserData]);

    // Actions
    const approveAndDeposit = async (amount: string) => {
        if (!protocolContract || !signer) return;
        setIsLoading(true);
        try {
            const amountWei = parseUnits(amount, 18); // WETH 18 decimals
            const wethContract = new ethers.Contract(CONTRACTS.WETH, ERC20_ABI, signer);

            // Approve
            const txApprove = await wethContract.approve(CONTRACTS.LENDING_PROTOCOL, amountWei);
            await txApprove.wait();
            toast.success("WETH Approved!");

            // Deposit
            const txDeposit = await protocolContract.depositCollateral(amountWei);
            await txDeposit.wait();

            toast.success(`Deposited ${amount} WETH`);
            fetchUserData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.reason || "Deposit failed");
        } finally {
            setIsLoading(false);
        }
    };

    const executeBorrow = async (amount: string) => {
        if (!protocolContract || !account || !provider) return;
        setIsLoading(true);
        try {
            // Debug: Check actual collateral on-chain before borrowing
            const collateralOnChain = await protocolContract.userToCollateralDeposited(account);
            console.log("🔍 Collateral on-chain:", ethers.formatUnits(collateralOnChain, 18), "WETH");
            
            const debtOnChain = await protocolContract.userToAmountBorrowed(account);
            console.log("🔍 Debt on-chain:", ethers.formatUnits(debtOnChain, 6), "USDC");
            
            // Check protocol USDC balance
            const usdcContract = new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, provider);
            const protocolUsdcBalance = await usdcContract.balanceOf(CONTRACTS.LENDING_PROTOCOL);
            console.log("🔍 Protocol USDC balance:", ethers.formatUnits(protocolUsdcBalance, 6), "USDC");
            
            // Check oracle prices
            try {
                const wethPriceFeed = await protocolContract.priceFeed();
                const usdcPriceFeed = await protocolContract.borrowPriceFeed();
                console.log("🔍 WETH Price Feed:", wethPriceFeed);
                console.log("🔍 USDC Price Feed:", usdcPriceFeed);
                
                // Read MAX_PRICE_AGE from contract
                const maxPriceAge = await protocolContract.MAX_PRICE_AGE();
                const maxPriceAgeSeconds = Number(maxPriceAge);
                console.log("🔍 MAX_PRICE_AGE from contract:", maxPriceAgeSeconds, "seconds (", maxPriceAgeSeconds / 86400, "days)");
                
                // Read oracle data directly
                const AggregatorV3InterfaceABI = [
                    "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
                    "function decimals() external view returns (uint8)"
                ];
                
                const wethOracle = new ethers.Contract(wethPriceFeed, AggregatorV3InterfaceABI, provider);
                const usdcOracle = new ethers.Contract(usdcPriceFeed, AggregatorV3InterfaceABI, provider);
                
                const wethData = await wethOracle.latestRoundData();
                const usdcData = await usdcOracle.latestRoundData();
                const wethDecimals = await wethOracle.decimals();
                const usdcDecimals = await usdcOracle.decimals();
                
                console.log("🔍 WETH Oracle Data:");
                console.log("  - Price:", ethers.formatUnits(wethData.answer, wethDecimals));
                console.log("  - Updated At:", new Date(Number(wethData.updatedAt) * 1000).toLocaleString());
                console.log("  - Age (seconds):", Math.floor(Date.now() / 1000) - Number(wethData.updatedAt));
                console.log("  - Max Age Allowed:", maxPriceAgeSeconds, "seconds (", maxPriceAgeSeconds / 86400, "days)");
                
                console.log("🔍 USDC Oracle Data:");
                console.log("  - Price:", ethers.formatUnits(usdcData.answer, usdcDecimals));
                console.log("  - Updated At:", new Date(Number(usdcData.updatedAt) * 1000).toLocaleString());
                console.log("  - Age (seconds):", Math.floor(Date.now() / 1000) - Number(usdcData.updatedAt));
                
                // Check if data is stale using contract's MAX_PRICE_AGE
                const currentTime = Math.floor(Date.now() / 1000);
                const wethAge = currentTime - Number(wethData.updatedAt);
                const usdcAge = currentTime - Number(usdcData.updatedAt);
                
                if (wethAge > maxPriceAgeSeconds) {
                    console.error("❌ WETH price feed is STALE! Age:", wethAge, "seconds");
                    toast.error(`WETH oracle data is stale (${Math.floor(wethAge / 86400)} days old). Testnet oracles may not be updating.`);
                    setIsLoading(false);
                    return;
                }
                
                if (usdcAge > maxPriceAgeSeconds) {
                    console.error("❌ USDC price feed is STALE! Age:", usdcAge, "seconds");
                    toast.error(`USDC oracle data is stale (${Math.floor(usdcAge / 86400)} days old). Testnet oracles may not be updating.`);
                    setIsLoading(false);
                    return;
                }
                
                if (wethData.answer <= 0) {
                    console.error("❌ WETH price is invalid:", wethData.answer.toString());
                    toast.error("WETH oracle returning invalid price (≤0)");
                    setIsLoading(false);
                    return;
                }
                
                if (usdcData.answer <= 0) {
                    console.error("❌ USDC price is invalid:", usdcData.answer.toString());
                    toast.error("USDC oracle returning invalid price (≤0)");
                    setIsLoading(false);
                    return;
                }
                
                console.log("✅ All oracle checks passed!");
                
                // Try to read health factor (this will test oracle access)
                try {
                    const hf = await protocolContract.getHealthFactor(account);
                    console.log("🔍 Health Factor from contract:", ethers.formatUnits(hf, 18));
                } catch (hfError: any) {
                    console.error("❌ Health Factor call failed:", hfError.message);
                }
            } catch (oracleError: any) {
                console.error("❌ Oracle check failed:", oracleError.message);
                toast.error("Failed to read oracle data: " + oracleError.message);
                setIsLoading(false);
                return;
            }
            
            if (collateralOnChain.toString() === "0") {
                toast.error("Contract shows zero collateral. Please deposit WETH first.");
                setIsLoading(false);
                return;
            }
            
            // USDC has 6 decimals
            const amountWei = parseUnits(amount, 6);
            console.log("🔍 Attempting to borrow:", amount, "USDC (", amountWei.toString(), "wei)");
            
            // Try to simulate the call first
            try {
                await protocolContract.borrow.staticCall(amountWei);
                console.log("✅ Static call succeeded, sending transaction...");
            } catch (staticError: any) {
                console.error("❌ Static call failed:", staticError);
                throw staticError;
            }
            
            const tx = await protocolContract.borrow(amountWei);
            console.log("✅ Transaction sent:", tx.hash);
            await tx.wait();
            toast.success(`Borrowed ${amount} USDC`);
            fetchUserData();
        } catch (error: any) {
            console.error("❌ Borrow error:", error);
            
            // Decode specific error messages
            let errorMessage = "Borrow failed";
            
            if (error.data === "0xae5f2dc4") {
                errorMessage = "No collateral deposited. Please deposit WETH first.";
            } else if (error.data === "0x3f85dbc9") {
                errorMessage = "Insufficient protocol liquidity. The protocol needs USDC to lend.";
            } else if (error.data === "0x7fcf5e4e") {
                errorMessage = "Borrow amount too high. Would drop health factor below 1.0.";
            } else if (error.message?.includes("userHasZeroCollateral")) {
                errorMessage = "No collateral deposited. Please deposit WETH first.";
            } else if (error.message?.includes("insufficientLiquidity")) {
                errorMessage = "Insufficient protocol liquidity. The protocol needs USDC to lend.";
            } else if (error.message?.includes("amountMoreThanAllowed")) {
                errorMessage = "Borrow amount too high. Would drop health factor below 1.0.";
            } else if (error.message?.includes("oracleError")) {
                errorMessage = "Oracle price feed error. Price data may be stale or invalid.";
            } else {
                errorMessage = error.reason || error.message || "Borrow failed";
            }
            
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const executeRepay = async (amount: string) => {
        if (!protocolContract || !signer) return;
        setIsLoading(true);
        try {
            // USDC has 6 decimals
            const amountWei = parseUnits(amount, 6);

            // Approve USDC
            const usdcContract = new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, signer);
            const txApprove = await usdcContract.approve(CONTRACTS.LENDING_PROTOCOL, amountWei);
            await txApprove.wait();

            // Repay
            const tx = await protocolContract.repay(amountWei);
            await tx.wait();
            toast.success(`Repaid ${amount} USDC`);
            fetchUserData();
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.reason || error.message || "Repay failed";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const withdrawCollateral = async (amount: string) => {
        if (!protocolContract) return;
        setIsLoading(true);
        try {
            const amountWei = parseUnits(amount, 18);
            const tx = await protocolContract.withdrawCollateral(amountWei);
            await tx.wait();
            toast.success(`Withdrew ${amount} WETH`);
            fetchUserData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.reason || "Withdrawal failed");
        } finally {
            setIsLoading(false);
        }
    };

    const executeLiquidation = async (targetUser: string, debtToCover: string) => {
        if (!protocolContract || !signer || !provider) return;
        setIsLoading(true);
        try {
            // Validate address
            if (!ethers.isAddress(targetUser)) {
                toast.error("Invalid address");
                setIsLoading(false);
                return;
            }

            // Check target user's health factor
            const targetHF = await protocolContract.getHealthFactor(targetUser);
            const targetHFNum = parseFloat(formatUnits(targetHF, 18));
            
            if (targetHFNum >= 1.0) {
                toast.error(`Cannot liquidate: Health factor is ${targetHFNum.toFixed(2)} (must be < 1.0)`);
                setIsLoading(false);
                return;
            }

            // Get target user's debt
            const targetDebt = await protocolContract.userToAmountBorrowed(targetUser);
            const targetDebtFormatted = formatUnits(targetDebt, 6);
            
            if (parseFloat(targetDebtFormatted) === 0) {
                toast.error("Target user has no debt");
                setIsLoading(false);
                return;
            }

            // Parse debt to cover (USDC has 6 decimals)
            const debtToCoverWei = parseUnits(debtToCover, 6);
            
            // Check liquidator has enough USDC
            const usdcContract = new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, provider);
            const liquidatorBalance = await usdcContract.balanceOf(account!);
            
            if (liquidatorBalance < debtToCoverWei) {
                toast.error("Insufficient USDC balance to cover debt");
                setIsLoading(false);
                return;
            }

            // Approve USDC
            const txApprove = await usdcContract.approve(CONTRACTS.LENDING_PROTOCOL, debtToCoverWei);
            await txApprove.wait();
            toast.success("USDC Approved for liquidation");

            // Execute liquidation
            const tx = await protocolContract.liquidate(targetUser, debtToCoverWei);
            await tx.wait();
            
            toast.success(`Liquidation successful! Covered ${debtToCover} USDC debt`);
            fetchUserData();
        } catch (error: any) {
            console.error("Liquidation error:", error);
            
            let errorMessage = "Liquidation failed";
            if (error.message?.includes("amountMoreThanAllowed")) {
                errorMessage = "Cannot liquidate: Health factor is above 1.0";
            } else if (error.message?.includes("userHasNoDebt")) {
                errorMessage = "Target user has no debt to liquidate";
            } else {
                errorMessage = error.reason || error.message || "Liquidation failed";
            }
            
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
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
    };
}


