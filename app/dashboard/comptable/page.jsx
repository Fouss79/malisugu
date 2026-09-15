"use client";

import React, { useState, useEffect } from "react";
import {
  MoreVertical,
  Edit2,
  Trash2,
  Search,
  Filter,
  Plus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const StatusBadge = ({ status }) => {
  const styles = {
    Inscrit: "bg-green-100 text-green-700 border-green-200",
    "En attente": "bg-amber-100 text-amber-700 border-amber-200",
    Suspendu: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status || "Inscrit"}
    </span>
  );
};

const ModernTable = ({ anneeId }) => {
  const { user } = useAuth();

  const [eleves, setEleves] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // CHARGEMENT DES ÉLÈVES
  // =========================================================
  useEffect(() => {
    if (!user?.ecole?.id || !anneeId) {
      setEleves([]);
      return;
    }

    const chargerEleves = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:8080/api/eleves/ecole/${user.ecole.id}/annee/${anneeId}`
        );

        if (!response.ok) {
          throw new Error(
            `Erreur lors du chargement des élèves (${response.status})`
          );
        }

        const data = await response.json();

        setEleves(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur chargement élèves :", err);
        setError("Impossible de charger la liste des élèves.");
        setEleves([]);
      } finally {
        setLoading(false);
      }
    };

    chargerEleves();
  }, [user?.ecole?.id, anneeId]);

  // =========================================================
  // RECHERCHE
  // =========================================================
  const filteredEleves = eleves.filter((e) => {
    const nom = e.nom || "";
    const prenom = e.prenom || "";

    return `${nom} ${prenom}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  // =========================================================
  // AFFICHAGE
  // =========================================================
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

      {/* HEADER */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Liste des élèves
          </h2>

          <p className="text-sm text-slate-500">
            Gérez les élèves de l'année scolaire sélectionnée
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* RECHERCHE */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
            />
          </div>

          {/* FILTRE */}
          <button
            type="button"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Filter size={18} />
          </button>

          {/* AJOUTER */}
          <button
            type="button"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">

          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-4 text-xs text-slate-500 uppercase">
                Élève
              </th>

              <th className="px-6 py-4 text-xs text-slate-500 uppercase">
                Classe
              </th>

              <th className="px-6 py-4 text-xs text-slate-500 uppercase">
                Statut
              </th>

              <th className="px-6 py-4 text-xs text-slate-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">

            {/* CHARGEMENT */}
            {loading && (
              <tr>
                <td
                  colSpan="4"
                  className="text-center p-8 text-gray-400"
                >
                  Chargement des élèves...
                </td>
              </tr>
            )}

            {/* ERREUR */}
            {!loading && error && (
              <tr>
                <td
                  colSpan="4"
                  className="text-center p-8 text-red-500"
                >
                  {error}
                </td>
              </tr>
            )}

            {/* LISTE */}
            {!loading &&
              !error &&
              filteredEleves.map((e) => (
                <tr
                  key={e.id}
                  className="hover:bg-blue-50 group"
                >

                  {/* ÉLÈVE */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">

                      <img
                        src={
                          e.photo ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            `${e.nom || ""} ${e.prenom || ""}`
                          )}`
                        }
                        alt={`${e.nom || ""} ${e.prenom || ""}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />

                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {e.nom || "—"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {e.prenom || "—"}
                        </div>
                      </div>

                    </div>
                  </td>

                  {/* CLASSE */}
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {e.classe?.nomComplet ||
                      e.classe?.nom ||
                      "—"}
                  </td>

                  {/* STATUT */}
                  <td className="px-6 py-4">
                    <StatusBadge
                      status={
                        e.status ||
                        e.statut ||
                        "Inscrit"
                      }
                    />
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                      <button
                        type="button"
                        className="p-1 hover:text-blue-600"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        type="button"
                        className="p-1 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>

                      <button
                        type="button"
                        className="p-1 hover:text-gray-600"
                        title="Plus d'options"
                      >
                        <MoreVertical size={16} />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}

            {/* AUCUN RÉSULTAT */}
            {!loading &&
              !error &&
              filteredEleves.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-8 text-gray-400"
                  >
                    {search
                      ? "Aucun élève ne correspond à votre recherche."
                      : "Aucun élève trouvé pour cette année scolaire."}
                  </td>
                </tr>
              )}

          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="px-6 py-4 border-t flex justify-between text-sm text-gray-500">
        <span>
          {filteredEleves.length} élève
          {filteredEleves.length > 1 ? "s" : ""}
        </span>
      </div>

    </div>
  );
};

export default ModernTable;