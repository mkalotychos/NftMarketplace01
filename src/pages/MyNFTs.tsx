import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Image as ImageIcon, Tag, Plus } from 'lucide-react';
import { useWalletContext } from '../context/WalletContext';
import { useNFTContext } from '../context/NFTContext';
import {
    NFTCard,
    NFTCardSkeleton,
    EmptyState,
    TransactionModal,
} from '../components';

type Tab = 'owned' | 'listed';

export function MyNFTs() {
    const { account, isConnected, chainId, connect } = useWalletContext();
    const {
        ownedNFTs,
        listedNFTs,
        isLoadingOwned,
        fetchOwnedNFTs,
        listNFT,
        delistNFT,
        approveMarketplace,
        txState,
        resetTxState,
    } = useNFTContext();

    const [activeTab, setActiveTab] = useState<Tab>('owned');
    const [listingTokenId, setListingTokenId] = useState<string | null>(null);
    const [listingPrice, setListingPrice] = useState('');
    const [showListModal, setShowListModal] = useState(false);
    const [actionTokenId, setActionTokenId] = useState<string | null>(null);

    // Filter owned NFTs to show unlisted ones
    const myListedNFTs = listedNFTs.filter(
        (nft) =>
            nft.seller.toLowerCase() === account?.toLowerCase() && nft.isActive
    );

    const myUnlistedNFTs = ownedNFTs.filter(
        (nft) =>
            !myListedNFTs.some((listed) => listed.tokenId === nft.tokenId)
    );

    // Refresh owned NFTs when account changes (handled by NFTContext now)
    // No need for manual fetch here as context handles it

    // Handle listing an NFT
    const handleList = async (tokenId: string) => {
        setListingTokenId(tokenId);
        setShowListModal(true);
    };

    // Submit listing
    const handleSubmitListing = async () => {
        if (!listingTokenId || !listingPrice) return;

        setActionTokenId(listingTokenId);
        setShowListModal(false);

        // First approve marketplace
        const approved = await approveMarketplace(listingTokenId);
        if (!approved) return;

        // Then list
        resetTxState();
        await listNFT(listingTokenId, listingPrice);

        // Reset and refresh
        setListingTokenId(null);
        setListingPrice('');
        fetchOwnedNFTs(true); // Force refresh after listing
    };

    // Handle delisting
    const handleDelist = async (tokenId: string) => {
        setActionTokenId(tokenId);
        await delistNFT(tokenId);
        fetchOwnedNFTs(true); // Force refresh after delisting
    };

    // Close modal
    const handleCloseModal = () => {
        setActionTokenId(null);
        resetTxState();
    };

    // Not connected state
    if (!isConnected) {
        return (
            <div className="min-h-screen pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-500/20 flex items-center justify-center">
                            <Wallet className="w-10 h-10 text-primary-400" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white mb-4">
                            Connect Your Wallet
                        </h2>
                        <p className="text-surface-400 mb-8 max-w-md mx-auto">
                            Connect your wallet to view and manage your NFT collection.
                        </p>
                        <button onClick={connect} className="btn-primary">
                            <Wallet className="w-5 h-5" />
                            Connect Wallet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-white mb-2">
                            My NFTs
                        </h1>
                        <p className="text-surface-400">
                            Manage your NFT collection
                        </p>
                    </div>
                    <Link to="/upload" className="btn-primary">
                        <Plus className="w-5 h-5" />
                        Create NFT
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                    <div className="card p-4">
                        <p className="text-sm text-surface-400">Total Owned</p>
                        <p className="text-2xl font-display font-bold text-white">
                            {ownedNFTs.length}
                        </p>
                    </div>
                    <div className="card p-4">
                        <p className="text-sm text-surface-400">Listed for Sale</p>
                        <p className="text-2xl font-display font-bold text-white">
                            {myListedNFTs.length}
                        </p>
                    </div>
                    <div className="card p-4 col-span-2 sm:col-span-1">
                        <p className="text-sm text-surface-400">Not Listed</p>
                        <p className="text-2xl font-display font-bold text-white">
                            {myUnlistedNFTs.length}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-surface-700">
                    <button
                        onClick={() => setActiveTab('owned')}
                        className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === 'owned'
                            ? 'text-primary-400'
                            : 'text-surface-400 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Owned ({ownedNFTs.length})
                        </div>
                        {activeTab === 'owned' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('listed')}
                        className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === 'listed'
                            ? 'text-primary-400'
                            : 'text-surface-400 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Listed ({myListedNFTs.length})
                        </div>
                        {activeTab === 'listed' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                        )}
                    </button>
                </div>

                {/* NFT Grid */}
                {isLoadingOwned ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <NFTCardSkeleton key={i} />
                        ))}
                    </div>
                ) : activeTab === 'owned' ? (
                    ownedNFTs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {ownedNFTs.map((nft) => {
                                const listing = myListedNFTs.find(
                                    (l) => l.tokenId === nft.tokenId
                                );
                                return (
                                    <NFTCard
                                        key={nft.tokenId}
                                        nft={listing || nft}
                                        onList={listing ? undefined : handleList}
                                        onDelist={listing ? handleDelist : undefined}
                                        isLoading={actionTokenId === nft.tokenId}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            title="No NFTs Yet"
                            description="You don't own any NFTs yet. Start by creating your first NFT!"
                            action={{ label: 'Create NFT', href: '/upload' }}
                        />
                    )
                ) : myListedNFTs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {myListedNFTs.map((nft) => (
                            <NFTCard
                                key={nft.tokenId}
                                nft={nft}
                                onDelist={handleDelist}
                                isLoading={actionTokenId === nft.tokenId}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="No Listed NFTs"
                        description="You haven't listed any NFTs for sale yet."
                        action={{ label: 'View Owned NFTs', onClick: () => setActiveTab('owned') }}
                    />
                )}
            </div>

            {/* List Modal */}
            {showListModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"
                        onClick={() => setShowListModal(false)}
                    />
                    <div className="relative w-full max-w-md glass rounded-2xl shadow-2xl p-6">
                        <h3 className="text-xl font-display font-bold text-white mb-4">
                            List NFT for Sale
                        </h3>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-surface-300 mb-2">
                                Price (ETH)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={listingPrice}
                                onChange={(e) => setListingPrice(e.target.value)}
                                placeholder="Enter price"
                                className="input"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowListModal(false)}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitListing}
                                disabled={!listingPrice || parseFloat(listingPrice) <= 0}
                                className="btn-primary flex-1"
                            >
                                List for Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            <TransactionModal
                isOpen={actionTokenId !== null && txState.status !== 'idle'}
                onClose={handleCloseModal}
                status={txState.status}
                title="Processing"
                hash={txState.hash}
                chainId={chainId || undefined}
                error={txState.error}
            />
        </div>
    );
}

export default MyNFTs;

