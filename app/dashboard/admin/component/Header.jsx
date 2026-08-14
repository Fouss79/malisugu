"use client";

import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { LogOut, Settings } from "lucide-react";
import axios from "axios";

import { Menu, PanelLeftClose } from "lucide-react";
import api from "../../../../lib/api";

export default function Header({ collapsed, setCollapsed }) {
  const { user, isAuthenticated, logout } = useAuth();

  const [isClient, setIsClient] = useState(false);
  const [open, setOpen] = useState(false);
  const [anneeActive, setAnneeActive] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🔥 Charger année active
 useEffect(() => {
  const loadAnnee = async () => {
    if (!user?.ecole?.id) return;

    try {
      const res = await api.get(
        `/annees/active/${user.ecole.id}`
      );

      setAnneeActive(res.data);

    } catch (err) {
      console.error("Erreur année active :", err.response?.data || err.message);
    }
  };

  loadAnnee();
}, [user]);

  // fermer dropdown si clic dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
   <header className="bg-white shadow-md px-6 py-2 flex justify-between items-center">

  <div className="flex items-center gap-4">

    <button
      onClick={() => setCollapsed(!collapsed)}
      className="rounded-lg p-2 hover:bg-gray-100 transition"
    >
      {collapsed ? (
        <Menu size={22} />
      ) : (
        <PanelLeftClose size={22} />
      )}
    </button>

    <div className="text-sm font-medium text-gray-600">
      {anneeActive ? (
        <span className="bg-blue-100 text-[#2E7C99] px-3 py-1 rounded-full">
          🎓 {anneeActive.nom}
        </span>
      ) : (
        <span className="text-gray-400">
          Aucune année active
        </span>
      )}
    </div>

  </div>

      {/* MENU DROIT */}
      <nav className="flex gap-4 items-center">

        {isClient && isAuthenticated ? (
          <>
            {/* SETTINGS */}
            {user?.role === "ADMIN" && (
              <div className="relative" ref={menuRef}>

                <button
                  onClick={() => setOpen(!open)}
                  className="p-2 rounded-full text-blue-500 hover:bg-gray-100"
                >
                  <Settings size={20} />
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                  
                    <Link
                      href="/dashboard/admin/anneescolaire"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      Année scolaire
                    </Link>
                     <Link
                      href="/dashboard/admin/Etablissement"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      Etablissement
                    </Link>
                    <Link
                      href="/dashboard/admin/Periode"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      Periode
                    </Link>
                       <Link
                      href="/dashboard/admin/permission"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      Permissions
                    </Link>
                    <Link
                      href="/dashboard/admin/coefficientmatiere"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      Programme scolaire
                    </Link>
                      <Link
                      href="/dashboard/admin/role"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                    Roles
                    </Link>

                 

                    <Link
                      href="/dashboard/admin/typefrais"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      Types de frais
                    </Link>

                    <Link
                      href="/dashboard/admin/tarif"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      Tarifs par classe
                    </Link>
                    <Link
                      href="/dashboard/admin/utilisateur"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      Utilisateurs
                    </Link>
                  

                  </div>
                )}
              </div>
            )}

            {/* LOGOUT */}
            <button
              onClick={logout}
              className="text-red-500 flex items-center gap-1"
            >
              <LogOut size={20} />
            </button>
          </>
        ) : (
          isClient && <Link href="/login">Connexion</Link>
        )}
      </nav>
    </header>
  );
}