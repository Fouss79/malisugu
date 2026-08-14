"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { Plus, X } from "lucide-react";

// Constantes
const JOURS_SEMAINE = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
const PLAGE_HORAIRES = Array.from({ length: 10 }, (_, i) => 8 + i);

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
    heureFin: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [erreur, setErreur] = useState("");
  const [showForm, setShowForm] = useState(false);

  // États des données
  const [donnees, setDonnees] = useState({
    classes: [],
    annees: [],
    salles: [],
    sousGroupes: [],
    affectations: [],
    emploi: []
  });

  // =========================================================
  // CHARGEMENT INITIAL
  // =========================================================

  useEffect(() => {
    if (!ecoleId) return;

    const chargerDonneesInitiales = async () => {
      try {
        const [anneesRes, classesRes, sallesRes] = await Promise.all([
          api.get(`/annees/ecole/${ecoleId}`),
          api.get(`/classes/ecole/${ecoleId}`),
          api.get(`/salles/ecole/${ecoleId}`)
        ]);

        const annees = anneesRes.data || [];
        const classes = classesRes.data || [];
        const salles = sallesRes.data || [];

        setDonnees(prev => ({ ...prev, annees, classes, salles }));

        // Sélection automatique de l'année active
        const anneeActive = annees.find(a => a.active);
        if (anneeActive) {
          setForm(prev => ({ ...prev, anneeId: String(anneeActive.id) }));
        }
      } catch (error) {
        console.error("Erreur chargement données initiales:", error);
      }
    };

    chargerDonneesInitiales();
  }, [ecoleId]);

  // =========================================================
  // CHARGEMENT DES DONNÉES DE LA CLASSE
  // =========================================================

  useEffect(() => {
    if (!form.classeId || !form.anneeId) {
      setDonnees(prev => ({ 
        ...prev, 
        affectations: [], 
        sousGroupes: [], 
        emploi: [] 
      }));
      return;
    }

    const chargerDonneesClasse = async () => {
      try {
        const [affectationsRes, sousGroupesRes, emploiRes] = await Promise.all([
          api.get(`/affectations-enseignants/classe/${form.classeId}`, {
            params: { anneeScolaireId: form.anneeId }
          }),
          api.get(`/sous-groupes/classe/${form.classeId}`, {
            params: { anneeScolaireId: form.anneeId }
          }),
          api.get(`/emploi/classe/${form.classeId}/${form.anneeId}`)
        ]);

        setDonnees(prev => ({
          ...prev,
          affectations: affectationsRes.data || [],
          sousGroupes: sousGroupesRes.data || [],
          emploi: Array.isArray(emploiRes.data) ? emploiRes.data : []
        }));
      } catch (error) {
        console.error("Erreur chargement données classe:", error);
        setDonnees(prev => ({
          ...prev,
          affectations: [],
          sousGroupes: [],
          emploi: []
        }));
      }
    };

    chargerDonneesClasse();
  }, [form.classeId, form.anneeId]);

  // =========================================================
  // DONNÉES DÉRIVÉES (mémorisées)
  // =========================================================

  const matieresDisponibles = useMemo(() => {
    const matieresUniques = new Map();
    donnees.affectations.forEach(affectation => {
      if (!matieresUniques.has(affectation.matiereId)) {
        matieresUniques.set(affectation.matiereId, {
          id: affectation.matiereId,
          nom: affectation.matiereNom
        });
      }
    });
    return Array.from(matieresUniques.values());
  }, [donnees.affectations]);

  const enseignantsDisponibles = useMemo(() => {
    if (!form.matiereId) return [];
    
    return donnees.affectations
      .filter(a => String(a.matiereId) === String(form.matiereId))
      .map(a => ({
        id: a.enseignantId,
        nom: a.enseignantNom,
        prenom: a.enseignantPrenom
      }));
  }, [donnees.affectations, form.matiereId]);

  // =========================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setForm(prev => ({
      ...prev,
      [name]: value,
      // Réinitialisation des champs dépendants
      ...(name === "matiereId" && {
        enseignantId: "",
        sousGroupeId: ""
      }),
      ...(name === "classeId" && {
        matiereId: "",
        enseignantId: "",
        sousGroupeId: ""
      })
    }));

    setErreur("");
  };

  const resetForm = () => {
    setForm(prev => ({
      ...prev,
      matiereId: "",
      enseignantId: "",
      salleId: "",
      sousGroupeId: "",
      jour: "",
      heureDebut: "",
      heureFin: ""
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
      const response = await api.get(
        `/emploi/classe/${form.classeId}/${form.anneeId}`
      );
      setDonnees(prev => ({
        ...prev,
        emploi: Array.isArray(response.data) ? response.data : []
      }));
    } catch (error) {
      console.error("Erreur rechargement EDT:", error);
      setDonnees(prev => ({ ...prev, emploi: [] }));
    }
  };

  // =========================================================
  // SOUMISSION DU FORMULAIRE
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    try {
      const payload = {
        classeId: Number(form.classeId),
        matiereId: Number(form.matiereId),
        enseignantId: Number(form.enseignantId),
        anneeId: Number(form.anneeId),
        salleId: form.salleId ? Number(form.salleId) : null,
        sousGroupeId: form.sousGroupeId ? Number(form.sousGroupeId) : null,
        jour: form.jour,
        heureDebut: Number(form.heureDebut),
        heureFin: Number(form.heureFin)
      };

      if (editingId) {
        await api.put(`/emploi/${editingId}`, payload);
      } else {
        await api.post("/emploi", payload);
      }

      resetForm();
      setShowForm(false);
      await rechargerEmploi();
    } catch (error) {
      console.error("Erreur enregistrement:", error);
      setErreur(
        error.response?.data?.message || 
        error.response?.data || 
        "Erreur lors de l'enregistrement"
      );
    }
  };

  // =========================================================
  // SUPPRESSION D'UN CRÉNEAU
  // =========================================================

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce créneau ?")) return;

    try {
      await api.delete(`/emploi/${id}`);
      await rechargerEmploi();
    } catch (error) {
      setErreur(
        error.response?.data || 
        "Impossible de supprimer ce créneau"
      );
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
      heureFin: cours.heureFin ?? ""
    });

    setEditingId(cours.id);
    setErreur("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =========================================================
  // RENDU DU TABLEAU
  // =========================================================

  const renderCellContent = (jour, heure) => {
    const cours = donnees.emploi.find(
      c => c.jour === jour && 
           c.heureDebut <= heure && 
           c.heureFin > heure
    );

    if (!cours) {
      return <td key={jour} className="border text-center">-</td>;
    }

    // Ne rendre que le début du cours
    if (cours.heureDebut !== heure) {
      return null;
    }

    const rowSpan = cours.heureFin - cours.heureDebut;

    return (
      <td
        key={jour}
        rowSpan={rowSpan}
        className="border text-center p-2 bg-blue-100 align-middle"
      >
        <div className="font-bold">{cours.matiere?.nom}</div>
        <div className="text-xs">
          {cours.enseignant?.prenom} {cours.enseignant?.nom}
        </div>

        {cours.sousGroupe && (
          <div className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
            👥 {cours.sousGroupe.nom}
          </div>
        )}

        {cours.salle && (
          <div className="text-xs text-slate-500 mt-1">
            📍 {cours.salle.nom}
          </div>
        )}

        <div className="flex justify-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => handleEdit(cours)}
            className="hover:scale-110 transition-transform"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => handleDelete(cours.id)}
            className="hover:scale-110 transition-transform"
          >
            🗑️
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

      {/* Message d'erreur */}
      {erreur && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {typeof erreur === "object" ? erreur.message : erreur}
        </div>
      )}

      {/* En-tête avec bouton d'ouverture/fermeture */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          {editingId ? "Modifier le créneau" : "Emploi du temps"}
        </h2>

        <button
          type="button"
          onClick={toggleForm}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Fermer" : "Ajouter un créneau"}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-white p-4">

          {/* Année */}
          <select
            name="anneeId"
            value={form.anneeId}
            onChange={handleChange}
            className="input bg-white rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            required
          >
            <option value="">Année scolaire</option>
            {donnees.annees.map(a => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>

          {/* Classe */}
          <select
            name="classeId"
            value={form.classeId}
            onChange={handleChange}
            className="input bg-white rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            required
          >
            <option value="">Classe</option>
            {donnees.classes.map(c => (
              <option key={c.id} value={c.id}>{c.nomComplet}</option>
            ))}
          </select>

          {/* Matière */}
          <select
            name="matiereId"
            value={form.matiereId}
            onChange={handleChange}
            className="input bg-white rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            required
            disabled={!form.classeId}
          >
            <option value="">Matière</option>
            {matieresDisponibles.map(m => (
              <option key={m.id} value={m.id}>{m.nom}</option>
            ))}
          </select>

          {/* Enseignant */}
          <select
            name="enseignantId"
            value={form.enseignantId}
            onChange={handleChange}
            className="input bg-white rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            required
            disabled={!form.matiereId}
          >
            <option value="">Enseignant</option>
            {enseignantsDisponibles.map(e => (
              <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
            ))}
          </select>

          {/* Sous-groupe */}
          <select
            name="sousGroupeId"
            value={form.sousGroupeId}
            onChange={handleChange}
            className="input bg-white rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">Classe entière</option>
            {donnees.sousGroupes.map(sg => (
              <option key={sg.id} value={sg.id}>{sg.nom}</option>
            ))}
          </select>

          {/* Salle */}
          <select
            name="salleId"
            value={form.salleId}
            onChange={handleChange}
            className="input bg-white rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">Salle par défaut</option>
            {donnees.salles.map(s => (
              <option key={s.id} value={s.id}>{s.nom}</option>
            ))}
          </select>

          {/* Jour */}
          <select
            name="jour"
            value={form.jour}
            onChange={handleChange}
            className="input bg-white rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            required
          >
            <option value="">Jour</option>
            {JOURS_SEMAINE.map(j => (
              <option key={j} value={j}>{j}</option>
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
              required
            />
          </div>

          {/* Boutons */}
          <div className="col-span-1 md:col-span-3 flex justify-between items-center">
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium"
              >
                {editingId ? "Mettre à jour" : "Enregistrer"}
              </button>

              <button
                type="button"
                onClick={editingId ? resetForm : toggleForm}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tableau de l'emploi du temps */}
      <div className="bg-white rounded-2xl shadow-md overflow-x-auto">
        <div className="flex justify-end p-3 border-b">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 text-sm rounded-lg transition-colors"
          >
            🖨️ Imprimer
          </button>
        </div>

        <table className="w-full text-sm border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Heure</th>
              {JOURS_SEMAINE.map(j => (
                <th key={j} className="p-2 border">{j}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {PLAGE_HORAIRES.map(heure => (
              <tr key={heure}>
                <td className="border p-2 font-bold whitespace-nowrap">
                  {heure}:00 - {heure + 1}:00
                </td>

                {JOURS_SEMAINE.map(jour => renderCellContent(jour, heure))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}