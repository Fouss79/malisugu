"use client";

import { useEffect, useState, useCallback } from "react";

import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";

export default function EmargementPage() {
  const { user } = useAuth();

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [anneeId, setAnneeId] = useState("");
  const [annees, setAnnees] = useState([]);

  const [emploi, setEmploi] = useState([]);
  const [emargements, setEmargements] = useState([]);

  const [loadingId, setLoadingId] = useState(null);

  // ================= LOAD ANNEES =================
 useEffect(() => {
  const load = async () => {
    if (!user?.ecole?.id) return;

    try {
      const res = await api.get(
        `/annees/ecole/${user.ecole.id}`
      );

      const anneesData = res.data || [];

      setAnnees(anneesData);

      const anneeActive = anneesData.find(a => a.active);

      if (anneeActive) {
        setAnneeId(anneeActive.id);
      } else if (anneesData.length > 0) {
        setAnneeId(anneesData[0].id);
      }

    } catch (err) {
      console.error(err);
    }
  };

  load();
}, [user]);

  // ================= LOAD DATA =================
  const loadAll = useCallback(async () => {
    if (!anneeId || !date) return;

    const [resEmploi, resEmargement] = await Promise.all([
      api.get("/emargement/emploi", {
        params: { date, anneeId },
      }),

      api.get("/emargement/jour", {
        params: { date },
      }),
    ]);

    setEmploi(resEmploi.data || []);
    setEmargements(resEmargement.data || []);
  }, [date, anneeId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ================= CHECK =================
  const isEmarge = (edt) => {
    return emargements.some(
      (e) => e.emploiDuTemps?.id === edt.id
    );
  };

  // ================= EMARGER =================
  const emarger = async (edtId) => {
    if (loadingId === edtId) return;

    try {
      setLoadingId(edtId);

      await api.post(
        `/emargement/emarger/${edtId}`,
        null,
        { params: { date } }
      );

      await loadAll();
    } catch (err) {
      if (err.response?.status === 409) {
        setEmargements((prev) => [
          ...prev,
          { emploiDuTemps: { id: edtId } },
        ]);
      } else {
        console.error(err);
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-4">

      {/* FILTRES */}
      <div className="flex gap-3 mb-4">

        <select
          value={anneeId}
          onChange={(e) => setAnneeId(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          {annees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded">
        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th>Classe</th>
              <th>Matière</th>
              <th>Enseignant</th>
              <th>Horaire</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {emploi.map((edt) => {
              const ok = isEmarge(edt);

              return (
                <tr key={edt.id} className="text-center border-t">

                  <td>{edt.classe?.nomComplet}</td>
                  <td>{edt.matiere?.nom}</td>
                  <td>{edt.enseignant?.nom}</td>
                  <td>{edt.heureDebut}h - {edt.heureFin}h</td>

                  <td>
                    {ok ? "✔ Présent" : "❌ Absent"}
                  </td>

                  <td>
                    <button
                      disabled={ok || loadingId === edt.id}
                      onClick={() => emarger(edt.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      {ok ? "OK" : loadingId === edt.id ? "..." : "Emarger"}
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