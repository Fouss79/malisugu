"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";

const API_URL = "http://localhost:8080/api";

export default function ComptabilitePage() {
  const { user } = useAuth();

  const ecoleId = user?.ecole?.id;

  const [rapport, setRapport] = useState(null);
  const [categories, setCategories] = useState([]);

  const [loadingRapport, setLoadingRapport] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  // =========================================================
  // FORMULAIRE DÉPENSE
  // =========================================================

  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [dateDepense, setDateDepense] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [categorieId, setCategorieId] = useState("");

  const [savingDepense, setSavingDepense] = useState(false);

  // =========================================================
  // TOKEN JWT
  // =========================================================

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("accessToken")
    );
  };

  // =========================================================
  // MESSAGE
  // =========================================================

  const afficherMessage = (texte) => {
    setMessage(texte);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  
// =========================================================
// CHARGER RAPPORT
// =========================================================

const chargerRapport = async () => {
  if (!ecoleId) {
    setLoadingRapport(false);
    return;
  }

  setLoadingRapport(true);
  setErreur("");

  try {
    const res = await api.get(
      `/operations-comptables/rapport/${ecoleId}`
    );

    setRapport(res.data);
  } catch (error) {
    console.error("❌ Erreur chargement rapport :", error);

    setErreur(
      error.response?.data?.message ||
        error.message ||
        "Impossible de charger le rapport comptable"
    );
  } finally {
    setLoadingRapport(false);
  }
};


// =========================================================
// CHARGER CATÉGORIES
// =========================================================

const chargerCategories = async () => {
  if (!ecoleId) {
    setLoadingCategories(false);
    return;
  }

  setLoadingCategories(true);

  try {
    const res = await api.get(
      `/categories-depenses/ecole/${ecoleId}`
    );

    setCategories(
      Array.isArray(res.data) ? res.data : []
    );
  } catch (error) {
    console.error("❌ Erreur catégories :", error);

    setErreur(
      error.response?.data?.message ||
        error.message ||
        "Impossible de charger les catégories de dépenses"
    );
  } finally {
    setLoadingCategories(false);
  }
};


// =========================================================
// CRÉER DÉPENSE
// =========================================================

const creerDepense = async (e) => {
  e.preventDefault();

  setErreur("");
  setMessage("");

  // -------------------------
  // VALIDATION
  // -------------------------

  if (!ecoleId) {
    setErreur("Aucune école associée à votre compte.");
    return;
  }

  if (!libelle.trim()) {
    setErreur("Le libellé de la dépense est obligatoire.");
    return;
  }

  if (!montant || Number(montant) <= 0) {
    setErreur("Le montant doit être supérieur à zéro.");
    return;
  }

  if (!dateDepense) {
    setErreur("La date de la dépense est obligatoire.");
    return;
  }

  if (!categorieId) {
    setErreur("Veuillez sélectionner une catégorie.");
    return;
  }

  setSavingDepense(true);

  try {
    const res = await api.post(
      `/depenses/ecole/${ecoleId}`,
      {
        libelle: libelle.trim(),
        montant: Number(montant),
        dateDepense,
        description: description.trim() || null,
        categorieId: Number(categorieId),
      }
    );

    console.log("✅ Dépense créée :", res.data);

    // -------------------------
    // SUCCÈS
    // -------------------------

    afficherMessage(
      "Dépense enregistrée avec succès."
    );

    // Réinitialiser formulaire
    setLibelle("");
    setMontant("");
    setDescription("");
    setCategorieId("");
    setDateDepense(
      new Date().toISOString().split("T")[0]
    );

    setAfficherFormulaire(false);

    // Recharger le rapport
    await chargerRapport();

  } catch (error) {
    console.error(
      "❌ Erreur création dépense :",
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

    setErreur(
      error.response?.data?.message ||
        error.message ||
        "Impossible d'enregistrer la dépense."
    );
  } finally {
    setSavingDepense(false);
  }
};


  // =========================================================
  // CHARGEMENT INITIAL
  // =========================================================

  useEffect(() => {
    if (!ecoleId) return;

    chargerRapport();
    chargerCategories();
  }, [ecoleId]);

  // =========================================================
  // FORMATAGE MONTANT
  // =========================================================

  const formatMontant = (montant) => {
    return (
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0,
      }).format(montant || 0) + " FCFA"
    );
  };

  // =========================================================
  // FORMATAGE DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loadingRapport) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">

          <div className="mb-6">
            <div className="h-7 w-56 animate-pulse rounded bg-slate-200" />

            <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}

          </div>

        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Comptabilité
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Suivi global des recettes et des dépenses de l'école.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              onClick={chargerRapport}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Actualiser
            </button>

            <button
              onClick={() =>
                setAfficherFormulaire(
                  !afficherFormulaire
                )
              }
              className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              {afficherFormulaire
                ? "Fermer"
                : "+ Nouvelle dépense"}
            </button>

          </div>

        </div>

        {/* =====================================================
            MESSAGES
        ===================================================== */}

        {erreur && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erreur}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {/* =====================================================
            FORMULAIRE DÉPENSE
        ===================================================== */}

        {afficherFormulaire && (
          <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

            <div className="mb-6">

              <h2 className="text-lg font-semibold text-slate-900">
                Nouvelle dépense
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enregistrez une dépense pour votre école.
              </p>

            </div>

            <form
              onSubmit={creerDepense}
              className="space-y-5"
            >

              {/* LIBELLÉ + CATÉGORIE */}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Libellé *
                  </label>

                  <input
                    type="text"
                    value={libelle}
                    onChange={(e) =>
                      setLibelle(e.target.value)
                    }
                    placeholder="Ex : Achat de fournitures"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Catégorie *
                  </label>

                  <select
                    value={categorieId}
                    onChange={(e) =>
                      setCategorieId(e.target.value)
                    }
                    disabled={loadingCategories}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  >

                    <option value="">
                      {loadingCategories
                        ? "Chargement..."
                        : "Sélectionner une catégorie"}
                    </option>

                    {categories.map((categorie) => (
                      <option
                        key={categorie.id}
                        value={categorie.id}
                      >
                        {categorie.nom}
                      </option>
                    ))}

                  </select>

                  {!loadingCategories &&
                    categories.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        Aucune catégorie de dépense disponible.
                      </p>
                    )}

                </div>

              </div>

              {/* MONTANT + DATE */}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Montant (FCFA) *
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={montant}
                    onChange={(e) =>
                      setMontant(e.target.value)
                    }
                    placeholder="Ex : 75000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Date de la dépense *
                  </label>

                  <input
                    type="date"
                    value={dateDepense}
                    onChange={(e) =>
                      setDateDepense(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  />

                </div>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  rows="4"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Informations complémentaires..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />

              </div>

              {/* ACTIONS */}

              <div className="flex flex-col justify-end gap-3 pt-2 sm:flex-row">

                <button
                  type="button"
                  onClick={() =>
                    setAfficherFormulaire(false)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={savingDepense}
                  className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingDepense
                    ? "Enregistrement..."
                    : "Enregistrer la dépense"}
                </button>

              </div>

            </form>

          </div>
        )}

        {/* =====================================================
            CARTES
        ===================================================== */}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* RECETTES */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Total recettes
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {formatMontant(
                rapport?.totalRecettes
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Paiements et autres recettes
            </p>

          </div>

          {/* DÉPENSES */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Total dépenses
            </p>

            <p className="mt-2 text-2xl font-bold text-rose-600">
              {formatMontant(
                rapport?.totalDepenses
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Dépenses enregistrées
            </p>

          </div>

          {/* SOLDE */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Solde
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                (rapport?.solde || 0) >= 0
                  ? "text-indigo-600"
                  : "text-rose-600"
              }`}
            >
              {formatMontant(
                rapport?.solde
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Recettes − dépenses
            </p>

          </div>

        </div>

        {/* =====================================================
            INFORMATIONS
        ===================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="flex flex-wrap gap-6">

            <div>
              <p className="text-xs text-slate-400">
                Nombre d'opérations
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-800">
                {rapport?.nombreOperations || 0}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                École
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-800">
                {user?.ecole?.nom || "-"}
              </p>
            </div>

          </div>

        </div>

        {/* =====================================================
            JOURNAL COMPTABLE
        ===================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-4">

            <h2 className="font-semibold text-slate-800">
              Journal comptable
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Toutes les opérations enregistrées.
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                <tr>

                  <th className="px-5 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3">
                    Libellé
                  </th>

                  <th className="px-5 py-3">
                    Type
                  </th>

                  <th className="px-5 py-3">
                    Référence
                  </th>

                  <th className="px-5 py-3">
                    Mode
                  </th>

                  <th className="px-5 py-3 text-right">
                    Montant
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {(rapport?.operations || []).length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Aucune opération comptable.
                    </td>

                  </tr>

                ) : (

                  rapport.operations.map(
                    (operation) => (

                      <tr
                        key={operation.id}
                        className="transition hover:bg-slate-50"
                      >

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(
                            operation.dateOperation
                          )}
                        </td>

                        <td className="px-5 py-4">

                          <div className="font-medium text-slate-800">
                            {operation.libelle || "-"}
                          </div>

                          {operation.typeOperation ===
                            "PAIEMENT_SCOLARITE" && (
                            <div className="mt-1 text-xs text-slate-400">
                              {operation.elevePrenom}{" "}
                              {operation.eleveNom}
                            </div>
                          )}

                          {operation.typeOperation ===
                            "DEPENSE" &&
                            operation.categorieDepenseNom && (
                              <div className="mt-1 text-xs text-slate-400">
                                {
                                  operation.categorieDepenseNom
                                }
                              </div>
                            )}

                        </td>

                        <td className="px-5 py-4">

                          {operation.nature ===
                          "RECETTE" ? (

                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              RECETTE
                            </span>

                          ) : (

                            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                              DÉPENSE
                            </span>

                          )}

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-500">
                          {operation.reference || "-"}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {operation.modePaiement || "-"}
                        </td>

                        <td
                          className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                            operation.nature ===
                            "RECETTE"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >

                          {operation.nature ===
                          "RECETTE"
                            ? "+"
                            : "-"}{" "}

                          {formatMontant(
                            operation.montant
                          )}

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}