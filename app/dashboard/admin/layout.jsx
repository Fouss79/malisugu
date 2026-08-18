"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "./component/Sidebar";
import Header from "./component/Header";
import { BanniereTarifsIncomplets } from "./component/BanniereTarifsIncomplets";

export default function DashboardLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading]);

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="flex flex-col flex-1 h-full">
        <Header
    collapsed={collapsed}
    setCollapsed={setCollapsed}
/>

        <main className="flex-1 overflow-y-auto p-6 bg-[#ECEAE2]">
         
          {children}
        </main>
      </div>
    </div>
  );
}