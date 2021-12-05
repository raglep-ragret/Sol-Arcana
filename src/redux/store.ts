import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import { solanaWeb3Reducer } from "./slices/solanaWeb3Slice";

export const store = configureStore({
  reducer: {
    solanaWeb3: solanaWeb3Reducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
