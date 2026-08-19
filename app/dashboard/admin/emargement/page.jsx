"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardCheck, Check, X } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";

/* =========================================================
   PALETTE (identique au reste de l'application)
========================================================= */
const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const CORAL = "#D2593F";
const CORAL_SOFT = "#F7E2DB";

export default function EmargementPage() {
  const { user } = useAuth();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

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
    return emargements.some((e) => e.emploiDuTemps?.id === edt.id);
  };

  // ================= EMARGER =================
  const emarger = async (edtId) => {
    if (loadingId === edtId) return;

    try {
      setLoadingId(edtId);

      await api.post(`/emargement/emarger/${edtId}`, null, { params: { date } });

      await loadAll();
    } catch (err) {
      if (err.response?.status === 409) {
        setEmargements((prev) => [...prev, { emploiDuTemps: { id: edtId } }]);
      } else {
        console.error(err);
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-5 p-4">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`, color: INK }}
        >
          <ClipboardCheck size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Émargement</h1>
          <p className="text-sm text-slate-500">
            Suivi de présence des enseignants par cours et par jour.
          </p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="flex flex-wrap gap-3">
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
          value={date}
          onChange={(e) => setDate(e.target.value)}
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
                <th className="px-4 py-3 font-medium">Classe</th>
                <th className="px-4 py-3 font-medium">Matière</th>
                <th className="px-4 py-3 font-medium">Enseignant</th>
                <th className="px-4 py-3 font-medium">Horaire</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {emploi.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Aucun cours prévu ce jour.
                  </td>
                </tr>
              )}

              {emploi.map((edt) => {
                const ok = isEmarge(edt);

                return (
                  <tr key={edt.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-800">{edt.classe?.nomComplet}</td>
                    <td className="px-4 py-3 text-slate-600">{edt.matiere?.nom}</td>
                    <td className="px-4 py-3 text-slate-600">{edt.enseignant?.nom}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {edt.heureDebut}h - {edt.heureFin}h
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={ok ? { background: TEAL_SOFT, color: TEAL } : { background: CORAL_SOFT, color: CORAL }}
                      >
                        {ok ? <Check size={12} /> : <X size={12} />}
                        {ok ? "Présent" : "Absent"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={ok || loadingId === edt.id}
                        onClick={() => emarger(edt.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: ok ? TEAL : `linear-gradient(135deg, ${INK}, #182746)` }}
                      >
                        {ok ? "OK" : loadingId === edt.id ? "..." : "Émarger"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}