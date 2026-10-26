"use client";

import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { LogOut, Settings, GraduationCap, Menu, PanelLeftClose } from "lucide-react";
import api from "../../../../lib/api";

/* =========================================================
   PALETTE (identique au reste de l'application)
========================================================= */
const INK = "#101B33";
const GOLD = "#C89B3C";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const CORAL = "#D2593F";

const PROFIL_LINK = "/dashboard/admin/monprofile";
const AVATAR_PAR_DEFAUT = "/avatar.png"; // public/avatar.png

function UserAvatar({ nom, photo, taille = 36 }) {
  const [erreur, setErreur] = useState(false);
  const src = photo && !erreur ? photo : AVATAR_PAR_DEFAUT;

  return (
    <img
      src={src}
      alt={nom || "Utilisateur"}
      onError={() => setErreur(true)}
      className="shrink-0 rounded-full object-cover ring-2 ring-slate-100"
      style={{ width: taille, height: taille }}
    />
  );
}

export default function Header({ collapsed, onMenuClick }) {
  const { user, isAuthenticated, logout } = useAuth();

  const [isClient, setIsClient] = useState(false);
  const [open, setOpen] = useState(false);
  const [anneeActive, setAnneeActive] = useState(null);
  const [profil, setProfil] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Année active
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

  // Profil (nom + photo)
  useEffect(() => {
    if (!user) return;

    const chargerProfil = async () => {
      try {
        const res = await api.get("/users/me");
        setProfil({ nom: res.data.nom, photo: res.data.photo });
      } catch (err) {
        console.error("Impossible de charger le profil :", err);
      }
    };

    chargerProfil();
    window.addEventListener("profil-updated", chargerProfil);
    return () => window.removeEventListener("profil-updated", chargerProfil);
  }, [user]);

  const nomAffiche = profil?.nom ?? user?.nom;
  const photoAffichee = profil?.photo ?? user?.photo;

  // Ferme le dropdown : clic/toucher à l'extérieur + Échap
  useEffect(() => {
    if (!open) return;

    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

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

  const roleAffiche = user?.role
    ? user.role
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (lettre) => lettre.toUpperCase())
    : "Utilisateur";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 shadow-sm sm:gap-4 sm:px-4 lg:px-6">
      {/* ===== GAUCHE : burger + année active ===== */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <button
          onClick={onMenuClick}
          aria-label="Ouvrir ou replier le menu"
          className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
        >
          {/* Mobile : toujours le burger */}
          <Menu size={22} className="lg:hidden" />
          {/* Desktop : dépend de l'état de la sidebar */}
          <span className="hidden lg:block">
            {collapsed ? <Menu size={22} /> : <PanelLeftClose size={22} />}
          </span>
        </button>

        <div className="min-w-0 text-sm font-medium text-slate-600">
          {anneeActive ? (
            <span
              className="inline-flex max-w-[9rem] items-center gap-1.5 rounded-full px-2.5 py-1 text-xs sm:max-w-xs sm:px-3 sm:text-sm"
              style={{ background: TEAL_SOFT, color: TEAL }}
              title={anneeActive.nom}
            >
              <GraduationCap size={14} className="shrink-0" />
              <span className="truncate">{anneeActive.nom}</span>
            </span>
          ) : (
            <span className="truncate text-xs text-slate-400 sm:text-sm">
              Aucune année active
            </span>
          )}
        </div>
      </div>

      {/* ===== DROITE ===== */}
      <nav className="flex shrink-0 items-center gap-1 sm:gap-3">
        {isClient && isAuthenticated ? (
          <>
            {/* PROFIL + RÔLE */}
            <Link
              href={PROFIL_LINK}
              title="Mon profil"
              className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-slate-50 sm:px-2"
            >
              <UserAvatar key={photoAffichee} nom={nomAffiche} photo={photoAffichee} />

              {/* Masqué sur mobile : l'avatar suffit */}
              <div className="hidden max-w-[10rem] flex-col leading-tight sm:flex">
                <span
                  className="truncate text-sm font-semibold"
                  style={{ color: INK }}
                >
                  {nomAffiche || "Utilisateur"}
                </span>
                <span className="truncate text-xs font-medium" style={{ color: TEAL }}>
                  {roleAffiche}
                </span>
              </div>
            </Link>

            {/* PARAMÈTRES */}
            {user?.role === "ADMIN" && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen(!open)}
                  aria-label="Paramètres"
                  aria-expanded={open}
                  title="Paramètres"
                  className="rounded-full p-2 transition hover:bg-slate-100"
                  style={{ color: GOLD }}
                >
                  <Settings
                    size={20}
                    className={`transition-transform duration-300 ${
                      open ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {open && (
                  <div
                    className="absolute right-0 z-50 mt-2 max-h-[70vh] w-56 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg shadow-slate-200/60"
                    style={{ borderTop: `2px solid ${GOLD}` }}
                  >
                    {menuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-[#101B33]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DÉCONNEXION */}
            <button
              onClick={logout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="flex items-center rounded-lg p-2 transition hover:bg-[#F7E2DB]"
              style={{ color: CORAL }}
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          isClient && (
            <Link
              href="/login"
              className="text-sm font-medium"
              style={{ color: INK }}
            >
              Connexion
            </Link>
          )
        )}
      </nav>
    </header>
  );
}