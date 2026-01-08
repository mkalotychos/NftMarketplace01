import { Alchemy, Network, NftTokenType, OwnedNft, Nft, SortingOrder, AssetTransfersCategory } from 'alchemy-sdk';
import type { NFT, NFTMetadata } from '../types';

// Network mapping
const NETWORK_MAP: Record<string, Network> = {
    mainnet: Network.ETH_MAINNET,
    sepolia: Network.ETH_SEPOLIA,
    polygon: Network.MATIC_MAINNET,
    polygonMumbai: Network.MATIC_MUMBAI,
    localhost: Network.ETH_MAINNET, // Fallback for local dev
};

// Get Alchemy network from chain ID
function getNetworkFromChainId(chainId: number): Network {
    const chainToNetwork: Record<number, Network> = {
        1: Network.ETH_MAINNET,
        11155111: Network.ETH_SEPOLIA,
        137: Network.MATIC_MAINNET,
        80001: Network.MATIC_MUMBAI,
    };
    return chainToNetwork[chainId] || Network.ETH_SEPOLIA;
}

// Create Alchemy instance
function createAlchemyInstance(chainId?: number): Alchemy {
    const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
    const networkName = import.meta.env.VITE_ALCHEMY_NETWORK || 'sepolia';

    const network = chainId
        ? getNetworkFromChainId(chainId)
        : NETWORK_MAP[networkName] || Network.ETH_SEPOLIA;

    return new Alchemy({
        apiKey: apiKey || 'demo', // 'demo' works for limited testing
        network,
    });
}

// Default instance
let alchemyInstance: Alchemy | null = null;

export function getAlchemy(chainId?: number): Alchemy {
    if (!alchemyInstance || chainId) {
        alchemyInstance = createAlchemyInstance(chainId);
    }
    return alchemyInstance;
}

// Reset instance (call when network changes)
export function resetAlchemyInstance(): void {
    alchemyInstance = null;
}

/**
 * Get all NFTs owned by an address from your contract
 */
export async function getOwnedNFTs(
    owner: string,
    contractAddress: string,
    chainId?: number
): Promise<NFT[]> {
    const alchemy = getAlchemy(chainId);

    try {
        const response = await alchemy.nft.getNftsForOwner(owner, {
            contractAddresses: [contractAddress],
            omitMetadata: false,
        });

        return response.ownedNfts.map((nft) => mapAlchemyNftToNFT(nft, owner));
    } catch (error) {
        console.error('Alchemy getOwnedNFTs error:', error);
        return [];
    }
}

/**
 * Get all NFTs from your contract
 */
export async function getContractNFTs(
    contractAddress: string,
    chainId?: number
): Promise<NFT[]> {
    const alchemy = getAlchemy(chainId);

    try {
        const response = await alchemy.nft.getNftsForContract(contractAddress, {
            omitMetadata: false,
        });

        return response.nfts.map((nft) => mapNftToNFT(nft));
    } catch (error) {
        console.error('Alchemy getContractNFTs error:', error);
        return [];
    }
}

/**
 * Get NFT metadata by token ID
 */
export async function getNFTMetadata(
    contractAddress: string,
    tokenId: string,
    chainId?: number
): Promise<NFT | null> {
    const alchemy = getAlchemy(chainId);

    try {
        const nft = await alchemy.nft.getNftMetadata(
            contractAddress,
            tokenId,
            {}
        );

        // Get owner
        const owners = await alchemy.nft.getOwnersForNft(contractAddress, tokenId);
        const owner = owners.owners[0] || '';

        return {
            tokenId: nft.tokenId,
            name: nft.name || `NFT #${nft.tokenId}`,
            description: nft.description || '',
            image: getImageUrl(nft),
            owner,
            tokenURI: getTokenUri(nft),
            metadata: nft.raw?.metadata as NFTMetadata,
            attributes: (nft.raw?.metadata as NFTMetadata)?.attributes,
        };
    } catch (error) {
        console.error('Alchemy getNFTMetadata error:', error);
        return null;
    }
}

/**
 * Get owners of an NFT
 */
export async function getNFTOwners(
    contractAddress: string,
    tokenId: string,
    chainId?: number
): Promise<string[]> {
    const alchemy = getAlchemy(chainId);

    try {
        const response = await alchemy.nft.getOwnersForNft(contractAddress, tokenId);
        return response.owners;
    } catch (error) {
        console.error('Alchemy getNFTOwners error:', error);
        return [];
    }
}

/**
 * Check if NFT contract is valid
 */
export async function verifyNFTContract(
    contractAddress: string,
    chainId?: number
): Promise<boolean> {
    const alchemy = getAlchemy(chainId);

    try {
        const metadata = await alchemy.nft.getContractMetadata(contractAddress);
        return metadata.tokenType === NftTokenType.ERC721;
    } catch {
        return false;
    }
}

/**
 * Get NFT transfer history
 */
export async function getNFTTransfers(
    contractAddress: string,
    tokenId: string,
    chainId?: number
) {
    const alchemy = getAlchemy(chainId);

    try {
        // Get transfers for specific token (using asset transfers)
        const response = await alchemy.core.getAssetTransfers({
            contractAddresses: [contractAddress],
            category: [AssetTransfersCategory.ERC721],
            withMetadata: true,
            order: SortingOrder.DESCENDING,
        });

        // Filter for specific tokenId
        return response.transfers.filter(
            (tx) => tx.erc721TokenId === tokenId || tx.tokenId === tokenId
        );
    } catch (error) {
        console.error('Alchemy getNFTTransfers error:', error);
        return [];
    }
}

/**
 * Subscribe to contract events via WebSocket
 */
export function subscribeToContractEvents(
    contractAddress: string,
    callback: (log: unknown) => void,
    chainId?: number
): () => void {
    const alchemy = getAlchemy(chainId);

    // Subscribe to logs from the contract
    alchemy.ws.on(
        {
            address: contractAddress,
        },
        callback
    );

    // Return unsubscribe function
    return () => {
        alchemy.ws.off({
            address: contractAddress,
        }, callback);
    };
}

/**
 * Subscribe to pending transactions for a contract
 */
export function subscribeToPendingTransactions(
    contractAddress: string,
    callback: (tx: unknown) => void,
    chainId?: number
): () => void {
    const alchemy = getAlchemy(chainId);

    const handler = (tx: { to?: string }) => {
        if (tx.to?.toLowerCase() === contractAddress.toLowerCase()) {
            callback(tx);
        }
    };

    alchemy.ws.on('pending', handler);

    return () => {
        alchemy.ws.off('pending', handler);
    };
}

/**
 * Get floor price for a collection (if available)
 */
export async function getCollectionFloorPrice(
    contractAddress: string,
    chainId?: number
): Promise<number | null> {
    const alchemy = getAlchemy(chainId);

    try {
        const response = await alchemy.nft.getFloorPrice(contractAddress);
        // Check if openSea exists and has floorPrice
        if (response.openSea && 'floorPrice' in response.openSea) {
            return response.openSea.floorPrice || null;
        }
        return null;
    } catch {
        return null;
    }
}

// Helper: Map Alchemy OwnedNft to our NFT type
function mapAlchemyNftToNFT(nft: OwnedNft, owner: string): NFT {
    return {
        tokenId: nft.tokenId,
        name: nft.name || `NFT #${nft.tokenId}`,
        description: nft.description || '',
        image: getImageUrl(nft),
        owner,
        tokenURI: getTokenUri(nft),
        metadata: nft.raw?.metadata as NFTMetadata,
        attributes: (nft.raw?.metadata as NFTMetadata)?.attributes,
    };
}

// Helper: Map Alchemy Nft to our NFT type
function mapNftToNFT(nft: Nft): NFT {
    return {
        tokenId: nft.tokenId,
        name: nft.name || `NFT #${nft.tokenId}`,
        description: nft.description || '',
        image: getImageUrl(nft),
        owner: '', // Will be filled by contract call
        tokenURI: getTokenUri(nft),
        metadata: nft.raw?.metadata as NFTMetadata,
        attributes: (nft.raw?.metadata as NFTMetadata)?.attributes,
    };
}

// Helper: Get token URI from NFT object
function getTokenUri(nft: OwnedNft | Nft): string {
    if (nft.tokenUri) {
        // tokenUri can be string or object with raw/gateway
        if (typeof nft.tokenUri === 'string') {
            return nft.tokenUri;
        }
        return nft.tokenUri || '';
    }
    return '';
}

// Helper: Convert local IPFS gateway URLs to Pinata gateway
function convertToHttpsGateway(url: string): string {
    if (!url) return '';

    // Handle subdomain-style IPFS gateway: http://CID.ipfs.localhost:8080/
    const subdomainMatch = url.match(/https?:\/\/([a-zA-Z0-9]+)\.ipfs\.localhost/);
    if (subdomainMatch) {
        return `https://gateway.pinata.cloud/ipfs/${subdomainMatch[1]}`;
    }

    // Convert local IPFS gateway path style: http://127.0.0.1:8080/ipfs/CID
    if (url.includes('127.0.0.1') || url.includes('localhost')) {
        const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
        if (match) {
            return `https://gateway.pinata.cloud/ipfs/${match[1]}`;
        }
    }

    // Convert ipfs:// protocol
    if (url.startsWith('ipfs://')) {
        return `https://gateway.pinata.cloud/ipfs/${url.replace('ipfs://', '')}`;
    }

    return url;
}

// Helper: Get best available image URL
function getImageUrl(nft: OwnedNft | Nft): string {
    // Try image property first (v3 SDK structure)
    if (nft.image) {
        // Prefer HTTPS gateway URLs
        if (nft.image.cachedUrl) return convertToHttpsGateway(nft.image.cachedUrl);
        if (nft.image.thumbnailUrl) return convertToHttpsGateway(nft.image.thumbnailUrl);
        if (nft.image.pngUrl) return convertToHttpsGateway(nft.image.pngUrl);
        if (nft.image.originalUrl) return convertToHttpsGateway(nft.image.originalUrl);
    }

    // Try raw metadata
    if (nft.raw?.metadata) {
        const metadata = nft.raw.metadata as NFTMetadata;
        if (metadata.image) {
            return convertToHttpsGateway(metadata.image);
        }
    }

    return '';
}

/**
 * Check if Alchemy is configured
 */
export function isAlchemyConfigured(): boolean {
    return Boolean(import.meta.env.VITE_ALCHEMY_API_KEY);
}
