"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

import {
  getExamens,
  createExamen,
  updateExamen,
  deleteExamen,
} from "../../../../lib/examens-api";

import api from "../../../../lib/api";

export default function ExamensPage() {
  const { user } = useAuth();

  // ============================================================
  // CONTEXTE
  // ============================================================

  const ecoleId = user?.ecole?.id;

  const [anneeScolaire, setAnneeScolaire] = useState(null);
  const [anneeScolaireId, setAnneeScolaireId] = useState(null);

  // ============================================================
  // ÉTAT
  // ============================================================

  const [examens, setExamens] = useState([]);

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    nom: "",
    dateDebut: "",
    dateFin: "",
    classeIds: [],
  });

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    if (!ecoleId) {
      setLoading(false);
      return;
    }

    chargerContexte();
  }, [ecoleId]);

  // ============================================================
  // RÉCUPÉRER L'ANNÉE SCOLAIRE ACTIVE
  // ============================================================

  async function chargerContexte() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/annees/active/${ecoleId}`
      );

      const annee = response.data;

      if (!annee?.id) {
        setAnneeScolaire(null);
        setAnneeScolaireId(null);
        setExamens([]);

        setError(
          "Aucune année scolaire active n'a été trouvée pour cette école."
        );

        return;
      }

      setAnneeScolaire(annee);
      setAnneeScolaireId(annee.id);

      await chargerClasses(ecoleId);
      await chargerExamens(ecoleId, annee.id);

    } catch (err) {
      console.error(
        "Erreur récupération année scolaire active :",
        err
      );

      setError(
        err.response?.data?.message ||
        "Impossible de récupérer l'année scolaire active."
      );

      setExamens([]);

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CHARGER LES CLASSES DE L'ÉCOLE
  // ============================================================

  async function chargerClasses(ecole) {
    try {
      setLoadingClasses(true);

      const response = await api.get(`/classes/ecole/${ecole}`);

      setClasses(
        Array.isArray(response.data) ? response.data : []
      );

    } catch (err) {
      console.error("Erreur chargement classes :", err);
      setClasses([]);

    } finally {
      setLoadingClasses(false);
    }
  }

  // ============================================================
  // CHARGER LES EXAMENS
  // ============================================================

  async function chargerExamens(ecole, annee) {
    try {
      setLoading(true);
      setError("");

      const data = await getExamens(ecole, annee);

      setExamens(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {
      console.error(
        "Erreur chargement examens :",
        err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        "Impossible de charger les examens."
      );

      setExamens([]);

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // OUVRIR CRÉATION
  // ============================================================

  function ouvrirCreation() {
    setEditing(null);

    setForm({
      nom: "",
      dateDebut: "",
      dateFin: "",
      classeIds: [],
    });

    setShowModal(true);
  }

  // ============================================================
  // OUVRIR MODIFICATION
  // ============================================================

  function ouvrirEdition(examen) {
    setEditing(examen);

    setForm({
      nom: examen.nom || "",
      dateDebut: examen.dateDebut
        ? formatDateInput(examen.dateDebut)
        : "",
      dateFin: examen.dateFin
        ? formatDateInput(examen.dateFin)
        : "",
      classeIds: Array.isArray(examen.classes)
        ? examen.classes.map((c) => c.id)
        : [],
    });

    setShowModal(true);
  }

  // ============================================================
  // FERMER MODAL
  // ============================================================

  function fermerModal() {
    if (saving) return;

    setShowModal(false);
    setEditing(null);

    setForm({
      nom: "",
      dateDebut: "",
      dateFin: "",
      classeIds: [],
    });
  }

  // ============================================================
  // COCHER / DÉCOCHER UNE CLASSE
  // ============================================================

  function toggleClasse(classeId) {
    setForm((prev) => {
      const dejaSelectionnee = prev.classeIds.includes(classeId);

      return {
        ...prev,
        classeIds: dejaSelectionnee
          ? prev.classeIds.filter((id) => id !== classeId)
          : [...prev.classeIds, classeId],
      };
    });
  }

  // ============================================================
  // ENREGISTRER
  // ============================================================

  async function enregistrer() {
    const nom = form.nom.trim();

    if (!nom) {
      alert("Le nom de l'examen est obligatoire.");
      return;
    }

    if (!ecoleId) {
      alert("École introuvable.");
      return;
    }

    if (!anneeScolaireId) {
      alert("Aucune année scolaire active.");
      return;
    }

    if (!form.dateDebut) {
      alert("La date de début est obligatoire.");
      return;
    }

    if (!form.dateFin) {
      alert("La date de fin est obligatoire.");
      return;
    }

    if (form.dateFin < form.dateDebut) {
      alert(
        "La date de fin ne peut pas être antérieure à la date de début."
      );
      return;
    }

    if (form.classeIds.length === 0) {
      alert("Veuillez sélectionner au moins une classe.");
      return;
    }

    try {
      setSaving(true);

      setError("");

      const payload = {
        nom,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        ecoleId,
        anneeScolaireId,
        classeIds: form.classeIds,
      };

      if (editing) {
        await updateExamen(
          editing.id,
          payload
        );
      } else {
        await createExamen(payload);
      }

      fermerModal();

      await chargerExamens(
        ecoleId,
        anneeScolaireId
      );

    } catch (err) {
      console.error(
        "Erreur enregistrement examen :",
        err
      );

      alert(
        err.response?.data?.message ||
        err.message ||
        "Une erreur est survenue lors de l'enregistrement."
      );

    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // SUPPRIMER
  // ============================================================

  async function supprimer(examen) {
    const ok = window.confirm(
      `Voulez-vous vraiment supprimer "${examen.nom}" ?`
    );

    if (!ok) {
      return;
    }

    try {
      setDeletingId(examen.id);

      await deleteExamen(examen.id);

      await chargerExamens(
        ecoleId,
        anneeScolaireId
      );

    } catch (err) {
      console.error(
        "Erreur suppression examen :",
        err
      );

      alert(
        err.response?.data?.message ||
        err.message ||
        "Impossible de supprimer l'examen."
      );

    } finally {
      setDeletingId(null);
    }
  }

  // ============================================================
  // RECHERCHE
  // ============================================================

  const examensFiltres = examens.filter((examen) =>
    (examen.nom || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">

        <div className="mx-auto max-w-7xl space-y-6">

          <div className="animate-pulse space-y-4">

            <div className="h-8 w-64 rounded bg-slate-200" />

            <div className="h-20 rounded-2xl bg-slate-200" />

            <div className="h-16 rounded-2xl bg-slate-200" />

            <div className="h-72 rounded-2xl bg-slate-200" />

          </div>

        </div>

      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">

      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-2xl font-bold text-slate-900">
                Examens
              </h1>

              {anneeScolaire && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {anneeScolaire.nom}
                </span>
              )}

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Gérez les examens, épreuves, créneaux et répartitions.
            </p>

          </div>

          <button
            type="button"
            onClick={ouvrirCreation}
            disabled={!anneeScolaireId}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Nouvel examen
          </button>

        </div>

        {/* =====================================================
            ERREUR
        ====================================================== */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <div>
              {error}
            </div>

            {ecoleId && (
              <button
                type="button"
                onClick={chargerContexte}
                className="shrink-0 font-semibold underline hover:no-underline"
              >
                Réessayer
              </button>
            )}

          </div>
        )}

        {/* =====================================================
            INFORMATIONS CONTEXTE
        ====================================================== */}

        {anneeScolaire && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Année scolaire active
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {anneeScolaire.nom}
                </p>

              </div>

              <div className="text-sm text-slate-500">

                {anneeScolaire.debut && (
                  <span>
                    Du {formatDate(anneeScolaire.debut)}
                  </span>
                )}

                {anneeScolaire.fin && (
                  <span>
                    {" "}au {formatDate(anneeScolaire.fin)}
                  </span>
                )}

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            RECHERCHE
        ====================================================== */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="relative">

            <input
              type="text"
              placeholder="Rechercher un examen..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}

          </div>

        </div>

        {/* =====================================================
            LISTE
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {examensFiltres.length === 0 ? (

            <div className="p-10 text-center">

              <div className="mx-auto mb-3 text-4xl">
                📝
              </div>

              <h3 className="font-semibold text-slate-800">
                {search
                  ? "Aucun examen trouvé"
                  : "Aucun examen"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Aucun examen ne correspond à votre recherche."
                  : "Créez votre premier examen."}
              </p>

              {!search && anneeScolaireId && (
                <button
                  type="button"
                  onClick={ouvrirCreation}
                  className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  + Créer un examen
                </button>
              )}

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px]">

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Examen
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Début
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fin
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Statut
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {examensFiltres.map((examen) => (

                    <tr
                      key={examen.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <div className="font-semibold text-slate-900">
                          {examen.nom}
                        </div>

                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(examen.dateDebut)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(examen.dateFin)}
                      </td>

                      <td className="px-5 py-4">

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          PLANIFIÉ
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <a
                            href={`/dashboard/admin/examens/${examen.id}`}
                            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                          >
                            Ouvrir
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              ouvrirEdition(examen)
                            }
                            disabled={deletingId === examen.id}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                          >
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              supprimer(examen)
                            }
                            disabled={
                              deletingId === examen.id
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === examen.id
                              ? "Suppression..."
                              : "Supprimer"}
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {/* =======================================================
          MODAL
      ======================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">

            {/* HEADER MODAL */}

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {editing
                    ? "Modifier l'examen"
                    : "Nouvel examen"}
                </h2>

                {anneeScolaire && (
                  <p className="mt-1 text-sm text-slate-500">
                    Année scolaire :{" "}
                    <span className="font-medium">
                      {anneeScolaire.nom}
                    </span>
                  </p>
                )}

              </div>

              <button
                type="button"
                onClick={fermerModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ✕
              </button>

            </div>

            {/* FORMULAIRE */}

            <div className="space-y-5 p-5">

              {/* NOM */}

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nom de l'examen
                </label>

                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nom: e.target.value,
                    })
                  }
                  placeholder="Ex : Composition du 1er trimestre"
                  disabled={saving}
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />

              </div>

              {/* DATES */}

              <div className="grid gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Date de début
                  </label>

                  <input
                    type="date"
                    value={form.dateDebut}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dateDebut: e.target.value,
                      })
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                  />

                </div>

                <div>

                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Date de fin
                  </label>

                  <input
                    type="date"
                    value={form.dateFin}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dateFin: e.target.value,
                      })
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                  />

                </div>

              </div>

              {/* CLASSES */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Classes concernées
                </label>

                {loadingClasses ? (
                  <p className="text-sm text-slate-500">
                    Chargement des classes...
                  </p>
                ) : classes.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucune classe disponible pour cette école.
                  </p>
                ) : (
                  <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-3">
                    {classes.map((classe) => {
                      const checked = form.classeIds.includes(
                        classe.id
                      );

                      return (
                        <label
                          key={classe.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                            checked
                              ? "bg-emerald-50 text-emerald-800"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleClasse(classe.id)
                            }
                            disabled={saving}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />

                          <span>
                            {classe.nomComplet ||
                              `Classe #${classe.id}`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {form.classeIds.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    {form.classeIds.length} classe
                    {form.classeIds.length > 1 ? "s" : ""} sélectionnée
                    {form.classeIds.length > 1 ? "s" : ""}
                  </p>
                )}

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">

              <button
                type="button"
                onClick={fermerModal}
                disabled={saving}
                className="rounded-xl px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={enregistrer}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : editing
                    ? "Enregistrer"
                    : "Créer l'examen"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// ============================================================
// FORMATER UNE DATE POUR L'AFFICHAGE
// ============================================================

function formatDate(date) {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleDateString("fr-FR");
  } catch {
    return date;
  }
}

// ============================================================
// FORMATER UNE DATE POUR <input type="date">
// ============================================================

function formatDateInput(date) {
  if (!date) return "";

  // Si le backend renvoie déjà YYYY-MM-DD
  if (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return date;
  }

  try {
    return new Date(date)
      .toISOString()
      .split("T")[0];
  } catch {
    return "";
  }
}