// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Marketplace.sol";
import "../src/NFT.sol";

/**
 * @title Deploy
 * @notice Deployment script for NFT Marketplace contracts
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
 */
contract Deploy is Script {
    function run() external {
        // Load private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy marketplace (which deploys the NFT contract)
        NFTMarketplace marketplace = new NFTMarketplace();

        // Get the NFT contract address
        address nftAddress = marketplace.getNFTContractAddress();

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("========================================");
        console.log("Deployment successful!");
        console.log("========================================");
        console.log("NFTMarketplace:", address(marketplace));
        console.log("NFT Contract:", nftAddress);
        console.log("========================================");

        // Write addresses to a file for the frontend
        string memory deploymentInfo = string(
            abi.encodePacked(
                "{\n",
                '  "marketplace": "',
                vm.toString(address(marketplace)),
                '",\n',
                '  "nft": "',
                vm.toString(nftAddress),
                '",\n',
                '  "deployer": "',
                vm.toString(deployer),
                '",\n',
                '  "chainId": ',
                vm.toString(block.chainid),
                "\n}"
            )
        );

        vm.writeFile("deployments/latest.json", deploymentInfo);
        console.log("Deployment info written to deployments/latest.json");
    }
}

/**
 * @title DeployLocal
 * @notice Deployment script for local development with Anvil
 * @dev Run with: forge script script/Deploy.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast
 */
contract DeployLocal is Script {
    function run() external {
        // Use Anvil's default private key for local development
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying to local network...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy marketplace
        NFTMarketplace marketplace = new NFTMarketplace();
        address nftAddress = marketplace.getNFTContractAddress();

        vm.stopBroadcast();

        console.log("========================================");
        console.log("Local Deployment successful!");
        console.log("========================================");
        console.log("NFTMarketplace:", address(marketplace));
        console.log("NFT Contract:", nftAddress);
        console.log("========================================");

        // Write addresses for frontend
        string memory deploymentInfo = string(
            abi.encodePacked(
                "{\n",
                '  "marketplace": "',
                vm.toString(address(marketplace)),
                '",\n',
                '  "nft": "',
                vm.toString(nftAddress),
                '",\n',
                '  "deployer": "',
                vm.toString(deployer),
                '",\n',
                '  "chainId": 31337\n}'
            )
        );

        vm.writeFile("deployments/localhost.json", deploymentInfo);
    }
}

/**
 * @title SeedData
 * @notice Seeds the marketplace with sample NFTs for testing
 * @dev Run after deployment: forge script script/Deploy.s.sol:SeedData --rpc-url http://localhost:8545 --broadcast
 */
contract SeedData is Script {
    function run() external {
        // Use Anvil's default private keys
        uint256 user1Key = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        uint256 user2Key = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
        uint256 user3Key = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;

        // Read deployment info
        string memory json = vm.readFile("deployments/localhost.json");
        address marketplaceAddress = vm.parseJsonAddress(json, ".marketplace");

        NFTMarketplace marketplace = NFTMarketplace(
            payable(marketplaceAddress)
        );

        console.log("Seeding data on marketplace:", marketplaceAddress);

        // Sample metadata URIs (you would replace these with actual IPFS URIs)
        string[6] memory uris = [
            "ipfs://QmSampleNFT1",
            "ipfs://QmSampleNFT2",
            "ipfs://QmSampleNFT3",
            "ipfs://QmSampleNFT4",
            "ipfs://QmSampleNFT5",
            "ipfs://QmSampleNFT6"
        ];

        uint256[6] memory prices = [
            uint256(0.1 ether),
            uint256(0.25 ether),
            uint256(0.5 ether),
            uint256(1 ether),
            uint256(2.5 ether),
            uint256(5 ether)
        ];

        // Mint and list NFTs from user1
        vm.startBroadcast(user1Key);
        marketplace.mintAndList(uris[0], prices[0]);
        marketplace.mintAndList(uris[1], prices[1]);
        vm.stopBroadcast();

        // Mint and list NFTs from user2
        vm.startBroadcast(user2Key);
        marketplace.mintAndList(uris[2], prices[2]);
        marketplace.mintAndList(uris[3], prices[3]);
        vm.stopBroadcast();

        // Mint and list NFTs from user3
        vm.startBroadcast(user3Key);
        marketplace.mintAndList(uris[4], prices[4]);
        marketplace.mintAndList(uris[5], prices[5]);
        vm.stopBroadcast();

        console.log("Seeded 6 NFTs successfully!");
        console.log("Active listings:", marketplace.getActiveListingCount());
    }
}
