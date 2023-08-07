// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './ERC721Enumerable.sol';
import './Ownable.sol';

contract NFT is ERC721Enumerable, Ownable {
    //allows converting uints to string with .toString()
    using Strings for uint256;

    string public baseURI;
    string public baseExtension = ".json";
    uint256 public cost;
    uint256 public maxSupply;
    uint256 public allowMintingOn;
    uint256 public maxMintAmount;
    bool public mintingPaused;

    event Mint(uint256 amount, address minter);
    event Withdraw(uint256 amount, address owner);

    mapping(address => bool) public whitelist;

    constructor (
        string memory _name, 
        string memory _symbol,
        uint256 _cost,
        uint256 _maxSupply,
        uint256 _allowMintingOn,
        string memory _baseURI,
        uint256 _maxMintAmount
        ) ERC721(_name, _symbol) {
            cost = _cost;
            maxSupply = _maxSupply;
            allowMintingOn = _allowMintingOn;
            baseURI = _baseURI;
            maxMintAmount = _maxMintAmount;
        }

        modifier onlyWhitelisted() {
        require(whitelist[msg.sender] == true, 'You have to be in the whitelist to buy tokens');
        _;
        }

        function addToWhitelist(address _address) public onlyOwner {
        whitelist[_address] = true;
    } 

        function mint(uint256 _mintAmount) public payable onlyWhitelisted {
            require(!mintingPaused, "Minting is currently paused");
            require(_mintAmount <= maxMintAmount, '10 tokens is the maximum you can buy');
            //Only allow minting after specified time
            require(block.timestamp >= allowMintingOn);
            //Must mint at least one nft
            require(_mintAmount > 0, 'Must mint minimum 1 nft');
            //Must provide the correct amount of eth to mint
            require(msg.value >= cost * _mintAmount, "Not enough funds provided");
            //Takes totalSupply from enumerable and stores it in supply
            uint256 supply = totalSupply();
            //Prevent them from minting more tokens than available
            require(supply + _mintAmount <= maxSupply,'Minting amount not allowed');
            //Create a NFT
            // Loop to allow multiple minting
            for(uint256 i = 1; i <= _mintAmount; i++) {
            // Calls safeMint from ERC721(impored in enumerable) and passes the owner 
            //and add 1 to supply as token id
            _safeMint(msg.sender, supply + i);
            }
            emit Mint(_mintAmount, msg.sender);
        }

        //Returns metadata IPFS url
        //EG: 'ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/1.json'
        function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
        {
            require(_exists(_tokenId), 'token does not exists');
            return string(abi.encodePacked(baseURI, _tokenId.toString(), baseExtension));
        }

        //Returns all NFTs owned by an owner by token Ids
        function walletOfOwner(address _owner) public view returns(uint256[] memory) {
            uint256 ownerTokenCount = balanceOf(_owner);
            uint256[] memory tokenIds = new uint256[](ownerTokenCount);
            for(uint256 i; i < ownerTokenCount; i++) {
                tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
            }
            return tokenIds;
        }

        function withdraw() public onlyOwner {
            uint256 balance = address(this).balance;

            (bool success, ) = payable (msg.sender).call{value: balance}('');
            require(success);

            emit Withdraw(balance ,msg.sender);
        }

        function setCost(uint256 _newCost) public onlyOwner {
            cost = _newCost;
        }

        function pauseMinting() public onlyOwner {
            mintingPaused = true;
        }

        function resumeMinting() public onlyOwner {
            mintingPaused = false;
        }

        function isMintingPaused() public view returns (bool) {
            return mintingPaused;
        }

}
