"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Check, X, CalendarCheck, CalendarX } from "lucide-react";
import api from "../../../../lib/api";

function nomJour(date) {
  const idx = new Date(date).getDay();
  const mapping = { 1: "LUNDI", 2: "MARDI", 3: "MERCREDI", 4: "JEUDI", 5: "VENDREDI", 6: "SAMEDI" };
  return mapping[idx] || "LUNDI";
}

export default function PresencePage() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [edts, setEdts] = useState([]);
  const [edtId, setEdtId] = useState("");
  const [sousGroupes, setSousGroupes] = useState([]);
  const [sousGroupeId, setSousGroupeId] = useState(""); // "" = toute la classe
  const [inscriptions, setInscriptions] = useState([]);
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anneeId, setAnneeId] = useState("");

  // ================= LOAD CLASSES + ANNÉE ACTIVE =================
  useEffect(() => {
    if (!ecoleId) return;

    api.get(`/classes/ecole/${ecoleId}`)
      .then(res => setClasses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setClasses([]));

    api.get(`/annees/ecole/${ecoleId}`)
      .then(res => {
        const active = (Array.isArray(res.data) ? res.data : []).find(a => a.active);
        if (active) setAnneeId(active.id);
      })
      .catch(() => {});
  }, [ecoleId]);

  // ================= LOAD EDT DU JOUR POUR LA CLASSE =================
  useEffect(() => {
    if (!classeId || !anneeId) return;

    const jour = nomJour(date);

    api.get(`/emploi/classe/${classeId}/${anneeId}`)
      .then(res => {
        const liste = (Array.isArray(res.data) ? res.data : []).filter(e => e.jour === jour);

        setEdts(liste);
        setEdtId(liste[0]?.id ? String(liste[0].id) : "");
      })
      .catch(() => setEdts([]));
  }, [classeId, anneeId, date]);

  // 🔥 LOAD SOUS-GROUPES DE LA CLASSE
  useEffect(() => {
    if (!classeId) {
      setSousGroupes([]);
      setSousGroupeId("");
      return;
    }

    api.get(`/sous-groupes/classe/${classeId}`)
      .then(res => setSousGroupes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSousGroupes([]));

    setSousGroupeId(""); // reset à chaque changement de classe
  }, [classeId]);

  // 🔥 LOAD ÉLÈVES — soit toute la classe, soit uniquement le sous-groupe choisi
  useEffect(() => {
    if (!classeId) return;

    const url = sousGroupeId
      ? `/sous-groupes/${sousGroupeId}/eleves-annee-active`
      : `/presences/classe/${classeId}/eleves-inscriptions`;

    api.get(url)
      .then(res => setInscriptions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setInscriptions([]));
  }, [classeId, sousGroupeId]);

  // ================= LOAD PRÉSENCES DU COURS SÉLECTIONNÉ =================
  const loadPresences = () => {
    if (!edtId || !date) return;
    setLoading(true);

    api.get(`/presences/cours/${edtId}`, { params: { date } })
      .then(res => setPresences(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPresences([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPresences();
  }, [edtId, date]);

  const statutParEleve = useMemo(() => {
    const map = new Map();
    presences.forEach(p => map.set(p.inscriptionId, p.statut));
    return map;
  }, [presences]);

  const toggle = async (inscriptionId) => {
    try {
      await api.put(`/presences/toggle`, null, {
        params: { inscriptionId, edtId, date },
      });
      loadPresences();
    } catch (err) {
      console.error(err);
    }
  };

  const marquerTous = async (statut) => {
    if (!classeId || !edtId) return;
    const jour = nomJour(date);
    const action = statut === "PRESENT" ? "tout-present" : "tout-absent";

    try {
      await api.put(`/presences/classe/${classeId}/${action}`, null, {
        params: { jour, date },
      });
      loadPresences();
    } catch (err) {
      console.error(err);
    }
  };

  const edtSelectionne = edts.find(e => String(e.id) === String(edtId));

  return (
    <div className="space-y-5">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Prise de présence</h1>
        <p className="text-sm text-slate-500">Émargement par classe (ou sous-groupe), par jour et par cours.</p>
      </div>

      {/* SÉLECTEURS */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={classeId}
          onChange={(e) => setClasseId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">Choisir une classe</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.nomComplet}</option>)}
        </select>

        {/* 🔥 Sous-groupe — optionnel */}
        {classeId && sousGroupes.length > 0 && (
          <select
            value={sousGroupeId}
            onChange={(e) => setSousGroupeId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">Par groupe</option>
            {sousGroupes.map(sg => (
              <option key={sg.id} value={sg.id}>{sg.nom}</option>
            ))}
          </select>
        )}

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />

        {classeId && (
          <select
            value={edtId}
            onChange={(e) => setEdtId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">
              {edts.length === 0 ? "Aucun cours ce jour" : "Choisir un cours"}
            </option>
            {edts.map(e => (
              <option key={e.id} value={e.id}>
                {e.matiere.nom} ({e.heureDebut}h-{e.heureFin}h) — {e.enseignant.prenom} {e.enseignant.nom}
              </option>
            ))}
          </select>
        )}
      </div>

      {sousGroupeId && (
        <p className="text-xs text-slate-400">
          Affichage limité au sous-groupe : <span className="font-medium text-indigo-600">
            {sousGroupes.find(sg => String(sg.id) === String(sousGroupeId))?.nom}
          </span>
        </p>
      )}

      {edtSelectionne && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => marquerTous("PRESENT")}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
          >
            <CalendarCheck size={14} />
            Marquer tous présents
          </button>
          <button
            onClick={() => marquerTous("ABSENT")}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-700"
          >
            <CalendarX size={14} />
            Marquer tous absents
          </button>
        </div>
      )}

      {/* LISTE DES ÉLÈVES */}
      {classeId && edtId && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Élève</th>
                  <th className="px-4 py-3 font-medium text-right">Statut</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {loading && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-slate-400">Chargement...</td>
                  </tr>
                )}

                {!loading && inscriptions.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-slate-400">
                      {sousGroupeId ? "Aucun élève dans ce sous-groupe" : "Aucun élève dans cette classe"}
                    </td>
                  </tr>
                )}

              {!loading && inscriptions.map((e, index) => {
  const inscriptionId = e.id ?? e.inscriptionId ?? index;

  const statut = statutParEleve.get(inscriptionId) || "PRESENT";
  const estAbsent = statut === "ABSENT";

  return (
    <tr
      key={`inscription-${inscriptionId}`}
      className="transition hover:bg-slate-50/70"
    >
      <td className="px-4 py-3 font-medium text-slate-800">
        {e.prenom} {e.nom}
      </td>

      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => toggle(inscriptionId)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            estAbsent
              ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100"
              : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
          }`}
        >
          {estAbsent ? <X size={14} /> : <Check size={14} />}
          {estAbsent ? "Absent" : "Présent"}
        </button>
      </td>
    </tr>
  );
})}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}