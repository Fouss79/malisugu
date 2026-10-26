"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "./component/Sidebar";
import Header from "./component/Header";
import { BanniereTarifsIncomplets } from "./component/BanniereTarifsIncomplets";

export default function DashboardLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false); // desktop : sidebar repliée
  const [mobileOpen, setMobileOpen] = useState(false); // mobile : tiroir ouvert

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Appelé par le bouton burger du Header
  const handleMenuClick = useCallback(() => {
    if (window.innerWidth >= 1024) setCollapsed((c) => !c);
    else setMobileOpen(true);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#ECEAE2]">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4"
          style={{ borderColor: "#C89B3C", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  // Évite d'afficher le dashboard une fraction de seconde avant la redirection
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={closeMobile}
      />

      {/* min-w-0 : empêche les tableaux larges d'élargir toute la page */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Header
          collapsed={collapsed}
          onMenuClick={handleMenuClick}
        />

        <main className="flex-1 overflow-y-auto bg-[#ECEAE2] p-0 sm:p-2 lg:p-4">
          <BanniereTarifsIncomplets />
          {children}
        </main>
      </div>
    </div>
  );
}