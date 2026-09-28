"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../../../context/AuthContext";
import api from "../../../../../../../lib/api";
import { Users } from "lucide-react";

/* =========================================================
   PALETTE (identique au reste de l'application)
========================================================= */
const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_DARK = "#8A6A21";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";

const STATUT_STYLES = {
  REINSCRIT: { background: TEAL_SOFT, color: TEAL },
  NON_REINSCRIT: { background: `${GOLD}1A`, color: GOLD_DARK },
};

// Libellés de l'enum DecisionConseil (backend), pour affichage.
const DECISION_LABELS = {
  ADMISSION_CLASSE_SUPERIEURE: "Admission en classe supérieure",
  REDOUBLEMENT: "Redoublement",
  EXCLUSION: "Exclusion",
};

function StatutBadge({ statut }) {
  const style = STATUT_STYLES[statut] || { background: "#F1F5F9", color: "#64748B" };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={style}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />
      {statut ?? "NON_REINSCRIT"}
    </span>
  );
}

function Avatar({ nomEtPrenom, size = "h-8 w-8 text-xs" }) {
  const parts = (nomEtPrenom || "").trim().split(/\s+/);
  const initials = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${size}`}
      style={{ background: TEAL_SOFT, color: TEAL }}
    >
      {initials || "?"}
    </div>
  );
}

function formatMoyenne(valeur) {
  return valeur != null ? Number(valeur).toFixed(2) : "-";
}

function formatRang(rang) {
  return rang != null ? `${rang}e` : "-";
}

function libelleDecision(decision) {
  if (!decision) return "-";
  return DECISION_LABELS[decision] || decision;
}

// Le cycle n'est pas un champ direct de Classe : il est porté par
// Classe.niveau.cycle.nom (voir entités Niveau / Cycle côté backend).
function getCycleNom(classe) {
  return (classe?.niveau?.cycle?.nom || "").toString().trim().toUpperCase();
}

function estClassePrimaire(classe) {
  return getCycleNom(classe) === "PREMIER CYCLE";
}

const COLONNES = 9;

/**
 * Contenu de la réinscription pour le premier cycle (primaire).
 * Ne contient ni header ni lien "retour" : ceux-ci vivent dans la page
 * parente ReinscriptionPage, qui affiche ce composant ou
 * ReinscriptionSecondaireSection selon le cycle choisi.
 */
export default function ReinscriptionPrimaireSection() {
  const { user } = useAuth();

  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!user?.ecole?.id) return;

    loadElevesReinscription();
    loadClasses();
  }, [user]);

  // ===================== ÉLÈVES (primaire) =====================
  const loadElevesReinscription = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reinscriptions-primaire/ecole/${user.ecole.id}`);
      setEleves(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erreur chargement élèves primaire :", error);
      setEleves([]);
    } finally {
      setLoading(false);
    }
  };

  // ===================== CLASSES (filtrées au primaire) =====================
  const loadClasses = async () => {
    try {
      const res = await api.get(`/classes/ecole/${user.ecole.id}`);
      const toutes = Array.isArray(res.data) ? res.data : [];
      setClasses(toutes.filter(estClassePrimaire));
    } catch (error) {
      console.error("Erreur chargement classes :", error);
      setClasses([]);
    }
  };

  // ===================== CHANGE =====================
  const handleClasseChange = (ancienneInscriptionId, classeId) => {
    setSelectedClasses((prev) => ({
      ...prev,
      [ancienneInscriptionId]: classeId,
    }));
  };

  // ===================== RÉINSCRIRE =====================
  const reinscrire = async (ancienneInscriptionId) => {
    const nouvelleClasseId = selectedClasses[ancienneInscriptionId];

    if (!nouvelleClasseId) {
      alert("Choisissez une classe");
      return;
    }

    setBusyId(ancienneInscriptionId);
    try {
      await api.post("/reinscriptions-primaire", {
        ancienneInscriptionId: Number(ancienneInscriptionId),
        nouvelleClasseId: Number(nouvelleClasseId),
      });

      alert("✅ Réinscription effectuée");

      await loadElevesReinscription();
    } catch (error) {
      console.error("Erreur complète :", error);
      alert(error.response?.data?.message || error.response?.data || "Erreur lors de la réinscription");
    } finally {
      setBusyId(null);
    }
  };

  const elevesTries = useMemo(
    () => [...eleves].sort((a, b) => (a.classeNom || "").localeCompare(b.classeNom || "")),
    [eleves]
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        {loading ? "Chargement..." : `${elevesTries.length} élève${elevesTries.length > 1 ? "s" : ""} à traiter`}
      </p>

      {/* ===== VUE MOBILE : CARTES ===== */}
      <div className="space-y-3 sm:hidden">
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-10 text-center text-sm text-slate-400 shadow-sm">
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: GOLD, borderTopColor: "transparent" }}
            />
            Chargement...
          </div>
        )}

        {!loading && elevesTries.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-10 shadow-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: `${INK}0D`, color: INK }}
              >
                <Users size={22} />
              </div>
              <p className="text-sm font-medium text-slate-600">Aucun élève à réinscrire</p>
              <p className="text-xs text-slate-400">
                Tous les élèves de l&apos;année précédente ont déjà été traités.
              </p>
            </div>
          </div>
        )}

        {!loading &&
          elevesTries.map((e) => (
            <div
              key={e.ancienneInscriptionId}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar nomEtPrenom={e.nomEtPrenom} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{e.nomEtPrenom}</p>
                    <p className="truncate text-xs text-slate-400">{e.classeNom || "Non affecté"}</p>
                  </div>
                </div>
                <StatutBadge statut={e.statutReinscription} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <p>
                  <span className="text-slate-400">Matricule :</span> {e.matricule || "—"}
                </p>
                <p>
                  <span className="text-slate-400">Moyenne :</span>{" "}
                  <span className="font-semibold" style={{ color: TEAL }}>
                    {formatMoyenne(e.moyenneAnnuelle)}
                    <span className="ml-0.5 text-[10px] font-normal text-slate-400">/10</span>
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Rang :</span> {formatRang(e.rang)}
                </p>
                <p>
                  <span className="text-slate-400">Décision :</span>{" "}
                  <span className="font-semibold" style={{ color: TEAL }}>
                    {libelleDecision(e.decision)}
                  </span>
                </p>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3">
                {e.statutReinscription === "REINSCRIT" ? (
                  <p className="text-sm text-slate-600">
                    Nouvelle classe : <span className="font-medium">{e.nouvelleClasseNom}</span>
                  </p>
                ) : (
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                    value={selectedClasses[e.ancienneInscriptionId] || ""}
                    onChange={(ev) => handleClasseChange(e.ancienneInscriptionId, ev.target.value)}
                  >
                    <option value="">Choisir une classe</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nomComplet}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  disabled={busyId === e.ancienneInscriptionId || e.statutReinscription === "REINSCRIT"}
                  onClick={() => reinscrire(e.ancienneInscriptionId)}
                  className="mt-2 w-full rounded-lg py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: TEAL }}
                >
                  {e.statutReinscription === "REINSCRIT" ? "Déjà réinscrit" : "Réinscrire"}
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* ===== VUE DESKTOP : TABLEAU ===== */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40 sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"
                style={{ background: "#F8F7F2" }}
              >
                <th className="px-4 py-3 font-medium">Élève</th>
                <th className="px-4 py-3 font-medium">Matricule</th>
                <th className="px-4 py-3 font-medium">Classe actuelle</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Moyenne /10</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Rang</th>
                <th className="px-4 py-3 font-medium">Décision</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Nouvelle classe</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr>
                  <td colSpan={COLONNES} className="px-4 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <div
                        className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                        style={{ borderColor: GOLD, borderTopColor: "transparent" }}
                      />
                      Chargement...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && elevesTries.length === 0 && (
                <tr>
                  <td colSpan={COLONNES} className="px-4 py-14">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{ background: `${INK}0D`, color: INK }}
                      >
                        <Users size={22} />
                      </div>
                      <p className="text-sm font-medium text-slate-600">Aucun élève à réinscrire</p>
                      <p className="text-xs text-slate-400">
                        Tous les élèves de l&apos;année précédente ont déjà été traités.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                elevesTries.map((e) => (
                  <tr key={e.ancienneInscriptionId} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar nomEtPrenom={e.nomEtPrenom} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{e.nomEtPrenom}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{e.matricule}</td>
                    <td className="px-4 py-3 text-slate-500">{e.ancienneClasse || "—"}</td>

                    <td className="hidden px-4 py-3 font-semibold lg:table-cell" style={{ color: TEAL }}>
                      {formatMoyenne(e.moyenneAnnuelle)}
                    </td>

                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                      {formatRang(e.rang)}
                    </td>

                    <td className="px-4 py-3 font-semibold" style={{ color: TEAL }}>
                      {libelleDecision(e.decisionConseil)}
                    </td>

                    <td className="px-4 py-3">
                      <StatutBadge statut={e.statutReinscription} />
                    </td>

                    <td className="px-4 py-3">
                      {e.statutReinscription === "REINSCRIT" ? (
                        <span className="text-slate-600">{e.nouvelleClasse}</span>
                      ) : (
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#C89B3C]"
                          value={selectedClasses[e.ancienneInscriptionId] || ""}
                          onChange={(ev) => handleClasseChange(e.ancienneInscriptionId, ev.target.value)}
                        >
                          <option value="">Choisir une classe</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nomComplet}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={busyId === e.ancienneInscriptionId || e.statutReinscription === "REINSCRIT"}
                        onClick={() => reinscrire(e.ancienneInscriptionId)}
                        className="whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: TEAL }}
                      >
                        {e.statutReinscription === "REINSCRIT" ? "Déjà réinscrit" : "Réinscrire"}
                      </button>
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
