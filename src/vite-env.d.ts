/// <reference types="vite/client" />

import { Buffer } from 'buffer'

declare global {
    interface Window {
        Buffer: typeof Buffer
    }
}

interface ImportMetaEnv {
    readonly VITE_PINATA_API_KEY: string
    readonly VITE_PINATA_SECRET_KEY: string
    readonly VITE_PINATA_JWT: string
    readonly VITE_NFT_STORAGE_API_KEY: string
    readonly VITE_NFT_CONTRACT_ADDRESS: string
    readonly VITE_MARKETPLACE_CONTRACT_ADDRESS: string
    readonly VITE_CHAIN_ID: string
    readonly VITE_NETWORK_NAME: string
    // Alchemy
    readonly VITE_ALCHEMY_API_KEY: string
    readonly VITE_ALCHEMY_NETWORK: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

