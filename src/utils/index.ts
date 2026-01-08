import { formatEther, parseEther } from 'ethers';
import { getContractAddresses, getNetworkName } from '../contracts/addresses';

// Re-export address utilities
export { getContractAddresses, getNetworkName };

/**
 * Truncates an Ethereum address for display
 * @param address Full address
 * @param startChars Characters to show at start (default 6)
 * @param endChars Characters to show at end (default 4)
 */
export function truncateAddress(
    address: string,
    startChars = 6,
    endChars = 4
): string {
    if (!address) return '';
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats wei to ETH with specified decimal places
 */
export function formatWeiToEth(wei: string | bigint, decimals = 4): string {
    try {
        const eth = formatEther(wei);
        const num = parseFloat(eth);
        return num.toFixed(decimals);
    } catch {
        return '0';
    }
}

/**
 * Parses ETH string to wei
 */
export function parseEthToWei(eth: string): bigint {
    try {
        return parseEther(eth);
    } catch {
        return BigInt(0);
    }
}

/**
 * Converts IPFS URI to HTTP gateway URL
 */
export function ipfsToHttp(uri: string): string {
    if (!uri) return '';

    // Handle ipfs:// protocol
    if (uri.startsWith('ipfs://')) {
        const cid = uri.replace('ipfs://', '');
        return `https://gateway.pinata.cloud/ipfs/${cid}`;
    }

    // Handle /ipfs/ paths
    if (uri.startsWith('/ipfs/')) {
        return `https://gateway.pinata.cloud${uri}`;
    }

    // Already HTTP URL
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
    }

    // Assume it's just a CID
    return `https://gateway.pinata.cloud/ipfs/${uri}`;
}

/**
 * Generates a block explorer URL for a transaction
 */
export function getExplorerTxUrl(txHash: string, chainId: number): string {
    const explorers: Record<number, string> = {
        1: 'https://etherscan.io',
        11155111: 'https://sepolia.etherscan.io',
        137: 'https://polygonscan.com',
        80001: 'https://mumbai.polygonscan.com',
    };

    const baseUrl = explorers[chainId];
    if (!baseUrl) return '';

    return `${baseUrl}/tx/${txHash}`;
}

/**
 * Generates a block explorer URL for an address
 */
export function getExplorerAddressUrl(address: string, chainId: number): string {
    const explorers: Record<number, string> = {
        1: 'https://etherscan.io',
        11155111: 'https://sepolia.etherscan.io',
        137: 'https://polygonscan.com',
        80001: 'https://mumbai.polygonscan.com',
    };

    const baseUrl = explorers[chainId];
    if (!baseUrl) return '';

    return `${baseUrl}/address/${address}`;
}

/**
 * Validates Ethereum address format
 */
export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validates price input (positive number)
 */
export function isValidPrice(price: string): boolean {
    if (!price) return false;
    const num = parseFloat(price);
    return !isNaN(num) && num > 0;
}

/**
 * Formats a number with commas
 */
export function formatNumber(num: number | string): string {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return n.toLocaleString('en-US');
}

/**
 * Debounce function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry utility for async operations
 */
export async function retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await sleep(delay);
            return retry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

/**
 * Parse error messages from contract calls
 */
export function parseContractError(error: unknown): string {
    const err = error as { reason?: string; message?: string; code?: string };

    // User rejected transaction
    if (err.code === 'ACTION_REJECTED' || err.code === '4001') {
        return 'Transaction was rejected by user';
    }

    // Insufficient funds
    if (err.message?.includes('insufficient funds')) {
        return 'Insufficient funds for transaction';
    }

    // Contract revert reasons
    if (err.reason) {
        const reasons: Record<string, string> = {
            'PriceMustBeGreaterThanZero': 'Price must be greater than zero',
            'NotTokenOwner': 'You do not own this NFT',
            'NotApprovedForMarketplace': 'NFT not approved for marketplace',
            'ListingNotActive': 'This listing is no longer active',
            'CannotBuyOwnNFT': 'You cannot buy your own NFT',
            'IncorrectPaymentAmount': 'Incorrect payment amount',
        };
        return reasons[err.reason] || err.reason;
    }

    return err.message || 'An unknown error occurred';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file is valid image type
 */
export function isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
}

/**
 * Maximum file size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Check if file size is valid
 */
export function isValidFileSize(file: File): boolean {
    return file.size <= MAX_FILE_SIZE;
}
