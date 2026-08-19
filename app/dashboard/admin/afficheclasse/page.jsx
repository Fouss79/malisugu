"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  Search,
  Users,
  Layers,
  UsersRound,
  Plus,
  ArrowRight,
  BookOpen,
  AlertCircle,
  GraduationCap,
  Filter,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import api from "../../../../lib/api";
import ModalAjouterMatiere from "./component/ModalAjouterMatiere";
import ModalProgrammesClasse from "./component/ModalProgrammesClasse";

/* =========================================================
   PALETTE (identique au tableau de bord)
========================================================= */
const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const VIOLET = "#6E5DC6";
const VIOLET_SOFT = "#E7E3F8";
const CORAL = "#D2593F";
const CORAL_SOFT = "#F7E2DB";

function StatCard({ label, value, icon: Icon, iconBg, iconColor, valueColor }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40">
      <span
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: iconBg, color: iconColor }}
      >
        <Icon size={20} />
      </span>

      <div>
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold" style={{ color: valueColor }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const { user } = useAuth();
  const ecoleId = user?.ecoleId || user?.ecole?.id;

  // ============================================================
  // ÉTATS
  // ============================================================

  const [classes, setClasses] = useState([]);

  const [anneeScolaireActive, setAnneeScolaireActive] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingAnnee, setLoadingAnnee] = useState(true);

  const [search, setSearch] = useState("");
  const [niveauFilter, setNiveauFilter] = useState("");
  const [cycleFilter, setCycleFilter] = useState("");
  const [classeProgrammes, setClasseProgrammes] = useState(null);

  const [programmeAModifier, setProgrammeAModifier] = useState(null);

  // Classe actuellement sélectionnée pour le modal
  const [classeMatiere, setClasseMatiere] = useState(null);

  const [erreurAnnee, setErreurAnnee] = useState("");

  // ============================================================
  // CHARGEMENT DES CLASSES
  // ============================================================

  const chargerClasses = async () => {
    if (!ecoleId) return;

    setLoading(true);

    try {
      const response = await api.get(`/classes/ecole/${ecoleId}/stats`);

      console.log("DONNEES CLASSES =", response.data);

      setClasses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erreur chargement classes :", error);

      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // OUVRIR MODAL PROGRAMMES
  // ============================================================

  const ouvrirModalProgrammes = (classe) => {
    if (!anneeScolaireActive?.id) {
      setErreurAnnee(
        "Aucune année scolaire active. Activez une année avant de consulter les programmes."
      );

      return;
    }

    setClasseProgrammes(classe);
  };

  // ============================================================
  // CHARGEMENT DE L'ANNÉE SCOLAIRE ACTIVE
  // ============================================================

  const chargerAnneeActive = async () => {
    if (!ecoleId) return;

    setLoadingAnnee(true);
    setErreurAnnee("");

    try {
      const response = await api.get(`/annees/ecole/${ecoleId}`);

      const annees = Array.isArray(response.data) ? response.data : [];

      const active = annees.find((annee) => annee.active === true);

      if (!active) {
        setAnneeScolaireActive(null);

        setErreurAnnee("Aucune année scolaire active.");

        return;
      }

      console.log("ANNÉE SCOLAIRE ACTIVE =", active);

      setAnneeScolaireActive(active);
    } catch (error) {
      console.error("Erreur chargement année scolaire :", error);

      setAnneeScolaireActive(null);

      setErreurAnnee("Impossible de récupérer l'année scolaire active.");
    } finally {
      setLoadingAnnee(false);
    }
  };

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    if (!ecoleId) return;

    chargerClasses();
    chargerAnneeActive();
  }, [ecoleId]);

  // ============================================================
  // NIVEAUX DISPONIBLES
  // ============================================================

  const niveauxDisponibles = useMemo(() => {
    const set = new Set(classes.map((c) => c.niveauNom).filter(Boolean));

    return Array.from(set).sort();
  }, [classes]);

  // ============================================================
  // CYCLES DISPONIBLES
  // ============================================================

  const cyclesDisponibles = useMemo(() => {
    const set = new Set(classes.map((c) => c.cycleNom).filter(Boolean));

    return Array.from(set).sort();
  }, [classes]);

  // ============================================================
  // FILTRAGE DES CLASSES
  // ============================================================

  const classesFiltrees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return classes
      .filter((c) => {
        const nomClasse = (c.nomComplet || "").toLowerCase();

        const matchSearch = !q || nomClasse.includes(q);

        const matchCycle = !cycleFilter || c.cycleNom === cycleFilter;

        const matchNiveau = !niveauFilter || c.niveauNom === niveauFilter;

        return matchSearch && matchCycle && matchNiveau;
      })
      .sort((a, b) => {
        const cycle = (a.cycleNom || "").localeCompare(b.cycleNom || "");

        if (cycle !== 0) return cycle;

        const niveau = (a.niveauNom || "").localeCompare(b.niveauNom || "");

        if (niveau !== 0) return niveau;

        return (a.nomComplet || "").localeCompare(b.nomComplet || "");
      });
  }, [classes, search, cycleFilter, niveauFilter]);

  // ============================================================
  // TOTAUX
  // ============================================================

  const totaux = useMemo(
    () => ({
      nbClasses: classesFiltrees.length,

      nbElevesInscrits: classesFiltrees.reduce((s, c) => s + (c.nbElevesInscrits || 0), 0),

      nbElevesValides: classesFiltrees.reduce((s, c) => s + (c.nbElevesValides || 0), 0),
    }),
    [classesFiltrees]
  );

  // ============================================================
  // OUVRIR MODAL AJOUT MATIÈRE
  // ============================================================

  const ouvrirModalMatiere = (classe) => {
    if (!anneeScolaireActive?.id) {
      setErreurAnnee("Aucune année scolaire active. Activez une année avant d'ajouter une matière.");

      return;
    }

    setClasseMatiere(classe);
  };

  // ============================================================
  // APRÈS ENREGISTREMENT
  // ============================================================

  const handleMatiereSaved = async () => {
    console.log("✅ Programme enregistré");

    // Garder la classe concernée
    const classe = classeMatiere;

    // Fermer le modal Ajouter/Modifier
    setClasseMatiere(null);
    setProgrammeAModifier(null);

    // Recharger les statistiques
    await chargerClasses();

    // Réouvrir le modal des programmes
    if (classe) {
      setClasseProgrammes(classe);
    }
  };

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="space-y-5">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`,
              color: INK,
            }}
          >
            <Layers size={20} />
          </span>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
            <p className="text-sm text-slate-500">
              Vue d&apos;ensemble des classes et de leurs effectifs
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/admin/classes"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
          style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
        >
          <Plus size={18} />
          Ajouter une classe
        </Link>
      </div>

      {/* ======================================================
          ANNÉE ACTIVE
      ====================================================== */}

      <div className="flex flex-wrap items-center gap-3">
        {loadingAnnee ? (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
            <div
              className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: GOLD, borderTopColor: "transparent" }}
            />
            Chargement de l&apos;année...
          </div>
        ) : anneeScolaireActive ? (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ring-1 ring-inset"
            style={{ background: TEAL_SOFT, color: TEAL, boxShadow: `inset 0 0 0 1px ${TEAL_SOFT}` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: TEAL }} />
            Année active :
            <span className="font-semibold">
              {anneeScolaireActive.nom || anneeScolaireActive.libelle}
            </span>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
            style={{ background: `${GOLD}1A`, color: "#8A6A21" }}
          >
            <AlertCircle size={14} />
            Aucune année scolaire active
          </div>
        )}
      </div>

      {/* ======================================================
          ERREUR ANNÉE
      ====================================================== */}

      {erreurAnnee && !anneeScolaireActive && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
          style={{ background: CORAL_SOFT, color: CORAL }}
        >
          <AlertCircle size={16} />
          {erreurAnnee}
        </div>
      )}

      {/* ======================================================
          STATISTIQUES
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Classes"
          value={totaux.nbClasses}
          icon={Layers}
          iconBg={`${INK}0D`}
          iconColor={INK}
          valueColor={INK}
        />

        <StatCard
          label="Élèves inscrits (tous statuts)"
          value={totaux.nbElevesInscrits}
          icon={Users}
          iconBg={VIOLET_SOFT}
          iconColor={VIOLET}
          valueColor={VIOLET}
        />

        <StatCard
          label="Élèves validés"
          value={totaux.nbElevesValides}
          icon={CheckCircle2}
          iconBg={TEAL_SOFT}
          iconColor={TEAL}
          valueColor={TEAL}
        />
      </div>

      {/* ======================================================
          FILTRES
      ====================================================== */}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Rechercher une classe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:ring-4"
            style={{ "--tw-ring-color": `${GOLD}33` }}
            onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
            onBlur={(e) => (e.currentTarget.style.borderColor = "")}
          />
        </div>

        <div className="relative">
          <Filter
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={14}
          />
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-600 outline-none"
          >
            <option value="">Tous les cycles</option>

            {cyclesDisponibles.map((cycle) => (
              <option key={cycle} value={cycle}>
                {cycle}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <GraduationCap
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={14}
          />
          <select
            value={niveauFilter}
            onChange={(e) => setNiveauFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-600 outline-none"
          >
            <option value="">Tous les niveaux</option>

            {niveauxDisponibles.map((niveau) => (
              <option key={niveau} value={niveau}>
                {niveau}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ======================================================
          CLASSES
      ====================================================== */}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white py-16">
          <div className="flex items-center gap-3">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: GOLD, borderTopColor: "transparent" }}
            />
            <span className="text-sm text-slate-500">Chargement des classes...</span>
          </div>
        </div>
      ) : classesFiltrees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <span
            className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: `${INK}0D`, color: INK }}
          >
            <Layers size={26} />
          </span>

          <p className="text-sm font-medium text-slate-600">Aucune classe trouvée</p>

          <Link
            href="/dashboard/admin/classes/nouvelle"
            className="mt-3 flex items-center gap-1.5 text-sm font-medium"
            style={{ color: GOLD }}
          >
            <Plus size={14} />
            Créer votre première classe
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classesFiltrees.map((c) => (
            <div
              key={c.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="h-1 w-full" style={{ background: GOLD }} />

              <div className="flex flex-1 flex-col p-5">
                {/* ==============================================
                    HEADER CLASSE
                ============================================== */}

                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{c.nomComplet}</h3>

                    <p className="text-xs text-slate-400">
                      {c.cycleNom}
                      {" • "}
                      {c.niveauNom}
                    </p>
                  </div>

                  <span
                    className="rounded-full p-2"
                    style={{ background: VIOLET_SOFT, color: VIOLET }}
                  >
                    <Users size={16} />
                  </span>
                </div>

                {/* ==============================================
                    BADGES
                ============================================== */}

                <div className="flex flex-wrap gap-1.5">
                  {c.serieNom && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {c.serieNom}
                    </span>
                  )}

                  {c.groupeNom && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      Groupe {c.groupeNom}
                    </span>
                  )}
                </div>

                {/* ==============================================
                    EFFECTIFS
                ============================================== */}

                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Élèves validés</span>

                    <span className="font-semibold text-slate-800">{c.nbElevesValides}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Total inscrits (avec préinscrits)</span>

                    <span>{c.nbElevesInscrits}</span>
                  </div>
                </div>

                {/* ==============================================
                    SOUS-GROUPES
                ============================================== */}

                {c.sousGroupes && c.sousGroupes.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Sous-groupes
                    </p>

                    <div className="space-y-1.5">
                      {c.sousGroupes.map((sg) => (
                        <div
                          key={sg.id}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs"
                        >
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <UsersRound size={12} className="text-slate-400" />
                            {sg.nom}
                          </span>

                          <span
                            className="font-medium"
                            style={{
                              color:
                                sg.effectifMax && sg.effectifActuel >= sg.effectifMax
                                  ? CORAL
                                  : "#64748b",
                            }}
                          >
                            {sg.effectifActuel}
                            {sg.effectifMax ? ` / ${sg.effectifMax}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ==============================================
                    ACTIONS
                ============================================== */}

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  {/* SOUS-GROUPES */}
                  <Link
                    href={`/dashboard/admin/sousgroupe?classeId=${c.id}`}
                    className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-xs font-medium transition hover:brightness-95"
                    style={{ background: "#F1F5F9", color: "#475569" }}
                  >
                    <UsersRound size={13} />
                    Sous-groupes
                  </Link>

                  <button
                    type="button"
                    onClick={() => ouvrirModalProgrammes(c)}
                    disabled={!anneeScolaireActive?.id || loadingAnnee}
                    title={
                      !anneeScolaireActive?.id
                        ? "Aucune année scolaire active"
                        : "Voir les programmes de cette classe"
                    }
                    className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: TEAL_SOFT, color: TEAL }}
                  >
                    <BookOpen size={14} />
                    Programmes
                  </button>

                  {/* AFFECTATIONS */}
                  <Link
                    href={`/dashboard/admin/enseignants/affectation?classeId=${c.id}`}
                    className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition hover:brightness-95"
                    style={{ background: VIOLET_SOFT, color: VIOLET }}
                  >
                    Affectations
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          MODAL PROGRAMMES DE LA CLASSE
      ======================================================== */}

      {classeProgrammes && (
        <ModalProgrammesClasse
          classe={classeProgrammes}
          ecoleId={ecoleId}
          anneeScolaireId={anneeScolaireActive?.id}
          onClose={() => {
            setClasseProgrammes(null);
          }}
          onAjouter={() => {
            setProgrammeAModifier(null);
            setClasseProgrammes(null);
            setClasseMatiere(classeProgrammes);
          }}
          onModifier={(programme) => {
            console.log("✏️ PROGRAMME À MODIFIER =", programme);

            setProgrammeAModifier(programme);
            setClasseProgrammes(null);
            setClasseMatiere(classeProgrammes);
          }}
        />
      )}

      {/* ========================================================
          MODAL AJOUT / MODIFICATION MATIÈRE
      ======================================================== */}

      {classeMatiere && (
        <ModalAjouterMatiere
          classe={classeMatiere}
          anneeScolaireId={anneeScolaireActive?.id}
          programme={programmeAModifier}
          onClose={() => {
            setClasseMatiere(null);
            setProgrammeAModifier(null);
          }}
          onSaved={handleMatiereSaved}
        />
      )}
    </div>
  );
}