"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";
import {
  Download,
  Save,
  BarChart3,
  Users,
  UsersRound,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Clock,
  GraduationCap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

// ============================================================
// CONSTANTES
// ============================================================

const API_BASE_URL = "http://localhost:8080/api";
const PERIODES = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];

const STYLES = {
  input: "w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100",
  card: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/40",
  button: {
    primary: "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition",
    secondary: "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
  }
};

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

function Card({ title, description, children, className = "" }) {
  return (
    <div className={`${STYLES.card} ${className}`}>
      {title && (
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      )}
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <span className="text-sm text-slate-500">Chargement...</span>
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function NotesPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ============================================================
  // ÉTATS
  // ============================================================

  // Données
  const [donnees, setDonnees] = useState({
    classes: [],
    eleves: [],
    affectations: [],
    annees: []
  });

  // Notes
  const [notes, setNotes] = useState({
    saisies: {},
    existantes: {}
  });

  // États de contrôle
  const [etats, setEtats] = useState({
    loadingInitial: true,
    loadingEleves: false,
    loadingNotes: false,
    submitting: false,
    erreur: "",
    toast: null
  });

  // Filtres
  const [filtres, setFiltres] = useState({
    classeId: "",
    coefficientMatiereId: "",
    anneeScolaireId: "",
    periode: ""
  });

  // ============================================================
  // FONCTIONS
  // ============================================================

  const afficherToast = (message) => {
    setEtats(prev => ({ ...prev, toast: message }));
    setTimeout(() => setEtats(prev => ({ ...prev, toast: null })), 3000);
  };

  const afficherErreur = (message) => {
    setEtats(prev => ({ ...prev, erreur: message }));
  };

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    if (!user?.ecole?.id) return;

    const chargerDonneesInitiales = async () => {
      try {
        const ecoleId = user.ecole.id;
        const [classesRes, anneesRes] = await Promise.all([
          api.get(`/classes/ecole/${ecoleId}`),
          api.get(`/annees/ecole/${ecoleId}`)
        ]);

        const classes = Array.isArray(classesRes.data) ? classesRes.data : [];
        const annees = Array.isArray(anneesRes.data) ? anneesRes.data : [];

        setDonnees(prev => ({ ...prev, classes, annees }));

        // Sélection automatique de l'année active
        const anneeActive = annees.find(a => a.active);
        if (anneeActive) {
          setFiltres(prev => ({
            ...prev,
            anneeScolaireId: String(anneeActive.id)
          }));
        }
      } catch (error) {
        console.error("Erreur chargement initial:", error);
        afficherErreur("Impossible de charger les données initiales.");
      } finally {
        setEtats(prev => ({ ...prev, loadingInitial: false }));
      }
    };

    chargerDonneesInitiales();
  }, [user]);

  // ============================================================
  // CHARGEMENT DES AFFECTATIONS
  // ============================================================

  useEffect(() => {
    if (!filtres.classeId || !filtres.anneeScolaireId) {
      setDonnees(prev => ({ ...prev, affectations: [] }));
      return;
    }

    const chargerAffectations = async () => {
      try {
        const response = await api.get(
          `/affectations-enseignants/classe/${filtres.classeId}`,
          { params: { anneeScolaireId: Number(filtres.anneeScolaireId) } }
        );

        const affectations = Array.isArray(response.data) ? response.data : [];
        setDonnees(prev => ({ ...prev, affectations }));

        // Réinitialisation
        setFiltres(prev => ({ ...prev, coefficientMatiereId: "" }));
        setNotes({ saisies: {}, existantes: {} });
      } catch (error) {
        console.error("Erreur chargement affectations:", error);
        setDonnees(prev => ({ ...prev, affectations: [] }));
      }
    };

    chargerAffectations();
  }, [filtres.classeId, filtres.anneeScolaireId]);

  // ============================================================
  // CALCUL DES MATIÈRES DISPONIBLES
  // ============================================================

  const matieresDisponibles = useMemo(() => {
    const matieresMap = new Map();

    donnees.affectations.forEach(affectation => {
      const coefficientId = affectation.coefficientMatiereId;
      if (!coefficientId) return;

      if (!matieresMap.has(coefficientId)) {
        matieresMap.set(coefficientId, {
          id: coefficientId,
          matiereId: affectation.matiereId ?? null,
          nom: affectation.matiereNom ?? "Matière",
          coeff: affectation.coefficient ?? 0,
          heures: affectation.nombreHeuresParSemaine ?? null,
          sousGroupeId: affectation.sousGroupeId ?? null,
          sousGroupeNom: affectation.sousGroupeNom ?? null
        });
      }
    });

    return Array.from(matieresMap.values())
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [donnees.affectations]);

  // ============================================================
  // MATIÈRE SÉLECTIONNÉE
  // ============================================================

  const matiereChoisie = useMemo(() => {
    return matieresDisponibles.find(
      m => String(m.id) === String(filtres.coefficientMatiereId)
    );
  }, [matieresDisponibles, filtres.coefficientMatiereId]);

  const sousGroupeIdEffectif = matiereChoisie?.sousGroupeId ?? null;
  const sousGroupeNomEffectif = matiereChoisie?.sousGroupeNom ?? null;

  // ============================================================
  // CHARGEMENT DES ÉLÈVES
  // ============================================================

  useEffect(() => {
    if (!filtres.classeId || !filtres.anneeScolaireId) {
      setDonnees(prev => ({ ...prev, eleves: [] }));
      return;
    }

    const chargerEleves = async () => {
      setEtats(prev => ({ ...prev, loadingEleves: true }));

      try {
        let url;
        if (sousGroupeIdEffectif) {
          url = `/sous-groupes/${sousGroupeIdEffectif}/eleves-annee-active`;
        } else {
          url = `/inscriptions/actif/classe/${filtres.classeId}/annee/${filtres.anneeScolaireId}`;
        }

        const response = await api.get(url);
        const eleves = Array.isArray(response.data) ? response.data : [];

        const elevesTries = [...eleves].sort((a, b) => {
          const nomA = `${a.nom ?? ""} ${a.prenom ?? ""}`.trim();
          const nomB = `${b.nom ?? ""} ${b.prenom ?? ""}`.trim();
          return nomA.localeCompare(nomB);
        });

        setDonnees(prev => ({ ...prev, eleves: elevesTries }));
      } catch (error) {
        console.error("Erreur chargement élèves:", error);
        setDonnees(prev => ({ ...prev, eleves: [] }));
      } finally {
        setEtats(prev => ({ ...prev, loadingEleves: false }));
      }
    };

    chargerEleves();
  }, [filtres.classeId, filtres.anneeScolaireId, sousGroupeIdEffectif]);

  // ============================================================
  // CHARGEMENT DES NOTES EXISTANTES
  // ============================================================

  const chargerNotesExistantes = useCallback(async () => {
    const { classeId, coefficientMatiereId, periode, anneeScolaireId } = filtres;

    if (!classeId || !coefficientMatiereId || !periode || !anneeScolaireId) {
      setNotes({ saisies: {}, existantes: {} });
      return;
    }

    setEtats(prev => ({ ...prev, loadingNotes: true }));

    try {
      const params = {
        classeId: Number(classeId),
        coefficientMatiereId: Number(coefficientMatiereId),
        periode,
        anneeScolaireId: Number(anneeScolaireId)
      };

      if (sousGroupeIdEffectif) {
        params.sousGroupeId = Number(sousGroupeIdEffectif);
      }

      const response = await api.get("/notes/classe", { params });
      const notesListe = Array.isArray(response.data) ? response.data : [];

      const notesMap = {};
      notesListe.forEach(note => {
        if (!note.inscriptionId) return;
        notesMap[String(note.inscriptionId)] = {
          id: note.id,
          nClass: note.nClass ?? note.nclass ?? "",
          nExem: note.nExem ?? note.nexem ?? ""
        };
      });

      setNotes({ saisies: notesMap, existantes: notesMap });
    } catch (error) {
      console.error("Erreur chargement notes:", error);
      setNotes({ saisies: {}, existantes: {} });
    } finally {
      setEtats(prev => ({ ...prev, loadingNotes: false }));
    }
  }, [filtres, sousGroupeIdEffectif]);

  useEffect(() => {
    chargerNotesExistantes();
  }, [chargerNotesExistantes]);

  // ============================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ============================================================

  const handleFiltreChange = (e) => {
    const { name, value } = e.target;

    setFiltres(prev => ({
      ...prev,
      [name]: value,
      ...(name === "classeId" && { coefficientMatiereId: "" })
    }));

    setEtats(prev => ({ ...prev, erreur: "" }));

    if (name === "coefficientMatiereId") {
      setNotes({ saisies: {}, existantes: {} });
    }
  };

  const handleNoteChange = (inscriptionId, champ, valeur) => {
    // Validation
    if (valeur !== "" && (Number(valeur) < 0 || Number(valeur) > 20)) {
      return;
    }

    setNotes(prev => ({
      ...prev,
      saisies: {
        ...prev.saisies,
        [String(inscriptionId)]: {
          ...(prev.saisies[String(inscriptionId)] || {}),
          [champ]: valeur
        }
      }
    }));
  };

  // ============================================================
  // CALCULS
  // ============================================================

  const calculerMoyenne = (note) => {
    if (!note || note.nClass === "" || note.nClass == null ||
        note.nExem === "" || note.nExem == null) {
      return null;
    }

    const nClass = Number(note.nClass);
    const nExem = Number(note.nExem);

    if (isNaN(nClass) || isNaN(nExem)) return null;

    return (nClass + nExem * 2) / 3;
  };

  const getMoyenneColor = (moyenne) => {
    if (moyenne === null) return "text-slate-300";
    if (moyenne < 10) return "text-rose-600";
    if (moyenne < 12) return "text-amber-600";
    return "text-emerald-600";
  };

  const nbNotesModifiees = useMemo(() => {
    return Object.keys(notes.saisies).filter(id => {
      const actuel = notes.saisies[id];
      const original = notes.existantes[id];

      if (!actuel) return false;
      if (actuel.nClass === "" && actuel.nExem === "") return false;
      if (!original) return true;

      return String(actuel.nClass ?? "") !== String(original.nClass ?? "") ||
             String(actuel.nExem ?? "") !== String(original.nExem ?? "");
    }).length;
  }, [notes.saisies, notes.existantes]);

  const getTexteNotesModifiees = () => {
    if (nbNotesModifiees === 0) return "Aucune modification en attente";
    if (nbNotesModifiees === 1) return "1 note modifiée non enregistrée";
    return `${nbNotesModifiees} notes modifiées non enregistrées`;
  };

  // ============================================================
  // ENREGISTREMENT
  // ============================================================

  const enregistrerTout = async () => {
    setEtats(prev => ({ ...prev, erreur: "" }));

    // Validations
    if (!filtres.classeId || !filtres.coefficientMatiereId ||
        !filtres.anneeScolaireId || !filtres.periode) {
      afficherErreur(
        "Choisissez la classe, la matière, l'année et la période avant d'enregistrer."
      );
      return;
    }

    if (donnees.eleves.length === 0) {
      afficherErreur("Aucun élève à enregistrer.");
      return;
    }

    // Construction du payload
    const notesAEnvoyer = donnees.eleves
      .map(eleve => {
        const note = notes.saisies[String(eleve.id)] || {};
        if (!note.nClass || !note.nExem || note.nClass === "" || note.nExem === "") {
          return null;
        }
        return {
          inscriptionId: eleve.id,
          nClass: Number(note.nClass),
          nExem: Number(note.nExem)
        };
      })
      .filter(Boolean);

    if (notesAEnvoyer.length === 0) {
      afficherErreur("Saisissez au moins une note complète avant d'enregistrer.");
      return;
    }

    const payload = {
      classeId: Number(filtres.classeId),
      coefficientMatiereId: Number(filtres.coefficientMatiereId),
      sousGroupeId: sousGroupeIdEffectif ? Number(sousGroupeIdEffectif) : null,
      periode: filtres.periode,
      notes: notesAEnvoyer
    };

    setEtats(prev => ({ ...prev, submitting: true }));

    try {
      await api.post("/notes/en-masse", payload);
      afficherToast(`✓ ${notesAEnvoyer.length} note(s) enregistrée(s)`);
      await chargerNotesExistantes();
    } catch (error) {
      console.error("Erreur enregistrement:", error);
      afficherErreur(
        error.response?.data?.message ||
        error.response?.data ||
        "Erreur lors de l'enregistrement."
      );
    } finally {
      setEtats(prev => ({ ...prev, submitting: false }));
    }
  };

  // ============================================================
  // TÉLÉCHARGEMENT DES BULLETINS
  // ============================================================

  const downloadBulletinClasse = async () => {
    setEtats(prev => ({ ...prev, erreur: "" }));

    if (!filtres.classeId || !filtres.anneeScolaireId || !filtres.periode) {
      afficherErreur(
        "Choisissez la classe, l'année et la période avant de générer les bulletins."
      );
      return;
    }

    try {
      const response = await api.get("/bulletins/generate-classe", {
        params: {
          classeId: filtres.classeId,
          anneeId: filtres.anneeScolaireId,
          periode: filtres.periode,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "bulletins-classe.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur bulletin:", error);
      afficherErreur("Erreur lors de la génération des bulletins.");
    }
  };

  // ============================================================
  // RENDU
  // ============================================================

  if (etats.loadingInitial) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-5">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Saisie des notes</h1>
        <p className="mt-1 text-sm text-slate-500">
          La matière, son coefficient et son volume horaire viennent du programme de la classe.
          Le sous-groupe est automatiquement appliqué pour les matières comme LV2 ou TP.
        </p>
      </div>

      {/* =====================================================
          ERREUR
      ===================================================== */}

      {etats.erreur && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
          <AlertCircle size={16} />
          {etats.erreur}
        </div>
      )}

      {/* =====================================================
          FILTRES
      ===================================================== */}

      <Card 
        title="Sélection" 
        description="Choisissez la classe, l'année, le programme et la période."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            name="classeId"
            value={filtres.classeId}
            onChange={handleFiltreChange}
            className={STYLES.input}
          >
            <option value="">Classe</option>
            {donnees.classes.map(classe => (
              <option key={classe.id} value={classe.id}>
                {classe.nomComplet}
              </option>
            ))}
          </select>

          <select
            name="anneeScolaireId"
            value={filtres.anneeScolaireId}
            onChange={handleFiltreChange}
            className={STYLES.input}
          >
            <option value="">Année scolaire</option>
            {donnees.annees.map(annee => (
              <option key={annee.id} value={annee.id}>
                {annee.nom} {annee.active ? "— Active" : ""}
              </option>
            ))}
          </select>

          <select
            name="coefficientMatiereId"
            value={filtres.coefficientMatiereId}
            onChange={handleFiltreChange}
            disabled={!filtres.classeId || matieresDisponibles.length === 0}
            className={STYLES.input}
          >
            <option value="">Matière</option>
            {matieresDisponibles.map(matiere => (
              <option key={matiere.id} value={matiere.id}>
                {matiere.nom} — Coef. {matiere.coeff}
                {matiere.sousGroupeNom ? ` — ${matiere.sousGroupeNom}` : ""}
              </option>
            ))}
          </select>

          <select
            name="periode"
            value={filtres.periode}
            onChange={handleFiltreChange}
            className={STYLES.input}
          >
            <option value="">Période</option>
            {PERIODES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Informations du programme */}
        {matiereChoisie && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <div>
                <span className="text-slate-400">Matière :</span>
                <span className="ml-1 font-semibold text-slate-800">
                  {matiereChoisie.nom}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Coefficient :</span>
                <span className="ml-1 font-semibold text-indigo-600">
                  {matiereChoisie.coeff}
                </span>
              </div>
              {matiereChoisie.heures != null && (
                <div>
                  <span className="text-slate-400">Volume horaire :</span>
                  <span className="ml-1 font-semibold text-slate-800">
                    {matiereChoisie.heures}h/semaine
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-400">Groupe :</span>
                <span className={`ml-1 font-semibold ${
                  sousGroupeNomEffectif ? "text-indigo-600" : "text-emerald-600"
                }`}>
                  {sousGroupeNomEffectif || "Toute la classe"}
                </span>
              </div>
            </div>

            {sousGroupeIdEffectif && (
              <div className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                <strong>Sous-groupe automatique :</strong> les notes sont enregistrées
                uniquement pour les élèves du sous-groupe <strong>{sousGroupeNomEffectif}</strong>.
              </div>
            )}
          </div>
        )}

        {filtres.classeId && !donnees.affectations.length && (
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Aucun programme ou aucune affectation trouvée pour cette classe et cette année scolaire.
          </div>
        )}
      </Card>

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/admin/notes/resultats")}
          className={`${STYLES.button.primary} bg-indigo-600 hover:bg-indigo-700`}
        >
          <BarChart3 size={16} />
          Résultats
        </button>

        <button
          type="button"
          onClick={downloadBulletinClasse}
          className={`${STYLES.button.primary} bg-slate-800 hover:bg-slate-900`}
        >
          <Download size={16} />
          Bulletins
        </button>
      </div>

      {/* =====================================================
          TABLEAU DES NOTES
      ===================================================== */}

      {filtres.classeId && filtres.coefficientMatiereId && filtres.periode && (
        <Card
          title="Notes des élèves"
          description={
            sousGroupeIdEffectif
              ? `Élèves du sous-groupe « ${sousGroupeNomEffectif} » uniquement.`
              : "Une ligne par élève, triée par ordre alphabétique."
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Élève</th>
                  <th className="px-3 py-3 text-center font-medium">Note classe /20</th>
                  <th className="px-3 py-3 text-center font-medium">Note examen /20</th>
                  <th className="px-3 py-3 text-center font-medium">Moyenne</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {(etats.loadingEleves || etats.loadingNotes) && (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-slate-400">
                      Chargement des notes...
                    </td>
                  </tr>
                )}

                {!etats.loadingEleves && !etats.loadingNotes && donnees.eleves.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-slate-400">
                      {sousGroupeIdEffectif
                        ? `Aucun élève dans le sous-groupe « ${sousGroupeNomEffectif} ».`
                        : "Aucun élève dans cette classe."}
                    </td>
                  </tr>
                )}

                {!etats.loadingEleves && !etats.loadingNotes && donnees.eleves.map((eleve, index) => {
                  const note = notes.saisies[String(eleve.id)] || {};
                  const moyenne = calculerMoyenne(note);

                  return (
                    <tr key={eleve.id} className="transition hover:bg-slate-50/70">
                      <td className="px-3 py-3 text-xs text-slate-400">{index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-800">
                          {eleve.nom} {eleve.prenom}
                        </div>
                        {eleve.matricule && (
                          <div className="mt-0.5 text-xs text-slate-400">{eleve.matricule}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          value={note.nClass ?? ""}
                          onChange={(e) => handleNoteChange(eleve.id, "nClass", e.target.value)}
                          className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          value={note.nExem ?? ""}
                          onChange={(e) => handleNoteChange(eleve.id, "nExem", e.target.value)}
                          className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </td>
                      <td className={`px-3 py-3 text-center font-semibold ${getMoyenneColor(moyenne)}`}>
                        {moyenne !== null ? moyenne.toFixed(2) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {getTexteNotesModifiees()}
              </span>
              {nbNotesModifiees > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                  {nbNotesModifiees}
                </span>
              )}
            </div>

            <button
              onClick={enregistrerTout}
              disabled={etats.submitting || nbNotesModifiees === 0 || etats.loadingNotes}
              className={`${STYLES.button.primary} bg-indigo-600 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Save size={16} />
              {etats.submitting ? "Enregistrement..." : "Enregistrer toutes les notes"}
            </button>
          </div>
        </Card>
      )}

      {/* =====================================================
          TOAST
      ===================================================== */}

      {etats.toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle size={16} />
          {etats.toast}
        </div>
      )}
    </div>
  );
}