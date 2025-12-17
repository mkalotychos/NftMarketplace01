# NFT Marketplace

A full-stack decentralized NFT marketplace built with React, TypeScript, and Solidity (Foundry).

![NFT Marketplace](https://img.shields.io/badge/NFT-Marketplace-6366f1?style=for-the-badge)
![Solidity](https://img.shields.io/badge/Solidity-0.8.23-363636?style=for-the-badge&logo=solidity)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)

## Features

- 🎨 **Create NFTs** - Upload images to IPFS and mint ERC-721 tokens
- 💰 **List & Sell** - Set your price and list NFTs on the marketplace
- 🛒 **Buy NFTs** - Purchase listed NFTs with ETH/MATIC
- 👛 **MetaMask Integration** - Seamless wallet connection
- 📱 **Responsive Design** - Beautiful UI on all devices
- ⛽ **Gas Optimized** - Efficient smart contract design
- 🔒 **Secure** - Built with OpenZeppelin contracts

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- ethers.js v6 for Web3 integration
- React Router for navigation
- Lucide React for icons

### Smart Contracts
- Solidity 0.8.23
- Foundry for development & testing
- OpenZeppelin contracts (ERC-721, Ownable, ReentrancyGuard)

### Storage
- IPFS via Pinata for decentralized storage

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, anvil, cast)
- [MetaMask](https://metamask.io/) browser extension
- [Pinata](https://pinata.cloud/) account for IPFS (optional for development)

## Installation

### 1. Clone the repository

```bash
cd Marketplace_personal1
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install Foundry dependencies

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
cd ..
```

### 4. Configure environment variables

```bash
cp env.example .env
```

Edit `.env` with your values:

```env
# For deployment
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_key

# For IPFS (optional for local dev)
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key

# Contract addresses (filled after deployment)
VITE_NFT_CONTRACT_ADDRESS=
VITE_MARKETPLACE_CONTRACT_ADDRESS=
```

## Development

### Start local blockchain (Anvil)

```bash
anvil
```

This starts a local Ethereum node at `http://localhost:8545`.

### Deploy contracts locally

In a new terminal:

```bash
forge script contracts/script/Deploy.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast
```

Note the deployed contract addresses and add them to your `.env`:

```env
VITE_NFT_CONTRACT_ADDRESS=0x...
VITE_MARKETPLACE_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=31337
```

### Export ABIs (optional)

```bash
forge build
npm run export-abi
```

### Start frontend

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Import Anvil accounts to MetaMask

Anvil provides test accounts with 10,000 ETH each. Import the first account:

- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

## Smart Contract Architecture

### NFT.sol (ERC-721)

- Inherits from OpenZeppelin's ERC721URIStorage
- Minting controlled by marketplace contract
- Events: `NFTMinted`

### Marketplace.sol

- List NFTs for sale with custom pricing
- Buy NFTs with automatic payment distribution
- Delist NFTs from sale
- Update listing prices
- 2.5% marketplace fee (configurable)
- Events: `NFTListed`, `NFTSold`, `NFTDelisted`, `ListingPriceUpdated`

## Testing

### Run contract tests

```bash
forge test
```

### Run with verbosity

```bash
forge test -vvv
```

### Gas reports

```bash
forge test --gas-report
```

## Deployment

### Sepolia Testnet

1. Get Sepolia ETH from a [faucet](https://sepoliafaucet.com/)
2. Set environment variables:

```bash
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

3. Deploy:

```bash
forge script contracts/script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

### Polygon Mumbai

```bash
export POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_KEY
forge script contracts/script/Deploy.s.sol --rpc-url $POLYGON_MUMBAI_RPC_URL --broadcast --verify
```

### Frontend Deployment

Build the frontend:

```bash
npm run build
```

Deploy the `dist` folder to your preferred hosting:
- Vercel: `npx vercel`
- Netlify: Drag & drop `dist` folder

## Project Structure

```
├── contracts/
│   ├── src/
│   │   ├── NFT.sol           # ERC-721 NFT contract
│   │   └── Marketplace.sol   # Marketplace contract
│   ├── test/
│   │   └── NFTMarketplace.t.sol
│   ├── script/
│   │   └── Deploy.s.sol      # Deployment scripts
│   └── lib/                  # Foundry dependencies
├── src/
│   ├── components/           # React components
│   │   ├── Header.tsx
│   │   ├── NFTCard.tsx
│   │   ├── UploadModal.tsx
│   │   └── ui/              # Utility components
│   ├── pages/               # Page components
│   │   ├── Home.tsx
│   │   ├── Explore.tsx
│   │   ├── MyNFTs.tsx
│   │   ├── NFTDetail.tsx
│   │   └── Upload.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useWallet.ts
│   │   └── useNFTContract.ts
│   ├── context/             # React context providers
│   │   ├── WalletContext.tsx
│   │   ├── NFTContext.tsx
│   │   └── TransactionContext.tsx
│   ├── contracts/           # ABI and addresses
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript types
├── foundry.toml             # Foundry configuration
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## Troubleshooting

### MetaMask not connecting
- Ensure MetaMask is installed and unlocked
- Check you're on the correct network
- Try refreshing the page

### Contract deployment fails
- Ensure you have enough ETH for gas
- Check RPC URL is correct
- Verify private key is set

### IPFS upload fails
- Verify Pinata API keys are correct
- Check file size is under 10MB
- Ensure file type is supported (JPEG, PNG, GIF, WebP)

### Transaction reverts
- Check you have enough ETH for gas + purchase price
- Verify NFT is approved for marketplace
- Ensure listing is still active

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure contract libraries
- [Foundry](https://book.getfoundry.sh/) for Solidity development tools
- [Pinata](https://pinata.cloud/) for IPFS pinning services

