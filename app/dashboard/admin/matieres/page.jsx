"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  Plus,
  BookOpen,
  X,
  Check,
  Search,
  Loader2,
  AlertCircle,
  Hash,
  Sparkles,
} from "lucide-react";
import api from "../../../../lib/api";

// ============================================================
// CONSTANTES
// ============================================================


const GOLD_2 = "#E4B655";
const GOLD = "#C89B3C";
const INK = "#101B33";
const FORM_INITIAL = {
  nom: "",
  code: "",
};

// ============================================================
// COMPOSANT
// ============================================================

export default function MatiereForm({ onCreated }) {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  // ============================================================
  // ÉTATS
  // ============================================================

  const [form, setForm] = useState(FORM_INITIAL);
  const [matieres, setMatieres] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const loadMatieres = useCallback(async () => {
    if (!ecoleId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await api.get(
        `/matieres/ecole/${ecoleId}`
      );

      setMatieres(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (error) {
      console.error(
        "Erreur chargement matières :",
        error
      );

      setMatieres([]);
    } finally {
      setLoading(false);
    }
  }, [ecoleId]);

  // ============================================================
  // TOAST
  // ============================================================

  const afficherToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // ============================================================
  // FORMULAIRE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "code"
          ? value.toUpperCase()
          : value,
    }));

    setErreur("");
  };

  const resetForm = () => {
    setForm(FORM_INITIAL);
    setErreur("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    if (
      !form.nom.trim() ||
      !form.code.trim()
    ) {
      setErreur(
        "Le nom et le code sont obligatoires."
      );
      return;
    }

    if (!ecoleId) {
      setErreur(
        "Aucun établissement associé à votre compte."
      );
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/matieres", {
        nom: form.nom.trim(),
        code: form.code.trim().toUpperCase(),
        ecoleId,
      });

      const nomCree = form.nom.trim();

      resetForm();
      setShowForm(false);

      await loadMatieres();

      afficherToast(
        `Matière "${nomCree}" créée avec succès`
      );

      if (onCreated) {
        onCreated();
      }
    } catch (error) {
      console.error(
        "Erreur création matière :",
        error
      );

      setErreur(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Erreur lors de la création de la matière."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // EFFET
  // ============================================================

  useEffect(() => {
    loadMatieres();
  }, [loadMatieres]);

  // ============================================================
  // RECHERCHE
  // ============================================================

  const matieresFiltrees = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return matieres;
    }

    return matieres.filter((matiere) => {
      const nom =
        matiere.nom?.toLowerCase() || "";

      const code =
        matiere.code?.toLowerCase() || "";

      return (
        nom.includes(query) ||
        code.includes(query)
      );
    });
  }, [matieres, search]);

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-200/50">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* TITRE */}

            <div className="flex min-w-0 items-center gap-3">
               <span
                          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                          style={{ background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`, color: INK }}
                        >
                          <BookOpen size={20} />
                        </span>
             

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                    Matières
                  </h2>

                  {matieres.length > 0 && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                      {matieres.length}
                    </span>
                  )}
                </div>

                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Gérez les matières de votre établissement
                </p>
              </div>
            </div>

            {/* BOUTON */}

            <button
              type="button"
              onClick={() => {
                setShowForm((prev) => !prev);
                setErreur("");

                if (!showForm) {
                  resetForm();
                }
              }}
             className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition active:scale-[0.98] sm:w-auto ${
  showForm
    ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
    : "bg-[#101B33] text-white shadow-blue-200 hover:bg-gray-700"
}`}
            >
              {showForm ? (
                <X size={17} />
              ) : (
                <Plus size={17} />
              )}

              {showForm
                ? "Fermer"
                : "Ajouter une matière"}
            </button>
          </div>
        </div>

        {/* =====================================================
            FORMULAIRE
        ===================================================== */}

        {showForm && (
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-5 sm:px-6">
            <div className="mx-auto max-w-2xl">

              {/* TITRE FORMULAIRE */}

              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                  <Sparkles size={17} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Nouvelle matière
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Ajoutez une matière au programme de votre établissement.
                  </p>
                </div>
              </div>

              {/* ERREUR */}

              {erreur && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{erreur}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">

                  {/* NOM */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Nom de la matière
                    </label>

                    <input
                      name="nom"
                      placeholder="Ex : Mathématiques"
                      value={form.nom}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      required
                      disabled={submitting}
                    />
                  </div>

                  {/* CODE */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Code
                    </label>

                    <div className="relative">
                      <Hash
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        name="code"
                        placeholder="MATH"
                        value={form.code}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm font-semibold uppercase tracking-wide text-slate-900 outline-none transition placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        required
                        disabled={submitting}
                        maxLength={10}
                      />
                    </div>

                    <p className="mt-1 text-[10px] text-slate-400">
                      Maximum 10 caractères
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                        Création...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Créer la matière
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================
            LISTE
        ===================================================== */}

        {matieres.length > 0 && (
          <div className="px-4 py-5 sm:px-6">

            {/* BARRE RECHERCHE */}

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Matières configurées
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  {matieresFiltrees.length} résultat
                  {matieresFiltrees.length > 1
                    ? "s"
                    : ""}
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* CARTES */}

            {matieresFiltrees.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {matieresFiltrees.map(
                  (matiere) => (
                    <div
                      key={matiere.id}
                      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-white hover:shadow-md hover:shadow-slate-200/50"
                    >
                      {/* ACCENT */}

                      <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500 opacity-0 transition group-hover:opacity-100" />

                      <div className="flex items-start justify-between gap-3">

                        {/* ICON */}

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                          <BookOpen size={18} />
                        </div>

                        {/* CODE */}

                        <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                          {matiere.code}
                        </span>
                      </div>

                      {/* NOM */}

                      <div className="mt-4">
                        <h3 className="truncate text-sm font-bold text-slate-800">
                          {matiere.nom}
                        </h3>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Code matière :{" "}
                          <span className="font-semibold text-slate-500">
                            {matiere.code}
                          </span>
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
                  <Search size={19} />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Aucune matière trouvée
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Essayez avec un autre nom ou
                  code.
                </p>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            CHARGEMENT
        ===================================================== */}

        {loading && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50">
              <Loader2
                size={20}
                className="animate-spin text-indigo-600"
              />
            </div>

            <p className="mt-3 text-sm font-medium text-slate-600">
              Chargement des matières...
            </p>
          </div>
        )}

        {/* =====================================================
            ÉTAT VIDE
        ===================================================== */}

        {!loading &&
          matieres.length === 0 &&
          !showForm && (
            <div className="flex flex-col items-center px-5 py-12 text-center sm:py-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <BookOpen size={24} />
              </div>

              <p className="mt-4 text-sm font-bold text-slate-700">
                Aucune matière pour le moment
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                Commencez par ajouter votre
                première matière pour configurer
                votre établissement.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                  resetForm();
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
              >
                <Plus size={15} />
                Ajouter une matière
              </button>
            </div>
          )}
      </div>

      {/* ======================================================
          TOAST
      ====================================================== */}

      {toast && (
        <div className="fixed bottom-4 left-4 right-4 z-[100] sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-2xl shadow-slate-900/20">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              <Check
                size={15}
                className="text-emerald-400"
                strokeWidth={3}
              />
            </span>

            <span className="min-w-0 flex-1">
              {toast}
            </span>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="shrink-0 text-slate-400 transition hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}