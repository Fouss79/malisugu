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
  Calendar,
  Settings,
  Layers,
  LogOut
} from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(null);

 const menuList = [
  { nom: "Tableau de bord", link: "/dashboard/superadmin", icon: <LayoutDashboard size={18} /> },
 
  

  { nom: "Ecoles", link: "/dashboard/superadmin/ecoles", icon: <FileText size={18} /> },
 
  { nom: "Utilisateurs", link: "/dashboard/superadmin/utilisateurs", icon: <Users size={18} /> },
  { nom: "Finances", link: "/dashboard/superadmin/finances", icon: <ClipboardList size={18} /> },
];

  return (
    <aside className="flex flex-col justify-between bg-[#054861] text-white  h-screen p-2">

      {/* PROFIL */}
      <div className="">
        <div className="flex flex-col  px-2 ">
          <div className="flex items-center gap-2 ">
             <div className="w-15 h-15 rounded-full bg-gray-300 mb-2"></div>
           <div>
          <h2 className="font-semibold text-lg">
            {user?.role || "Admin"}
          </h2>
          <h2 className="">
            {user?.ecole.nom || "Admin"}
          </h2>
        </div>
        </div>
        </div>
         

        {/* MENU */}
        <ul className="space-y-1 mt-4">
  {menuList.map((menu, index) => {

    const isOpen = openMenu === index;

    return (
      <li key={index}>

        {/* 🔥 MENU AVEC SOUS-MENU */}
        {menu.children ? (
          <div>
            <button
              onClick={() => setOpenMenu(isOpen ? null : index)}
              className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-gray-700 text-gray-300"
            >
              <div className="flex items-center gap-3">
                {menu.icon}
                {menu.nom}
              </div>

              {/* 🔽 flèche */}
              <span>{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
            </button>

            {/* 🔥 SOUS-MENU */}
            {isOpen && (
              <ul className="ml-6 mt-1 space-y-1">
                {menu.children.map((child, i) => {
                  const isActive = pathname === child.link;

                  return (
                    <li key={i}>
                      <Link
                        href={child.link}
                        className={`block px-3 py-2 rounded-lg text-sm
                          ${
                            isActive
                              ? "bg-[#15878f] text-white"
                              : "text-gray-400 hover:bg-gray-700"
                          }`}
                      >
                        {child.nom}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        ) : (
          /* 🔥 MENU NORMAL */
          <Link
            href={menu.link}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition
              ${
                pathname === menu.link
                  ? " bg-[#9FB9C4] text-white"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
          >
            {menu.icon}
            {menu.nom}
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

export default Sidebar;