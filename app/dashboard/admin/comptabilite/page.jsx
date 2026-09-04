
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
  PAYE: "Payé",
  PARTIEL: "Partiel",
  NON_PAYE: "Non payé",
};

function StatutBadge({ statut }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUT_STYLES[statut] || "bg-slate-100 text-slate-600"
      }`}
    >
      {STATUT_LABELS[statut] || statut || "-"}
    </span>
  );
}

function formatMontant(montant) {
  return (
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(montant || 0) + " FCFA"
  );
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* =========================================================
   MODAL REMBOURSEMENT EMPRUNT
========================================================= */

function ModalRemboursement({
  emprunt,
  onClose,
  onSaved,
}) {
  const [montant, setMontant] = useState(
    String(emprunt.resteAPayer || "")
  );

  const [modePaiement, setModePaiement] = useState("CASH");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErreur("");

    const montantNum = Number(montant);

    if (!montantNum || montantNum <= 0) {
      setErreur("Le montant doit être supérieur à zéro.");
      return;
    }

    if (montantNum > Number(emprunt.resteAPayer || 0)) {
      setErreur(
        `Le montant dépasse le reste à payer (${formatMontant(
          emprunt.resteAPayer
        )}).`
      );
      return;
    }

    if (modePaiement !== "CASH" && !reference.trim()) {
      setErreur(
        "La référence est obligatoire pour ce mode de paiement."
      );
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/remboursements-emprunts", {
        empruntId: emprunt.id,
        montant: montantNum,
        modePaiement,
        reference:
          modePaiement === "CASH"
            ? null
            : reference.trim(),
      });

      onSaved();
    } catch (err) {
      console.error(
        "Erreur remboursement emprunt :",
        err
      );

      setErreur(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Erreur lors de l'enregistrement du remboursement."
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
        <h2 className="text-lg font-semibold text-slate-900">
          Rembourser l'emprunt
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {emprunt.libelle}
        </p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-100 bg-slate-50">
          <div className="p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              À rembourser
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              {formatMontant(emprunt.montantARembourser)}
            </p>
          </div>

          <div className="p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Remboursé
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-600">
              {formatMontant(emprunt.montantRembourse)}
            </p>
          </div>

          <div className="p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Reste
            </p>
            <p className="mt-1 text-sm font-bold text-rose-600">
              {formatMontant(emprunt.resteAPayer)}
            </p>
          </div>
        </div>

        {erreur && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erreur}
          </div>
        )}

        <form
          onSubmit={submit}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Montant du remboursement
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={montant}
              onChange={(e) =>
                setMontant(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Mode de paiement
            </label>

            <select
              value={modePaiement}
              onChange={(e) =>
                setModePaiement(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="CASH">Espèces</option>
              <option value="ORANGE_MONEY">
                Orange Money
              </option>
              <option value="MOOV_MONEY">
                Moov Money
              </option>
              <option value="WAVE">Wave</option>
              <option value="VIREMENT">
                Virement
              </option>
              <option value="CHEQUE">Chèque</option>
            </select>
          </div>

          {modePaiement !== "CASH" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Référence
              </label>

              <input
                type="text"
                value={reference}
                onChange={(e) =>
                  setReference(e.target.value)
                }
                placeholder="Ex : VIR-2026-000123"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
              disabled={
                submitting ||
                Number(emprunt.resteAPayer || 0) <= 0
              }
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
            >
              {submitting
                ? "Enregistrement..."
                : "Rembourser"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL NOUVEL EMPRUNT
========================================================= */
function ModalEmprunt({
  onClose,
  onSaved,
  ecoleId,
}) {
  const [libelle, setLibelle] = useState("");

  const [montantEmprunte, setMontantEmprunte] =
    useState("");

  const [montantARembourser, setMontantARembourser] =
    useState("");

  const [dateEmprunt, setDateEmprunt] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [dateEcheance, setDateEcheance] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [erreur, setErreur] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    setErreur("");

    if (!ecoleId) {
      setErreur(
        "Aucune école associée à votre compte."
      );
      return;
    }

    const capital = Number(montantEmprunte);
    const total = Number(montantARembourser);

    // =========================
    // VALIDATION
    // =========================

    if (!libelle.trim()) {
      setErreur(
        "Le libellé est obligatoire."
      );
      return;
    }

    if (!capital || capital <= 0) {
      setErreur(
        "Le montant emprunté doit être supérieur à zéro."
      );
      return;
    }

    if (!total || total <= 0) {
      setErreur(
        "Le montant à rembourser doit être supérieur à zéro."
      );
      return;
    }

    if (total < capital) {
      setErreur(
        "Le montant à rembourser ne peut pas être inférieur au montant emprunté."
      );
      return;
    }

    if (!dateEmprunt) {
      setErreur(
        "La date de l'emprunt est obligatoire."
      );
      return;
    }

    setSubmitting(true);

    try {
      // =========================
      // CRÉATION
      // =========================

      await api.post(
        `/emprunts/ecole/${ecoleId}`,
        {
          libelle: libelle.trim(),

          montantEmprunte: capital,

          montantARembourser: total,

          dateEmprunt:
            `${dateEmprunt}T00:00:00`,

          dateEcheance:
            dateEcheance
              ? `${dateEcheance}T23:59:59`
              : null,
        }
      );

      // =========================
      // SUCCÈS
      // =========================

      onSaved();

    } catch (err) {

      console.error(
        "Erreur création emprunt :",
        err
      );

      setErreur(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Impossible d'enregistrer l'emprunt."
      );

    } finally {
      setSubmitting(false);
    }
  };

  const coutSupplementaire =
    montantEmprunte &&
    montantARembourser
      ? Math.max(
          0,
          Number(montantARembourser) -
            Number(montantEmprunte)
        )
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* =========================
            TITRE
        ========================= */}

        <h2 className="text-lg font-semibold text-slate-900">
          Nouvel emprunt
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Le capital emprunté sera ajouté à la
          trésorerie de l'école.
        </p>

        {/* =========================
            ERREUR
        ========================= */}

        {erreur && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erreur}
          </div>
        )}

        <form
          onSubmit={submit}
          className="mt-6 space-y-5"
        >

          {/* =========================
              LIBELLÉ
          ========================= */}

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
              placeholder="Ex : Prêt bancaire rénovation"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
            />
          </div>

          {/* =========================
              MONTANTS
          ========================= */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Montant emprunté *
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={montantEmprunte}
                onChange={(e) =>
                  setMontantEmprunte(
                    e.target.value
                  )
                }
                placeholder="Ex : 1000000"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />

              <p className="mt-1 text-xs text-slate-400">
                Argent réellement reçu par l'école.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Total à rembourser *
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={montantARembourser}
                onChange={(e) =>
                  setMontantARembourser(
                    e.target.value
                  )
                }
                placeholder="Ex : 1100000"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />

              <p className="mt-1 text-xs text-slate-400">
                Capital + intérêts ou frais éventuels.
              </p>
            </div>

          </div>

          {/* =========================
              DATES
          ========================= */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date de l'emprunt *
              </label>

              <input
                type="date"
                value={dateEmprunt}
                onChange={(e) =>
                  setDateEmprunt(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date d'échéance
              </label>

              <input
                type="date"
                value={dateEcheance}
                onChange={(e) =>
                  setDateEcheance(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

          </div>

          {/* =========================
              RÉSUMÉ
          ========================= */}

          {montantEmprunte &&
            montantARembourser &&
            Number(montantARembourser) >=
              Number(montantEmprunte) && (

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">

              <p className="text-sm font-medium text-indigo-800">
                Résumé financier
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">

                <div>
                  <p className="text-xs text-indigo-500">
                    Capital reçu
                  </p>

                  <p className="font-bold text-indigo-900">
                    {formatMontant(
                      Number(montantEmprunte)
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-indigo-500">
                    Coût supplémentaire
                  </p>

                  <p className="font-bold text-indigo-900">
                    {formatMontant(
                      coutSupplementaire
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-indigo-500">
                    Total à rembourser
                  </p>

                  <p className="font-bold text-indigo-900">
                    {formatMontant(
                      Number(
                        montantARembourser
                      )
                    )}
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* =========================
              BOUTONS
          ========================= */}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Enregistrement..."
                : "Enregistrer l'emprunt"}
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
  const [emprunts, setEmprunts] = useState([]);

  const [loadingRapport, setLoadingRapport] =
    useState(true);
  const [loadingDepenses, setLoadingDepenses] =
    useState(true);
  const [loadingCategories, setLoadingCategories] =
    useState(true);
  const [loadingEmprunts, setLoadingEmprunts] =
    useState(true);

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [depenseSelectionnee, setDepenseSelectionnee] =
    useState(null);

  const [empruntSelectionne, setEmpruntSelectionne] =
    useState(null);

  const [afficherFormulaire, setAfficherFormulaire] =
    useState(false);

  const [afficherFormulaireRecette, setAfficherFormulaireRecette] =
    useState(false);

  const [afficherFormulaireEmprunt, setAfficherFormulaireEmprunt] =
    useState(false);

  /* ===== DÉPENSE ===== */

  const [libelle, setLibelle] = useState("");
  const [montantTotal, setMontantTotal] = useState("");
  const [dateDepense, setDateDepense] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [categorieId, setCategorieId] = useState("");
  const [savingDepense, setSavingDepense] =
    useState(false);

  /* ===== RECETTE ===== */

  const [libelleRecette, setLibelleRecette] =
    useState("");
  const [montantRecette, setMontantRecette] =
    useState("");
  const [modePaiementRecette, setModePaiementRecette] =
    useState("CASH");
  const [referenceRecette, setReferenceRecette] =
    useState("");
  const [savingRecette, setSavingRecette] =
    useState(false);

  const afficherMessage = (texte) => {
    setMessage(texte);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  /* =========================================================
     CHARGEMENT RAPPORT
  ========================================================= */

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
      console.error(
        "Erreur chargement rapport :",
        error
      );

      setErreur(
        error.response?.data?.message ||
          error.message ||
          "Impossible de charger le rapport comptable."
      );
    } finally {
      setLoadingRapport(false);
    }
  };

  /* =========================================================
     CHARGEMENT DÉPENSES
  ========================================================= */

  const chargerDepenses = async () => {
    if (!ecoleId) {
      setLoadingDepenses(false);
      return;
    }

    setLoadingDepenses(true);

    try {
      const res = await api.get(
        `/depenses/ecole/${ecoleId}`
      );

      setDepenses(
        Array.isArray(res.data) ? res.data : []
      );
    } catch (error) {
      console.error(
        "Erreur chargement dépenses :",
        error
      );
    } finally {
      setLoadingDepenses(false);
    }
  };

  /* =========================================================
     CHARGEMENT CATÉGORIES
  ========================================================= */

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
      console.error(
        "Erreur catégories :",
        error
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  /* =========================================================
     CHARGEMENT EMPRUNTS
  ========================================================= */

  const chargerEmprunts = async () => {
    if (!ecoleId) {
      setLoadingEmprunts(false);
      return;
    }

    setLoadingEmprunts(true);

    try {
      const res = await api.get(
        `/emprunts/ecole/${ecoleId}`
      );

      setEmprunts(
        Array.isArray(res.data) ? res.data : []
      );
    } catch (error) {
      console.error(
        "Erreur chargement emprunts :",
        error
      );

      setErreur(
        error.response?.data?.message ||
          error.message ||
          "Impossible de charger les emprunts."
      );
    } finally {
      setLoadingEmprunts(false);
    }
  };

  const rechargerTout = async () => {
    await Promise.all([
      chargerRapport(),
      chargerDepenses(),
      chargerEmprunts(),
    ]);
  };

  /* =========================================================
     CRÉER DÉPENSE
  ========================================================= */

  const creerDepense = async (e) => {
    e.preventDefault();

    setErreur("");
    setMessage("");

    if (!ecoleId) {
      setErreur(
        "Aucune école associée à votre compte."
      );
      return;
    }

    if (!libelle.trim()) {
      setErreur(
        "Le libellé de la dépense est obligatoire."
      );
      return;
    }

    if (!montantTotal || Number(montantTotal) <= 0) {
      setErreur(
        "Le montant doit être supérieur à zéro."
      );
      return;
    }

    setSavingDepense(true);

    try {
      await api.post(
        `/depenses/ecole/${ecoleId}`,
        {
          libelle: libelle.trim(),
          montantTotal: Number(montantTotal),
          dateDepense,
          description:
            description.trim() || null,
          categorieId: categorieId
            ? Number(categorieId)
            : null,
        }
      );

      afficherMessage(
        "Dépense enregistrée."
      );

      setLibelle("");
      setMontantTotal("");
      setDescription("");
      setCategorieId("");

      setAfficherFormulaire(false);

      await chargerDepenses();
    } catch (error) {
      console.error(
        "Erreur création dépense :",
        error
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

  /* =========================================================
     CRÉER RECETTE
  ========================================================= */

  const creerRecette = async (e) => {
    e.preventDefault();

    setErreur("");
    setMessage("");

    if (!ecoleId) {
      setErreur(
        "Aucune école associée à votre compte."
      );
      return;
    }

    if (!libelleRecette.trim()) {
      setErreur(
        "Le libellé de la recette est obligatoire."
      );
      return;
    }

    if (
      !montantRecette ||
      Number(montantRecette) <= 0
    ) {
      setErreur(
        "Le montant doit être supérieur à zéro."
      );
      return;
    }

    if (
      modePaiementRecette !== "CASH" &&
      !referenceRecette.trim()
    ) {
      setErreur(
        "La référence est obligatoire pour ce mode de paiement."
      );
      return;
    }

    setSavingRecette(true);

    try {
      await api.post(
        `/operations-comptables/recette/ecole/${ecoleId}`,
        {
          libelle: libelleRecette.trim(),
          montant: Number(montantRecette),
          modePaiement: modePaiementRecette,
          reference:
            modePaiementRecette === "CASH"
              ? null
              : referenceRecette.trim(),
        }
      );

      afficherMessage(
        "Recette enregistrée avec succès."
      );

      setLibelleRecette("");
      setMontantRecette("");
      setModePaiementRecette("CASH");
      setReferenceRecette("");
      setAfficherFormulaireRecette(false);

      await chargerRapport();
    } catch (error) {
      console.error(
        "Erreur création recette :",
        error
      );

      setErreur(
        error.response?.data?.message ||
          error.message ||
          "Impossible d'enregistrer la recette."
      );
    } finally {
      setSavingRecette(false);
    }
  };

  /* =========================================================
     CALLBACKS
  ========================================================= */

  const handleVersementSaved = async () => {
    setDepenseSelectionnee(null);

    afficherMessage(
      "Versement enregistré avec succès."
    );

    await rechargerTout();
  };

  const handleRemboursementSaved = async () => {
    setEmpruntSelectionne(null);

    afficherMessage(
      "Remboursement enregistré avec succès."
    );

    await rechargerTout();
  };

  const handleEmpruntSaved = async () => {
    setAfficherFormulaireEmprunt(false);

    afficherMessage(
      "Emprunt enregistré avec succès. Le capital a été ajouté à la trésorerie."
    );

    await rechargerTout();
  };

  useEffect(() => {
    if (!ecoleId) return;

    chargerRapport();
    chargerDepenses();
    chargerCategories();
    chargerEmprunts();
  }, [ecoleId]);

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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

       {/* =====================================================
    HEADER
====================================================== */}

<div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
  <div>
    <h1 className="text-2xl font-semibold text-slate-900">
      Comptabilité
    </h1>

    <p className="mt-1 text-sm text-slate-500">
      Suivi global de la trésorerie, des recettes,
      dépenses et emprunts.
    </p>
  </div>

  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
    <button
      onClick={rechargerTout}
      className="col-span-2 flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:col-span-1"
    >
      Actualiser
    </button>

    <button
      onClick={() => setAfficherFormulaireRecette(!afficherFormulaireRecette)}
      className="flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
    >
      {afficherFormulaireRecette ? "Fermer" : "+ Recette"}
    </button>

    <button
      onClick={() => setAfficherFormulaire(!afficherFormulaire)}
      className="flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
    >
      {afficherFormulaire ? "Fermer" : "+ Dépense"}
    </button>

    <button
      onClick={() => setAfficherFormulaireEmprunt(true)}
      className="flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
    >
      + Emprunt
    </button>
  </div>
</div>

        {/* =====================================================
            MESSAGES
        ====================================================== */}

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
            CARTES RAPPORT
        ====================================================== */}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

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
              Recettes effectivement encaissées
            </p>
          </div>

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
              Dépenses effectivement payées
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Emprunts
            </p>

            <p className="mt-2 text-2xl font-bold text-indigo-600">
              {formatMontant(
                rapport?.totalEmprunts
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Capitaux reçus
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Remboursements
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600">
              {formatMontant(
                rapport?.totalRemboursements
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Remboursements effectués
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Trésorerie
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                (rapport?.solde || 0) >= 0
                  ? "text-slate-900"
                  : "text-rose-600"
              }`}
            >
              {formatMontant(rapport?.solde)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Recettes + emprunts − dépenses − remboursements
            </p>
          </div>
        </div>

        {/* =====================================================
            LISTE EMPRUNTS
        ====================================================== */}

        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-800">
                Emprunts
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Suivi du capital reçu et des remboursements.
              </p>
            </div>

            <button
              onClick={() =>
                setAfficherFormulaireEmprunt(true)
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              + Nouvel emprunt
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3">
                    Emprunt
                  </th>

                  <th className="px-5 py-3">
                    Prêteur
                  </th>

                  <th className="px-5 py-3 text-right">
                    Capital reçu
                  </th>

                  <th className="px-5 py-3 text-right">
                    À rembourser
                  </th>

                  <th className="px-5 py-3 text-right">
                    Remboursé
                  </th>

                  <th className="px-5 py-3 text-right">
                    Reste
                  </th>

                  <th className="px-5 py-3">
                    Statut
                  </th>

                  <th className="px-5 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loadingEmprunts && (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Chargement...
                    </td>
                  </tr>
                )}

                {!loadingEmprunts &&
                  emprunts.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-5 py-10 text-center text-slate-400"
                      >
                        Aucun emprunt enregistré.
                      </td>
                    </tr>
                  )}

                {!loadingEmprunts &&
                  emprunts.map((emprunt) => (
                    <tr
                      key={emprunt.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(
                          emprunt.dateEmprunt
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">
                          {emprunt.libelle}
                        </div>

                        {emprunt.dateEcheance && (
                          <div className="mt-1 text-xs text-slate-400">
                            Échéance :{" "}
                            {formatDate(
                              emprunt.dateEcheance
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {emprunt.preteur || "-"}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-indigo-600">
                        {formatMontant(
                          emprunt.montantEmprunte
                        )}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-slate-700">
                        {formatMontant(
                          emprunt.montantARembourser
                        )}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                        {formatMontant(
                          emprunt.montantRembourse
                        )}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-rose-600">
                        {formatMontant(
                          emprunt.resteAPayer
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatutBadge
                          statut={
                            emprunt.statutPaiement
                          }
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() =>
                            setEmpruntSelectionne(
                              emprunt
                            )
                          }
                          disabled={
                            Number(
                              emprunt.resteAPayer || 0
                            ) <= 0
                          }
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {Number(
                            emprunt.resteAPayer || 0
                          ) <= 0
                            ? "Soldé"
                            : "Rembourser"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================
            JOURNAL COMPTABLE
        ====================================================== */}

        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">
              Journal comptable
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Toutes les opérations ayant un impact sur la trésorerie.
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

                {(rapport?.operations || []).length ===
                0 ? (
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
                    (operation) => {
                      const estRecette =
                        operation.nature ===
                        "RECETTE";

                      const estEmprunt =
                        operation.nature ===
                        "EMPRUNT";

                      const estRemboursement =
                        operation.nature ===
                        "REMBOURSEMENT_EMPRUNT";

                      return (
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
                              {operation.libelle ||
                                "-"}
                            </div>

                            {operation.typeOperation ===
                              "PAIEMENT_SCOLARITE" && (
                              <div className="mt-1 text-xs text-slate-400">
                                {
                                  operation.elevePrenom
                                }{" "}
                                {
                                  operation.eleveNom
                                }
                              </div>
                            )}

                            {operation.typeOperation ===
                              "RECETTE_LIBRE" && (
                              <div className="mt-1 text-xs text-slate-400">
                                Recette diverse
                              </div>
                            )}

                            {operation.typeOperation ===
                              "DEPENSE_VERSEMENT" &&
                              operation.categorieDepenseNom && (
                                <div className="mt-1 text-xs text-slate-400">
                                  {
                                    operation.categorieDepenseNom
                                  }
                                </div>
                              )}

                            {estEmprunt && (
                              <div className="mt-1 text-xs text-indigo-500">
                                Capital reçu
                              </div>
                            )}

                            {estRemboursement && (
                              <div className="mt-1 text-xs text-amber-600">
                                Remboursement d'emprunt
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">

                            {estEmprunt ? (
                              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                EMPRUNT
                              </span>
                            ) : estRemboursement ? (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                REMBOURSEMENT
                              </span>
                            ) : estRecette ? (
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
                            {operation.reference ||
                              "-"}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {operation.modePaiement ||
                              "-"}
                          </td>

                          <td
                            className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                              estRecette ||
                              estEmprunt
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                          >
                            {estRecette ||
                            estEmprunt
                              ? "+"
                              : "-"}{" "}
                            {formatMontant(
                              operation.montant
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )
                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================
            DÉPENSES
        ====================================================== */}

        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">
              Dépenses
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Chaque dépense peut être payée en une ou plusieurs fois.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Libellé</th>
                  <th className="px-5 py-3">Catégorie</th>
                  <th className="px-5 py-3 text-right">
                    Total
                  </th>
                  <th className="px-5 py-3 text-right">
                    Payé
                  </th>
                  <th className="px-5 py-3 text-right">
                    Reste
                  </th>
                  <th className="px-5 py-3">
                    Statut
                  </th>
                  <th className="px-5 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {loadingDepenses && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Chargement...
                    </td>
                  </tr>
                )}

                {!loadingDepenses &&
                  depenses.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-5 py-10 text-center text-slate-400"
                      >
                        Aucune dépense enregistrée.
                      </td>
                    </tr>
                  )}

                {!loadingDepenses &&
                  depenses.map((d) => (
                    <tr
                      key={d.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(
                          d.dateDepense
                        )}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {d.libelle}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {d.categorieNom || "-"}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-slate-700">
                        {formatMontant(
                          d.montantTotal
                        )}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                        {formatMontant(
                          d.montantPaye
                        )}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-rose-600">
                        {formatMontant(
                          d.resteAPayer
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatutBadge
                          statut={
                            d.statutPaiement
                          }
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() =>
                            setDepenseSelectionnee(
                              d
                            )
                          }
                          disabled={
                            Number(
                              d.resteAPayer || 0
                            ) <= 0
                          }
                          className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {Number(
                            d.resteAPayer || 0
                          ) <= 0
                            ? "Payée"
                            : "Encaisser"}
                        </button>
                      </td>
                    </tr>
                  ))}

              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================
            INFORMATIONS
        ====================================================== */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-8">

            <div>
              <p className="text-xs text-slate-400">
                Nombre d'opérations
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-800">
                {rapport?.nombreOperations ||
                  0}
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

            <div>
              <p className="text-xs text-slate-400">
                Nombre d'emprunts
              </p>

              <p className="mt-1 text-lg font-semibold text-indigo-600">
                {emprunts.length}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* =====================================================
          MODAL DÉPENSE
      ====================================================== */}

      {depenseSelectionnee && (
        <ModalVersement
          depense={depenseSelectionnee}
          onClose={() =>
            setDepenseSelectionnee(null)
          }
          onSaved={handleVersementSaved}
        />
      )}
      {/* =====================================================
    MODAL NOUVELLE RECETTE
====================================================== */}

{afficherFormulaireRecette && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    onClick={() => setAfficherFormulaireRecette(false)}
  >
    <div
      className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-lg font-semibold text-slate-900">Nouvelle recette</h2>
      <p className="mt-1 text-sm text-slate-500">
        Pour un revenu qui n'est pas un paiement d'élève : don, subvention, location, etc.
      </p>

      {erreur && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {erreur}
        </div>
      )}

      <form onSubmit={creerRecette} className="mt-5 space-y-4">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <option value="WAVE">Wave</option>
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
                required
              />
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setAfficherFormulaireRecette(false)}
            className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-1"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={savingRecette}
            className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
          >
            {savingRecette ? "Enregistrement..." : "Enregistrer la recette"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* =====================================================
    MODAL NOUVELLE DÉPENSE
====================================================== */}

{afficherFormulaire && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    onClick={() => setAfficherFormulaire(false)}
  >
    <div
      className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-lg font-semibold text-slate-900">Nouvelle dépense</h2>
      <p className="mt-1 text-sm text-slate-500">
        Le montant saisi est le montant total dû. Vous pourrez l'encaisser en une ou plusieurs fois ensuite.
      </p>

      {erreur && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {erreur}
        </div>
      )}

      <form onSubmit={creerDepense} className="mt-5 space-y-4">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <label className="mb-2 block text-sm font-medium text-slate-700">Catégorie</label>
          <select
            value={categorieId}
            onChange={(e) => setCategorieId(e.target.value)}
            disabled={loadingCategories}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          >
            <option value="">{loadingCategories ? "Chargement..." : "Aucune catégorie"}</option>
            {categories.map((categorie) => (
              <option key={categorie.id} value={categorie.id}>
                {categorie.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Informations complémentaires..."
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setAfficherFormulaire(false)}
            className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-1"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={savingDepense}
            className="w-full rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
          >
            {savingDepense ? "Enregistrement..." : "Enregistrer la dépense"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* =====================================================
          MODAL REMBOURSEMENT
      ====================================================== */}

      {empruntSelectionne && (
        <ModalRemboursement
          emprunt={empruntSelectionne}
          onClose={() =>
            setEmpruntSelectionne(null)
          }
          onSaved={
            handleRemboursementSaved
          }
        />
      )}

      {/* =====================================================
          MODAL NOUVEL EMPRUNT
      ====================================================== */}

      {afficherFormulaireEmprunt && (
       <ModalEmprunt
  ecoleId={ecoleId}
  onClose={() =>
    setAfficherFormulaireEmprunt(false)
  }
  onSaved={handleEmpruntSaved}
/>
      )}
    </div>
  );
}

/* =========================================================
   MODAL VERSEMENT DÉPENSE
========================================================= */

function ModalVersement({
  depense,
  onClose,
  onSaved,
}) {
  const [montant, setMontant] = useState(
    String(depense.resteAPayer || "")
  );

  const [modePaiement, setModePaiement] =
    useState("CASH");

  const [reference, setReference] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [erreur, setErreur] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    setErreur("");

    const montantNum = Number(montant);

    if (!montantNum || montantNum <= 0) {
      setErreur(
        "Le montant doit être supérieur à zéro."
      );
      return;
    }

    if (
      montantNum >
      Number(depense.resteAPayer || 0)
    ) {
      setErreur(
        `Le montant dépasse le reste à payer (${formatMontant(
          depense.resteAPayer
        )}).`
      );
      return;
    }

    if (
      modePaiement !== "CASH" &&
      !reference.trim()
    ) {
      setErreur(
        "La référence est obligatoire pour ce mode de paiement."
      );
      return;
    }

    setSubmitting(true);

    try {
      await api.post(
        "/paiements-depense",
        {
          depenseId: depense.id,
          montant: montantNum,
          modePaiement,
          reference:
            modePaiement === "CASH"
              ? null
              : reference.trim(),
        }
      );

      onSaved();
    } catch (err) {
      console.error(err);

      setErreur(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Erreur lors de l'enregistrement."
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
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <h2 className="text-lg font-semibold text-slate-900">
          Encaisser un versement
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {depense.libelle}
        </p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-100 bg-slate-50">

          <div className="p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Total
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              {formatMontant(
                depense.montantTotal
              )}
            </p>
          </div>

          <div className="p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Payé
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-600">
              {formatMontant(
                depense.montantPaye
              )}
            </p>
          </div>

          <div className="p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Reste
            </p>
            <p className="mt-1 text-sm font-bold text-rose-600">
              {formatMontant(
                depense.resteAPayer
              )}
            </p>
          </div>

        </div>

        {erreur && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erreur}
          </div>
        )}

        <form
          onSubmit={submit}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Montant à verser
            </label>

            <input
              type="number"
              min="1"
              value={montant}
              onChange={(e) =>
                setMontant(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Mode de paiement
            </label>

            <select
              value={modePaiement}
              onChange={(e) =>
                setModePaiement(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            >
              <option value="CASH">
                Espèces
              </option>
              <option value="ORANGE_MONEY">
                Orange Money
              </option>
              <option value="MOOV_MONEY">
                Moov Money
              </option>
              <option value="WAVE">
                Wave
              </option>
              <option value="VIREMENT">
                Virement
              </option>
              <option value="CHEQUE">
                Chèque
              </option>
            </select>
          </div>

          {modePaiement !== "CASH" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Référence
              </label>

              <input
                type="text"
                value={reference}
                onChange={(e) =>
                  setReference(
                    e.target.value
                  )
                }
                placeholder="Ex : OM-2026-000123"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
                required
              />
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex-1"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 sm:flex-1"
            >
              {submitting
                ? "Enregistrement..."
                : "Encaisser"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}
