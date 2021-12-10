import React, { useCallback, useEffect, useState } from "react";
import { ConfirmOptions, Connection, PublicKey } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import { MintLayout, TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { programs } from "@metaplex/js";
import {
  candyMachineProgram,
  TOKEN_METADATA_PROGRAM_ID,
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
} from "./helpers";
import CountdownTimer from "../CountdownTimer";
import { Box } from "@chakra-ui/layout";
import { ReactComponent as SolArcanaLogo } from "../../images/sol_arcana_logo.svg";
import { Button } from "@chakra-ui/react";

const {
  metadata: { Metadata, MetadataProgram },
} = programs;
const config = new web3.PublicKey(
  process.env.REACT_APP_CANDY_MACHINE_CONFIG as string
);
const { SystemProgram } = web3;
const opts: ConfirmOptions = {
  preflightCommitment: "processed",
};

const MAX_NAME_LENGTH = 32;
const MAX_URI_LENGTH = 200;
const MAX_SYMBOL_LENGTH = 10;
const MAX_CREATOR_LEN = 32 + 1 + 1;

const renderDropTimer = (machineStats: ICandyMachineState) => {
  // Get the current date and dropDate in a JavaScript Date object
  const currentDate = new Date();
  const dropDate = new Date(machineStats.goLiveData * 1000);

  // If currentDate is before dropDate, render our Countdown component
  if (currentDate < dropDate) {
    // Don't forget to pass over your dropDate!
    return <CountdownTimer dropDate={dropDate} />;
  }

  // Else let's just return the current drop date
  return `Latest News — The drop went live on ${machineStats.goLiveDateTimeString}!`;
};

interface Mint {
  name: string;
  uri: string;
}

interface ICandyMachineProps {
  publicKey: PublicKey;
}

interface ICandyMachineState {
  itemsAvailable: number;
  itemsRedeemed: number;
  itemsRemaining: number;
  goLiveData: number;
  goLiveDateTimeString: string;
}

const CandyMachine = ({ publicKey }: ICandyMachineProps) => {
  const [machineStats, setMachineStats] = useState<ICandyMachineState | null>(
    null
  );
  const [mints, setMints] = useState<Mint[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [isLoadingMints, setIsLoadingMints] = useState(false);

  const fetchHashTable = async (hash: string, metadataEnabled: boolean) => {
    const connection = new web3.Connection(
      process.env.REACT_APP_SOLANA_RPC_HOST as string
    );

    const metadataAccounts = await MetadataProgram.getProgramAccounts(
      connection,
      {
        filters: [
          {
            memcmp: {
              offset:
                1 +
                32 +
                32 +
                4 +
                MAX_NAME_LENGTH +
                4 +
                MAX_URI_LENGTH +
                4 +
                MAX_SYMBOL_LENGTH +
                2 +
                1 +
                4 +
                0 * MAX_CREATOR_LEN,
              bytes: hash,
            },
          },
        ],
      }
    );

    const mintHashes = [];

    for (let index = 0; index < metadataAccounts.length; index++) {
      const account = metadataAccounts[index];
      const accountInfo = await connection.getParsedAccountInfo(account.pubkey);
      const metadata = new Metadata(
        hash.toString(),
        accountInfo.value as web3.AccountInfo<Buffer>
      );
      if (metadataEnabled) mintHashes.push(metadata.data);
      else mintHashes.push(metadata.data.mint);
    }

    return mintHashes;
  };

  const getMetadata = async (mint: PublicKey) => {
    return (
      await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };

  const getMasterEdition = async (mint: PublicKey) => {
    return (
      await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };

  const getTokenWallet = async (wallet: PublicKey, mint: PublicKey) => {
    return (
      await web3.PublicKey.findProgramAddress(
        [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
      )
    )[0];
  };

  const mintToken = async () => {
    try {
      setIsMinting(true);
      const mint = web3.Keypair.generate();
      const token = await getTokenWallet(publicKey, mint.publicKey);
      const metadata = await getMetadata(mint.publicKey);
      const masterEdition = await getMasterEdition(mint.publicKey);
      const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST as string;
      const connection = new Connection(rpcHost);
      const rent = await connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      );

      const accounts = {
        config,
        candyMachine: process.env.REACT_APP_CANDY_MACHINE_ID as string,
        payer: publicKey,
        wallet: process.env.REACT_APP_TREASURY_ADDRESS as string,
        mint: mint.publicKey,
        metadata,
        masterEdition,
        mintAuthority: publicKey,
        updateAuthority: publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
      };

      const signers = [mint];
      const instructions = [
        web3.SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint.publicKey,
          space: MintLayout.span,
          lamports: rent,
          programId: TOKEN_PROGRAM_ID,
        }),
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          0,
          publicKey,
          publicKey
        ),
        createAssociatedTokenAccountInstruction(
          token,
          publicKey,
          publicKey,
          mint.publicKey
        ),
        Token.createMintToInstruction(
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          token,
          publicKey,
          [],
          1
        ),
      ];

      const provider = getProvider();
      const idl = await Program.fetchIdl(candyMachineProgram, provider);

      if (idl) {
        const program = new Program(idl, candyMachineProgram, provider);

        const txn = await program.rpc.mintNft({
          accounts,
          signers,
          instructions,
        });

        console.log("txn:", txn);

        // Setup listener
        connection.onSignatureWithOptions(
          txn,
          async (notification, context) => {
            if (notification.type === "status") {
              console.log("Receievwd status event");

              const { result } = notification;
              if (!result.err) {
                console.log("NFT Minted!");
                setIsMinting(false);
                await getCandyMachineState();
              }
            }
          },
          { commitment: "processed" }
        );
      }
    } catch (error) {
      setIsMinting(false);

      let message;

      if (error instanceof Error) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        message = "Minting failed! Please try again!";
      }

      // if (error.msg)
      //if (error.code === 311) {
      //  message = `SOLD OUT!`;
      //} else if (error.code === 312) {
      //  message = `Minting period hasn't started yet.`;
      //}

      console.warn(message);
      console.warn(error);
    }
  };

  const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress: PublicKey,
    payer: PublicKey,
    walletAddress: PublicKey,
    splTokenMintAddress: PublicKey
  ) => {
    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
      { pubkey: walletAddress, isSigner: false, isWritable: false },
      { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
      {
        pubkey: web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      {
        pubkey: web3.SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ];
    return new web3.TransactionInstruction({
      keys,
      programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
      data: Buffer.from([]),
    });
  };

  const getProvider = () => {
    const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST as string;
    // Create a new connection object
    const connection = new Connection(rpcHost);

    // Create a new Solana provider object
    const provider = new Provider(connection, window.solana, opts);

    return provider;
  };

  // Declare getCandyMachineState as an async method
  const getCandyMachineState = useCallback(async () => {
    const provider = getProvider();

    // Get metadata about your deployed candy machine program
    const idl = await Program.fetchIdl(candyMachineProgram, provider);

    if (idl) {
      // Create a program that you can call
      const program = new Program(idl, candyMachineProgram, provider);

      // Fetch the metadata from your candy machine
      const candyMachine = await program.account.candyMachine.fetch(
        process.env.REACT_APP_CANDY_MACHINE_ID as string
      );

      // Parse out all our metadata and log it out
      const itemsAvailable = candyMachine.data.itemsAvailable.toNumber();
      const itemsRedeemed = candyMachine.itemsRedeemed.toNumber();
      const itemsRemaining = itemsAvailable - itemsRedeemed;
      const goLiveData = candyMachine.data.goLiveDate.toNumber();

      // We will be using this later in our UI so let's generate this now
      const goLiveDateTimeString = `${new Date(
        goLiveData * 1000
      ).toUTCString()}`;

      // Add this data to your state to render
      setMachineStats({
        itemsAvailable,
        itemsRedeemed,
        itemsRemaining,
        goLiveData,
        goLiveDateTimeString,
      });

      console.log({
        itemsAvailable,
        itemsRedeemed,
        itemsRemaining,
        goLiveData,
        goLiveDateTimeString,
      });
    }

    setIsLoadingMints(true);

    const data: programs.metadata.MetadataData[] = (await fetchHashTable(
      process.env.REACT_APP_CANDY_MACHINE_ID as string,
      true
    )) as programs.metadata.MetadataData[];

    if (data.length !== 0) {
      for (const mint of data) {
        // Get URI
        const response = await fetch(mint.data.uri);
        const parse = await response.json();
        console.log("Past Minted NFT", mint);

        // Get image URI
        if (!mints.find((mint) => mint.uri === parse.image)) {
          setMints((prevState) => [
            ...prevState,
            { name: mint.data.name, uri: parse.image },
          ]);
        }
      }
    }

    setIsLoadingMints(false);
  }, [mints]);

  useEffect(() => {
    getCandyMachineState();
  }, [getCandyMachineState]);

  return (
    machineStats && (
      <Box
        backgroundColor="black"
        id="mintWrapper"
        minHeight="100vh"
        textColor="white"
      >
        <Box
          alignItems="center"
          borderBottom="1px solid white"
          display="flex"
          justifyContent="center"
          height="48px"
          paddingX={16}
          marginBottom={8}
          width="100%"
        >
          <Box
            backgroundColor="#ff416c"
            bgGradient="linear-gradient(to right, #ff416c, #ff4b2b)"
            borderRadius="50%"
            height="18px"
            marginRight="8px"
            width="18px"
          />

          <span>{renderDropTimer(machineStats)}</span>
        </Box>

        <Box
          fontWeight={500}
          marginBottom={8}
          marginTop={16}
          paddingX={8}
          width="100%"
        >
          <SolArcanaLogo
            style={{
              display: "inline",
              height: "1em",
              position: "relative",
              bottom: -1.75,
            }}
          />{" "}
          is an NFT drop of collectible Tarot cards. There are 21 cards, and
          each card is a 1/1 edition representing one of the major arcana of the
          tarot. The cards feature public-domain art from the Rider-Waite Tarot
          deck. As of now, {machineStats.itemsRedeemed} out of{" "}
          {machineStats.itemsAvailable} cards have been minted.
        </Box>

        <Box
          alignItems="center"
          display="flex"
          justifyContent="center"
          paddingX={16}
          marginBottom={8}
          width="100%"
        >
          {machineStats.itemsRedeemed === machineStats.itemsAvailable ? (
            <Button
              backgroundColor="white"
              borderColor="black"
              borderWidth="1px"
              borderRadius={0}
              boxShadow="2px 2px 0 black"
              disabled
              fontSize={18}
              fontWeight={300}
              letterSpacing={1}
              marginTop={8}
              size="md"
              textColor="black"
              variant="outline"
            >
              SOLD OUT
            </Button>
          ) : (
            <Button
              backgroundColor="white"
              borderColor="black"
              borderWidth="1px"
              borderRadius={0}
              boxShadow="2px 2px 0 black"
              fontSize={18}
              fontWeight={300}
              letterSpacing={1}
              onClick={!isMinting ? mintToken : undefined}
              size="md"
              textColor="black"
              variant="outline"
            >
              {!isMinting ? "MINT!" : "MINTING..."}
            </Button>
          )}
        </Box>

        {isLoadingMints && mints.length === 0 && (
          <Box paddingX={8} width="100%">
            <Box fontWeight={700} fontSize="1.5em" marginBottom={4}>
              LOADING MINTS...
            </Box>
          </Box>
        )}

        {mints.length > 0 && (
          <Box paddingX={8} width="100%">
            <Box fontWeight={700} fontSize="1.5em" marginBottom={4}>
              Minted Items:
            </Box>

            <Box
              as="ul"
              display="grid"
              gridTemplateColumns="repeat(auto-fit, minmax(260px, 1fr))"
              gridGap="1em"
            >
              {mints.map((mint) => (
                <Box
                  as="li"
                  key={mint.uri}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Box
                    as="li"
                    key={mint.uri}
                    backgroundColor="gray.800"
                    borderRadius={12}
                    display="flex"
                    flexDirection="column"
                    listStyleType="none"
                    padding="1em"
                  >
                    <img
                      alt={`Minted NFT ${mint}`}
                      src={mint.uri}
                      style={{ height: 200 }}
                    />

                    <Box marginTop={2}>{mint.name}</Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    )
  );
};

export default CandyMachine;
