// Contract addresses - Update after deployment
// Run 'npm run export-abi' to auto-generate after deployment

export const CONTRACT_ADDRESSES = {
    localhost: {
        marketplace: import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || '',
        nft: import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '',
        chainId: 31337,
    },
    sepolia: {
        marketplace: '',
        nft: '',
        chainId: 11155111,
    },
    polygon: {
        marketplace: '',
        nft: '',
        chainId: 137,
    },
    polygonMumbai: {
        marketplace: '',
        nft: '',
        chainId: 80001,
    },
} as const;

export type NetworkName = keyof typeof CONTRACT_ADDRESSES;

/**
 * Get contract addresses for a given chain ID
 */
export function getContractAddresses(chainId: number) {
    const network = Object.values(CONTRACT_ADDRESSES).find(
        (n) => n.chainId === chainId
    );
    return network || CONTRACT_ADDRESSES.localhost;
}

/**
 * Check if a chain ID is supported
 */
export function isSupportedChain(chainId: number): boolean {
    return Object.values(CONTRACT_ADDRESSES).some((n) => n.chainId === chainId);
}

/**
 * Get network name from chain ID
 */
export function getNetworkName(chainId: number): string {
    const networks: Record<number, string> = {
        31337: 'Localhost',
        11155111: 'Sepolia',
        137: 'Polygon',
        80001: 'Mumbai',
        1: 'Ethereum',
    };
    return networks[chainId] || `Chain ${chainId}`;
}

