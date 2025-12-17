import type { NFTMetadata, IPFSUploadResult, PinataResponse } from '../types';
import { isValidImageType, isValidFileSize, MAX_FILE_SIZE, formatFileSize } from './index';

// IPFS Gateway URLs
const IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
];

// Pinata API endpoints
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

/**
 * Upload file to Pinata IPFS
 */
export async function uploadFileToPinata(file: File): Promise<IPFSUploadResult> {
    const apiKey = import.meta.env.VITE_PINATA_API_KEY;
    const secretKey = import.meta.env.VITE_PINATA_SECRET_KEY;

    if (!apiKey || !secretKey) {
        throw new Error('Pinata API keys not configured');
    }

    // Validate file
    if (!isValidImageType(file)) {
        throw new Error('Invalid file type. Supported: JPEG, PNG, GIF, WebP');
    }

    if (!isValidFileSize(file)) {
        throw new Error(`File too large. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`);
    }

    const formData = new FormData();
    formData.append('file', file);

    // Optional: Add metadata
    const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
            uploadedAt: new Date().toISOString(),
        },
    });
    formData.append('pinataMetadata', metadata);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
            pinata_api_key: apiKey,
            pinata_secret_api_key: secretKey,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload to Pinata: ${error}`);
    }

    const result: PinataResponse = await response.json();

    return {
        cid: result.IpfsHash,
        uri: `ipfs://${result.IpfsHash}`,
        gatewayUrl: `${PINATA_GATEWAY}${result.IpfsHash}`,
    };
}

/**
 * Upload JSON metadata to Pinata IPFS
 */
export async function uploadMetadataToPinata(
    metadata: NFTMetadata
): Promise<IPFSUploadResult> {
    const apiKey = import.meta.env.VITE_PINATA_API_KEY;
    const secretKey = import.meta.env.VITE_PINATA_SECRET_KEY;

    if (!apiKey || !secretKey) {
        throw new Error('Pinata API keys not configured');
    }

    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            pinata_api_key: apiKey,
            pinata_secret_api_key: secretKey,
        },
        body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: {
                name: `${metadata.name}-metadata`,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload metadata to Pinata: ${error}`);
    }

    const result: PinataResponse = await response.json();

    return {
        cid: result.IpfsHash,
        uri: `ipfs://${result.IpfsHash}`,
        gatewayUrl: `${PINATA_GATEWAY}${result.IpfsHash}`,
    };
}

/**
 * Upload NFT (image + metadata) to Pinata
 */
export async function uploadNFTToPinata(
    file: File,
    name: string,
    description: string,
    attributes?: Array<{ trait_type: string; value: string | number }>
): Promise<{
    imageUri: string;
    metadataUri: string;
    imageGateway: string;
    metadataGateway: string;
}> {
    // 1. Upload image
    const imageResult = await uploadFileToPinata(file);

    // 2. Create and upload metadata
    const metadata: NFTMetadata = {
        name,
        description,
        image: imageResult.uri,
        attributes: attributes || [],
    };

    const metadataResult = await uploadMetadataToPinata(metadata);

    return {
        imageUri: imageResult.uri,
        metadataUri: metadataResult.uri,
        imageGateway: imageResult.gatewayUrl,
        metadataGateway: metadataResult.gatewayUrl,
    };
}

/**
 * Alternative: Upload to NFT.Storage (free, backed by Filecoin)
 */
export async function uploadToNFTStorage(file: File): Promise<IPFSUploadResult> {
    const apiKey = import.meta.env.VITE_NFT_STORAGE_API_KEY;

    if (!apiKey) {
        throw new Error('NFT.Storage API key not configured');
    }

    // Validate file
    if (!isValidImageType(file)) {
        throw new Error('Invalid file type. Supported: JPEG, PNG, GIF, WebP');
    }

    if (!isValidFileSize(file)) {
        throw new Error(`File too large. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`);
    }

    const response = await fetch('https://api.nft.storage/upload', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        body: file,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload to NFT.Storage: ${error}`);
    }

    const result = await response.json();
    const cid = result.value.cid;

    return {
        cid,
        uri: `ipfs://${cid}`,
        gatewayUrl: `https://nftstorage.link/ipfs/${cid}`,
    };
}

/**
 * Convert IPFS URI to HTTP gateway URL
 */
export function ipfsToHttp(uri: string, gatewayIndex = 0): string {
    if (!uri) return '';

    // Already HTTP
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
    }

    // Handle ipfs:// protocol
    if (uri.startsWith('ipfs://')) {
        const cid = uri.replace('ipfs://', '');
        return `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${cid}`;
    }

    // Handle /ipfs/ path
    if (uri.startsWith('/ipfs/')) {
        return `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${uri.slice(6)}`;
    }

    // Assume it's just a CID
    return `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${uri}`;
}

/**
 * Fetch metadata from IPFS with fallback gateways
 */
export async function fetchIPFSMetadata(uri: string): Promise<NFTMetadata | null> {
    for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
        try {
            const url = ipfsToHttp(uri, i);
            const response = await fetch(url, {
                signal: AbortSignal.timeout(10000), // 10s timeout
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn(`Gateway ${i} failed:`, error);
            continue;
        }
    }

    console.error('All IPFS gateways failed for:', uri);
    return null;
}

/**
 * Check if IPFS is configured
 */
export function isIPFSConfigured(): boolean {
    return Boolean(
        (import.meta.env.VITE_PINATA_API_KEY && import.meta.env.VITE_PINATA_SECRET_KEY) ||
        import.meta.env.VITE_NFT_STORAGE_API_KEY
    );
}

/**
 * Get upload progress placeholder (actual progress tracking requires additional setup)
 */
export interface UploadProgress {
    status: 'idle' | 'uploading-image' | 'uploading-metadata' | 'complete' | 'error';
    progress: number;
    message: string;
}

export function createUploadProgress(): UploadProgress {
    return {
        status: 'idle',
        progress: 0,
        message: '',
    };
}

