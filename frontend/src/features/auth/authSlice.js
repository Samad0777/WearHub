import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    accessToken: null,
    user: null,
    isLoading:true,
  },
  reducers: {
    setCredential: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isLoading = false;
      console.log(state.accessToken,state.user)
    },
    clearCredential: (state) => {
      state.accessToken = null;
      state.user = null;
      state.isLoading = false;
    },
  },
});

export const { setCredential, clearCredential } = authSlice.actions;
export default authSlice.reducer;
