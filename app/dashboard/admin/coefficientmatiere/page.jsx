"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { Trash2, UserPlus, X, Check, AlertCircle, ChevronUp, ChevronDown } from "lucide-react";
import api from "../../../../lib/api";

// ============================================================
// CONSTANTES
// ============================================================

const API_BASE_URL = "http://localhost:8080/api";

// ============================================================
// COMPOSANT DE TRI
// ============================================================

function SortButton({ column, currentSort, onSort, children }) {
  const isActive = currentSort.column === column;
  
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 hover:text-slate-700"
    >
      {children}
      {isActive ? (
        currentSort.direction === "asc" ? (
          <ChevronUp size={14} />
        ) : (
          <ChevronDown size={14} />
        )
      ) : (
        <ChevronUp size={14} className="opacity-30" />
      )}
    </button>
  );
}

// ============================================================
// MODAL D'AFFECTATION
// ============================================================

function ModalAffectation({ programme, onClose, onSaved }) {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  const [classes, setClasses] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [classeId, setClasseId] = useState("");
  const [enseignantId, setEnseignantId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!ecoleId) return;

    const chargerClassesCompatibles = async () => {
      try {
        const response = await api.get(
          `/classes/ecole/${ecoleId}`
        );

        const compatibles = response.data.filter((c) => {
          const matchNiveau = c.niveau?.id === programme.niveauId;
          const matchSerie = !programme.serieId || c.serie?.id === programme.serieId;
          return matchNiveau && matchSerie;
        });

        const classesTriees = [...compatibles].sort((a, b) => {
          return (a.nomComplet || "").localeCompare(b.nomComplet || "");
        });

        setClasses(classesTriees);
      } catch (error) {
        console.error("Erreur chargement classes:", error);
        setClasses([]);
      }
    };

    chargerClassesCompatibles();
  }, [ecoleId, programme]);

  useEffect(() => {
    const chargerEnseignants = async () => {
      try {
        const response = await api.get(
          `/enseignants/matiere/${programme.matiereId}`
        );

        const enseignantsTries = [...response.data].sort((a, b) => {
          const nomA = `${a.nom || ""} ${a.prenom || ""}`.trim();
          const nomB = `${b.nom || ""} ${b.prenom || ""}`.trim();
          return nomA.localeCompare(nomB);
        });

        setEnseignants(enseignantsTries);
      } catch (error) {
        console.error("Erreur chargement enseignants:", error);
        setEnseignants([]);
      }
    };

    chargerEnseignants();
  }, [programme.matiereId]);

  const submit = async (e) => {
  e.preventDefault();
  setErreur("");

  if (!classeId || !enseignantId) {
    setErreur("Choisissez une classe et un enseignant");
    return;
  }

  setSubmitting(true);

  try {
    await api.post("/affectations-enseignants", {
      enseignantId: Number(enseignantId),
      classeId: Number(classeId),
      coefficientMatiereId: programme.id
    });

    setToast("✓ Enseignant affecté avec succès");

    setTimeout(() => {
      setToast(null);
      onSaved();
    }, 800);

  } catch (error) {
    console.error("Erreur affectation:", error);

    setErreur(
      error.response?.data?.message ||
      error.response?.data ||
      "Erreur lors de l'affectation"
    );

  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Affecter un enseignant</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-700">
            {programme.matiereNom}
            {programme.sousGroupeNom && (
              <span className="ml-1.5 text-indigo-600">({programme.sousGroupeNom})</span>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {programme.niveauNom}
            {programme.serieNom ? ` — ${programme.serieNom}` : ""}
            {" — Coeff. "}{programme.coefficient}
            {programme.nombreHeuresParSemaine ? ` — ${programme.nombreHeuresParSemaine}h/semaine` : ""}
          </p>
        </div>

        {erreur && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
            <AlertCircle size={16} />
            {erreur}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <select
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            disabled={submitting}
          >
            <option value="">
              {classes.length === 0
                ? "Aucune classe compatible avec ce niveau/série"
                : "Choisir une classe"}
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomComplet}
              </option>
            ))}
          </select>

          <select
            value={enseignantId}
            onChange={(e) => setEnseignantId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            disabled={submitting}
          >
            <option value="">
              {enseignants.length === 0
                ? "Aucun enseignant qualifié pour cette matière"
                : "Choisir un enseignant"}
            </option>
            {enseignants.map((e) => (
              <option key={e.id} value={e.id}>
                {e.prenom} {e.nom}
              </option>
            ))}
          </select>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !classeId || !enseignantId}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Affectation..." : "Affecter"}
            </button>
          </div>
        </form>

        {toast && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <Check size={14} />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function ProgrammeForm() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  // ============================================================
  // ÉTATS
  // ============================================================

  const [niveaux, setNiveaux] = useState([]);
  const [series, setSeries] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [programme, setProgramme] = useState([]);

  const [form, setForm] = useState({
    matiereId: "",
    niveauId: "",
    serieId: "",
    classeId: "",
    sousGroupeId: "",
    anneeScolaireId: "",
    coefficient: "",
    nombreHeuresParSemaine: ""
  });

  const [classesCompatibles, setClassesCompatibles] = useState([]);
  const [sousGroupesDisponibles, setSousGroupesDisponibles] = useState([]);

  const [erreur, setErreur] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [programmeSelectionne, setProgrammeSelectionne] = useState(null);
  const [loading, setLoading] = useState(true);

  // ÉTAT POUR LE TRI
  const [sortConfig, setSortConfig] = useState({
    column: "matiereNom",
    direction: "asc"
  });

  // ============================================================
  // CHARGEMENT DES DONNÉES RÉFÉRENTIELLES
  // ============================================================

  useEffect(() => {
    if (!ecoleId) return;

    const chargerDonnees = async () => {
      setLoading(true);

      try {
        const [niveauxRes, seriesRes, matieresRes, anneesRes] = await Promise.all([
          api.get(`/niveaux/ecole/${ecoleId}`),
          api.get(`/series/ecole/${ecoleId}`),
          api.get(`/matieres/ecole/${ecoleId}`),
          api.get(`/annees/ecole/${ecoleId}`)
        ]);

        setNiveaux([...niveauxRes.data].sort((a, b) => 
          (a.nom || "").localeCompare(b.nom || "")
        ));

        setSeries([...seriesRes.data].sort((a, b) => 
          (a.nom || "").localeCompare(b.nom || "")
        ));

        setMatieres([...matieresRes.data].sort((a, b) => 
          (a.nom || "").localeCompare(b.nom || "")
        ));

        const anneesTriees = [...anneesRes.data].sort((a, b) => {
          const nomA = a.nom || a.libelle || "";
          const nomB = b.nom || b.libelle || "";
          return nomB.localeCompare(nomA);
        });
        setAnnees(anneesTriees);

        const active = anneesRes.data.find((a) => a.active);
        if (active) {
          setForm((prev) => ({ ...prev, anneeScolaireId: active.id.toString() }));
        }
      } catch (error) {
        console.error("Erreur chargement données:", error);
      } finally {
        setLoading(false);
      }
    };

    chargerDonnees();
  }, [ecoleId]);

  // ============================================================
  // CHARGEMENT DES CLASSES PAR NIVEAU
  // ============================================================

  useEffect(() => {
    if (!form.niveauId || !ecoleId) {
      setClassesCompatibles([]);
      setForm(prev => ({ ...prev, classeId: "", sousGroupeId: "" }));
      return;
    }

    const chargerClasses = async () => {
      try {
        const response = await api.get(
          `/classes/ecole/${ecoleId}/niveau/${form.niveauId}`
        );
        setClassesCompatibles(response.data || []);
      } catch (error) {
        console.error("Erreur lors du chargement des classes:", error);
        setClassesCompatibles([]);
      }
    };

    chargerClasses();
  }, [form.niveauId, ecoleId]);

  // ============================================================
  // CHARGEMENT DES SOUS-GROUPES PAR CLASSE
  // ============================================================

  useEffect(() => {
    if (!form.classeId || !form.anneeScolaireId) {
      setSousGroupesDisponibles([]);
      return;
    }

    const chargerSousGroupes = async () => {
      try {
        const response = await api.get(
          `/sous-groupes/classe/${form.classeId}/annee/${form.anneeScolaireId}`
        );
        setSousGroupesDisponibles(response.data || []);
      } catch (error) {
        console.error("Erreur lors du chargement des sous-groupes:", error);
        setSousGroupesDisponibles([]);
      }
    };

    chargerSousGroupes();
  }, [form.classeId, form.anneeScolaireId]);

  // ============================================================
  // CHARGEMENT DU PROGRAMME
  // ============================================================

  const loadProgramme = async () => {
    if (!ecoleId || !form.anneeScolaireId) return;

    try {
      const response = await api.get(
        `/coefficients/ecole/${ecoleId}/annee/${form.anneeScolaireId}`
      );

      setProgramme(response.data);
    } catch (error) {
      console.error("Erreur chargement programme:", error);
      setProgramme([]);
    }
  };

  useEffect(() => {
    loadProgramme();
  }, [ecoleId, form.anneeScolaireId]);

  // ============================================================
  // FONCTION DE TRI
  // ============================================================

  const handleSort = (column) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  // ============================================================
  // PROGRAMME TRIÉ
  // ============================================================

  const programmeTrie = useMemo(() => {
    if (!programme.length) return [];

    const sorted = [...programme];

    sorted.sort((a, b) => {
      let valueA, valueB;

      switch (sortConfig.column) {
        case "matiereNom":
          valueA = a.matiereNom || "";
          valueB = b.matiereNom || "";
          break;
        case "niveauNom":
          valueA = a.niveauNom || "";
          valueB = b.niveauNom || "";
          break;
        case "serieNom":
          valueA = a.serieNom || "";
          valueB = b.serieNom || "";
          break;
        case "coefficient":
          valueA = a.coefficient || 0;
          valueB = b.coefficient || 0;
          break;
        case "heures":
          valueA = a.nombreHeuresParSemaine || 0;
          valueB = b.nombreHeuresParSemaine || 0;
          break;
        case "enseignants":
          valueA = a.enseignantsAffectes?.[0] || "";
          valueB = b.enseignantsAffectes?.[0] || "";
          break;
        default:
          return 0;
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      const comparison = String(valueA).localeCompare(String(valueB));
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [programme, sortConfig]);

  // ============================================================
  // GESTIONNAIRES
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErreur("");
  };

  const handleNiveauChange = (e) => {
    const { value } = e.target;
    setForm(prev => ({
      ...prev,
      niveauId: value,
      classeId: "",
      sousGroupeId: ""
    }));
    setErreur("");
  };

  const handleClasseChange = (e) => {
    const { value } = e.target;
    setForm(prev => ({
      ...prev,
      classeId: value,
      sousGroupeId: ""
    }));
    setErreur("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setErreur("");

    if (!form.matiereId || !form.niveauId || !form.anneeScolaireId || !form.coefficient) {
      setErreur("Matière, niveau, année et coefficient sont obligatoires");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        matiereId: Number(form.matiereId),
        niveauId: Number(form.niveauId),
        serieId: form.serieId ? Number(form.serieId) : null,
        classeId: form.classeId ? Number(form.classeId) : null,
        sousGroupeId: form.sousGroupeId ? Number(form.sousGroupeId) : null,
        anneeScolaireId: Number(form.anneeScolaireId),
        coefficient: Number(form.coefficient),
        nombreHeuresParSemaine: form.nombreHeuresParSemaine ? Number(form.nombreHeuresParSemaine) : null,
        ecoleId: Number(ecoleId)
      };

      await api.post(`/coefficients`, payload);

      setForm((prev) => ({
        ...prev,
        matiereId: "",
        serieId: "",
        classeId: "",
        sousGroupeId: "",
        coefficient: "",
        nombreHeuresParSemaine: ""
      }));

      await loadProgramme();
    } catch (error) {
      setErreur(error.response?.data || "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const supprimer = async (id) => {
    if (!confirm("Retirer cette matière du programme ?")) return;

    try {
      await api.delete(`/coefficients/${id}`);
      await loadProgramme();
    } catch (error) {
      console.error("Erreur suppression:", error);
      setErreur("Erreur lors de la suppression");
    }
  };

  // ============================================================
  // RENDU
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="text-sm text-slate-500">Chargement des données...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ===================================================
          FORMULAIRE DE CRÉATION (VERSION COMPACTE)
      =================================================== */}

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/40">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Ajouter au programme</h2>
          <p className="text-xs text-slate-400">Défini par niveau, classe et sous-groupe</p>
        </div>

        {erreur && (
          <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
            {erreur}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">

          {/* Ligne 1 : Année + Niveau */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              name="anneeScolaireId"
              value={form.anneeScolaireId}
              onChange={handleChange}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">Année scolaire</option>
              {annees.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.nom}
                </option>
              ))}
            </select>

            <select
              name="niveauId"
              value={form.niveauId}
              onChange={handleNiveauChange}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">Niveau</option>
              {niveaux.map((niveau) => (
                <option key={niveau.id} value={niveau.id}>
                  {niveau.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Ligne 2 : Classe + Sous-groupe */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              name="classeId"
              value={form.classeId}
              onChange={handleClasseChange}
              disabled={!form.niveauId}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Toute la classe</option>
              {classesCompatibles.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nomComplet}
                </option>
              ))}
            </select>

            <select
              name="sousGroupeId"
              value={form.sousGroupeId}
              onChange={handleChange}
              disabled={!form.classeId}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Toute la classe</option>
              {sousGroupesDisponibles.map((sousGroupe) => (
                <option key={sousGroupe.id} value={sousGroupe.id}>
                  {sousGroupe.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Ligne 3 : Série + Matière */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              name="serieId"
              value={form.serieId}
              onChange={handleChange}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">Toutes les séries</option>
              {series.map((serie) => (
                <option key={serie.id} value={serie.id}>
                  {serie.nom}
                </option>
              ))}
            </select>

            <select
              name="matiereId"
              value={form.matiereId}
              onChange={handleChange}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">Matière</option>
              {matieres.map((matiere) => (
                <option key={matiere.id} value={matiere.id}>
                  {matiere.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Ligne 4 : Coefficient + Heures + Bouton */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input
              type="number"
              name="coefficient"
              placeholder="Coeff."
              value={form.coefficient}
              onChange={handleChange}
              min="1"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            <input
              type="number"
              name="nombreHeuresParSemaine"
              placeholder="Heures/sem."
              value={form.nombreHeuresParSemaine}
              onChange={handleChange}
              min="1"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="col-span-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 sm:col-span-2"
            >
              {submitting ? "Enregistrement..." : "Ajouter au programme"}
            </button>
          </div>

        </form>
      </div>

      {/* ===================================================
          TABLEAU DU PROGRAMME AVEC TRI
      =================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Programme ({programme.length} matière{programme.length > 1 ? "s" : ""})
          </h2>
          <span className="text-xs text-slate-400">
            Cliquez sur les en-têtes pour trier
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">
                  <SortButton
                    column="matiereNom"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Matière
                  </SortButton>
                </th>
                <th className="px-4 py-3 font-medium">
                  <SortButton
                    column="niveauNom"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Niveau
                  </SortButton>
                </th>
                <th className="px-4 py-3 font-medium">
                  <SortButton
                    column="serieNom"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Série
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  <SortButton
                    column="coefficient"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Coeff.
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  <SortButton
                    column="heures"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Heures/sem.
                  </SortButton>
                </th>
                <th className="px-4 py-3 font-medium">
                  <SortButton
                    column="enseignants"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Enseignant(s)
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {programmeTrie.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    Aucune matière définie pour cette année.
                  </td>
                </tr>
              )}

              {programmeTrie.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {p.matiereNom}
                    {p.sousGroupeNom && (
                      <span className="ml-1.5 text-xs font-normal text-indigo-500">
                        ({p.sousGroupeNom})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.niveauNom}</td>
                  <td className="px-4 py-3 text-slate-500">{p.serieNom || "Toutes"}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">
                    {p.coefficient}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {p.nombreHeuresParSemaine || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.enseignantsAffectes && p.enseignantsAffectes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.enseignantsAffectes.map((nom, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
                          >
                            {nom}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Non affecté</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setProgrammeSelectionne(p)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
                      >
                        <UserPlus size={14} />
                        Affecter
                      </button>
                      <button
                        type="button"
                        onClick={() => supprimer(p.id)}
                        className="rounded-md bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================
          MODAL D'AFFECTATION
      =================================================== */}

      {programmeSelectionne && (
        <ModalAffectation
          programme={programmeSelectionne}
          onClose={() => setProgrammeSelectionne(null)}
          onSaved={() => {
            setProgrammeSelectionne(null);
            loadProgramme();
          }}
        />
      )}
    </div>
  );
}