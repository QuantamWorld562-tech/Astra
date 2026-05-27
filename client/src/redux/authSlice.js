import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    userProfile: null,
    selectedUser: null,
    suggestedUsers: [],
  },
  reducers: {
    setAuthUser: (state, action) => {
      state.user = action.payload;
    },
    setUserProfile: (state, action) => {
      state.userProfile = action.payload;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    setSuggestedUsers: (state, action) => {
      state.suggestedUsers = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.userProfile = null;
      state.selectedUser = null;
      state.suggestedUsers = [];
    },
  },
});

export const { setAuthUser, setUserProfile, setSelectedUser, setSuggestedUsers, logout } =
  authSlice.actions;
export default authSlice.reducer;
