"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useRouter,
  useSearchParams,
  useParams
} from "next/navigation";
import { History, Check, X, ArrowLeft } from "lucide-react";

import api from "../../../../../../lib/api";

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

function formatDateLocal(date) {
  return date.toISOString().split("T")[0];
}

export default function PresenceHistoriqueElevePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const inscriptionId = params.id;
  const today = new Date();
  const firstOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const debutInitial =
    searchParams.get("debut") ||
    formatDateLocal(firstOfMonth);

  const finInitial =
    searchParams.get("fin") ||
    formatDateLocal(today);

  const nomEleve =
    searchParams.get("nom") || "";

  const [debut, setDebut] = useState(debutInitial);
  const [fin, setFin] = useState(finInitial);

  const [moisSelectionne, setMoisSelectionne] = useState(new Date(debutInitial).getMonth() + 1);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date(debutInitial).getFullYear());

  const [historique, setHistorique] = useState([]);
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

  const load = useCallback(async () => {
  if (!inscriptionId || !debut || !fin) {
    console.log("❌ Paramètres manquants :", {
      inscriptionId,
      debut,
      fin,
    });
    return;
  }

  try {
    setLoading(true);

    console.log("📡 Chargement historique :", {
      url: `/presences/inscription/${inscriptionId}/historique`,
      debut,
      fin,
    });

    const res = await api.get(
      `/presences/inscription/${inscriptionId}/historique`,
      {
        params: {
          debut,
          fin,
        },
      }
    );

    console.log("✅ Réponse historique :", res.data);
    console.log("🔎 Historique présence :", {
    inscriptionId,
    debut,
    fin
});

    setHistorique(
      Array.isArray(res.data)
        ? res.data
        : []
    );

  } catch (err) {
    console.error(
      "❌ Erreur historique :",
      err.response?.data || err
    );

    setHistorique([]);
  } finally {
    setLoading(false);
  }
}, [inscriptionId, debut, fin]);
useEffect(() => {
  load();
}, [load]);
  return (
    <div className="space-y-5 p-4">
      {/* RETOUR */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft size={15} />
        Retour à la classe
      </button>

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
            Historique {nomEleve ? `— ${nomEleve}` : ""}
          </h1>
          <p className="text-sm text-slate-500">Présences et absences sur la période sélectionnée.</p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="flex flex-wrap items-center gap-3">
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
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Matière</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Motif</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {!loading && historique.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    Aucun enregistrement sur cette période.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              )}

              {!loading &&
                historique.map((h) => (
                  <tr key={h.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-800">{h.date}</td>
                    <td className="px-4 py-3 text-slate-600">{h.matiereNom || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={
                          h.statut === "PRESENT"
                            ? { background: TEAL_SOFT, color: TEAL }
                            : { background: CORAL_SOFT, color: CORAL }
                        }
                      >
                        {h.statut === "PRESENT" ? <Check size={12} /> : <X size={12} />}
                        {h.statut === "PRESENT" ? "Présent" : "Absent"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{h.motif || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}