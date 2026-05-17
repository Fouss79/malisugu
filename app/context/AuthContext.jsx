'use client';

import { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Chargement initial
  useEffect(() => {
    const userInStorage = localStorage.getItem("user");

    if (userInStorage && userInStorage !== "undefined") {
      try {
        setUser(JSON.parse(userInStorage));
      } catch (error) {
        console.error("Erreur parsing user:", error);
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  // 🔐 Connexion
 
const login = (data) => {
  setUser(data);

  localStorage.setItem("user", JSON.stringify(data));

  // 🔥 cookies pour middleware
  document.cookie = `token=true; path=/`;
  document.cookie = `role=${data.role}; path=/`;
};



  // 🚪 Déconnexion
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("cart"); // si tu utilises panier ailleurs
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook custom
export const useAuth = () => useContext(AuthContext);