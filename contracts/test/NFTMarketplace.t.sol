// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/NFT.sol";
import "../src/Marketplace.sol";

contract NFTMarketplaceTest is Test {
    NFTMarketplace public marketplace;
    NFT public nft;

    address public owner;
    address public seller;
    address public buyer;

    uint256 public constant LISTING_PRICE = 1 ether;
    string public constant TOKEN_URI = "ipfs://QmTest123";

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string tokenURI
    );
    event NFTListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    event NFTSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );
    event NFTDelisted(uint256 indexed tokenId, address indexed seller);

    function setUp() public {
        owner = address(this);
        seller = makeAddr("seller");
        buyer = makeAddr("buyer");

        // Fund accounts
        vm.deal(seller, 100 ether);
        vm.deal(buyer, 100 ether);

        // Deploy marketplace (which deploys NFT contract)
        marketplace = new NFTMarketplace();
        nft = marketplace.nftContract();
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_MintNFT() public {
        vm.prank(seller);
        uint256 tokenId = marketplace.mintNFT(TOKEN_URI);

        assertEq(tokenId, 0);
        assertEq(nft.ownerOf(tokenId), seller);
        assertEq(nft.tokenURI(tokenId), TOKEN_URI);
    }

    function test_MintAndList() public {
        vm.prank(seller);
        uint256 tokenId = marketplace.mintAndList(TOKEN_URI, LISTING_PRICE);

        assertEq(tokenId, 0);
        assertEq(nft.ownerOf(tokenId), seller);

        (address listingSeller, uint256 price, bool isActive) = marketplace
            .getListing(tokenId);
        assertEq(listingSeller, seller);
        assertEq(price, LISTING_PRICE);
        assertTrue(isActive);
    }

    function test_RevertMintAndList_ZeroPrice() public {
        vm.prank(seller);
        vm.expectRevert(NFTMarketplace.PriceMustBeGreaterThanZero.selector);
        marketplace.mintAndList(TOKEN_URI, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            LISTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ListNFT() public {
        // First mint an NFT
        vm.prank(seller);
        uint256 tokenId = marketplace.mintNFT(TOKEN_URI);

        // Approve marketplace
        vm.prank(seller);
        nft.approve(address(marketplace), tokenId);

        // List NFT
        vm.prank(seller);
        marketplace.listNFT(tokenId, LISTING_PRICE);

        (address listingSeller, uint256 price, bool isActive) = marketplace
            .getListing(tokenId);
        assertEq(listingSeller, seller);
        assertEq(price, LISTING_PRICE);
        assertTrue(isActive);
    }

    function test_RevertListNFT_NotOwner() public {
        vm.prank(seller);
        uint256 tokenId = marketplace.mintNFT(TOKEN_URI);

        vm.prank(buyer);
        vm.expectRevert(NFTMarketplace.NotTokenOwner.selector);
        marketplace.listNFT(tokenId, LISTING_PRICE);
    }

    function test_RevertListNFT_NotApproved() public {
        vm.prank(seller);
        uint256 tokenId = marketplace.mintNFT(TOKEN_URI);

        vm.prank(seller);
        vm.expectRevert(NFTMarketplace.NotApprovedForMarketplace.selector);
        marketplace.listNFT(tokenId, LISTING_PRICE);
    }

    function test_RevertListNFT_ZeroPrice() public {
        vm.prank(seller);
        uint256 tokenId = marketplace.mintNFT(TOKEN_URI);

        vm.prank(seller);
        nft.approve(address(marketplace), tokenId);

        vm.prank(seller);
        vm.expectRevert(NFTMarketplace.PriceMustBeGreaterThanZero.selector);
        marketplace.listNFT(tokenId, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            BUYING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_BuyNFT() public {
        // Mint and list
        vm.prank(seller);
        uint256 tokenId = marketplace.mintAndList(TOKEN_URI, LISTING_PRICE);

        // Approve marketplace for transfer
        vm.prank(seller);
        nft.approve(address(marketplace), tokenId);

        uint256 sellerBalanceBefore = seller.balance;
        uint256 marketplaceBalanceBefore = address(marketplace).balance;

        // Buy NFT
        vm.prank(buyer);
        marketplace.buyNFT{value: LISTING_PRICE}(tokenId);

        // Check ownership transferred
        assertEq(nft.ownerOf(tokenId), buyer);

        // Check listing is inactive
        (, , bool isActive) = marketplace.getListing(tokenId);
        assertFalse(isActive);

        // Check payment (2.5% fee)
        uint256 fee = (LISTING_PRICE * 250) / 10000;
        uint256 sellerProceeds = LISTING_PRICE - fee;

        assertEq(seller.balance, sellerBalanceBefore + sellerProceeds);
        assertEq(address(marketplace).balance, marketplaceBalanceBefore + fee);
    }

    function test_RevertBuyNFT_NotActive() public {
        vm.prank(seller);
        uint256 tokenId = marketplace.mintNFT(TOKEN_URI);

        vm.prank(buyer);
        vm.expectRevert(NFTMarketplace.ListingNotActive.selector);
        marketplace.buyNFT{value: LISTING_PRICE}(tokenId);
    }

    function test_RevertBuyNFT_OwnNFT() public {
        vm.prank(seller);
        uint256 tokenId = marketplace.mintAndList(TOKEN_URI, LISTING_PRICE);

        vm.prank(seller);
        nft.approve(address(marketplace), tokenId);

        vm.prank(seller);
        vm.expectRevert(NFTMarketplace.CannotBuyOwnNFT.selector);
        marketplace.buyNFT{value: LISTING_PRICE}(tokenId);
    }

    function test_RevertBuyNFT_IncorrectPayment() public {
        vm.prank(seller);
        uint256 tokenId = marketplace.mintAndList(TOKEN_URI, LISTING_PRICE);

        vm.prank(seller);
        nft.approve(address(marketplace), tokenId);

        vm.prank(buyer);
        vm.expectRevert(NFTMarketplace.IncorrectPaymentAmount.selector);
        marketplace.buyNFT{value: LISTING_PRICE - 1}(tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                            DELIST TESTS
    //////////////////////////////////////////////////////////////*/

    function test_DelistNFT() public {
        vm.prank(seller);
        uint256 tokenId = marketplace.mintAndList(TOKEN_URI, LISTING_PRICE);

        vm.prank(seller);
        marketplace.delistNFT(tokenId);

        (, , bool isActive) = marketplace.getListing(tokenId);
        assertFalse(isActive);
    }

    function test_RevertDelistNFT_NotSeller() public {
        vm.prank(seller);
        uint256 tokenId = marketplace.mintAndList(TOKEN_URI, LISTING_PRICE);

        vm.prank(buyer);
        vm.expectRevert(NFTMarketplace.NotTokenOwner.selector);
        marketplace.delistNFT(tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                        UPDATE PRICE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpdateListingPrice() public {
        vm.prank(seller);
        uint256 tokenId = marketplace.mintAndList(TOKEN_URI, LISTING_PRICE);

        uint256 newPrice = 2 ether;
        vm.prank(seller);
        marketplace.updateListingPrice(tokenId, newPrice);

        (, uint256 price, ) = marketplace.getListing(tokenId);
        assertEq(price, newPrice);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetMarketplaceFee() public {
        uint256 newFee = 500; // 5%
        marketplace.setMarketplaceFee(newFee);
        assertEq(marketplace.marketplaceFee(), newFee);
    }

    function test_RevertSetMarketplaceFee_ExceedsMax() public {
        vm.expectRevert(NFTMarketplace.FeeExceedsMaximum.selector);
        marketplace.setMarketplaceFee(1001);
    }

    function test_WithdrawFees() public {
        // Create some fees
        vm.prank(seller);
        uint256 tokenId = marketplace.mintAndList(TOKEN_URI, LISTING_PRICE);

        vm.prank(seller);
        nft.approve(address(marketplace), tokenId);

        vm.prank(buyer);
        marketplace.buyNFT{value: LISTING_PRICE}(tokenId);

        uint256 fee = (LISTING_PRICE * 250) / 10000;
        assertEq(address(marketplace).balance, fee);

        address recipient = makeAddr("recipient");
        marketplace.withdrawFees(recipient);

        assertEq(recipient.balance, fee);
        assertEq(address(marketplace).balance, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        ENUMERATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetActiveListings() public {
        // Create multiple listings
        vm.startPrank(seller);
        marketplace.mintAndList(TOKEN_URI, 1 ether);
        marketplace.mintAndList(TOKEN_URI, 2 ether);
        marketplace.mintAndList(TOKEN_URI, 3 ether);
        vm.stopPrank();

        (
            uint256[] memory tokenIds,
            address[] memory sellers,
            uint256[] memory prices
        ) = marketplace.getActiveListings(0, 10);

        assertEq(tokenIds.length, 3);
        assertEq(sellers.length, 3);
        assertEq(prices.length, 3);

        assertEq(prices[0], 1 ether);
        assertEq(prices[1], 2 ether);
        assertEq(prices[2], 3 ether);
    }

    function test_GetActiveListingCount() public {
        vm.startPrank(seller);
        marketplace.mintAndList(TOKEN_URI, 1 ether);
        marketplace.mintAndList(TOKEN_URI, 2 ether);
        vm.stopPrank();

        assertEq(marketplace.getActiveListingCount(), 2);

        vm.prank(seller);
        marketplace.delistNFT(0);

        assertEq(marketplace.getActiveListingCount(), 1);
    }
}
