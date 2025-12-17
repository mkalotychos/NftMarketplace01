import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, X } from 'lucide-react';
import type { TransactionStatus } from '../../types';
import { getExplorerTxUrl } from '../../utils';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: TransactionStatus;
    title: string;
    description?: string;
    hash?: string | null;
    chainId?: number;
    error?: string | null;
}

export function TransactionModal({
    isOpen,
    onClose,
    status,
    title,
    description,
    hash,
    chainId,
    error,
}: TransactionModalProps) {
    if (!isOpen) return null;

    const canClose = status === 'success' || status === 'error' || status === 'idle';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"
                onClick={canClose ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm glass rounded-2xl shadow-2xl overflow-hidden">
                {canClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-800 transition-colors"
                    >
                        <X className="w-5 h-5 text-surface-400" />
                    </button>
                )}

                <div className="p-8 text-center">
                    {/* Status Icon */}
                    <div className="mb-6">
                        {(status === 'pending' || status === 'confirming') && (
                            <div className="w-20 h-20 mx-auto rounded-full bg-primary-500/20 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="w-20 h-20 mx-auto rounded-full bg-success-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-success-400" />
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="w-20 h-20 mx-auto rounded-full bg-error-500/20 flex items-center justify-center">
                                <AlertCircle className="w-10 h-10 text-error-400" />
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-display font-semibold text-white mb-2">
                        {status === 'pending' && 'Waiting for Confirmation'}
                        {status === 'confirming' && 'Transaction Submitted'}
                        {status === 'success' && 'Transaction Successful'}
                        {status === 'error' && 'Transaction Failed'}
                        {status === 'idle' && title}
                    </h3>

                    {/* Description */}
                    <p className="text-surface-400 mb-4">
                        {status === 'pending' && 'Please confirm the transaction in your wallet'}
                        {status === 'confirming' && 'Waiting for blockchain confirmation...'}
                        {status === 'success' && (description || 'Your transaction has been confirmed')}
                        {status === 'error' && (error || 'Something went wrong')}
                        {status === 'idle' && description}
                    </p>

                    {/* Transaction Hash Link */}
                    {hash && chainId && (
                        <a
                            href={getExplorerTxUrl(hash, chainId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                        >
                            View on Explorer
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}

                    {/* Close Button */}
                    {canClose && (
                        <button
                            onClick={onClose}
                            className="btn-primary w-full mt-6"
                        >
                            {status === 'success' ? 'Done' : 'Close'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TransactionModal;

