"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";

const API_URL = "http://localhost:8080/api";

export default function CategoriesDepensePage() {

  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nom, setNom] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState(null);

  // =========================================================
  // ÉCOLE CONNECTÉE
  // =========================================================

  const ecoleId = user?.ecole?.id;

  // =========================================================
  // TOKEN
  // =========================================================

  const getToken = () => {

    if (typeof window === "undefined") {
      return null;
    }

    return (
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("accessToken")
    );
  };

  // =========================================================
  // MESSAGE
  // =========================================================

  const afficherMessage = (type, texte) => {

    setMessage({
      type,
      texte,
    });

    setTimeout(() => {
      setMessage(null);
    }, 4000);
  };

  
  // =========================================================
  // CHARGEMENT INITIAL
  // =========================================================

  useEffect(() => {

    if (!ecoleId) return;

    chargerCategories();

  }, [ecoleId]);

  
  // =========================================================
  // MODIFIER
  // =========================================================

  const commencerModification = (categorie) => {

    setEditingId(categorie.id);
    setNom(categorie.nom);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // ANNULER
  // =========================================================

  const annulerModification = () => {

    setEditingId(null);
    setNom("");
  };

  
// =========================================================
// CHARGER LES CATÉGORIES DE L'ÉCOLE
// =========================================================

const chargerCategories = async () => {
  if (!ecoleId) {
    setLoading(false);
    return;
  }

  setLoading(true);

  try {
    const response = await api.get(
      `/categories-depenses/ecole/${ecoleId}`
    );

    setCategories(
      Array.isArray(response.data)
        ? response.data
        : []
    );

  } catch (error) {
    console.error(
      "❌ Erreur chargement catégories :",
      error
    );

    afficherMessage(
      "error",
      error.response?.data?.message ||
        error.message ||
        "Impossible de charger les catégories."
    );

  } finally {
    setLoading(false);
  }
};


// =========================================================
// AJOUT / MODIFICATION
// =========================================================

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!ecoleId) {
    afficherMessage(
      "error",
      "Aucune école associée à votre compte."
    );
    return;
  }

  const nomNettoye = nom.trim();

  if (!nomNettoye) {
    afficherMessage(
      "error",
      "Le nom de la catégorie est obligatoire."
    );
    return;
  }

  setSaving(true);

  try {
    const url = editingId
      ? `/categories-depenses/${editingId}/ecole/${ecoleId}`
      : `/categories-depenses/ecole/${ecoleId}`;

    const body = {
      nom: nomNettoye,
      ecoleId: ecoleId,
    };

    const response = editingId
      ? await api.put(url, body)
      : await api.post(url, body);

    console.log(
      "✅ Catégorie sauvegardée :",
      response.data
    );

    afficherMessage(
      "success",
      editingId
        ? "Catégorie modifiée avec succès."
        : "Catégorie créée avec succès."
    );

    setNom("");
    setEditingId(null);

    await chargerCategories();

  } catch (error) {
    console.error(
      "❌ Erreur sauvegarde catégorie :",
      error
    );

    console.error(
      "Status :",
      error.response?.status
    );

    console.error(
      "Data :",
      error.response?.data
    );

    afficherMessage(
      "error",
      error.response?.data?.message ||
        error.message ||
        "Impossible d'enregistrer la catégorie."
    );

  } finally {
    setSaving(false);
  }
};


// =========================================================
// SUPPRIMER
// =========================================================

const supprimerCategorie = async (id) => {
  if (!ecoleId) {
    afficherMessage(
      "error",
      "Aucune école associée à votre compte."
    );
    return;
  }

  const confirmation = window.confirm(
    "Voulez-vous vraiment supprimer cette catégorie ?"
  );

  if (!confirmation) return;

  setDeletingId(id);

  try {
    const response = await api.delete(
      `/categories-depenses/${id}/ecole/${ecoleId}`
    );

    console.log(
      "✅ Catégorie supprimée :",
      response.data
    );

    afficherMessage(
      "success",
      "Catégorie supprimée avec succès."
    );

    await chargerCategories();

  } catch (error) {
    console.error(
      "❌ Erreur suppression catégorie :",
      error
    );

    console.error(
      "Status :",
      error.response?.status
    );

    console.error(
      "Data :",
      error.response?.data
    );

    afficherMessage(
      "error",
      error.response?.data?.message ||
        error.message ||
        "Impossible de supprimer la catégorie."
    );

  } finally {
    setDeletingId(null);
  }
};


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="h-7 w-64 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 h-32 animate-pulse rounded-2xl bg-white" />
          <div className="mt-4 h-64 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-4xl">

        <div className="mb-7">

          <h1 className="text-2xl font-semibold text-slate-900">
            Catégories de dépenses
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gérez les catégories de dépenses de votre école.
          </p>

          {ecoleId && (
            <p className="mt-1 text-xs text-slate-400">
              École ID : {ecoleId}
            </p>
          )}

        </div>

        {message && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.texte}
          </div>
        )}

        {/* FORMULAIRE */}

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

          <h2 className="font-semibold text-slate-800">
            {editingId
              ? "Modifier la catégorie"
              : "Nouvelle catégorie"}
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Exemples : Salaires, Électricité, Fournitures,
            Entretien...
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >

            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom de la catégorie"
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />

            <button
              type="submit"
              disabled={saving || !ecoleId}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Enregistrement..."
                : editingId
                  ? "Modifier"
                  : "Ajouter"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={annulerModification}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
            )}

          </form>
        </div>

        {/* LISTE */}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">

            <div>
              <h2 className="font-semibold text-slate-800">
                Catégories de votre école
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {categories.length} catégorie
                {categories.length > 1 ? "s" : ""}
              </p>
            </div>

          </div>

          {categories.length === 0 ? (

            <div className="px-6 py-12 text-center">

              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                $
              </div>

              <p className="font-medium text-slate-700">
                Aucune catégorie
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Créez votre première catégorie de dépense.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {categories.map((categorie) => (

                <div
                  key={categorie.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-600">
                      $
                    </div>

                    <div>

                      <p className="font-medium text-slate-800">
                        {categorie.nom}
                      </p>

                      <p className="text-xs text-slate-400">
                        ID : {categorie.id}
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        commencerModification(categorie)
                      }
                      className="rounded-lg px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === categorie.id}
                      onClick={() =>
                        supprimerCategorie(categorie.id)
                      }
                      className="rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {deletingId === categorie.id
                        ? "Suppression..."
                        : "Supprimer"}
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}