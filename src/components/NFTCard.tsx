import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, User, Tag, ShoppingCart, X as XIcon } from 'lucide-react';
import { useWalletContext } from '../context/WalletContext';
import { truncateAddress } from '../utils';
import type { ListedNFT, NFT } from '../types';

interface NFTCardProps {
    nft: ListedNFT | NFT;
    onBuy?: (tokenId: string, price: string) => void;
    onList?: (tokenId: string) => void;
    onDelist?: (tokenId: string) => void;
    isLoading?: boolean;
}

export function NFTCard({
    nft,
    onBuy,
    onList,
    onDelist,
    isLoading = false,
}: NFTCardProps) {
    const { account } = useWalletContext();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const isListed = 'isActive' in nft && nft.isActive;
    const price = 'priceFormatted' in nft ? nft.priceFormatted : null;
    const seller = 'seller' in nft ? nft.seller : null;

    const isOwner = account?.toLowerCase() === nft.owner.toLowerCase();
    const isSeller = seller && account?.toLowerCase() === seller.toLowerCase();

    // Determine what actions are available
    const canBuy = isListed && !isOwner && !isSeller && onBuy;
    const canList = isOwner && !isListed && onList;
    const canDelist = isSeller && isListed && onDelist;

    return (
        <div className="card card-hover group">
            {/* Image Container */}
            <Link to={`/nft/${nft.tokenId}`} className="block relative aspect-square overflow-hidden">
                {/* Loading skeleton */}
                {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 skeleton shimmer" />
                )}

                {/* Image */}
                {!imageError ? (
                    <img
                        src={nft.image}
                        alt={nft.name}
                        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-800">
                        <div className="text-center p-4">
                            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-surface-700 flex items-center justify-center">
                                <Tag className="w-8 h-8 text-surface-500" />
                            </div>
                            <span className="text-sm text-surface-500">Image unavailable</span>
                        </div>
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Status Badge */}
                {isListed && (
                    <div className="absolute top-3 left-3">
                        <span className="badge-success">For Sale</span>
                    </div>
                )}

                {/* Token ID */}
                <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded-lg bg-surface-900/80 backdrop-blur-sm text-xs font-mono text-surface-300">
                        #{nft.tokenId}
                    </span>
                </div>
            </Link>

            {/* Content */}
            <div className="p-4">
                {/* Name */}
                <Link to={`/nft/${nft.tokenId}`}>
                    <h3 className="font-display font-semibold text-white truncate hover:text-primary-400 transition-colors">
                        {nft.name}
                    </h3>
                </Link>

                {/* Owner/Seller */}
                <div className="mt-2 flex items-center gap-2 text-sm text-surface-400">
                    <User className="w-4 h-4" />
                    <span className="truncate">
                        {isOwner ? 'You' : truncateAddress(seller || nft.owner)}
                    </span>
                </div>

                {/* Price & Actions */}
                <div className="mt-4 flex items-center justify-between">
                    {isListed && price ? (
                        <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-primary-400" />
                            <span className="font-display font-bold text-white">
                                {price} ETH
                            </span>
                        </div>
                    ) : (
                        <span className="text-sm text-surface-500">Not listed</span>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {canBuy && (
                            <button
                                onClick={() => onBuy(nft.tokenId, ('price' in nft ? nft.price : ''))}
                                disabled={isLoading}
                                className="btn-primary !px-4 !py-2 text-sm"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                Buy
                            </button>
                        )}

                        {canList && (
                            <button
                                onClick={() => onList(nft.tokenId)}
                                disabled={isLoading}
                                className="btn-accent !px-4 !py-2 text-sm"
                            >
                                <Tag className="w-4 h-4" />
                                List
                            </button>
                        )}

                        {canDelist && (
                            <button
                                onClick={() => onDelist(nft.tokenId)}
                                disabled={isLoading}
                                className="btn-secondary !px-4 !py-2 text-sm"
                            >
                                <XIcon className="w-4 h-4" />
                                Delist
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Skeleton loader for NFT cards
export function NFTCardSkeleton() {
    return (
        <div className="card">
            <div className="aspect-square skeleton shimmer" />
            <div className="p-4 space-y-3">
                <div className="h-5 skeleton rounded w-3/4 shimmer" />
                <div className="h-4 skeleton rounded w-1/2 shimmer" />
                <div className="flex justify-between items-center">
                    <div className="h-6 skeleton rounded w-24 shimmer" />
                    <div className="h-9 skeleton rounded w-20 shimmer" />
                </div>
            </div>
        </div>
    );
}

export default NFTCard;

