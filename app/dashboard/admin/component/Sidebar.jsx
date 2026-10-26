"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  ClipboardList,
  ClipboardCheck,
  FileSignature,
  UserCheck,
  School,
  Wallet,
  Calculator,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

const INK = "#101B33";
const GOLD = "#C89B3C";

export default function Sidebar({ collapsed = false, mobileOpen = false, onClose }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [openMenu, setOpenMenu] = useState(null);

  const permissions = user?.permissions || [];
  const hasPermission = (p) => permissions.includes(p);

  /* Ferme le tiroir mobile à chaque changement de page */
  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* Échap ferme le tiroir + blocage du scroll quand il est ouvert */
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen, onClose]);

  const getLogoUrl = (logo) => {
    if (!logo) return null;
    if (logo.startsWith("http://") || logo.startsWith("https://")) return logo;
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
    return `${baseUrl.replace(/\/$/, "")}${logo.startsWith("/") ? logo : `/${logo}`}`;
  };

  const menuList = [
    (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && {
      nom: "Tableau de bord",
      link: "/dashboard/admin",
      icon: <LayoutDashboard size={18} />,
      exact: true,
    },
    hasPermission("GESTION_MATIERES") && {
      nom: "Matières",
      link: "/dashboard/admin/matieres",
      icon: <BookOpen size={18} />,
    },
    hasPermission("GESTION_ELEVES") && {
      nom: "Élèves",
      link: "/dashboard/admin/eleves/listeinscrit",
      match: "/dashboard/admin/eleves",
      icon: <Users size={18} />,
    },
    hasPermission("GESTION_CLASSES") && {
      nom: "Classes",
      link: "/dashboard/admin/afficheclasse",
      icon: <School size={18} />,
    },
    hasPermission("GESTION_ENSEIGNANTS") && {
      nom: "Enseignants",
      link: "/dashboard/admin/enseignants",
      icon: <UserCheck size={18} />,
    },
    hasPermission("GESTION_NOTES") && {
      nom: "Notes",
      link: "/dashboard/admin/notes",
      icon: <FileText size={18} />,
    },
    hasPermission("GESTION_EXAMENS") && {
      nom: "Examens",
      link: "/dashboard/admin/examens",
      icon: <ClipboardCheck size={18} />,
    },
    hasPermission("GESTION_PRESENCES") && {
      nom: "Présences",
      link: "/dashboard/admin/presences",
      icon: <ClipboardList size={18} />,
    },
    hasPermission("GESTION_PAIEMENTS") && {
      nom: "Finances",
      link: "/dashboard/admin/finances",
      icon: <Wallet size={18} />,
    },
    hasPermission("GESTION_SCOLARITES") && {
      nom: "Scolarités",
      link: "/dashboard/admin/scolarites",
      icon: <GraduationCap size={18} />,
    },
    hasPermission("GESTION_COMPTABILITES") && {
      nom: "Comptabilités",
      link: "/dashboard/admin/comptabilite",
      icon: <Calculator size={18} />,
    },
    hasPermission("GESTION_EMPLOIS_DU_TEMPS") && {
      nom: "Emplois du temps",
      link: "/dashboard/admin/emploisdutemps",
      icon: <CalendarClock size={18} />,
    },
    hasPermission("GESTION_EMARGEMENTS") && {
      nom: "Émargements",
      link: "/dashboard/admin/emargement",
      icon: <FileSignature size={18} />,
    },
  ].filter(Boolean);

  const isActive = (menu) => {
    if (menu.exact) return pathname === menu.link;
    const base = menu.match || menu.link;
    return pathname === base || pathname.startsWith(base + "/");
  };

  /* Les libellés sont masqués seulement en mode replié sur desktop (lg+).
     Sur mobile, le tiroir affiche toujours les libellés. */
  const hideWhenCollapsed = collapsed ? "lg:hidden" : "";

  return (
    <>
      {/* Fond assombri (mobile uniquement) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col bg-white text-[#101B33] shadow-2xl transition-all duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:z-auto lg:translate-x-0 lg:border-r lg:border-slate-100 lg:shadow-none
          ${collapsed ? "lg:w-16" : "lg:w-60"}`}
      >
        {/* Bouton fermer (mobile) */}
        <button
          onClick={onClose}
          aria-label="Fermer le menu"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:hidden"
        >
          <X size={18} />
        </button>

        {/* ===== LOGO + NOM ===== */}
        <div className="flex flex-col items-center px-3 pb-3 pt-5">
          <div
            className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-[#C89B3C]/30 transition-all ${
              collapsed ? "lg:h-10 lg:w-10" : ""
            }`}
          >
            {user?.ecole?.logo ? (
              <img
                src={getLogoUrl(user.ecole.logo)}
                alt={`Logo ${user?.ecole?.nom || "école"}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <School size={22} className="text-slate-400" />
            )}
          </div>

          <h2
            className={`mt-2 px-1 text-center text-sm font-semibold leading-tight ${hideWhenCollapsed}`}
            title={user?.ecole?.nom || ""}
          >
            {user?.ecole?.nom || "Mon établissement"}
          </h2>
        </div>

        <div className="mx-3 border-t border-slate-100" />

        {/* ===== MENU (défile si trop long) ===== */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-1">
            {menuList.map((menu, index) => {
              const isOpen = openMenu === index;

              /* --- Entrée avec sous-menu --- */
              if (menu.children) {
                return (
                  <li key={index}>
                    <button
                      onClick={() => setOpenMenu(isOpen ? null : index)}
                      title={collapsed ? menu.nom : undefined}
                      className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-[#101B33]/5 ${
                        collapsed ? "lg:justify-center" : ""
                      } justify-between`}
                    >
                      <span className="flex items-center gap-3">
                        {menu.icon}
                        <span className={hideWhenCollapsed}>{menu.nom}</span>
                      </span>
                      <span className={hideWhenCollapsed}>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>

                    {isOpen && (
                      <ul className={`ml-6 mt-1 space-y-1 border-l border-slate-100 pl-2 ${hideWhenCollapsed}`}>
                        {menu.children.map((child, i) => (
                          <li key={i}>
                            <Link
                              href={child.link}
                              className={`block rounded-lg px-3 py-2 text-sm transition ${
                                pathname === child.link
                                  ? "bg-[#101B33]/10 font-medium text-[#101B33]"
                                  : "text-slate-500 hover:bg-[#101B33]/5"
                              }`}
                            >
                              {child.nom}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              /* --- Lien simple --- */
              const active = isActive(menu);
              return (
                <li key={index}>
                  <Link
                    href={menu.link}
                    title={collapsed ? menu.nom : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      collapsed ? "lg:justify-center" : ""
                    } ${
                      active
                        ? "text-white shadow-sm"
                        : "text-slate-600 hover:bg-[#101B33]/5 hover:text-[#101B33]"
                    }`}
                    style={active ? { background: `linear-gradient(135deg, ${INK}, #182746)` } : undefined}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
                        style={{ background: GOLD }}
                      />
                    )}
                    <span className="shrink-0">{menu.icon}</span>
                    <span className={`truncate ${hideWhenCollapsed}`}>{menu.nom}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}