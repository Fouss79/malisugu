"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, FileDown, CheckCircle2 } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";

const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const CORAL = "#D2593F";
const CORAL_SOFT = "#F7E2DB";
const GOLD_SOFT = "#F3E9D2";

const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const STATUT_STYLES = {
  PAYE: { bg: TEAL_SOFT, text: TEAL, label: "Payé" },
  EN_ATTENTE: { bg: GOLD_SOFT, text: "#A9791F", label: "En attente" },
  NON_GENERE: { bg: "#F1F5F9", text: "#64748B", label: "Non généré" },
  DEJA_GENERE: { bg: CORAL_SOFT, text: CORAL, label: "Déjà généré" },
};

function StatutBadge({ statut }) {
  const s = STATUT_STYLES[statut] || { bg: "#F1F5F9", text: "#64748B", label: statut };
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function formatMontant(montant) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(montant || 0) + " FCFA";
}

function formatDateLocal(date) {
  return date.toISOString().split("T")[0];
}

export default function PaiementEnseignantPage() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [debut, setDebut] = useState(formatDateLocal(firstOfMonth));
  const [fin, setFin] = useState(formatDateLocal(today));

  const [moisSelectionne, setMoisSelectionne] = useState(today.getMonth() + 1);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(today.getFullYear());

  const [annees, setAnnees] = useState([]);
  const [anneeId, setAnneeId] = useState("");

  const [previsualisation, setPrevisualisation] = useState([]);
  const [paiements, setPaiements] = useState([]);

  const [loadingPrevisualisation, setLoadingPrevisualisation] = useState(false);
  const [loadingPaiements, setLoadingPaiements] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [marquantPaye, setMarquantPaye] = useState(null);
  const [telechargementId, setTelechargementId] = useState(null);

  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const anneesDisponibles = (() => {
    const anneeCourante = today.getFullYear();
    const liste = [];
    for (let a = anneeCourante + 1; a >= anneeCourante - 4; a--) liste.push(a);
    return liste;
  })();

  const appliquerMois = (mois, annee) => {
    const debutMois = new Date(annee, mois - 1, 1);
    const finMois = new Date(annee, mois, 0);

    setMoisSelectionne(mois);
    setAnneeSelectionnee(annee);
    setDebut(formatDateLocal(debutMois));
    setFin(formatDateLocal(finMois));
  };

  const afficherMessage = (texte) => {
    setMessage(texte);
    setTimeout(() => setMessage(""), 4000);
  };

  // ===== ANNÉES SCOLAIRES =====
  useEffect(() => {
    const loadAnnees = async () => {
      if (!ecoleId) return;

      try {
        const res = await api.get(`/annees/ecole/${ecoleId}`);
        const anneesData = res.data || [];

        setAnnees(anneesData);

        const anneeActive = anneesData.find((a) => a.active);
        if (anneeActive) setAnneeId(anneeActive.id);
        else if (anneesData.length > 0) setAnneeId(anneesData[0].id);
      } catch (err) {
        console.error(err);
      }
    };

    loadAnnees();
  }, [ecoleId]);

  // ===== PRÉVISUALISATION =====
  const chargerPrevisualisation = useCallback(async () => {
    if (!anneeId || !debut || !fin) return;

    setLoadingPrevisualisation(true);

    try {
      const res = await api.get("/paiements/previsualiser", {
        params: { debut, fin, anneeId },
      });

      setPrevisualisation(res.data || []);
    } catch (err) {
      console.error(err);
      setErreur(err.response?.data?.message || "Impossible de charger la prévisualisation.");
    } finally {
      setLoadingPrevisualisation(false);
    }
  }, [debut, fin, anneeId]);

  // ===== PAIEMENTS DÉJÀ GÉNÉRÉS =====
  const chargerPaiements = useCallback(async () => {
    if (!anneeId) return;

    setLoadingPaiements(true);

    try {
      const res = await api.get("/paiements", { params: { anneeId } });
      setPaiements(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPaiements(false);
    }
  }, [anneeId]);

  useEffect(() => {
    chargerPrevisualisation();
  }, [chargerPrevisualisation]);

  useEffect(() => {
    chargerPaiements();
  }, [chargerPaiements]);

  // ===== GÉNÉRER LES PAIEMENTS =====
  const genererPaiements = async () => {
    setGenerating(true);
    setErreur("");

    try {
      const res = await api.post("/paiements/generer", null, {
        params: { debut, fin, anneeId },
      });

      const nb = (res.data || []).length;
      afficherMessage(nb > 0 ? `${nb} paiement(s) généré(s).` : "Aucun nouveau paiement à générer.");

      await Promise.all([chargerPrevisualisation(), chargerPaiements()]);
    } catch (err) {
      console.error(err);
      setErreur(err.response?.data?.message || "Erreur lors de la génération des paiements.");
    } finally {
      setGenerating(false);
    }
  };

  // ===== MARQUER PAYÉ =====
  const marquerPaye = async (id) => {
    setMarquantPaye(id);

    try {
      await api.put(`/paiements/${id}/payer`);
      afficherMessage("Paiement marqué comme payé.");
      await chargerPaiements();
    } catch (err) {
      console.error(err);
      setErreur(err.response?.data?.message || "Erreur lors du marquage.");
    } finally {
      setMarquantPaye(null);
    }
  };

  // ===== TÉLÉCHARGER LE BULLETIN =====
  const telechargerBulletin = async (id) => {
    setTelechargementId(id);

    try {
      const res = await api.get(`/paiements/${id}/bulletin`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `bulletin-salaire-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setErreur("Impossible de télécharger le bulletin.");
    } finally {
      setTelechargementId(null);
    }
  };

  return (
    <div className="space-y-5 p-4">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`, color: INK }}
        >
          <Wallet size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paiements enseignants</h1>
          <p className="text-sm text-slate-500">
            Salaires fixes et heures de vacation, calculés sur la période sélectionnée.
          </p>
        </div>
      </div>

      {/* MESSAGES */}
      {erreur && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {erreur}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {/* FILTRES */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={anneeId}
          onChange={(e) => setAnneeId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
        >
          {annees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
          <select
            value={moisSelectionne}
            onChange={(e) => appliquerMois(Number(e.target.value), anneeSelectionnee)}
            className="rounded-md border-none bg-transparent px-1 py-1 text-sm outline-none focus:ring-0"
          >
            {NOMS_MOIS.map((nom, index) => (
              <option key={nom} value={index + 1}>
                {nom}
              </option>
            ))}
          </select>

          <select
            value={anneeSelectionnee}
            onChange={(e) => appliquerMois(moisSelectionne, Number(e.target.value))}
            className="rounded-md border-none bg-transparent px-1 py-1 text-sm outline-none focus:ring-0"
          >
            {anneesDisponibles.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-300">ou plage personnalisée</span>

        <input
          type="date"
          value={debut}
          onChange={(e) => setDebut(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
        />
        <span className="text-sm text-slate-400">à</span>
        <input
          type="date"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
        />

        <button
          onClick={genererPaiements}
          disabled={generating}
          className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
        >
          {generating ? "Génération..." : "Générer les paiements"}
        </button>
      </div>

      {/* PRÉVISUALISATION */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-slate-800">Aperçu de la période</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Ce qui sera généré si vous cliquez sur "Générer les paiements".
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"
                style={{ background: "#F8F7F2" }}
              >
                <th className="px-4 py-3 font-medium">Enseignant</th>
                <th className="px-4 py-3 font-medium">Heures</th>
                <th className="px-4 py-3 font-medium text-right">Salaire base</th>
                <th className="px-4 py-3 font-medium text-right">Montant heures</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loadingPrevisualisation && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              )}

              {!loadingPrevisualisation && previsualisation.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Rien à prévisualiser sur cette période.
                  </td>
                </tr>
              )}

              {!loadingPrevisualisation &&
                previsualisation.map((p) => (
                  <tr key={p.enseignantId} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {p.enseignantPrenom} {p.enseignantNom}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.totalHeures > 0 ? `${p.totalHeures}h` : "-"}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {p.salaireBase > 0 ? formatMontant(p.salaireBase) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {p.montantHeures > 0 ? formatMontant(p.montantHeures) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {formatMontant(p.montant)}
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={p.statut} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAIEMENTS GÉNÉRÉS */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-slate-800">Paiements générés</h2>
          <p className="mt-0.5 text-xs text-slate-400">Tous les paiements enseignants de l'année scolaire.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"
                style={{ background: "#F8F7F2" }}
              >
                <th className="px-4 py-3 font-medium">Enseignant</th>
                <th className="px-4 py-3 font-medium">Période</th>
                <th className="px-4 py-3 font-medium text-right">Montant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loadingPaiements && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              )}

              {!loadingPaiements && paiements.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Aucun paiement généré pour cette année scolaire.
                  </td>
                </tr>
              )}

              {!loadingPaiements &&
                paiements.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {p.enseignantPrenom} {p.enseignantNom}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.periodeDebut} → {p.periodeFin}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {formatMontant(p.montant)}
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={p.statut} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {p.statut !== "PAYE" && (
                          <button
                            onClick={() => marquerPaye(p.id)}
                            disabled={marquantPaye === p.id}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                            style={{ background: TEAL }}
                          >
                            <CheckCircle2 size={13} />
                            {marquantPaye === p.id ? "..." : "Marquer payé"}
                          </button>
                        )}

                        <button
                          onClick={() => telechargerBulletin(p.id)}
                          disabled={telechargementId === p.id}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          <FileDown size={13} />
                          {telechargementId === p.id ? "..." : "Bulletin"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}