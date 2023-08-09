const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("NFT", () => {
  const NAME = "Dapp Punks";
  const SYMBOL = "DP";
  const COST = ether(10);
  const MAX_SUPPLY = 25;
  const BASE_URI = "ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/";
  const MAX_MINT_AMOUNT = 10;

  let nft, deployer, minter, minter2;

  beforeEach(async () => {
    let accounts = await ethers.getSigners();
    deployer = accounts[0];
    minter = accounts[1];
    minter2 = accounts[2];

    const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10); // now
    //Load NFT Contract
    const NFT = await ethers.getContractFactory("NFT");
    //Deploy NFT contract
    nft = await NFT.deploy(
      NAME,
      SYMBOL,
      COST,
      MAX_SUPPLY,
      ALLOW_MINTING_ON,
      BASE_URI,
      MAX_MINT_AMOUNT
    );
    // Adds address to whitelist
    transaction = await nft
      .connect(deployer)
      .addToWhitelist(minter.getAddress());
    result = await transaction.wait();
  });

  describe("Deployment", () => {
    const ALLOW_MINTING_ON = (Date.now() + 120000).toString().slice(0, 10); //2 minutes from now

    beforeEach(async () => {
      const NFT = await ethers.getContractFactory("NFT");
      nft = await NFT.deploy(
        NAME,
        SYMBOL,
        COST,
        MAX_SUPPLY,
        ALLOW_MINTING_ON,
        BASE_URI,
        MAX_MINT_AMOUNT
      );
    });
    it("has correct name", async () => {
      expect(await nft.name()).to.equal(NAME);
    });

    it("has correct symbol", async () => {
      expect(await nft.symbol()).to.equal(SYMBOL);
    });

    it("returns the cost to mint", async () => {
      expect(await nft.cost()).to.equal(COST);
    });

    it("returns maximum total supply", async () => {
      expect(await nft.maxSupply()).to.equal(MAX_SUPPLY);
    });

    it("returns the allowed minting time", async () => {
      expect(await nft.allowMintingOn()).to.equal(ALLOW_MINTING_ON);
    });

    it("returns the base URI", async () => {
      expect(await nft.baseURI()).to.equal(BASE_URI);
    });

    it("returns the owner", async () => {
      expect(await nft.owner()).to.equal(deployer.address);
    });
  });

  describe("Adds to whitelist", () => {
    describe("Success", () => {
      it("updates whitelist", async () => {
        expect(await nft.whitelist(minter)).to.equal(true);
      });
    });

    describe("Failure", () => {
      it("rejects non-owner from adding to whitelist", async () => {
        await expect(nft.connect(minter).addToWhitelist(minter)).to.be.reverted;
      });
    });
  });

  describe("Minting", () => {
    let transaction, result;

    describe("Success", async () => {
      beforeEach(async () => {
        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();
      });
      // Verifies the minter recieves the nft - owner of nft#1 is owned by minter's address
      it("returns the address of the minter", async () => {
        expect(await nft.ownerOf(1)).to.equal(minter.address);
      });

      it("returns total number of NFTs the minter owns", async () => {
        expect(await nft.balanceOf(minter.address)).to.equal(1);
      });

      //EG: 'ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/1.json'
      it("returns IPFS URI", async () => {
        expect(await nft.tokenURI(1)).to.equal(`${BASE_URI}1.json`);
        // uncomment to see example:
        //console.log(await nft.tokenURI(1));
      });

      it("updates the total supply", async () => {
        expect(await nft.totalSupply()).to.equal(1);
      });

      it("updates the contract ether balance", async () => {
        expect(await ethers.provider.getBalance(nft.getAddress())).to.equal(
          COST
        );
      });

      it("emits Mint event", async () => {
        expect(transaction).to.emit(nft, "Mint").withArgs(1, minter.address);
      });
    });

    describe("Failure", async () => {
      it("rejects purchase if minting is paused", async () => {
        nft.connect(deployer).pauseMinting();

        await expect(nft.connect(minter).mint(1, { value: COST })).to.be
          .reverted;
      });

      it("rejects purchase if purchase is more than 10 NFTs", async () => {
        await expect(nft.connect(minter).mint(11, { value: ether(110) })).to.be
          .reverted;
      });

      it("rejects insufficient payment ", async () => {
        await expect(nft.connect(minter).mint(1, { value: ether(1) })).to.be
          .reverted;
      });

      it("rejects minting less than 1 NFT ", async () => {
        await expect(nft.connect(minter).mint(0, { value: COST })).to.be
          .reverted;
      });

      it("rejects minting before allowed time", async () => {
        const ALLOW_MINTING_ON = new Date("Sep 30, 2024 18:00:00")
          .getTime()
          .toString()
          .slice(0, 10); // now

        const NFT = await ethers.getContractFactory("NFT");
        nft = await NFT.deploy(
          NAME,
          SYMBOL,
          COST,
          MAX_SUPPLY,
          ALLOW_MINTING_ON,
          BASE_URI,
          MAX_MINT_AMOUNT
        );

        await expect(nft.connect(minter).mint(1, { value: COST })).to.be
          .reverted;
      });

      it("rejects minting more than max supply ", async () => {
        await expect(nft.connect(minter).mint(27, { value: ether(270) })).to.be
          .reverted;
      });

      it("rejects returning URIs for invalid NFTs ", async () => {
        nft.connect(minter).mint(1, { value: COST });

        await expect(nft.tokenURI("99")).to.be.reverted;
      });
    });
  });

  describe("Displaying NFTs", () => {
    let transaction, result;

    beforeEach(async () => {
      transaction = await nft.connect(minter).mint(3, { value: ether(30) });
      result = await transaction.wait();
    });

    it("returns all the NFTs for a given owner", async () => {
      let tokenIds = await nft.walletOfOwner(minter.address);
      //Uncomment to see returned value
      //console.log("owner wallet", tokenIds);
      expect(tokenIds.length).to.equal(3);
      expect(tokenIds[0].toString()).to.equal("1");
      expect(tokenIds[1].toString()).to.equal("2");
      expect(tokenIds[2].toString()).to.equal("3");
    });
  });

  describe("Withdraw", () => {
    describe("Success", async () => {
      let transaction, result, balanceBefore;

      beforeEach(async () => {
        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();

        balanceBefore = await ethers.provider.getBalance(deployer.address);

        transaction = await nft.connect(deployer).withdraw();
        result = transaction.wait();
      });
      it("deducts contract balance", async () => {
        expect(await ethers.provider.getBalance(nft.getAddress())).to.equal(0);
      });

      it("sends funds to the owner", async () => {
        expect(
          await ethers.provider.getBalance(deployer.getAddress())
        ).to.be.greaterThan(balanceBefore);
      });

      it("emits event Withdraw", async () => {
        expect(transaction)
          .to.emit(nft, "Withdraw")
          .withArgs(COST, deployer.address);
      });
    });

    describe("Failure", async () => {
      it("rejects non-owner from withdrawing ", async () => {
        nft.connect(minter).mint(1, { value: COST });

        await expect(nft.connect(minter).withdraw()).to.be.reverted;
      });
    });
  });

  describe("update cost of NFTs ", () => {
    describe("Success", async () => {
      let transaction, result;

      beforeEach(async () => {
        transaction = await nft.connect(deployer).setCost(ether(15));
        result = await transaction.wait();
      });
      it("updated the cost of NFTs", async () => {
        expect(await nft.cost()).to.equal(ether(15));
      });
    });

    describe("Failure", async () => {
      it("rejects non-owner from updating the cost of NFTs ", async () => {
        await expect(nft.connect(minter).setCost(ether(15))).to.be.reverted;
      });
    });
  });

  describe("Pause Minting", () => {
    let transaction, result;

    describe("Success", async () => {
      beforeEach(async () => {
        transaction = await nft.connect(deployer).pauseMinting();
        result = await transaction.wait();
      });
      it("pauses minting", async () => {
        expect(await nft.mintingPaused()).to.equal(true);
      });
    });

    describe("Failure", async () => {
      it("rejects non-owner from pausing minting", async () => {
        await expect(nft.connect(minter).pauseMinting()).to.be.reverted;
      });
    });
  });

  describe("Resume Minting", () => {
    let transaction, result;

    describe("Success", async () => {
      beforeEach(async () => {
        transaction = await nft.connect(deployer).resumeMinting();
        result = await transaction.wait();
      });
      it("resumes minting", async () => {
        expect(await nft.mintingPaused()).to.equal(false);
      });
    });

    describe("Failure", async () => {
      it("rejects non-owner from resuming minting", async () => {
        await expect(nft.connect(minter).resumeMinting()).to.be.reverted;
      });
    });
  });
});
