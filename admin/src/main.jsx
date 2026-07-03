import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import AdminContextProvider from "./context/AdminContext.jsx";
import DoctorContextProvider from "./context/DoctorContext.jsx";
import AppContextProvider from "./context/AppContext.jsx";

import 'react-toastify/dist/ReactToastify.css'

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <AdminContextProvider>
          <DoctorContextProvider>
            <App />
          </DoctorContextProvider>
        </AdminContextProvider>
      </AppContextProvider>
    </BrowserRouter>
  </StrictMode>
);