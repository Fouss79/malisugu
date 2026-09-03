"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { Plus, X, Pencil, Trash2, Printer, Users, MapPin, CalendarDays, AlertTriangle, Loader2 } from "lucide-react";

/* =========================================================
   PALETTE (identique au reste de l'application)
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

// Constantes
const JOURS_SEMAINE = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
const PLAGE_HORAIRES = Array.from({ length: 10 }, (_, i) => 8 + i);

/* =========================================================
   🛠️ EXTRACTION ROBUSTE DU MESSAGE D'ERREUR
   =========================================================
   Le backend peut renvoyer :
   - une string brute (ex: throw new RuntimeException("..."))
   - un objet Spring par défaut { timestamp, status, error, message, path }
   - un objet de validation { errors: [...] }
   - rien du tout (erreur réseau, timeout, CORS...)
*/
function extraireMessageErreur(error, messageParDefaut) {
  // Pas de réponse du tout → problème réseau / serveur injoignable
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return "Le serveur met trop de temps à répondre. Réessayez.";
    }
    return "Impossible de contacter le serveur. Vérifiez votre connexion.";
  }

  const { status, data } = error.response;

  // Cas string brute
  if (typeof data === "string" && data.trim().length > 0) {
    return data;
  }

  // Cas objet avec message explicite
  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      // Erreurs de validation Spring (@Valid)
      return data.errors
        .map((e) => e.defaultMessage || e.message || String(e))
        .join(" · ");
    }
    if (typeof data.error === "string") {
      return data.error;
    }
  }

  // Codes HTTP génériques
  if (status === 401) return "Session expirée, veuillez vous reconnecter.";
  if (status === 403) return "Vous n'avez pas les droits pour effectuer cette action.";
  if (status === 404) return "Élément introuvable (déjà supprimé ?).";
  if (status === 409) return messageParDefaut || "Conflit détecté sur ce créneau.";
  if (status >= 500) return "Erreur serveur. Réessayez dans un instant.";

  return messageParDefaut || "Une erreur est survenue.";
}

export default function EmploiDuTempsForm() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  // États du formulaire
  const [form, setForm] = useState({
    classeId: "",
    matiereId: "",
    enseignantId: "",
    anneeId: "",
    salleId: "",
    sousGroupeId: "",
    jour: "",
    heureDebut: "",
    heureFin: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [erreur, setErreur] = useState("");
  const [erreurChargement, setErreurChargement] = useState("");
  const [showForm, setShowForm] = useState(false);

  // 🔒 Protections anti double-action
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isLoadingClasse, setIsLoadingClasse] = useState(false);

  // États des données
  const [donnees, setDonnees] = useState({
    classes: [],
    annees: [],
    salles: [],
    sousGroupes: [],
    affectations: [],
    emploi: [],
  });

  // =========================================================
  // CHARGEMENT INITIAL
  // =========================================================

  useEffect(() => {
    if (!ecoleId) return;

    const chargerDonneesInitiales = async () => {
      setErreurChargement("");
      try {
        const [anneesRes, classesRes, sallesRes] = await Promise.all([
          api.get(`/annees/ecole/${ecoleId}`),
          api.get(`/classes/ecole/${ecoleId}`),
          api.get(`/salles/ecole/${ecoleId}`),
        ]);

        const annees = anneesRes.data || [];
        const classes = classesRes.data || [];
        const salles = sallesRes.data || [];

        setDonnees((prev) => ({ ...prev, annees, classes, salles }));

        // Sélection automatique de l'année active
        const anneeActive = annees.find((a) => a.active);
        if (anneeActive) {
          setForm((prev) => ({ ...prev, anneeId: String(anneeActive.id) }));
        }
      } catch (error) {
        console.error("Erreur chargement données initiales:", error);
        setErreurChargement(
          extraireMessageErreur(error, "Impossible de charger les données initiales.")
        );
      }
    };

    chargerDonneesInitiales();
  }, [ecoleId]);

  // =========================================================
  // CHARGEMENT DES DONNÉES DE LA CLASSE
  // =========================================================

  useEffect(() => {
    if (!form.classeId || !form.anneeId) {
      setDonnees((prev) => ({
        ...prev,
        affectations: [],
        sousGroupes: [],
        emploi: [],
      }));
      return;
    }

    const chargerDonneesClasse = async () => {
      setIsLoadingClasse(true);
      setErreurChargement("");
      try {
        const [affectationsRes, sousGroupesRes, emploiRes] = await Promise.all([
          api.get(`/affectations-enseignants/classe/${form.classeId}`, {
            params: { anneeScolaireId: form.anneeId },
          }),
          api.get(`/sous-groupes/classe/${form.classeId}`, {
            params: { anneeScolaireId: form.anneeId },
          }),
          api.get(`/emploi/classe/${form.classeId}/${form.anneeId}`),
        ]);

        setDonnees((prev) => ({
          ...prev,
          affectations: affectationsRes.data || [],
          sousGroupes: sousGroupesRes.data || [],
          emploi: Array.isArray(emploiRes.data) ? emploiRes.data : [],
        }));
      } catch (error) {
        console.error("Erreur chargement données classe:", error);
        setErreurChargement(
          extraireMessageErreur(error, "Impossible de charger l'emploi du temps de cette classe.")
        );
        setDonnees((prev) => ({
          ...prev,
          affectations: [],
          sousGroupes: [],
          emploi: [],
        }));
      } finally {
        setIsLoadingClasse(false);
      }
    };

    chargerDonneesClasse();
  }, [form.classeId, form.anneeId]);

  // =========================================================
  // DONNÉES DÉRIVÉES (mémorisées)
  // =========================================================

  const matieresDisponibles = useMemo(() => {
    const matieresUniques = new Map();
    donnees.affectations.forEach((affectation) => {
      if (!matieresUniques.has(affectation.matiereId)) {
        matieresUniques.set(affectation.matiereId, {
          id: affectation.matiereId,
          nom: affectation.matiereNom,
        });
      }
    });
    return Array.from(matieresUniques.values());
  }, [donnees.affectations]);

  const enseignantsDisponibles = useMemo(() => {
    if (!form.matiereId) return [];

    return donnees.affectations
      .filter((a) => String(a.matiereId) === String(form.matiereId))
      .map((a) => ({
        id: a.enseignantId,
        nom: a.enseignantNom,
        prenom: a.enseignantPrenom,
      }));
  }, [donnees.affectations, form.matiereId]);

  // Cours groupés par jour, triés par heure — pour la vue liste mobile
  const coursParJour = useMemo(() => {
    const map = new Map(JOURS_SEMAINE.map((j) => [j, []]));
    donnees.emploi.forEach((cours) => {
      if (map.has(cours.jour)) {
        map.get(cours.jour).push(cours);
      }
    });
    map.forEach((liste) => liste.sort((a, b) => a.heureDebut - b.heureDebut));
    return map;
  }, [donnees.emploi]);

  // =========================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      // Réinitialisation des champs dépendants
      ...(name === "matiereId" && {
        enseignantId: "",
        sousGroupeId: "",
      }),
      ...(name === "classeId" && {
        matiereId: "",
        enseignantId: "",
        sousGroupeId: "",
      }),
    }));

    setErreur("");
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...prev,
      matiereId: "",
      enseignantId: "",
      salleId: "",
      sousGroupeId: "",
      jour: "",
      heureDebut: "",
      heureFin: "",
    }));
    setEditingId(null);
    setErreur("");
  };

  const toggleForm = () => {
    if (showForm) {
      // On referme : on abandonne aussi une éventuelle modification en cours
      resetForm();
      setShowForm(false);
    } else {
      setShowForm(true);
    }
  };

  // =========================================================
  // CHARGEMENT DE L'EMPLOI DU TEMPS
  // =========================================================

  const rechargerEmploi = async () => {
    if (!form.classeId || !form.anneeId) return;

    try {
      const response = await api.get(`/emploi/classe/${form.classeId}/${form.anneeId}`);
      setDonnees((prev) => ({
        ...prev,
        emploi: Array.isArray(response.data) ? response.data : [],
      }));
    } catch (error) {
      console.error("Erreur rechargement EDT:", error);
      setDonnees((prev) => ({ ...prev, emploi: [] }));
      setErreurChargement(
        extraireMessageErreur(error, "L'emploi du temps affiché peut être obsolète.")
      );
    }
  };

  // =========================================================
  // VALIDATION CÔTÉ CLIENT (avant même d'appeler l'API)
  // =========================================================

  const validerFormulaire = () => {
    if (!form.heureDebut || !form.heureFin) {
      return "Veuillez renseigner l'heure de début et de fin.";
    }
    if (Number(form.heureFin) <= Number(form.heureDebut)) {
      return "L'heure de fin doit être après l'heure de début.";
    }
    return null;
  };

  // =========================================================
  // SOUMISSION DU FORMULAIRE
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    // 🔒 Empêche tout double-clic pendant qu'une requête est déjà en cours
    if (isSubmitting) return;

    const erreurValidation = validerFormulaire();
    if (erreurValidation) {
      setErreur(erreurValidation);
      return;
    }

    const payload = {
      classeId: Number(form.classeId),
      matiereId: Number(form.matiereId),
      enseignantId: Number(form.enseignantId),
      anneeId: Number(form.anneeId),
      salleId: form.salleId ? Number(form.salleId) : null,
      sousGroupeId: form.sousGroupeId ? Number(form.sousGroupeId) : null,
      jour: form.jour,
      heureDebut: Number(form.heureDebut),
      heureFin: Number(form.heureFin),
    };

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/emploi/${editingId}`, payload);
      } else {
        await api.post("/emploi", payload);
      }

      resetForm();
      setShowForm(false);
      await rechargerEmploi();
    }catch (error) {
  console.error("Erreur enregistrement:", error);
  setErreur(       extraireMessageErreur(
          error,
          editingId
            ? "Impossible de mettre à jour ce créneau."
            : "Impossible d'enregistrer ce créneau."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // SUPPRESSION D'UN CRÉNEAU
  // =========================================================

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce créneau ?")) return;

    // 🔒 Empêche un double-clic sur le même créneau
    if (deletingId === id) return;

    setDeletingId(id);
    setErreur("");
    try {
      await api.delete(`/emploi/${id}`);
      await rechargerEmploi();
    } catch (error) {
      console.error("Erreur suppression:", error);
      setErreur(extraireMessageErreur(error, "Impossible de supprimer ce créneau."));
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // MODIFICATION D'UN CRÉNEAU
  // =========================================================

  const handleEdit = (cours) => {
    setForm({
      classeId: cours.classe?.id ? String(cours.classe.id) : "",
      matiereId: cours.matiere?.id ? String(cours.matiere.id) : "",
      enseignantId: cours.enseignant?.id ? String(cours.enseignant.id) : "",
      anneeId: cours.anneeScolaire?.id ? String(cours.anneeScolaire.id) : "",
      salleId: cours.salle?.id ? String(cours.salle.id) : "",
      sousGroupeId: cours.sousGroupe?.id ? String(cours.sousGroupe.id) : "",
      jour: cours.jour || "",
      heureDebut: cours.heureDebut ?? "",
      heureFin: cours.heureFin ?? "",
    });

    setEditingId(cours.id);
    setErreur("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =========================================================
  // RENDU DU TABLEAU (DESKTOP)
  // =========================================================

  const renderCellContent = (jour, heure) => {
    const cours = donnees.emploi.find((c) => c.jour === jour && c.heureDebut <= heure && c.heureFin > heure);

    if (!cours) {
      return (
        <td key={jour} className="border border-slate-100 text-center text-slate-300">
          -
        </td>
      );
    }

    // Ne rendre que le début du cours
    if (cours.heureDebut !== heure) {
      return null;
    }

    const rowSpan = cours.heureFin - cours.heureDebut;
    const enSuppression = deletingId === cours.id;

    return (
      <td
        key={jour}
        rowSpan={rowSpan}
        className="border border-slate-100 p-1 text-center align-middle"
        style={{ background: TEAL_SOFT, opacity: enSuppression ? 0.5 : 1 }}
      >
        <div className="text-[11px] font-bold leading-tight text-slate-800">{cours.matiere?.nom}</div>
        <div className="text-[10px] leading-tight text-slate-600">
          {cours.enseignant?.prenom} {cours.enseignant?.nom}
        </div>

        {cours.sousGroupe && (
          <div
            className="mt-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9px] font-semibold"
            style={{ background: VIOLET_SOFT, color: VIOLET }}
          >
            <Users size={9} />
            {cours.sousGroupe.nom}
          </div>
        )}

        {cours.salle && (
          <div className="flex items-center justify-center gap-0.5 text-[9px] text-slate-500">
            <MapPin size={9} />
            {cours.salle.nom}
          </div>
        )}

        <div className="mt-1 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => handleEdit(cours)}
            className="transition hover:scale-110 disabled:opacity-40"
            style={{ color: GOLD }}
            disabled={enSuppression}
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(cours.id)}
            className="transition hover:scale-110 disabled:opacity-40"
            style={{ color: CORAL }}
            disabled={enSuppression}
          >
            {enSuppression ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </td>
    );
  };

  // =========================================================
  // RENDU PRINCIPAL
  // =========================================================

  return (
    <div className="space-y-6">
      {/* Erreur de chargement (données initiales / rechargement) */}
      {erreurChargement && (
        <div
          className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
          style={{ background: CORAL_SOFT, color: CORAL }}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{erreurChargement}</span>
        </div>
      )}

      {/* Message d'erreur (formulaire / action) */}
      {erreur && (
        <div
          className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
          style={{ background: CORAL_SOFT, color: CORAL }}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{erreur}</span>
        </div>
      )}

      {/* En-tête avec bouton d'ouverture/fermeture */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`, color: INK }}
          >
            <CalendarDays size={17} />
          </span>
          <h2 className="text-base font-semibold text-slate-900">
            {editingId ? "Modifier le créneau" : "Emploi du temps"}
          </h2>
        </div>

        <button
          type="button"
          onClick={toggleForm}
          className="flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white transition hover:brightness-110"
          style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Fermer" : "Ajouter un créneau"}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 md:grid-cols-3"
        >
          {isLoadingClasse && (
            <div className="col-span-1 flex items-center gap-2 text-xs text-slate-500 sm:col-span-2 md:col-span-3">
              <Loader2 size={12} className="animate-spin" />
              Chargement des données de la classe...
            </div>
          )}

          {/* Année */}
          <select
            name="anneeId"
            value={form.anneeId}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
            required
          >
            <option value="">Année scolaire</option>
            {donnees.annees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>

          {/* Classe */}
          <select
            name="classeId"
            value={form.classeId}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
            required
          >
            <option value="">Classe</option>
            {donnees.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomComplet}
              </option>
            ))}
          </select>

          {/* Matière */}
          <select
            name="matiereId"
            value={form.matiereId}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
            required
            disabled={!form.classeId}
          >
            <option value="">Matière</option>
            {matieresDisponibles.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>

          {/* Enseignant */}
          <select
            name="enseignantId"
            value={form.enseignantId}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
            required
            disabled={!form.matiereId}
          >
            <option value="">Enseignant</option>
            {enseignantsDisponibles.map((e) => (
              <option key={e.id} value={e.id}>
                {e.prenom} {e.nom}
              </option>
            ))}
          </select>

          {/* Sous-groupe */}
          <select
            name="sousGroupeId"
            value={form.sousGroupeId}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
          >
            <option value="">Classe entière</option>
            {donnees.sousGroupes.map((sg) => (
              <option key={sg.id} value={sg.id}>
                {sg.nom}
              </option>
            ))}
          </select>

          {/* Salle */}
          <select
            name="salleId"
            value={form.salleId}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
          >
            <option value="">Salle par défaut</option>
            {donnees.salles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>

          {/* Jour */}
          <select
            name="jour"
            value={form.jour}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
            required
          >
            <option value="">Jour</option>
            {JOURS_SEMAINE.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>

          {/* Heures */}
          <div className="flex gap-2">
            <input
              type="number"
              name="heureDebut"
              min="8"
              max="18"
              value={form.heureDebut}
              onChange={handleChange}
              placeholder="Début"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
              required
            />
            <input
              type="number"
              name="heureFin"
              min="9"
              max="18"
              value={form.heureFin}
              onChange={handleChange}
              placeholder="Fin"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
              required
            />
          </div>

          {/* Boutons */}
          <div className="col-span-1 flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center md:col-span-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting
                ? "Enregistrement..."
                : editingId
                ? "Mettre à jour"
                : "Enregistrer"}
            </button>

            <button
              type="button"
              onClick={editingId ? resetForm : toggleForm}
              disabled={isSubmitting}
              className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* ===== VUE MOBILE : LISTE PAR JOUR (compacte) ===== */}
      <div className="space-y-3 rounded-2xl bg-white p-3 shadow-md sm:hidden">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110"
            style={{ background: INK }}
          >
            <Printer size={12} />
            Imprimer
          </button>
        </div>

        {JOURS_SEMAINE.map((jour) => {
          const coursDuJour = coursParJour.get(jour) || [];
          return (
            <div key={jour}>
              <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{jour}</h3>

              {coursDuJour.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-2 py-2 text-center text-[11px] text-slate-400">
                  Aucun cours
                </p>
              ) : (
                <div className="space-y-1.5">
                  {coursDuJour.map((cours) => {
                    const enSuppression = deletingId === cours.id;
                    return (
                      <div
                        key={cours.id}
                        className="rounded-lg px-2.5 py-1.5"
                        style={{ background: TEAL_SOFT, opacity: enSuppression ? 0.5 : 1 }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5">
                              <span className="shrink-0 text-[10px] font-medium text-slate-500">
                                {cours.heureDebut}h-{cours.heureFin}h
                              </span>
                              <span className="truncate text-xs font-bold text-slate-800">{cours.matiere?.nom}</span>
                            </div>
                            <p className="truncate text-[10px] text-slate-600">
                              {cours.enseignant?.prenom} {cours.enseignant?.nom}
                              {cours.sousGroupe && ` · ${cours.sousGroupe.nom}`}
                              {cours.salle && ` · ${cours.salle.nom}`}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(cours)}
                              className="transition hover:scale-110 disabled:opacity-40"
                              style={{ color: GOLD }}
                              disabled={enSuppression}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cours.id)}
                              className="transition hover:scale-110 disabled:opacity-40"
                              style={{ color: CORAL }}
                              disabled={enSuppression}
                            >
                              {enSuppression ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== VUE DESKTOP : GRILLE HORAIRE (compacte) ===== */}
      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-md sm:block">
        <div className="flex justify-end border-b border-slate-100 p-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110"
            style={{ background: INK }}
          >
            <Printer size={12} />
            Imprimer
          </button>
        </div>

        <table className="w-full min-w-[700px] table-fixed border-collapse text-xs">
          <thead>
            <tr style={{ background: "#F8F7F2" }}>
              <th className="w-16 border border-slate-100 p-1 text-slate-500">Heure</th>
              {JOURS_SEMAINE.map((j) => (
                <th key={j} className="border border-slate-100 p-1 text-slate-500">
                  {j}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {PLAGE_HORAIRES.map((heure) => (
              <tr key={heure} className="h-10">
                <td className="border border-slate-100 p-1 text-[11px] font-bold text-slate-600 whitespace-nowrap">
                  {heure}h-{heure + 1}h
                </td>

                {JOURS_SEMAINE.map((jour) => renderCellContent(jour, heure))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}