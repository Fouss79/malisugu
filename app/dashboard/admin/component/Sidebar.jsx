"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  ClipboardList,
  UserCheck,
  Printer,
} from "lucide-react";

export default function Sidebar({ collapsed }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [openMenu, setOpenMenu] = useState(null);

  const permissions = user?.permissions || [];

  const hasPermission = (permission) =>
    permissions.includes(permission);
  const getLogoUrl = (logo) => {
  if (!logo) return null;

  if (
    logo.startsWith("http://") ||
    logo.startsWith("https://")
  ) {
    return logo;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8080";

  return `${baseUrl.replace(/\/$/, "")}${
    logo.startsWith("/") ? logo : `/${logo}`
  }`;
};

const menuList = [
  (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && {
    nom: "Tableau de bord",
    link: "/dashboard/admin",
    icon: <LayoutDashboard size={18} />,
  },
    hasPermission("GESTION_MATIERES") && {
      nom: "Matières",
      link: "/dashboard/admin/matieres",
      icon: <BookOpen size={18} />,
    },
      hasPermission("GESTION_ELEVES") && {
      link:"/dashboard/admin/eleves/listeinscrit",
      nom: "Élèves",
      icon: <Users size={18} />,},
     
    hasPermission("GESTION_CLASSES") && {
      nom: "Classes",
      link: "/dashboard/admin/afficheclasse",
      icon: <GraduationCap size={18} />,
    },
    hasPermission("GESTION_ENSEIGNANTS") && {
      nom: "Enseignants",
      link: "/dashboard/admin/enseignants",
       icon: <UserCheck size={18} />,
    },
    hasPermission("GESTION_NOTES") && {
      nom: "Notes",
      link: "/dashboard/admin/notes",
      icon: <Printer size={18} />,
    },

    hasPermission("GESTION_PRESENCES") && {
      nom: "Présences",
      link: "/dashboard/admin/presences",
      icon: <ClipboardList size={18} />,
    },

    hasPermission("GESTION_PAIEMENTS") && {
      nom: "Finances",
      link: "/dashboard/admin/finances",
      icon: <ClipboardList size={18} />,
    },
    hasPermission("GESTION_EMPLOIS_DU_TEMPS") && {
      nom: "Emplois du temps",
      link: "/dashboard/admin/emploisdutemps",
      icon: <GraduationCap size={18} />,
    },
    hasPermission("GESTION_EMARGEMENTS") && {
      nom: "Emargements",
      link: "/dashboard/admin/emargement",
      icon: <GraduationCap size={18} />,
    },



  ].filter(Boolean); // supprime les menus non autorisés

  return (
   <aside
  className={`flex flex-col justify-between  bg-[#101B33] text-white h-screen p-2 transition-all duration-300 ${
    collapsed ? "w-15" : "w-52"
  }`}
>   <div>
        <div
  className={`flex items-center ${
    collapsed ? "justify-center" : "gap-2"
  }`}
>
          <div className="flex items-center gap-2">
            <div className="w-15 h-15 rounded-full bg-gray-300 mb-2 overflow-hidden flex items-center justify-center">
  {user?.ecole?.logo ? (
   <img
  src={getLogoUrl(user.ecole.logo)}
  alt={`Logo ${user?.ecole?.nom || "école"}`}
  className="w-full h-full object-contain"
  onLoad={() => {
    console.log(
      "✅ LOGO CHARGÉ :",
      getLogoUrl(user.ecole.logo)
    );
  }}
  onError={(e) => {
    console.error(
      "❌ ERREUR LOGO :",
      e.currentTarget.src
    );
  }}
/>
  ) : (
    <span className="text-xs text-gray-500">
      Aucun logo
    </span>
  )}
</div>

            {!collapsed && (
  <div>
    <h2 className="font-semibold text-lg">
      {user?.role}
    </h2>

    <h2>{user?.ecole?.nom}</h2>
  </div>
)}
          </div>
        </div>

        <ul className="space-y-1 mt-4">
          {menuList.map((menu, index) => {
            const isOpen = openMenu === index;

            return (
              <li key={index}>
                {menu.children ? (
                  <div>
                   <button
  onClick={() => setOpenMenu(isOpen ? null : index)}
  className={`flex items-center w-full px-4 py-2 rounded-lg hover:bg-gray-700 text-gray-300 ${
    collapsed ? "justify-center" : "justify-between"
  }`}
  title={collapsed ? menu.nom : ""}
>
  {collapsed ? (
    menu.icon
  ) : (
    <>
      <div className="flex items-center gap-3">
        {menu.icon}
        {menu.nom}
      </div>

      {isOpen ? (
        <ChevronUp size={16} />
      ) : (
        <ChevronDown size={16} />
      )}
    </>
  )}
</button>                  
{!collapsed && isOpen && ( 
                      <ul className="ml-6 mt-1 space-y-1">
                        {menu.children.map((child, i) => (
                          <li key={i}>
                            <Link
                              href={child.link}
                              className={`block px-3 py-2 rounded-lg text-sm ${
                                pathname === child.link
                                  ? "bg-[#15878f] text-white"
                                  : "text-gray-400 hover:bg-gray-700"
                              }`}
                            >
                              {child.nom}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                <Link
  href={menu.link}
  className={`flex items-center ${
    collapsed ? "justify-center" : "gap-3"
  } px-4 py-2 rounded-lg ${
    pathname === menu.link
      ? "bg-[#9FB9C4] text-white"
      : "hover:bg-gray-700 text-gray-300"
  }`}
  title={collapsed ? menu.nom : ""}
>
  {menu.icon}
  {!collapsed && menu.nom}
</Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

