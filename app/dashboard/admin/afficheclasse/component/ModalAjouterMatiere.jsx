
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { X, AlertCircle, Check } from "lucide-react";
import api from "../../../../../lib/api";

const FORM_INITIAL = {
  matiereId: "",
  sousGroupeId: "",
  coefficient: "",
  nombreHeuresParSemaine: "",
};

export default function ModalAjouterMatiere({
  classe,
  anneeScolaireId,
  programme,
  onClose,
  onSaved,
}) {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;
  const modeModification = !!programme;

  const [matieres, setMatieres] = useState([]);
  const [sousGroupes, setSousGroupes] = useState([]);

  const [form, setForm] = useState(FORM_INITIAL);

  const [loadingMatieres, setLoadingMatieres] = useState(true);
  const [loadingSousGroupes, setLoadingSousGroupes] = useState(false);

  const [erreur, setErreur] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
 
  // ============================================================
  // CHARGEMENT DES MATIÈRES
  // ============================================================

  useEffect(() => {
    if (!ecoleId) return;

    const chargerMatieres = async () => {
      setLoadingMatieres(true);
      setErreur("");

      try {
        const response = await api.get(`/matieres/ecole/${ecoleId}`);

        const liste = Array.isArray(response.data)
          ? response.data
          : [];

        liste.sort((a, b) =>
          (a.nom || "").localeCompare(b.nom || "")
        );

        setMatieres(liste);
      } catch (error) {
        console.error("Erreur chargement matières :", error);
        setMatieres([]);
        setErreur("Impossible de charger les matières.");
      } finally {
        setLoadingMatieres(false);
      }
    };

    chargerMatieres();
  }, [ecoleId]);

  useEffect(() => {
  if (!programme) {
    setForm(FORM_INITIAL);
    return;
  }

  console.log("✏️ PROGRAMME À MODIFIER =", programme);

  setForm({
    matiereId:
      programme.matiereId ??
      programme.matiere?.id ??
      "",

    sousGroupeId:
      programme.sousGroupeId ??
      programme.sousGroupe?.id ??
      "",

    coefficient:
      programme.coefficient ?? "",

    nombreHeuresParSemaine:
      programme.nombreHeuresParSemaine ??
      programme.volumeHoraire ??
      programme.heuresParSemaine ??
      "",
  });
}, [programme]);

  // ============================================================
  // CHARGEMENT DES SOUS-GROUPES
  // CLASSE + ANNÉE SCOLAIRE
  // ============================================================

  useEffect(() => {
    if (!classe?.id || !anneeScolaireId) {
      setSousGroupes([]);
      return;
    }

    const chargerSousGroupes = async () => {
      setLoadingSousGroupes(true);

      try {
        const response = await api.get(
          `/sous-groupes/classe/${classe.id}/annee/${anneeScolaireId}`
        );

        const liste = Array.isArray(response.data)
          ? response.data
          : [];

        setSousGroupes(liste);
      } catch (error) {
        console.error("Erreur chargement sous-groupes :", error);
        setSousGroupes([]);
      } finally {
        setLoadingSousGroupes(false);
      }
    };

    chargerSousGroupes();
  }, [classe?.id, anneeScolaireId]);

  // ============================================================
  // CHANGEMENT FORMULAIRE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErreur("");
    setSuccess("");
  };

  // ============================================================
  // ENREGISTREMENT
  // ============================================================

  const submit = async (e) => {
    e.preventDefault();

    setErreur("");
    setSuccess("");

    if (!classe?.id) {
      setErreur("Classe introuvable.");
      return;
    }

    if (!anneeScolaireId) {
      setErreur("Aucune année scolaire active.");
      return;
    }

    if (!form.matiereId) {
      setErreur("Veuillez choisir une matière.");
      return;
    }

    if (!form.coefficient) {
      setErreur("Le coefficient est obligatoire.");
      return;
    }

    if (!classe.niveauId) {
      setErreur("Le niveau de la classe est introuvable.");
      return;
    }
      if (!classe.serieId) {
      setErreur("La serie de la classe est introuvable.");
      return;
    }

    setSubmitting(true);

    try {
      // ========================================================
      // MÊME LOGIQUE QUE TON ANCIEN PROGRAMME
      // ========================================================

      const payload = {
        matiereId: Number(form.matiereId),

        niveauId: Number(classe.niveauId),

        serieId: classe.serieId
          ? Number(classe.serieId)
          : null,

        // IMPORTANT :
        // la matière est maintenant ajoutée directement
        // à la classe sélectionnée
        classeId: Number(classe.id),

        sousGroupeId: form.sousGroupeId
          ? Number(form.sousGroupeId)
          : null,

        anneeScolaireId: Number(anneeScolaireId),

        coefficient: Number(form.coefficient),

        nombreHeuresParSemaine:
          form.nombreHeuresParSemaine
            ? Number(form.nombreHeuresParSemaine)
            : null,

        ecoleId: Number(ecoleId),
      };

      console.log("📚 AJOUT MATIÈRE =", payload);

      await api.post("/coefficients", payload);

      setSuccess("✓ Matière ajoutée au programme avec succès");

      setTimeout(() => {
        onSaved();
      }, 700);
    } catch (error) {
      console.error("❌ Erreur ajout matière :", error);

      const data = error.response?.data;

      let message = "Erreur lors de l'ajout de la matière.";

      if (typeof data === "string") {
        message = data;
      } else if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      }

      setErreur(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <div>
           <h2 className="text-lg font-semibold text-slate-800">
  {modeModification
    ? "Modifier le programme"
    : "Ajouter un programme"}
</h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Ajouter une matière au programme de cette classe
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* INFORMATIONS CLASSE */}
       
        {/* ============================================================
    INFORMATIONS CLASSE / NIVEAU / SÉRIE
============================================================ */}

<div className="mb-4 rounded-xl bg-slate-50 p-3">
  {/* Classe */}
  <div className="mb-3">
    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
      Classe
    </p>

    <p className="mt-0.5 font-semibold text-slate-800">
      {classe?.nomComplet || "Classe"}
    </p>
  </div>

  {/* Niveau + Série */}
  <div className="grid grid-cols-2 gap-3">
    
    {/* Niveau */}
    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-inset ring-slate-100">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Niveau
      </p>

      <p className="mt-0.5 text-sm font-semibold text-slate-700">
        {classe?.niveauNom || "Non défini"}
      </p>
    </div>

    {/* Série */}
    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-inset ring-slate-100">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Série
      </p>

      <p className="mt-0.5 text-sm font-semibold text-slate-700">
        {classe?.serieNom || "Aucune série"}
      </p>
    </div>

  </div>
</div>
        {/* ERREUR */}
        {erreur && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0"
            />

            <span>{erreur}</span>
          </div>
        )}

        {/* SUCCÈS */}
        {success && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <Check size={16} />
            <span>{success}</span>
          </div>
        )}

        <form
          onSubmit={submit}
          className="space-y-3"
        >
          {/* MATIÈRE */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Matière
            </label>

            <select
              name="matiereId"
              value={form.matiereId}
              onChange={handleChange}
              disabled={submitting || loadingMatieres}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {loadingMatieres
                  ? "Chargement des matières..."
                  : matieres.length === 0
                    ? "Aucune matière disponible"
                    : "Choisir une matière"}
              </option>

              {matieres.map((matiere) => (
                <option
                  key={matiere.id}
                  value={matiere.id}
                >
                  {matiere.nom}
                </option>
              ))}
            </select>
          </div>

          {/* SOUS-GROUPE */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Sous-groupe
            </label>

            <select
              name="sousGroupeId"
              value={form.sousGroupeId}
              onChange={handleChange}
              disabled={
                submitting ||
                loadingSousGroupes ||
                !anneeScolaireId
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {loadingSousGroupes
                  ? "Chargement des sous-groupes..."
                  : sousGroupes.length === 0
                    ? "Toute la classe"
                    : "Toute la classe"}
              </option>

              {sousGroupes.map((sg) => (
                <option
                  key={sg.id}
                  value={sg.id}
                >
                  {sg.nom}
                </option>
              ))}
            </select>

            {sousGroupes.length > 0 && (
              <p className="mt-1 text-[11px] text-slate-400">
                Laissez « Toute la classe » pour une matière
                commune.
              </p>
            )}
          </div>

          {/* COEFFICIENT + HEURES */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Coefficient
              </label>

              <input
                type="number"
                name="coefficient"
                value={form.coefficient}
                onChange={handleChange}
                min="1"
                step="0.01"
                placeholder="Ex. 2"
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Heures / semaine
              </label>

              <input
                type="number"
                name="nombreHeuresParSemaine"
                value={form.nombreHeuresParSemaine}
                onChange={handleChange}
                min="1"
                step="0.5"
                placeholder="Ex. 2"
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* BOUTONS */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingMatieres ||
                !form.matiereId ||
                !form.coefficient
              }
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
  ? "Enregistrement..."
  : modeModification
    ? "Modifier"
    : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

