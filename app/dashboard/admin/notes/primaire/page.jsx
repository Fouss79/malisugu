"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";
import {
  Save,
  Users,
  BookOpen,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const MOIS = [
  "SEPTEMBRE",
  "OCTOBRE",
  "NOVEMBRE",
  "DECEMBRE",
  "JANVIER",
  "FEVRIER",
  "MARS",
  "AVRIL",
  "MAI",
  "JUIN",
];

const MOIS_LABELS = {
  SEPTEMBRE: "Septembre",
  OCTOBRE: "Octobre",
  NOVEMBRE: "Novembre",
  DECEMBRE: "Décembre",
  JANVIER: "Janvier",
  FEVRIER: "Février",
  MARS: "Mars",
  AVRIL: "Avril",
  MAI: "Mai",
  JUIN: "Juin",
};

// Note primaire : toujours sur 10 (contrairement à la saisie classique, sur 20).
const NOTE_MIN = 0;
const NOTE_MAX = 10;

// Le cycle n'est pas un champ direct de Classe : il est porté par
// Classe.niveau.cycle.nom (voir entités Niveau / Cycle côté backend).
// Certains niveaux peuvent ne pas avoir de cycle renseigné (champ optionnel) :
// ils sont alors exclus de cette page, puisqu'ils ne sont pas identifiables
// comme primaire.
function estClassePrimaire(classe) {
  return classe?.niveau?.cycle?.nom?.toUpperCase() === "PREMIER CYCLE";
}

export default function NotesPrimairePage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);

  const [classeId, setClasseId] = useState("");
  const [anneeId, setAnneeId] = useState("");
  const [mois, setMois] = useState("");

  const [eleves, setEleves] = useState([]);
  const [matieres, setMatieres] = useState([]);

  const [notes, setNotes] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const classesPrimaire = useMemo(
    () => classes.filter(estClassePrimaire),
    [classes]
  );

  useEffect(() => {
    if (!user?.ecole?.id) return;

    const charger = async () => {
      try {
        const ecoleId = user.ecole.id;

        const [classesRes, anneesRes] = await Promise.all([
          api.get(`/classes/ecole/${ecoleId}`),
          api.get(`/annees/ecole/${ecoleId}`),
        ]);

        const classesData = Array.isArray(classesRes.data)
          ? classesRes.data
          : [];

        const anneesData = Array.isArray(anneesRes.data)
          ? anneesRes.data
          : [];

        setClasses(classesData);
        setAnnees(anneesData);

        const active = anneesData.find((a) => a.active);

        if (active) {
          setAnneeId(String(active.id));
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données.");
      }
    };

    charger();
  }, [user]);

  const chargerNotes = async () => {
    if (!classeId || !anneeId || !mois) {
      setEleves([]);
      setMatieres([]);
      setNotes({});
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.get(
        `/notes-primaire/classe/${classeId}`,
        {
          params: {
            anneeId: Number(anneeId),
            mois,
          },
        }
      );

      const data = response.data || {};

      setEleves(Array.isArray(data.eleves) ? data.eleves : []);
      setMatieres(Array.isArray(data.matieres) ? data.matieres : []);

      const notesMap = {};

      (data.notes || []).forEach((note) => {
        const key =
          `${note.inscriptionId}-${note.coefficientMatiereId}`;

        notesMap[key] = note.note ?? "";
      });

      setNotes(notesMap);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        "Impossible de charger les notes."
      );

      setEleves([]);
      setMatieres([]);
      setNotes({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerNotes();
  }, [classeId, anneeId, mois]);

  // Si la classe sélectionnée n'est plus dans la liste primaire
  // (ex: liste rechargée), on réinitialise la sélection.
  useEffect(() => {
    if (classeId && !classesPrimaire.some((c) => String(c.id) === String(classeId))) {
      setClasseId("");
    }
  }, [classesPrimaire, classeId]);

  const modifierNote = (
    inscriptionId,
    coefficientMatiereId,
    value
  ) => {
    if (value !== "") {
      const number = Number(value);

      if (Number.isNaN(number)) return;
      if (number < NOTE_MIN || number > NOTE_MAX) return;
    }

    const key =
      `${inscriptionId}-${coefficientMatiereId}`;

    setNotes((prev) => ({
      ...prev,
      [key]: value,
    }));

    setSuccess("");
  };

  const nombreNotes = useMemo(() => {
    return Object.values(notes).filter(
      (value) =>
        value !== "" &&
        value !== null &&
        value !== undefined
    ).length;
  }, [notes]);

  const enregistrer = async () => {
    if (!classeId || !anneeId || !mois) {
      setError(
        "Sélectionnez la classe, l'année scolaire et le mois."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        classeId: Number(classeId),
        anneeScolaireId: Number(anneeId),
        mois,
        notes: [],
      };

      eleves.forEach((eleve) => {
        matieres.forEach((matiere) => {
          const key =
            `${eleve.inscriptionId}-${matiere.coefficientMatiereId}`;

          const value = notes[key];

          payload.notes.push({
            inscriptionId: Number(eleve.inscriptionId),
            coefficientMatiereId: Number(
              matiere.coefficientMatiereId
            ),
            note:
              value === "" ||
              value === null ||
              value === undefined
                ? null
                : Number(value),
          });
        });
      });

      await api.post("/notes-primaire", payload);

      setSuccess(
        `✓ ${nombreNotes} note(s) enregistrée(s) pour ${MOIS_LABELS[mois]}.`
      );

      await chargerNotes();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Erreur lors de l'enregistrement des notes."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full space-y-5 bg-[#ECEAE2] p-3 sm:p-5 lg:p-6">

      <section className="overflow-hidden rounded-[22px] bg-[#101B33] shadow-lg">
        <div className="px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#E4B655]">
                <BookOpen size={14} />
                Cycle primaire · Notes sur 10
              </div>

              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Saisie des notes primaire
              </h1>

              <p className="mt-2 text-sm text-slate-300">
                Saisissez les notes mensuelles de chaque élève et
                de chaque matière (notation sur 10).
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Users size={14} />
                Notes saisies
              </div>

              <div className="mt-1 font-mono text-2xl font-bold text-[#E4B655]">
                {nombreNotes}
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <section className="rounded-[20px] border border-[#DEDCD0] bg-white shadow-sm">
        <div className="border-b border-[#DEDCD0] bg-[#FCFBF8] px-5 py-4">
          <h2 className="font-bold text-[#101B33]">
            Sélection pédagogique
          </h2>

          <p className="mt-1 text-xs text-[#7A8190]">
            Sélectionnez la classe (cycle primaire uniquement), l'année scolaire et le mois.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
              Classe (primaire)
            </span>

            <select
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              className="w-full rounded-xl border border-[#DEDCD0] bg-[#F8F7F2] px-3.5 py-3 text-sm font-semibold outline-none focus:border-[#C89B3C]"
            >
              <option value="">
                Sélectionner une classe
              </option>

              {classesPrimaire.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nomComplet}
                </option>
              ))}
            </select>

            {classes.length > 0 && classesPrimaire.length === 0 && (
              <p className="mt-1.5 text-xs text-red-600">
                Aucune classe de cycle primaire trouvée pour cette école.
              </p>
            )}
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
              Année scolaire
            </span>

            <select
              value={anneeId}
              onChange={(e) => setAnneeId(e.target.value)}
              className="w-full rounded-xl border border-[#DEDCD0] bg-[#F8F7F2] px-3.5 py-3 text-sm font-semibold outline-none focus:border-[#C89B3C]"
            >
              <option value="">
                Sélectionner une année
              </option>

              {annees.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.nom}
                  {annee.active ? " — Active" : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
              Mois
            </span>

            <select
              value={mois}
              onChange={(e) => setMois(e.target.value)}
              className="w-full rounded-xl border border-[#DEDCD0] bg-[#F8F7F2] px-3.5 py-3 text-sm font-semibold outline-none focus:border-[#C89B3C]"
            >
              <option value="">
                Sélectionner un mois
              </option>

              {MOIS.map((item) => (
                <option key={item} value={item}>
                  {MOIS_LABELS[item]}
                </option>
              ))}
            </select>
          </label>

        </div>
      </section>

      {classeId && anneeId && mois && (
        <section className="overflow-hidden rounded-[20px] border border-[#DEDCD0] bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-[#DEDCD0] bg-[#FCFBF8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-bold text-[#101B33]">
                Notes — {MOIS_LABELS[mois]}
                <span className="ml-2 rounded-full bg-[#101B33]/5 px-2 py-0.5 text-[11px] font-bold text-[#101B33]">
                  Notes sur 10
                </span>
              </h2>

              <p className="mt-1 text-xs text-[#7A8190]">
                {eleves.length} élève(s) · {matieres.length} matière(s)
              </p>
            </div>

            <button
              type="button"
              onClick={enregistrer}
              disabled={saving || loading || !eleves.length}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#101B33] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#182746] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />

              {saving
                ? "Enregistrement..."
                : "Enregistrer les notes"}
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#C89B3C] border-t-transparent" />
              <p className="text-sm text-[#7A8190]">
                Chargement des notes...
              </p>
            </div>
          ) : eleves.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Users
                className="mx-auto mb-3 text-[#9BA2B1]"
                size={30}
              />

              <p className="font-semibold text-[#5B6478]">
                Aucun élève validé dans cette classe.
              </p>
            </div>
          ) : matieres.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <BookOpen
                className="mx-auto mb-3 text-[#9BA2B1]"
                size={30}
              />

              <p className="font-semibold text-[#5B6478]">
                Aucun programme pédagogique trouvé pour cette classe.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="bg-[#F8F7F2]">
                    <th className="sticky left-0 z-10 min-w-[230px] border-b border-[#DEDCD0] bg-[#F8F7F2] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                      Élève
                    </th>

                    {matieres.map((matiere) => (
                      <th
                        key={matiere.coefficientMatiereId}
                        className="min-w-[120px] border-b border-[#DEDCD0] px-3 py-3 text-center"
                      >
                        <div className="text-xs font-bold text-[#101B33]">
                          {matiere.matiereNom}
                        </div>

                        <div className="mt-1 text-[10px] text-[#8A91A2]">
                          /{NOTE_MAX}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {eleves.map((eleve, index) => (
                    <tr
                      key={eleve.inscriptionId}
                      className="border-b border-[#F0EEE7] hover:bg-[#FCFBF8]"
                    >
                      <td className="sticky left-0 z-10 border-r border-[#F0EEE7] bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#101B33] text-xs font-bold text-[#E4B655]">
                            {String(index + 1).padStart(2, "0")}
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold text-[#101B33]">
                              {eleve.nom} {eleve.prenom}
                            </div>

                            {eleve.matricule && (
                              <div className="font-mono text-[10px] text-[#8A91A2]">
                                {eleve.matricule}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {matieres.map((matiere) => {
                        const key =
                          `${eleve.inscriptionId}-${matiere.coefficientMatiereId}`;

                        const value = notes[key] ?? "";

                        return (
                          <td
                            key={matiere.coefficientMatiereId}
                            className="px-3 py-2 text-center"
                          >
                            <input
                              type="number"
                              min={NOTE_MIN}
                              max={NOTE_MAX}
                              step="0.01"
                              inputMode="decimal"
                              value={value}
                              onChange={(e) =>
                                modifierNote(
                                  eleve.inscriptionId,
                                  matiere.coefficientMatiereId,
                                  e.target.value
                                )
                              }
                              className="w-24 rounded-xl border border-[#DEDCD0] bg-[#F8F7F2] px-2 py-2.5 text-center font-mono text-sm font-bold text-[#101B33] outline-none focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/10"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>
      )}
    </div>
  );
}