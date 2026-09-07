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

export default function EmargementResumePage() {
  const { user } = useAuth();
  const router = useRouter();

  // ============================================================
  // ÉTATS
  // ============================================================

  const [mois, setMois] = useState("");
const [moisDisponibles, setMoisDisponibles] = useState([]);

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
// MOIS DE L'ANNÉE SCOLAIRE
// ============================================================

useEffect(() => {
  if (!anneeId || annees.length === 0) {
    setMoisDisponibles([]);
    setMois("");
    setDebut("");
    setFin("");
    return;
  }

  const anneeScolaire = annees.find(
    (a) => String(a.id) === String(anneeId)
  );

  if (!anneeScolaire) {
    setMoisDisponibles([]);
    setMois("");
    setDebut("");
    setFin("");
    return;
  }

  /*
   * IMPORTANT :
   * Le backend doit retourner :
   *
   * dateDebut : "2025-10-01"
   * dateFin   : "2026-07-31"
   */

  const dateDebut = anneeScolaire.dateDebut;
  const dateFin = anneeScolaire.dateFin;

  if (!dateDebut || !dateFin) {
    setMoisDisponibles([]);
    setMois("");
    setDebut("");
    setFin("");
    return;
  }

  const debutDate = new Date(`${dateDebut}T00:00:00`);
  const finDate = new Date(`${dateFin}T00:00:00`);

  if (
    Number.isNaN(debutDate.getTime()) ||
    Number.isNaN(finDate.getTime())
  ) {
    setMoisDisponibles([]);
    setMois("");
    setDebut("");
    setFin("");
    return;
  }

  const moisListe = [];

  let courant = new Date(
    debutDate.getFullYear(),
    debutDate.getMonth(),
    1
  );

  const limite = new Date(
    finDate.getFullYear(),
    finDate.getMonth(),
    1
  );

  while (courant <= limite) {
    const annee = courant.getFullYear();
    const moisNumber = courant.getMonth() + 1;

    moisListe.push({
      value: `${annee}-${String(moisNumber).padStart(2, "0")}`,
      label: `${NOMS_MOIS[moisNumber - 1]} ${annee}`,
      annee,
      mois: moisNumber,
    });

    courant = new Date(
      annee,
      courant.getMonth() + 1,
      1
    );
  }

  setMoisDisponibles(moisListe);

  // Garder le mois sélectionné s'il existe encore
  const moisExiste = moisListe.some(
    (m) => m.value === mois
  );

  // Sinon prendre le premier mois de l'année scolaire
  if (!moisExiste) {
    setMois(moisListe[0]?.value || "");
  }
}, [anneeId, annees]);
  // ============================================================
  // DÉTERMINER L'ANNÉE CIVILE DU MOIS
  // ============================================================

 
  // ============================================================
  // CALCUL DÉBUT / FIN DU MOIS
  // ============================================================

  // ============================================================
// CALCUL DÉBUT / FIN DU MOIS
// ============================================================

useEffect(() => {
  if (!mois || moisDisponibles.length === 0) {
    setDebut("");
    setFin("");
    return;
  }

  const moisSelectionne = moisDisponibles.find(
    (m) => m.value === mois
  );

  if (!moisSelectionne) {
    setDebut("");
    setFin("");
    return;
  }

  const {
    annee,
    mois: moisNumber,
  } = moisSelectionne;

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
}, [mois, moisDisponibles]);

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

  const moisSelectionne = moisDisponibles.find(
  (m) => m.value === mois
);

const moisLabel = moisSelectionne?.label || "";
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
    onChange={(e) => setMois(e.target.value)}
    disabled={moisDisponibles.length === 0}
    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C] disabled:cursor-not-allowed disabled:bg-slate-100"
  >
    {moisDisponibles.length === 0 && (
      <option value="">
        Aucun mois disponible
      </option>
    )}

    {moisDisponibles.map((m) => (
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
      {moisLabel}
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