export const CONTRACTS = {
    LENDING_PROTOCOL: "0x3db2787AE4258B4aA30872a972516A0e51e93cFc",
    WETH: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
} as const;

export const LENDING_PROTOCOL_ABI = [{"inputs":[{"internalType":"address","name":"_collateralToken","type":"address"},{"internalType":"address","name":"_borrowToken","type":"address"},{"internalType":"address","name":"_priceFeed","type":"address"},{"internalType":"address","name":"_borrowPriceFeed","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"LENDINGPROTOCOL__amountMoreThanAllowed","type":"error"},{"inputs":[],"name":"LENDINGPROTOCOL__cantWithdrawMoreThanDeposited","type":"error"},{"inputs":[],"name":"LENDINGPROTOCOL__insufficientLiquidity","type":"error"},{"inputs":[],"name":"LENDINGPROTOCOL__oracleError","type":"error"},{"inputs":[],"name":"LENDINGPROTOCOL__userHasNoDebt","type":"error"},{"inputs":[],"name":"LENDINGPROTOCOL__userHasZeroCollateral","type":"error"},{"inputs":[],"name":"LENDINGPROTOCOL__valueMustBeMoreThanZero","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"collateralAmount","type":"uint256"}],"name":"userAddedCollateral","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"borrowAmount","type":"uint256"}],"name":"userBorrowedToken","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"repaidAmount","type":"uint256"}],"name":"userRepaidDebt","type":"event"},{"inputs":[],"name":"BORROW_RATE_PER_SECOND","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"LIQUIDATION_BONUS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"LIQUIDATION_THRESHOLD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_PRICE_AGE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PRECISION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SECONDS_PER_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"borrow","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"borrowPriceFeed","outputs":[{"internalType":"contract AggregatorV3Interface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"borrowToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"collateralToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"depositCollateral","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getHealthFactor","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"lastAccrued","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"debtToCover","type":"uint256"}],"name":"liquidate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"priceFeed","outputs":[{"internalType":"contract AggregatorV3Interface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"repay","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"totalBorrowed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"userToAmountBorrowed","outputs":[{"internalType":"uint256","name":"amountBorrowed","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"userToCollateralDeposited","outputs":[{"internalType":"uint256","name":"collateralDeposited","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawCollateral","outputs":[],"stateMutability":"nonpayable","type":"function"}] as const;

export const ERC20_ABI = [
    {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
    },
] as const;
