import { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useNFTContext } from '../context/NFTContext';
import { useWalletContext } from '../context/WalletContext';
import { NFTCard, NFTCardSkeleton, EmptyState, TransactionModal } from '../components';
import { debounce } from '../utils';
import type { SortOption, StatusFilter } from '../types';

const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
];

const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Items' },
    { value: 'for-sale', label: 'For Sale' },
];

export function Explore() {
    const {
        filteredNFTs,
        isLoading,
        filters,
        setFilters,
        resetFilters,
        activeListingCount,
        buyNFT,
        txState,
        resetTxState,
        fetchListedNFTs,
        fetchOwnedNFTs,
    } = useNFTContext();
    const { isConnected, chainId } = useWalletContext();

    const [showFilters, setShowFilters] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [buyingTokenId, setBuyingTokenId] = useState<string | null>(null);

    // Debounced search handler
    const handleSearchChange = useCallback(
        debounce((value: string) => {
            setFilters({ searchQuery: value });
        }, 300),
        [setFilters]
    );

    // Handle buy NFT
    const handleBuy = async (tokenId: string, price: string) => {
        if (!isConnected) {
            alert('Please connect your wallet first');
            return;
        }
        setBuyingTokenId(tokenId);
        const success = await buyNFT(tokenId, price);
        if (success) {
            // Refresh lists after successful purchase
            fetchListedNFTs(true);
            fetchOwnedNFTs(true);
        }
    };

    // Close transaction modal
    const handleCloseModal = () => {
        setBuyingTokenId(null);
        resetTxState();
    };

    const hasActiveFilters =
        filters.searchQuery ||
        filters.status !== 'all' ||
        filters.priceMin ||
        filters.priceMax;

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-white mb-2">
                        Explore NFTs
                    </h1>
                    <p className="text-surface-400">
                        {activeListingCount} items listed for sale
                    </p>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            defaultValue={filters.searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="input pl-12"
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="btn-secondary w-full lg:w-auto justify-between min-w-[200px]"
                        >
                            {sortOptions.find((o) => o.value === filters.sortBy)?.label}
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {showSortDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowSortDropdown(false)}
                                />
                                <div className="absolute right-0 mt-2 w-full min-w-[200px] glass border border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setFilters({ sortBy: option.value });
                                                setShowSortDropdown(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left text-sm transition-colors ${filters.sortBy === option.value
                                                ? 'bg-primary-500/20 text-primary-400'
                                                : 'text-surface-300 hover:bg-surface-800'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-secondary ${showFilters ? 'bg-primary-500/20 border-primary-500/50' : ''}`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-primary-500" />
                        )}
                    </button>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="card p-6 mb-8">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">
                                    Status
                                </label>
                                <div className="flex gap-2">
                                    {statusOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setFilters({ status: option.value })}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filters.status === option.value
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">
                                    Min Price (ETH)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={filters.priceMin}
                                    onChange={(e) => setFilters({ priceMin: e.target.value })}
                                    placeholder="0"
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">
                                    Max Price (ETH)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={filters.priceMax}
                                    onChange={(e) => setFilters({ priceMax: e.target.value })}
                                    placeholder="No limit"
                                    className="input"
                                />
                            </div>

                            {/* Reset Filters */}
                            <div className="flex items-end">
                                <button
                                    onClick={resetFilters}
                                    disabled={!hasActiveFilters}
                                    className="btn-ghost text-surface-400 hover:text-white disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-surface-400">
                        {filteredNFTs.length} {filteredNFTs.length === 1 ? 'item' : 'items'} found
                    </p>
                </div>

                {/* NFT Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <NFTCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredNFTs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredNFTs.map((nft) => (
                            <NFTCard
                                key={nft.tokenId}
                                nft={nft}
                                onBuy={handleBuy}
                                isLoading={buyingTokenId === nft.tokenId && txState.status !== 'idle'}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="No NFTs Found"
                        description={
                            hasActiveFilters
                                ? 'Try adjusting your filters to find more NFTs'
                                : 'No NFTs are listed for sale yet. Be the first to create one!'
                        }
                        action={
                            hasActiveFilters
                                ? { label: 'Clear Filters', onClick: resetFilters }
                                : { label: 'Create NFT', href: '/upload' }
                        }
                    />
                )}
            </div>

            {/* Transaction Modal */}
            <TransactionModal
                isOpen={buyingTokenId !== null && txState.status !== 'idle'}
                onClose={handleCloseModal}
                status={txState.status}
                title="Buying NFT"
                description="Your purchase is being processed"
                hash={txState.hash}
                chainId={chainId || undefined}
                error={txState.error}
            />
        </div>
    );
}

export default Explore;

