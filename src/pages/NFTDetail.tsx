import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ExternalLink,
    Copy,
    Check,
    Share2,
    Coins,
    User,
    Tag,
    FileText,
    Clock,
    ShoppingCart,
    Edit3,
} from 'lucide-react';
import { useNFTContext } from '../context/NFTContext';
import { useWalletContext } from '../context/WalletContext';
import {
    PageLoader,
    TransactionModal,
} from '../components';
import {
    truncateAddress,
    getExplorerAddressUrl,
    formatWeiToEth,
} from '../utils';
import { getContractAddresses } from '../contracts/addresses';
import type { NFT, Listing } from '../types';

export function NFTDetail() {
    const { tokenId } = useParams<{ tokenId: string }>();
    const navigate = useNavigate();
    const { account, isConnected, chainId } = useWalletContext();
    const {
        refreshNFT,
        getListing,
        buyNFT,
        delistNFT,
        listNFT,
        updatePrice,
        approveMarketplace,
        txState,
        resetTxState,
    } = useNFTContext();

    const [nft, setNFT] = useState<NFT | null>(null);
    const [listing, setListing] = useState<Listing | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [newPrice, setNewPrice] = useState('');
    const [actionType, setActionType] = useState<'buy' | 'list' | 'delist' | 'updatePrice' | null>(null);

    // Fetch NFT details
    useEffect(() => {
        async function loadNFT() {
            if (!tokenId) return;

            setIsLoading(true);
            try {
                const nftData = await refreshNFT(tokenId);
                if (nftData) {
                    setNFT(nftData);
                    // Get listing info from context's getListing would need to be exposed
                    // For now, we'll check the listedNFTs
                }
            } catch (error) {
                console.error('Error loading NFT:', error);
            }
            setIsLoading(false);
        }

        loadNFT();
    }, [tokenId, refreshNFT]);

    // Check for listing
    const { listedNFTs } = useNFTContext();
    const listedNFT = listedNFTs.find((n) => n.tokenId === tokenId);
    const isListed = listedNFT?.isActive || false;
    const price = listedNFT?.price;
    const priceFormatted = listedNFT?.priceFormatted;
    const seller = listedNFT?.seller;

    const isOwner = nft && account?.toLowerCase() === nft.owner.toLowerCase();
    const isSeller = seller && account?.toLowerCase() === seller.toLowerCase();

    // Contract addresses for display
    const addresses = chainId ? getContractAddresses(chainId) : null;

    // Copy to clipboard
    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Handle buy
    const handleBuy = async () => {
        if (!tokenId || !price) return;
        setActionType('buy');
        await buyNFT(tokenId, price);
    };

    // Handle delist
    const handleDelist = async () => {
        if (!tokenId) return;
        setActionType('delist');
        await delistNFT(tokenId);
    };

    // Handle list
    const handleList = () => {
        setNewPrice('');
        setShowPriceModal(true);
        setActionType('list');
    };

    // Handle update price
    const handleUpdatePrice = () => {
        setNewPrice(priceFormatted || '');
        setShowPriceModal(true);
        setActionType('updatePrice');
    };

    // Submit listing/update
    const handleSubmitPrice = async () => {
        if (!tokenId || !newPrice) return;
        setShowPriceModal(false);

        if (actionType === 'list') {
            // Approve first
            await approveMarketplace(tokenId);
            resetTxState();
            await listNFT(tokenId, newPrice);
        } else if (actionType === 'updatePrice') {
            await updatePrice(tokenId, newPrice);
        }
    };

    // Close modal
    const handleCloseModal = () => {
        setActionType(null);
        resetTxState();
        // Refresh NFT data
        if (tokenId) {
            refreshNFT(tokenId).then(setNFT);
        }
    };

    // Share
    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            await navigator.share({ title: nft?.name, url });
        } else {
            await handleCopy(url);
        }
    };

    if (isLoading) {
        return <PageLoader />;
    }

    if (!nft) {
        return (
            <div className="min-h-screen pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="card p-12 text-center">
                        <h2 className="text-2xl font-display font-bold text-white mb-4">
                            NFT Not Found
                        </h2>
                        <p className="text-surface-400 mb-8">
                            The NFT you're looking for doesn't exist or has been burned.
                        </p>
                        <Link to="/explore" className="btn-primary">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Explore
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="mb-8">
                    <Link
                        to="/explore"
                        className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Explore
                    </Link>
                </nav>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image */}
                    <div className="relative">
                        <div className="card overflow-hidden aspect-square sticky top-24">
                            <img
                                src={nft.image}
                                alt={nft.name}
                                className="w-full h-full object-cover"
                            />
                            {isListed && (
                                <div className="absolute top-4 left-4">
                                    <span className="badge-success">For Sale</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        {/* Header */}
                        <div>
                            <div className="flex items-center gap-2 text-surface-400 mb-2">
                                <span className="font-mono">#{nft.tokenId}</span>
                            </div>
                            <h1 className="text-4xl font-display font-bold text-white mb-4">
                                {nft.name}
                            </h1>
                            {nft.description && (
                                <p className="text-surface-300 text-lg">{nft.description}</p>
                            )}
                        </div>

                        {/* Owner */}
                        <div className="card p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-surface-400">
                                            {isListed ? 'Listed by' : 'Owned by'}
                                        </p>
                                        <p className="font-medium text-white">
                                            {isOwner || isSeller
                                                ? 'You'
                                                : truncateAddress(seller || nft.owner)}
                                        </p>
                                    </div>
                                </div>
                                {chainId && (
                                    <a
                                        href={getExplorerAddressUrl(seller || nft.owner, chainId)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg hover:bg-surface-700 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4 text-surface-400" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="card p-6">
                            {isListed && priceFormatted ? (
                                <div className="mb-6">
                                    <p className="text-sm text-surface-400 mb-1">Current Price</p>
                                    <div className="flex items-center gap-2">
                                        <Coins className="w-6 h-6 text-primary-400" />
                                        <span className="text-3xl font-display font-bold text-white">
                                            {priceFormatted} ETH
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-surface-400 mb-6">Not listed for sale</p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {isListed && !isOwner && !isSeller && isConnected && (
                                    <button
                                        onClick={handleBuy}
                                        className="btn-primary flex-1 text-lg py-4"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        Buy Now
                                    </button>
                                )}

                                {isSeller && isListed && (
                                    <>
                                        <button
                                            onClick={handleUpdatePrice}
                                            className="btn-secondary flex-1"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Change Price
                                        </button>
                                        <button
                                            onClick={handleDelist}
                                            className="btn-secondary flex-1"
                                        >
                                            <Tag className="w-4 h-4" />
                                            Delist
                                        </button>
                                    </>
                                )}

                                {isOwner && !isListed && (
                                    <button onClick={handleList} className="btn-primary flex-1">
                                        <Tag className="w-4 h-4" />
                                        List for Sale
                                    </button>
                                )}

                                <button onClick={handleShare} className="btn-secondary">
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="card p-6">
                            <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary-400" />
                                Details
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-surface-700">
                                    <span className="text-surface-400">Contract Address</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm text-white">
                                            {truncateAddress(addresses?.nft || '')}
                                        </span>
                                        <button
                                            onClick={() => handleCopy(addresses?.nft || '')}
                                            className="p-1 hover:bg-surface-700 rounded transition-colors"
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4 text-success-400" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-surface-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-surface-700">
                                    <span className="text-surface-400">Token ID</span>
                                    <span className="font-mono text-white">{nft.tokenId}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-surface-700">
                                    <span className="text-surface-400">Token Standard</span>
                                    <span className="text-white">ERC-721</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-surface-400">Blockchain</span>
                                    <span className="text-white">
                                        {chainId === 137 ? 'Polygon' : chainId === 80001 ? 'Mumbai' : 'Ethereum'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Attributes */}
                        {nft.attributes && nft.attributes.length > 0 && (
                            <div className="card p-6">
                                <h3 className="font-display font-semibold text-white mb-4">
                                    Attributes
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {nft.attributes.map((attr, index) => (
                                        <div
                                            key={index}
                                            className="p-3 rounded-xl bg-surface-800 border border-surface-700"
                                        >
                                            <p className="text-xs text-surface-400 uppercase mb-1">
                                                {attr.trait_type}
                                            </p>
                                            <p className="font-medium text-white truncate">
                                                {attr.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Price Modal */}
            {showPriceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"
                        onClick={() => setShowPriceModal(false)}
                    />
                    <div className="relative w-full max-w-md glass rounded-2xl shadow-2xl p-6">
                        <h3 className="text-xl font-display font-bold text-white mb-4">
                            {actionType === 'list' ? 'List NFT for Sale' : 'Update Price'}
                        </h3>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-surface-300 mb-2">
                                Price (ETH)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                placeholder="Enter price"
                                className="input"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowPriceModal(false)}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitPrice}
                                disabled={!newPrice || parseFloat(newPrice) <= 0}
                                className="btn-primary flex-1"
                            >
                                {actionType === 'list' ? 'List for Sale' : 'Update Price'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            <TransactionModal
                isOpen={actionType !== null && txState.status !== 'idle' && !showPriceModal}
                onClose={handleCloseModal}
                status={txState.status}
                title={
                    actionType === 'buy'
                        ? 'Buying NFT'
                        : actionType === 'list'
                            ? 'Listing NFT'
                            : actionType === 'delist'
                                ? 'Delisting NFT'
                                : 'Updating Price'
                }
                hash={txState.hash}
                chainId={chainId || undefined}
                error={txState.error}
            />
        </div>
    );
}

export default NFTDetail;

