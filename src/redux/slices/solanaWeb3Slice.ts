import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { throwError } from "../../util/utils";
import type { RootState } from "../store";

export const checkIfConnectedToSolana = createAsyncThunk(
  "web3/checkIfConnectedToSolana",
  async () => {
    const { solana } = window;

    if (!solana) {
      console.log(window);
      return throwError("Make sure you have Phantom!");
    } else {
      console.log("Solana object loaded: ", solana);
    }

    const response = await solana.connect({ onlyIfTrusted: true });
    console.log(response);
    const account: string = response.publicKey.toString();

    console.log("Connected with Public Key:", account);

    return { account };
  }
);

export const connectToSolana = createAsyncThunk(
  "web3/connectToSolana",
  async () => {
    const { solana } = window;

    if (!solana) {
      return throwError("Make sure you have Phantom!");
    } else {
      console.log("Solana object loaded: ", solana);
    }

    const response = await solana.connect();
    console.log(response);
    const account: string = response.publicKey.toString();

    console.log("Connected with Public Key:", account);

    return { account };
  }
);

export type Web3State = {
  isCurrentlyConnectingToSolana: boolean;
  maybeAuthorizedWallet: string | undefined;
};

const initialState: Web3State = {
  isCurrentlyConnectingToSolana: false,
  maybeAuthorizedWallet: undefined,
};

export const solanaWeb3Slice = createSlice({
  name: "web3",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(connectToSolana.pending, (state, _action) => {
        state.isCurrentlyConnectingToSolana = true;
      })
      .addCase(connectToSolana.rejected, (state, _action) => {
        state.isCurrentlyConnectingToSolana = false;
        state.maybeAuthorizedWallet = undefined;
      })
      .addCase(connectToSolana.fulfilled, (state, action) => {
        state.isCurrentlyConnectingToSolana = false;
        state.maybeAuthorizedWallet = action.payload.account;
      })
      .addCase(checkIfConnectedToSolana.pending, (state, _action) => {
        state.isCurrentlyConnectingToSolana = true;
      })
      .addCase(checkIfConnectedToSolana.rejected, (state, _action) => {
        state.isCurrentlyConnectingToSolana = false;
        state.maybeAuthorizedWallet = undefined;
      })
      .addCase(checkIfConnectedToSolana.fulfilled, (state, action) => {
        state.isCurrentlyConnectingToSolana = false;
        state.maybeAuthorizedWallet = action.payload.account;
      });
  },
});

// Return `true` if there's a connected wallet.
export const selectIsAuthorized = (state: RootState) =>
  !!state.solanaWeb3.maybeAuthorizedWallet;

// Get the authorized wallet address, if it exists. Else, `undefined`.
export const selectAuthorizedWallet = (state: RootState) =>
  state.solanaWeb3.maybeAuthorizedWallet;

// Return `true` if we're in the process of connecting.
export const selectIsCurrentlyConnectingToSolana = (state: RootState) =>
  state.solanaWeb3.isCurrentlyConnectingToSolana;

// Reducer
export const solanaWeb3Reducer = solanaWeb3Slice.reducer;
