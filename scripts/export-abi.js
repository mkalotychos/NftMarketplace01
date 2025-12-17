import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Export contract ABIs and deployment addresses to the frontend
 */
function exportAbis() {
    console.log('Exporting contract ABIs...\n');

    const outDir = join(rootDir, 'contracts', 'out');
    const targetDir = join(rootDir, 'src', 'contracts');

    // Ensure target directory exists
    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
    }

    // Contracts to export
    const contracts = ['NFT', 'Marketplace'];

    const abis = {};

    for (const contractName of contracts) {
        const artifactPath = join(outDir, `${contractName}.sol`, `${contractName === 'Marketplace' ? 'NFTMarketplace' : contractName}.json`);

        try {
            const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
            abis[contractName] = artifact.abi;
            console.log(`✓ Exported ${contractName} ABI`);
        } catch (error) {
            console.error(`✗ Failed to export ${contractName}:`, error.message);
        }
    }

    // Write combined ABIs
    const abiContent = `// Auto-generated - DO NOT EDIT
// Run 'npm run export-abi' to regenerate

export const NFT_ABI = ${JSON.stringify(abis.NFT, null, 2)} as const;

export const MARKETPLACE_ABI = ${JSON.stringify(abis.Marketplace, null, 2)} as const;
`;

    writeFileSync(join(targetDir, 'abis.ts'), abiContent);
    console.log('\n✓ Written to src/contracts/abis.ts');

    // Try to read deployment addresses
    const deploymentsDir = join(rootDir, 'deployments');
    let addresses = {
        localhost: { marketplace: '', nft: '' },
        sepolia: { marketplace: '', nft: '' },
        polygon: { marketplace: '', nft: '' },
    };

    const networks = ['localhost', 'sepolia', 'polygon', 'latest'];

    for (const network of networks) {
        const deploymentPath = join(deploymentsDir, `${network}.json`);
        try {
            const deployment = JSON.parse(readFileSync(deploymentPath, 'utf8'));
            if (network === 'latest') {
                // latest.json is the most recent deployment
                console.log(`\n✓ Found latest deployment (chain ${deployment.chainId})`);
            } else {
                addresses[network] = {
                    marketplace: deployment.marketplace,
                    nft: deployment.nft,
                };
                console.log(`✓ Found ${network} deployment`);
            }
        } catch {
            // Deployment file doesn't exist yet
        }
    }

    // Write addresses
    const addressContent = `// Auto-generated - DO NOT EDIT
// Run 'npm run export-abi' to regenerate after deployment

export const CONTRACT_ADDRESSES = {
  localhost: {
    marketplace: '${addresses.localhost.marketplace}',
    nft: '${addresses.localhost.nft}',
    chainId: 31337,
  },
  sepolia: {
    marketplace: '${addresses.sepolia.marketplace}',
    nft: '${addresses.sepolia.nft}',
    chainId: 11155111,
  },
  polygon: {
    marketplace: '${addresses.polygon.marketplace}',
    nft: '${addresses.polygon.nft}',
    chainId: 137,
  },
  polygonMumbai: {
    marketplace: '',
    nft: '',
    chainId: 80001,
  },
} as const;

export type NetworkName = keyof typeof CONTRACT_ADDRESSES;
`;

    writeFileSync(join(targetDir, 'addresses.ts'), addressContent);
    console.log('✓ Written to src/contracts/addresses.ts');

    console.log('\n✓ ABI export complete!');
}

exportAbis();

