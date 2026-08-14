"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Search, Plus, Filter } from "lucide-react";
import api from "../../../../lib/api";// ⚠️ corrigé — "lib/page" n'existe pas

export default function ElevesPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [eleves, setEleves] = useState([]);
  const [classeFilter, setClasseFilter] = useState("");
  const [sousGroupeFilter, setSousGroupeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔥 LOAD
  useEffect(() => {
    const loadEleves = async () => {
      if (!user?.ecole?.id) return;

      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/eleves/ecole/${user.ecole.id}`);
        setEleves(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des élèves");
      } finally {
        setLoading(false);
      }
    };

    loadEleves();
  }, [user]);

  // 🔥 CLASSES UNIQUES
  const classesUniques = useMemo(() => [
    ...new Map(
      eleves.filter((e) => e.classe).map((e) => [e.classe.id, e.classe])
    ).values(),
  ], [eleves]);

  // 🔥 SOUS-GROUPES UNIQUES (toutes classes confondues)
  const sousGroupesUniques = useMemo(() => {
    const map = new Map();
    eleves.forEach((e) => {
      (e.sousGroupes || []).forEach((sg) => {
        if (!map.has(sg.id)) map.set(sg.id, sg);
      });
    });
    return Array.from(map.values());
  }, [eleves]);

  // 🔍 FILTRE + TRI
  const filteredEleves = useMemo(() => {
    return eleves
      .filter((e) => {
        const matchSearch = `${e.nom} ${e.prenom}`
          .toLowerCase()
          .includes(search.toLowerCase());

        const matchClasse = classeFilter === "" || e.classe?.id == classeFilter;

        const matchSousGroupe =
          sousGroupeFilter === "" ||
          (e.sousGroupes || []).some((sg) => sg.id == sousGroupeFilter);

        return matchSearch && matchClasse && matchSousGroupe;
      })
      .sort((a, b) => {
        // Tri par classe, puis par sous-groupe (si un filtre de sous-groupe est actif ou juste pour regrouper visuellement)
        const classeCompare = (a.classe?.nomComplet || "").localeCompare(b.classe?.nomComplet || "");
        if (classeCompare !== 0) return classeCompare;

        const sgA = (a.sousGroupes || [])[0]?.nom || "";
        const sgB = (b.sousGroupes || [])[0]?.nom || "";
        return sgA.localeCompare(sgB);
      });
  }, [eleves, search, classeFilter, sousGroupeFilter]);

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Liste des élèves</h1>

        <div className="flex flex-wrap items-center gap-3">

          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border py-2 pl-10 pr-4 text-sm"
            />
          </div>

          {/* FILTER CLASSE */}
          <select
            value={classeFilter}
            onChange={(e) => setClasseFilter(e.target.value)}
            className="rounded-lg border px-3 py-2"
          >
            <option value="">Toutes les classes</option>
            {classesUniques.map((c) => (
              <option key={c.id} value={c.id}>{c.nomComplet}</option>
            ))}
          </select>

          {/* FILTER SOUS-GROUPE */}
          <select
            value={sousGroupeFilter}
            onChange={(e) => setSousGroupeFilter(e.target.value)}
            className="rounded-lg border px-3 py-2"
          >
            <option value="">Tous les sous-groupes</option>
            {sousGroupesUniques.map((sg) => (
              <option key={sg.id} value={sg.id}>{sg.nom}</option>
            ))}
          </select>

          <button className="rounded-lg border p-2">
            <Filter size={18} />
          </button>

          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white">
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      {/* STATES */}
      {loading && <p>Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* TABLE */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Classe</th>
                <th className="p-3 text-left">Sous-groupe(s)</th>
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
                  <td colSpan="7" className="p-4 text-center text-gray-400">Aucun élève</td>
                </tr>
              ) : (
                filteredEleves.map((e) => (
                  <tr key={e.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{e.classe?.nomComplet || "Non affecté"}</td>
                    <td className="p-3">
                      {(e.sousGroupes || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {e.sousGroupes.map((sg) => (
                            <span
                              key={sg.id}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                            >
                              {sg.nom}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
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
      )}
    </div>
  );
}