"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

export default function EmargementPage() {
  const { user } = useAuth();

  const [jour, setJour] = useState("Lundi");
  const [anneeId, setAnneeId] = useState("");

  const [annees, setAnnees] = useState([]);
  const [emploi, setEmploi] = useState([]);
  const [emargements, setEmargements] = useState([]);

  const [loadingId, setLoadingId] = useState(null);

  // ================= LOAD ANNEES =================
  useEffect(() => {
    const loadAnnees = async () => {
      if (!user?.ecole?.id) return;

      const res = await axios.get(
        `http://localhost:8080/api/annees/ecole/${user.ecole.id}`
      );

      setAnnees(res.data || []);
      if (res.data.length > 0) setAnneeId(res.data[0].id);
    };

    loadAnnees();
  }, [user]);

  // ================= LOAD DATA =================
  const loadAll = useCallback(async () => {
    if (!anneeId || !jour) return;

    const date = new Date().toISOString().split("T")[0];

    const [resEmploi, resEmargement] = await Promise.all([
      axios.get("http://localhost:8080/api/emargement/emploi", {
        params: { jour, anneeId },
      }),
      axios.get("http://localhost:8080/api/emargement/jour", {
        params: { jour, date },
      }),
    ]);

    setEmploi(resEmploi.data || []);
    setEmargements(resEmargement.data || []);
  }, [jour, anneeId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ================= CHECK =================
  const isEmarge = (edt) => {
    return emargements.some(
      (e) =>
        e.enseignant?.id === edt.enseignant?.id &&
        e.classe?.id === edt.classe?.id &&
        e.matiere?.id === edt.matiere?.id
    );
  };

  // ================= EMARGER =================
  const emarger = async (edtId) => {
    const edt = emploi.find((e) => e.id === edtId);
    if (!edt) return;

    if (loadingId === edtId || isEmarge(edt)) return;

    try {
      setLoadingId(edtId);

      await axios.post(
        `http://localhost:8080/api/emargement/emarger/${edtId}`,
        null,
        {
          params: {
            date: new Date().toISOString().split("T")[0],
          },
        }
      );

      await loadAll();
    } catch (err) {
      if (err.response?.status === 409) {
        // déjà émargé → update UI
        setEmargements((prev) => [
          ...prev,
          {
            enseignant: edt.enseignant,
            classe: edt.classe,
            matiere: edt.matiere,
          },
        ]);
      } else {
        console.error(err);
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen">
     
      {/* FILTRES */}
      <div className="flex gap-3 mb-2">
        <select
          value={anneeId}
          onChange={(e) => setAnneeId(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          {annees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>

        <select
          value={jour}
          onChange={(e) => setJour(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option>Lundi</option>
          <option>Mardi</option>
          <option>Mercredi</option>
          <option>Jeudi</option>
          <option>Vendredi</option>
        </select>
      </div>
     <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* TABLE */}
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Classe</th>
            <th className="p-2">Matière</th>
            <th className="p-2">Enseignant</th>
            <th className="p-2">Horaire</th>
            <th className="p-2">Statut</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {emploi.map((edt) => {
            const emarge = isEmarge(edt);

            return (
              <tr key={edt.id} className="border-t text-center">
                <td className="p-2">{edt.classe?.nomComplet}</td>

                <td className="p-2">{edt.matiere?.nom}</td>

                <td className="p-2 font-medium text-blue-600">
                  {edt.enseignant?.nom} {edt.enseignant?.prenom}
                </td>

                <td className="p-2">
                  {edt.heureDebut}h - {edt.heureFin}h
                </td>

                {/* ✅ STATUT */}
                <td className="p-2">
                  {emarge ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                      ✔ Présent
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
                      ❌ Non émargé
                    </span>
                  )}
                </td>

                {/* ACTION */}
                <td className="p-2">
                  <button
                    disabled={loadingId === edt.id || emarge}
                    onClick={() => emarger(edt.id)}
                    className={`px-3 py-1 rounded text-white transition ${
                      emarge
                        ? "bg-green-500 cursor-not-allowed"
                        : loadingId === edt.id
                        ? "bg-gray-400"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {emarge
                      ? "✔ OK"
                      : loadingId === edt.id
                      ? "..."
                      : "Emarger"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
}