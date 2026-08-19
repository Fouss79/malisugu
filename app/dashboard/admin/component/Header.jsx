"use client";

import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { LogOut, Settings, GraduationCap } from "lucide-react";
import axios from "axios";

import { Menu, PanelLeftClose } from "lucide-react";
import api from "../../../../lib/api";

/* =========================================================
   PALETTE (identique au reste de l'application)
========================================================= */
const INK = "#101B33";
const GOLD = "#C89B3C";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const CORAL = "#D2593F";
const CORAL_SOFT = "#F7E2DB";

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
        const res = await api.get(`/annees/active/${user.ecole.id}`);

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

  const menuItems = [
    { href: "/dashboard/admin/anneescolaire", label: "Année scolaire" },
    { href: "/dashboard/admin/Etablissement", label: "Établissement" },
    { href: "/dashboard/admin/Periode", label: "Période" },
    { href: "/dashboard/admin/permission", label: "Permissions" },
    { href: "/dashboard/admin/coefficientmatiere", label: "Programme scolaire" },
    { href: "/dashboard/admin/role", label: "Rôles" },
    { href: "/dashboard/admin/typefrais", label: "Types de frais" },
    { href: "/dashboard/admin/tarif", label: "Tarifs par classe" },
    { href: "/dashboard/admin/utilisateur", label: "Utilisateurs" },
  ];

  return (
    <header className="flex items-center justify-between bg-white px-6 py-2 shadow-md">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
        >
          {collapsed ? <Menu size={22} /> : <PanelLeftClose size={22} />}
        </button>

        <div className="text-sm font-medium text-slate-600">
          {anneeActive ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
              style={{ background: TEAL_SOFT, color: TEAL }}
            >
              <GraduationCap size={14} />
              {anneeActive.nom}
            </span>
          ) : (
            <span className="text-slate-400">Aucune année active</span>
          )}
        </div>
      </div>

      {/* MENU DROIT */}
      <nav className="flex items-center gap-4">
        {isClient && isAuthenticated ? (
          <>
            {/* SETTINGS */}
            {user?.role === "ADMIN" && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="rounded-full p-2 transition hover:bg-slate-100"
                  style={{ color: GOLD }}
                >
                  <Settings size={20} />
                </button>

                {open && (
                  <div
                    className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg shadow-slate-200/60"
                    style={{ borderTop: `2px solid ${GOLD}` }}
                  >
                    {menuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                        style={{ "--hover-color": INK }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = INK)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LOGOUT */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition hover:brightness-110"
              style={{ color: CORAL }}
              onMouseEnter={(e) => (e.currentTarget.style.background = CORAL_SOFT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          isClient && (
            <Link href="/login" className="text-sm font-medium" style={{ color: INK }}>
              Connexion
            </Link>
          )
        )}
      </nav>
    </header>
  );
}