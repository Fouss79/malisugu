"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "../admin/component/Sidebar";
import Header from "../admin/component/Header";

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
    <div className="flex h-screen">
      
      {/* Sidebar à gauche */}
      <Sidebar />

      {/* Partie droite */}
      <div className="flex flex-col flex-1">
        
        {/* Header en haut */}
        

        {/* Contenu */}
        <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}