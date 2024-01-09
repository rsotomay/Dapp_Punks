import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

const Mint = ({ provider, nft, cost, setIsLoading, isWhitelisted }) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [mintAmount, setMintAmount] = useState(0);

  const mintHandler = async (e) => {
    e.preventDefault();
    setIsWaiting(true);

    try {
      const signer = await provider.getSigner();
      const newCost = (cost.toString() * mintAmount.toString()).toString();
      const transaction = await nft
        .connect(signer)
        .mint(mintAmount, { value: newCost });
      await transaction.wait();
    } catch {
      window.alert("User rejected or transaction reverted");
    }

    setIsLoading(true);
  };
  return (
    <Form
      onSubmit={mintHandler}
      style={{ maxWidth: "450px", margin: "50px auto" }}
    >
      {isWaiting ? (
        <Spinner
          animation="border"
          style={{ display: "block", margin: "0 auto" }}
        />
      ) : (
        <Form.Group>
          <Form.Control
            type="text"
            placeholder="Enter Amount of NFTs you wish to mint"
            className="my-2"
            onChange={(e) => setMintAmount(e.target.value)}
          />
          {isWhitelisted ? (
            <Button variant="primary" type="submit" style={{ width: "100%" }}>
              Mint
            </Button>
          ) : (
            <p>Join the whitelist to mint.</p>
          )}
        </Form.Group>
      )}
    </Form>
  );
};

export default Mint;
