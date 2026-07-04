import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AuthProvider>
            <WishlistProvider>
              <App />
              <Toaster position="top-right" richColors />
            </WishlistProvider>
          </AuthProvider>
        </PersistGate>
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
