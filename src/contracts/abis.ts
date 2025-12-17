// Auto-generated placeholder - Run 'npm run export-abi' after compiling contracts

export const NFT_ABI = [
    "function mint(string calldata _tokenURI) external returns (uint256)",
    "function mintTo(address _to, string calldata _tokenURI) external returns (uint256)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function tokenURI(uint256 tokenId) external view returns (string)",
    "function totalSupply() external view returns (uint256)",
    "function currentTokenId() external view returns (uint256)",
    "function exists(uint256 tokenId) external view returns (bool)",
    "function approve(address to, uint256 tokenId) external",
    "function getApproved(uint256 tokenId) external view returns (address)",
    "function setApprovalForAll(address operator, bool approved) external",
    "function isApprovedForAll(address owner, address operator) external view returns (bool)",
    "function safeTransferFrom(address from, address to, uint256 tokenId) external",
    "function transferFrom(address from, address to, uint256 tokenId) external",
    "function balanceOf(address owner) external view returns (uint256)",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function marketplaceAddress() external view returns (address)",
    "event NFTMinted(uint256 indexed tokenId, address indexed owner, string tokenURI)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
    "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)"
] as const;

export const MARKETPLACE_ABI = [
    "function nftContract() external view returns (address)",
    "function marketplaceFee() external view returns (uint256)",
    "function mintNFT(string calldata _tokenURI) external returns (uint256)",
    "function mintAndList(string calldata _tokenURI, uint256 _price) external returns (uint256)",
    "function listNFT(uint256 _tokenId, uint256 _price) external",
    "function buyNFT(uint256 _tokenId) external payable",
    "function delistNFT(uint256 _tokenId) external",
    "function updateListingPrice(uint256 _tokenId, uint256 _newPrice) external",
    "function getListing(uint256 _tokenId) external view returns (address seller, uint256 price, bool isActive)",
    "function getActiveListings(uint256 _offset, uint256 _limit) external view returns (uint256[] memory tokenIds, address[] memory sellers, uint256[] memory prices)",
    "function getTotalListedCount() external view returns (uint256)",
    "function getActiveListingCount() external view returns (uint256)",
    "function getNFTContractAddress() external view returns (address)",
    "function setMarketplaceFee(uint256 _newFee) external",
    "function withdrawFees(address _to) external",
    "event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
    "event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
    "event NFTDelisted(uint256 indexed tokenId, address indexed seller)",
    "event ListingPriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice)",
    "event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee)",
    "event FeesWithdrawn(address indexed to, uint256 amount)"
] as const;

