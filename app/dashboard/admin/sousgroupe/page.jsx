"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Users,
  UserPlus,
  UserMinus,
  Check,
  CalendarDays,
  RefreshCw,
  X,
} from "lucide-react";
import api from "../../../../lib/api";

// ============================================================
// CONSTANTES
// ============================================================

const TYPE_LABELS = {
  TP: "Travaux pratiques",
  LANGUE: "Langue / option",
  NIVEAU: "Groupe de niveau",
  AUTRE: "Autre",
};

// ============================================================
// COMPOSANTS
// ============================================================

function Badge({ children, color = "slate" }) {
  const colors = {
    slate: "bg-slate-100 text-slate-600",
    indigo: "bg-indigo-50 text-indigo-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[color] || colors.slate
      }`}
    >
      {children}
    </span>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function SousGroupesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // ============================================================
  // ÉTATS
  // ============================================================

  // Contexte
  const [ecoleId, setEcoleId] = useState(null);

  // Classe
  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState("");

  // Année scolaire
  const [anneeId, setAnneeId] = useState(null);
  const [anneeActive, setAnneeActive] = useState(null);
  const [chargementAnnee, setChargementAnnee] = useState(false);

  // Sous-groupes
  const [sousGroupes, setSousGroupes] = useState([]);
  const [sousGroupeSelectionne, setSousGroupeSelectionne] = useState(null);
  const [loadingSousGroupes, setLoadingSousGroupes] = useState(false);

  // Élèves
  const [elevesClasse, setElevesClasse] = useState([]);
  const [loadingEleves, setLoadingEleves] = useState(false);

  // Formulaire création
  const [showCreate, setShowCreate] = useState(false);
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauType, setNouveauType] = useState("AUTRE");
  const [effectifMax, setEffectifMax] = useState("");

  // Feedback
  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState(null);

  // ============================================================
  // EFFETS
  // ============================================================

  // Initialisation de l'école
  useEffect(() => {
    if (user?.ecole?.id) {
      setEcoleId(user.ecole.id);
    }
  }, [user]);

  // Synchronisation avec l'URL
  useEffect(() => {
    const classeIdFromUrl = searchParams.get("classeId");
    if (classeIdFromUrl) {
      setClasseId(classeIdFromUrl);
    }
  }, [searchParams]);

  // Chargement de l'année active
  useEffect(() => {
    if (!ecoleId) return;

    const chargerAnneeActive = async () => {
      setChargementAnnee(true);
      try {
        const response = await api.get(`/annees/ecole/${ecoleId}`);

        const annees = Array.isArray(response.data) ? response.data : [];
        const active = annees.find(
          (annee) => annee.active === true || annee.active === "true"
        );

        if (active) {
          setAnneeActive(active);
          setAnneeId(active.id);
        } else {
          setAnneeActive(null);
          setAnneeId(null);
        }
      } catch (error) {
        console.error("Erreur récupération année scolaire :", error);
        setAnneeActive(null);
        setAnneeId(null);
      } finally {
        setChargementAnnee(false);
      }
    };

    chargerAnneeActive();
  }, [ecoleId]);

  // Chargement des classes
  useEffect(() => {
    if (!ecoleId) return;

    const chargerClasses = async () => {
      try {
        const response = await api.get(`/classes/ecole/${ecoleId}`);
        setClasses(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erreur classes :", error);
        setClasses([]);
      }
    };

    chargerClasses();
  }, [ecoleId]);

  // Chargement des données principales
  useEffect(() => {
    if (!classeId || !anneeId) {
      setSousGroupes([]);
      setElevesClasse([]);
      setSousGroupeSelectionne(null);
      return;
    }

    setSousGroupeSelectionne(null);
    chargerSousGroupes();
    chargerEleves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classeId, anneeId]);

  // ============================================================
  // FONCTIONS
  // ============================================================

  const chargerSousGroupes = useCallback(async () => {
    if (!classeId || !anneeId) {
      setSousGroupes([]);
      return;
    }

    setLoadingSousGroupes(true);

    try {
      const response = await api.get(
        `/sous-groupes/classe/${classeId}/annee/${anneeId}`
      );

      const liste = Array.isArray(response.data) ? response.data : [];
      setSousGroupes(liste);

      // Mise à jour de la sélection
      setSousGroupeSelectionne((prev) => {
        if (!prev) return null;
        return liste.find((sg) => sg.id === prev.id) || null;
      });
    } catch (error) {
      console.error("Erreur sous-groupes :", error);
      setSousGroupes([]);
    } finally {
      setLoadingSousGroupes(false);
    }
  }, [classeId, anneeId]);

  const chargerEleves = useCallback(async () => {
    if (!classeId) {
      setElevesClasse([]);
      return;
    }

    setLoadingEleves(true);

    try {
      const response = await api.get(
        `/sous-groupes/classe/${classeId}/eleves-annee-active`
      );

      setElevesClasse(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erreur élèves :", error);
      setElevesClasse([]);
    } finally {
      setLoadingEleves(false);
    }
  }, [classeId]);

  const rafraichir = async () => {
    if (!classeId || !anneeId) return;

    await Promise.all([chargerSousGroupes(), chargerEleves()]);
    afficherToast("✓ Données actualisées");
  };

  const afficherToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const creerSousGroupe = async (e) => {
    e.preventDefault();
    setErreur("");

    if (!classeId) {
      setErreur("Veuillez sélectionner une classe.");
      return;
    }

    if (!anneeId) {
      setErreur("Aucune année scolaire active.");
      return;
    }

    if (!nouveauNom.trim()) {
      setErreur("Le nom du sous-groupe est obligatoire.");
      return;
    }

    try {
      await api.post(`/sous-groupes`, {
        nom: nouveauNom.trim(),
        type: nouveauType,
        classeId: Number(classeId),
        anneeScolaireId: Number(anneeId),
        effectifMax: effectifMax ? Number(effectifMax) : null,
      });

      // Réinitialisation du formulaire
      setNouveauNom("");
      setEffectifMax("");
      setNouveauType("AUTRE");
      setShowCreate(false);
      afficherToast("✓ Sous-groupe créé avec succès");

      await chargerSousGroupes();
    } catch (error) {
      console.error("Erreur création sous-groupe :", error);
      setErreur(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Erreur lors de la création du sous-groupe."
      );
    }
  };

  const affecterEleve = async (eleveId) => {
    if (!sousGroupeSelectionne) return;

    try {
      await api.put(
        `/sous-groupes/${sousGroupeSelectionne.id}/affecter/${eleveId}`
      );

      const eleve = elevesClasse.find((e) => e.id === eleveId);
      afficherToast(
        `✓ ${eleve?.prenom || ""} ${eleve?.nom || ""} ajouté au sous-groupe`
      );

      await Promise.all([chargerSousGroupes(), chargerEleves()]);
    } catch (error) {
      console.error("Erreur affectation élève :", error);
      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Impossible d'affecter l'élève."
      );
    }
  };

  const retirerEleve = async (eleveId) => {
    if (!sousGroupeSelectionne) return;

    try {
      await api.delete(
        `/sous-groupes/${sousGroupeSelectionne.id}/retirer/${eleveId}`
      );

      afficherToast("✓ Élève retiré du sous-groupe");
      await Promise.all([chargerSousGroupes(), chargerEleves()]);
    } catch (error) {
      console.error("Erreur retrait élève :", error);
      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Impossible de retirer l'élève."
      );
    }
  };

  // ============================================================
  // CALCULS
  // ============================================================

  const { dedans, dehors } = useMemo(() => {
    if (!sousGroupeSelectionne) {
      return { dedans: [], dehors: elevesClasse };
    }

    return {
      dedans: elevesClasse.filter((eleve) =>
        eleve.sousGroupeIds?.includes(sousGroupeSelectionne.id)
      ),
      dehors: elevesClasse.filter(
        (eleve) => !eleve.sousGroupeIds?.includes(sousGroupeSelectionne.id)
      ),
    };
  }, [sousGroupeSelectionne, elevesClasse]);

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="space-y-5">
      {/* EN-TÊTE */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sous-groupes
          </h1>
          <p className="text-sm text-slate-500">
            Gérez les groupes de TP, langues ou niveaux à l'intérieur d'une
            classe.
          </p>
        </div>

        <button
          type="button"
          onClick={rafraichir}
          disabled={!classeId || !anneeId || loadingSousGroupes || loadingEleves}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loadingSousGroupes || loadingEleves ? "animate-spin" : ""}
          />
          Actualiser
        </button>
      </div>

      {/* FILTRES */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* Classe */}
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Classe
            </label>
            <select
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Choisir une classe</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nomComplet}
                </option>
              ))}
            </select>
          </div>

          {/* Année scolaire */}
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Année scolaire
            </label>
            <div className="flex h-[42px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <CalendarDays size={16} className="text-indigo-500" />
              {chargementAnnee ? (
                <span className="text-sm text-slate-400">Chargement...</span>
              ) : anneeActive ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {anneeActive.libelle ||
                      anneeActive.nom ||
                      anneeActive.annee ||
                      `Année #${anneeActive.id}`}
                  </span>
                  <Badge color="emerald">Active</Badge>
                </div>
              ) : (
                <span className="text-sm text-rose-500">
                  Aucune année active
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AVERTISSEMENT ANNÉE */}
      {!chargementAnnee && !anneeId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Aucune année scolaire active n'est configurée. Les sous-groupes ne
          peuvent pas être chargés ou créés.
        </div>
      )}

      {/* CONTENU PRINCIPAL */}
      {classeId && anneeId && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LISTE DES SOUS-GROUPES */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/40 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800">Sous-groupes</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {sousGroupes.length} groupe{sousGroupes.length > 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErreur("");
                  setShowCreate(!showCreate);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-700"
              >
                <Plus size={14} />
                Nouveau
              </button>
            </div>

            {/* FORMULAIRE DE CRÉATION */}
            {showCreate && (
              <form
                onSubmit={creerSousGroupe}
                className="mb-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Nouveau sous-groupe
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setErreur("");
                    }}
                    className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600"
                  >
                    <X size={15} />
                  </button>
                </div>

                {erreur && (
                  <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                    {erreur}
                  </div>
                )}

                <input
                  placeholder="Nom (ex : TP Physique 1)"
                  value={nouveauNom}
                  onChange={(e) => setNouveauNom(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />

                <select
                  value={nouveauType}
                  onChange={(e) => setNouveauType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="Effectif max (optionnel)"
                  value={effectifMax}
                  onChange={(e) => setEffectifMax(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />

                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  Créer le sous-groupe
                </button>
              </form>
            )}

            {/* LISTE DES SOUS-GROUPES */}
            {loadingSousGroupes ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw size={20} className="animate-spin text-indigo-500" />
              </div>
            ) : sousGroupes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                <Users size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">
                  Aucun sous-groupe
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Aucun groupe n'est créé pour cette classe durant l'année
                  active.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {sousGroupes.map((sg) => (
                  <li key={sg.id}>
                    <button
                      type="button"
                      onClick={() => setSousGroupeSelectionne(sg)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        sousGroupeSelectionne?.id === sg.id
                          ? "border-indigo-300 bg-indigo-50 shadow-sm"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {sg.nom}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Badge color="indigo">
                              {TYPE_LABELS[sg.type] || sg.type}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Users size={12} />
                              {sg.effectifActuel || 0}
                              {sg.effectifMax ? ` / ${sg.effectifMax}` : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* GESTION DES ÉLÈVES */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/40 lg:col-span-2">
            {!sousGroupeSelectionne ? (
              <div className="flex h-full min-h-[350px] flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-indigo-50 p-4">
                  <Users size={28} className="text-indigo-500" />
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  Sélectionnez un sous-groupe
                </p>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  Sélectionnez un groupe à gauche pour gérer les élèves de
                  l'année scolaire active.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-800">
                      Élèves — {sousGroupeSelectionne.nom}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Année scolaire :{" "}
                      {anneeActive?.libelle ||
                        anneeActive?.nom ||
                        anneeActive?.annee ||
                        `#${anneeId}`}
                    </p>
                  </div>
                  <Badge color="indigo">
                    {dedans.length} élève{dedans.length > 1 ? "s" : ""}
                  </Badge>
                </div>

                {loadingEleves ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw size={20} className="animate-spin text-indigo-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* DANS LE SOUS-GROUPE */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Dans le sous-groupe
                        </p>
                        <Badge color="emerald">{dedans.length}</Badge>
                      </div>
                      <ul className="space-y-1.5">
                        {dedans.length === 0 && (
                          <li className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                            Aucun élève pour l'instant.
                          </li>
                        )}
                        {dedans.map((eleve) => (
                          <li
                            key={eleve.id}
                            className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5 text-sm"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                <Check size={13} className="text-emerald-600" />
                              </span>
                              <span className="truncate text-slate-700">
                                {eleve.prenom} {eleve.nom}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => retirerEleve(eleve.id)}
                              className="ml-2 shrink-0 rounded-md p-1 text-rose-500 transition hover:bg-rose-100 hover:text-rose-700"
                              title="Retirer"
                            >
                              <UserMinus size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* HORS DU SOUS-GROUPE */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Reste de la classe
                        </p>
                        <Badge>{dehors.length}</Badge>
                      </div>
                      <ul className="space-y-1.5">
                        {dehors.length === 0 && (
                          <li className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                            Tous les élèves sont déjà affectés.
                          </li>
                        )}
                        {dehors.map((eleve) => (
                          <li
                            key={eleve.id}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm transition hover:bg-slate-100"
                          >
                            <span className="truncate text-slate-700">
                              {eleve.prenom} {eleve.nom}
                            </span>
                            <button
                              type="button"
                              onClick={() => affecterEleve(eleve.id)}
                              className="ml-2 shrink-0 rounded-md p-1 text-indigo-500 transition hover:bg-indigo-100 hover:text-indigo-700"
                              title="Ajouter"
                            >
                              <UserPlus size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <Check size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}