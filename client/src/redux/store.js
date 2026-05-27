import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.js";
import postSlice from "./postSlice.js";
import socketSlice from "./socketSlice.js";
import chatSlice from "./chatSlice.js";
import rtnSlice from "./rtnSlice.js";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
const customStorage = {
  getItem: (key) => {
    return Promise.resolve(localStorage.getItem(key));
  },
  setItem: (key, item) => {
    return Promise.resolve(localStorage.setItem(key, item));
  },
  removeItem: (key) => {
    return Promise.resolve(localStorage.removeItem(key));
  },
};

const persistConfig = {
  key: "root",
  storage: customStorage,
  blacklist: ["socketio", "chat"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  post:postSlice,
  socketio:socketSlice,
  chat:chatSlice,
  realTimeNotification:rtnSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, "socketio/setSocket"],
        ignoredPaths: ["socketio.socket"],
      },
    }),
});

export const persistor = persistStore(store);
export default store;