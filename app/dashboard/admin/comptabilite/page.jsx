"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";

const STATUT_STYLES = {
  PAYE: "bg-emerald-50 text-emerald-700",
  PARTIEL: "bg-amber-50 text-amber-700",
  NON_PAYE: "bg-rose-50 text-rose-700",
};

const STATUT_LABELS = {
  PAYE: "Payée",
  PARTIEL: "Partielle",
  NON_PAYE: "Non payée",
};

function StatutBadge({ statut }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUT_STYLES[statut] || "bg-slate-100 text-slate-600"
      }`}
    >
      {STATUT_LABELS[statut] || statut}
    </span>
  );
}

/* =========================================================
   MODAL VERSEMENT SUR UNE DÉPENSE
========================================================= */

function ModalVersement({ depense, onClose, onSaved }) {
  const [montant, setMontant] = useState(String(depense.resteAPayer || ""));
  const [modePaiement, setModePaiement] = useState("CASH");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");

  const formatMontant = (v) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v || 0) + " FCFA";

  const submit = async (e) => {
    e.preventDefault();
    setErreur("");

    const montantNum = Number(montant);

    if (!montantNum || montantNum <= 0) {
      setErreur("Le montant doit être supérieur à zéro.");
      return;
    }

    if (montantNum > depense.resteAPayer) {
      setErreur(`Le montant dépasse le reste à payer (${formatMontant(depense.resteAPayer)}).`);
      return;
    }

    if (modePaiement !== "CASH" && !reference.trim()) {
      setErreur("La référence est obligatoire pour ce mode de paiement.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/paiements-depense", {
        depenseId: depense.id,
        montant: montantNum,
        modePaiement,
        reference: modePaiement === "CASH" ? null : reference.trim(),
      });

      onSaved();
    } catch (err) {
      console.error(err);
      setErreur(
        err.response?.data?.message || err.response?.data?.error || "Erreur lors de l'enregistrement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">Encaisser un versement</h2>
        <p className="mt-1 text-sm text-slate-500">{depense.libelle}</p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-100 bg-slate-50">
          <div className="p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Total</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{formatMontant(depense.montantTotal)}</p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Payé</p>
            <p className="mt-1 text-sm font-bold text-emerald-600">{formatMontant(depense.montantPaye)}</p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Reste</p>
            <p className="mt-1 text-sm font-bold text-rose-600">{formatMontant(depense.resteAPayer)}</p>
          </div>
        </div>

        {erreur && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erreur}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Montant à verser</label>
            <input
              type="number"
              min="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Mode de paiement</label>
            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            >
              <option value="CASH">Espèces</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="MOOV_MONEY">Moov Money</option>
              <option value="VIREMENT">Virement</option>
              <option value="CHEQUE">Chèque</option>
            </select>
          </div>

          {modePaiement !== "CASH" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Référence</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex : OM-2026-000123"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                required
              />
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || depense.resteAPayer <= 0}
              className="w-full rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
            >
              {submitting ? "Enregistrement..." : "Encaisser"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE PRINCIPALE
========================================================= */

export default function ComptabilitePage() {
  const { user } = useAuth();

  const ecoleId = user?.ecole?.id;

  const [rapport, setRapport] = useState(null);
  const [depenses, setDepenses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loadingRapport, setLoadingRapport] = useState(true);
  const [loadingDepenses, setLoadingDepenses] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [depenseSelectionnee, setDepenseSelectionnee] = useState(null);

  /* ===== FORMULAIRE NOUVELLE DÉPENSE ===== */

  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  const [libelle, setLibelle] = useState("");
  const [montantTotal, setMontantTotal] = useState("");
  const [dateDepense, setDateDepense] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [categorieId, setCategorieId] = useState("");

  const [savingDepense, setSavingDepense] = useState(false);

  /* ===== FORMULAIRE NOUVELLE RECETTE ===== */

  const [afficherFormulaireRecette, setAfficherFormulaireRecette] = useState(false);

  const [libelleRecette, setLibelleRecette] = useState("");
  const [montantRecette, setMontantRecette] = useState("");
  const [modePaiementRecette, setModePaiementRecette] = useState("CASH");
  const [referenceRecette, setReferenceRecette] = useState("");

  const [savingRecette, setSavingRecette] = useState(false);

  const afficherMessage = (texte) => {
    setMessage(texte);
    setTimeout(() => setMessage(""), 4000);
  };

  /* ===== CHARGEMENT ===== */

  const chargerRapport = async () => {
    if (!ecoleId) {
      setLoadingRapport(false);
      return;
    }

    setLoadingRapport(true);
    setErreur("");

    try {
      const res = await api.get(`/operations-comptables/rapport/${ecoleId}`);
      setRapport(res.data);
    } catch (error) {
      console.error("Erreur chargement rapport :", error);
      setErreur(error.response?.data?.message || error.message || "Impossible de charger le rapport comptable");
    } finally {
      setLoadingRapport(false);
    }
  };

  const chargerDepenses = async () => {
    if (!ecoleId) {
      setLoadingDepenses(false);
      return;
    }

    setLoadingDepenses(true);

    try {
      const res = await api.get(`/depenses/ecole/${ecoleId}`);
      setDepenses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erreur chargement dépenses :", error);
    } finally {
      setLoadingDepenses(false);
    }
  };

  const chargerCategories = async () => {
    if (!ecoleId) {
      setLoadingCategories(false);
      return;
    }

    setLoadingCategories(true);

    try {
      const res = await api.get(`/categories-depenses/ecole/${ecoleId}`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erreur catégories :", error);
      setErreur(error.response?.data?.message || error.message || "Impossible de charger les catégories de dépenses");
    } finally {
      setLoadingCategories(false);
    }
  };

  const rechargerTout = async () => {
    await Promise.all([chargerRapport(), chargerDepenses()]);
  };

  /* ===== CRÉER DÉPENSE (pose le montant total, aucun paiement) ===== */

  const creerDepense = async (e) => {
    e.preventDefault();

    setErreur("");
    setMessage("");

    if (!ecoleId) {
      setErreur("Aucune école associée à votre compte.");
      return;
    }

    if (!libelle.trim()) {
      setErreur("Le libellé de la dépense est obligatoire.");
      return;
    }

    if (!montantTotal || Number(montantTotal) <= 0) {
      setErreur("Le montant doit être supérieur à zéro.");
      return;
    }

    if (!dateDepense) {
      setErreur("La date de la dépense est obligatoire.");
      return;
    }

    setSavingDepense(true);

    try {
      await api.post(`/depenses/ecole/${ecoleId}`, {
        libelle: libelle.trim(),
        montantTotal: Number(montantTotal),
        dateDepense,
        description: description.trim() || null,
        categorieId: categorieId ? Number(categorieId) : null,
      });

      afficherMessage("Dépense enregistrée. Vous pouvez maintenant l'encaisser (en une ou plusieurs fois).");

      setLibelle("");
      setMontantTotal("");
      setDescription("");
      setCategorieId("");
      setDateDepense(new Date().toISOString().split("T")[0]);
      setAfficherFormulaire(false);

      await chargerDepenses();
    } catch (error) {
      console.error("Erreur création dépense :", error);
      setErreur(error.response?.data?.message || error.message || "Impossible d'enregistrer la dépense.");
    } finally {
      setSavingDepense(false);
    }
  };

  const handleVersementSaved = async () => {
    setDepenseSelectionnee(null);
    afficherMessage("Versement enregistré avec succès.");
    await rechargerTout();
  };

  /* ===== CRÉER RECETTE LIBRE (don, subvention, location, etc.) ===== */

  const creerRecette = async (e) => {
    e.preventDefault();

    setErreur("");
    setMessage("");

    if (!ecoleId) {
      setErreur("Aucune école associée à votre compte.");
      return;
    }

    if (!libelleRecette.trim()) {
      setErreur("Le libellé de la recette est obligatoire.");
      return;
    }

    if (!montantRecette || Number(montantRecette) <= 0) {
      setErreur("Le montant doit être supérieur à zéro.");
      return;
    }

    if (modePaiementRecette !== "CASH" && !referenceRecette.trim()) {
      setErreur("La référence est obligatoire pour ce mode de paiement.");
      return;
    }

    setSavingRecette(true);

    try {
      await api.post(`/operations-comptables/recette/ecole/${ecoleId}`, {
        libelle: libelleRecette.trim(),
        montant: Number(montantRecette),
        modePaiement: modePaiementRecette,
        reference: modePaiementRecette === "CASH" ? null : referenceRecette.trim(),
      });

      afficherMessage("Recette enregistrée avec succès.");

      setLibelleRecette("");
      setMontantRecette("");
      setModePaiementRecette("CASH");
      setReferenceRecette("");
      setAfficherFormulaireRecette(false);

      await chargerRapport();
    } catch (error) {
      console.error("Erreur création recette :", error);
      setErreur(error.response?.data?.message || error.message || "Impossible d'enregistrer la recette.");
    } finally {
      setSavingRecette(false);
    }
  };

  useEffect(() => {
    if (!ecoleId) return;

    chargerRapport();
    chargerDepenses();
    chargerCategories();
  }, [ecoleId]);

  const formatMontant = (montant) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(montant || 0) + " FCFA";

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

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
              <div key={item} className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Comptabilité</h1>
            <p className="mt-1 text-sm text-slate-500">Suivi global des recettes et des dépenses de l'école.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={rechargerTout}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Actualiser
            </button>

            <button
              onClick={() => setAfficherFormulaireRecette(!afficherFormulaireRecette)}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              {afficherFormulaireRecette ? "Fermer" : "+ Nouvelle recette"}
            </button>

            <button
              onClick={() => setAfficherFormulaire(!afficherFormulaire)}
              className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              {afficherFormulaire ? "Fermer" : "+ Nouvelle dépense"}
            </button>
          </div>
        </div>

        {/* MESSAGES */}

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

        {/* FORMULAIRE NOUVELLE RECETTE */}

        {afficherFormulaireRecette && (
          <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Nouvelle recette</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pour un revenu qui n'est pas un paiement d'élève : don, subvention, location, etc.
              </p>
            </div>

            <form onSubmit={creerRecette} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Libellé *</label>
                  <input
                    type="text"
                    value={libelleRecette}
                    onChange={(e) => setLibelleRecette(e.target.value)}
                    placeholder="Ex : Subvention mairie"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Montant (FCFA) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={montantRecette}
                    onChange={(e) => setMontantRecette(e.target.value)}
                    placeholder="Ex : 150000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Mode de paiement</label>
                  <select
                    value={modePaiementRecette}
                    onChange={(e) => setModePaiementRecette(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="CASH">Espèces</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="MOOV_MONEY">Moov Money</option>
                    <option value="VIREMENT">Virement</option>
                    <option value="CHEQUE">Chèque</option>
                  </select>
                </div>

                {modePaiementRecette !== "CASH" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Référence</label>
                    <input
                      type="text"
                      value={referenceRecette}
                      onChange={(e) => setReferenceRecette(e.target.value)}
                      placeholder="Ex : VIR-2026-000123"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-end gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setAfficherFormulaireRecette(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={savingRecette}
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingRecette ? "Enregistrement..." : "Enregistrer la recette"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORMULAIRE NOUVELLE DÉPENSE */}

        {afficherFormulaire && (
          <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Nouvelle dépense</h2>
              <p className="mt-1 text-sm text-slate-500">
                Le montant saisi est le montant total dû. Vous pourrez l'encaisser en une ou plusieurs fois
                ensuite.
              </p>
            </div>

            <form onSubmit={creerDepense} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Libellé *</label>
                  <input
                    type="text"
                    value={libelle}
                    onChange={(e) => setLibelle(e.target.value)}
                    placeholder="Ex : Achat de fournitures"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Catégorie</label>
                  <select
                    value={categorieId}
                    onChange={(e) => setCategorieId(e.target.value)}
                    disabled={loadingCategories}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  >
                    <option value="">
                      {loadingCategories ? "Chargement..." : "Aucune catégorie"}
                    </option>
                    {categories.map((categorie) => (
                      <option key={categorie.id} value={categorie.id}>
                        {categorie.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Montant total (FCFA) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={montantTotal}
                    onChange={(e) => setMontantTotal(e.target.value)}
                    placeholder="Ex : 75000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Date de la dépense *</label>
                  <input
                    type="date"
                    value={dateDepense}
                    onChange={(e) => setDateDepense(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Informations complémentaires..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div className="flex flex-col justify-end gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setAfficherFormulaire(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={savingDepense}
                  className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingDepense ? "Enregistrement..." : "Enregistrer la dépense"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CARTES RAPPORT */}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total recettes</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{formatMontant(rapport?.totalRecettes)}</p>
            <p className="mt-1 text-xs text-slate-400">Paiements et autres recettes</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total dépenses</p>
            <p className="mt-2 text-2xl font-bold text-rose-600">{formatMontant(rapport?.totalDepenses)}</p>
            <p className="mt-1 text-xs text-slate-400">Versements effectivement encaissés</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Solde</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                (rapport?.solde || 0) >= 0 ? "text-indigo-600" : "text-rose-600"
              }`}
            >
              {formatMontant(rapport?.solde)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Recettes − dépenses</p>
          </div>
        </div>

        {/* LISTE DES DÉPENSES (avec statut de paiement) */}

        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">Dépenses</h2>
            <p className="mt-1 text-xs text-slate-400">
              Chaque dépense peut être encaissée en une ou plusieurs fois.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Libellé</th>
                  <th className="px-5 py-3">Catégorie</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Payé</th>
                  <th className="px-5 py-3 text-right">Reste</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loadingDepenses && (
                  <tr>
                    <td colSpan="8" className="px-5 py-10 text-center text-slate-400">
                      Chargement...
                    </td>
                  </tr>
                )}

                {!loadingDepenses && depenses.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-5 py-10 text-center text-slate-400">
                      Aucune dépense enregistrée.
                    </td>
                  </tr>
                )}

                {!loadingDepenses &&
                  depenses.map((d) => (
                    <tr key={d.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(d.dateDepense)}</td>
                      <td className="px-5 py-4 font-medium text-slate-800">{d.libelle}</td>
                      <td className="px-5 py-4 text-slate-600">{d.categorieNom || "-"}</td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-700">
                        {formatMontant(d.montantTotal)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                        {formatMontant(d.montantPaye)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-rose-600">
                        {formatMontant(d.resteAPayer)}
                      </td>
                      <td className="px-5 py-4">
                        <StatutBadge statut={d.statutPaiement} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setDepenseSelectionnee(d)}
                          disabled={d.resteAPayer <= 0}
                          className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {d.resteAPayer <= 0 ? "Payée" : "Encaisser"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* INFORMATIONS */}

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-slate-400">Nombre d'opérations</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">{rapport?.nombreOperations || 0}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">École</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">{user?.ecole?.nom || "-"}</p>
            </div>
          </div>
        </div>

        {/* JOURNAL COMPTABLE */}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">Journal comptable</h2>
            <p className="mt-1 text-xs text-slate-400">
              Toutes les opérations effectivement encaissées (recettes et versements de dépenses).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Libellé</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Référence</th>
                  <th className="px-5 py-3">Mode</th>
                  <th className="px-5 py-3 text-right">Montant</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {(rapport?.operations || []).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-400">
                      Aucune opération comptable.
                    </td>
                  </tr>
                ) : (
                  rapport.operations.map((operation) => (
                    <tr key={operation.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(operation.dateOperation)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{operation.libelle || "-"}</div>

                        {operation.typeOperation === "PAIEMENT_SCOLARITE" && (
                          <div className="mt-1 text-xs text-slate-400">
                            {operation.elevePrenom} {operation.eleveNom}
                          </div>
                        )}

                        {(operation.typeOperation === "DEPENSE" ||
                          operation.typeOperation === "DEPENSE_VERSEMENT") &&
                          operation.categorieDepenseNom && (
                            <div className="mt-1 text-xs text-slate-400">{operation.categorieDepenseNom}</div>
                          )}

                        {operation.typeOperation === "RECETTE_LIBRE" && (
                          <div className="mt-1 text-xs text-slate-400">Recette diverse</div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {operation.nature === "RECETTE" ? (
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

                      <td className="px-5 py-4 text-slate-600">{operation.modePaiement || "-"}</td>

                      <td
                        className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                          operation.nature === "RECETTE" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {operation.nature === "RECETTE" ? "+" : "-"} {formatMontant(operation.montant)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL VERSEMENT */}

      {depenseSelectionnee && (
        <ModalVersement
          depense={depenseSelectionnee}
          onClose={() => setDepenseSelectionnee(null)}
          onSaved={handleVersementSaved}
        />
      )}
    </div>
  );
}