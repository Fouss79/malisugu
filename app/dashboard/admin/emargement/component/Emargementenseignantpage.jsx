"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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

function getAnneeCivile(anneeScolaire, mois) {
  if (!anneeScolaire) {
    return new Date().getFullYear();
  }

  const texte =
    anneeScolaire.nom ||
    anneeScolaire.libelle ||
    anneeScolaire.annee ||
    "";

  const match = String(texte).match(/(\d{4})\s*[-/]\s*(\d{4})/);

  if (!match) {
    return new Date().getFullYear();
  }

  const premiereAnnee = Number(match[1]);
  const deuxiemeAnnee = Number(match[2]);

  // Septembre -> Décembre = première année
  // Janvier -> Août = deuxième année
  return ["09", "10", "11", "12"].includes(mois)
    ? premiereAnnee
    : deuxiemeAnnee;
}

function getPeriodeMois(anneeScolaire, mois) {
  const annee = getAnneeCivile(anneeScolaire, mois);

  const debut = `${annee}-${mois}-01`;

  const dernierJour = new Date(
    annee,
    Number(mois),
    0
  ).getDate();

  const fin = `${annee}-${mois}-${String(dernierJour).padStart(2, "0")}`;

  return { debut, fin };
}

export default function EmargementEnseignantPage({
  enseignantId,
  enseignantNom,
}) {
  const { user } = useAuth();

  const today = new Date();

  const [mois, setMois] = useState(
    String(today.getMonth() + 1).padStart(2, "0")
  );

  const [anneeId, setAnneeId] = useState("");
  const [annees, setAnnees] = useState([]);

  const [emargements, setEmargements] = useState([]);
  const [loading, setLoading] = useState(false);

  // ================= ANNEE SCOLAIRE SELECTIONNEE =================
  const anneeSelectionnee = useMemo(() => {
    return annees.find((a) => String(a.id) === String(anneeId));
  }, [annees, anneeId]);

  // ================= CALCUL PERIODE =================
  const { debut, fin } = useMemo(() => {
    return getPeriodeMois(anneeSelectionnee, mois);
  }, [anneeSelectionnee, mois]);

  // ================= LOAD ANNEES =================
  useEffect(() => {
    const loadAnnees = async () => {
      if (!user?.ecole?.id) return;

      try {
        const res = await api.get(`/annees/ecole/${user.ecole.id}`);

        const anneesData = Array.isArray(res.data)
          ? res.data
          : [];

        setAnnees(anneesData);

        const anneeActive = anneesData.find((a) => a.active);

        if (anneeActive) {
          setAnneeId(String(anneeActive.id));
        } else if (anneesData.length > 0) {
          setAnneeId(String(anneesData[0].id));
        }
      } catch (err) {
        console.error("Erreur chargement années scolaires :", err);
      }
    };

    loadAnnees();
  }, [user]);

  // ================= LOAD EMARGEMENTS =================
  const load = useCallback(async () => {
    if (!enseignantId || !anneeId || !debut || !fin) {
      return;
    }

    try {
      setLoading(true);

      const res = await api.get(
        `/emargement/enseignant/${enseignantId}`,
        {
          params: {
            debut,
            fin,
            anneeId,
          },
        }
      );

      setEmargements(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error("Erreur chargement émargements :", err);
      setEmargements([]);
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
          style={{
            background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`,
            color: INK,
          }}
        >
          <History size={20} />
        </span>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Historique{" "}
            {enseignantNom ? `— ${enseignantNom}` : ""}
          </h1>

          <p className="text-sm text-slate-500">
            Séances émargées sur le mois sélectionné.
          </p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="flex flex-wrap items-center gap-3">
        {/* ANNEE SCOLAIRE */}
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

        {/* MOIS */}
        <select
          value={mois}
          onChange={(e) => setMois(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
        >
          {MOIS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* PERIODE CALCULEE */}
        <span className="text-sm text-slate-400">
          {debut} → {fin}
        </span>
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
                <th className="px-4 py-3 font-medium">
                  Date
                </th>

                <th className="px-4 py-3 font-medium">
                  Jour
                </th>

                <th className="px-4 py-3 font-medium">
                  Classe
                </th>

                <th className="px-4 py-3 font-medium">
                  Matière
                </th>

                <th className="px-4 py-3 font-medium">
                  Horaire
                </th>

                <th className="px-4 py-3 font-medium">
                  Durée
                </th>

                <th className="px-4 py-3 font-medium">
                  Statut
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {!loading && emargements.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Aucun émargement sur cette période.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Chargement...
                  </td>
                </tr>
              )}

              {emargements.map((em) => (
                <tr
                  key={em.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {em.dateHeure}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {em.jour}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {em.classe}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {em.matiere}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {em.heureDebut}h - {em.heureFin}h
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {em.duree}h
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={
                        em.present
                          ? {
                              background: TEAL_SOFT,
                              color: TEAL,
                            }
                          : {
                              background: CORAL_SOFT,
                              color: CORAL,
                            }
                      }
                    >
                      {em.present ? (
                        <Check size={12} />
                      ) : (
                        <X size={12} />
                      )}

                      {em.present
                        ? "Présent"
                        : "Absent"}
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