"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Search } from "lucide-react";

const NOMS_MOIS = {
  1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril",
  5: "Mai", 6: "Juin", 7: "Juillet", 8: "Août",
  9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre"
};

const MODE_LABELS = {
  CASH: "Espèces",
  ORANGE_MONEY: "Orange Money",
  MOOV_MONEY: "Moov Money",
  VIREMENT: "Virement",
  CHEQUE: "Chèque"
};

const MODE_STYLES = {
  CASH: "bg-slate-100 text-slate-600",
  ORANGE_MONEY: "bg-orange-50 text-orange-600",
  MOOV_MONEY: "bg-blue-50 text-blue-600",
  VIREMENT: "bg-indigo-50 text-indigo-600",
  CHEQUE: "bg-violet-50 text-violet-600"
};

function formatMontant(valeur) {
  if (valeur == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(valeur) + " FCFA";
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function ModeBadge({ mode }) {
  const style = MODE_STYLES[mode] || "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {MODE_LABELS[mode] || mode}
    </span>
  );
}

export default function PaiementsListePage() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFraisFilter, setTypeFraisFilter] = useState("");
  const [moisFilter, setMoisFilter] = useState("");
  const [anneeScolaireFilter, setAnneeScolaireFilter] = useState("");

  const loadPaiements = () => {
    if (!ecoleId) return;
    setLoading(true);

    fetch(`http://localhost:8080/api/paiements/ecole/${ecoleId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => setPaiements(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setPaiements([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPaiements();
  }, [ecoleId]);

  // ================= OPTIONS DE FILTRE DÉDUITES DES DONNÉES =================
  const typesFraisDisponibles = useMemo(() => {
    const map = new Map();
    paiements.forEach(p => {
      if (p.typeFraisCode && !map.has(p.typeFraisCode)) {
        map.set(p.typeFraisCode, p.typeFraisLibelle);
      }
    });
    return Array.from(map.entries()); // [code, libelle]
  }, [paiements]);

  const anneesScolairesDisponibles = useMemo(() => {
    const set = new Set(paiements.map(p => p.anneeScolaireNom).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [paiements]);

  // ================= FILTRAGE =================
  const paiementsFiltres = useMemo(() => {
    const q = search.trim().toLowerCase();

    return paiements.filter(p => {
      const matchSearch =
        !q ||
        `${p.eleveNom} ${p.elevePrenom} ${p.reference ?? ""} ${p.typeFraisLibelle}`
          .toLowerCase()
          .includes(q);

      const matchType = !typeFraisFilter || p.typeFraisCode === typeFraisFilter;
      const matchMois = !moisFilter || String(p.mois) === String(moisFilter);
      const matchAnnee = !anneeScolaireFilter || p.anneeScolaireNom === anneeScolaireFilter;

      return matchSearch && matchType && matchMois && matchAnnee;
    });
  }, [paiements, search, typeFraisFilter, moisFilter, anneeScolaireFilter]);

  const totalPeriode = useMemo(
    () => paiementsFiltres.reduce((sum, p) => sum + (p.montant || 0), 0),
    [paiementsFiltres]
  );

  const filtresActifs = typeFraisFilter || moisFilter || anneeScolaireFilter || search;

  const reinitialiserFiltres = () => {
    setSearch("");
    setTypeFraisFilter("");
    setMoisFilter("");
    setAnneeScolaireFilter("");
  };

  return (
    <div className="space-y-5">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historique des paiements</h1>
          <p className="text-sm text-slate-500">
            {loading
              ? "Chargement..."
              : `${paiementsFiltres.length} paiement${paiementsFiltres.length > 1 ? "s" : ""} — total ${formatMontant(totalPeriode)}`}
          </p>
        </div>
      </div>

      {/* BARRE DE FILTRES */}
      <div className="flex flex-wrap items-center gap-3">

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un élève, une référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

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
          value={moisFilter}
          onChange={(e) => setMoisFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-indigo-400"
        >
          <option value="">Tous les mois</option>
          {Object.entries(NOMS_MOIS).map(([num, nom]) => (
            <option key={num} value={num}>{nom}</option>
          ))}
        </select>

        <select
          value={anneeScolaireFilter}
          onChange={(e) => setAnneeScolaireFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-indigo-400"
        >
          <option value="">Toutes les années scolaires</option>
          {anneesScolairesDisponibles.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {filtresActifs && (
          <button
            onClick={reinitialiserFiltres}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Élève</th>
                <th className="px-4 py-3 font-medium">Type de frais</th>
                <th className="px-4 py-3 font-medium">Année scolaire</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Référence</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    Chargement des paiements...
                  </td>
                </tr>
              )}

              {!loading && paiementsFiltres.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    Aucun paiement ne correspond à ces critères.
                  </td>
                </tr>
              )}

              {!loading && paiementsFiltres.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{p.elevePrenom} {p.eleveNom}</p>
                    <p className="text-xs text-slate-400">{p.classeNom}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.typeFraisLibelle}
                    {p.mois && (
                      <span className="text-slate-400"> — {NOMS_MOIS[p.mois]} {p.annee}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.anneeScolaireNom}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">
                    {formatMontant(p.montant)}
                  </td>
                  <td className="px-4 py-3">
                    <ModeBadge mode={p.modePaiement} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.reference || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(p.datePaiement)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}