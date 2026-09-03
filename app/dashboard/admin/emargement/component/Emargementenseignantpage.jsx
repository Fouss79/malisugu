"use client";

import { useEffect, useState, useCallback } from "react";
import { History, Check, X } from "lucide-react";

import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";

const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const CORAL = "#D2593F";
const CORAL_SOFT = "#F7E2DB";

export default function EmargementEnseignantPage({ enseignantId, enseignantNom }) {
  const { user } = useAuth();

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [debut, setDebut] = useState(firstOfMonth.toISOString().split("T")[0]);
  const [fin, setFin] = useState(today.toISOString().split("T")[0]);

  const [anneeId, setAnneeId] = useState("");
  const [annees, setAnnees] = useState([]);

  const [emargements, setEmargements] = useState([]);
  const [loading, setLoading] = useState(false);

  // ================= LOAD ANNEES (scope école) =================
  useEffect(() => {
    const loadAnnees = async () => {
      if (!user?.ecole?.id) return;

      try {
        const res = await api.get(`/annees/ecole/${user.ecole.id}`);
        const anneesData = res.data || [];

        setAnnees(anneesData);

        const anneeActive = anneesData.find((a) => a.active);
        if (anneeActive) {
          setAnneeId(anneeActive.id);
        } else if (anneesData.length > 0) {
          setAnneeId(anneesData[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadAnnees();
  }, [user]);

  // ================= LOAD EMARGEMENTS =================
  const load = useCallback(async () => {
    if (!enseignantId || !anneeId) return;

    try {
      setLoading(true);

      const res = await api.get(`/emargement/enseignant/${enseignantId}`, {
        params: { debut, fin, anneeId },
      });

      setEmargements(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [enseignantId, debut, fin, anneeId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5 p-4">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`, color: INK }}
        >
          <History size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Historique {enseignantNom ? `— ${enseignantNom}` : ""}
          </h1>
          <p className="text-sm text-slate-500">Séances émargées sur la période sélectionnée.</p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={anneeId}
          onChange={(e) => setAnneeId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
        >
          {annees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={debut}
          onChange={(e) => setDebut(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
        />
        <span className="text-sm text-slate-400">à</span>
        <input
          type="date"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"
                style={{ background: "#F8F7F2" }}
              >
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Jour</th>
                <th className="px-4 py-3 font-medium">Classe</th>
                <th className="px-4 py-3 font-medium">Matière</th>
                <th className="px-4 py-3 font-medium">Horaire</th>
                <th className="px-4 py-3 font-medium">Durée</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {!loading && emargements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Aucun émargement sur cette période.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              )}

              {emargements.map((em) => (
                <tr key={em.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-slate-800">{em.dateHeure}</td>
                  <td className="px-4 py-3 text-slate-600">{em.jour}</td>
                  <td className="px-4 py-3 text-slate-600">{em.classe}</td>
                  <td className="px-4 py-3 text-slate-600">{em.matiere}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {em.heureDebut}h - {em.heureFin}h
                  </td>
                  <td className="px-4 py-3 text-slate-600">{em.duree}h</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={
                        em.present
                          ? { background: TEAL_SOFT, color: TEAL }
                          : { background: CORAL_SOFT, color: CORAL }
                      }
                    >
                      {em.present ? <Check size={12} /> : <X size={12} />}
                      {em.present ? "Présent" : "Absent"}
                    </span>
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