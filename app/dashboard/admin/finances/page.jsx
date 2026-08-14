"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Search, Wallet } from "lucide-react";
import { BanniereTarifsIncomplets } from "../component/BanniereTarifsIncomplets";
import api from "../../../../lib/api";

const NOMS_MOIS = {
  1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril",
  5: "Mai", 6: "Juin", 7: "Juillet", 8: "Août",
  9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre"
};

const STATUT_STYLES = {
  PAYE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PARTIEL: "bg-amber-50 text-amber-700 ring-amber-200",
  NON_PAYE: "bg-rose-50 text-rose-700 ring-rose-200"
};

function formatMontant(valeur) {
  if (valeur == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(valeur) + " FCFA";
}

function StatutBadge({ statut }) {
  const style = STATUT_STYLES[statut] || "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
      {statut}
    </span>
  );
}

// ================= MODAL D'ENCAISSEMENT =================
function ModalEncaissement({ ligne, onClose, onSaved }) {
  const [lignesMensuelles, setLignesMensuelles] = useState([]);
  const [moisSelectionne, setMoisSelectionne] = useState(
    ligne.mois && ligne.annee
      ? `${ligne.mois}-${ligne.annee}`
      : ""
  );
  const [montant, setMontant] = useState("");
  const [modePaiement, setModePaiement] = useState("CASH");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");
  const [lignesFrais, setLignesFrais] = useState([]);

  const estMensuel = ligne.typeFraisCode === "SCOLARITE";

  // ================= CHARGE TOUS LES MOIS DE SCOLARITÉ DE CET ÉLÈVE =================
  useEffect(() => {
    if (!ligne.inscriptionId) return;

    api.get(`/ligne-frais/inscription/${ligne.inscriptionId}`)
      .then((res) => {
        const data = res.data;

        const mois = (Array.isArray(data) ? data : []).filter(
          (l) => l.typeFraisCode === "SCOLARITE" && l.mois != null
        );

        // ✅ Tri par année puis par mois
        const moisTries = mois.sort((a, b) => {
          if (!a.annee && !b.annee) return 0;
          if (!a.annee) return -1;
          if (!b.annee) return 1;

          if (a.annee !== b.annee) {
            return a.annee - b.annee;
          }
          return a.mois - b.mois;
        });

        setLignesMensuelles(moisTries);
        setLignesFrais(moisTries);

        if (moisTries.length > 0) {
          const premier = moisTries[0];
          setMoisSelectionne(`${premier.mois}-${premier.annee}`);
        }
      })
      .catch(console.error);
  }, [ligne]);

  // ================= LIGNE RÉELLEMENT CONCERNÉE PAR LE PAIEMENT =================
  const lignePaiement = useMemo(() => {
    if (!moisSelectionne) return ligne;

    const [moisNum, anneeNum] = moisSelectionne
        .split("-")
        .map(Number);

    return (
        lignesMensuelles.find(
            l => l.mois === moisNum && l.annee === anneeNum
        ) || ligne
    );
  }, [moisSelectionne, lignesMensuelles, ligne]);

  // Pré-remplit le montant avec le reste à payer de la ligne sélectionnée
  useEffect(() => {
    setMontant(lignePaiement.resteAPayer > 0 ? String(lignePaiement.resteAPayer) : "");
  }, [lignePaiement.id]);

  const submit = async (e) => {
    e.preventDefault();
    setErreur("");

    const montantNum = Number(montant);

    if (!montantNum || montantNum <= 0) {
      setErreur("Le montant doit être supérieur à zéro");
      return;
    }
    if (montantNum > lignePaiement.resteAPayer) {
      setErreur(`Le montant dépasse le reste à payer (${formatMontant(lignePaiement.resteAPayer)})`);
      return;
    }
    if (modePaiement !== "CASH" && !reference.trim()) {
      setErreur("La référence est obligatoire pour ce mode de paiement");
      return;
    }

    const payload = {
      inscriptionId: lignePaiement.inscriptionId,
      codeTypeFrais: lignePaiement.typeFraisCode,
      mois: lignePaiement.mois ?? null,
      montant: montantNum,
      modePaiement,
      reference: modePaiement === "CASH" ? null : reference
    };

    setSubmitting(true);
    try {
      await api.post("/paiements", payload);
      onSaved();
    } catch (err) {
      console.error(err);
      setErreur(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de l'encaissement"
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
        <h2 className="text-lg font-semibold text-slate-900">Encaisser un paiement</h2>
        <p className="mb-4 text-sm text-slate-500">
          {ligne.elevePrenom} {ligne.eleveNom} — {ligne.classeNom}
        </p>

        {/* Sélecteur de mois — uniquement pour les frais mensuels */}
        {estMensuel && lignesMensuelles.length > 0 && (
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Mois à encaisser
            </label>
            <select
              value={moisSelectionne}
              onChange={(e) => setMoisSelectionne(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >
              {lignesMensuelles.map((l) => (
                <option
                  key={l.id}
                  value={`${l.mois}-${l.annee}`}
                >
                  {NOMS_MOIS[l.mois]} {l.annee} - reste {formatMontant(l.resteAPayer)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Résumé de la ligne réellement sélectionnée */}
        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-700">
            {lignePaiement.typeFraisLibelle}
            {lignePaiement.mois ? (
              <span className="ml-1.5 text-indigo-600">
                — {NOMS_MOIS[lignePaiement.mois]} {lignePaiement.annee}
              </span>
            ) : (
              <span className="ml-1.5 text-slate-400">— Annuel</span>
            )}
          </p>
          <div className="mt-1 grid grid-cols-3 gap-2 text-slate-600">
            <p><span className="text-slate-400">Total :</span> {formatMontant(lignePaiement.montantTotal)}</p>
            <p><span className="text-slate-400">Payé :</span> {formatMontant(lignePaiement.montantPaye)}</p>
            <p className="font-semibold text-rose-600">Reste : {formatMontant(lignePaiement.resteAPayer)}</p>
          </div>
        </div>

        {erreur && (
          <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
            {erreur}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input
            type="number"
            placeholder="Montant à encaisser"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            required
          />

          <select
            value={modePaiement}
            onChange={(e) => setModePaiement(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="CASH">Espèces</option>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="MOOV_MONEY">Moov Money</option>
            <option value="VIREMENT">Virement</option>
            <option value="CHEQUE">Chèque</option>
          </select>

          {modePaiement !== "CASH" && (
            <input
              type="text"
              placeholder="Référence de la transaction"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              required
            />
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              disabled={submitting || lignePaiement.resteAPayer <= 0}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Encaissement..." : "Encaisser"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= PAGE PRINCIPALE =================
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

  const loadLignesFrais = () => {
    if (!ecoleId) return;
    setLoading(true);

    api.get(`/ligne-frais/ecole/${ecoleId}`)
      .then((res) => setLignesFrais(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error(err);
        setLignesFrais([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLignesFrais();
  }, [ecoleId]);

  // ================= OPTIONS DE FILTRE =================
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

  // ================= FILTRAGE + TRI =================
  const lignesFiltrees = useMemo(() => {
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

        const eleveCompare = `${a.eleveNom || ""}${a.elevePrenom || ""}`.localeCompare(
          `${b.eleveNom || ""}${b.elevePrenom || ""}`
        );
        if (eleveCompare !== 0) return eleveCompare;

        const typeCompare = (a.typeFraisLibelle || "").localeCompare(b.typeFraisLibelle || "");
        if (typeCompare !== 0) return typeCompare;

        if (!a.annee && !b.annee) return 0;
        if (!a.annee) return -1;
        if (!b.annee) return 1;
        if (a.annee !== b.annee) return a.annee - b.annee;
        if (!a.mois && !b.mois) return 0;
        if (!a.mois) return -1;
        if (!b.mois) return 1;
        return a.mois - b.mois;
      });
  }, [lignesFrais, search, classeFilter, typeFraisFilter, statutFilter]);

  // ================= REGROUPEMENT PAR ÉLÈVE POUR LES FRAIS MENSUELS =================
  const lignesAffichees = useMemo(() => {
    const map = new Map();

    lignesFiltrees.forEach((l) => {
      const cleGroupe = l.mois != null
        ? `${l.inscriptionId}-${l.typeFraisCode}`
        : `${l.id}`;

      if (!map.has(cleGroupe)) {
        map.set(cleGroupe, { ...l, _nbMois: l.mois != null ? 1 : null, _totalTous: l.montantTotal, _payeTous: l.montantPaye, _resteTous: l.resteAPayer });
      } else if (l.mois != null) {
        const existant = map.get(cleGroupe);
        existant._nbMois += 1;
        existant._totalTous += l.montantTotal;
        existant._payeTous += l.montantPaye;
        existant._resteTous += l.resteAPayer;
        if (l.resteAPayer > 0 && existant.resteAPayer <= 0) {
          Object.assign(existant, l, {
            _nbMois: existant._nbMois,
            _totalTous: existant._totalTous,
            _payeTous: existant._payeTous,
            _resteTous: existant._resteTous
          });
        }
      }
    });

    return Array.from(map.values());
  }, [lignesFiltrees]);

  const totaux = useMemo(
    () => ({
      total: lignesFiltrees.reduce((s, l) => s + (l.montantTotal || 0), 0),
      paye: lignesFiltrees.reduce((s, l) => s + (l.montantPaye || 0), 0),
      reste: lignesFiltrees.reduce((s, l) => s + (l.resteAPayer || 0), 0)
    }),
    [lignesFiltrees]
  );

  const handleSaved = () => {
    setLigneSelectionnee(null);
    setToast("✓ Paiement encaissé avec succès");
    setTimeout(() => setToast(null), 3000);
    loadLignesFrais();
  };

  return (
    <div className="space-y-5">
       <BanniereTarifsIncomplets/>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Encaissements</h1>
        <p className="text-sm text-slate-500">
          Frais dus par élève, triés par classe — cliquez sur "Encaisser" pour enregistrer un paiement.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40">
          <p className="text-xs font-medium text-slate-400">Total dû</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{formatMontant(totaux.total)}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40">
          <p className="text-xs font-medium text-slate-400">Déjà payé</p>
          <p className="mt-1 text-xl font-semibold text-emerald-600">{formatMontant(totaux.paye)}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40">
          <p className="text-xs font-medium text-slate-400">Reste à encaisser</p>
          <p className="mt-1 text-xl font-semibold text-rose-600">{formatMontant(totaux.reste)}</p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <select
          value={classeFilter}
          onChange={(e) => setClasseFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-indigo-400"
        >
          <option value="">Toutes les classes</option>
          {classesDisponibles.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={typeFraisFilter}
          onChange={(e) => setTypeFraisFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-indigo-400"
        >
          <option value="">Tous les types de frais</option>
          {typesFraisDisponibles.map(([code, libelle]) => (
            <option key={code} value={code}>{libelle}</option>
          ))}
        </select>

        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-indigo-400"
        >
          <option value="">Tous les statuts</option>
          <option value="NON_PAYE">Non payé</option>
          <option value="PARTIEL">Partiel</option>
          <option value="PAYE">Payé</option>
        </select>
      </div>

      {/* TABLEAU */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Élève</th>
                <th className="px-4 py-3 font-medium">Classe</th>
                <th className="px-4 py-3 font-medium">Type de frais</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payé</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    Chargement...
                  </td>
                </tr>
              )}

              {!loading && lignesAffichees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    Aucune ligne de frais pour ces critères
                  </td>
                </tr>
              )}

              {!loading &&
                lignesAffichees.map((l) => (
                  <tr key={l.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{l.elevePrenom} {l.eleveNom}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{l.classeNom}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {l.typeFraisLibelle}
                      {l._nbMois && (
                        <span className="ml-1.5 text-xs text-slate-400">({l._nbMois} mois)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatMontant(l._nbMois ? l._totalTous : l.montantTotal)}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-600">
                      {formatMontant(l._nbMois ? l._payeTous : l.montantPaye)}
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={l.statutPaiement} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setLigneSelectionnee(l)}
                        disabled={(l._nbMois ? l._resteTous : l.resteAPayer) <= 0}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Wallet size={14} />
                        Encaisser
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {ligneSelectionnee && (
        <ModalEncaissement
          ligne={ligneSelectionnee}
          onClose={() => setLigneSelectionnee(null)}
          onSaved={handleSaved}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}