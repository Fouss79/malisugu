"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";

/* =========================================================
   HELPERS
========================================================= */

function extraireMessageErreur(err, messageParDefaut) {
  const data = err?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  return err?.message || messageParDefaut;
}

function formatDate(date) {
  if (!date) return "-";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatHeure(heure) {
  if (!heure) return "-";
  // "08:00:00" -> "08:00"
  return String(heure).slice(0, 5);
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

// Doit rester identique à CAPACITE_PAR_DEFAUT côté backend
// (RepartitionExamenService), sinon l'aperçu affiché ici ne
// correspondra plus à ce que le backend calcule réellement.
const CAPACITE_PAR_DEFAUT = 30;

function capaciteEffective(salle) {
  const valeur = Number(salle?.capacite);
  return Number.isFinite(valeur) && valeur > 0
    ? valeur
    : CAPACITE_PAR_DEFAUT;
}

/* =========================================================
   MODAL EXAMEN (création / édition)
========================================================= */

function ModalExamen({
  examen,
  ecoleId,
  anneeScolaireId,
  onClose,
  onSaved,
}) {
  const estEdition = Boolean(examen?.id);

  const [libelle, setLibelle] = useState(examen?.libelle || "");
  const [dateExamen, setDateExamen] = useState(
    examen?.dateExamen || getToday()
  );
  const [heureDebut, setHeureDebut] = useState(
    formatHeure(examen?.heureDebut) !== "-"
      ? formatHeure(examen?.heureDebut)
      : ""
  );
  const [heureFin, setHeureFin] = useState(
    formatHeure(examen?.heureFin) !== "-"
      ? formatHeure(examen?.heureFin)
      : ""
  );
  const [actif, setActif] = useState(
    examen?.actif !== undefined ? examen.actif : true
  );

  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErreur("");

    if (!libelle.trim()) {
      setErreur("Le libellé de l'examen est obligatoire.");
      return;
    }

    if (!dateExamen) {
      setErreur("La date de l'examen est obligatoire.");
      return;
    }

    if (heureDebut && heureFin && heureFin < heureDebut) {
      setErreur("L'heure de fin ne peut pas précéder l'heure de début.");
      return;
    }

    const payload = {
      libelle: libelle.trim(),
      dateExamen,
      heureDebut: heureDebut ? `${heureDebut}:00` : null,
      heureFin: heureFin ? `${heureFin}:00` : null,
      actif,
      ecole: { id: ecoleId },
      anneeScolaire: { id: Number(anneeScolaireId) },
    };

    setSubmitting(true);

    try {
      if (estEdition) {
        await api.put(`/examens/${examen.id}`, payload);
      } else {
        await api.post("/examens", payload);
      }

      onSaved();
    } catch (err) {
      console.error("Erreur enregistrement examen :", err);

      setErreur(
        extraireMessageErreur(
          err,
          "Impossible d'enregistrer l'examen."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {estEdition ? "Modifier l'examen" : "Nouvel examen"}
        </h2>

        {erreur && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erreur}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Libellé *
            </label>

            <input
              type="text"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex : Composition du 1er trimestre"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Date de l'examen *
            </label>

            <input
              type="date"
              value={dateExamen}
              onChange={(e) => setDateExamen(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Heure de début
              </label>

              <input
                type="time"
                value={heureDebut}
                onChange={(e) => setHeureDebut(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Heure de fin
              </label>

              <input
                type="time"
                value={heureFin}
                onChange={(e) => setHeureFin(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={actif}
              onChange={(e) => setActif(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Examen actif
          </label>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:flex-1"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
            >
              {submitting
                ? "Enregistrement..."
                : estEdition
                ? "Enregistrer les modifications"
                : "Créer l'examen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL RÉPARTITION
========================================================= */

function ModalRepartition({ examen, classes, salles, onClose }) {
  const [classeIds, setClasseIds] = useState([]);
  const [salleIds, setSalleIds] = useState([]);
  const [mode, setMode] = useState("ALPHABETIQUE");

  const [repartition, setRepartition] = useState([]);
  const [loadingRepartition, setLoadingRepartition] = useState(true);
  const [lancement, setLancement] = useState(false);
  const [suppression, setSuppression] = useState(false);

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const chargerRepartitionExistante = async () => {
    setLoadingRepartition(true);

    try {
      const res = await api.get(`/examens/${examen.id}/repartition`);
      setRepartition(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erreur chargement répartition :", err);
      // Pas bloquant : l'examen peut simplement ne pas encore avoir de répartition.
    } finally {
      setLoadingRepartition(false);
    }
  };

  useEffect(() => {
    chargerRepartitionExistante();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examen.id]);

  const toggleClasse = (id) => {
    setClasseIds((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id]
    );
  };

  const toggleSalle = (id) => {
    setSalleIds((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id]
    );
  };

  const capaciteSelectionnee = salles
    .filter((s) => salleIds.includes(s.id))
    .reduce((acc, s) => acc + capaciteEffective(s), 0);

  const lancerRepartition = async () => {
    setErreur("");
    setMessage("");

    if (classeIds.length === 0) {
      setErreur("Sélectionnez au moins une classe.");
      return;
    }

    if (salleIds.length === 0) {
      setErreur("Sélectionnez au moins une salle.");
      return;
    }

    setLancement(true);

    try {
      const res = await api.post(`/examens/${examen.id}/repartition`, {
        classeIds,
        salleIds,
        mode,
      });

      setRepartition(Array.isArray(res.data) ? res.data : []);
      setMessage("Répartition effectuée avec succès.");
    } catch (err) {
      console.error("Erreur répartition :", err);

      setErreur(
        extraireMessageErreur(
          err,
          "Impossible de répartir les élèves avec ces paramètres."
        )
      );
    } finally {
      setLancement(false);
    }
  };

  const supprimerRepartition = async () => {
    setErreur("");
    setMessage("");
    setSuppression(true);

    try {
      await api.delete(`/examens/${examen.id}/repartition`);
      setRepartition([]);
      setMessage("Répartition supprimée.");
    } catch (err) {
      console.error("Erreur suppression répartition :", err);

      setErreur(
        extraireMessageErreur(
          err,
          "Impossible de supprimer la répartition."
        )
      );
    } finally {
      setSuppression(false);
    }
  };

  // Regroupement par salle pour l'affichage des résultats.
  const parSalle = repartition.reduce((acc, r) => {
    const cle = r.salleId;

    if (!acc[cle]) {
      acc[cle] = {
        salleNom: r.salleNom,
        eleves: [],
      };
    }

    acc[cle].eleves.push(r);
    return acc;
  }, {});

  Object.values(parSalle).forEach((groupe) =>
    groupe.eleves.sort((a, b) => a.numeroPlace - b.numeroPlace)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">
          Répartition — {examen.libelle}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {formatDate(examen.dateExamen)}
          {formatHeure(examen.heureDebut) !== "-" &&
            ` • ${formatHeure(examen.heureDebut)}${
              formatHeure(examen.heureFin) !== "-"
                ? ` - ${formatHeure(examen.heureFin)}`
                : ""
            }`}
        </p>

        {erreur && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erreur}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {/* ===== FORMULAIRE DE RÉPARTITION ===== */}

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Classes à répartir *
            </label>

            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {classes.length === 0 && (
                <p className="text-xs text-slate-400">
                  Aucune classe disponible.
                </p>
              )}

              {classes.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={classeIds.includes(c.id)}
                    onChange={() => toggleClasse(c.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {c.nomComplet || c.nomNiveau || `Classe #${c.id}`}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Salles disponibles *
            </label>

            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {salles.length === 0 && (
                <p className="text-xs text-slate-400">
                  Aucune salle disponible.
                </p>
              )}

              {salles.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={salleIds.includes(s.id)}
                    onChange={() => toggleSalle(s.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {s.nom}{" "}
                  <span className="text-xs text-slate-400">
                    {s.capacite
                      ? `(${s.capacite} places)`
                      : `(${CAPACITE_PAR_DEFAUT} places par défaut)`}
                  </span>
                </label>
              ))}
            </div>

            {salleIds.length > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                Capacité totale sélectionnée :{" "}
                <span className="font-semibold text-slate-600">
                  {capaciteSelectionnee}
                </span>{" "}
                places
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Mode de répartition
          </label>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALPHABETIQUE">Alphabétique</option>
            <option value="ALEATOIRE">Aléatoire</option>
          </select>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={lancerRepartition}
            disabled={lancement}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {lancement
              ? "Répartition en cours..."
              : repartition.length > 0
              ? "Relancer la répartition"
              : "Lancer la répartition"}
          </button>

          {repartition.length > 0 && (
            <button
              type="button"
              onClick={supprimerRepartition}
              disabled={suppression}
              className="rounded-xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {suppression ? "Suppression..." : "Supprimer la répartition"}
            </button>
          )}
        </div>

        {/* ===== RÉSULTATS ===== */}

        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold text-slate-800">
            Plan de salle
          </h3>

          {loadingRepartition ? (
            <p className="mt-3 text-sm text-slate-400">Chargement...</p>
          ) : repartition.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">
              Aucune répartition enregistrée pour cet examen.
            </p>
          ) : (
            <div className="mt-3 space-y-5">
              {Object.entries(parSalle).map(([salleId, groupe]) => (
                <div
                  key={salleId}
                  className="overflow-hidden rounded-xl border border-slate-100"
                >
                  <div className="bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                    {groupe.salleNom}{" "}
                    <span className="font-normal text-slate-400">
                      ({groupe.eleves.length} élève
                      {groupe.eleves.length > 1 ? "s" : ""})
                    </span>
                  </div>

                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-400">
                      <tr>
                        <th className="px-4 py-2">Place</th>
                        <th className="px-4 py-2">Élève</th>
                        <th className="px-4 py-2">Classe</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {groupe.eleves.map((e) => (
                        <tr key={e.id}>
                          <td className="px-4 py-2 text-slate-500">
                            {e.numeroPlace}
                          </td>
                          <td className="px-4 py-2 font-medium text-slate-800">
                            {e.nom} {e.prenom}
                          </td>
                          <td className="px-4 py-2 text-slate-500">
                            {e.classeNom}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE PRINCIPALE
========================================================= */

export default function ExamensPage() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  const [anneesScolaires, setAnneesScolaires] = useState([]);
  const [anneeScolaireId, setAnneeScolaireId] = useState("");
  const [loadingAnnees, setLoadingAnnees] = useState(true);

  const [examens, setExamens] = useState([]);
  const [loadingExamens, setLoadingExamens] = useState(true);

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [salles, setSalles] = useState([]);
  const [loadingSalles, setLoadingSalles] = useState(true);

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [afficherFormulaireExamen, setAfficherFormulaireExamen] =
    useState(false);
  const [examenEnEdition, setExamenEnEdition] = useState(null);
  const [examenPourRepartition, setExamenPourRepartition] = useState(null);

  const afficherMessage = (texte) => {
    setMessage(texte);
    setTimeout(() => setMessage(""), 4000);
  };

  /* --------------------------------------------------------
     CHARGEMENTS
  -------------------------------------------------------- */

  const chargerAnneesScolaires = async () => {
    if (!ecoleId) {
      setLoadingAnnees(false);
      return;
    }

    setLoadingAnnees(true);

    try {
      const res = await api.get(`/annees/ecole/${ecoleId}`);
      const annees = Array.isArray(res.data) ? res.data : [];

      setAnneesScolaires(annees);

      const anneeActive = annees.find((a) => a.active === true);

      if (anneeActive) {
        setAnneeScolaireId(String(anneeActive.id));
      } else if (annees.length > 0) {
        setAnneeScolaireId(String(annees[0].id));
      }
    } catch (err) {
      console.error("Erreur chargement années scolaires :", err);
      setErreur(
        extraireMessageErreur(
          err,
          "Impossible de charger les périodes scolaires."
        )
      );
    } finally {
      setLoadingAnnees(false);
    }
  };

  const chargerExamens = async () => {
    if (!ecoleId || !anneeScolaireId) {
      setLoadingExamens(false);
      return;
    }

    setLoadingExamens(true);

    try {
      const res = await api.get(
        `/examens/ecole/${ecoleId}?anneeId=${anneeScolaireId}`
      );
      setExamens(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erreur chargement examens :", err);
      setErreur(
        extraireMessageErreur(err, "Impossible de charger les examens.")
      );
    } finally {
      setLoadingExamens(false);
    }
  };

  const chargerClasses = async () => {
    if (!ecoleId) {
      setLoadingClasses(false);
      return;
    }

    setLoadingClasses(true);

    try {
      const res = await api.get(`/classes/ecole/${ecoleId}`);
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erreur chargement classes :", err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const chargerSalles = async () => {
    if (!ecoleId) {
      setLoadingSalles(false);
      return;
    }

    setLoadingSalles(true);

    try {
      // Hypothèse : endpoint non confirmé, suit la convention des autres
      // ressources de l'école (/classes/ecole/{id}, /annees/ecole/{id}...).
      // À corriger ici si le chemin réel diffère.
      const res = await api.get(`/salles/ecole/${ecoleId}`);
      setSalles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erreur chargement salles :", err);
      setErreur(
        extraireMessageErreur(
          err,
          "Impossible de charger les salles (vérifier l'URL de l'endpoint salles)."
        )
      );
    } finally {
      setLoadingSalles(false);
    }
  };

  const rechargerExamens = async () => {
    await chargerExamens();
  };

  useEffect(() => {
    if (!ecoleId) return;

    chargerAnneesScolaires();
    chargerClasses();
    chargerSalles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecoleId]);

  useEffect(() => {
    if (!ecoleId || !anneeScolaireId) return;

    chargerExamens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecoleId, anneeScolaireId]);

  /* --------------------------------------------------------
     ACTIONS
  -------------------------------------------------------- */

  const ouvrirCreation = () => {
    setExamenEnEdition(null);
    setAfficherFormulaireExamen(true);
  };

  const ouvrirEdition = (examen) => {
    setExamenEnEdition(examen);
    setAfficherFormulaireExamen(true);
  };

  const handleExamenSaved = async () => {
    setAfficherFormulaireExamen(false);
    setExamenEnEdition(null);
    afficherMessage("Examen enregistré avec succès.");
    await rechargerExamens();
  };

  const supprimerExamen = async (examen) => {
    if (
      !window.confirm(
        `Supprimer l'examen "${examen.libelle}" ? Cette action supprimera aussi sa répartition éventuelle.`
      )
    ) {
      return;
    }

    setErreur("");

    try {
      await api.delete(`/examens/${examen.id}`);
      afficherMessage("Examen supprimé.");
      await rechargerExamens();
    } catch (err) {
      console.error("Erreur suppression examen :", err);
      setErreur(
        extraireMessageErreur(err, "Impossible de supprimer l'examen.")
      );
    }
  };

  const anneeSelectionnee = anneesScolaires.find(
    (a) => String(a.id) === String(anneeScolaireId)
  );

  /* --------------------------------------------------------
     RENDER
  -------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* ===== HEADER ===== */}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Examens
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Planification des examens et répartition des élèves en salle.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Période
              </label>

              <select
                value={anneeScolaireId}
                onChange={(e) => setAnneeScolaireId(e.target.value)}
                disabled={loadingAnnees}
                className="h-10 min-w-[190px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">
                  {loadingAnnees
                    ? "Chargement..."
                    : "Sélectionner une période"}
                </option>

                {anneesScolaires.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.nom ||
                      annee.libelle ||
                      `${annee.dateDebut} - ${annee.dateFin}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={ouvrirCreation}
              disabled={!anneeScolaireId}
              className="flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Nouvel examen
            </button>
          </div>
        </div>

        {/* ===== MESSAGES ===== */}

        {erreur && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erreur}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {anneeSelectionnee && (
          <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            Période :{" "}
            <strong>
              {anneeSelectionnee.nom || anneeSelectionnee.libelle || "-"}
            </strong>
          </div>
        )}

        {/* ===== TABLEAU EXAMENS ===== */}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">
              Liste des examens
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Examen</th>
                  <th className="px-5 py-3">Horaire</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loadingExamens && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Chargement...
                    </td>
                  </tr>
                )}

                {!loadingExamens && examens.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Aucun examen enregistré pour cette période.
                    </td>
                  </tr>
                )}

                {!loadingExamens &&
                  examens.map((examen) => (
                    <tr
                      key={examen.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(examen.dateExamen)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {examen.libelle}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatHeure(examen.heureDebut) !== "-"
                          ? `${formatHeure(examen.heureDebut)}${
                              formatHeure(examen.heureFin) !== "-"
                                ? ` - ${formatHeure(examen.heureFin)}`
                                : ""
                            }`
                          : "-"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            examen.actif
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {examen.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setExamenPourRepartition(examen)}
                            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            Répartition
                          </button>

                          <button
                            onClick={() => ouvrirEdition(examen)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Modifier
                          </button>

                          <button
                            onClick={() => supprimerExamen(examen)}
                            className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {(loadingClasses || loadingSalles) && (
          <p className="mt-4 text-xs text-slate-400">
            Chargement des classes et des salles disponibles pour la
            répartition...
          </p>
        )}
      </div>

      {/* ===== MODALS ===== */}

      {afficherFormulaireExamen && (
        <ModalExamen
          examen={examenEnEdition}
          ecoleId={ecoleId}
          anneeScolaireId={anneeScolaireId}
          onClose={() => {
            setAfficherFormulaireExamen(false);
            setExamenEnEdition(null);
          }}
          onSaved={handleExamenSaved}
        />
      )}

      {examenPourRepartition && (
        <ModalRepartition
          examen={examenPourRepartition}
          classes={classes}
          salles={salles}
          onClose={() => setExamenPourRepartition(null)}
        />
      )}
    </div>
  );
}