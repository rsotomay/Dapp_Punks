import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Countdown from "react-countdown";
import { ethers } from "ethers";

//IMG
import preview from "../preview.png";

// Components
import Navigation from "./Navigation";
import Data from "./Data";
import Mint from "./Mint";
import Whitelist from "./Whitelist";
import Loading from "./Loading";

// ABIs: Import your contract ABIs here
import NFT_ABI from "../abis/NFT.json";

// Config: Import your network config here
import config from "../config.json";

function App() {
  const [provider, setProvider] = useState(null);
  const [nft, setNFT] = useState(null);

  const [account, setAccount] = useState(null);

  const [revealTime, setRevealTime] = useState(0);

  const [maxSupply, setMaxSupply] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const [cost, setCost] = useState(0);
  const [balance, setBalance] = useState(0);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [lastMintedNFTId, setLastMintedNFTId] = useState(null);
  const [listOfNFTs, setListOfNFTs] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    setProvider(provider);

    //Initiate the contract
    const nft = new ethers.Contract(
      config[31337].NFT.address,
      NFT_ABI,
      provider
    );
    setNFT(nft);

    // Fetch accounts
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = ethers.getAddress(accounts[0]);
    setAccount(account);

    //Fetch Countdown
    const allowMintingOn = await nft.allowMintingOn();
    setRevealTime(allowMintingOn.toString() + "000");

    //Fetch maxSupply
    setMaxSupply(await nft.maxSupply());

    //Fetch totalSupply
    setTotalSupply(await nft.totalSupply());

    //Fetch cost
    setCost(await nft.cost());

    //Fetch account balance
    setBalance(await nft.balanceOf(account));

    //Fetch whitelist from contract
    setIsWhitelisted(await nft.whitelist(account));

    //Fetch wallet of owner from contract
    const getWallet = await nft.walletOfOwner(account);
    if (getWallet.length > 0) {
      const lastNFTId = getWallet[getWallet.length - 1];
      setLastMintedNFTId(lastNFTId);
    }

    setListOfNFTs(getWallet);

    setIsLoading(false);
  };

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData();
    }
  }, [isLoading]);

  return (
    <Container>
      <Navigation account={account} />

      <h1 className="my-4 text-center">Dapp Punks</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Row>
            <Col>
              {lastMintedNFTId > 0 ? (
                <div className="my-2 text-center">
                  <img
                    src={`https://gateway.pinata.cloud/ipfs/QmQPEMsfd1tJnqYPbnTQCjoa8vczfsV1FmqZWgRdNQ7z3g/${lastMintedNFTId.toString()}.png`}
                    alt="Open Punk"
                    width="400px"
                    height="400px"
                  />
                </div>
              ) : (
                <img src={preview} alt="" />
              )}
              {listOfNFTs.length > 0 ? (
                <section style={{ backgroundColor: "red" }}>
                  <h2 className="my-2 text-center">Your collection</h2>
                  <div className="text-center">
                    {listOfNFTs.map((nftId) => (
                      <img
                        key={nftId}
                        style={{ margin: "6px" }}
                        className="my-3"
                        src={`https://gateway.pinata.cloud/ipfs/QmQPEMsfd1tJnqYPbnTQCjoa8vczfsV1FmqZWgRdNQ7z3g/${nftId.toString()}.png`}
                        alt={`NFT ${nftId}`}
                        width="50px"
                        height="50px"
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <div className="text-right">
                  <h3>Start you collection today!</h3>
                </div>
              )}
            </Col>
            <Col>
              <div className="my-4 text-center">
                <Countdown date={parseInt(revealTime)} className="h2" />
              </div>
              <Data
                maxSupply={maxSupply}
                totalSupply={totalSupply}
                cost={cost}
                balance={balance}
              />
              <Whitelist
                provider={provider}
                nft={nft}
                setIsLoading={setIsLoading}
              />

              <Mint
                provider={provider}
                nft={nft}
                cost={cost}
                setIsLoading={setIsLoading}
                isWhitelisted={isWhitelisted}
              />
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}

export default App;
