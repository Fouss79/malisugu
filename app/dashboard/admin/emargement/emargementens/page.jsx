"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, ChevronRight } from "lucide-react";

import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";

const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const CORAL = "#D2593F";
const CORAL_SOFT = "#F7E2DB";

function tauxColor(taux) {
  if (taux >= 90) return { bg: TEAL_SOFT, text: TEAL };
  if (taux >= 70) return { bg: "#FDF3DC", text: "#A9791F" };
  return { bg: CORAL_SOFT, text: CORAL };
}

export default function EmargementResumePage() {
  const { user } = useAuth();
  const router = useRouter();

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [debut, setDebut] = useState(firstOfMonth.toISOString().split("T")[0]);
  const [fin, setFin] = useState(today.toISOString().split("T")[0]);

  const [anneeId, setAnneeId] = useState("");
  const [annees, setAnnees] = useState([]);

  const [resume, setResume] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const load = useCallback(async () => {
    if (!anneeId || !debut || !fin) return;

    try {
      setLoading(true);

      const res = await api.get("/emargement/resume", {
        params: { debut, fin, anneeId },
      });

      setResume(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debut, fin, anneeId]);

  useEffect(() => {
    load();
  }, [load]);

  const goToEnseignant = (enseignantId) => {
    router.push(`enseignant/${enseignantId}`);
    // ↑ adapte ce chemin selon la route réelle de ta page dynamique
  };

  return (
    <div className="space-y-5 p-4">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`, color: INK }}
        >
          <BarChart3 size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Résumé des émargements</h1>
          <p className="text-sm text-slate-500">Taux de présence de tous les enseignants sur la période.</p>
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
                <th className="px-4 py-3 font-medium">Enseignant</th>
                <th className="px-4 py-3 font-medium">Séances prévues</th>
                <th className="px-4 py-3 font-medium">Séances émargées</th>
                <th className="px-4 py-3 font-medium">Heures totales</th>
                <th className="px-4 py-3 font-medium">Taux de présence</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {!loading && resume.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Aucune donnée sur cette période.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              )}

              {resume.map((r) => {
                const c = tauxColor(r.tauxPresence);

                return (
                  <tr
                    key={r.enseignantId}
                    onClick={() => goToEnseignant(r.enseignantId)}
                    className="cursor-pointer transition hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {r.enseignantPrenom} {r.enseignantNom}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.totalSeancesPrevues}</td>
                    <td className="px-4 py-3 text-slate-600">{r.totalSeances}</td>
                    <td className="px-4 py-3 text-slate-600">{r.totalHeuresEmargees}h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(r.tauxPresence, 100)}%`,
                              background: c.text,
                            }}
                          />
                        </div>
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: c.bg, color: c.text }}
                        >
                          {r.tauxPresence}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      <ChevronRight size={16} />
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