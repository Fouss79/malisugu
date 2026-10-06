"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  Check,
  X,
  CalendarCheck,
  CalendarX,
  BarChart3,
  Search,
  Clock,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import api from "../../../../lib/api";

/* =========================================================
   PALETTE (identique au reste de l'application)
========================================================= */
const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const VIOLET = "#6E5DC6";
const CORAL = "#D2593F";
const CORAL_SOFT = "#F7E2DB";
const AMBER = "#B7791F";
const AMBER_SOFT = "#FBEFD5";
const SLATE_SOFT = "#E8ECF3";

/* =========================================================
   HELPERS
========================================================= */

// Date locale au format YYYY-MM-DD (toISOString() renvoie l'UTC et peut décaler le jour)
function aujourdhui() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Retourne null le dimanche (pas de cours) au lieu de retomber sur "LUNDI"
function nomJour(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const idx = new Date(y, m - 1, d).getDay(); // construit en local → pas de décalage UTC
  const mapping = { 1: "LUNDI", 2: "MARDI", 3: "MERCREDI", 4: "JEUDI", 5: "VENDREDI", 6: "SAMEDI" };
  return mapping[idx] ?? null;
}

const normaliser = (s) =>
  (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// L'API de la classe renvoie `inscriptionId`, celle des sous-groupes peut renvoyer `id`.
// On privilégie toujours `inscriptionId` pour ne jamais confondre avec un id d'élève.
const getInscriptionId = (e) => e.inscriptionId ?? e.id;

const STATUTS = {
  PRESENT: { label: "Présent", bg: TEAL_SOFT, fg: TEAL, Icon: Check },
  ABSENT: { label: "Absent", bg: CORAL_SOFT, fg: CORAL, Icon: X },
  RETARD: { label: "Retard", bg: AMBER_SOFT, fg: AMBER, Icon: Clock },
  EXCUSE: { label: "Excusé", bg: SLATE_SOFT, fg: INK, Icon: ShieldCheck },
};

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C] focus-visible:ring-2 focus-visible:ring-[#C89B3C]/30";

/* =========================================================
   PAGE
========================================================= */
export default function PresencePage() {
  const { user } = useAuth();
  const router = useRouter();
  const ecoleId = user?.ecole?.id;

  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState("");
  const [date, setDate] = useState(aujourdhui());
  const [edts, setEdts] = useState([]);
  const [edtId, setEdtId] = useState("");
  const [sousGroupes, setSousGroupes] = useState([]);
  const [sousGroupeId, setSousGroupeId] = useState(""); // "" = toute la classe
  const [inscriptions, setInscriptions] = useState([]);
  const [presences, setPresences] = useState([]);
  const [anneeId, setAnneeId] = useState("");

  const [loading, setLoading] = useState(false); // chargement initial des présences
  const [pending, setPending] = useState(() => new Set()); // lignes en cours de sauvegarde
  const [bulkBusy, setBulkBusy] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [notice, setNotice] = useState(null); // { type: "error" | "success", text }

  const requestId = useRef(0); // évite qu'une vieille réponse écrase une plus récente

  /* ---------- Notification auto-masquée ---------- */
  const notify = useCallback((type, text) => setNotice({ type, text }), []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  /* ---------- Classes + année active ---------- */
  useEffect(() => {
    if (!ecoleId) return;

    api
      .get(`/classes/ecole/${ecoleId}`)
      .then((res) => setClasses(Array.isArray(res.data) ? res.data : []))
      .catch(() => {
        setClasses([]);
        notify("error", "Impossible de charger les classes.");
      });

    api
      .get(`/annees/ecole/${ecoleId}`)
      .then((res) => {
        const active = (Array.isArray(res.data) ? res.data : []).find((a) => a.active);
        if (active) setAnneeId(active.id);
      })
      .catch(() => notify("error", "Impossible de charger l'année scolaire active."));
  }, [ecoleId, notify]);

  /* ---------- Emploi du temps du jour pour la classe ---------- */
  useEffect(() => {
    const jour = nomJour(date);

    if (!classeId || !anneeId || !jour) {
      setEdts([]);
      setEdtId("");
      return;
    }

    let annule = false;

    api
      .get(`/emploi/classe/${classeId}/${anneeId}`)
      .then((res) => {
        if (annule) return;
        const liste = (Array.isArray(res.data) ? res.data : []).filter((e) => e.jour === jour);
        setEdts(liste);
        // on garde le cours sélectionné s'il existe toujours, sinon le premier
        setEdtId((prev) =>
          liste.some((e) => String(e.id) === String(prev)) ? prev : liste[0]?.id ? String(liste[0].id) : ""
        );
      })
      .catch(() => {
        if (annule) return;
        setEdts([]);
        setEdtId("");
        notify("error", "Impossible de charger l'emploi du temps.");
      });

    return () => {
      annule = true;
    };
  }, [classeId, anneeId, date, notify]);

  /* ---------- Sous-groupes de la classe ---------- */
  useEffect(() => {
    setSousGroupeId(""); // reset à chaque changement de classe

    if (!classeId) {
      setSousGroupes([]);
      return;
    }

    let annule = false;
    api
      .get(`/sous-groupes/classe/${classeId}`)
      .then((res) => !annule && setSousGroupes(Array.isArray(res.data) ? res.data : []))
      .catch(() => !annule && setSousGroupes([]));

    return () => {
      annule = true;
    };
  }, [classeId]);

  /* ---------- Élèves : toute la classe ou un sous-groupe ---------- */
  useEffect(() => {
    if (!classeId) {
      setInscriptions([]);
      return;
    }

    const url = sousGroupeId
      ? `/sous-groupes/${sousGroupeId}/eleves-annee-active`
      : `/presences/classe/${classeId}/eleves-inscriptions`;

    let annule = false;
    api
      .get(url)
      .then((res) => !annule && setInscriptions(Array.isArray(res.data) ? res.data : []))
      .catch(() => {
        if (annule) return;
        setInscriptions([]);
        notify("error", "Impossible de charger les élèves.");
      });

    return () => {
      annule = true;
    };
  }, [classeId, sousGroupeId, notify]);

  /* ---------- Présences du cours sélectionné ---------- */
  const loadPresences = useCallback(
    async ({ silent = false } = {}) => {
      if (!edtId || !date) {
        setPresences([]);
        return;
      }

      const id = ++requestId.current;
      if (!silent) setLoading(true);

      try {
        const res = await api.get(`/presences/cours/${edtId}`, { params: { date } });
        if (id === requestId.current) setPresences(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (id === requestId.current) {
          setPresences([]);
          notify("error", "Impossible de charger les présences.");
        }
      } finally {
        if (id === requestId.current && !silent) setLoading(false);
      }
    },
    [edtId, date, notify]
  );

  useEffect(() => {
    loadPresences();
  }, [loadPresences]);

  /* ---------- Données dérivées ---------- */
  const statutParEleve = useMemo(() => {
    const map = new Map();
    presences.forEach((p) => map.set(p.inscriptionId, p.statut));
    return map;
  }, [presences]);

  // Pas d'enregistrement = présent (même convention que « marquer tous présents »)
  const statutDe = useCallback((id) => statutParEleve.get(id) || "PRESENT", [statutParEleve]);

  const elevesFiltres = useMemo(() => {
    const q = normaliser(recherche.trim());
    return [...inscriptions]
      .sort((a, b) => normaliser(a.nom + a.prenom).localeCompare(normaliser(b.nom + b.prenom)))
      .filter((e) => !q || normaliser(`${e.prenom} ${e.nom}`).includes(q) || normaliser(`${e.nom} ${e.prenom}`).includes(q));
  }, [inscriptions, recherche]);

  const compteurs = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, RETARD: 0, EXCUSE: 0 };
    inscriptions.forEach((e) => {
      const s = statutDe(getInscriptionId(e));
      c[s] = (c[s] ?? 0) + 1;
    });
    return c;
  }, [inscriptions, statutDe]);

  const edtSelectionne = edts.find((e) => String(e.id) === String(edtId));
  const jourSemaine = nomJour(date);

  /* ---------- Actions ---------- */
  const toggle = async (inscriptionId) => {
    if (pending.has(inscriptionId)) return;

    const actuel = statutDe(inscriptionId);
    const suivant = actuel === "PRESENT" ? "ABSENT" : "PRESENT"; // même règle que le backend

    // mise à jour optimiste : la ligne change tout de suite, sans recharger la liste
    setPresences((prev) =>
      prev.some((p) => p.inscriptionId === inscriptionId)
        ? prev.map((p) => (p.inscriptionId === inscriptionId ? { ...p, statut: suivant } : p))
        : [...prev, { inscriptionId, statut: suivant }]
    );
    setPending((prev) => new Set(prev).add(inscriptionId));

    try {
      await api.put(`/presences/toggle`, null, { params: { inscriptionId, edtId, date } });
      await loadPresences({ silent: true }); // resynchronise avec le serveur
    } catch (err) {
      console.error(err);
      notify("error", "La présence n'a pas pu être enregistrée.");
      await loadPresences({ silent: true }); // annule le changement optimiste
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(inscriptionId);
        return next;
      });
    }
  };

  const marquerTous = async (statut) => {
    if (!classeId || !edtId || bulkBusy) return;

    const libelle = statut === "PRESENT" ? "présents" : "absents";
    const portee = sousGroupeId ? "les élèves de ce sous-groupe" : "toute la classe";
    const cours = edtSelectionne?.matiere?.nom ? ` (${edtSelectionne.matiere.nom})` : "";
    if (!window.confirm(`Marquer ${portee} comme ${libelle} pour ce cours${cours}, le ${date} ?`)) return;

    const action = statut === "PRESENT" ? "tout-present" : "tout-absent";
    setBulkBusy(true);

    try {
      await api.put(`/presences/classe/${classeId}/cours/${edtId}/${action}`, null, {
        params: {
          date,
          // sous-groupe : on envoie uniquement ses inscriptions ; sinon rien = toute la classe
          ...(sousGroupeId ? { inscriptionIds: inscriptions.map(getInscriptionId) } : {}),
        },
        // Spring attend inscriptionIds=1&inscriptionIds=2 (et non inscriptionIds[]=1)
        paramsSerializer: { indexes: null },
      });
      await loadPresences({ silent: true });
      notify("success", `Tous les élèves sont marqués ${libelle}.`);
    } catch (err) {
      console.error(err);
      notify("error", "L'action groupée a échoué.");
    } finally {
      setBulkBusy(false);
    }
  };

  const voirStatsClasse = () => {
    if (!classeId) return;
    router.push(`presences/stats?classeId=${classeId}`);
    // ↑ adapte ce chemin selon la route réelle de PresenceStatsClassePage
  };

  /* ---------- Rendu ---------- */
  const messageCours = !classeId
    ? "Choisir un cours"
    : !jourSemaine
    ? "Pas de cours le dimanche"
    : edts.length === 0
    ? "Aucun cours ce jour"
    : "Choisir un cours";

  return (
    <div className="space-y-5">
      {/* EN-TÊTE */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`, color: INK }}
          >
            <CalendarCheck size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prise de présence</h1>
            <p className="text-sm text-slate-500">
              Émargement par classe (ou sous-groupe), par jour et par cours.
            </p>
          </div>
        </div>

        {classeId && (
          <button
            onClick={voirStatsClasse}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#C89B3C]/40"
          >
            <BarChart3 size={14} />
            Stats de la classe
          </button>
        )}
      </div>

      {/* NOTIFICATION */}
      {notice && (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
          style={
            notice.type === "error"
              ? { background: CORAL_SOFT, color: CORAL }
              : { background: TEAL_SOFT, color: TEAL }
          }
        >
          {notice.type === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
          {notice.text}
        </div>
      )}

      {/* SÉLECTEURS */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Classe"
          value={classeId}
          onChange={(e) => setClasseId(e.target.value)}
          className={selectClass}
        >
          <option value="">Choisir une classe</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nomComplet}
            </option>
          ))}
        </select>

        {classeId && sousGroupes.length > 0 && (
          <select
            aria-label="Sous-groupe"
            value={sousGroupeId}
            onChange={(e) => setSousGroupeId(e.target.value)}
            className={selectClass}
          >
            <option value="">Toute la classe</option>
            {sousGroupes.map((sg) => (
              <option key={sg.id} value={sg.id}>
                {sg.nom}
              </option>
            ))}
          </select>
        )}

        <input
          aria-label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value || aujourdhui())}
          className={selectClass}
        />

        {classeId && (
          <select
            aria-label="Cours"
            value={edtId}
            onChange={(e) => setEdtId(e.target.value)}
            className={selectClass}
          >
            <option value="">{messageCours}</option>
            {edts.map((e) => (
              <option key={e.id} value={e.id}>
                {e.matiere?.nom} ({e.heureDebut}h-{e.heureFin}h) — {e.enseignant?.prenom} {e.enseignant?.nom}
              </option>
            ))}
          </select>
        )}
      </div>

      {sousGroupeId && (
        <p className="text-xs text-slate-400">
          Affichage limité au sous-groupe :{" "}
          <span className="font-medium" style={{ color: VIOLET }}>
            {sousGroupes.find((sg) => String(sg.id) === String(sousGroupeId))?.nom}
          </span>
        </p>
      )}

      {/* ACTIONS GROUPÉES + COMPTEURS
          (masquées si aucun élève : une liste vide d'inscriptions signifierait « toute la classe » côté API) */}
      {edtSelectionne && inscriptions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => marquerTous("PRESENT")}
              disabled={bulkBusy}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110 disabled:opacity-60"
              style={{ background: TEAL }}
            >
              {bulkBusy ? <Loader2 size={14} className="animate-spin" /> : <CalendarCheck size={14} />}
              Marquer tous présents
            </button>
            <button
              onClick={() => marquerTous("ABSENT")}
              disabled={bulkBusy}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110 disabled:opacity-60"
              style={{ background: CORAL }}
            >
              {bulkBusy ? <Loader2 size={14} className="animate-spin" /> : <CalendarX size={14} />}
              Marquer tous absents
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium" aria-live="polite">
            {Object.entries(STATUTS).map(([cle, s]) =>
              compteurs[cle] > 0 || cle === "PRESENT" || cle === "ABSENT" ? (
                <span
                  key={cle}
                  className="rounded-full px-2.5 py-1"
                  style={{ background: s.bg, color: s.fg }}
                >
                  {compteurs[cle]} {s.label.toLowerCase()}
                  {compteurs[cle] > 1 ? "s" : ""}
                </span>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* LISTE DES ÉLÈVES */}
      {classeId && edtId && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
          {/* Recherche */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
            <Search size={14} className="text-slate-400" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un élève"
              aria-label="Rechercher un élève"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {loading && <Loader2 size={14} className="flex-shrink-0 animate-spin text-slate-400" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Élève</th>
                  <th className="px-4 py-3 text-right font-medium">Statut</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {inscriptions.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-slate-400">
                      {sousGroupeId ? "Aucun élève dans ce sous-groupe" : "Aucun élève dans cette classe"}
                    </td>
                  </tr>
                )}

                {inscriptions.length > 0 && elevesFiltres.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-slate-400">
                      Aucun élève ne correspond à « {recherche} »
                    </td>
                  </tr>
                )}

                {elevesFiltres.map((e, index) => {
                  const inscriptionId = getInscriptionId(e);
                  const statut = statutDe(inscriptionId);
                  const cfg = STATUTS[statut] ?? STATUTS.PRESENT;
                  const Icon = cfg.Icon;
                  const enCours = pending.has(inscriptionId);

                  return (
                    <tr key={`inscription-${inscriptionId ?? index}`} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {e.prenom} {e.nom}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggle(inscriptionId)}
                          disabled={enCours}
                          aria-label={`${e.prenom} ${e.nom} : ${cfg.label}. Cliquer pour changer.`}
                          className="inline-flex min-w-[6.5rem] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[#C89B3C]/40 disabled:opacity-60"
                          style={{ background: cfg.bg, color: cfg.fg }}
                        >
                          {enCours ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                          {cfg.label}
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