
'use client';

import { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Chargement initial
  useEffect(() => {
    const userInStorage = localStorage.getItem("user");
    const tokenInStorage = localStorage.getItem("token");

    if (
      userInStorage &&
      userInStorage !== "undefined" &&
      tokenInStorage
    ) {
      try {
        setUser(JSON.parse(userInStorage));
      } catch (error) {
        console.error("Erreur parsing user:", error);

        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  // 🔐 Connexion
  const login = (data) => {
    console.log("✅ Connexion réussie :", data);

    setUser(data);

    // Utilisateur
    localStorage.setItem("user", JSON.stringify(data));

    // 🔑 JWT
    localStorage.setItem("token", data.token);

    // 🍪 Cookies
    document.cookie = `token=${data.token}; path=/`;
    document.cookie = `role=${data.role}; path=/`;

    document.cookie = `permissions=${encodeURIComponent(
      JSON.stringify(data.permissions || [])
    )}; path=/`;
  };

  // 🚪 Déconnexion
  const logout = () => {
    setUser(null);

    // LocalStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("cart");

    // Cookies
    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "role=; path=/; max-age=0";
    document.cookie = "permissions=; path=/; max-age=0";
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook custom
export const useAuth = () => useContext(AuthContext);