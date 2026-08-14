"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Plus, BookOpen, X, Check } from "lucide-react";
import api from "../../../../lib/api";

// ============================================================
// CONSTANTES
// ============================================================

const FORM_INITIAL = { nom: "", code: "" };

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
  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // ============================================================
  // FONCTIONS
  // ============================================================

  const loadMatieres = useCallback(async () => {
    if (!ecoleId) return;

    try {
      const res = await api.get(`/matieres/ecole/${ecoleId}`);
      setMatieres(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erreur chargement matières :", error);
      setMatieres([]);
    }
  }, [ecoleId]);

  const afficherToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErreur("");
  };

  const resetForm = () => {
    setForm(FORM_INITIAL);
    setErreur("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    // Validation
    if (!form.nom.trim() || !form.code.trim()) {
      setErreur("Le nom et le code sont obligatoires");
      return;
    }

    if (!ecoleId) {
      setErreur("Aucun établissement associé à votre compte");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/matieres", {
        nom: form.nom.trim(),
        code: form.code.trim().toUpperCase(),
        ecoleId,
      });

      // Succès
      const nomCree = form.nom;
      resetForm();
      setShowForm(false);
      await loadMatieres();
      afficherToast(`Matière "${nomCree}" créée avec succès`);

      // Notification parent
      if (onCreated) {
        onCreated();
      }
    } catch (error) {
      console.error("Erreur création matière :", error);
      setErreur(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Erreur lors de la création de la matière"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // EFFETS
  // ============================================================

  useEffect(() => {
    loadMatieres();
  }, [loadMatieres]);

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-200/60">

          {/* =====================================================
              EN-TÊTE
          ===================================================== */}

          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <BookOpen size={19} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-tight text-slate-900">
                  Matières
                </h2>
                <p className="text-sm leading-tight text-slate-500">
                  {matieres.length > 0
                    ? `${matieres.length} matière${matieres.length > 1 ? "s" : ""} configurée${matieres.length > 1 ? "s" : ""}`
                    : "Aucune matière configurée"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(!showForm);
                setErreur("");
                if (!showForm) resetForm();
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.97]"
            >
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? "Fermer" : "Ajouter"}
            </button>
          </div>

          {/* =====================================================
              FORMULAIRE
          ===================================================== */}

          {showForm && (
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
              {erreur && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
                  <span>{erreur}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                      Nom de la matière
                    </label>
                    <input
                      name="nom"
                      placeholder="ex : Mathématiques"
                      value={form.nom}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                      Code
                    </label>
                    <input
                      name="code"
                      placeholder="ex : MATH"
                      value={form.code}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm uppercase text-slate-900 placeholder:normal-case placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      required
                      disabled={submitting}
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Création...
                      </span>
                    ) : (
                      "Créer la matière"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    disabled={submitting}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =====================================================
              LISTE DES MATIÈRES
          ===================================================== */}

          {matieres.length > 0 && (
            <div className="px-6 py-5">
              <div className="flex flex-wrap gap-2">
                {matieres.map((matiere) => (
                  <span
                    key={matiere.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/70 px-3 py-1.5 text-xs font-medium text-indigo-700"
                  >
                    {matiere.nom}
                    <span className="text-indigo-400">{matiere.code}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================
              ÉTAT VIDE
          ===================================================== */}

          {matieres.length === 0 && !showForm && (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                <BookOpen size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                Aucune matière pour le moment
              </p>
              <p className="text-xs text-slate-400">
                Ajoutez votre première matière pour commencer
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          TOAST
      ===================================================== */}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl shadow-slate-900/20 animate-in fade-in slide-in-from-bottom-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
            <Check size={12} className="text-emerald-400" strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}