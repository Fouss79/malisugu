"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";
import Link from "next/link";

export default function ReinscriptionPage() {
  const { user } = useAuth();

  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState({});

  useEffect(() => {
    if (!user?.ecole?.id) return;

    loadElevesReinscription();
    loadClasses();
  }, [user]);

  // ===================== ELEVES =====================
  const loadElevesReinscription = async () => {
    try {
      const res = await api.get(
        `/inscriptions/ecole/${user.ecole.id}/reinscription`
      );
      setEleves(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erreur chargement élèves :", error);
      setEleves([]);
    }
  };

  // ===================== CLASSES =====================
  const loadClasses = async () => {
    try {
      const res = await api.get(
        `/classes/ecole/${user.ecole.id}`
      );

      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erreur chargement classes :", error);
      setClasses([]);
    }
  };

  // ===================== CHANGE =====================
  const handleClasseChange = (inscriptionId, classeId) => {
    setSelectedClasses((prev) => ({
      ...prev,
      [inscriptionId]: classeId,
    }));
  };

  // ===================== REINSCRIRE =====================
  const reinscrire = async (inscriptionId) => {
    const classeId = selectedClasses[inscriptionId];

    if (!classeId) {
      alert("Choisissez une classe");
      return;
    }

    try {
      const res = await api.post(
        `/inscriptions/${inscriptionId}/reinscrire/${classeId}`
      );

      alert(res.data?.message || "✅ Réinscription effectuée");

      loadElevesReinscription();
    } catch (error) {
      console.error("Erreur complète :", error);
      alert(error.response?.data?.message || error.response?.data || "Erreur lors de la réinscription");
    }
  };

  // ===================== UI =====================
  return (
    <div className="min-h-screen px-3 py-4 sm:px-4">
      <div className="mb-4 flex justify-end">
        <Link
          href="/dashboard/admin/eleves/listeinscrit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
        >
          Inscription
        </Link>
      </div>

      <div className="mx-auto max-w-7xl rounded-xl bg-white p-3 shadow sm:p-4">
        <h1 className="mb-4 text-lg font-bold sm:text-xl">
          Réinscription des élèves
        </h1>

        {eleves.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Aucun élève à réinscrire pour l'instant.
          </p>
        )}

        {/* ===== VUE MOBILE : CARTES ===== */}
        <div className="space-y-3 sm:hidden">
          {eleves.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-slate-100 p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">
                    {e.prenom} {e.nom}
                  </p>
                  <p className="text-xs text-slate-400">
                    Matricule : {e.matricule || "—"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-1 text-xs text-white ${
                    e.statutReinscription === "REINSCRIT"
                      ? "bg-green-600"
                      : "bg-orange-500"
                  }`}
                >
                  {e.statutReinscription ?? "NON_REINSCRIT"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <p><span className="text-slate-400">Classe actuelle :</span> {e.classeNom || "—"}</p>
                <p>
                  <span className="text-slate-400">Moyenne :</span>{" "}
                  <span className="font-bold text-blue-600">
                    {e.moyenneAnnuelle != null ? Number(e.moyenneAnnuelle).toFixed(2) : "-"}
                  </span>
                </p>
                <p><span className="text-slate-400">Mention :</span> {e.mention ?? "-"}</p>
                <p>
                  <span className="text-slate-400">Décision :</span>{" "}
                  <span className="font-bold text-blue-600">{e.decision ?? "-"}</span>
                </p>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3">
                {e.statutReinscription === "REINSCRIT" ? (
                  <p className="text-sm text-slate-600">
                    Nouvelle classe : <span className="font-medium">{e.nouvelleClasseNom}</span>
                  </p>
                ) : (
                  <select
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                    value={selectedClasses[e.id] || ""}
                    onChange={(ev) => handleClasseChange(e.id, ev.target.value)}
                  >
                    <option value="">Choisir une classe</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nomComplet}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  disabled={e.statutReinscription === "REINSCRIT"}
                  onClick={() => reinscrire(e.id)}
                  className={`mt-2 w-full rounded-lg px-4 py-2 text-sm font-medium text-white ${
                    e.statutReinscription === "REINSCRIT"
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {e.statutReinscription === "REINSCRIT" ? "Déjà réinscrit" : "Réinscrire"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ===== VUE DESKTOP : TABLEAU ===== */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Matricule</th>
                <th className="p-2 text-left">Nom</th>
                <th className="p-2 text-left">Prénom</th>
                <th className="p-2 text-left">Classe actuelle</th>
                <th className="p-2 text-left">Moyenne</th>
                <th className="p-2 text-left">Mention</th>
                <th className="p-2 text-left">Decision</th>
                <th className="p-2 text-left">Statut</th>
                <th className="p-2 text-left">Nouvelle classe</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {eleves.map((e) => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{e.matricule}</td>
                  <td className="p-2">{e.nom}</td>
                  <td className="p-2">{e.prenom}</td>
                  <td className="p-2">{e.classeNom}</td>

                  <td className="p-2 font-bold text-blue-600">
                    {e.moyenneAnnuelle != null
                      ? Number(e.moyenneAnnuelle).toFixed(2)
                      : "-"}
                  </td>

                  <td className="p-2">{e.mention ?? "-"}</td>

                  <td className="p-2 font-bold text-blue-600">
                    {e.decision ?? "-"}
                  </td>

                  <td className="p-2">
                    <span
                      className={`whitespace-nowrap rounded px-2 py-1 text-xs text-white ${
                        e.statutReinscription === "REINSCRIT"
                          ? "bg-green-600"
                          : "bg-orange-500"
                      }`}
                    >
                      {e.statutReinscription ?? "NON_REINSCRIT"}
                    </span>
                  </td>

                  <td className="p-2">
                    {e.statutReinscription === "REINSCRIT" ? (
                      e.nouvelleClasseNom
                    ) : (
                      <select
                        className="rounded border p-2"
                        value={selectedClasses[e.id] || ""}
                        onChange={(ev) =>
                          handleClasseChange(e.id, ev.target.value)
                        }
                      >
                        <option value="">Choisir une classe</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nomComplet}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  <td className="p-2">
                    <button
                      disabled={e.statutReinscription === "REINSCRIT"}
                      onClick={() => reinscrire(e.id)}
                      className={`whitespace-nowrap rounded px-4 py-2 text-white ${
                        e.statutReinscription === "REINSCRIT"
                          ? "cursor-not-allowed bg-gray-400"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {e.statutReinscription === "REINSCRIT"
                        ? "Déjà réinscrit"
                        : "Réinscrire"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}