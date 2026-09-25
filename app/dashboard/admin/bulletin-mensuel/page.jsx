"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";
import {
  BookOpen,
  Calendar,
  Loader2,
  CheckCircle2,
  Download,
  FileText,
  Save,
  Search,
  Users,
  XCircle,
} from "lucide-react";

/* =========================================================
   PALETTE
========================================================= */

const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const CORAL = "#D2593F";
const CORAL_SOFT = "#F7E2DB";

/* =========================================================
   MOIS
========================================================= */

const MOIS = [
  { value: "SEPTEMBRE", label: "Septembre" },
  { value: "OCTOBRE", label: "Octobre" },
  { value: "NOVEMBRE", label: "Novembre" },
  { value: "DECEMBRE", label: "Décembre" },
  { value: "JANVIER", label: "Janvier" },
  { value: "FEVRIER", label: "Février" },
  { value: "MARS", label: "Mars" },
  { value: "AVRIL", label: "Avril" },
  { value: "MAI", label: "Mai" },
  { value: "JUIN", label: "Juin" },
];

/* =========================================================
   AVATAR
========================================================= */

function Avatar({ nom, prenom, sexe }) {
  const initials =
    `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={
        sexe === "F"
          ? {
              background: "#E7E3F8",
              color: "#6E5DC6",
            }
          : {
              background: TEAL_SOFT,
              color: TEAL,
            }
      }
    >
      {initials}
    </div>
  );
}

/* =========================================================
   TOAST
========================================================= */

function Toast({ toast, onClose }) {
  if (!toast) return null;

  const success = toast.type === "success";

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <div
        className="flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl"
        style={{
          background: success ? TEAL : CORAL,
        }}
      >
        {success ? (
          <CheckCircle2 size={18} />
        ) : (
          <XCircle size={18} />
        )}

        <span>{toast.message}</span>

        <button
          onClick={onClose}
          className="ml-2 opacity-70 transition hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function BulletinsMensuelsPage() {
  const { user } = useAuth();

  const ecoleId = user?.ecole?.id;

  const [annee, setAnnee] = useState(null);
  const [classes, setClasses] = useState([]);
  const [eleves, setEleves] = useState([]);

  const [classeId, setClasseId] = useState("");
  const [mois, setMois] = useState("");

  const [infos, setInfos] = useState({});

  const [loadingAnnee, setLoadingAnnee] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingEleves, setLoadingEleves] = useState(false);
  const [loadingInfos, setLoadingInfos] = useState(false);

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [search, setSearch] = useState("");

  const [toast, setToast] = useState(null);

  /* =========================================================
     TOAST
  ========================================================= */

  const showToast = useCallback((type, message) => {
    setToast({ type, message });

    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  /* =========================================================
     ANNÉE SCOLAIRE ACTIVE
  ========================================================= */

  const chargerAnneeActive = useCallback(async () => {
    if (!ecoleId) return;

    setLoadingAnnee(true);

    try {
      const response = await api.get(`/annees/active/${ecoleId}`);

      setAnnee(response.data);
    } catch (error) {
      console.error(
        "Erreur chargement année scolaire active :",
        error
      );

      setAnnee(null);

      showToast(
        "error",
        "Impossible de charger l'année scolaire active."
      );
    } finally {
      setLoadingAnnee(false);
    }
  }, [ecoleId, showToast]);

  useEffect(() => {
    chargerAnneeActive();
  }, [chargerAnneeActive]);

  /* =========================================================
     CLASSES
  ========================================================= */

  const chargerClasses = useCallback(async () => {
    if (!ecoleId) return;

    setLoadingClasses(true);

    try {
      const response = await api.get(
        `/classes/ecole/${ecoleId}`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setClasses(data);
    } catch (error) {
      console.error("Erreur chargement classes :", error);

      setClasses([]);

      showToast(
        "error",
        "Impossible de charger les classes."
      );
    } finally {
      setLoadingClasses(false);
    }
  }, [ecoleId, showToast]);

  useEffect(() => {
    chargerClasses();
  }, [chargerClasses]);

  /* =========================================================
     ÉLÈVES ACTIFS
  ========================================================= */

  const chargerEleves = useCallback(async () => {
    if (!ecoleId) return;

    setLoadingEleves(true);

    try {
      const response = await api.get(
        `/inscriptions/ecole/${ecoleId}/active`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setEleves(data);
    } catch (error) {
      console.error("Erreur chargement élèves :", error);

      setEleves([]);

      showToast(
        "error",
        "Impossible de charger les élèves."
      );
    } finally {
      setLoadingEleves(false);
    }
  }, [ecoleId, showToast]);

  useEffect(() => {
    chargerEleves();
  }, [chargerEleves]);

  /* =========================================================
     CLASSES DISPONIBLES
  ========================================================= */

  const classesDisponibles = useMemo(() => {
    const map = new Map();

    eleves.forEach((eleve) => {
      if (!eleve.classeId) return;

      if (!map.has(String(eleve.classeId))) {
        map.set(String(eleve.classeId), {
          id: eleve.classeId,
          nom:
            eleve.classeNom ||
            eleve.classe?.nomComplet ||
            `Classe ${eleve.classeId}`,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.nom).localeCompare(String(b.nom), "fr")
    );
  }, [eleves]);

  /* =========================================================
     ÉLÈVES DE LA CLASSE
  ========================================================= */

  const elevesClasse = useMemo(() => {
    if (!classeId) return [];

    return eleves
      .filter(
        (eleve) =>
          String(eleve.classeId) === String(classeId)
      )
      .sort((a, b) => {
        const nomA =
          `${a.nom || ""} ${a.prenom || ""}`.trim();

        const nomB =
          `${b.nom || ""} ${b.prenom || ""}`.trim();

        return nomA.localeCompare(nomB, "fr");
      });
  }, [eleves, classeId]);

  /* =========================================================
     RECHERCHE
  ========================================================= */

  const elevesFiltres = useMemo(() => {
    const valeur = search.trim().toLowerCase();

    if (!valeur) return elevesClasse;

    return elevesClasse.filter((eleve) => {
      const texte = `
        ${eleve.nom || ""}
        ${eleve.prenom || ""}
        ${eleve.matricule || ""}
      `.toLowerCase();

      return texte.includes(valeur);
    });
  }, [elevesClasse, search]);

  /* =========================================================
     CHARGER ABSENCES + OBSERVATIONS
  ========================================================= */

  const chargerInfos = useCallback(async () => {
    if (!classeId || !annee?.id || !mois) {
      setInfos({});
      return;
    }

    setLoadingInfos(true);

    try {
      const response = await api.get(
        "/bulletins-mensuels/infos",
        {
          params: {
            classeId: Number(classeId),
            anneeId: Number(annee.id),
            mois,
          },
        }
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      const map = {};

      data.forEach((item) => {
        if (!item.inscriptionId) return;

        map[String(item.inscriptionId)] = {
          absences: item.absences ?? 0,
          observationMaitre:
            item.observationMaitre ?? "",
        };
      });

      /*
       * On complète les élèves qui n'ont encore
       * aucune donnée enregistrée.
       */
      elevesClasse.forEach((eleve) => {
        const id = String(eleve.id);

        if (!map[id]) {
          map[id] = {
            absences: 0,
            observationMaitre: "",
          };
        }
      });

      setInfos(map);
    } catch (error) {
      console.error(
        "Erreur chargement infos bulletin :",
        error
      );

      setInfos({});

      showToast(
        "error",
        "Impossible de charger les absences et observations."
      );
    } finally {
      setLoadingInfos(false);
    }
  }, [
    classeId,
    annee?.id,
    mois,
    elevesClasse,
    showToast,
  ]);

  useEffect(() => {
    chargerInfos();
  }, [chargerInfos]);

  /* =========================================================
     MODIFIER UNE INFO
  ========================================================= */

  const modifierInfo = (
    inscriptionId,
    champ,
    valeur
  ) => {
    const id = String(inscriptionId);

    if (
      champ === "absences" &&
      valeur !== "" &&
      Number(valeur) < 0
    ) {
      return;
    }

    if (
      champ === "observationMaitre" &&
      valeur.length > 500
    ) {
      return;
    }

    setInfos((precedent) => ({
      ...precedent,
      [id]: {
        ...(precedent[id] || {
          absences: 0,
          observationMaitre: "",
        }),
        [champ]: valeur,
      },
    }));
  };

  /* =========================================================
     ENREGISTRER
  ========================================================= */

  const enregistrer = async () => {
    if (!classeId) {
      showToast(
        "error",
        "Veuillez sélectionner une classe."
      );
      return;
    }

    if (!annee?.id) {
      showToast(
        "error",
        "Aucune année scolaire active."
      );
      return;
    }

    if (!mois) {
      showToast(
        "error",
        "Veuillez sélectionner un mois."
      );
      return;
    }

    const payload = elevesClasse.map((eleve) => {
      const info =
        infos[String(eleve.id)] || {
          absences: 0,
          observationMaitre: "",
        };

      return {
        inscriptionId: Number(eleve.id),
        absences:
          info.absences === ""
            ? 0
            : Number(info.absences),
        observationMaitre:
          info.observationMaitre || "",
      };
    });

    setSaving(true);

    try {
      await api.put(
        "/bulletins-mensuels/infos",
        {
          mois,
          infos: payload,
        }
      );

      showToast(
        "success",
        "Absences et observations enregistrées avec succès."
      );

      await chargerInfos();
    } catch (error) {
      console.error(
        "Erreur enregistrement bulletin mensuel :",
        error
      );

      showToast(
        "error",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Erreur lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     GÉNÉRER PDF CLASSE
  ========================================================= */

  const genererBulletins = async () => {
    if (!classeId) {
      showToast(
        "error",
        "Veuillez sélectionner une classe."
      );
      return;
    }

    if (!annee?.id) {
      showToast(
        "error",
        "Aucune année scolaire active."
      );
      return;
    }

    if (!mois) {
      showToast(
        "error",
        "Veuillez sélectionner un mois."
      );
      return;
    }

    setGenerating(true);

    try {
      /*
       * Endpoint prévu pour BulletinPrimairePdfService.
       *
       * Si ton Controller utilise un autre chemin,
       * il suffira de modifier cette URL.
       */
      const response = await api.get(
        `/bulletins-mensuels/${classeId}/${annee.id}/pdf`,
        {
          params: {
            mois,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        `bulletins-mensuels-${mois.toLowerCase()}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      showToast(
        "success",
        "Bulletins générés avec succès."
      );
    } catch (error) {
      console.error(
        "Erreur génération bulletins :",
        error
      );

      if (
        error?.response?.data instanceof Blob
      ) {
        try {
          const texte =
            await error.response.data.text();

          const json = JSON.parse(texte);

          showToast(
            "error",
            json?.message ||
              json?.error ||
              "Impossible de générer les bulletins."
          );
        } catch {
          showToast(
            "error",
            "Impossible de générer les bulletins."
          );
        }
      } else {
        showToast(
          "error",
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Impossible de générer les bulletins."
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  /* =========================================================
     NOM CLASSE
  ========================================================= */

  const classeSelectionnee = useMemo(() => {
    return classesDisponibles.find(
      (classe) =>
        String(classe.id) === String(classeId)
    );
  }, [classesDisponibles, classeId]);

  /* =========================================================
     AFFICHAGE
  ========================================================= */

  return (
    <div className="space-y-5">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`,
              color: INK,
            }}
          >
            <BookOpen size={21} />
          </span>

          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Bulletins mensuels
            </h1>

            <p className="text-sm text-slate-500">
              Saisie des absences et observations mensuelles
            </p>
          </div>
        </div>

        {/* ANNÉE ACTIVE */}

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <Calendar
            size={17}
            style={{ color: TEAL }}
          />

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Année scolaire
            </p>

            <p className="text-sm font-semibold text-slate-700">
              {loadingAnnee
                ? "Chargement..."
                : annee?.libelle ||
                  annee?.nom ||
                  "Aucune année active"}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTRES
      ====================================================== */}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* CLASSE */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Classe
            </label>

            <select
              value={classeId}
              onChange={(e) => {
                setClasseId(e.target.value);
                setSearch("");
              }}
              disabled={loadingClasses || loadingEleves}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {loadingClasses
                  ? "Chargement..."
                  : "Choisir une classe"}
              </option>

              {classesDisponibles.map(
                (classe) => (
                  <option
                    key={classe.id}
                    value={classe.id}
                  >
                    {classe.nom}
                  </option>
                )
              )}
            </select>
          </div>

          {/* MOIS */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Mois
            </label>

            <select
              value={mois}
              onChange={(e) =>
                setMois(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">
                Choisir un mois
              </option>

              {MOIS.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* RECHERCHE */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Rechercher un élève
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Nom, prénom, matricule..."
                disabled={!classeId}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          INFOS CLASSE
      ====================================================== */}

      {classeId && mois && (
        <div
          className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: `${TEAL}33`,
            background: `${TEAL}08`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: TEAL_SOFT,
                color: TEAL,
              }}
            >
              <Users size={19} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                {classeSelectionnee?.nom ||
                  "Classe sélectionnée"}
              </p>

              <p className="text-xs text-slate-500">
                {elevesClasse.length} élève
                {elevesClasse.length > 1
                  ? "s"
                  : ""}{" "}
                ·{" "}
                {
                  MOIS.find(
                    (item) =>
                      item.value === mois
                  )?.label
                }
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={enregistrer}
              disabled={
                saving ||
                loadingInfos ||
                !elevesClasse.length
              }
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: TEAL,
              }}
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Enregistrer
                </>
              )}
            </button>

            <button
              onClick={genererBulletins}
              disabled={
                generating ||
                loadingInfos ||
                !elevesClasse.length
              }
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${INK}, #182746)`,
              }}
            >
              {generating ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Génération...
                </>
              ) : (
                <>
                  <Download size={17} />
                  Générer les bulletins
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          TABLEAU
      ====================================================== */}

      {!classeId || !mois ? (
        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-16 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: `${GOLD}1A`,
                color: GOLD,
              }}
            >
              <FileText size={25} />
            </div>

            <p className="text-sm font-semibold text-slate-700">
              Préparez le bulletin mensuel
            </p>

            <p className="mt-1 max-w-md text-xs text-slate-400">
              Sélectionnez une classe et un mois
              pour afficher les élèves et saisir
              leurs absences et observations.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead>
                <tr
                  className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"
                  style={{
                    background: "#F8F7F2",
                  }}
                >
                  <th className="px-4 py-3 font-medium">
                    Élève
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Matricule
                  </th>

                  <th className="w-32 px-4 py-3 text-center font-medium">
                    Absences
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Observation du maître
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {/* CHARGEMENT */}

                {(loadingEleves ||
                  loadingInfos) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-14 text-center"
                    >
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                        <Loader2
                          size={18}
                          className="animate-spin"
                          style={{
                            color: TEAL,
                          }}
                        />

                        Chargement...
                      </div>
                    </td>
                  </tr>
                )}

                {/* AUCUN ÉLÈVE */}

                {!loadingEleves &&
                  !loadingInfos &&
                  elevesFiltres.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-14 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                            style={{
                              background: `${INK}0D`,
                              color: INK,
                            }}
                          >
                            <Users size={22} />
                          </div>

                          <p className="text-sm font-medium text-slate-600">
                            Aucun élève trouvé
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Vérifiez la classe ou la
                            recherche.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                {/* ÉLÈVES */}

                {!loadingEleves &&
                  !loadingInfos &&
                  elevesFiltres.map(
                    (eleve) => {
                      const id = String(
                        eleve.id
                      );

                      const info =
                        infos[id] || {
                          absences: 0,
                          observationMaitre:
                            "",
                        };

                      return (
                        <tr
                          key={eleve.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          {/* ÉLÈVE */}

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar
                                nom={eleve.nom}
                                prenom={
                                  eleve.prenom
                                }
                                sexe={
                                  eleve.sexe
                                }

                              />

                              <div className="min-w-0">
                                <p className="font-medium text-slate-800">
                                  {
                                    eleve.prenom
                                  }{" "}
                                  {
                                    eleve.nom
                                  }
                                </p>

                                <p className="text-xs text-slate-400">
                                  {eleve.classeNom ||
                                    classeSelectionnee?.nom ||
                                    "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* MATRICULE */}

                          <td className="px-4 py-3 text-slate-500">
                            {eleve.matricule ||
                              "—"}
                          </td>

                          {/* ABSENCES */}

                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={
                                info.absences
                              }
                              onChange={(e) =>
                                modifierInfo(
                                  eleve.id,
                                  "absences",
                                  e.target.value
                                )
                              }
                              className="mx-auto block w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                            />
                          </td>

                          {/* OBSERVATION */}

                          <td className="px-4 py-3">
                            <input
                              type="text"
                              maxLength={500}
                              value={
                                info.observationMaitre
                              }
                              onChange={(e) =>
                                modifierInfo(
                                  eleve.id,
                                  "observationMaitre",
                                  e.target.value
                                )
                              }
                              placeholder="Observation du mois..."
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                            />

                            <div className="mt-1 text-right text-[10px] text-slate-400">
                              {
                                (
                                  info.observationMaitre ||
                                  ""
                                ).length
                              }{" "}
                              / 500
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================
          RAPPEL
      ====================================================== */}

      {classeId &&
        mois &&
        elevesClasse.length > 0 && (
          <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-400">
            <span className="font-medium text-slate-600">
              Important :
            </span>{" "}
            les données sont enregistrées pour
            l'inscription de l'élève dans l'année
            scolaire sélectionnée.
          </div>
        )}

      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}