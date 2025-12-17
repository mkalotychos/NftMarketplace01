// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NFT
 * @author NFT Marketplace
 * @notice ERC721 NFT contract with minting capabilities
 * @dev Implements ERC721URIStorage for metadata URI storage
 */
contract NFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    /// @notice Counter for generating unique token IDs
    uint256 private _tokenIdCounter;

    /// @notice Address of the marketplace contract that can mint NFTs
    address public marketplaceAddress;

    /// @notice Emitted when a new NFT is minted
    /// @param tokenId The ID of the newly minted token
    /// @param owner The address that received the token
    /// @param tokenURI The metadata URI for the token
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string tokenURI
    );

    /// @notice Emitted when the marketplace address is updated
    /// @param oldAddress The previous marketplace address
    /// @param newAddress The new marketplace address
    event MarketplaceUpdated(
        address indexed oldAddress,
        address indexed newAddress
    );

    /// @notice Error thrown when caller is not authorized to mint
    error NotAuthorizedToMint();

    /// @notice Error thrown when marketplace address is invalid
    error InvalidMarketplaceAddress();

    /**
     * @notice Creates a new NFT contract
     * @param _marketplaceAddress Address of the marketplace contract
     */
    constructor(
        address _marketplaceAddress
    ) ERC721("NFT Marketplace", "NFTM") Ownable(msg.sender) {
        if (_marketplaceAddress == address(0))
            revert InvalidMarketplaceAddress();
        marketplaceAddress = _marketplaceAddress;
    }

    /**
     * @notice Mints a new NFT with the given metadata URI
     * @param _tokenURI The metadata URI for the token (IPFS URI)
     * @return tokenId The ID of the newly minted token
     * @dev Only callable by the marketplace contract or contract owner
     */
    function mint(
        string calldata _tokenURI
    ) external nonReentrant returns (uint256) {
        if (msg.sender != marketplaceAddress && msg.sender != owner()) {
            revert NotAuthorizedToMint();
        }

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(tx.origin, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit NFTMinted(tokenId, tx.origin, _tokenURI);

        return tokenId;
    }

    /**
     * @notice Mints a new NFT directly to a specified address
     * @param _to Address to receive the NFT
     * @param _tokenURI The metadata URI for the token
     * @return tokenId The ID of the newly minted token
     * @dev Only callable by the marketplace contract or contract owner
     */
    function mintTo(
        address _to,
        string calldata _tokenURI
    ) external nonReentrant returns (uint256) {
        if (msg.sender != marketplaceAddress && msg.sender != owner()) {
            revert NotAuthorizedToMint();
        }

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit NFTMinted(tokenId, _to, _tokenURI);

        return tokenId;
    }

    /**
     * @notice Updates the marketplace address
     * @param _newMarketplace New marketplace contract address
     * @dev Only callable by contract owner
     */
    function setMarketplaceAddress(address _newMarketplace) external onlyOwner {
        if (_newMarketplace == address(0)) revert InvalidMarketplaceAddress();

        address oldAddress = marketplaceAddress;
        marketplaceAddress = _newMarketplace;

        emit MarketplaceUpdated(oldAddress, _newMarketplace);
    }

    /**
     * @notice Returns the total number of minted tokens
     * @return Total supply of tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Returns the current token ID counter
     * @return Current counter value (next token ID to be minted)
     */
    function currentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Checks if a token exists
     * @param tokenId Token ID to check
     * @return True if token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
