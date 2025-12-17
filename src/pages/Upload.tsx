import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Info } from 'lucide-react';
import { useWalletContext } from '../context/WalletContext';
import { UploadModal } from '../components';

export function Upload() {
    const navigate = useNavigate();
    const { isConnected, connect } = useWalletContext();
    const [showModal, setShowModal] = useState(false);

    // Not connected state
    if (!isConnected) {
        return (
            <div className="min-h-screen pt-24 pb-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-500/20 flex items-center justify-center">
                            <Wallet className="w-10 h-10 text-primary-400" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white mb-4">
                            Connect Your Wallet
                        </h2>
                        <p className="text-surface-400 mb-8 max-w-md mx-auto">
                            Connect your wallet to create and list NFTs on the marketplace.
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
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-display font-bold text-white mb-4">
                        Create NFT
                    </h1>
                    <p className="text-surface-400">
                        Upload your digital artwork and mint it as an NFT
                    </p>
                </div>

                {/* Info Card */}
                <div className="card p-6 mb-8">
                    <div className="flex gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                                <Info className="w-5 h-5 text-accent-400" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-2">Before you start</h3>
                            <ul className="text-surface-400 space-y-2 text-sm">
                                <li>• Your image will be stored on IPFS (decentralized storage)</li>
                                <li>• You'll need some ETH/MATIC for gas fees</li>
                                <li>• A 2.5% marketplace fee applies when your NFT sells</li>
                                <li>• Supported formats: JPEG, PNG, GIF, WebP (max 10MB)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Create Button */}
                <div className="text-center">
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary text-lg px-12 py-4"
                    >
                        Create Your NFT
                    </button>
                </div>

                {/* Features Grid */}
                <div className="mt-16 grid sm:grid-cols-3 gap-6">
                    {[
                        {
                            title: 'Decentralized',
                            description: 'Your NFT is stored on IPFS and secured by blockchain',
                        },
                        {
                            title: 'Own Forever',
                            description: 'True ownership - no platform can take it away',
                        },
                        {
                            title: 'Trade Freely',
                            description: 'List, sell, or transfer your NFT anytime',
                        },
                    ].map((feature, index) => (
                        <div key={index} className="card p-6 text-center">
                            <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-surface-400">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upload Modal */}
            <UploadModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                }}
            />
        </div>
    );
}

export default Upload;

