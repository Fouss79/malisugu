"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";
import {
  Save,
  AlertCircle,
  Users,
  CheckCircle,
  Clock,
  GraduationCap,
  ShieldCheck,
  Search,
} from "lucide-react";

// ============================================================
// CONFIGURATION — à adapter à votre contrôleur Spring
// ============================================================

// GET  {API_CONDUITE}?classeId=&anneeScolaireId=&periode=  -> List<ConduiteSaisieDTO>
// POST {API_CONDUITE}  body: ConduiteEnregistrementDTO     -> EvaluationConduite
const API_CONDUITE = "/conduites"; // préfixe /api déjà dans la baseURL de lib/api

// Le service backend impose 0 <= note <= 20
const NOTE_MIN = 0;
const NOTE_MAX = 20;

const PERIODES = [
  "1ère Periode",
  "2ème Periode",
  "3ème Periode",
  "4ème Periode",
  "5ème Periode",
  "6ème Periode",
  "7ème Periode",
  "8ème Periode",
  "9ème Periode",
];

const MOIS_PRIMAIRE = [
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

// ============================================================
// STYLES COMMUNS (identiques à la page Notes)
// ============================================================

const STYLES = {
  input:
    "w-full rounded-xl border border-[#DEDCD0] bg-[#F8F7F2] px-3.5 py-3 text-sm font-medium text-[#1B2333] outline-none transition placeholder:text-[#8A91A2] hover:border-[#C8C5B8] focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/10 disabled:cursor-not-allowed disabled:opacity-60",
  card: "rounded-[20px] border border-[#DEDCD0] bg-white shadow-[0_10px_30px_rgba(16,27,51,0.05)]",
  button: {
    primary:
      "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
  },
};

// ============================================================
// HELPERS
// ============================================================

function getCycleNom(classe) {
  return (classe?.niveau?.cycle?.nom || "").toString().trim().toUpperCase();
}

const estVide = (v) => v === "" || v === null || v === undefined;

const normaliser = (v) => (estVide(v) ? "" : String(v));

function LoadingSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <span className="text-sm text-slate-500">Chargement...</span>
      </div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function ConduitePage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [classeId, setClasseId] = useState("");
  const [anneeId, setAnneeId] = useState("");
  const [periode, setPeriode] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState(null);

  // lignes : [{ inscriptionId, eleveId, nom, prenom, note, appreciation }]
  const [eleves, setEleves] = useState([]);
  // valeurs saisies et valeurs d'origine, indexées par inscriptionId
  const [saisies, setSaisies] = useState({});
  const [originales, setOriginales] = useState({});
  const [erreursLignes, setErreursLignes] = useState({});

  const [loadingEleves, setLoadingEleves] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recherche, setRecherche] = useState("");

  const afficherToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ------------------------------------------------------------
  // Chargement initial : classes + années
  // ------------------------------------------------------------

  useEffect(() => {
    if (!user?.ecole?.id) return;

    const charger = async () => {
      try {
        const ecoleId = user.ecole.id;
        const [classesRes, anneesRes] = await Promise.all([
          api.get(`/classes/ecole/${ecoleId}`),
          api.get(`/annees/ecole/${ecoleId}`),
        ]);

        const classesData = Array.isArray(classesRes.data) ? classesRes.data : [];
        const anneesData = Array.isArray(anneesRes.data) ? anneesRes.data : [];

        setClasses(classesData);
        setAnnees(anneesData);

        const active = anneesData.find((a) => a.active);
        if (active) setAnneeId(String(active.id));
      } catch (error) {
        console.error("Erreur chargement initial :", error);
        setErreur("Impossible de charger les données initiales.");
      } finally {
        setLoadingInitial(false);
      }
    };

    charger();
  }, [user]);

  const classeChoisie = useMemo(
    () => classes.find((c) => String(c.id) === String(classeId)),
    [classes, classeId]
  );

  const cycleNom = classeChoisie ? getCycleNom(classeChoisie) : "";
  const estPrimaire = cycleNom === "PREMIER CYCLE";

  // Primaire : la "période" envoyée au backend est le mois. Secondaire : 1ère…9ème période.
  const optionsPeriode = estPrimaire
    ? MOIS_PRIMAIRE.map((m) => ({ value: m, label: MOIS_LABELS[m] }))
    : PERIODES.map((p) => ({ value: p, label: p }));

  // Réinitialiser la période si la classe / l'année change
  useEffect(() => {
    setPeriode("");
    setErreur("");
  }, [classeId, anneeId]);

  // ------------------------------------------------------------
  // Chargement des élèves + notes de conduite
  // ------------------------------------------------------------

  const chargerConduite = useCallback(async () => {
    if (!classeId || !anneeId || !periode) {
      setEleves([]);
      setSaisies({});
      setOriginales({});
      setErreursLignes({});
      return;
    }

    setLoadingEleves(true);
    setErreur("");

    try {
      const response = await api.get(API_CONDUITE, {
        params: {
          classeId: Number(classeId),
          anneeScolaireId: Number(anneeId),
          periode,
        },
      });

      const data = Array.isArray(response.data) ? response.data : [];

      const liste = [...data].sort((a, b) =>
        `${a.nom ?? ""} ${a.prenom ?? ""}`.localeCompare(
          `${b.nom ?? ""} ${b.prenom ?? ""}`
        )
      );

      const map = {};
      liste.forEach((e) => {
        map[String(e.inscriptionId)] = {
          note: normaliser(e.note),
          appreciation: e.appreciation ?? "",
        };
      });

      setEleves(liste);
      setSaisies(map);
      setOriginales(map);
      setErreursLignes({});
    } catch (error) {
      console.error("Erreur chargement conduite :", error);
      setErreur(
        error.response?.data?.message ||
          "Impossible de charger les notes de conduite."
      );
      setEleves([]);
      setSaisies({});
      setOriginales({});
    } finally {
      setLoadingEleves(false);
    }
  }, [classeId, anneeId, periode]);

  useEffect(() => {
    chargerConduite();
  }, [chargerConduite]);

  // ------------------------------------------------------------
  // Saisie
  // ------------------------------------------------------------

  const modifierNote = (inscriptionId, valeur) => {
    if (valeur !== "") {
      const n = Number(valeur);
      if (Number.isNaN(n) || n < NOTE_MIN || n > NOTE_MAX) return;
    }
    const id = String(inscriptionId);
    setSaisies((prev) => ({ ...prev, [id]: { ...prev[id], note: valeur } }));
    setErreursLignes((prev) => ({ ...prev, [id]: undefined }));
  };

  const modifierAppreciation = (inscriptionId, valeur) => {
    if (valeur.length > 255) return;
    const id = String(inscriptionId);
    setSaisies((prev) => ({
      ...prev,
      [id]: { ...prev[id], appreciation: valeur },
    }));
  };

  const estModifiee = useCallback(
    (inscriptionId) => {
      const id = String(inscriptionId);
      const a = saisies[id];
      const o = originales[id];
      if (!a || !o) return false;
      return a.note !== o.note || (a.appreciation || "") !== (o.appreciation || "");
    },
    [saisies, originales]
  );

  const nbModifiees = useMemo(
    () => eleves.filter((e) => estModifiee(e.inscriptionId)).length,
    [eleves, estModifiee]
  );

  const nbNotesSaisies = useMemo(
    () => eleves.filter((e) => !estVide(saisies[String(e.inscriptionId)]?.note)).length,
    [eleves, saisies]
  );

  const moyenneClasse = useMemo(() => {
    const notes = eleves
      .map((e) => saisies[String(e.inscriptionId)]?.note)
      .filter((n) => !estVide(n))
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    if (notes.length === 0) return null;
    return notes.reduce((s, n) => s + n, 0) / notes.length;
  }, [eleves, saisies]);

  const getNoteColor = (note) => {
    if (estVide(note)) return "text-slate-300";
    const n = Number(note);
    if (n < 10) return "text-rose-600";
    if (n < 14) return "text-amber-600";
    return "text-emerald-600";
  };

  const elevesFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return eleves;
    return eleves.filter((e) =>
      `${e.nom ?? ""} ${e.prenom ?? ""}`.toLowerCase().includes(q)
    );
  }, [eleves, recherche]);

  // ------------------------------------------------------------
  // Enregistrement (une requête par ligne modifiée)
  // ------------------------------------------------------------

  const enregistrer = async () => {
    setErreur("");

    if (!classeId || !anneeId || !periode) {
      setErreur("Sélectionnez la classe, l'année scolaire et la période.");
      return;
    }

    const aEnvoyer = eleves.filter((e) => estModifiee(e.inscriptionId));

    if (aEnvoyer.length === 0) return;

    // Le backend exige une note pour chaque enregistrement
    const manquantes = aEnvoyer.filter((e) =>
      estVide(saisies[String(e.inscriptionId)]?.note)
    );

    if (manquantes.length > 0) {
      const erreurs = {};
      manquantes.forEach((e) => {
        erreurs[String(e.inscriptionId)] = "La note est obligatoire.";
      });
      setErreursLignes(erreurs);
      setErreur(
        `${manquantes.length} élève(s) ont une appréciation mais pas de note. Saisissez la note ou annulez la modification.`
      );
      return;
    }

    setSaving(true);

    const resultats = await Promise.allSettled(
      aEnvoyer.map((e) => {
        const s = saisies[String(e.inscriptionId)];
        return api.post(API_CONDUITE, {
          inscriptionId: Number(e.inscriptionId),
          periode,
          note: Number(s.note),
          appreciation: s.appreciation?.trim() || null,
        });
      })
    );

    const nouvellesOriginales = { ...originales };
    const nouvellesErreurs = {};
    let ok = 0;

    resultats.forEach((res, i) => {
      const id = String(aEnvoyer[i].inscriptionId);
      if (res.status === "fulfilled") {
        ok++;
        nouvellesOriginales[id] = { ...saisies[id] };
      } else {
        nouvellesErreurs[id] =
          res.reason?.response?.data?.message ||
          res.reason?.response?.data ||
          "Échec de l'enregistrement.";
      }
    });

    setOriginales(nouvellesOriginales);
    setErreursLignes(nouvellesErreurs);
    setSaving(false);

    const ko = aEnvoyer.length - ok;

    if (ko === 0) {
      afficherToast(`✓ ${ok} note(s) de conduite enregistrée(s).`);
    } else {
      setErreur(
        `${ok} note(s) enregistrée(s), ${ko} en erreur. Les lignes concernées sont signalées.`
      );
    }
  };

  // ------------------------------------------------------------

  if (loadingInitial) return <LoadingSpinner />;

  const peutAfficher = classeId && anneeId && periode;

  return (
    <div className="min-h-full space-y-5 bg-[#ECEAE2] p-3 sm:p-5 lg:p-6">
      {/* HEADER */}
      <section className="overflow-hidden rounded-[22px] bg-[#101B33] shadow-[0_14px_35px_rgba(16,27,51,0.14)]">
        <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#C89B3C]/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-[#2C8C82]/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#E4B655]">
                <ShieldCheck size={14} />
                {classeChoisie
                  ? `${estPrimaire ? "Cycle primaire" : cycleNom || "Second cycle"} · Notes sur ${NOTE_MAX}`
                  : "Vie scolaire"}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Évaluation de la conduite
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                Saisissez la note de conduite (sur {NOTE_MAX}) et l&apos;appréciation
                de chaque élève pour la période choisie.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Users size={14} />
                  Élèves
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-white">
                  {eleves.length}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle size={14} />
                  Notes saisies
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-[#E4B655]">
                  {nbNotesSaisies}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ERREUR */}
      {erreur && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#D2593F]/20 bg-[#F7E2DB] px-4 py-3.5 text-sm text-[#9D3929] shadow-sm">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span className="leading-5">{erreur}</span>
        </div>
      )}

      {/* FILTRES */}
      <section className={`${STYLES.card} overflow-hidden`}>
        <div className="border-b border-[#DEDCD0] bg-[#FCFBF8] px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7E3F8] text-[#6E5DC6]">
              <GraduationCap size={17} />
            </span>
            <h2 className="text-base font-bold text-[#101B33] sm:text-lg">
              Sélection pédagogique
            </h2>
          </div>
          <p className="mt-1 pl-10 text-xs leading-5 text-[#6B7280] sm:text-sm">
            {classeId
              ? estPrimaire
                ? "Classe primaire : sélectionnez l'année scolaire et le mois."
                : "Sélectionnez l'année scolaire et la période."
              : "Choisissez d'abord une classe."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
              Classe
            </span>
            <select
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              className={STYLES.input}
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nomComplet}
                  {getCycleNom(classe) === "PREMIER CYCLE" ? " (Primaire)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
              Année scolaire
            </span>
            <select
              value={anneeId}
              onChange={(e) => setAnneeId(e.target.value)}
              className={STYLES.input}
            >
              <option value="">Sélectionner l&apos;année</option>
              {annees.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.nom} {annee.active ? "— Active" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
              {estPrimaire ? "Mois" : "Période"}
            </span>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              disabled={!classeId || !anneeId}
              className={STYLES.input}
            >
              <option value="">
                {estPrimaire ? "Sélectionner un mois" : "Sélectionner une période"}
              </option>
              {optionsPeriode.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* TABLEAU */}
      {peutAfficher && (
        <section className={`${STYLES.card} overflow-hidden`}>
          <div className="border-b border-[#DEDCD0] bg-[#FCFBF8] px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#101B33] text-[#E4B655]">
                  <ShieldCheck size={17} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#101B33] sm:text-lg">
                    Conduite — {estPrimaire ? MOIS_LABELS[periode] : periode}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#7A8190]">
                    {classeChoisie?.nomComplet} · {eleves.length} élève
                    {eleves.length > 1 ? "s" : ""} · Barème /{NOTE_MAX}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#DCEDEA] px-3 py-1.5 text-xs font-bold text-[#236F68]">
                  {nbNotesSaisies}/{eleves.length} notes
                </span>
                <span className="rounded-full bg-[#101B33]/5 px-3 py-1.5 text-xs font-bold text-[#101B33]">
                  Moyenne :{" "}
                  {moyenneClasse !== null ? moyenneClasse.toFixed(2) : "—"}
                </span>
                {nbModifiees > 0 && (
                  <span className="rounded-full bg-[#F7E2DB] px-3 py-1.5 text-xs font-bold text-[#9D3929]">
                    {nbModifiees} modif.
                  </span>
                )}
              </div>
            </div>

            <div className="relative mt-4 max-w-sm">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A91A2]"
              />
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un élève..."
                className={`${STYLES.input} pl-10`}
              />
            </div>
          </div>

          <div className="p-3 sm:p-5">
            {loadingEleves ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#C89B3C] border-t-transparent" />
                <p className="text-sm text-[#7A8190]">Chargement des élèves...</p>
              </div>
            ) : eleves.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <Users className="mx-auto mb-3 text-[#9BA2B1]" size={30} />
                <p className="font-semibold text-[#5B6478]">
                  Aucun élève validé dans cette classe.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#DEDCD0] bg-[#F8F7F2] text-[10px] uppercase tracking-[0.12em] text-[#7A8190]">
                      <th className="rounded-l-xl px-4 py-3.5 font-bold">#</th>
                      <th className="px-4 py-3.5 font-bold">Élève</th>
                      <th className="px-4 py-3.5 text-center font-bold">
                        Note /{NOTE_MAX}
                      </th>
                      <th className="rounded-r-xl px-4 py-3.5 font-bold">
                        Appréciation
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {elevesFiltres.map((eleve) => {
                      const id = String(eleve.inscriptionId);
                      const s = saisies[id] || { note: "", appreciation: "" };
                      const modifiee = estModifiee(eleve.inscriptionId);
                      const erreurLigne = erreursLignes[id];
                      const index = eleves.findIndex(
                        (e) => e.inscriptionId === eleve.inscriptionId
                      );

                      return (
                        <tr
                          key={id}
                          className={`border-b border-[#F0EEE7] align-top transition last:border-0 ${
                            modifiee ? "bg-[#FFF7DF]" : "hover:bg-[#FCFBF8]"
                          }`}
                        >
                          <td className="px-4 py-4">
                            <span className="font-mono text-xs font-bold text-[#9BA2B1]">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#101B33] text-xs font-bold text-[#E4B655]">
                                {(eleve.nom || "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 font-semibold text-[#101B33]">
                                {eleve.nom} {eleve.prenom}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.25"
                              min={NOTE_MIN}
                              max={NOTE_MAX}
                              value={s.note}
                              onChange={(e) =>
                                modifierNote(eleve.inscriptionId, e.target.value)
                              }
                              aria-label={`Note de conduite de ${eleve.prenom} ${eleve.nom}`}
                              className={`w-24 rounded-xl border bg-white px-2.5 py-2.5 text-center font-mono text-sm font-bold outline-none transition hover:border-[#C8C5B8] focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10 ${
                                erreurLigne
                                  ? "border-[#D2593F]"
                                  : "border-[#DEDCD0]"
                              } ${getNoteColor(s.note)}`}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="text"
                              maxLength={255}
                              value={s.appreciation}
                              onChange={(e) =>
                                modifierAppreciation(
                                  eleve.inscriptionId,
                                  e.target.value
                                )
                              }
                              placeholder="Appréciation..."
                              aria-label={`Appréciation de ${eleve.prenom} ${eleve.nom}`}
                              className="w-full min-w-[260px] rounded-xl border border-[#DEDCD0] bg-white px-3 py-2.5 text-sm text-[#101B33] outline-none transition hover:border-[#C8C5B8] focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                            />
                            {erreurLigne && (
                              <p className="mt-1.5 text-xs font-medium text-[#9D3929]">
                                {String(erreurLigne)}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {elevesFiltres.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center text-sm font-medium text-[#7A8190]"
                        >
                          Aucun élève ne correspond à « {recherche} ».
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* FOOTER ENREGISTREMENT */}
            {!loadingEleves && eleves.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#DEDCD0] bg-[#F8F7F2] p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      nbModifiees > 0
                        ? "bg-[#F7E2DB] text-[#D2593F]"
                        : "bg-[#DCEDEA] text-[#2C8C82]"
                    }`}
                  >
                    {nbModifiees > 0 ? <Clock size={17} /> : <CheckCircle size={17} />}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#101B33]">
                      {nbModifiees === 0
                        ? "Aucune modification en attente"
                        : nbModifiees === 1
                          ? "1 évaluation modifiée non enregistrée"
                          : `${nbModifiees} évaluations modifiées non enregistrées`}
                    </p>
                    <p className="mt-0.5 text-xs text-[#7A8190]">
                      {nbModifiees > 0
                        ? "Enregistrez pour appliquer les changements."
                        : "Toutes les évaluations sont synchronisées."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={enregistrer}
                  disabled={saving || nbModifiees === 0 || loadingEleves}
                  className={`${STYLES.button.primary} w-full bg-[#101B33] hover:bg-[#182746] sm:w-auto`}
                >
                  <Save size={17} />
                  {saving ? "Enregistrement..." : "Enregistrer la conduite"}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-4 left-3 right-3 z-50 sm:left-auto sm:right-6 sm:max-w-md">
          <div className="flex items-start gap-3 rounded-2xl border border-[#2C8C82]/20 bg-[#101B33] px-4 py-3.5 text-sm font-medium text-white shadow-[0_16px_40px_rgba(16,27,51,0.25)]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#DCEDEA] text-[#2C8C82]">
              <CheckCircle size={15} />
            </span>
            <span className="pt-1">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}