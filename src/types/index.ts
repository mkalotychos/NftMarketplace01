// NFT Types
export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes?: NFTAttribute[];
    external_url?: string;
    animation_url?: string;
}

export interface NFTAttribute {
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'date' | 'boost_percentage' | 'boost_number';
}

export interface NFT {
    tokenId: string;
    name: string;
    description: string;
    image: string;
    owner: string;
    creator?: string;
    tokenURI: string;
    metadata?: NFTMetadata;
    attributes?: NFTAttribute[];
}

export interface ListedNFT extends NFT {
    seller: string;
    price: string; // in wei
    priceFormatted: string; // in ETH
    isActive: boolean;
}

// Listing Types
export interface Listing {
    tokenId: string;
    seller: string;
    price: string;
    isActive: boolean;
}

// Transaction Types
export type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export interface Transaction {
    id: string;
    hash?: string;
    type: 'mint' | 'list' | 'buy' | 'delist' | 'updatePrice' | 'approve';
    status: TransactionStatus;
    description: string;
    tokenId?: string;
    error?: string;
    timestamp: number;
}

// Wallet Types
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
    account: string | null;
    balance: string;
    chainId: number | null;
    isConnecting: boolean;
    isConnected: boolean;
    error: string | null;
    status: ConnectionStatus;
}

// Network Types
export interface NetworkConfig {
    chainId: number;
    name: string;
    currency: string;
    rpcUrl: string;
    blockExplorer: string;
    nftContract: string;
    marketplaceContract: string;
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
    31337: {
        chainId: 31337,
        name: 'Localhost',
        currency: 'ETH',
        rpcUrl: 'http://127.0.0.1:8545',
        blockExplorer: '',
        nftContract: '',
        marketplaceContract: '',
    },
    11155111: {
        chainId: 11155111,
        name: 'Sepolia',
        currency: 'ETH',
        rpcUrl: 'https://sepolia.infura.io/v3/',
        blockExplorer: 'https://sepolia.etherscan.io',
        nftContract: '',
        marketplaceContract: '',
    },
    137: {
        chainId: 137,
        name: 'Polygon',
        currency: 'MATIC',
        rpcUrl: 'https://polygon-rpc.com',
        blockExplorer: 'https://polygonscan.com',
        nftContract: '',
        marketplaceContract: '',
    },
    80001: {
        chainId: 80001,
        name: 'Mumbai',
        currency: 'MATIC',
        rpcUrl: 'https://rpc-mumbai.maticvigil.com',
        blockExplorer: 'https://mumbai.polygonscan.com',
        nftContract: '',
        marketplaceContract: '',
    },
};

// Filter Types
export type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high';
export type StatusFilter = 'all' | 'for-sale' | 'sold';

export interface FilterState {
    status: StatusFilter;
    sortBy: SortOption;
    priceMin: string;
    priceMax: string;
    searchQuery: string;
}

// Form Types
export interface UploadFormData {
    name: string;
    description: string;
    price: string;
    file: File | null;
    listImmediately: boolean;
}

// IPFS Types
export interface IPFSUploadResult {
    cid: string;
    uri: string;
    gatewayUrl: string;
}

export interface PinataResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
}

// Event Types
export interface NFTMintedEvent {
    tokenId: string;
    owner: string;
    tokenURI: string;
    transactionHash: string;
    blockNumber: number;
}

export interface NFTListedEvent {
    tokenId: string;
    seller: string;
    price: string;
    transactionHash: string;
    blockNumber: number;
}

export interface NFTSoldEvent {
    tokenId: string;
    seller: string;
    buyer: string;
    price: string;
    transactionHash: string;
    blockNumber: number;
}

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

