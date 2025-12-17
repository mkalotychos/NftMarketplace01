import React, { createContext, useContext, ReactNode } from 'react';
import { BrowserProvider } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import type { ConnectionStatus } from '../types';

interface WalletContextType {
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

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
    children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
    const wallet = useWallet();

    return (
        <WalletContext.Provider value={wallet}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWalletContext(): WalletContextType {
    const context = useContext(WalletContext);

    if (!context) {
        throw new Error('useWalletContext must be used within a WalletProvider');
    }

    return context;
}

export default WalletContext;

