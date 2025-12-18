import { useState, useCallback, useMemo, useEffect } from 'react';
import { Contract, BrowserProvider, parseEther, formatEther } from 'ethers';
import { NFT_ABI, MARKETPLACE_ABI } from '../contracts/abis';
import { getContractAddresses } from '../contracts/addresses';
import { parseContractError, ipfsToHttp, retry } from '../utils';
import {
    getOwnedNFTs as alchemyGetOwnedNFTs,
    getNFTMetadata as alchemyGetNFTMetadata,
    getContractNFTs as alchemyGetContractNFTs,
    subscribeToContractEvents,
    isAlchemyConfigured,
    resetAlchemyInstance,
} from '../utils/alchemy';
import type { NFT, ListedNFT, Listing, TransactionStatus } from '../types';

interface TransactionState {
    status: TransactionStatus;
    hash: string | null;
    error: string | null;
}

interface UseNFTContractReturn {
    // Read functions
    getListedNFTs: (offset?: number, limit?: number) => Promise<ListedNFT[]>;
    getNFTDetails: (tokenId: string) => Promise<NFT | null>;
    getListing: (tokenId: string) => Promise<Listing | null>;
    getOwnedNFTs: (owner: string) => Promise<NFT[]>;
    getTotalSupply: () => Promise<number>;
    getActiveListingCount: () => Promise<number>;
    isApproved: (tokenId: string, owner: string) => Promise<boolean>;

    // Write functions
    mintNFT: (tokenURI: string) => Promise<string | null>;
    mintAndList: (tokenURI: string, price: string) => Promise<string | null>;
    listNFT: (tokenId: string, price: string) => Promise<boolean>;
    buyNFT: (tokenId: string, price: string) => Promise<boolean>;
    delistNFT: (tokenId: string) => Promise<boolean>;
    updatePrice: (tokenId: string, newPrice: string) => Promise<boolean>;
    approveMarketplace: (tokenId: string) => Promise<boolean>;

    // Transaction state
    txState: TransactionState;
    resetTxState: () => void;

    // Contract instances
    isReady: boolean;

    // Alchemy status
    useAlchemy: boolean;
}

export function useNFTContract(
    provider: BrowserProvider | null,
    chainId: number | null
): UseNFTContractReturn {
    const [txState, setTxState] = useState<TransactionState>({
        status: 'idle',
        hash: null,
        error: null,
    });

    // Check if Alchemy is available and configured
    const useAlchemy = useMemo(() => {
        // Only use Alchemy for supported networks (not localhost)
        const supportedChains = [1, 11155111, 137, 80001];
        return isAlchemyConfigured() && chainId !== null && supportedChains.includes(chainId);
    }, [chainId]);

    // Reset Alchemy instance when chain changes
    useEffect(() => {
        if (chainId) {
            resetAlchemyInstance();
        }
    }, [chainId]);

    // Get contract addresses for current chain
    const addresses = useMemo(() => {
        if (!chainId) return null;
        return getContractAddresses(chainId);
    }, [chainId]);

    // Create contract instances
    const contracts = useMemo(() => {
        if (!provider || !addresses?.marketplace || !addresses?.nft) {
            return null;
        }

        return {
            marketplace: new Contract(addresses.marketplace, MARKETPLACE_ABI, provider),
            nft: new Contract(addresses.nft, NFT_ABI, provider),
        };
    }, [provider, addresses]);

    const isReady = Boolean(contracts && provider);

    // Reset transaction state
    const resetTxState = useCallback(() => {
        setTxState({ status: 'idle', hash: null, error: null });
    }, []);

    // Get signer for write operations
    const getSigner = useCallback(async () => {
        if (!provider) throw new Error('Provider not available');
        return provider.getSigner();
    }, [provider]);

    // Fetch NFT metadata from URI (fallback when Alchemy not available)
    const fetchMetadata = useCallback(async (tokenURI: string) => {
        try {
            const url = ipfsToHttp(tokenURI);
            const response = await retry(() => fetch(url), 3, 1000);
            if (!response.ok) throw new Error('Failed to fetch metadata');
            return await response.json();
        } catch (error) {
            console.error('Error fetching metadata:', error);
            return null;
        }
    }, []);

    // ============ READ FUNCTIONS ============

    // Get all active listings (combines on-chain listing data with NFT metadata)
    const getListedNFTs = useCallback(async (
        offset = 0,
        limit = 50
    ): Promise<ListedNFT[]> => {
        if (!contracts || !addresses) return [];

        try {
            // Get listing data from contract
            const [tokenIds, sellers, prices] = await contracts.marketplace.getActiveListings(offset, limit);

            // If using Alchemy, get metadata from there
            if (useAlchemy && chainId) {
                const nfts: ListedNFT[] = await Promise.all(
                    tokenIds.map(async (tokenId: bigint, index: number) => {
                        const tokenIdStr = tokenId.toString();

                        // Get NFT metadata from Alchemy
                        const nftData = await alchemyGetNFTMetadata(addresses.nft, tokenIdStr, chainId);

                        return {
                            tokenId: tokenIdStr,
                            name: nftData?.name || `NFT #${tokenIdStr}`,
                            description: nftData?.description || '',
                            image: nftData?.image || '',
                            owner: nftData?.owner || sellers[index],
                            tokenURI: nftData?.tokenURI || '',
                            metadata: nftData?.metadata,
                            attributes: nftData?.attributes,
                            seller: sellers[index] as string,
                            price: prices[index].toString(),
                            priceFormatted: formatEther(prices[index]),
                            isActive: true,
                        };
                    })
                );
                return nfts;
            }

            // Fallback: fetch metadata manually
            const nfts: ListedNFT[] = await Promise.all(
                tokenIds.map(async (tokenId: bigint, index: number) => {
                    const tokenIdStr = tokenId.toString();
                    const tokenURI = await contracts.nft.tokenURI(tokenId);
                    const owner = await contracts.nft.ownerOf(tokenId);
                    const metadata = await fetchMetadata(tokenURI);

                    return {
                        tokenId: tokenIdStr,
                        name: metadata?.name || `NFT #${tokenIdStr}`,
                        description: metadata?.description || '',
                        image: ipfsToHttp(metadata?.image || ''),
                        owner: owner as string,
                        tokenURI,
                        metadata,
                        attributes: metadata?.attributes,
                        seller: sellers[index] as string,
                        price: prices[index].toString(),
                        priceFormatted: formatEther(prices[index]),
                        isActive: true,
                    };
                })
            );

            return nfts;
        } catch (error) {
            console.error('Error fetching listed NFTs:', error);
            return [];
        }
    }, [contracts, addresses, useAlchemy, chainId, fetchMetadata]);

    // Get single NFT details
    const getNFTDetails = useCallback(async (tokenId: string): Promise<NFT | null> => {
        if (!contracts || !addresses) return null;

        try {
            // Check if token exists
            const exists = await contracts.nft.exists(tokenId);
            if (!exists) return null;

            // Use Alchemy if available
            if (useAlchemy && chainId) {
                return alchemyGetNFTMetadata(addresses.nft, tokenId, chainId);
            }

            // Fallback: fetch manually
            const [tokenURI, owner] = await Promise.all([
                contracts.nft.tokenURI(tokenId),
                contracts.nft.ownerOf(tokenId),
            ]);

            const metadata = await fetchMetadata(tokenURI);

            return {
                tokenId,
                name: metadata?.name || `NFT #${tokenId}`,
                description: metadata?.description || '',
                image: ipfsToHttp(metadata?.image || ''),
                owner: owner as string,
                tokenURI,
                metadata,
                attributes: metadata?.attributes,
            };
        } catch (error) {
            console.error('Error fetching NFT details:', error);
            return null;
        }
    }, [contracts, addresses, useAlchemy, chainId, fetchMetadata]);

    // Get listing details
    const getListing = useCallback(async (tokenId: string): Promise<Listing | null> => {
        if (!contracts) return null;

        try {
            const [seller, price, isActive] = await contracts.marketplace.getListing(tokenId);

            return {
                tokenId,
                seller: seller as string,
                price: price.toString(),
                isActive: isActive as boolean,
            };
        } catch (error) {
            console.error('Error fetching listing:', error);
            return null;
        }
    }, [contracts]);

    // Get NFTs owned by address
    const getOwnedNFTs = useCallback(async (owner: string): Promise<NFT[]> => {
        if (!contracts || !addresses) return [];

        try {
            // Use Alchemy if available - much faster!
            if (useAlchemy && chainId) {
                return alchemyGetOwnedNFTs(owner, addresses.nft, chainId);
            }

            // Fallback: loop through all tokens (inefficient for large collections)
            const totalSupply = await contracts.nft.totalSupply();
            const nfts: NFT[] = [];

            for (let i = 0; i < totalSupply; i++) {
                try {
                    const tokenOwner = await contracts.nft.ownerOf(i);
                    if (tokenOwner.toLowerCase() === owner.toLowerCase()) {
                        const nft = await getNFTDetails(i.toString());
                        if (nft) nfts.push(nft);
                    }
                } catch {
                    continue;
                }
            }

            return nfts;
        } catch (error) {
            console.error('Error fetching owned NFTs:', error);
            return [];
        }
    }, [contracts, addresses, useAlchemy, chainId, getNFTDetails]);

    // Get total supply
    const getTotalSupply = useCallback(async (): Promise<number> => {
        if (!contracts) return 0;
        try {
            const supply = await contracts.nft.totalSupply();
            return Number(supply);
        } catch (error) {
            console.error('Error fetching total supply:', error);
            return 0;
        }
    }, [contracts]);

    // Get active listing count
    const getActiveListingCount = useCallback(async (): Promise<number> => {
        if (!contracts) return 0;
        try {
            const count = await contracts.marketplace.getActiveListingCount();
            return Number(count);
        } catch (error) {
            console.error('Error fetching listing count:', error);
            return 0;
        }
    }, [contracts]);

    // Check if marketplace is approved
    const isApproved = useCallback(async (tokenId: string, owner: string): Promise<boolean> => {
        if (!contracts || !addresses) return false;
        try {
            const approved = await contracts.nft.getApproved(tokenId);
            const isApprovedForAll = await contracts.nft.isApprovedForAll(owner, addresses.marketplace);
            return approved === addresses.marketplace || isApprovedForAll;
        } catch {
            return false;
        }
    }, [contracts, addresses]);

    // ============ WRITE FUNCTIONS ============

    // Mint NFT
    const mintNFT = useCallback(async (tokenURI: string): Promise<string | null> => {
        if (!contracts) {
            setTxState({ status: 'error', hash: null, error: 'Contracts not initialized' });
            return null;
        }

        setTxState({ status: 'pending', hash: null, error: null });

        try {
            const signer = await getSigner();
            const marketplaceWithSigner = contracts.marketplace.connect(signer) as Contract;

            const tx = await marketplaceWithSigner.mintNFT(tokenURI);
            setTxState({ status: 'confirming', hash: tx.hash, error: null });

            const receipt = await tx.wait();

            // Get token ID from event
            const event = receipt.logs.find(
                (log: { fragment?: { name: string } }) => log.fragment?.name === 'NFTMinted'
            );
            const tokenId = event?.args?.[0]?.toString() || null;

            setTxState({ status: 'success', hash: tx.hash, error: null });
            return tokenId;
        } catch (error) {
            const message = parseContractError(error);
            setTxState({ status: 'error', hash: null, error: message });
            return null;
        }
    }, [contracts, getSigner]);

    // Mint and list NFT
    const mintAndList = useCallback(async (
        tokenURI: string,
        price: string
    ): Promise<string | null> => {
        if (!contracts) {
            setTxState({ status: 'error', hash: null, error: 'Contracts not initialized' });
            return null;
        }

        setTxState({ status: 'pending', hash: null, error: null });

        try {
            const signer = await getSigner();
            const marketplaceWithSigner = contracts.marketplace.connect(signer) as Contract;

            const priceWei = parseEther(price);
            const tx = await marketplaceWithSigner.mintAndList(tokenURI, priceWei);
            setTxState({ status: 'confirming', hash: tx.hash, error: null });

            const receipt = await tx.wait();

            // Get token ID from event
            const event = receipt.logs.find(
                (log: { fragment?: { name: string } }) => log.fragment?.name === 'NFTListed'
            );
            const tokenId = event?.args?.[0]?.toString() || null;

            setTxState({ status: 'success', hash: tx.hash, error: null });
            return tokenId;
        } catch (error) {
            const message = parseContractError(error);
            setTxState({ status: 'error', hash: null, error: message });
            return null;
        }
    }, [contracts, getSigner]);

    // List NFT for sale
    const listNFT = useCallback(async (
        tokenId: string,
        price: string
    ): Promise<boolean> => {
        if (!contracts) {
            setTxState({ status: 'error', hash: null, error: 'Contracts not initialized' });
            return false;
        }

        setTxState({ status: 'pending', hash: null, error: null });

        try {
            const signer = await getSigner();
            const marketplaceWithSigner = contracts.marketplace.connect(signer) as Contract;

            const priceWei = parseEther(price);
            const tx = await marketplaceWithSigner.listNFT(tokenId, priceWei);
            setTxState({ status: 'confirming', hash: tx.hash, error: null });

            await tx.wait();

            setTxState({ status: 'success', hash: tx.hash, error: null });
            return true;
        } catch (error) {
            const message = parseContractError(error);
            setTxState({ status: 'error', hash: null, error: message });
            return false;
        }
    }, [contracts, getSigner]);

    // Buy NFT
    const buyNFT = useCallback(async (
        tokenId: string,
        price: string
    ): Promise<boolean> => {
        if (!contracts) {
            setTxState({ status: 'error', hash: null, error: 'Contracts not initialized' });
            return false;
        }

        setTxState({ status: 'pending', hash: null, error: null });

        try {
            const signer = await getSigner();
            const marketplaceWithSigner = contracts.marketplace.connect(signer) as Contract;

            const tx = await marketplaceWithSigner.buyNFT(tokenId, { value: price });
            setTxState({ status: 'confirming', hash: tx.hash, error: null });

            await tx.wait();

            setTxState({ status: 'success', hash: tx.hash, error: null });
            return true;
        } catch (error) {
            const message = parseContractError(error);
            setTxState({ status: 'error', hash: null, error: message });
            return false;
        }
    }, [contracts, getSigner]);

    // Delist NFT
    const delistNFT = useCallback(async (tokenId: string): Promise<boolean> => {
        if (!contracts) {
            setTxState({ status: 'error', hash: null, error: 'Contracts not initialized' });
            return false;
        }

        setTxState({ status: 'pending', hash: null, error: null });

        try {
            const signer = await getSigner();
            const marketplaceWithSigner = contracts.marketplace.connect(signer) as Contract;

            const tx = await marketplaceWithSigner.delistNFT(tokenId);
            setTxState({ status: 'confirming', hash: tx.hash, error: null });

            await tx.wait();

            setTxState({ status: 'success', hash: tx.hash, error: null });
            return true;
        } catch (error) {
            const message = parseContractError(error);
            setTxState({ status: 'error', hash: null, error: message });
            return false;
        }
    }, [contracts, getSigner]);

    // Update listing price
    const updatePrice = useCallback(async (
        tokenId: string,
        newPrice: string
    ): Promise<boolean> => {
        if (!contracts) {
            setTxState({ status: 'error', hash: null, error: 'Contracts not initialized' });
            return false;
        }

        setTxState({ status: 'pending', hash: null, error: null });

        try {
            const signer = await getSigner();
            const marketplaceWithSigner = contracts.marketplace.connect(signer) as Contract;

            const priceWei = parseEther(newPrice);
            const tx = await marketplaceWithSigner.updateListingPrice(tokenId, priceWei);
            setTxState({ status: 'confirming', hash: tx.hash, error: null });

            await tx.wait();

            setTxState({ status: 'success', hash: tx.hash, error: null });
            return true;
        } catch (error) {
            const message = parseContractError(error);
            setTxState({ status: 'error', hash: null, error: message });
            return false;
        }
    }, [contracts, getSigner]);

    // Approve marketplace to transfer NFT
    const approveMarketplace = useCallback(async (tokenId: string): Promise<boolean> => {
        if (!contracts || !addresses) {
            setTxState({ status: 'error', hash: null, error: 'Contracts not initialized' });
            return false;
        }

        setTxState({ status: 'pending', hash: null, error: null });

        try {
            const signer = await getSigner();
            const nftWithSigner = contracts.nft.connect(signer) as Contract;

            const tx = await nftWithSigner.approve(addresses.marketplace, tokenId);
            setTxState({ status: 'confirming', hash: tx.hash, error: null });

            await tx.wait();

            setTxState({ status: 'success', hash: tx.hash, error: null });
            return true;
        } catch (error) {
            const message = parseContractError(error);
            setTxState({ status: 'error', hash: null, error: message });
            return false;
        }
    }, [contracts, addresses, getSigner]);

    return {
        // Read functions
        getListedNFTs,
        getNFTDetails,
        getListing,
        getOwnedNFTs,
        getTotalSupply,
        getActiveListingCount,
        isApproved,

        // Write functions
        mintNFT,
        mintAndList,
        listNFT,
        buyNFT,
        delistNFT,
        updatePrice,
        approveMarketplace,

        // Transaction state
        txState,
        resetTxState,

        // Ready state
        isReady,

        // Alchemy status
        useAlchemy,
    };
}

export default useNFTContract;
