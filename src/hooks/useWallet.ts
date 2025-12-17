import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, formatEther } from 'ethers';
import type { ConnectionStatus } from '../types';

interface UseWalletReturn {
    account: string | null;
    balance: string;
    chainId: number | null;
    isConnecting: boolean;
    isConnected: boolean;
    error: string | null;
    status: ConnectionStatus;
    connect: () => Promise<void>;
    disconnect: () => void;
    switchNetwork: (chainId: number) => Promise<void>;
    provider: BrowserProvider | null;
}

// Supported chain configurations
const CHAIN_CONFIGS: Record<number, {
    chainId: string;
    chainName: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: string[];
    blockExplorerUrls: string[];
}> = {
    31337: {
        chainId: '0x7A69',
        chainName: 'Localhost',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['http://127.0.0.1:8545'],
        blockExplorerUrls: [],
    },
    11155111: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
    137: {
        chainId: '0x89',
        chainName: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com'],
    },
    80001: {
        chainId: '0x13881',
        chainName: 'Mumbai',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com'],
    },
};

const STORAGE_KEY = 'nft-marketplace-wallet-connected';

export function useWallet(): UseWalletReturn {
    const [account, setAccount] = useState<string | null>(null);
    const [balance, setBalance] = useState<string>('0');
    const [chainId, setChainId] = useState<number | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<BrowserProvider | null>(null);

    const isConnecting = status === 'connecting';
    const isConnected = status === 'connected';

    // Check if ethereum is available
    const getEthereum = useCallback(() => {
        if (typeof window !== 'undefined' && window.ethereum) {
            return window.ethereum;
        }
        return null;
    }, []);

    // Fetch balance for an address
    const fetchBalance = useCallback(async (address: string, prov: BrowserProvider) => {
        try {
            const bal = await prov.getBalance(address);
            setBalance(formatEther(bal));
        } catch (err) {
            console.error('Error fetching balance:', err);
            setBalance('0');
        }
    }, []);

    // Connect wallet
    const connect = useCallback(async () => {
        const ethereum = getEthereum();

        if (!ethereum) {
            setError('MetaMask not detected. Please install MetaMask.');
            setStatus('error');
            return;
        }

        setStatus('connecting');
        setError(null);

        try {
            // Request account access
            const accounts = await ethereum.request({
                method: 'eth_requestAccounts',
            }) as string[];

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            // Create provider
            const prov = new BrowserProvider(ethereum);
            setProvider(prov);

            // Get network
            const network = await prov.getNetwork();
            setChainId(Number(network.chainId));

            // Set account
            const address = accounts[0];
            setAccount(address);

            // Fetch balance
            await fetchBalance(address, prov);

            // Save connection state
            localStorage.setItem(STORAGE_KEY, 'true');

            setStatus('connected');
        } catch (err) {
            const error = err as { code?: number; message?: string };

            if (error.code === 4001) {
                setError('Connection request was rejected');
            } else {
                setError(error.message || 'Failed to connect wallet');
            }

            setStatus('error');
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [getEthereum, fetchBalance]);

    // Disconnect wallet
    const disconnect = useCallback(() => {
        setAccount(null);
        setBalance('0');
        setChainId(null);
        setProvider(null);
        setStatus('disconnected');
        setError(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // Switch network
    const switchNetwork = useCallback(async (targetChainId: number) => {
        const ethereum = getEthereum();

        if (!ethereum) {
            setError('MetaMask not detected');
            return;
        }

        const chainConfig = CHAIN_CONFIGS[targetChainId];
        if (!chainConfig) {
            setError('Unsupported network');
            return;
        }

        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainConfig.chainId }],
            });
        } catch (switchError) {
            const error = switchError as { code?: number };

            // Chain not added to MetaMask
            if (error.code === 4902) {
                try {
                    await ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [chainConfig],
                    });
                } catch (addError) {
                    const err = addError as { message?: string };
                    setError(err.message || 'Failed to add network');
                }
            } else {
                const err = switchError as { message?: string };
                setError(err.message || 'Failed to switch network');
            }
        }
    }, [getEthereum]);

    // Handle account changes
    useEffect(() => {
        const ethereum = getEthereum();
        if (!ethereum) return;

        const handleAccountsChanged = async (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnect();
            } else if (accounts[0] !== account) {
                setAccount(accounts[0]);
                if (provider) {
                    await fetchBalance(accounts[0], provider);
                }
            }
        };

        const handleChainChanged = (chainIdHex: string) => {
            const newChainId = parseInt(chainIdHex, 16);
            setChainId(newChainId);

            // Refresh page on chain change (recommended by MetaMask)
            window.location.reload();
        };

        const handleDisconnect = () => {
            disconnect();
        };

        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);
        ethereum.on('disconnect', handleDisconnect);

        return () => {
            ethereum.removeListener('accountsChanged', handleAccountsChanged);
            ethereum.removeListener('chainChanged', handleChainChanged);
            ethereum.removeListener('disconnect', handleDisconnect);
        };
    }, [getEthereum, account, provider, disconnect, fetchBalance]);

    // Auto-connect on mount if previously connected
    useEffect(() => {
        const wasConnected = localStorage.getItem(STORAGE_KEY);

        if (wasConnected === 'true') {
            const ethereum = getEthereum();
            if (ethereum) {
                // Check if already connected
                ethereum.request({ method: 'eth_accounts' })
                    .then((accounts: string[]) => {
                        if (accounts.length > 0) {
                            connect();
                        } else {
                            localStorage.removeItem(STORAGE_KEY);
                        }
                    })
                    .catch(() => {
                        localStorage.removeItem(STORAGE_KEY);
                    });
            }
        }
    }, [getEthereum, connect]);

    // Update balance periodically
    useEffect(() => {
        if (!account || !provider) return;

        const interval = setInterval(() => {
            fetchBalance(account, provider);
        }, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [account, provider, fetchBalance]);

    return {
        account,
        balance,
        chainId,
        isConnecting,
        isConnected,
        error,
        status,
        connect,
        disconnect,
        switchNetwork,
        provider,
    };
}

// Add ethereum type to window
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (event: string, handler: (...args: unknown[]) => void) => void;
            removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
            isMetaMask?: boolean;
        };
    }
}

export default useWallet;

