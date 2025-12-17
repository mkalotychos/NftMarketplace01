import React, {
    createContext,
    useContext,
    useReducer,
    useCallback,
    useEffect,
    ReactNode,
} from 'react';
import { useWalletContext } from './WalletContext';
import { useNFTContract } from '../hooks/useNFTContract';
import type { ListedNFT, NFT, FilterState, SortOption, StatusFilter } from '../types';

interface NFTState {
    listedNFTs: ListedNFT[];
    ownedNFTs: NFT[];
    isLoading: boolean;
    isLoadingOwned: boolean;
    error: string | null;
    totalSupply: number;
    activeListingCount: number;
    filters: FilterState;
}

type NFTAction =
    | { type: 'SET_LISTED_NFTS'; payload: ListedNFT[] }
    | { type: 'SET_OWNED_NFTS'; payload: NFT[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_LOADING_OWNED'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_STATS'; payload: { totalSupply: number; activeListingCount: number } }
    | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
    | { type: 'RESET_FILTERS' };

interface NFTContextType extends NFTState {
    // Data fetching
    fetchListedNFTs: () => Promise<void>;
    fetchOwnedNFTs: () => Promise<void>;
    refreshNFT: (tokenId: string) => Promise<NFT | null>;

    // Contract interactions (from hook)
    mintNFT: (tokenURI: string) => Promise<string | null>;
    mintAndList: (tokenURI: string, price: string) => Promise<string | null>;
    listNFT: (tokenId: string, price: string) => Promise<boolean>;
    buyNFT: (tokenId: string, price: string) => Promise<boolean>;
    delistNFT: (tokenId: string) => Promise<boolean>;
    updatePrice: (tokenId: string, newPrice: string) => Promise<boolean>;
    approveMarketplace: (tokenId: string) => Promise<boolean>;

    // Filter management
    setFilters: (filters: Partial<FilterState>) => void;
    resetFilters: () => void;

    // Transaction state
    txState: {
        status: string;
        hash: string | null;
        error: string | null;
    };
    resetTxState: () => void;

    // Computed values
    filteredNFTs: ListedNFT[];
    isReady: boolean;
}

const NFTContext = createContext<NFTContextType | null>(null);

const initialFilters: FilterState = {
    status: 'all',
    sortBy: 'newest',
    priceMin: '',
    priceMax: '',
    searchQuery: '',
};

const initialState: NFTState = {
    listedNFTs: [],
    ownedNFTs: [],
    isLoading: false,
    isLoadingOwned: false,
    error: null,
    totalSupply: 0,
    activeListingCount: 0,
    filters: initialFilters,
};

function nftReducer(state: NFTState, action: NFTAction): NFTState {
    switch (action.type) {
        case 'SET_LISTED_NFTS':
            return { ...state, listedNFTs: action.payload, error: null };
        case 'SET_OWNED_NFTS':
            return { ...state, ownedNFTs: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_LOADING_OWNED':
            return { ...state, isLoadingOwned: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_STATS':
            return {
                ...state,
                totalSupply: action.payload.totalSupply,
                activeListingCount: action.payload.activeListingCount,
            };
        case 'SET_FILTERS':
            return { ...state, filters: { ...state.filters, ...action.payload } };
        case 'RESET_FILTERS':
            return { ...state, filters: initialFilters };
        default:
            return state;
    }
}

interface NFTProviderProps {
    children: ReactNode;
}

export function NFTProvider({ children }: NFTProviderProps) {
    const [state, dispatch] = useReducer(nftReducer, initialState);
    const { provider, chainId, account, isConnected } = useWalletContext();

    const contract = useNFTContract(provider, chainId);

    // Fetch listed NFTs
    const fetchListedNFTs = useCallback(async () => {
        if (!contract.isReady) return;

        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const [nfts, totalSupply, activeCount] = await Promise.all([
                contract.getListedNFTs(0, 100),
                contract.getTotalSupply(),
                contract.getActiveListingCount(),
            ]);

            dispatch({ type: 'SET_LISTED_NFTS', payload: nfts });
            dispatch({
                type: 'SET_STATS',
                payload: { totalSupply, activeListingCount: activeCount },
            });
        } catch (error) {
            console.error('Error fetching NFTs:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch NFTs' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [contract]);

    // Fetch owned NFTs
    const fetchOwnedNFTs = useCallback(async () => {
        if (!contract.isReady || !account) return;

        dispatch({ type: 'SET_LOADING_OWNED', payload: true });

        try {
            const nfts = await contract.getOwnedNFTs(account);
            dispatch({ type: 'SET_OWNED_NFTS', payload: nfts });
        } catch (error) {
            console.error('Error fetching owned NFTs:', error);
        } finally {
            dispatch({ type: 'SET_LOADING_OWNED', payload: false });
        }
    }, [contract, account]);

    // Refresh single NFT
    const refreshNFT = useCallback(async (tokenId: string) => {
        return contract.getNFTDetails(tokenId);
    }, [contract]);

    // Filter management
    const setFilters = useCallback((filters: Partial<FilterState>) => {
        dispatch({ type: 'SET_FILTERS', payload: filters });
    }, []);

    const resetFilters = useCallback(() => {
        dispatch({ type: 'RESET_FILTERS' });
    }, []);

    // Compute filtered NFTs
    const filteredNFTs = React.useMemo(() => {
        let result = [...state.listedNFTs];

        // Filter by status
        if (state.filters.status === 'for-sale') {
            result = result.filter((nft) => nft.isActive);
        }

        // Filter by search query
        if (state.filters.searchQuery) {
            const query = state.filters.searchQuery.toLowerCase();
            result = result.filter(
                (nft) =>
                    nft.name.toLowerCase().includes(query) ||
                    nft.tokenId.includes(query)
            );
        }

        // Filter by price range
        if (state.filters.priceMin) {
            const min = parseFloat(state.filters.priceMin);
            result = result.filter(
                (nft) => parseFloat(nft.priceFormatted) >= min
            );
        }
        if (state.filters.priceMax) {
            const max = parseFloat(state.filters.priceMax);
            result = result.filter(
                (nft) => parseFloat(nft.priceFormatted) <= max
            );
        }

        // Sort
        const sortFns: Record<SortOption, (a: ListedNFT, b: ListedNFT) => number> = {
            newest: (a, b) => parseInt(b.tokenId) - parseInt(a.tokenId),
            oldest: (a, b) => parseInt(a.tokenId) - parseInt(b.tokenId),
            'price-low': (a, b) =>
                parseFloat(a.priceFormatted) - parseFloat(b.priceFormatted),
            'price-high': (a, b) =>
                parseFloat(b.priceFormatted) - parseFloat(a.priceFormatted),
        };

        result.sort(sortFns[state.filters.sortBy]);

        return result;
    }, [state.listedNFTs, state.filters]);

    // Auto-fetch on connection
    useEffect(() => {
        if (contract.isReady) {
            fetchListedNFTs();
        }
    }, [contract.isReady, fetchListedNFTs]);

    // Fetch owned NFTs when account changes
    useEffect(() => {
        if (isConnected && account) {
            fetchOwnedNFTs();
        }
    }, [isConnected, account, fetchOwnedNFTs]);

    const value: NFTContextType = {
        ...state,
        fetchListedNFTs,
        fetchOwnedNFTs,
        refreshNFT,
        mintNFT: contract.mintNFT,
        mintAndList: contract.mintAndList,
        listNFT: contract.listNFT,
        buyNFT: contract.buyNFT,
        delistNFT: contract.delistNFT,
        updatePrice: contract.updatePrice,
        approveMarketplace: contract.approveMarketplace,
        setFilters,
        resetFilters,
        txState: contract.txState,
        resetTxState: contract.resetTxState,
        filteredNFTs,
        isReady: contract.isReady,
    };

    return <NFTContext.Provider value={value}>{children}</NFTContext.Provider>;
}

export function useNFTContext(): NFTContextType {
    const context = useContext(NFTContext);

    if (!context) {
        throw new Error('useNFTContext must be used within an NFTProvider');
    }

    return context;
}

export default NFTContext;

