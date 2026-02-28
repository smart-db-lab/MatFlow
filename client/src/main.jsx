import { NextUIProvider, createTheme } from "@nextui-org/react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import App from "./App.jsx";
import "./index.css";
import store from "./store.js";
import 'react-toastify/dist/ReactToastify.css';
const theme = createTheme({
  type: "light",
  theme: {
    colors: {
      primary: "#0D9488",
      success: "#10B981",
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <NextUIProvider theme={theme}>
        <App />
        <ToastContainer
          position="top-center"
          autoClose={2500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </NextUIProvider>
    </BrowserRouter>
  </Provider>
  // </React.StrictMode>
);
