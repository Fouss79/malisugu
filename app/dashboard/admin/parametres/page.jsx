"use client";

import Link from "next/link";

export default function ParametresPage() {
  const menus = [
    { nom: "Niveaux", link: "/admin/parametres/niveaux" },
    { nom: "Séries", link: "/admin/parametres/series" },
    { nom: "Groupes", link: "/admin/parametres/groupes" },
    { nom: "Année scolaire", link: "/admin/parametres/annee" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Paramètres</h1>

      <div className="grid grid-cols-2 gap-4">
        {menus.map((item, index) => (
          <Link
            key={index}
            href={item.link}
            className="bg-white shadow p-4 rounded-lg hover:bg-gray-100"
          >
            {item.nom}
          </Link>
        ))}
      </div>
    </div>
  );
}