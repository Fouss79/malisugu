"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  Search,
  Wallet,
  X,
  CreditCard,
  CircleDollarSign,
  TrendingUp,
  AlertCircle,
  Filter,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { BanniereTarifsIncomplets } from "../component/BanniereTarifsIncomplets";
import api from "../../../../lib/api";

/* =========================================================
   PALETTE (identique au reste de l'application)
========================================================= */
const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const GOLD_DARK = "#8A6A21";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const CORAL = "#D2593F";
const CORAL_SOFT = "#F7E2DB";

const NOMS_MOIS = {
  1: "Janvier",
  2: "Février",
  3: "Mars",
  4: "Avril",
  5: "Mai",
  6: "Juin",
  7: "Juillet",
  8: "Août",
  9: "Septembre",
  10: "Octobre",
  11: "Novembre",
  12: "Décembre",
};

const STATUT_STYLES = {
  PAYE: { background: TEAL_SOFT, color: TEAL },
  PARTIEL: { background: `${GOLD}1A`, color: GOLD_DARK },
  NON_PAYE: { background: CORAL_SOFT, color: CORAL },
};

function formatMontant(valeur) {
  if (valeur == null) return "—";

  return new Intl.NumberFormat("fr-FR").format(valeur) + " FCFA";
}

function StatutBadge({ statut }) {
  const style = STATUT_STYLES[statut] || { background: "#F1F5F9", color: "#64748B" };

  const labels = {
    PAYE: "Payé",
    PARTIEL: "Partiel",
    NON_PAYE: "Non payé",
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={style}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />
      {labels[statut] || statut}
    </span>
  );
}

/* =========================================================
   MODAL ENCAISSEMENT
========================================================= */

function ModalEncaissement({ ligne, onClose, onSaved }) {
  const [moisDisponibles, setMoisDisponibles] = useState([]);
  const [moisSelectionne, setMoisSelectionne] = useState("");
  const [loadingMois, setLoadingMois] = useState(false);

  const [montant, setMontant] = useState("");
  const [modePaiement, setModePaiement] = useState("CASH");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");

  // Type ANNUEL = payable par tranches mensuelles.
  // Type UNIQUE = payé en une seule fois.
  const estAnnuel = ligne.typeFraisFrequence === "ANNUEL";

  /* Chargement du suivi mensuel (uniquement pour un type ANNUEL) */

  useEffect(() => {
    if (!estAnnuel || !ligne.id) {
      setMoisDisponibles([]);
      return;
    }

    setLoadingMois(true);

    api
      .get(`/ligne-frais/${ligne.id}/mois-paiement`)
      .then((res) => {
        const mois = Array.isArray(res.data) ? res.data : [];

        setMoisDisponibles(mois);

        const premierNonPaye = mois.find((m) => m.resteAPayer > 0);
        const premier = premierNonPaye || mois[0];

        if (premier) {
          setMoisSelectionne(`${premier.mois}-${premier.annee}`);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMois(false));
  }, [ligne.id, estAnnuel]);

  /* Mois sélectionné (détail montant dû / payé / reste pour ce mois) */

  const moisChoisi = useMemo(() => {
    if (!estAnnuel || !moisSelectionne) return null;

    const [moisNum, anneeNum] = moisSelectionne.split("-").map(Number);

    return moisDisponibles.find((m) => m.mois === moisNum && m.annee === anneeNum) || null;
  }, [estAnnuel, moisSelectionne, moisDisponibles]);

  /* Valeurs affichées dans le résumé */

  const totalAffiche = estAnnuel ? moisChoisi?.montantDu : ligne.montantTotal;
  const payeAffiche = estAnnuel ? moisChoisi?.montantPaye : ligne.montantPaye;
  const resteAffiche = estAnnuel ? moisChoisi?.resteAPayer : ligne.resteAPayer;

  /* Pré-remplissage du montant */

  useEffect(() => {
    const reste = estAnnuel ? moisChoisi?.resteAPayer : ligne.resteAPayer;

    setMontant(reste > 0 ? String(reste) : "");
  }, [estAnnuel, moisChoisi?.mois, moisChoisi?.annee, ligne.resteAPayer]);

  const submit = async (e) => {
    e.preventDefault();
    setErreur("");

    const montantNum = Number(montant);

    if (!montantNum || montantNum <= 0) {
      setErreur("Le montant doit être supérieur à zéro.");
      return;
    }

    if (estAnnuel && !moisChoisi) {
      setErreur("Veuillez sélectionner un mois.");
      return;
    }

    if (montantNum > ligne.resteAPayer) {
      setErreur(`Le montant dépasse le reste à payer (${formatMontant(ligne.resteAPayer)}).`);
      return;
    }

    if (modePaiement !== "CASH" && !reference.trim()) {
      setErreur("La référence est obligatoire pour ce mode de paiement.");
      return;
    }

    const payload = {
      inscriptionId: ligne.inscriptionId,
      codeTypeFrais: ligne.typeFraisCode,
      mois: estAnnuel ? moisChoisi.mois : null,
      annee: estAnnuel ? moisChoisi.annee : null,
      montant: montantNum,
      modePaiement,
      reference: modePaiement === "CASH" ? null : reference.trim(),
    };

    setSubmitting(true);

   try {
  const res = await api.post("/paiements", payload);

  const paiement = res.data;

  if (!paiement?.id) {
    throw new Error("Le paiement a été enregistré mais son identifiant est introuvable.");
  }

  onSaved(paiement.id);

} catch (err) {

      setErreur(
        err.response?.data?.message || err.response?.data?.error || "Erreur lors de l'encaissement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const boutonDesactive =
    submitting || ligne.resteAPayer <= 0 || (estAnnuel && !loadingMois && !moisChoisi);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}

        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: TEAL_SOFT, color: TEAL }}
              >
                <Wallet size={21} />
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">Encaisser un paiement</h2>

                <p className="truncate text-xs text-slate-500 sm:text-sm">
                  {ligne.elevePrenom} {ligne.eleveNom}
                  {" • "}
                  {ligne.classeNom}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {/* MOIS (uniquement pour un type ANNUEL, payable par tranches) */}

          {estAnnuel && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mois à encaisser
              </label>

              {loadingMois ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  <Loader2 size={15} className="animate-spin" />
                  Chargement des mois...
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={moisSelectionne}
                    onChange={(e) => setMoisSelectionne(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                  >
                    {moisDisponibles.map((m) => (
                      <option key={`${m.mois}-${m.annee}`} value={`${m.mois}-${m.annee}`}>
                        {NOMS_MOIS[m.mois]} {m.annee} — reste {formatMontant(m.resteAPayer)}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* RESUME */}

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-800">
                {ligne.typeFraisLibelle}

                {estAnnuel && moisChoisi ? (
                  <span className="ml-1" style={{ color: TEAL }}>
                    • {NOMS_MOIS[moisChoisi.mois]} {moisChoisi.annee}
                  </span>
                ) : (
                  <span className="ml-1 text-slate-400">• Paiement unique</span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</p>
                <p className="mt-1 text-xs font-bold text-slate-700 sm:text-sm">
                  {formatMontant(totalAffiche)}
                </p>
              </div>

              <div className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Payé</p>
                <p className="mt-1 text-xs font-bold sm:text-sm" style={{ color: TEAL }}>
                  {formatMontant(payeAffiche)}
                </p>
              </div>

              <div className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Reste</p>
                <p className="mt-1 text-xs font-bold sm:text-sm" style={{ color: CORAL }}>
                  {formatMontant(resteAffiche)}
                </p>
              </div>
            </div>

            {estAnnuel && (
              <div className="border-t border-slate-100 px-4 py-2">
                <p className="text-[11px] text-slate-400">
                  Total ligne : {formatMontant(ligne.montantTotal)} • Reste global :{" "}
                  <span style={{ color: CORAL }}>{formatMontant(ligne.resteAPayer)}</span>
                </p>
              </div>
            )}
          </div>

          {/* ERREUR */}

          {erreur && (
            <div
              className="flex gap-3 rounded-xl border p-3 text-sm"
              style={{ background: CORAL_SOFT, color: CORAL, borderColor: "transparent" }}
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />

              <p>{erreur}</p>
            </div>
          )}

          {/* FORMULAIRE */}

          <form onSubmit={submit} className="space-y-4">
            {/* MONTANT */}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Montant à encaisser
              </label>

              <div className="relative">
                <CircleDollarSign
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="number"
                  min="1"
                  placeholder="Ex : 25 000"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                  required
                />
              </div>
            </div>

            {/* MODE */}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mode de paiement
              </label>

              <div className="relative">
                <CreditCard
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                >
                  <option value="CASH">Espèces</option>
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="MOOV_MONEY">Moov Money</option>
                  <option value="VIREMENT">Virement</option>
                  <option value="CHEQUE">Chèque</option>
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* REFERENCE */}

            {modePaiement !== "CASH" && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Référence de transaction
                </label>

                <input
                  type="text"
                  placeholder="Ex : OM-2026-000123"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                  required
                />
              </div>
            )}

            {/* ACTIONS */}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:flex-1"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={boutonDesactive}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Encaissement...
                  </>
                ) : (
                  <>
                    <Wallet size={17} />
                    Encaisser
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CARTE STATISTIQUE
========================================================= */

function StatCard({ label, value, icon: Icon, iconBg, iconColor, valueColor }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>

          <p className="mt-2 text-lg font-bold sm:text-xl" style={{ color: valueColor }}>
            {value}
          </p>
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CARTE MOBILE
========================================================= */

function PaiementCard({ ligne, onEncaisser }) {
  const disabled = ligne.resteAPayer <= 0;
  const estAnnuel = ligne.typeFraisFrequence === "ANNUEL";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {/* TOP */}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
            style={{ background: TEAL_SOFT, color: TEAL }}
          >
            {(ligne.elevePrenom?.[0] || "").toUpperCase()}
            {(ligne.eleveNom?.[0] || "").toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">
              {ligne.elevePrenom} {ligne.eleveNom}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">{ligne.classeNom}</p>
          </div>
        </div>

        <StatutBadge statut={ligne.statutPaiement} />
      </div>

      {/* TYPE */}

      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
        <div>
          <p className="text-xs font-semibold text-slate-700">{ligne.typeFraisLibelle}</p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {estAnnuel ? "Payable par mois" : "Paiement unique"}
          </p>
        </div>

        <p className="text-xs font-bold text-slate-700">{formatMontant(ligne.montantTotal)}</p>
      </div>

      {/* MONTANTS */}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Déjà payé</p>

          <p className="mt-1 text-sm font-bold" style={{ color: TEAL }}>
            {formatMontant(ligne.montantPaye)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Reste</p>

          <p className="mt-1 text-sm font-bold" style={{ color: CORAL }}>
            {formatMontant(ligne.resteAPayer)}
          </p>
        </div>
      </div>

      {/* ACTION */}

      <button
        onClick={() => onEncaisser(ligne)}
        disabled={disabled}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        style={!disabled ? { background: `linear-gradient(135deg, ${INK}, #182746)` } : undefined}
      >
        <Wallet size={15} />
        {disabled ? "Paiement terminé" : "Encaisser"}
      </button>
    </div>
  );
}

/* =========================================================
   PAGE PRINCIPALE
========================================================= */

export default function PaiementForm() {
  const { user } = useAuth();

  const ecoleId = user?.ecole?.id;

  const [lignesFrais, setLignesFrais] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [classeFilter, setClasseFilter] = useState("");

  const [typeFraisFilter, setTypeFraisFilter] = useState("");

  const [statutFilter, setStatutFilter] = useState("");

  const [ligneSelectionnee, setLigneSelectionnee] = useState(null);

  const [toast, setToast] = useState(null);

  const [showFilters, setShowFilters] = useState(false);

  /* =====================================================
     CHARGEMENT
     Avec le nouveau modèle, l'API renvoie déjà UNE seule
     ligne par (inscription, typeFrais) — plus besoin de
     regroupement côté client.
  ===================================================== */

  const loadLignesFrais = () => {
    if (!ecoleId) return;

    setLoading(true);

    api
      .get(`/ligne-frais/ecole/${ecoleId}`)
      .then((res) => {
        setLignesFrais(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error(err);
        setLignesFrais([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLignesFrais();
  }, [ecoleId]);

  /* =====================================================
     OPTIONS FILTRES
  ===================================================== */

  const classesDisponibles = useMemo(() => {
    const set = new Set(lignesFrais.map((l) => l.classeNom).filter(Boolean));

    return Array.from(set).sort();
  }, [lignesFrais]);

  const typesFraisDisponibles = useMemo(() => {
    const map = new Map();

    lignesFrais.forEach((l) => {
      if (l.typeFraisCode && !map.has(l.typeFraisCode)) {
        map.set(l.typeFraisCode, l.typeFraisLibelle);
      }
    });

    return Array.from(map.entries());
  }, [lignesFrais]);

  /* =====================================================
     FILTRAGE + TRI
  ===================================================== */

  const lignesAffichees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return lignesFrais
      .filter((l) => {
        const nomComplet = `${l.eleveNom || ""} ${l.elevePrenom || ""}`.toLowerCase();

        const matchSearch = !q || nomComplet.includes(q);

        const matchClasse = !classeFilter || l.classeNom === classeFilter;

        const matchType = !typeFraisFilter || l.typeFraisCode === typeFraisFilter;

        const matchStatut = !statutFilter || l.statutPaiement === statutFilter;

        return matchSearch && matchClasse && matchType && matchStatut;
      })
      .sort((a, b) => {
        const classeCompare = (a.classeNom || "").localeCompare(b.classeNom || "");

        if (classeCompare !== 0) return classeCompare;

        return `${a.eleveNom || ""}${a.elevePrenom || ""}`.localeCompare(
          `${b.eleveNom || ""}${b.elevePrenom || ""}`
        );
      });
  }, [lignesFrais, search, classeFilter, typeFraisFilter, statutFilter]);

  /* =====================================================
     TOTAUX
  ===================================================== */

  const totaux = useMemo(
    () => ({
      total: lignesAffichees.reduce((s, l) => s + (l.montantTotal || 0), 0),

      paye: lignesAffichees.reduce((s, l) => s + (l.montantPaye || 0), 0),

      reste: lignesAffichees.reduce((s, l) => s + (l.resteAPayer || 0), 0),
    }),
    [lignesAffichees]
  );

  /* =====================================================
     PAIEMENT ENREGISTRÉ
  ===================================================== */

  const handleSaved = (paiementId) => {
  setLigneSelectionnee(null);

  setToast("Paiement encaissé avec succès");

  setTimeout(() => {
    setToast(null);
  }, 3000);

  loadLignesFrais();

  if (paiementId) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/paiements/${paiementId}/recus`;
    window.open(url, "_blank");
  }
};

  const resetFilters = () => {
    setSearch("");
    setClasseFilter("");
    setTypeFraisFilter("");
    setStatutFilter("");
  };

  const nombreFiltresActifs = [classeFilter, typeFraisFilter, statutFilter].filter(Boolean).length;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-full space-y-5 pb-8 sm:space-y-6">
      <BanniereTarifsIncomplets />

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold"
            style={{ background: `${GOLD}1A`, color: GOLD_DARK }}
          >
            <Wallet size={13} />
            GESTION DES PAIEMENTS
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Encaissements</h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Gérez les frais scolaires et enregistrez facilement les paiements des élèves.
          </p>
        </div>

        <div className="hidden rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Lignes affichées
          </p>

          <p className="mt-0.5 text-lg font-bold text-slate-800">{lignesAffichees.length}</p>
        </div>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Total dû"
          value={formatMontant(totaux.total)}
          icon={CircleDollarSign}
          iconBg="#F1F5F9"
          iconColor="#475569"
          valueColor="#1E293B"
        />

        <StatCard
          label="Déjà payé"
          value={formatMontant(totaux.paye)}
          icon={TrendingUp}
          iconBg={TEAL_SOFT}
          iconColor={TEAL}
          valueColor={TEAL}
        />

        <StatCard
          label="Reste à encaisser"
          value={formatMontant(totaux.reste)}
          icon={AlertCircle}
          iconBg={CORAL_SOFT}
          iconColor={CORAL}
          valueColor={CORAL}
        />
      </div>

      {/* FILTRES */}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Recherche */}

        <div className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

            <input
              type="text"
              placeholder="Rechercher par nom ou prénom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/10"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition"
            style={
              showFilters || nombreFiltresActifs > 0
                ? { borderColor: `${GOLD}66`, background: `${GOLD}1A`, color: GOLD_DARK }
                : { borderColor: "#E2E8F0", color: "#475569" }
            }
          >
            <Filter size={17} />
            Filtres
            {nombreFiltresActifs > 0 && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] text-white"
                style={{ background: GOLD }}
              >
                {nombreFiltresActifs}
              </span>
            )}
          </button>
        </div>

        {/* FILTRES AVANCES */}

        {showFilters && (
          <div className="border-t border-slate-100 bg-slate-50/60 p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Classe
                </label>

                <select
                  value={classeFilter}
                  onChange={(e) => setClasseFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                >
                  <option value="">Toutes les classes</option>

                  {classesDisponibles.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Type de frais
                </label>

                <select
                  value={typeFraisFilter}
                  onChange={(e) => setTypeFraisFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                >
                  <option value="">Tous les types</option>

                  {typesFraisDisponibles.map(([code, libelle]) => (
                    <option key={code} value={code}>
                      {libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Statut
                </label>

                <select
                  value={statutFilter}
                  onChange={(e) => setStatutFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                >
                  <option value="">Tous les statuts</option>
                  <option value="NON_PAYE">Non payé</option>
                  <option value="PARTIEL">Partiel</option>
                  <option value="PAYE">Payé</option>
                </select>
              </div>
            </div>

            {nombreFiltresActifs > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 text-xs font-semibold"
                style={{ color: GOLD_DARK }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* =================================================
          MOBILE
      ================================================= */}

      <div className="space-y-3 lg:hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-4 py-12 text-center shadow-sm">
            <Loader2 size={25} className="animate-spin" style={{ color: GOLD }} />

            <p className="mt-3 text-sm font-medium text-slate-600">Chargement des frais...</p>
          </div>
        )}

        {!loading && lignesAffichees.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search size={20} />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-700">Aucun résultat</p>

            <p className="mt-1 text-xs text-slate-400">Aucune ligne de frais ne correspond à vos critères.</p>
          </div>
        )}

        {!loading &&
          lignesAffichees.map((l) => (
            <PaiementCard key={l.id} ligne={l} onEncaisser={setLigneSelectionnee} />
          ))}
      </div>

      {/* =================================================
          DESKTOP TABLE
      ================================================= */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-5 py-4 font-bold">Élève</th>
                <th className="px-5 py-4 font-bold">Classe</th>
                <th className="px-5 py-4 font-bold">Type de frais</th>
                <th className="px-5 py-4 font-bold">Total</th>
                <th className="px-5 py-4 font-bold">Payé</th>
                <th className="px-5 py-4 font-bold">Statut</th>
                <th className="px-5 py-4 text-right font-bold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <Loader2 size={24} className="mx-auto animate-spin" style={{ color: GOLD }} />

                    <p className="mt-3 text-sm text-slate-400">Chargement des frais...</p>
                  </td>
                </tr>
              )}

              {!loading && lignesAffichees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Search size={20} />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-700">Aucun résultat</p>

                    <p className="mt-1 text-xs text-slate-400">
                      Aucune ligne de frais ne correspond à vos critères.
                    </p>
                  </td>
                </tr>
              )}

              {!loading &&
                lignesAffichees.map((l) => {
                  const estAnnuel = l.typeFraisFrequence === "ANNUEL";

                  return (
                    <tr key={l.id} className="group transition hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-bold"
                            style={{ background: TEAL_SOFT, color: TEAL }}
                          >
                            {(l.elevePrenom?.[0] || "").toUpperCase()}
                            {(l.eleveNom?.[0] || "").toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {l.elevePrenom} {l.eleveNom}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400">Élève</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                          {l.classeNom}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">{l.typeFraisLibelle}</p>

                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {estAnnuel ? "Payable par mois" : "Paiement unique"}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {formatMontant(l.montantTotal)}
                      </td>

                      <td className="px-5 py-4 font-semibold" style={{ color: TEAL }}>
                        {formatMontant(l.montantPaye)}
                      </td>

                      <td className="px-5 py-4">
                        <StatutBadge statut={l.statutPaiement} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setLigneSelectionnee(l)}
                          disabled={l.resteAPayer <= 0}
                          className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                          style={
                            l.resteAPayer > 0
                              ? { background: `linear-gradient(135deg, ${INK}, #182746)` }
                              : undefined
                          }
                        >
                          <Wallet size={14} />
                          {l.resteAPayer <= 0 ? "Payé" : "Encaisser"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!loading && lignesAffichees.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
            <p className="text-xs text-slate-400">
              {lignesAffichees.length} élément{lignesAffichees.length > 1 ? "s" : ""} affiché
              {lignesAffichees.length > 1 ? "s" : ""}
            </p>

            <p className="text-xs font-semibold text-slate-500">
              Reste à encaisser :{" "}
              <span style={{ color: CORAL }}>{formatMontant(totaux.reste)}</span>
            </p>
          </div>
        )}
      </div>

      {/* MODAL */}

      {ligneSelectionnee && (
        <ModalEncaissement
          ligne={ligneSelectionnee}
          onClose={() => setLigneSelectionnee(null)}
          onSaved={handleSaved}
        />
      )}

      {/* TOAST */}

      {toast && (
        <div className="fixed bottom-4 left-4 right-4 z-[60] sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: TEAL }}
            >
              <CheckCircle2 size={16} />
            </div>

            <span>{toast}</span>

            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 transition hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}