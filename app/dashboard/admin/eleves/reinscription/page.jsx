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
    console.log(res.data);
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

  console.log("Status :", error.response?.status);
  console.log("Data :", error.response?.data);

  alert(error.response?.data || "Erreur lors de la réinscription");
}
};

    

  // ===================== UI =====================
  return (
    <div className=" min-h-screen">
   <div className="flex justify-end mb-4">
  <Link
    href="/dashboard/admin/eleves/listeinscrit"
    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
  >
    Inscription
  </Link>
</div>

     <div className="bg-white rounded-xl shadow p-3 max-w-7xl mx-auto">
             <h1 className="text-xl font-bold mb-4">
          Réinscription des élèves
        </h1>
   

       <table className="w-auto mx-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-1 text-left">Matricule</th>
              <th className="p-1 text-left">Nom</th>
              <th className="p-1 text-left">Prénom</th>
              <th className="p-1 text-left">Classe actuelle</th>
              <th className="p-1 text-left">Moyenne</th>
              <th className="p-1 text-left">Mention</th>
              <th className="p-1 text-left">Decision</th>
              <th className="p-1 text-left">Statut</th>
              <th className="p-1 text-left">Nouvelle classe</th>
              <th className="p-1 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {eleves.map((e) => (
              <tr key={e.id} className="border-t hover:bg-gray-50">
                <td className="p-1">{e.matricule}</td>
                <td className="p-1">{e.nom}</td>
                <td className="p-1">{e.prenom}</td>
                <td className="p-1">{e.classeNom}</td>

              <td className="p-1 font-bold text-blue-600">
  {e.moyenneAnnuelle != null
    ? Number(e.moyenneAnnuelle).toFixed(2)
    : "-"}
</td>

                <td className="p-1">{e.mention ?? "-"}</td>

                <td className="p-1 font-bold text-blue-600">
                  {e.decision ?? "-"}
                </td>

                <td className="p-1">
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
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
                      className="border rounded p-2"
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
                    className={`px-4 py-2 rounded text-white ${
                      e.statutReinscription === "REINSCRIT"
                        ? "bg-gray-400 cursor-not-allowed"
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
  );
}