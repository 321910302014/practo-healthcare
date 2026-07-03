import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currencySymbol = "$";
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(
    localStorage.getItem("token") ? localStorage.getItem("token") : ""
  );
  const [userData, setUserData] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  // Get all doctors
  const getDoctorsData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/list");
      if (data.success && data.doctors.length > 0) {
        setDoctors(data.doctors);
      } else {
        // Fallback to local data from assets if backend is empty
        const { doctors: localDoctors } = await import("../assets/assets");
        setDoctors(localDoctors);
      }
    } catch (error) {
      console.log(error);
      // Fallback on error too
      try {
        const { doctors: localDoctors } = await import("../assets/assets");
        setDoctors(localDoctors);
      } catch (err) {
        toast.error("Failed to load doctors data");
      }
    }
  };

  // Get current user profile
  const loadUserProfileData = async () => {
    try {
      setUserLoading(true);
      const { data } = await axios.get(backendUrl + "/api/user/get-profile", {
        headers: { token },
      });

      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    getDoctorsData();
  }, []);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    }
  }, [token]);

  const value = {
    doctors,
    getDoctorsData,
    currencySymbol,
    backendUrl,
    token,
    setToken,
    userData,
    setUserData,
    loadUserProfileData,
    userLoading,
    getUserReports: async () => {
      try {
        const { data } = await axios.get(backendUrl + "/api/reports/user", {
          headers: { token },
        });
        if (data.success) {
          return data.reports;
        } else {
          toast.error(data.message);
          return [];
        }
      } catch (error) {
        console.log(error);
        toast.error(error.message);
        return [];
      }
    },
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;