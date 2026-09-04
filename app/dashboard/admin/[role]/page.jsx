"use client";

import React from "react";
import { useAuth } from "../../../context/AuthContext";

const Page = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <div>Utilisateur non connecté</div>;
  }

  return (
    <div>
      <h1>Dashboard {user.role}</h1>

      <p>
        Bienvenue, {user.email}
      </p>
    </div>
  );
};

export default Page;