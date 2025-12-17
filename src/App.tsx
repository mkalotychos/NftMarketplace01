import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header, PageLoader, ToastProvider } from './components';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const MyNFTs = lazy(() => import('./pages/MyNFTs'));
const NFTDetail = lazy(() => import('./pages/NFTDetail'));
const Upload = lazy(() => import('./pages/Upload'));

// 404 Page
function NotFound() {
    return (
        <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl font-display font-bold gradient-text mb-4">404</h1>
                <p className="text-xl text-surface-400 mb-8">Page not found</p>
                <a href="/" className="btn-primary">
                    Go Home
                </a>
            </div>
        </div>
    );
}

function App() {
    return (
        <ToastProvider>
            <div className="min-h-screen bg-surface-950">
                <Header />
                <main>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/explore" element={<Explore />} />
                            <Route path="/my-nfts" element={<MyNFTs />} />
                            <Route path="/nft/:tokenId" element={<NFTDetail />} />
                            <Route path="/upload" element={<Upload />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </main>

                {/* Footer */}
                <footer className="py-8 border-t border-surface-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">N</span>
                                </div>
                                <span className="font-display font-semibold text-white">
                                    NFT Marketplace
                                </span>
                            </div>
                            <p className="text-sm text-surface-500">
                                © {new Date().getFullYear()} NFT Marketplace. Built with ❤️
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </ToastProvider>
    );
}

export default App;

