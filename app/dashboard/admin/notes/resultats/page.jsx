"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";
import { Eye, Download, Printer, Search, X, GraduationCap, Award, Send, Mail, AlertCircle } from "lucide-react";

const ROUTES = {
  secondaire: {
    classe: (id) => `/resultats/classe/${id}`,
    ecole: (id) => `/resultats/ecole/${id}`,
    eleve: (id) => `/resultats/eleve/${id}`,
    pdf: "/bulletins/generate",
    envoyer: "/bulletins/envoyer-parent",
    envoyerClasse: "/bulletins/envoyer-parent-classe",
  },
  primaire: {
    classe: (id) => `/resultats/primaire/classe/${id}`,
    ecole: (id) => `/resultats/primaire/ecole/${id}`,
    pdfEleve: ({ classeId, anneeId, inscriptionId, mois }) =>
      `/bulletins-mensuels/${classeId}/${anneeId}/eleve/${inscriptionId}/pdf?mois=${encodeURIComponent(mois)}`,
    envoyer: "/bulletins/envoyer-parent-primaire",
    envoyerClasse: "/bulletins/envoyer-parent-classe-primaire",
  },
};

const MOIS = ["SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE", "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN"];
const PERIODES = Array.from({ length: 9 }, (_, i) => `${i + 1}${i === 0 ? "ère" : "ème"} Periode`);
const APPRECIATIONS = {
  "Très Bien": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Bien: "bg-teal-50 text-teal-700 ring-teal-200",
  "Assez Bien": "bg-sky-50 text-sky-700 ring-sky-200",
  Passable: "bg-amber-50 text-amber-700 ring-amber-200",
  Insuffisant: "bg-rose-50 text-rose-700 ring-rose-200",
};
const selectClass = "h-10 w-full rounded-lg border border-[#DEDCD0] bg-[#FAFAF7] px-3 text-xs font-medium text-[#1B2333] outline-none focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/10";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

function normalizeText(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}
function isPrimaire(cycleName = "") {
  const name = normalizeText(cycleName);
  return name.includes("PRIMAIRE") || name.includes("FONDAMENTAL") || name.includes("PREMIER CYCLE") || name.includes("1ER CYCLE");
}
function kindForCycle(cycleName = "") {
  return isPrimaire(cycleName) ? "primaire" : "secondaire";
}
function fmt(value) {
  return value == null || value === "" || !Number.isFinite(Number(value)) ? "—" : Number(value).toFixed(2);
}
function apiError(error) {
  const data = error?.response?.data;
  if (typeof data === "string" && !data.startsWith("%PDF")) return data;
  return data?.message || data?.error || error?.message || "Une erreur est survenue.";
}
async function readPdf(response) {
  const raw = response.data;
  const blob = raw instanceof Blob ? raw : new Blob([raw], { type: "application/pdf" });
  if (!blob.size) throw new Error("Le bulletin PDF est vide.");
  // Une erreur JSON peut arriver même avec responseType: blob.
  if (blob.type.includes("json") || blob.type.includes("text/html")) {
    const body = await blob.text();
    try {
      const parsed = JSON.parse(body);
      throw new Error(parsed.message || parsed.error || "Le serveur n'a pas renvoyé de PDF.");
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error("Le serveur n'a pas renvoyé de PDF.");
      throw error;
    }
  }
  const signature = await blob.slice(0, 5).text();
  if (signature !== "%PDF-") throw new Error("La réponse du serveur n'est pas un PDF valide.");
  return blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
}
function AppreciationBadge({ value }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${APPRECIATIONS[value] || "bg-slate-100 text-slate-600 ring-slate-200"}`}>{value || "—"}</span>;
}
function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}
function InfoBox({ label, value }) {
  return <div className="min-w-0 rounded-lg bg-[#F6F5F0] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-wider text-[#8A93A5]">{label}</p><p className="mt-1 truncate text-xs font-semibold text-[#1B2333]">{value ?? "—"}</p></div>;
}

function BulletinModal({ bulletin, resultat, periode, annee, onClose, onDownload, onSend, sending, downloading }) {
  const matieres = Array.isArray(bulletin?.matieres) ? bulletin.matieres : [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101B33]/70 p-3 backdrop-blur-sm print:static print:bg-white" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Aperçu du bulletin secondaire" onClick={(e) => e.stopPropagation()} className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl print:max-h-none print:overflow-visible print:shadow-none">
        <header className="flex shrink-0 items-start justify-between border-b border-[#DEDCD0] p-5">
          <div><h2 className="flex items-center gap-2 text-lg font-bold"><GraduationCap className="text-[#C89B3C]" size={22} /> Bulletin secondaire</h2><p className="mt-1 text-xs text-[#5B6478]">{annee} · {periode} · Notes sur 20</p></div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 hover:bg-slate-100 print:hidden"><X size={19} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible">
          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <InfoBox label="Élève" value={`${bulletin.prenom || resultat.prenom || ""} ${bulletin.nom || resultat.nom || ""}`} />
            <InfoBox label="Matricule" value={bulletin.matricule || resultat.matricule} />
            <InfoBox label="Classe" value={bulletin.classeNom || resultat.classeNom} />
            <InfoBox label="Niveau" value={bulletin.niveauNom || resultat.niveauNom} />
          </div>
          <h3 className="mb-3 text-sm font-bold">Résultats par matière</h3>
          <div className="overflow-x-auto rounded-xl border border-[#DEDCD0]">
            <table className="w-full min-w-[540px] text-xs">
              <thead className="bg-[#F6F5F0] text-[10px] uppercase text-[#5B6478]"><tr><th className="px-3 py-3 text-left">Matière</th><th className="px-3 py-3 text-left">Sous-groupe</th><th className="px-3 py-3 text-center">Classe</th><th className="px-3 py-3 text-center">Examen</th><th className="px-3 py-3 text-center">Moyenne</th><th className="px-3 py-3 text-center">Coef.</th><th className="px-3 py-3 text-right">Points</th></tr></thead>
              <tbody className="divide-y divide-[#ECEAE2]">
                {matieres.length ? matieres.map((m, i) => <tr key={`${m.matiereId || m.matiereNom || "matiere"}-${i}`}><td className="px-3 py-3 font-semibold">{m.matiereNom || m.nom || "—"}</td><td className="px-3 py-3 text-[#5B6478]">{m.sousGroupeNom || "—"}</td><td className="px-3 py-3 text-center">{fmt(m.noteClasse ?? m.nClass)}</td><td className="px-3 py-3 text-center">{fmt(m.noteExamen ?? m.nExem)}</td><td className="px-3 py-3 text-center font-bold">{fmt(m.moyenne)}</td><td className="px-3 py-3 text-center">{m.coefficient ?? "—"}</td><td className="px-3 py-3 text-right font-bold">{fmt(m.points)}</td></tr>) : <tr><td colSpan={7} className="px-3 py-10 text-center text-[#8A93A5]">Aucun détail de matière disponible.</td></tr>}
              </tbody>
              <tfoot className="border-t-2 bg-[#F6F5F0] font-bold"><tr><td colSpan={5} className="px-3 py-3 text-right">Totaux</td><td className="px-3 py-3 text-center">{bulletin.totalCoefficients ?? "—"}</td><td className="px-3 py-3 text-right">{fmt(bulletin.totalPoints)}</td></tr></tfoot>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#E8D8AF] bg-[#FBF7EA] p-4"><p className="text-xs text-[#8B681E]">Moyenne générale</p><p className="mt-2 text-2xl font-bold text-[#8B681E]">{fmt(bulletin.moyenneGenerale ?? resultat.moyenneGenerale)} <span className="text-xs">/20</span></p></div>
            <div className="rounded-xl border border-[#D8DEEA] bg-[#F5F7FB] p-4"><p className="text-xs text-[#5B6478]">Rang dans la classe</p><p className="mt-2 text-2xl font-bold">{bulletin.rang ?? resultat.rang ?? "—"}</p></div>
            <div className="rounded-xl border border-[#DEDCD0] p-4"><p className="mb-3 text-xs text-[#5B6478]">Appréciation</p><AppreciationBadge value={bulletin.appreciation ?? resultat.appreciation} /></div>
          </div>
        </div>
        <footer className="flex flex-wrap justify-end gap-2 border-t bg-[#F8F7F2] p-4 print:hidden">
          <button type="button" className={`${buttonClass} border bg-white`} onClick={onClose}>Fermer</button>
          <button type="button" className={`${buttonClass} bg-[#2C8C82] text-white`} disabled={sending} onClick={() => onSend(resultat)}>{sending ? <Spinner /> : <Send size={15} />} Envoyer aux parents</button>
          <button type="button" className={`${buttonClass} border bg-white text-[#101B33]`} disabled={downloading} onClick={() => onDownload(resultat)}>{downloading ? <Spinner /> : <Download size={15} />} PDF officiel</button>
          <button type="button" className={`${buttonClass} bg-[#101B33] text-white`} onClick={() => window.print()}><Printer size={15} /> Imprimer l’aperçu</button>
        </footer>
      </div>
    </div>
  );
}

function BulletinPdfModal({ pdfUrl, resultat, mois, onClose, onDownload, onSend, sending, downloading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101B33]/80 p-2 backdrop-blur-sm sm:p-5 print:hidden" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Aperçu du bulletin primaire" onClick={(e) => e.stopPropagation()} className="flex h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#DEDCD0] px-4 py-3 sm:px-6">
          <div className="min-w-0"><h2 className="flex items-center gap-2 text-base font-bold sm:text-lg"><GraduationCap size={21} className="shrink-0 text-[#C89B3C]" /> Bulletin mensuel</h2><p className="mt-1 truncate text-xs text-[#5B6478]">{resultat.prenom} {resultat.nom} · {resultat.classeNom} · {mois}</p></div>
          <button type="button" onClick={onClose} aria-label="Fermer l'aperçu" className="rounded-lg p-2 text-[#5B6478] hover:bg-slate-100"><X size={20} /></button>
        </header>
        <div className="min-h-0 flex-1 bg-[#E8E9EC] p-2 sm:p-4"><iframe src={pdfUrl} title={`Bulletin de ${resultat.prenom} ${resultat.nom}`} className="h-full w-full rounded-lg border-0 bg-white shadow-sm" /></div>
        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-[#DEDCD0] bg-[#F8F7F2] p-3 sm:p-4">
          <button type="button" onClick={onClose} className={`${buttonClass} border border-[#DEDCD0] bg-white`}>Fermer</button>
          <button type="button" onClick={() => onSend(resultat)} disabled={sending} className={`${buttonClass} bg-[#2C8C82] text-white`}>{sending ? <Spinner /> : <Send size={15} />} Envoyer aux parents</button>
          <button type="button" onClick={() => onDownload(resultat)} disabled={downloading} className={`${buttonClass} border border-[#DEDCD0] bg-white`}>{downloading ? <Spinner /> : <Download size={15} />} Télécharger</button>
          <button type="button" onClick={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")} className={`${buttonClass} bg-[#101B33] text-white`} title="Ouvre le PDF dans un nouvel onglet pour l'imprimer"><Printer size={15} /> Ouvrir / Imprimer</button>
        </footer>
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
  const [filtres, setFiltres] = useState({ cycleId: "", classeId: "", anneeScolaireId: "", periode: "" });
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [apercu, setApercu] = useState(null);
  const [apercuPdf, setApercuPdf] = useState(null);
  const pdfUrlRef = useRef(null);
  const [loadingBulletinId, setLoadingBulletinId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [sendingClasse, setSendingClasse] = useState(false);

  useEffect(() => {
    return () => { if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current); };
  }, []);

  const fermerApercuPdf = () => {
    setApercuPdf(null);
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (!ecoleId) return;
    let alive = true;
    Promise.all([
      api.get(`/cycles/ecole/${ecoleId}`),
      api.get(`/classes/ecole/${ecoleId}`),
      api.get(`/annees/ecole/${ecoleId}`),
    ]).then(([cy, cl, an]) => {
      if (!alive) return;
      setCycles(Array.isArray(cy.data) ? cy.data : []);
      setClasses(Array.isArray(cl.data) ? cl.data : []);
      const years = Array.isArray(an.data) ? an.data : [];
      setAnnees(years);
      const active = years.find((a) => a.active);
      if (active) setFiltres((prev) => ({ ...prev, anneeScolaireId: String(active.id) }));
    }).catch((err) => { if (alive) setError(`Chargement des filtres : ${apiError(err)}`); });
    return () => { alive = false; };
  }, [ecoleId]);

  const cycleSelectionne = cycles.find((c) => String(c.id) === filtres.cycleId);
  const classeSelectionnee = classes.find((c) => String(c.id) === filtres.classeId);
  const typeSelectionne = filtres.classeId
    ? kindForCycle(classeSelectionnee?.niveau?.cycle?.nom)
    : cycleSelectionne ? kindForCycle(cycleSelectionne.nom) : null;
  const classesDuCycle = useMemo(() => classes.filter((c) => !filtres.cycleId || String(c.niveau?.cycle?.id) === filtres.cycleId), [classes, filtres.cycleId]);
  const optionsPeriode = typeSelectionne === "primaire" ? MOIS : typeSelectionne === "secondaire" ? PERIODES : [];
  const selectedYear = annees.find((a) => String(a.id) === filtres.anneeScolaireId);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFiltres((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "cycleId" ? { classeId: "", periode: "" } : {}),
      ...(name === "classeId" ? { periode: "" } : {}),
    }));
    setApercu(null);
    fermerApercuPdf();
  };

  useEffect(() => {
    if (!ecoleId || !filtres.anneeScolaireId || !filtres.periode || !typeSelectionne) {
      setResultats([]);
      setLoading(false);
      return;
    }
    let alive = true;
    const type = typeSelectionne;
    const route = filtres.classeId ? ROUTES[type].classe(filtres.classeId) : ROUTES[type].ecole(ecoleId);
    setLoading(true);
    setError("");
    setResultats([]);
    api.get(route, { params: { anneeScolaireId: filtres.anneeScolaireId, ...(type === "primaire" ? { mois: filtres.periode } : { periode: filtres.periode }) } })
      .then(({ data }) => {
        if (!alive) return;
        setResultats((Array.isArray(data) ? data : []).filter((r) => !filtres.cycleId || classes.some((c) => c.nomComplet === r.classeNom && String(c.niveau?.cycle?.id) === filtres.cycleId)));
      })
      .catch((err) => { if (alive) { setError(`Impossible de charger les résultats : ${apiError(err)}`); setResultats([]); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ecoleId, filtres.classeId, filtres.cycleId, filtres.anneeScolaireId, filtres.periode, typeSelectionne, classes]);

  const resultatsTries = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("fr");
    return resultats.filter((r) => `${r.nom || ""} ${r.prenom || ""} ${r.matricule || ""}`.toLocaleLowerCase("fr").includes(q))
      .sort((a, b) => (a.classeNom || "").localeCompare(b.classeNom || "", "fr") || (a.rang ?? 9999) - (b.rang ?? 9999) || (b.moyenneGenerale ?? -1) - (a.moyenneGenerale ?? -1));
  }, [resultats, search]);

  const getClasseId = (r) => filtres.classeId || r.classeId || classes.find((c) => c.nomComplet === r.classeNom && (!filtres.cycleId || String(c.niveau?.cycle?.id) === filtres.cycleId))?.id;
  const getType = (r) => {
    const classe = classes.find((c) => String(c.id) === String(getClasseId(r)));
    return kindForCycle(r.cycleNom || classe?.niveau?.cycle?.nom || cycleSelectionne?.nom || "");
  };

  const ouvrirBulletin = async (r) => {
    const classeId = getClasseId(r);
    if (!classeId) { setError("Classe introuvable pour cet élève."); return; }
    if (!filtres.anneeScolaireId || !filtres.periode) { setError("Sélectionne une année scolaire et une période."); return; }
    const type = getType(r);
    setLoadingBulletinId(r.inscriptionId);
    setError("");
    try {
      if (type === "primaire") {
        const url = ROUTES.primaire.pdfEleve({ classeId, anneeId: filtres.anneeScolaireId, inscriptionId: r.inscriptionId, mois: filtres.periode });
        const response = await api.get(url, { responseType: "blob" });
        const blob = await readPdf(response);
        const pdfUrl = URL.createObjectURL(blob);
        fermerApercuPdf();
        pdfUrlRef.current = pdfUrl;
        setApercu(null);
        setApercuPdf({ pdfUrl, resultat: r, mois: filtres.periode });
      } else {
        const { data } = await api.get(ROUTES.secondaire.eleve(r.inscriptionId), { params: { periode: filtres.periode } });
        if (!data) throw new Error("Aucun bulletin disponible pour cet élève.");
        fermerApercuPdf();
        setApercu({ bulletin: data, resultat: r, type: "secondaire" });
      }
    } catch (err) {
      console.error("Erreur aperçu bulletin :", err);
      setError(`Impossible d'afficher le bulletin : ${apiError(err)}`);
    } finally {
      setLoadingBulletinId(null);
    }
  };

  const telechargerPdf = async (r) => {
    const classeId = getClasseId(r);
    if (!classeId) { setError("Classe introuvable pour le téléchargement."); return; }
    const type = getType(r);
    setDownloadingId(r.inscriptionId);
    setError("");
    try {
      const response = type === "primaire"
        ? await api.get(ROUTES.primaire.pdfEleve({ classeId, anneeId: filtres.anneeScolaireId, inscriptionId: r.inscriptionId, mois: filtres.periode }), { responseType: "blob" })
        : await api.get(ROUTES.secondaire.pdf, { params: { inscriptionId: r.inscriptionId, classeId, anneeId: filtres.anneeScolaireId, periode: filtres.periode }, responseType: "blob" });
      const blob = await readPdf(response);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bulletin_${r.matricule || r.inscriptionId}_${filtres.periode}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Erreur téléchargement PDF :", err);
      setError(`Téléchargement impossible : ${apiError(err)}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const envoyerAuxParents = async (r) => {
    const type = getType(r);
    const classeId = getClasseId(r);
    if (!classeId) { setError("Classe introuvable pour cet élève."); return; }
    const route = ROUTES[type]?.envoyer;
    if (!route) { setError("L'envoi n'est pas configuré pour ce niveau."); return; }
    const nomEleve = `${r.prenom || ""} ${r.nom || ""}`.trim();
    const periodeLabel = type === "primaire" ? `le mois de ${filtres.periode}` : `la période ${filtres.periode}`;
    if (!window.confirm(`Envoyer le bulletin de ${nomEleve} pour ${periodeLabel} aux parents ?`)) return;
    setSendingId(r.inscriptionId);
    setError("");
    try {
      await api.post(route, null, { params: { inscriptionId: r.inscriptionId, classeId, anneeId: filtres.anneeScolaireId, ...(type === "primaire" ? { mois: filtres.periode } : { periode: filtres.periode }) } });
      window.alert(`Bulletin envoyé aux parents de ${nomEleve}.`);
    } catch (err) {
      console.error("Erreur envoi bulletin :", err);
      setError(`Envoi impossible : ${apiError(err)}`);
    } finally {
      setSendingId(null);
    }
  };

  const envoyerTous = async () => {
    if (!filtres.classeId || !typeSelectionne || !resultats.length) return;
    const route = ROUTES[typeSelectionne]?.envoyerClasse;
    if (!route) { setError("L'envoi groupé n'est pas configuré pour ce niveau."); return; }
    const periodeLabel = typeSelectionne === "primaire" ? `le mois de ${filtres.periode}` : `la période ${filtres.periode}`;
    if (!window.confirm(`Envoyer les bulletins de toute la classe pour ${periodeLabel} aux parents ?`)) return;
    setSendingClasse(true);
    setError("");
    try {
      await api.post(route, null, { params: { classeId: filtres.classeId, anneeId: filtres.anneeScolaireId, ...(typeSelectionne === "primaire" ? { mois: filtres.periode } : { periode: filtres.periode }) } });
      window.alert("La demande d'envoi des bulletins de la classe a été traitée.");
    } catch (err) {
      console.error("Erreur envoi groupé :", err);
      setError(`Envoi groupé impossible : ${apiError(err)}`);
    } finally {
      setSendingClasse(false);
    }
  };

  const actions = (r) => (
    <div className="flex items-center justify-end gap-1.5 print:hidden">
      <button type="button" title="Voir le bulletin" aria-label="Voir le bulletin" disabled={loadingBulletinId === r.inscriptionId} onClick={() => ouvrirBulletin(r)} className={`${buttonClass} bg-[#F1F2F5] text-[#101B33]`}>{loadingBulletinId === r.inscriptionId ? <Spinner /> : <Eye size={15} />}</button>
      <button type="button" title="Télécharger le PDF" aria-label="Télécharger le PDF" disabled={downloadingId === r.inscriptionId} onClick={() => telechargerPdf(r)} className={`${buttonClass} bg-[#FBF7EA] text-[#9B7428]`}>{downloadingId === r.inscriptionId ? <Spinner /> : <Download size={15} />}</button>
      <button type="button" title="Envoyer aux parents" aria-label="Envoyer aux parents" disabled={sendingId === r.inscriptionId} onClick={() => envoyerAuxParents(r)} className={`${buttonClass} bg-[#DCEDEA] text-[#236F68]`}>{sendingId === r.inscriptionId ? <Spinner /> : <Send size={15} />}</button>
    </div>
  );

  return (
    <div className="space-y-5 pb-8 text-[#101B33]">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center print:hidden">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Award className="text-[#C89B3C]" /> Résultats scolaires</h1><p className="mt-1 text-xs text-[#5B6478]">Moyennes et classements du primaire et du secondaire.</p></div>
        <div className="flex flex-wrap gap-2">
          {typeSelectionne && <button type="button" onClick={envoyerTous} disabled={!filtres.classeId || !resultats.length || sendingClasse || loading} className={`${buttonClass} bg-[#2C8C82] text-white`}>{sendingClasse ? <Spinner /> : <Mail size={15} />} Envoyer à la classe</button>}
          <button type="button" onClick={() => window.print()} disabled={!resultatsTries.length || loading} className={`${buttonClass} bg-[#101B33] text-white`}><Printer size={15} /> Imprimer la liste</button>
        </div>
      </div>
      <section className="rounded-2xl border border-[#DEDCD0] bg-white p-4 shadow-sm print:hidden">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#8A93A5]">Filtres</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select name="cycleId" value={filtres.cycleId} onChange={handleChange} className={selectClass}><option value="">Sélectionner un cycle</option>{cycles.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>
          <select name="classeId" value={filtres.classeId} onChange={handleChange} className={selectClass}><option value="">Toutes les classes du cycle</option>{classesDuCycle.map((c) => <option key={c.id} value={c.id}>{c.nomComplet}</option>)}</select>
          <select name="anneeScolaireId" value={filtres.anneeScolaireId} onChange={handleChange} className={selectClass}><option value="">Année scolaire</option>{annees.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}</select>
          <select name="periode" value={filtres.periode} onChange={handleChange} disabled={!typeSelectionne} className={selectClass}><option value="">{typeSelectionne === "primaire" ? "Sélectionner un mois" : "Sélectionner une période"}</option>{optionsPeriode.map((p) => <option key={p} value={p}>{p}</option>)}</select>
        </div>
        <div className="relative mt-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A93A5]" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un élève ou un matricule..." className={`${selectClass} pl-9`} /></div>
        <p className="mt-2 text-xs text-[#8A93A5]">{typeSelectionne ? `Barème : /${typeSelectionne === "primaire" ? 10 : 20} · ${typeSelectionne === "primaire" ? "résultats mensuels" : "résultats par période"}` : "Sélectionnez d’abord un cycle pour choisir un mois ou une période."}</p>
      </section>
      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 print:hidden"><AlertCircle size={18} className="shrink-0" /><span className="flex-1">{error}</span><button type="button" aria-label="Fermer l’erreur" onClick={() => setError("")}><X size={16} /></button></div>}
      <div className="hidden overflow-x-auto rounded-2xl border border-[#DEDCD0] bg-white shadow-sm lg:block print:block print:border-0 print:shadow-none">
        <div className="hidden p-4 print:block"><h2 className="text-lg font-bold">Résultats — {cycleSelectionne?.nom || ""}</h2><p>{selectedYear?.nom} · {filtres.periode}</p></div>
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-[#F8F7F2] text-[10px] uppercase tracking-wider text-[#8A93A5]"><tr>{["Matricule", "Élève", "Cycle", "Classe", "Rang", "Moyenne", "Appréciation", "Actions"].map((h) => <th key={h} className={`whitespace-nowrap px-4 py-3 ${h === "Actions" ? "print:hidden" : ""}`}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#F0EFEA]">
            {!loading && resultatsTries.map((r) => <tr key={r.inscriptionId} className="hover:bg-[#FAFAF7]"><td className="px-4 py-3 font-mono text-[#5B6478]">{r.matricule || "—"}</td><td className="px-4 py-3 font-semibold">{r.prenom} {r.nom}</td><td className="px-4 py-3">{r.cycleNom || "—"}</td><td className="px-4 py-3">{r.classeNom || "—"}</td><td className="px-4 py-3 text-center font-bold">{r.rang ?? "—"}</td><td className="px-4 py-3 text-center font-mono font-bold">{fmt(r.moyenneGenerale)} <span className="text-[10px] font-normal text-[#8A93A5]">/{getType(r) === "primaire" ? 10 : 20}</span></td><td className="px-4 py-3"><AppreciationBadge value={r.appreciation} /></td><td className="px-4 py-3">{actions(r)}</td></tr>)}
            {(loading || !resultatsTries.length) && <tr><td colSpan={8} className="px-4 py-14 text-center text-[#8A93A5]">{loading ? "Chargement des résultats..." : "Aucun résultat pour les filtres sélectionnés."}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 lg:hidden print:hidden">
        {loading ? <div className="py-12 text-center"><Spinner /><p className="mt-2 text-xs">Chargement des résultats...</p></div> : !resultatsTries.length ? <div className="rounded-2xl border border-dashed bg-white px-5 py-12 text-center text-sm text-[#8A93A5]"><GraduationCap className="mx-auto mb-3" /> Aucun résultat. Sélectionnez un cycle, une année et une période.</div> : resultatsTries.map((r) => <article key={r.inscriptionId} className="rounded-2xl border border-[#DEDCD0] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-bold">{r.prenom} {r.nom}</h3><p className="mt-1 font-mono text-[10px] text-[#8A93A5]">{r.matricule || "Sans matricule"}</p><p className="mt-1 text-xs text-[#5B6478]">{r.classeNom}</p></div><div className="rounded-lg bg-[#FBF7EA] px-3 py-2 text-center"><p className="font-mono text-lg font-bold text-[#8B681E]">{fmt(r.moyenneGenerale)}</p><p className="text-[10px] text-[#9B8144]">/{getType(r) === "primaire" ? 10 : 20}</p></div></div><div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs text-[#5B6478]">Rang : <strong>{r.rang ?? "—"}</strong></span><AppreciationBadge value={r.appreciation} /></div><div className="mt-3 border-t pt-3">{actions(r)}</div></article>)}
      </div>
      {apercu && <BulletinModal bulletin={apercu.bulletin} resultat={apercu.resultat} periode={filtres.periode} annee={selectedYear?.nom || "Année scolaire"} onClose={() => setApercu(null)} onDownload={telechargerPdf} onSend={envoyerAuxParents} sending={sendingId === apercu.resultat.inscriptionId} downloading={downloadingId === apercu.resultat.inscriptionId} />}
      {apercuPdf && <BulletinPdfModal pdfUrl={apercuPdf.pdfUrl} resultat={apercuPdf.resultat} mois={apercuPdf.mois} onClose={fermerApercuPdf} onDownload={telechargerPdf} onSend={envoyerAuxParents} sending={sendingId === apercuPdf.resultat.inscriptionId} downloading={downloadingId === apercuPdf.resultat.inscriptionId} />}
    </div>
  );
}
