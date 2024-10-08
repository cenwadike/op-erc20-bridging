async function bridgeERC20Token() {
    // console.log("--------- Setup Begin ---------")

    // import dependencies
    const optimism = require("@eth-optimism/sdk");
    const ethers = require("ethers");

    // get private key
    const privateKey = process.env.TUTORIAL_PRIVATE_KEY;

    // create RPC and wallets 
    const l1Provider = new ethers.providers.StaticJsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
    const l2Provider = new ethers.providers.StaticJsonRpcProvider("https://sepolia.optimism.io");
    const l1Wallet = new ethers.Wallet(privateKey, l1Provider);
    const l2Wallet = new ethers.Wallet(privateKey, l2Provider);

    console.log("L1 wallet: ", l1Wallet.address);
    console.log("L2 wallet: ", l2Wallet.address);

    // Set the L1 and L2 ERC-20 addresses
    const l1Token = "0x5589BB8228C07c4e15558875fAf2B859f678d129";
    const l2Token = "0xD08a2917653d4E460893203471f0000826fb4034";

    console.log("L1 Token: ", l1Token);
    console.log("L2 Token: ", l2Token);

    // --------- Get L1 Tokens ---------

    // Set the ERC20 ABI
    const erc20ABI = [
        {   constant: true, 
            inputs: [{ name: "_owner", type: "address" }], 
            name: "balanceOf", 
            outputs: [{ name: "balance", type: "uint256" }], 
            type: "function" 
        }, 
        {   inputs: [], 
            name: "faucet", 
            outputs: [], 
            stateMutability: "nonpayable", 
            type: "function" 
        }
    ];

    // Create a Contract instance for the L1 token
    const l1ERC20 = new ethers.Contract(l1Token, erc20ABI, l1Wallet);

    // Request some tokens
    tx = await l1ERC20.faucet();
    await tx.wait();

    // check your token balance
    const l1TokenBalanceBeforeActivity = await l1ERC20.balanceOf(l1Wallet.address);
    console.log("L1 token balance before activity: ", l1TokenBalanceBeforeActivity.toString());

    console.log("--------- Setup Complete ---------")

    // // --------- Deposit Tokens ---------
    // console.log("--------- Deposit Tokens ---------")
    // // Define the amount to deposit
    // const oneToken = 1000000000000000000n;

    // Create a CrossChainMessenger instance
    const messenger = new optimism.CrossChainMessenger({
        l1ChainId: 11155111, // 11155111 for Sepolia, 1 for Ethereum
        l2ChainId: 11155420, // 11155420 for OP Sepolia, 10 for OP Mainnet
        l1SignerOrProvider: l1Wallet,
        l2SignerOrProvider: l2Wallet,
    });

    // // Allow the Standard Bridge to access your tokens
    // tx = await messenger.approveERC20(l1Token, l2Token, oneToken);
    // await tx.wait();

    // // Deposit your tokens
    // tx = await messenger.depositERC20(l1Token, l2Token, oneToken);
    // await tx.wait();

    // // Wait for the deposit to be relayed
    // await messenger.waitForMessageStatus(tx.hash, optimism.MessageStatus.RELAYED);

    // // Check your token balance on L1
    // const l1Balance = await l1ERC20.balanceOf(l1Wallet.address);
    // console.log("L1 token balance: ", l1Balance.toString());

    // // Create a Contract instance for the L2 token
    // const l2ERC20 = new ethers.Contract(l2Token, erc20ABI, l2Wallet);

    // // Check your token balance on L2
    // const l2Balance = await l2ERC20.balanceOf(l2Wallet.address)
    // console.log("L2 token balance: ", l2Balance.toString());

    // // --------- Withdraw Tokens ---------
    // console.log("--------- Withdraw Tokens ---------")

    // // Start your withdrawal on L2
    // const withdrawal = await messenger.withdrawERC20(l1Token, l2Token, oneToken);
    // await withdrawal.wait();

    // // Check your token balance on L2
    // const l2TokenBalance = await l2ERC20.balanceOf(l2Wallet.address);
    // console.log("token balance on L2: ", l2TokenBalance.toString());

    const hash = "0x494e56720a3bfef1084aa6c7adac4125d6f6fb547f826127467a829ddf78ab9b";
    // Wait until the withdrawal is ready to prove
    await messenger.waitForMessageStatus(hash, optimism.MessageStatus.READY_TO_PROVE);
    
    console.log("withdrawal is ready to prove");

    // console.log("withdraw hash: ", withdrawal.hash);

    // Prove the withdrawal on L1
    await messenger.proveMessage(hash);

    // Wait until the withdrawal is ready for relay
    await messenger.waitForMessageStatus(hash, optimism.MessageStatus.READY_FOR_RELAY);
   
    console.log("withdrawal is ready for relay");

    // Relay the withdrawal on L1
    await messenger.finalizeMessage(hash);

    // Wait until the withdrawal is relayed
    await messenger.waitForMessageStatus(hash, optimism.MessageStatus.RELAYED);
    console.log("withdrawal is relayed");

    // Check your token balance on L1
    const l1TokenBalance = await l1ERC20.balanceOf(l1Wallet.address);
    console.log("L1 token balance: ", l1TokenBalance.toString());
}

try {
    bridgeERC20Token()
} catch (error) {
    console.error("Failed to run script with error: ", error);
}
