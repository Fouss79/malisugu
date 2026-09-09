"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, ChevronRight } from "lucide-react";

import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";

const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const CORAL = "#D2593F";
const CORAL_SOFT = "#F7E2DB";

const NOMS_MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function tauxColor(taux) {
  if (taux >= 90) return { bg: TEAL_SOFT, text: TEAL };
  if (taux >= 70) return { bg: "#FDF3DC", text: "#A9791F" };
  return { bg: CORAL_SOFT, text: CORAL };
}

function formatDateLocal(date) {
  return date.toISOString().split("T")[0];
}

export default function PresenceStatsClassePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classeIdDepuisUrl = searchParams.get("classeId");

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [debut, setDebut] = useState(formatDateLocal(firstOfMonth));
  const [fin, setFin] = useState(formatDateLocal(today));

  const [moisSelectionne, setMoisSelectionne] = useState(today.getMonth() + 1);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(today.getFullYear());

  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState("");

  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const anneesDisponibles = (() => {
    const anneeCourante = today.getFullYear();
    const liste = [];
    for (let a = anneeCourante + 1; a >= anneeCourante - 4; a--) {
      liste.push(a);
    }
    return liste;
  })();

  const appliquerMois = (mois, annee) => {
    const debutMois = new Date(annee, mois - 1, 1);
    const finMois = new Date(annee, mois, 0);

    setMoisSelectionne(mois);
    setAnneeSelectionnee(annee);
    setDebut(formatDateLocal(debutMois));
    setFin(formatDateLocal(finMois));
  };

  // ================= LOAD CLASSES (scope école) =================
  useEffect(() => {
    const loadClasses = async () => {
      if (!user?.ecole?.id) return;

      try {
        const res = await api.get(`/classes/ecole/${user.ecole.id}`);
        const classesData = res.data || [];

        setClasses(classesData);

        if (classeIdDepuisUrl && classesData.some((c) => String(c.id) === classeIdDepuisUrl)) {
          setClasseId(classeIdDepuisUrl);
        } else if (classesData.length > 0) {
          setClasseId(classesData[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadClasses();
  }, [user]);

  // ================= LOAD STATS =================
  const load = useCallback(async () => {
    if (!classeId || !debut || !fin) return;

    try {
      setLoading(true);

      const res = await api.get(`/presences/classe/${classeId}/stats-periode`, {
        params: { debut, fin },
      });

      setStats(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [classeId, debut, fin]);

  useEffect(() => {
    load();
  }, [load]);

  const goToEleve = (inscriptionId, nom) => {
    router.push(`eleve/${inscriptionId}?debut=${debut}&fin=${fin}&nom=${encodeURIComponent(nom)}`);
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
          <Users size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Présences par classe</h1>
          <p className="text-sm text-slate-500">Taux de présence des élèves sur la période sélectionnée.</p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={classeId}
          onChange={(e) => setClasseId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nomComplet || c.nom}
            </option>
          ))}
        </select>

        {/* Sélecteur rapide Mois / Année */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
          <select
            value={moisSelectionne}
            onChange={(e) => appliquerMois(Number(e.target.value), anneeSelectionnee)}
            className="rounded-md border-none bg-transparent px-1 py-1 text-sm outline-none focus:ring-0"
          >
            {NOMS_MOIS.map((nom, index) => (
              <option key={nom} value={index + 1}>
                {nom}
              </option>
            ))}
          </select>

          <select
            value={anneeSelectionnee}
            onChange={(e) => appliquerMois(moisSelectionne, Number(e.target.value))}
            className="rounded-md border-none bg-transparent px-1 py-1 text-sm outline-none focus:ring-0"
          >
            {anneesDisponibles.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-300">ou plage personnalisée</span>

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
                <th className="px-4 py-3 font-medium">Élève</th>
                <th className="px-4 py-3 font-medium">Présences</th>
                <th className="px-4 py-3 font-medium">Absences</th>
                <th className="px-4 py-3 font-medium">Taux de présence</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {!loading && stats.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Aucune donnée sur cette période.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              )}

              {!loading &&
                stats.map((s) => {
                  const c = tauxColor(s.taux);

                  return (
                    <tr
                      key={s.inscriptionId}
                      onClick={() => goToEleve(s.inscriptionId, s.nom)}
                      className="cursor-pointer transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">{s.nom}</td>
                      <td className="px-4 py-3 text-slate-600">{s.present}</td>
                      <td className="px-4 py-3 text-slate-600">{s.absent}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(s.taux, 100)}%`,
                                background: c.text,
                              }}
                            />
                          </div>
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ background: c.bg, color: c.text }}
                          >
                            {s.taux}%
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