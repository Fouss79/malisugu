'use client';

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./admin/component/Sidebar";


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
    
    <div className="flex">
      
      {/* Contenu */}

      <main className="flex-1  bg-gray-100">
        {children}
      </main>
    </div>
  );
}