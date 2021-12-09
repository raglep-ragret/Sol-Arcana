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
import { Button } from "@chakra-ui/react";
import { ReactComponent as SolArcanaLogo } from "./images/sol_arcana_logo.svg";

const App = () => {
  const walletAddress = useAppSelector(selectAuthorizedWallet);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkIfConnected = () => dispatch(checkIfConnectedToSolana());

    window.addEventListener("load", checkIfConnected);
    return () => window.removeEventListener("load", checkIfConnected);
  });

  const connectWallet = () => dispatch(connectToSolana());

  return (
    <Box>
      <Box
        bgGradient="linear-gradient(to right, #ff416c, #ff4b2b)"
        position="relative"
        height="100vh"
        zIndex={1}
      >
        <ThreeDCardDrop />

        <Box position="absolute" height="100%" width="100%" zIndex={3}>
          <Box
            display="flex"
            justifyContent="end"
            paddingX={2}
            paddingY={2}
            position="absolute"
            width="100%"
          >
            {walletAddress ? (
              <Button
                backgroundColor="white"
                borderColor="black"
                borderWidth="1px"
                borderRadius={0}
                boxShadow="2px 2px 0 black"
                disabled
                fontSize={12}
                fontWeight={300}
                letterSpacing={0.5}
                marginRight="6px"
                onClick={connectWallet}
                size="xs"
                textColor="black"
                variant="outline"
              >
                CONNECTED
              </Button>
            ) : (
              <Button
                backgroundColor="white"
                borderColor="black"
                borderWidth="1px"
                borderRadius={0}
                boxShadow="2px 2px 0 black"
                fontSize={12}
                fontWeight={300}
                letterSpacing={0.5}
                marginRight="6px"
                onClick={connectWallet}
                size="xs"
                textColor="black"
                variant="outline"
              >
                CONNECT WALLET
              </Button>
            )}
          </Box>

          <Box
            as="header"
            alignItems="center"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            height="100%"
            width="100%"
            zIndex={3}
          >
            <SolArcanaLogo style={{ width: "24em" }} />
            <Box
              fontSize="30px"
              fontWeight={800}
              lineHeight="30px"
              marginTop={8}
              textAlign="center"
              width="16em"
            >
              Sol Arcana is a Solana-based NFT drop of collectible cards of the
              major arcana of the tarot.
            </Box>
            <Button
              backgroundColor="white"
              borderColor="black"
              borderWidth="1px"
              borderRadius={0}
              boxShadow="2px 2px 0 black"
              fontSize={18}
              fontWeight={300}
              letterSpacing={1}
              marginTop={8}
              onClick={() => {
                document
                  .getElementById("mintWrapper")
                  ?.scrollIntoView({ block: "start", behavior: "smooth" });
              }}
              size="md"
              textColor="black"
              variant="outline"
            >
              DRAW A CARD
            </Button>
          </Box>
        </Box>
      </Box>

      {walletAddress && <CandyMachine publicKey={window.solana.publicKey} />}
    </Box>
  );
};

export default App;
