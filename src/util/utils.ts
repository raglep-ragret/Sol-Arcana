// Inside our `createAsyncThunks`, I want to fail early and throw instead of returning `undefined`.
// This is because, if it fails, `createAsyncThunk` will catch the errors and dispatch the `failed` action.
// If it does not fail, we want the result data to be required.
export const throwError = (msg: string): never => {
  console.warn(msg);
  throw new Error(msg);
};
