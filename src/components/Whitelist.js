import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { ethers } from "ethers";

const Whitelist = ({ provider, nft, setIsLoading }) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [addressToAdd, setAddressToAdd] = useState("");
  const [status, setStatus] = useState("");

  const addToWhitelistHandler = async (e) => {
    e.preventDefault();
    setIsWaiting(true);

    try {
      const signer = await provider.getSigner();
      const transaction = await nft
        .connect(signer)
        .addToWhitelist(addressToAdd);
      await transaction.wait();
    } catch {
      window.alert("User rejected or transaction reverted");
    }
    setStatus(`Address ${addressToAdd} added to whitelist`);

    setIsLoading(true);
  };
  return (
    <Form
      onSubmit={addToWhitelistHandler}
      style={{ maxWidth: "450px", margin: "50px auto" }}
    >
      {isWaiting ? (
        <Spinner
          animation="border"
          style={{ display: "block", margin: "0 auto" }}
        />
      ) : (
        <Form.Group className="text-center">
          <Form.Control
            type="text"
            placeholder="Enter Address"
            className="my-2"
            onChange={(e) => setAddressToAdd(e.target.value)}
          />
          <Button variant="primary" type="submit" style={{ width: "100%" }}>
            Add to Whitelist
          </Button>
          <p>status:{status}</p>
        </Form.Group>
      )}
    </Form>
  );
};

export default Whitelist;
