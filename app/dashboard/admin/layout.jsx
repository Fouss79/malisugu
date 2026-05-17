"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./component/Sidebar";
import Header from "./component/Header";

export default function DashboardLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading]);

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="flex h-screen overflow-hidden">

      {/* 🔹 Sidebar fixe */}
      <Sidebar />

      {/* 🔹 Partie droite */}
      <div className="flex flex-col flex-1 h-full">

        {/* 🔹 Header fixe */}
        <div className="shrink-0">
          <Header />
        </div>

        {/* 🔥 CONTENU SCROLLABLE UNIQUEMENT */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#9FB9C4]">
          {children}
        </main>

      </div>
    </div>
  );
}