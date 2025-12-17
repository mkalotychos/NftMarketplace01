import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wallet, Upload, ShoppingCart, Sparkles, Zap, Shield } from 'lucide-react';
import { useNFTContext } from '../context/NFTContext';
import { NFTCard, NFTCardSkeleton } from '../components';

export function Home() {
    const { listedNFTs, isLoading, totalSupply, activeListingCount } = useNFTContext();

    // Get featured NFTs (latest 8)
    const featuredNFTs = listedNFTs.slice(0, 8);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 mesh-bg opacity-50" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 mb-8">
                            <Sparkles className="w-4 h-4 text-primary-400" />
                            <span className="text-sm font-medium text-primary-400">
                                The Future of Digital Ownership
                            </span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white mb-6">
                            Discover, Collect &{' '}
                            <span className="gradient-text">Trade NFTs</span>
                        </h1>

                        {/* Subheading */}
                        <p className="text-xl text-surface-300 mb-10 max-w-2xl mx-auto">
                            The premier marketplace for unique digital assets. Buy, sell, and discover
                            exclusive NFTs from creators around the world.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/explore" className="btn-primary text-lg px-8 py-4">
                                <Sparkles className="w-5 h-5" />
                                Explore NFTs
                            </Link>
                            <Link to="/upload" className="btn-secondary text-lg px-8 py-4">
                                <Upload className="w-5 h-5" />
                                Create NFT
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Total NFTs', value: totalSupply.toLocaleString() },
                            { label: 'Active Listings', value: activeListingCount.toLocaleString() },
                            { label: 'Total Volume', value: '124 ETH' },
                            { label: 'Creators', value: '500+' },
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className="card p-6 text-center hover:border-primary-500/50 transition-colors"
                            >
                                <p className="text-3xl font-display font-bold gradient-text">
                                    {stat.value}
                                </p>
                                <p className="text-surface-400 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured NFTs Section */}
            <section className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-display font-bold text-white">
                                Featured NFTs
                            </h2>
                            <p className="text-surface-400 mt-2">
                                Discover the latest and most popular NFTs
                            </p>
                        </div>
                        <Link
                            to="/explore"
                            className="btn-ghost text-primary-400 hover:text-primary-300"
                        >
                            View All
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* NFT Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <NFTCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : featuredNFTs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredNFTs.map((nft) => (
                                <NFTCard key={nft.tokenId} nft={nft} />
                            ))}
                        </div>
                    ) : (
                        <div className="card p-12 text-center">
                            <p className="text-surface-400">
                                No NFTs listed yet. Be the first to create one!
                            </p>
                            <Link to="/upload" className="btn-primary mt-4 inline-flex">
                                <Upload className="w-4 h-4" />
                                Create NFT
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/20 to-transparent" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-display font-bold text-white">
                            How It Works
                        </h2>
                        <p className="text-surface-400 mt-2 max-w-2xl mx-auto">
                            Get started with NFTs in three simple steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Wallet className="w-8 h-8" />,
                                title: 'Connect Wallet',
                                description:
                                    'Connect your MetaMask wallet to start buying, selling, and creating NFTs on the marketplace.',
                            },
                            {
                                icon: <Upload className="w-8 h-8" />,
                                title: 'Create & List',
                                description:
                                    'Upload your digital artwork, set your price, and list it for sale in just a few clicks.',
                            },
                            {
                                icon: <ShoppingCart className="w-8 h-8" />,
                                title: 'Buy & Trade',
                                description:
                                    'Browse the marketplace, discover unique NFTs, and build your digital art collection.',
                            },
                        ].map((step, index) => (
                            <div key={index} className="card p-8 text-center card-hover">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center text-primary-400">
                                    {step.icon}
                                </div>
                                <div className="w-8 h-8 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary-400">
                                        {index + 1}
                                    </span>
                                </div>
                                <h3 className="text-xl font-display font-semibold text-white mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-surface-400">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-display font-bold text-white mb-6">
                                Why Choose Our Marketplace?
                            </h2>
                            <div className="space-y-6">
                                {[
                                    {
                                        icon: <Shield className="w-6 h-6" />,
                                        title: 'Secure Transactions',
                                        description:
                                            'All transactions are secured by smart contracts on the blockchain.',
                                    },
                                    {
                                        icon: <Zap className="w-6 h-6" />,
                                        title: 'Low Fees',
                                        description:
                                            'Only 2.5% marketplace fee on sales. Keep more of your earnings.',
                                    },
                                    {
                                        icon: <Sparkles className="w-6 h-6" />,
                                        title: 'Easy to Use',
                                        description:
                                            'Intuitive interface makes creating and trading NFTs simple.',
                                    },
                                ].map((feature, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                                            {feature.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white mb-1">
                                                {feature.title}
                                            </h3>
                                            <p className="text-surface-400">{feature.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl blur-3xl" />
                            <div className="relative card p-2">
                                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center">
                                    <div className="text-center p-8">
                                        <Sparkles className="w-16 h-16 mx-auto text-white/80 mb-4" />
                                        <p className="text-xl font-display font-bold text-white">
                                            Start Creating Today
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="card p-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-accent-600/20" />
                        <div className="relative">
                            <h2 className="text-3xl font-display font-bold text-white mb-4">
                                Ready to Get Started?
                            </h2>
                            <p className="text-surface-300 mb-8 max-w-xl mx-auto">
                                Join thousands of creators and collectors on the leading NFT marketplace.
                            </p>
                            <Link to="/explore" className="btn-primary text-lg px-8">
                                Explore Marketplace
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;

