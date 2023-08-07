import { ethers } from "ethers";

const Data = ({ maxSupply, totalSupply, cost, balance }) => {
  return (
    <div className="text-center">
      <p>
        <strong>Available to Mint:</strong>
        {(maxSupply - totalSupply).toString()}
      </p>
      <p>
        <strong>Cost to Mint:</strong>
        {ethers.formatUnits(cost, "ether")} ETH
      </p>
      <p>
        <strong>You own:</strong>
        {balance.toString()}
      </p>
    </div>
  );
};

export default Data;
