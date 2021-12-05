import React, { useEffect } from "react";
import "./App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import {
  checkIfConnectedToSolana,
  connectToSolana,
  selectAuthorizedWallet,
} from "./redux/slices/solanaWeb3Slice";
import CandyMachine from "./CandyMachine/index";

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
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🍭 Candy Drop</p>
          <p className="sub-text">NFT drop machine with fair mint</p>
          {!walletAddress && renderNotConnectedContainer()}
        </div>

        {walletAddress && <CandyMachine publicKey={window.solana.publicKey} />}

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
