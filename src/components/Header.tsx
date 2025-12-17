import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
    Wallet,
    Menu,
    X,
    ChevronDown,
    LogOut,
    Copy,
    ExternalLink,
    Check,
} from 'lucide-react';
import { useWalletContext } from '../context/WalletContext';
import { truncateAddress, getNetworkName } from '../utils';

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Explore', href: '/explore' },
    { name: 'My NFTs', href: '/my-nfts' },
    { name: 'Upload', href: '/upload' },
];

export function Header() {
    const location = useLocation();
    const {
        account,
        balance,
        chainId,
        isConnecting,
        isConnected,
        connect,
        disconnect,
    } = useWalletContext();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyAddress = async () => {
        if (account) {
            await navigator.clipboard.writeText(account);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const networkName = chainId ? getNetworkName(chainId) : '';

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-700/50">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center transform group-hover:scale-105 transition-transform">
                            <span className="text-white font-bold text-xl">N</span>
                        </div>
                        <span className="font-display font-bold text-xl text-white hidden sm:block">
                            NFT Market
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'text-surface-300 hover:text-white hover:bg-surface-800'
                                    }`
                                }
                            >
                                {item.name}
                            </NavLink>
                        ))}
                    </div>

                    {/* Wallet Button */}
                    <div className="flex items-center gap-4">
                        {isConnected && account ? (
                            <div className="relative">
                                <button
                                    onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 border border-surface-700 hover:border-primary-500/50 transition-all"
                                >
                                    <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                                    <span className="text-sm font-medium text-white">
                                        {truncateAddress(account)}
                                    </span>
                                    <ChevronDown
                                        className={`w-4 h-4 text-surface-400 transition-transform ${walletDropdownOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {/* Dropdown */}
                                {walletDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setWalletDropdownOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-72 rounded-xl glass border border-surface-700 shadow-xl z-50 overflow-hidden">
                                            <div className="p-4 border-b border-surface-700">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm text-surface-400">
                                                        Connected
                                                    </span>
                                                    <span className="badge-success text-xs">
                                                        {networkName}
                                                    </span>
                                                </div>

                                                {/* Address */}
                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-800/50">
                                                    <span className="text-sm font-mono text-white flex-1 truncate">
                                                        {account}
                                                    </span>
                                                    <button
                                                        onClick={handleCopyAddress}
                                                        className="p-1.5 rounded-lg hover:bg-surface-700 transition-colors"
                                                        title="Copy address"
                                                    >
                                                        {copied ? (
                                                            <Check className="w-4 h-4 text-success-400" />
                                                        ) : (
                                                            <Copy className="w-4 h-4 text-surface-400" />
                                                        )}
                                                    </button>
                                                    <a
                                                        href={`https://etherscan.io/address/${account}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded-lg hover:bg-surface-700 transition-colors"
                                                        title="View on explorer"
                                                    >
                                                        <ExternalLink className="w-4 h-4 text-surface-400" />
                                                    </a>
                                                </div>

                                                {/* Balance */}
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-sm text-surface-400">
                                                        Balance
                                                    </span>
                                                    <span className="text-sm font-medium text-white">
                                                        {parseFloat(balance).toFixed(4)} ETH
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="p-2">
                                                <button
                                                    onClick={() => {
                                                        disconnect();
                                                        setWalletDropdownOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-error-400 hover:bg-error-500/10 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Disconnect</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={connect}
                                disabled={isConnecting}
                                className="btn-primary"
                            >
                                <Wallet className="w-4 h-4" />
                                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                            </button>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-surface-800 transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6 text-white" />
                            ) : (
                                <Menu className="w-6 h-6 text-white" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-surface-700/50">
                        <div className="flex flex-col gap-1">
                            {navigation.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? 'bg-primary-500/20 text-primary-400'
                                            : 'text-surface-300 hover:text-white hover:bg-surface-800'
                                        }`
                                    }
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}

export default Header;

