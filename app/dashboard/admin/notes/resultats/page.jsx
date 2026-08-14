"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";
import { Eye, Download, Printer, Search } from "lucide-react";

const STATUT_STYLES = {
  "Très Bien": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Bien": "bg-teal-50 text-teal-700 ring-teal-200",
  "Assez Bien": "bg-sky-50 text-sky-700 ring-sky-200",
  "Passable": "bg-amber-50 text-amber-700 ring-amber-200",
  "Insuffisant": "bg-rose-50 text-rose-700 ring-rose-200"
};

function AppreciationBadge({ appreciation }) {
  const style = STATUT_STYLES[appreciation] || "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
      {appreciation}
    </span>
  );
}

// ================= MODAL APERÇU =================
function ModalApercu({ resultat, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">Aperçu du résultat</h2>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Élève</span>
            <span className="text-sm font-semibold text-slate-800">{resultat.prenom} {resultat.nom}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Matricule</span>
            <span className="text-sm font-medium text-slate-700">{resultat.matricule}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Classe</span>
            <span className="text-sm font-medium text-slate-700">{resultat.classeNom}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Rang</span>
            <span className="text-sm font-medium text-slate-700">{resultat.rang}ᵉ</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-slate-500">Moyenne générale</span>
            <span className="text-2xl font-bold text-indigo-600">
              {resultat.moyenneGenerale != null ? resultat.moyenneGenerale.toFixed(2) : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Appréciation</span>
            <AppreciationBadge appreciation={resultat.appreciation} />
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

export default function ResultatsPage() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  const [cycles, setCycles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [apercu, setApercu] = useState(null);

  const [filtres, setFiltres] = useState({
    cycleId: "",
    classeId: "",
    anneeScolaireId: "",
    periode: ""
  });

  // ================= INIT =================
  useEffect(() => {
    if (!ecoleId) return;

    api.get(`/cycles/ecole/${ecoleId}`).then((r) => setCycles(r.data || []));
    api.get(`/classes/ecole/${ecoleId}`).then((r) => setClasses(r.data || []));
    api.get(`/annees/ecole/${ecoleId}`).then((r) => {
      setAnnees(r.data || []);
      const active = (r.data || []).find((a) => a.active);
      if (active) setFiltres((prev) => ({ ...prev, anneeScolaireId: active.id.toString() }));
    });
  }, [ecoleId]);

  // ================= CLASSES FILTRÉES PAR CYCLE =================
  const classesDuCycle = useMemo(() => {
    if (!filtres.cycleId) return classes;
    return classes.filter((c) => c.niveau?.cycle?.id === Number(filtres.cycleId));
  }, [classes, filtres.cycleId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltres((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "cycleId" ? { classeId: "" } : {})
    }));
  };

  // ================= CHARGEMENT DES RÉSULTATS =================
  const loadResultats = async () => {
    const { classeId, anneeScolaireId, periode } = filtres;

    setLoading(true);
    try {
      if (classeId) {
        const res = await api.get(`/resultats/classe/${classeId}`, {
          params: { anneeScolaireId, periode }
        });
        setResultats(res.data || []);
      } else if (ecoleId && anneeScolaireId && periode) {
        const res = await api.get(`/resultats/ecole/${ecoleId}`, {
          params: { anneeScolaireId, periode }
        });
        setResultats(res.data || []);
      } else {
        setResultats([]);
      }
    } catch (err) {
      console.error(err);
      setResultats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filtres.anneeScolaireId && filtres.periode) {
      loadResultats();
    } else {
      setResultats([]);
    }
  }, [filtres.classeId, filtres.anneeScolaireId, filtres.periode, ecoleId]);

  // ================= TRI : cycle > classe > rang =================
  const resultatsTries = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...resultats]
      .filter((r) => {
        const nomComplet = `${r.nom} ${r.prenom} ${r.matricule}`.toLowerCase();
        return !q || nomComplet.includes(q);
      })
      .sort((a, b) => {
        const cycleCompare = (a.cycleNom || "").localeCompare(b.cycleNom || "");
        if (cycleCompare !== 0) return cycleCompare;

        const classeCompare = (a.classeNom || "").localeCompare(b.classeNom || "");
        if (classeCompare !== 0) return classeCompare;

        return (a.rang || 999) - (b.rang || 999);
      });
  }, [resultats, search]);

  // ================= ACTIONS =================
  const telechargerPdf = async (resultat) => {
    try {
      const res = await api.get("/bulletins/generate", {
        params: {
          inscriptionId: resultat.inscriptionId,
          classeId: classes.find((c) => c.nomComplet === resultat.classeNom)?.id,
          anneeId: filtres.anneeScolaireId,
          periode: filtres.periode
        },
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulletin_${resultat.matricule}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du téléchargement du PDF");
    }
  };

  const imprimerTableau = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Résultats</h1>
          <p className="text-sm text-slate-500">Moyennes générales et appréciations par élève.</p>
        </div>

        <button
          onClick={imprimerTableau}
          disabled={resultatsTries.length === 0}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Printer size={16} />
          Imprimer la liste
        </button>
      </div>

      {/* ================= FILTRES ================= */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <select name="cycleId" value={filtres.cycleId} onChange={handleChange} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400">
          <option value="">Tous les cycles</option>
          {cycles.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>

        <select name="classeId" value={filtres.classeId} onChange={handleChange} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400">
          <option value="">Toutes les classes</option>
          {classesDuCycle.map((c) => <option key={c.id} value={c.id}>{c.nomComplet}</option>)}
        </select>

        <select name="anneeScolaireId" value={filtres.anneeScolaireId} onChange={handleChange} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400">
          <option value="">Année</option>
          {annees.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
        </select>

        <select name="periode" value={filtres.periode} onChange={handleChange} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400">
          <option value="">Période</option>
          <option value="Trimestre 1">Trimestre 1</option>
          <option value="Trimestre 2">Trimestre 2</option>
          <option value="Trimestre 3">Trimestre 3</option>
        </select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* ================= TABLEAU ================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40 print:border-0 print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Matricule</th>
                <th className="px-4 py-3 font-medium">Élève</th>
                <th className="px-4 py-3 font-medium">Cycle</th>
                <th className="px-4 py-3 font-medium">Classe</th>
                <th className="px-4 py-3 font-medium text-center">Rang</th>
                <th className="px-4 py-3 font-medium text-center">Moyenne</th>
                <th className="px-4 py-3 font-medium">Appréciation</th>
                <th className="px-4 py-3 font-medium text-right print:hidden">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Chargement...</td></tr>
              )}

              {!loading && resultatsTries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    Choisissez une année et une période pour afficher les résultats
                  </td>
                </tr>
              )}

              {!loading && resultatsTries.map((r) => (
                <tr key={r.inscriptionId} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-slate-500">{r.matricule}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.prenom} {r.nom}</td>
                  <td className="px-4 py-3 text-slate-500">{r.cycleNom || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.classeNom}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{r.rang}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">
                    {r.moyenneGenerale != null ? r.moyenneGenerale.toFixed(2) : "—"}
                  </td>
                  <td className="px-4 py-3"><AppreciationBadge appreciation={r.appreciation} /></td>
                  <td className="px-4 py-3 text-right print:hidden">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setApercu(r)}
                        title="Aperçu"
                        className="rounded-md bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => telechargerPdf(r)}
                        title="Télécharger PDF"
                        className="rounded-md bg-indigo-50 p-1.5 text-indigo-600 transition hover:bg-indigo-100"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {apercu && <ModalApercu resultat={apercu} onClose={() => setApercu(null)} />}
    </div>
  );
}