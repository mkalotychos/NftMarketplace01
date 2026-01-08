// Polyfills for Node.js modules in browser
import { Buffer } from 'buffer'
window.Buffer = Buffer

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { WalletProvider } from './context/WalletContext'
import { NFTProvider } from './context/NFTContext'
import { TransactionProvider } from './context/TransactionContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <WalletProvider>
                <TransactionProvider>
                    <NFTProvider>
                        <App />
                    </NFTProvider>
                </TransactionProvider>
            </WalletProvider>
        </BrowserRouter>
    </React.StrictMode>,
)

