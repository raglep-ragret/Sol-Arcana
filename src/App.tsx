import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import {
  checkIfConnectedToSolana,
  connectToSolana,
  selectAuthorizedWallet,
} from "./redux/slices/solanaWeb3Slice";
import CandyMachine from "./components/CandyMachine/index";
import ThreeDCardDrop from "./components/3dCardDrop/ThreeDCardDrop";
import { Box } from "@chakra-ui/layout";

// Constants
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const walletAddress = useAppSelector(selectAuthorizedWallet);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkIfConnected = () => dispatch(checkIfConnectedToSolana());

    window.addEventListener("load", checkIfConnected);
    return () => window.removeEventListener("load", checkIfConnected);
  });

  const connectWallet = () => dispatch(connectToSolana());

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  return (
    <Box className="App">
      <Box position="relative" zIndex={1}>
        <ThreeDCardDrop />

        <Box position="relative" zIndex={30}>
          <p className="header">🍭 Candy Drop</p>
          <p className="sub-text">NFT drop machine with fair mint</p>
          {!walletAddress && renderNotConnectedContainer()}
        </Box>
      </Box>

      <div className="container">
        {walletAddress && <CandyMachine publicKey={window.solana.publicKey} />}

        <div className="footer-container">
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </Box>
  );
};

export default App;
