"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Search, Plus, Filter } from "lucide-react";

export default function ElevesPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [eleves, setEleves] = useState([]);
  const [classeFilter, setClasseFilter] = useState("");

  // 🔥 LOAD
  useEffect(() => {
    if (!user?.ecole?.id) return;

    fetch(`http://localhost:8080/api/eleves/ecole/${user.ecole.id}`)
      .then((res) => res.json())
      .then((data) => setEleves(data))
      .catch((err) => console.error(err));
  }, [user]);

  // 🔥 CLASSES UNIQUES
  const classesUniques = [
    ...new Map(
      eleves
        .filter((e) => e.classe)
        .map((e) => [e.classe.id, e.classe])
    ).values(),
  ];

  // 🔍 FILTRE + TRI
  const filteredEleves = eleves
    .filter((e) => {
      const matchSearch = `${e.nom} ${e.prenom}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchClasse =
        classeFilter === "" || e.classe?.id == classeFilter;

      return matchSearch && matchClasse;
    })
    .sort((a, b) => {
      const classeA = a.classe?.nomComplet || "";
      const classeB = b.classe?.nomComplet || "";
      return classeA.localeCompare(classeB);
    });

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Liste des élèves</h1>

        <div className="flex items-center gap-3 flex-wrap">

          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64 bg-white"
            />
          </div>

          {/* SELECT CLASSE */}
          <select
            value={classeFilter}
            onChange={(e) => setClasseFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Toutes les classes</option>
            {classesUniques.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomComplet}
              </option>
            ))}
          </select>

          <button className="p-2 border rounded-lg hover:bg-gray-50">
            <Filter size={18} />
          </button>

          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">

          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="p-3 text-left">Classe</th>
              <th className="p-3 text-left">Matricule</th>
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Prénom</th>
              <th className="p-3 text-left">Date naissance</th>
              <th className="p-3 text-left">Sexe</th>
            </tr>
          </thead>

          <tbody>
            {filteredEleves.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-400">
                  Aucun élève
                </td>
              </tr>
            ) : (
              filteredEleves.map((e) => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    {e.classe?.nomComplet || "Non affecté"}
                  </td>
                  <td className="p-3">{e.matricule}</td>
                  <td className="p-3">{e.nom}</td>
                  <td className="p-3">{e.prenom}</td>
                  <td className="p-3">{e.dateNaissance}</td>
                  <td className="p-3">{e.sexe}</td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

    </div>
  );
}