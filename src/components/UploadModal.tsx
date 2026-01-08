import React, { useState, useCallback, useRef } from 'react';
import {
    X,
    Upload,
    Image as ImageIcon,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
} from 'lucide-react';
import { useNFTContext } from '../context/NFTContext';
import { uploadNFTToPinata, isIPFSConfigured } from '../utils/ipfs';
import { isValidPrice, formatFileSize, isValidImageType, isValidFileSize, MAX_FILE_SIZE, getExplorerTxUrl } from '../utils';
import { useWalletContext } from '../context/WalletContext';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type UploadStep = 'form' | 'uploading' | 'minting' | 'success' | 'error';

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
    const { mintAndList, mintNFT, txState, resetTxState, fetchListedNFTs, fetchOwnedNFTs } = useNFTContext();
    const { chainId } = useWalletContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<UploadStep>('form');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [listImmediately, setListImmediately] = useState(true);
    const [error, setError] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState('');
    const [txHash, setTxHash] = useState<string>('');
    const [mintedTokenId, setMintedTokenId] = useState<string>('');

    const handleClose = useCallback(() => {
        if (step === 'uploading' || step === 'minting') return;
        setStep('form');
        setFile(null);
        setPreview('');
        setName('');
        setDescription('');
        setPrice('');
        setError('');
        setUploadProgress('');
        setTxHash('');
        setMintedTokenId('');
        resetTxState();
        onClose();
    }, [step, onClose, resetTxState]);

    const handleFileSelect = useCallback((selectedFile: File) => {
        setError('');

        if (!isValidImageType(selectedFile)) {
            setError('Invalid file type. Please upload JPEG, PNG, GIF, or WebP.');
            return;
        }

        if (!isValidFileSize(selectedFile)) {
            setError(`File too large. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`);
            return;
        }

        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);

        // Auto-fill name from filename
        if (!name) {
            const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
            setName(fileName);
        }
    }, [name]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFileSelect(droppedFile);
    }, [handleFileSelect]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!file) {
            setError('Please select an image');
            return;
        }
        if (!name.trim()) {
            setError('Please enter a name');
            return;
        }
        if (listImmediately && !isValidPrice(price)) {
            setError('Please enter a valid price');
            return;
        }

        if (!isIPFSConfigured()) {
            setError('IPFS not configured. Please add Pinata API keys to environment variables.');
            return;
        }

        try {
            // Step 1: Upload to IPFS
            setStep('uploading');
            setUploadProgress('Uploading image to IPFS...');

            const { metadataUri } = await uploadNFTToPinata(
                file,
                name.trim(),
                description.trim()
            );

            setUploadProgress('Image and metadata uploaded!');

            // Step 2: Mint NFT
            setStep('minting');

            let tokenId: string | null;

            if (listImmediately) {
                tokenId = await mintAndList(metadataUri, price);
            } else {
                tokenId = await mintNFT(metadataUri);
            }

            if (tokenId) {
                setMintedTokenId(tokenId);
                setTxHash(txState.hash || '');
                setStep('success');
                // Force refresh NFT lists after successful mint
                fetchListedNFTs(true);
                fetchOwnedNFTs(true);
            } else {
                throw new Error(txState.error || 'Minting failed');
            }
        } catch (err) {
            setStep('error');
            const error = err as Error;
            setError(error.message || 'Something went wrong');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg glass rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-700">
                    <h2 className="text-xl font-display font-bold text-white">
                        {step === 'form' && 'Create NFT'}
                        {step === 'uploading' && 'Uploading to IPFS'}
                        {step === 'minting' && 'Minting NFT'}
                        {step === 'success' && 'Success!'}
                        {step === 'error' && 'Error'}
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={step === 'uploading' || step === 'minting'}
                        className="p-2 rounded-lg hover:bg-surface-800 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-surface-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Form Step */}
                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* File Upload */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${preview
                                    ? 'border-primary-500 bg-primary-500/5'
                                    : 'border-surface-600 hover:border-primary-500/50 hover:bg-surface-800/50'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                    className="hidden"
                                />

                                {preview ? (
                                    <div className="relative">
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="max-h-48 mx-auto rounded-lg"
                                        />
                                        <p className="mt-2 text-sm text-surface-400">
                                            {file?.name} ({formatFileSize(file?.size || 0)})
                                        </p>
                                    </div>
                                ) : (
                                    <div className="py-8">
                                        <Upload className="w-12 h-12 mx-auto text-surface-500 mb-4" />
                                        <p className="text-surface-300 font-medium">
                                            Drag & drop or click to upload
                                        </p>
                                        <p className="text-sm text-surface-500 mt-1">
                                            JPEG, PNG, GIF, WebP (Max {formatFileSize(MAX_FILE_SIZE)})
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter NFT name"
                                    className="input"
                                    maxLength={100}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your NFT"
                                    className="input min-h-[100px] resize-none"
                                    maxLength={1000}
                                />
                            </div>

                            {/* List Immediately Toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-surface-300">
                                    List for sale immediately
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setListImmediately(!listImmediately)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${listImmediately ? 'bg-primary-500' : 'bg-surface-600'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${listImmediately ? 'translate-x-6' : ''
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Price (if listing) */}
                            {listImmediately && (
                                <div>
                                    <label className="block text-sm font-medium text-surface-300 mb-2">
                                        Price (ETH) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="input"
                                    />
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-error-500/10 border border-error-500/30">
                                    <AlertCircle className="w-5 h-5 text-error-400 flex-shrink-0" />
                                    <p className="text-sm text-error-400">{error}</p>
                                </div>
                            )}

                            {/* Submit */}
                            <button type="submit" className="btn-primary w-full">
                                <ImageIcon className="w-5 h-5" />
                                Create NFT
                            </button>
                        </form>
                    )}

                    {/* Uploading Step */}
                    {step === 'uploading' && (
                        <div className="text-center py-8">
                            <Loader2 className="w-16 h-16 mx-auto text-primary-500 animate-spin mb-4" />
                            <p className="text-lg font-medium text-white mb-2">
                                Uploading to IPFS
                            </p>
                            <p className="text-surface-400">{uploadProgress}</p>
                        </div>
                    )}

                    {/* Minting Step */}
                    {step === 'minting' && (
                        <div className="text-center py-8">
                            <Loader2 className="w-16 h-16 mx-auto text-accent-500 animate-spin mb-4" />
                            <p className="text-lg font-medium text-white mb-2">
                                {txState.status === 'pending'
                                    ? 'Waiting for confirmation...'
                                    : 'Confirming transaction...'}
                            </p>
                            <p className="text-surface-400">
                                Please confirm the transaction in your wallet
                            </p>
                            {txState.hash && (
                                <a
                                    href={getExplorerTxUrl(txState.hash, chainId || 1)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-4 text-sm text-primary-400 hover:text-primary-300"
                                >
                                    View transaction
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    )}

                    {/* Success Step */}
                    {step === 'success' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-success-400" />
                            </div>
                            <p className="text-lg font-medium text-white mb-2">
                                NFT Created Successfully!
                            </p>
                            <p className="text-surface-400 mb-4">
                                Token ID: #{mintedTokenId}
                            </p>
                            {txHash && chainId && (
                                <a
                                    href={getExplorerTxUrl(txHash, chainId)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
                                >
                                    View on Explorer
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                            <button
                                onClick={handleClose}
                                className="btn-primary w-full mt-6"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {/* Error Step */}
                    {step === 'error' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error-500/20 flex items-center justify-center">
                                <AlertCircle className="w-10 h-10 text-error-400" />
                            </div>
                            <p className="text-lg font-medium text-white mb-2">
                                Something went wrong
                            </p>
                            <p className="text-surface-400 mb-6">{error}</p>
                            <button
                                onClick={() => {
                                    setStep('form');
                                    setError('');
                                }}
                                className="btn-secondary"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UploadModal;

