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

const MOIS = [
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
];

function tauxColor(taux) {
  if (taux >= 90) return { bg: TEAL_SOFT, text: TEAL };
  if (taux >= 70) return { bg: "#FDF3DC", text: "#A9791F" };
  return { bg: CORAL_SOFT, text: CORAL };
}

export default function EmargementResumePage() {
  const { user } = useAuth();
  const router = useRouter();

  // ============================================================
  // ÉTATS
  // ============================================================

  const today = new Date();

  const [mois, setMois] = useState(
    String(today.getMonth() + 1).padStart(2, "0")
  );

  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");

  const [anneeId, setAnneeId] = useState("");
  const [annees, setAnnees] = useState([]);

  const [resume, setResume] = useState([]);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // CHARGEMENT ANNÉES SCOLAIRES
  // ============================================================

  useEffect(() => {
    const loadAnnees = async () => {
      if (!user?.ecole?.id) return;

      try {
        const res = await api.get(
          `/annees/ecole/${user.ecole.id}`
        );

        const anneesData = Array.isArray(res.data)
          ? res.data
          : [];

        setAnnees(anneesData);

        const anneeActive = anneesData.find(
          (a) => a.active === true || a.active === "true"
        );

        if (anneeActive) {
          setAnneeId(anneeActive.id);
        } else if (anneesData.length > 0) {
          setAnneeId(anneesData[0].id);
        }
      } catch (err) {
        console.error(
          "Erreur chargement années scolaires :",
          err
        );
      }
    };

    loadAnnees();
  }, [user]);

  // ============================================================
  // DÉTERMINER L'ANNÉE CIVILE DU MOIS
  // ============================================================

  const getAnneeCivile = useCallback(() => {
    if (!anneeId || !mois) return null;

    const anneeScolaire = annees.find(
      (a) => String(a.id) === String(anneeId)
    );

    if (!anneeScolaire) return null;

    /*
     * On essaie de récupérer une année du type :
     *
     * 2025-2026
     * 2024-2025
     *
     * depuis le nom/libellé de l'année scolaire.
     */

    const texte =
      anneeScolaire.nom ||
      anneeScolaire.libelle ||
      anneeScolaire.annee ||
      "";

    const match = String(texte).match(
      /(\d{4})\s*[-/]\s*(\d{4})/
    );

    if (match) {
      const anneeDebut = Number(match[1]);
      const moisNumber = Number(mois);

      // Septembre à décembre = année de début
      if (moisNumber >= 9) {
        return anneeDebut;
      }

      // Janvier à août = année suivante
      return anneeDebut + 1;
    }

    // Fallback
    return today.getFullYear();
  }, [anneeId, mois, annees]);

  // ============================================================
  // CALCUL DÉBUT / FIN DU MOIS
  // ============================================================

  useEffect(() => {
    if (!anneeId || !mois || annees.length === 0) {
      setDebut("");
      setFin("");
      return;
    }

    const annee = getAnneeCivile();

    if (!annee) return;

    const moisNumber = Number(mois);

    const premierJour = new Date(
      annee,
      moisNumber - 1,
      1
    );

    const dernierJour = new Date(
      annee,
      moisNumber,
      0
    );

    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(
        date.getMonth() + 1
      ).padStart(2, "0");
      const d = String(
        date.getDate()
      ).padStart(2, "0");

      return `${y}-${m}-${d}`;
    };

    setDebut(formatDate(premierJour));
    setFin(formatDate(dernierJour));
  }, [
    anneeId,
    mois,
    annees,
    getAnneeCivile,
  ]);

  // ============================================================
  // CHARGEMENT DU RÉSUMÉ
  // ============================================================

  const load = useCallback(async () => {
    if (!anneeId || !debut || !fin) return;

    try {
      setLoading(true);

      const res = await api.get(
        "/emargement/resume",
        {
          params: {
            debut,
            fin,
            anneeId,
          },
        }
      );

      setResume(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(
        "Erreur chargement résumé :",
        err
      );

      setResume([]);
    } finally {
      setLoading(false);
    }
  }, [debut, fin, anneeId]);

  useEffect(() => {
    load();
  }, [load]);

  // ============================================================
  // NAVIGATION ENSEIGNANT
  // ============================================================

  const goToEnseignant = (enseignantId) => {
    router.push(
      `enseignant/${enseignantId}`
    );
  };

  // ============================================================
  // LABEL DU MOIS
  // ============================================================

  const moisLabel =
    MOIS.find(
      (m) => m.value === mois
    )?.label || "";

  const anneeCivile = getAnneeCivile();

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="space-y-5 p-4">

      {/* HEADER */}
      <div className="flex items-center gap-3">

        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`,
            color: INK,
          }}
        >
          <BarChart3 size={20} />
        </span>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Résumé des émargements
          </h1>

          <p className="text-sm text-slate-500">
            Taux de présence de tous les enseignants
            pour le mois sélectionné.
          </p>
        </div>

      </div>

      {/* FILTRES */}
      <div className="flex flex-wrap items-end gap-3">

        {/* ANNÉE SCOLAIRE */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Année scolaire
          </label>

          <select
            value={anneeId}
            onChange={(e) =>
              setAnneeId(e.target.value)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
          >
            {annees.map((a) => (
              <option
                key={a.id}
                value={a.id}
              >
                {a.nom ||
                  a.libelle ||
                  a.annee}
              </option>
            ))}
          </select>
        </div>

        {/* MOIS */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Mois
          </label>

          <select
            value={mois}
            onChange={(e) =>
              setMois(e.target.value)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
          >
            {MOIS.map((m) => (
              <option
                key={m.value}
                value={m.value}
              >
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* PÉRIODE */}
        {debut && fin && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {moisLabel} {anneeCivile}
            </span>

            <span className="mx-2">
              •
            </span>

            {debut} → {fin}
          </div>
        )}

      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead>
              <tr
                className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"
                style={{
                  background: "#F8F7F2",
                }}
              >
                <th className="px-4 py-3 font-medium">
                  Enseignant
                </th>

                <th className="px-4 py-3 font-medium">
                  Séances prévues
                </th>

                <th className="px-4 py-3 font-medium">
                  Séances émargées
                </th>

                <th className="px-4 py-3 font-medium">
                  Heures totales
                </th>

                <th className="px-4 py-3 font-medium">
                  Taux de présence
                </th>

                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">

              {/* VIDE */}
              {!loading &&
                resume.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Aucune donnée pour{" "}
                      <span className="font-medium text-slate-600">
                        {moisLabel} {anneeCivile}
                      </span>
                      .
                    </td>
                  </tr>
                )}

              {/* LOADING */}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Chargement...
                  </td>
                </tr>
              )}

              {/* DONNÉES */}
              {!loading &&
                resume.map((r) => {

                  const taux =
                    Number(
                      r.tauxPresence
                    ) || 0;

                  const c =
                    tauxColor(taux);

                  return (
                    <tr
                      key={r.enseignantId}
                      onClick={() =>
                        goToEnseignant(
                          r.enseignantId
                        )
                      }
                      className="cursor-pointer transition hover:bg-slate-50/70"
                    >

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {r.enseignantPrenom}{" "}
                        {r.enseignantNom}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {r.totalSeancesPrevues}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {r.totalSeances}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {r.totalHeuresEmargees}h
                      </td>

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-2">

                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  taux,
                                  100
                                )}%`,
                                background:
                                  c.text,
                              }}
                            />

                          </div>

                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              background:
                                c.bg,
                              color:
                                c.text,
                            }}
                          >
                            {taux}%
                          </span>

                        </div>

                      </td>

                      <td className="px-4 py-3 text-right text-slate-300">
                        <ChevronRight
                          size={16}
                        />
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