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

function Avatar({ nom, prenom, size = "h-8 w-8 text-xs" }) {
  const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${size}`}
      style={{ background: TEAL_SOFT, color: TEAL }}
    >
      {initials}
    </div>
  );
}

function formatMoyenne(valeur) {
  return valeur != null ? Number(valeur).toFixed(2) : "-";
}

const COLONNES = 9;

/**
 * Contenu de la réinscription pour le second cycle (LYCEE).
 * Ne contient ni header ni lien "retour" : ceux-ci vivent dans la page
 * parente ReinscriptionPage, qui affiche ce composant ou
 * ReinscriptionPrimaireSection selon le cycle choisi.
 */
export default function ReinscriptionSecondaireSection({ cycleId, cycleNom }) {
  const { user } = useAuth();

  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [erreur, setErreur] = useState("");
  const ecoleId = user?.ecole?.id;

  // Les deux listes sont chargées ensemble et les élèves sont filtrés
  // par le cycle de leur ANCIENNE inscription, pas par leur nouvelle classe.
  useEffect(() => {
    if (!ecoleId || cycleId == null) {
      setEleves([]);
      setClasses([]);
      setLoading(false);
      return;
    }

    let actif = true;
    setLoading(true);
    setErreur("");
    setSelectedClasses({});

    Promise.all([
      api.get(`/inscriptions/ecole/${ecoleId}/reinscription`),
      api.get(`/classes/ecole/${ecoleId}`),
    ])
      .then(([resEleves, resClasses]) => {
        if (!actif) return;
        setEleves(Array.isArray(resEleves.data) ? resEleves.data : []);
        setClasses(Array.isArray(resClasses.data) ? resClasses.data : []);
      })
      .catch((error) => {
        if (!actif) return;
        console.error("Erreur chargement réinscriptions :", error);
        setErreur(error.response?.data?.message || "Impossible de charger les réinscriptions.");
        setEleves([]);
        setClasses([]);
      })
      .finally(() => {
        if (actif) setLoading(false);
      });

    return () => { actif = false; };
  }, [ecoleId, cycleId]);

  const classesDuCycle = useMemo(
    () => classes.filter((c) => {
      const id = c.niveau?.cycle?.id ?? c.cycleId ?? c.cycle?.id;
      return id != null && String(id) === String(cycleId);
    }),
    [classes, cycleId]
  );

  // Le backend ReinscriptionReponseDTO doit exposer cycleId et classeId.
  // Ancien format : on peut retrouver le cycle par classeId, jamais par nom.
  const elevesDuCycle = useMemo(() => {
    const cycleParClasse = new Map(classes.map((c) => [
      String(c.id), c.niveau?.cycle?.id ?? c.cycleId ?? c.cycle?.id,
    ]));
    return eleves.filter((e) => {
      const id = e.cycleId ?? (e.classeId != null
        ? cycleParClasse.get(String(e.classeId)) : null);
      return id != null && String(id) === String(cycleId);
    });
  }, [eleves, classes, cycleId]);

  const sansCycle = useMemo(() => eleves.filter((e) => {
    if (e.cycleId != null) return false;
    const classe = classes.find((c) => String(c.id) === String(e.classeId));
    return !classe || (classe.niveau?.cycle?.id ?? classe.cycleId ?? classe.cycle?.id) == null;
  }).length, [eleves, classes]);

  const loadElevesReinscription = async () => {
    const res = await api.get(`/inscriptions/ecole/${ecoleId}/reinscription`);
    setEleves(Array.isArray(res.data) ? res.data : []);
  };

  // ===================== CHANGE =====================
  const handleClasseChange = (inscriptionId, classeId) => {
    setSelectedClasses((prev) => ({
      ...prev,
      [inscriptionId]: classeId,
    }));
  };

  // ===================== REINSCRIRE =====================
  const reinscrire = async (inscriptionId) => {
    const classeId = selectedClasses[inscriptionId];

    if (!classeId || !classesDuCycle.some((c) => String(c.id) === String(classeId))) {
      alert("Choisissez une classe du cycle sélectionné");
      return;
    }

    setBusyId(inscriptionId);
    try {
      const res = await api.post(`/inscriptions/${inscriptionId}/reinscrire/${classeId}`);

      alert(res.data?.message || "✅ Réinscription effectuée");

      await loadElevesReinscription();
    } catch (error) {
      console.error("Erreur complète :", error);
      const message = error.response?.data?.message || error.response?.data;
      alert(typeof message === "string" ? message : "Erreur lors de la réinscription");
    } finally {
      setBusyId(null);
    }
  };

  const elevesTries = useMemo(
    () => [...elevesDuCycle].sort((a, b) => (a.classeNom || "").localeCompare(b.classeNom || "")),
    [elevesDuCycle]
  );

  return (
    <div className="space-y-5">
      {cycleId == null && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Aucun cycle sélectionné. Vérifie que la page parente transmet cycleId.
        </p>
      )}
      {erreur && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}
      {!loading && sansCycle > 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          {sansCycle} élève(s) ne peuvent pas être classés par cycle : vérifie les champs
          cycleId et classeId de ReinscriptionReponseDTO dans la réponse API.
        </p>
      )}
      {!loading && elevesTries.length > 0 && classesDuCycle.length === 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Aucune classe disponible pour {cycleNom || "ce cycle"}. Vérifie niveau.cycle.id dans l’API des classes.
        </p>
      )}
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
                Vérifie les élèves et les identifiants de cycle renvoyés par le backend.
              </p>
            </div>
          </div>
        )}

        {!loading &&
          elevesTries.map((e) => (
            <div key={e.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar nom={e.nom} prenom={e.prenom} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {e.prenom} {e.nom}
                    </p>
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
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Mention :</span> {e.mention ?? "-"}
                </p>
                <p>
                  <span className="text-slate-400">Décision :</span>{" "}
                  <span className="font-semibold" style={{ color: TEAL }}>
                    {e.decision ?? "-"}
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
                    value={selectedClasses[e.id] || ""}
                    onChange={(ev) => handleClasseChange(e.id, ev.target.value)}
                  >
                    <option value="">Choisir une classe</option>
                    {classesDuCycle.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nomComplet}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  disabled={busyId !== null || e.statutReinscription === "REINSCRIT" || !selectedClasses[e.id] || classesDuCycle.length === 0}
                  onClick={() => reinscrire(e.id)}
                  className="mt-2 w-full rounded-lg py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: TEAL }}
                >
                  {e.statutReinscription === "REINSCRIT" ? "Déjà réinscrit" : busyId === e.id ? "En cours..." : "Réinscrire"}
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
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Moyenne</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Mention</th>
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
                        Vérifie les élèves et les identifiants de cycle renvoyés par le backend.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                elevesTries.map((e) => (
                  <tr key={e.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar nom={e.nom} prenom={e.prenom} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">
                            {e.prenom} {e.nom}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{e.matricule}</td>
                    <td className="px-4 py-3 text-slate-500">{e.classeNom || "—"}</td>

                    <td className="hidden px-4 py-3 font-semibold lg:table-cell" style={{ color: TEAL }}>
                      {formatMoyenne(e.moyenneAnnuelle)}
                    </td>

                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">{e.mention ?? "-"}</td>

                    <td className="px-4 py-3 font-semibold" style={{ color: TEAL }}>
                      {e.decision ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      <StatutBadge statut={e.statutReinscription} />
                    </td>

                    <td className="px-4 py-3">
                      {e.statutReinscription === "REINSCRIT" ? (
                        <span className="text-slate-600">{e.nouvelleClasseNom}</span>
                      ) : (
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#C89B3C]"
                          value={selectedClasses[e.id] || ""}
                          onChange={(ev) => handleClasseChange(e.id, ev.target.value)}
                        >
                          <option value="">Choisir une classe</option>
                          {classesDuCycle.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nomComplet}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={busyId !== null || e.statutReinscription === "REINSCRIT" || !selectedClasses[e.id] || classesDuCycle.length === 0}
                        onClick={() => reinscrire(e.id)}
                        className="whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: TEAL }}
                      >
                        {e.statutReinscription === "REINSCRIT" ? "Déjà réinscrit" : busyId === e.id ? "En cours..." : "Réinscrire"}
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
