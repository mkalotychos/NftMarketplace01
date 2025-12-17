// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./NFT.sol";

/**
 * @title NFTMarketplace
 * @author NFT Marketplace
 * @notice A decentralized marketplace for trading NFTs
 * @dev Supports listing, buying, and delisting NFTs with a configurable marketplace fee
 */
contract NFTMarketplace is Ownable, ReentrancyGuard {
    /// @notice The NFT contract this marketplace trades
    NFT public nftContract;

    /// @notice Marketplace fee in basis points (250 = 2.5%)
    uint256 public marketplaceFee = 250;

    /// @notice Maximum fee that can be set (10%)
    uint256 public constant MAX_FEE = 1000;

    /// @notice Basis points denominator
    uint256 public constant FEE_DENOMINATOR = 10000;

    /// @notice Structure representing a listing
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    /// @notice Mapping from token ID to listing details
    mapping(uint256 => Listing) public listings;

    /// @notice Array of all token IDs that have been listed (for enumeration)
    uint256[] public listedTokenIds;

    /// @notice Mapping to track index in listedTokenIds array
    mapping(uint256 => uint256) private _listedTokenIndex;

    /// @notice Mapping to track if token has ever been listed
    mapping(uint256 => bool) private _hasBeenListed;

    /// @notice Emitted when an NFT is listed for sale
    event NFTListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    /// @notice Emitted when an NFT is sold
    event NFTSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );

    /// @notice Emitted when an NFT is delisted
    event NFTDelisted(uint256 indexed tokenId, address indexed seller);

    /// @notice Emitted when listing price is updated
    event ListingPriceUpdated(
        uint256 indexed tokenId,
        uint256 oldPrice,
        uint256 newPrice
    );

    /// @notice Emitted when marketplace fee is updated
    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when fees are withdrawn
    event FeesWithdrawn(address indexed to, uint256 amount);

    /// @notice Error thrown when price is zero
    error PriceMustBeGreaterThanZero();

    /// @notice Error thrown when caller is not the NFT owner
    error NotTokenOwner();

    /// @notice Error thrown when NFT is not approved for marketplace
    error NotApprovedForMarketplace();

    /// @notice Error thrown when listing is not active
    error ListingNotActive();

    /// @notice Error thrown when seller tries to buy their own NFT
    error CannotBuyOwnNFT();

    /// @notice Error thrown when sent value is incorrect
    error IncorrectPaymentAmount();

    /// @notice Error thrown when fee exceeds maximum
    error FeeExceedsMaximum();

    /// @notice Error thrown when transfer fails
    error TransferFailed();

    /// @notice Error thrown when NFT contract address is invalid
    error InvalidNFTContract();

    /**
     * @notice Creates a new marketplace and associated NFT contract
     */
    constructor() Ownable(msg.sender) {
        // Deploy the NFT contract with this marketplace as the authorized minter
        nftContract = new NFT(address(this));
    }

    /**
     * @notice Sets an external NFT contract (for migration purposes)
     * @param _nftContract Address of the NFT contract
     * @dev Only callable by owner
     */
    function setNFTContract(address _nftContract) external onlyOwner {
        if (_nftContract == address(0)) revert InvalidNFTContract();
        nftContract = NFT(_nftContract);
    }

    /**
     * @notice Mints a new NFT through the marketplace
     * @param _tokenURI Metadata URI for the NFT
     * @return tokenId The ID of the minted token
     */
    function mintNFT(
        string calldata _tokenURI
    ) external nonReentrant returns (uint256) {
        return nftContract.mint(_tokenURI);
    }

    /**
     * @notice Mints and immediately lists an NFT for sale
     * @param _tokenURI Metadata URI for the NFT
     * @param _price Listing price in wei
     * @return tokenId The ID of the minted and listed token
     */
    function mintAndList(
        string calldata _tokenURI,
        uint256 _price
    ) external nonReentrant returns (uint256) {
        if (_price == 0) revert PriceMustBeGreaterThanZero();

        // Mint to the caller
        uint256 tokenId = nftContract.mintTo(msg.sender, _tokenURI);

        // Create listing
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: _price,
            isActive: true
        });

        // Add to listed tokens array
        _listedTokenIndex[tokenId] = listedTokenIds.length;
        listedTokenIds.push(tokenId);
        _hasBeenListed[tokenId] = true;

        emit NFTListed(tokenId, msg.sender, _price);

        return tokenId;
    }

    /**
     * @notice Lists an NFT for sale on the marketplace
     * @param _tokenId ID of the token to list
     * @param _price Listing price in wei
     * @dev Caller must own the NFT and have approved the marketplace
     */
    function listNFT(uint256 _tokenId, uint256 _price) external nonReentrant {
        if (_price == 0) revert PriceMustBeGreaterThanZero();
        if (nftContract.ownerOf(_tokenId) != msg.sender) revert NotTokenOwner();
        if (
            nftContract.getApproved(_tokenId) != address(this) &&
            !nftContract.isApprovedForAll(msg.sender, address(this))
        ) {
            revert NotApprovedForMarketplace();
        }

        listings[_tokenId] = Listing({
            seller: msg.sender,
            price: _price,
            isActive: true
        });

        // Add to listed tokens array if not already tracked
        if (!_hasBeenListed[_tokenId]) {
            _listedTokenIndex[_tokenId] = listedTokenIds.length;
            listedTokenIds.push(_tokenId);
            _hasBeenListed[_tokenId] = true;
        }

        emit NFTListed(_tokenId, msg.sender, _price);
    }

    /**
     * @notice Purchases a listed NFT
     * @param _tokenId ID of the token to purchase
     * @dev Sends payment to seller (minus fee) and transfers NFT to buyer
     */
    function buyNFT(uint256 _tokenId) external payable nonReentrant {
        Listing storage listing = listings[_tokenId];

        if (!listing.isActive) revert ListingNotActive();
        if (msg.sender == listing.seller) revert CannotBuyOwnNFT();
        if (msg.value != listing.price) revert IncorrectPaymentAmount();

        // Mark as inactive before transfers (checks-effects-interactions)
        listing.isActive = false;

        // Calculate fee and seller proceeds
        uint256 fee = (listing.price * marketplaceFee) / FEE_DENOMINATOR;
        uint256 sellerProceeds = listing.price - fee;

        // Transfer NFT to buyer
        nftContract.safeTransferFrom(listing.seller, msg.sender, _tokenId);

        // Transfer payment to seller
        (bool success, ) = payable(listing.seller).call{value: sellerProceeds}(
            ""
        );
        if (!success) revert TransferFailed();

        emit NFTSold(_tokenId, listing.seller, msg.sender, listing.price);
    }

    /**
     * @notice Removes an NFT listing from the marketplace
     * @param _tokenId ID of the token to delist
     * @dev Only the listing seller can delist
     */
    function delistNFT(uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_tokenId];

        if (!listing.isActive) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotTokenOwner();

        listing.isActive = false;

        emit NFTDelisted(_tokenId, msg.sender);
    }

    /**
     * @notice Updates the price of an existing listing
     * @param _tokenId ID of the listed token
     * @param _newPrice New price in wei
     */
    function updateListingPrice(
        uint256 _tokenId,
        uint256 _newPrice
    ) external nonReentrant {
        if (_newPrice == 0) revert PriceMustBeGreaterThanZero();

        Listing storage listing = listings[_tokenId];

        if (!listing.isActive) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotTokenOwner();

        uint256 oldPrice = listing.price;
        listing.price = _newPrice;

        emit ListingPriceUpdated(_tokenId, oldPrice, _newPrice);
    }

    /**
     * @notice Returns listing details for a token
     * @param _tokenId ID of the token
     * @return seller Address of the seller
     * @return price Listing price
     * @return isActive Whether the listing is active
     */
    function getListing(
        uint256 _tokenId
    ) external view returns (address seller, uint256 price, bool isActive) {
        Listing storage listing = listings[_tokenId];
        return (listing.seller, listing.price, listing.isActive);
    }

    /**
     * @notice Returns all active listings with pagination
     * @param _offset Starting index
     * @param _limit Maximum number of results
     * @return tokenIds Array of token IDs
     * @return sellers Array of seller addresses
     * @return prices Array of prices
     */
    function getActiveListings(
        uint256 _offset,
        uint256 _limit
    )
        external
        view
        returns (
            uint256[] memory tokenIds,
            address[] memory sellers,
            uint256[] memory prices
        )
    {
        // Count active listings
        uint256 activeCount = 0;
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (listings[listedTokenIds[i]].isActive) {
                activeCount++;
            }
        }

        // Calculate actual return size
        uint256 startIndex = _offset;
        uint256 endIndex = _offset + _limit;
        if (endIndex > activeCount) {
            endIndex = activeCount;
        }
        uint256 resultSize = endIndex > startIndex ? endIndex - startIndex : 0;

        // Initialize return arrays
        tokenIds = new uint256[](resultSize);
        sellers = new address[](resultSize);
        prices = new uint256[](resultSize);

        // Populate arrays
        uint256 currentIndex = 0;
        uint256 resultIndex = 0;

        for (
            uint256 i = 0;
            i < listedTokenIds.length && resultIndex < resultSize;
            i++
        ) {
            uint256 tokenId = listedTokenIds[i];
            if (listings[tokenId].isActive) {
                if (currentIndex >= startIndex) {
                    tokenIds[resultIndex] = tokenId;
                    sellers[resultIndex] = listings[tokenId].seller;
                    prices[resultIndex] = listings[tokenId].price;
                    resultIndex++;
                }
                currentIndex++;
            }
        }

        return (tokenIds, sellers, prices);
    }

    /**
     * @notice Returns the total number of listed token IDs (including inactive)
     * @return Total count
     */
    function getTotalListedCount() external view returns (uint256) {
        return listedTokenIds.length;
    }

    /**
     * @notice Returns the count of currently active listings
     * @return Active listing count
     */
    function getActiveListingCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (listings[listedTokenIds[i]].isActive) {
                count++;
            }
        }
        return count;
    }

    /**
     * @notice Updates the marketplace fee
     * @param _newFee New fee in basis points (max 1000 = 10%)
     * @dev Only callable by owner
     */
    function setMarketplaceFee(uint256 _newFee) external onlyOwner {
        if (_newFee > MAX_FEE) revert FeeExceedsMaximum();

        uint256 oldFee = marketplaceFee;
        marketplaceFee = _newFee;

        emit MarketplaceFeeUpdated(oldFee, _newFee);
    }

    /**
     * @notice Withdraws accumulated marketplace fees
     * @param _to Address to send fees to
     * @dev Only callable by owner
     */
    function withdrawFees(address _to) external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert TransferFailed();

        (bool success, ) = payable(_to).call{value: balance}("");
        if (!success) revert TransferFailed();

        emit FeesWithdrawn(_to, balance);
    }

    /**
     * @notice Returns the NFT contract address
     * @return Address of the NFT contract
     */
    function getNFTContractAddress() external view returns (address) {
        return address(nftContract);
    }

    /**
     * @notice Receives ETH (for fees)
     */
    receive() external payable {}
}
