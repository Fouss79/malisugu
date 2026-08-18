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
// ================= MODAL APERÇU =================
function ModalApercu({ resultat, onClose }) {
  const matieres = resultat?.matieres || [];

  const formatNote = (value) => {
  if (value == null || Number.isNaN(Number(value))) return "0.00";
  return Number(value).toFixed(2);
};

  const formatPoints = (value) => {
  if (value == null || Number.isNaN(Number(value))) return "0.00";
  return Number(value).toFixed(2);
};
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-2"
      onClick={onClose}
    >
      <div
        className="mx-auto my-3 w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= EN-TÊTE ================= */}
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="text-center">
            <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">
              Bulletin scolaire
            </h2>

            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {resultat.anneeScolaire || "Année scolaire"}
            </p>

            <p className="mt-0.5 text-xs font-semibold text-indigo-600">
              {resultat.periode || "Période"}
            </p>
          </div>

          {/* Informations élève */}
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 lg:grid-cols-4">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                Élève
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">
                {resultat.prenom} {resultat.nom}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                Matricule
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">
                {resultat.matricule || "—"}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                Classe
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">
                {resultat.classeNom || "—"}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                Niveau
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">
                {resultat.niveauNom || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ================= TABLEAU ================= */}
        <div className="px-4 py-3">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
            Résultats par matière
          </h3>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[9px] uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2 text-left font-semibold">
                      Matière
                    </th>

                    <th className="px-2 py-2 text-left font-semibold">
                      Sous-groupe
                    </th>

                    <th className="px-2 py-2 text-center font-semibold">
                      Classe
                    </th>

                    <th className="px-2 py-2 text-center font-semibold">
                      Examen
                    </th>

                    <th className="px-2 py-2 text-center font-semibold">
                      Moyenne
                    </th>

                    <th className="px-2 py-2 text-center font-semibold">
                      Coef.
                    </th>

                    <th className="px-2 py-2 text-right font-semibold">
                      Points
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {matieres.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-5 text-center text-xs text-slate-400"
                      >
                        Aucune matière disponible
                      </td>
                    </tr>
                  ) : (
                    matieres.map((matiere, index) => (
                      <tr
                        key={`${matiere.matiereId}-${matiere.sousGroupeId || "none"}-${index}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-2 py-1.5 font-medium text-slate-800">
                          {matiere.matiereNom || "—"}
                        </td>

                        <td className="px-2 py-1.5 text-slate-500">
                          {matiere.sousGroupeNom || "—"}
                        </td>

                        <td className="px-2 py-1.5 text-center text-slate-700">
                          {formatNote(matiere.noteClasse)}
                        </td>

                        <td className="px-2 py-1.5 text-center text-slate-700">
                          {formatNote(matiere.noteExamen)}
                        </td>

                        <td className="px-2 py-1.5 text-center font-bold text-slate-800">
                          {formatNote(matiere.moyenne)}
                        </td>

                        <td className="px-2 py-1.5 text-center font-semibold text-slate-700">
                          {matiere.coefficient ?? "—"}
                        </td>

                        <td className="px-2 py-1.5 text-right font-semibold text-slate-800">
                          {formatPoints(matiere.points)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* TOTAL */}
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td
                      colSpan={5}
                      className="px-2 py-2 text-right text-xs font-bold text-slate-700"
                    >
                      Totaux
                    </td>

                    <td className="px-2 py-2 text-center text-xs font-bold text-slate-800">
                      {resultat.totalCoefficients ?? "—"}
                    </td>

                    <td className="px-2 py-2 text-right text-xs font-bold text-slate-800">
                      {formatPoints(resultat.totalPoints)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* ================= MOYENNE / RANG / APPRECIATION ================= */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">

            {/* Moyenne */}
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-2.5 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-indigo-500">
                Moyenne
              </p>

              <p className="mt-1 text-xl font-bold text-indigo-700">
                {resultat.moyenneGenerale != null
                  ? Number(resultat.moyenneGenerale).toFixed(2)
                  : "—"}
              </p>

              <p className="text-[9px] text-indigo-500">
                / 20
              </p>
            </div>

            {/* Rang */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                Rang
              </p>

              <p className="mt-1 text-xl font-bold text-slate-800">
                {resultat.rang ? `${resultat.rang}ᵉ` : "—"}
              </p>

              <p className="text-[9px] text-slate-400">
                dans la classe
              </p>
            </div>

            {/* Appréciation */}
            <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                Appréciation
              </p>

              <div className="mt-2 flex justify-center">
                <AppreciationBadge
                  appreciation={resultat.appreciation}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ================= BOUTONS ================= */}
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5">

          <button
            onClick={() => window.print()}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-900"
          >
            🖨️ Imprimer
          </button>

          <button
            onClick={onClose}
            className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-100"
          >
            Fermer
          </button>

        </div>
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
  const [loadingBulletinId, setLoadingBulletinId] = useState(null);

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

  const ouvrirBulletin = async (resultat) => {
  setLoadingBulletinId(resultat.inscriptionId);

  try {
    const res = await api.get(
      `/resultats/eleve/${resultat.inscriptionId}`,
      {
        params: {
          periode: filtres.periode
        }
      }
    );

    console.log("📚 BULLETIN COMPLET :", res.data);
    console.log("📚 MATIÈRES :", res.data?.matieres);
    console.log("📊 NOMBRE DE MATIÈRES :", res.data?.matieres?.length);

    setApercu(res.data);

  } catch (err) {
    console.error("❌ ERREUR CHARGEMENT BULLETIN");
    console.error("Status :", err.response?.status);
    console.error("Data :", err.response?.data);
    console.error("Message :", err.message);

    alert("Erreur lors du chargement du bulletin.");
  } finally {
    setLoadingBulletinId(null);
  }
};
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
  onClick={() => ouvrirBulletin(r)}
  disabled={loadingBulletinId === r.inscriptionId}
  title="Voir le bulletin"
  className="rounded-md bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
>
  {loadingBulletinId === r.inscriptionId ? (
    <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
  ) : (
    <Eye size={14} />
  )}
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