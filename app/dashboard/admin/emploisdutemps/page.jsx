"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Printer,
  Users,
  MapPin,
  CalendarDays,
  AlertTriangle,
  Loader2,
  Save,
} from "lucide-react";

/* =========================================================
   PALETTE
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

/* =========================================================
   🎓 CYCLES SCOLAIRES PAR DÉFAUT
   IMPORTANT :
   Toutes les heures sont maintenant stockées en MINUTES.
   
   08:00 = 480
   08:20 = 500
   17:00 = 1020
========================================================= */
const CYCLES_DEFAUT = [
  {
    id: "PRESCOLAIRE",
    label: "Préscolaire / Maternelle",
    jours: ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"],
    heureDebut: 480,
    heureFin: 720,
    dureeCreneau: 20,
    personnalise: false,
  },
  {
    id: "FONDAMENTAL_1",
    label: "Fondamental 1er cycle (Primaire)",
    jours: ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"],
    heureDebut: 460,
    heureFin: 1020,
    dureeCreneau: 20,
    personnalise: false,
  },
  {
    id: "FONDAMENTAL_2",
    label: "Fondamental 2nd cycle (Collège)",
    jours: [
      "LUNDI",
      "MARDI",
      "MERCREDI",
      "JEUDI",
      "VENDREDI",
      "SAMEDI",
    ],
    heureDebut: 480,
    heureFin: 1080,
    dureeCreneau: 60,
    personnalise: false,
  },
  {
    id: "SECONDAIRE",
    label: "Secondaire (Lycée)",
    jours: [
      "LUNDI",
      "MARDI",
      "MERCREDI",
      "JEUDI",
      "VENDREDI",
      "SAMEDI",
    ],
    heureDebut: 420,
    heureFin: 1080,
    dureeCreneau: 60,
    personnalise: false,
  },
];

const JOURS_DISPONIBLES = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
  "DIMANCHE",
];

const DUREES_PROPOSEES = [
  { valeur: 15, label: "15 min" },
  { valeur: 20, label: "20 min" },
  { valeur: 30, label: "30 min" },
  { valeur: 45, label: "45 min" },
  { valeur: 60, label: "1h" },
  { valeur: 90, label: "1h30" },
  { valeur: 120, label: "2h" },
];

const CLE_STOCKAGE_CYCLES = "emploiDuTemps_cyclesPersonnalises";

// À ajuster uniquement si ton DTO Classe utilise un autre nom pour le cycle.
function extraireCycleId(classe) {
  return classe?.niveau?.cycle?.id ?? classe?.cycle?.id ??
    classe?.cycleId ?? classe?.niveau?.cycleId ?? null;
}

function normaliserConfiguration(config) {
  return (config?.creneaux || [])
    .map((c) => ({
      jour: c.jour,
      debut: Number(c.heureDebut),
      fin: Number(c.heureFin),
      ordre: Number(c.ordre || 0),
    }))
    .filter((c) => c.jour && Number.isFinite(c.debut) &&
      Number.isFinite(c.fin) && c.fin > c.debut);
}


/* =========================================================
   🕒 UTILITAIRES HORAIRES
========================================================= */

/**
 * "08:20" -> 500
 */
function heureVersMinutes(heure) {
  if (!heure || !heure.includes(":")) return 0;

  const [h, m] = heure.split(":").map(Number);

  return h * 60 + m;
}

/**
 * 500 -> "08:20"
 */
function minutesVersHeure(minutes) {
  const total = Math.round(Number(minutes));

  const h = Math.floor(total / 60);
  const m = total % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * 500 -> "8h20"
 * 480 -> "8h"
 */
function formaterHeure(minutes) {
  const total = Math.round(Number(minutes));

  const h = Math.floor(total / 60);
  const m = total % 60;

  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/**
 * 60 -> "1h"
 * 90 -> "1h30"
 * 20 -> "20 min"
 */
function formaterDuree(minutes) {
  const total = Math.round(Number(minutes));

  if (total < 60) {
    return `${total} min`;
  }

  if (total % 60 === 0) {
    return `${total / 60}h`;
  }

  return `${Math.floor(total / 60)}h${String(total % 60).padStart(
    2,
    "0"
  )}`;
}

/**
 * Génère les créneaux d'un cycle.
 *
 * Exemple :
 * 08:00 -> 09:00 avec 20 min
 *
 * [
 *   { debut: 480, fin: 500 },
 *   { debut: 500, fin: 520 },
 *   { debut: 520, fin: 540 }
 * ]
 */
function genererCreneauxCycle(cycle) {
  if (!cycle) return [];

  /* ---------------------------------------------
     Créneaux personnalisés
  --------------------------------------------- */
  if (cycle?.creneaux?.length > 0) {
    return cycle.creneaux
      .map((c) => ({
        debut: Number(c.debut),
        fin: Number(c.fin),
      }))
      .filter((c) => c.fin > c.debut)
      .sort((a, b) => a.debut - b.debut);
  }

  /* ---------------------------------------------
     Créneaux automatiques
  --------------------------------------------- */
  const minDebut = Number(cycle.heureDebut);
  const minFin = Number(cycle.heureFin);
  const pas = Number(cycle.dureeCreneau);

  if (!Number.isFinite(minDebut)) return [];
  if (!Number.isFinite(minFin)) return [];
  if (!Number.isFinite(pas)) return [];
  if (pas <= 0) return [];
  if (minFin <= minDebut) return [];

  const creneaux = [];

  for (let m = minDebut; m < minFin; m += pas) {
    const fin = Math.min(m + pas, minFin);

    creneaux.push({
      debut: m,
      fin,
    });
  }

  return creneaux;
}

/* =========================================================
   🛠️ EXTRACTION DU MESSAGE D'ERREUR
========================================================= */
function extraireMessageErreur(error, messageParDefaut) {
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return "Le serveur met trop de temps à répondre. Réessayez.";
    }

    return "Impossible de contacter le serveur. Vérifiez votre connexion.";
  }

  const { status, data } = error.response;

  if (typeof data === "string" && data.trim().length > 0) {
    return data;
  }

  if (data && typeof data === "object") {
    if (
      typeof data.message === "string" &&
      data.message.trim().length > 0
    ) {
      return data.message;
    }

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors
        .map((e) => e.defaultMessage || e.message || String(e))
        .join(" · ");
    }

    if (typeof data.error === "string") {
      return data.error;
    }
  }

  if (status === 401) {
    return "Session expirée, veuillez vous reconnecter.";
  }

  if (status === 403) {
    return "Vous n'avez pas les droits pour effectuer cette action.";
  }

  if (status === 404) {
    return "Élément introuvable (déjà supprimé ?).";
  }

  if (status === 409) {
    return messageParDefaut || "Conflit détecté sur ce créneau.";
  }

  if (status >= 500) {
    return "Erreur serveur. Réessayez dans un instant.";
  }

  return messageParDefaut || "Une erreur est survenue.";
}

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */
export default function EmploiDuTempsForm() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  /* =========================================================
     CYCLES PERSONNALISÉS
  ========================================================= */

  const [cyclesPersonnalises, setCyclesPersonnalises] = useState([]);
  const [cyclesCharges, setCyclesCharges] = useState(false);

  useEffect(() => {
    try {
      const stocke = window.localStorage.getItem(
        CLE_STOCKAGE_CYCLES
      );

      if (stocke) {
        const parses = JSON.parse(stocke);

        if (Array.isArray(parses)) {
          setCyclesPersonnalises(parses);
        }
      }
    } catch (error) {
      console.error(
        "Erreur lecture cycles personnalisés:",
        error
      );
    } finally {
      setCyclesCharges(true);
    }
  }, []);

  useEffect(() => {
    if (!cyclesCharges) return;

    try {
      window.localStorage.setItem(
        CLE_STOCKAGE_CYCLES,
        JSON.stringify(cyclesPersonnalises)
      );
    } catch (error) {
      console.error(
        "Erreur sauvegarde cycles personnalisés:",
        error
      );
    }
  }, [cyclesPersonnalises, cyclesCharges]);

  const cyclesTous = useMemo(
    () => [...CYCLES_DEFAUT, ...cyclesPersonnalises],
    [cyclesPersonnalises]
  );

  const [cycleId, setCycleId] = useState(
    CYCLES_DEFAUT[0].id
  );

  const cycleActif = useMemo(
    () =>
      cyclesTous.find((c) => c.id === cycleId) ||
      cyclesTous[0],
    [cyclesTous, cycleId]
  );

  /* =========================================================
     FORMULAIRE CYCLE PERSONNALISÉ
  ========================================================= */

  const [showCycleForm, setShowCycleForm] = useState(false);
  const [erreurCycle, setErreurCycle] = useState("");

  const [nouveauCycle, setNouveauCycle] = useState({
    label: "",
    jours: [],
    heureDebut: "08:00",
    heureFin: "17:00",
    dureeCreneau: 60,
    creneaux: [],
  });

  const toggleJourNouveauCycle = (jour) => {
    setNouveauCycle((prev) => ({
      ...prev,
      jours: prev.jours.includes(jour)
        ? prev.jours.filter((j) => j !== jour)
        : [...prev.jours, jour],
    }));
  };

  const ajouterCreneauNouveauCycle = () => {
    setNouveauCycle((prev) => ({
      ...prev,
      creneaux: [
        ...prev.creneaux,
        {
          id: Date.now(),
          debut: "08:00",
          fin: "08:30",
        },
      ],
    }));
  };

  const modifierCreneauNouveauCycle = (
    id,
    champ,
    valeur
  ) => {
    setNouveauCycle((prev) => ({
      ...prev,
      creneaux: prev.creneaux.map((c) =>
        c.id === id
          ? {
              ...c,
              [champ]: valeur,
            }
          : c
      ),
    }));
  };

  const supprimerCreneauNouveauCycle = (id) => {
    setNouveauCycle((prev) => ({
      ...prev,
      creneaux: prev.creneaux.filter(
        (c) => c.id !== id
      ),
    }));
  };

  /* =========================================================
     VALIDATION CYCLE PERSONNALISÉ
  ========================================================= */

  const validerNouveauCycle = () => {
    if (!nouveauCycle.label.trim()) {
      return "Donnez un nom à ce cycle.";
    }

    if (nouveauCycle.jours.length === 0) {
      return "Sélectionnez au moins un jour.";
    }

    /* ---------------------------------------------
       Créneaux personnalisés
    --------------------------------------------- */
    if (nouveauCycle.creneaux.length > 0) {
      const creneaux = nouveauCycle.creneaux
        .map((c) => ({
          debut: heureVersMinutes(c.debut),
          fin: heureVersMinutes(c.fin),
        }))
        .sort((a, b) => a.debut - b.debut);

      for (let i = 0; i < creneaux.length; i++) {
        const creneau = creneaux[i];

        if (creneau.fin <= creneau.debut) {
          return `Créneau ${
            i + 1
          } : l'heure de fin doit être après l'heure de début.`;
        }

        if (
          i > 0 &&
          creneau.debut < creneaux[i - 1].fin
        ) {
          return `Les créneaux ${i} et ${
            i + 1
          } se chevauchent.`;
        }
      }

      return null;
    }

    /* ---------------------------------------------
       Créneaux automatiques
    --------------------------------------------- */
    const debut = heureVersMinutes(
      nouveauCycle.heureDebut
    );

    const fin = heureVersMinutes(
      nouveauCycle.heureFin
    );

    if (fin <= debut) {
      return "L'heure de fin doit être après l'heure de début.";
    }

    if (
      !nouveauCycle.dureeCreneau ||
      Number(nouveauCycle.dureeCreneau) <= 0
    ) {
      return "Choisissez une durée de créneau.";
    }

    return null;
  };

  /* =========================================================
     AJOUT CYCLE PERSONNALISÉ
  ========================================================= */

  const handleAjouterCycle = () => {
    const erreur = validerNouveauCycle();

    if (erreur) {
      setErreurCycle(erreur);
      return;
    }

    const creneauxPersonnalises =
      nouveauCycle.creneaux
        .map((c) => ({
          debut: heureVersMinutes(c.debut),
          fin: heureVersMinutes(c.fin),
        }))
        .sort((a, b) => a.debut - b.debut);

    let heureDebut;
    let heureFin;
    let dureeCreneau;

    if (creneauxPersonnalises.length > 0) {
      heureDebut =
        creneauxPersonnalises[0].debut;

      heureFin =
        creneauxPersonnalises[
          creneauxPersonnalises.length - 1
        ].fin;

      dureeCreneau = 0;
    } else {
      heureDebut = heureVersMinutes(
        nouveauCycle.heureDebut
      );

      heureFin = heureVersMinutes(
        nouveauCycle.heureFin
      );

      dureeCreneau = Number(
        nouveauCycle.dureeCreneau
      );
    }

    const cycle = {
      id: `perso-${Date.now()}`,

      label: nouveauCycle.label.trim(),

      jours: JOURS_DISPONIBLES.filter((j) =>
        nouveauCycle.jours.includes(j)
      ),

      heureDebut,
      heureFin,
      dureeCreneau,

      creneaux: creneauxPersonnalises,

      personnalise: true,
    };

    setCyclesPersonnalises((prev) => [
      ...prev,
      cycle,
    ]);

    setCycleId(cycle.id);

    setForm((prev) => ({
      ...prev,
      jour: "",
      heureDebut: "",
      heureFin: "",
    }));

    setNouveauCycle({
      label: "",
      jours: [],
      heureDebut: "08:00",
      heureFin: "17:00",
      dureeCreneau: 60,
      creneaux: [],
    });

    setErreurCycle("");
    setShowCycleForm(false);
  };

  /* =========================================================
     SUPPRESSION CYCLE PERSONNALISÉ
  ========================================================= */

  const handleSupprimerCycle = (id) => {
    if (!confirm("Supprimer ce cycle personnalisé ?")) {
      return;
    }

    setCyclesPersonnalises((prev) =>
      prev.filter((c) => c.id !== id)
    );

    if (cycleId === id) {
      setCycleId(CYCLES_DEFAUT[0].id);

      setForm((prev) => ({
        ...prev,
        jour: "",
        heureDebut: "",
        heureFin: "",
      }));
    }
  };

  /* =========================================================
     CRÉNEAUX DU CYCLE
  ========================================================= */

  /* =========================================================
     FORMULAIRE PRINCIPAL
  ========================================================= */

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
  const [erreurChargement, setErreurChargement] =
    useState("");
  const [showForm, setShowForm] = useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [isLoadingClasse, setIsLoadingClasse] =
    useState(false);

  const [donnees, setDonnees] = useState({
    classes: [],
    annees: [],
    salles: [],
    sousGroupes: [],
    affectations: [],
    emploi: [],
  });

  // La configuration serveur est prioritaire pour la classe sélectionnée.
  const [configurationServeur, setConfigurationServeur] = useState(null);
  const [chargementConfiguration, setChargementConfiguration] = useState(false);
  const [sauvegardeConfiguration, setSauvegardeConfiguration] = useState(false);
  const [messageConfiguration, setMessageConfiguration] = useState("");
  const [erreurConfiguration, setErreurConfiguration] = useState("");

  const classeSelectionnee = useMemo(() =>
    donnees.classes.find((c) => String(c.id) === String(form.classeId)),
    [donnees.classes, form.classeId]
  );
  const cycleBackendId = extraireCycleId(classeSelectionnee);

  const joursCycle = configurationServeur?.length
    ? JOURS_DISPONIBLES.filter((jour) =>
        configurationServeur.some((c) => c.jour === jour))
    : (cycleActif?.jours || []);


  const creneauxCycle = useMemo(
    () => configurationServeur?.length
      ? [...new Map(configurationServeur.map((c) =>
          [`${c.debut}-${c.fin}`, { debut: c.debut, fin: c.fin }]
        )).values()].sort((a, b) => a.debut - b.debut)
      : genererCreneauxCycle(cycleActif),
    [cycleActif, configurationServeur]
  );

  const bornesCycle = useMemo(() => {
    if (!creneauxCycle.length) return [];

    const bornes = [];

    creneauxCycle.forEach((c) => {
      if (!bornes.includes(c.debut)) {
        bornes.push(c.debut);
      }

      if (!bornes.includes(c.fin)) {
        bornes.push(c.fin);
      }
    });

    return bornes.sort((a, b) => a - b);
  }, [creneauxCycle]);


  /* =========================================================
     CHARGEMENT INITIAL
  ========================================================= */

  useEffect(() => {
    if (!ecoleId) return;

    const chargerDonneesInitiales = async () => {
      setErreurChargement("");

      try {
        const [
          anneesRes,
          classesRes,
          sallesRes,
        ] = await Promise.all([
          api.get(`/annees/ecole/${ecoleId}`),
          api.get(`/classes/ecole/${ecoleId}`),
          api.get(`/salles/ecole/${ecoleId}`),
        ]);

        const annees = anneesRes.data || [];
        const classes = classesRes.data || [];
        const salles = sallesRes.data || [];

        setDonnees((prev) => ({
          ...prev,
          annees,
          classes,
          salles,
        }));

        const anneeActive = annees.find(
          (a) => a.active
        );

        if (anneeActive) {
          setForm((prev) => ({
            ...prev,
            anneeId: String(anneeActive.id),
          }));
        }
      } catch (error) {
        console.error(
          "Erreur chargement données initiales:",
          error
        );

        setErreurChargement(
          extraireMessageErreur(
            error,
            "Impossible de charger les données initiales."
          )
        );
      }
    };

    chargerDonneesInitiales();
  }, [ecoleId]);

  // Charger les créneaux enregistrés pour le cycle réel de la classe.
  useEffect(() => {
    setConfigurationServeur(null);
    setMessageConfiguration("");
    setErreurConfiguration("");
    if (!ecoleId || !form.classeId || !cycleBackendId) return;
    let actif = true;
    const charger = async () => {
      setChargementConfiguration(true);
      try {
        const { data } = await api.get(
          `/configurations-creneaux/ecole/${ecoleId}/cycle/${cycleBackendId}`
        );
        if (actif) setConfigurationServeur(normaliserConfiguration(data));
      } catch (error) {
        if (actif && error.response?.status !== 404) {
          setErreurConfiguration(extraireMessageErreur(
            error, "Impossible de charger les créneaux du cycle."
          ));
        }
      } finally {
        if (actif) setChargementConfiguration(false);
      }
    };
    charger();
    return () => { actif = false; };
  }, [ecoleId, form.classeId, cycleBackendId]);

  const enregistrerConfiguration = async () => {
    setErreurConfiguration("");
    setMessageConfiguration("");
    if (!ecoleId || !form.classeId) {
      setErreurConfiguration("Sélectionnez d'abord une classe.");
      return;
    }
    if (!cycleBackendId) {
      setErreurConfiguration(
        "Le cycle de cette classe n'est pas présent dans la réponse de /classes/ecole. " +
        "Vérifiez le DTO Classe et la fonction extraireCycleId."
      );
      return;
    }
    const slots = genererCreneauxCycle(cycleActif);
    const jours = cycleActif?.jours || [];
    if (!slots.length || !jours.length) {
      setErreurConfiguration("Définissez des jours et des créneaux valides.");
      return;
    }
    const creneaux = jours.flatMap((jour) =>
      slots.map((slot, ordre) => ({
        jour, heureDebut: slot.debut, heureFin: slot.fin, ordre: ordre + 1,
      }))
    );
    setSauvegardeConfiguration(true);
    try {
      const { data } = await api.put("/configurations-creneaux", {
        ecoleId: Number(ecoleId),
        cycleId: Number(cycleBackendId),
        creneaux,
      });
      setConfigurationServeur(normaliserConfiguration(data));
      setMessageConfiguration(
        "Créneaux enregistrés sur le serveur : le PDF utilisera ces horaires."
      );
    } catch (error) {
      setErreurConfiguration(extraireMessageErreur(
        error, "Impossible d'enregistrer les créneaux."
      ));
    } finally {
      setSauvegardeConfiguration(false);
    }
  };

  /* =========================================================
     CHARGEMENT DONNÉES CLASSE
  ========================================================= */

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
        const [
          affectationsRes,
          sousGroupesRes,
          emploiRes,
        ] = await Promise.all([
          api.get(
            `/affectations-enseignants/classe/${form.classeId}`,
            {
              params: {
                anneeScolaireId: form.anneeId,
              },
            }
          ),

          api.get(
            `/sous-groupes/classe/${form.classeId}`,
            {
              params: {
                anneeScolaireId: form.anneeId,
              },
            }
          ),

          api.get(
            `/emploi/classe/${form.classeId}/${form.anneeId}`
          ),
        ]);

        setDonnees((prev) => ({
          ...prev,

          affectations:
            affectationsRes.data || [],

          sousGroupes:
            sousGroupesRes.data || [],

          emploi: Array.isArray(emploiRes.data)
            ? emploiRes.data
            : [],
        }));
      } catch (error) {
        console.error(
          "Erreur chargement données classe:",
          error
        );

        setErreurChargement(
          extraireMessageErreur(
            error,
            "Impossible de charger l'emploi du temps de cette classe."
          )
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

  /* =========================================================
     MATIÈRES DISPONIBLES
  ========================================================= */

  const matieresDisponibles = useMemo(() => {
    const matieresUniques = new Map();

    donnees.affectations.forEach(
      (affectation) => {
        if (
          !matieresUniques.has(
            affectation.matiereId
          )
        ) {
          matieresUniques.set(
            affectation.matiereId,
            {
              id: affectation.matiereId,
              nom: affectation.matiereNom,
            }
          );
        }
      }
    );

    return Array.from(
      matieresUniques.values()
    );
  }, [donnees.affectations]);

  /* =========================================================
     ENSEIGNANTS DISPONIBLES
  ========================================================= */

  const enseignantsDisponibles = useMemo(() => {
    if (!form.matiereId) return [];

    return donnees.affectations
      .filter(
        (a) =>
          String(a.matiereId) ===
          String(form.matiereId)
      )
      .map((a) => ({
        id: a.enseignantId,
        nom: a.enseignantNom,
        prenom: a.enseignantPrenom,
      }));
  }, [
    donnees.affectations,
    form.matiereId,
  ]);

  /* =========================================================
     OPTIONS HEURE FIN
  ========================================================= */

  const optionsHeureFin = useMemo(() => {
    if (!form.heureDebut) return [];

    return bornesCycle.filter(
      (h) => h > Number(form.heureDebut)
    );
  }, [
    bornesCycle,
    form.heureDebut,
  ]);

  /* =========================================================
     COURS PAR JOUR
  ========================================================= */

  const coursParJour = useMemo(() => {
    const map = new Map(
      joursCycle.map((j) => [j, []])
    );

    donnees.emploi.forEach((cours) => {
      if (map.has(cours.jour)) {
        map.get(cours.jour).push(cours);
      }
    });

    map.forEach((liste) =>
      liste.sort(
        (a, b) =>
          Number(a.heureDebut) -
          Number(b.heureDebut)
      )
    );

    return map;
  }, [
    donnees.emploi,
    joursCycle,
  ]);

  /* =========================================================
     GESTION FORMULAIRE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,

      [name]: value,

      ...(name === "matiereId" && {
        enseignantId: "",
        sousGroupeId: "",
      }),

      ...(name === "classeId" && {
        matiereId: "",
        enseignantId: "",
        sousGroupeId: "",
      }),

      ...(name === "heureDebut" &&
        prev.heureFin !== "" &&
        Number(prev.heureFin) <= Number(value) && {
          heureFin: "",
        }),
    }));

    setErreur("");
  };

  const handleCycleChange = (e) => {
    setCycleId(e.target.value);

    setForm((prev) => ({
      ...prev,
      jour: "",
      heureDebut: "",
      heureFin: "",
    }));

    setErreur("");
  };

  /* =========================================================
     RESET
  ========================================================= */

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
      resetForm();
      setShowForm(false);
    } else {
      setShowForm(true);
    }
  };

  /* =========================================================
     RECHARGER EMPLOI
  ========================================================= */

  const rechargerEmploi = async () => {
    if (!form.classeId || !form.anneeId) {
      return;
    }

    try {
      const response = await api.get(
        `/emploi/classe/${form.classeId}/${form.anneeId}`
      );

      setDonnees((prev) => ({
        ...prev,

        emploi: Array.isArray(response.data)
          ? response.data
          : [],
      }));
    } catch (error) {
      console.error(
        "Erreur rechargement EDT:",
        error
      );

      setDonnees((prev) => ({
        ...prev,
        emploi: [],
      }));

      setErreurChargement(
        extraireMessageErreur(
          error,
          "L'emploi du temps affiché peut être obsolète."
        )
      );
    }
  };

  /* =========================================================
     PDF
  ========================================================= */

  const telechargerPdf = async () => {
    if (!form.classeId || !form.anneeId) {
      setErreur(
        "Veuillez sélectionner une classe et une année scolaire."
      );

      return;
    }

    try {
      setErreur("");

      const response = await api.get(
        `/emploi/classe/${form.classeId}/${form.anneeId}/pdf`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download = `emploi-du-temps-${form.classeId}-${form.anneeId}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(
        () => window.URL.revokeObjectURL(url),
        1000
      );
    } catch (error) {
      console.error(
        "Erreur génération PDF:",
        error
      );

      setErreur(
        extraireMessageErreur(
          error,
          "Impossible de générer l'emploi du temps en PDF."
        )
      );
    }
  };

  /* =========================================================
     VALIDATION FORMULAIRE
  ========================================================= */

  const validerFormulaire = () => {
    if (!form.classeId) {
      return "Veuillez sélectionner une classe.";
    }

    if (!form.matiereId) {
      return "Veuillez sélectionner une matière.";
    }

    if (!form.enseignantId) {
      return "Veuillez sélectionner un enseignant.";
    }

    if (!form.jour) {
      return "Veuillez sélectionner un jour.";
    }

    if (!form.heureDebut || !form.heureFin) {
      return "Veuillez renseigner l'heure de début et de fin.";
    }

    if (
      Number(form.heureFin) <=
      Number(form.heureDebut)
    ) {
      return "L'heure de fin doit être après l'heure de début.";
    }

    return null;
  };

  /* =========================================================
     ENREGISTREMENT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErreur("");

    if (isSubmitting) return;

    const erreurValidation =
      validerFormulaire();

    if (erreurValidation) {
      setErreur(erreurValidation);
      return;
    }

    /*
     * IMPORTANT :
     * heureDebut / heureFin sont maintenant
     * des MINUTES entières.
     *
     * Exemple :
     * 08:20 -> 500
     * 09:00 -> 540
     */
    const payload = {
      classeId: Number(form.classeId),

      matiereId: Number(form.matiereId),

      enseignantId: Number(
        form.enseignantId
      ),

      anneeId: Number(form.anneeId),

      salleId: form.salleId
        ? Number(form.salleId)
        : null,

      sousGroupeId: form.sousGroupeId
        ? Number(form.sousGroupeId)
        : null,

      jour: form.jour,

      heureDebut: Number(
        form.heureDebut
      ),

      heureFin: Number(
        form.heureFin
      ),
    };

    setIsSubmitting(true);

    try {
      if (editingId) {
        await api.put(
          `/emploi/${editingId}`,
          payload
        );
      } else {
        await api.post(
          "/emploi",
          payload
        );
      }

      resetForm();

      setShowForm(false);

      await rechargerEmploi();
    } catch (error) {
      console.error(
        "Erreur enregistrement:",
        error
      );

      setErreur(
        extraireMessageErreur(
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

  /* =========================================================
     SUPPRESSION
  ========================================================= */

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Voulez-vous vraiment supprimer ce créneau ?"
      )
    ) {
      return;
    }

    if (deletingId === id) return;

    setDeletingId(id);
    setErreur("");

    try {
      await api.delete(`/emploi/${id}`);

      await rechargerEmploi();
    } catch (error) {
      console.error(
        "Erreur suppression:",
        error
      );

      setErreur(
        extraireMessageErreur(
          error,
          "Impossible de supprimer ce créneau."
        )
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     MODIFICATION
  ========================================================= */

  const handleEdit = (cours) => {
    setForm({
      classeId: cours.classe?.id
        ? String(cours.classe.id)
        : "",

      matiereId: cours.matiere?.id
        ? String(cours.matiere.id)
        : "",

      enseignantId:
        cours.enseignant?.id
          ? String(cours.enseignant.id)
          : "",

      anneeId:
        cours.anneeScolaire?.id
          ? String(
              cours.anneeScolaire.id
            )
          : "",

      salleId: cours.salle?.id
        ? String(cours.salle.id)
        : "",

      sousGroupeId:
        cours.sousGroupe?.id
          ? String(cours.sousGroupe.id)
          : "",

      jour: cours.jour || "",

      /*
       * Le backend renvoie maintenant des minutes.
       */
      heureDebut:
        cours.heureDebut ?? "",

      heureFin:
        cours.heureFin ?? "",
    });

    setEditingId(cours.id);

    setErreur("");

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     CELLULE TABLEAU
  ========================================================= */

  const renderCellContent = (
    jour,
    creneau
  ) => {
    if (configurationServeur?.length &&
        !configurationServeur.some((c) => c.jour === jour &&
          c.debut <= creneau.debut && c.fin >= creneau.fin)) {
      return <td key={jour} className="border border-slate-100 bg-slate-50" />;
    }
    const cours =
      donnees.emploi.find(
        (c) =>
          c.jour === jour &&
          Number(c.heureDebut) <=
            creneau.debut &&
          Number(c.heureFin) >
            creneau.debut
      );

    if (!cours) {
      return (
        <td
          key={jour}
          className="border border-slate-100 text-center text-slate-300"
        >
          -
        </td>
      );
    }

    /*
     * Le cours a commencé sur une ligne précédente.
     */
    if (
      Number(cours.heureDebut) !==
      creneau.debut
    ) {
      return null;
    }

    /*
     * Nombre de lignes couvertes par le cours.
     */
    const rowSpan = Math.max(
      1,
      creneauxCycle.filter(
        (slot) =>
          slot.debut >=
            Number(cours.heureDebut) &&
          slot.debut <
            Number(cours.heureFin)
      ).length
    );

    const enSuppression =
      deletingId === cours.id;

    return (
      <td
        key={jour}
        rowSpan={rowSpan}
        className="border border-slate-100 p-1 text-center align-middle"
        style={{
          background: TEAL_SOFT,
          opacity: enSuppression ? 0.5 : 1,
        }}
      >
        <div className="text-[11px] font-bold leading-tight text-slate-800">
          {cours.matiere?.nom}
        </div>

        <div className="text-[10px] leading-tight text-slate-600">
          {cours.enseignant?.prenom}{" "}
          {cours.enseignant?.nom}
        </div>

        {cours.sousGroupe && (
          <div
            className="mt-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9px] font-semibold"
            style={{
              background: VIOLET_SOFT,
              color: VIOLET,
            }}
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
            onClick={() =>
              handleEdit(cours)
            }
            className="transition hover:scale-110 disabled:opacity-40"
            style={{ color: GOLD }}
            disabled={enSuppression}
          >
            <Pencil size={12} />
          </button>

          <button
            type="button"
            onClick={() =>
              handleDelete(cours.id)
            }
            className="transition hover:scale-110 disabled:opacity-40"
            style={{ color: CORAL }}
            disabled={enSuppression}
          >
            {enSuppression ? (
              <Loader2
                size={12}
                className="animate-spin"
              />
            ) : (
              <Trash2 size={12} />
            )}
          </button>
        </div>
      </td>
    );
  };

  /* =========================================================
     RENDU
  ========================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          ERREUR CHARGEMENT
      ===================================================== */}

      {erreurChargement && (
        <div
          className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            background: CORAL_SOFT,
            color: CORAL,
          }}
        >
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0"
          />

          <span>
            {erreurChargement}
          </span>
        </div>
      )}

      {/* =====================================================
          ERREUR FORMULAIRE
      ===================================================== */}

      {erreur && (
        <div
          className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            background: CORAL_SOFT,
            color: CORAL,
          }}
        >
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0"
          />

          <span>{erreur}</span>
        </div>
      )}

      {/* =====================================================
          SÉLECTEUR DE CYCLE
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-3">

        <div className="flex flex-wrap items-center gap-3">

          <label
            htmlFor="cycle-scolaire"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Cycle scolaire
          </label>

          <select
            id="cycle-scolaire"
            value={cycleId}
            onChange={handleCycleChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#C89B3C] focus:outline-none"
          >
            <optgroup label="Cycles par défaut">
              {CYCLES_DEFAUT.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.label}
                </option>
              ))}
            </optgroup>

            {cyclesPersonnalises.length >
              0 && (
              <optgroup label="Mes cycles">
                {cyclesPersonnalises.map(
                  (c) => (
                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.label}
                    </option>
                  )
                )}
              </optgroup>
            )}
          </select>

          <span className="text-[11px] text-slate-400">
            {joursCycle.length} jours ·{" "}
            {formaterHeure(
              cycleActif.heureDebut
            )}{" "}
            -{" "}
            {formaterHeure(
              cycleActif.heureFin
            )}

            {cycleActif.dureeCreneau >
              0 &&
              ` · créneaux de ${formaterDuree(
                cycleActif.dureeCreneau
              )}`}
          </span>

          <div className="ml-auto flex items-center gap-2">

            {cycleActif.personnalise && (
              <button
                type="button"
                onClick={() =>
                  handleSupprimerCycle(
                    cycleActif.id
                  )
                }
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition hover:brightness-110"
                style={{
                  background: CORAL_SOFT,
                  color: CORAL,
                }}
              >
                <Trash2 size={12} />

                Supprimer
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowCycleForm(
                  (v) => !v
                );

                setErreurCycle("");
              }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white transition hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${INK}, #182746)`,
              }}
            >
              {showCycleForm ? (
                <X size={12} />
              ) : (
                <Plus size={12} />
              )}

              {showCycleForm
                ? "Fermer"
                : "Créer un cycle"}
            </button>
          </div>
        </div>

        {/* ===================================================
            FORMULAIRE NOUVEAU CYCLE
        =================================================== */}

        {showCycleForm && (
          <div className="mt-3 space-y-3 rounded-xl border border-dashed border-slate-200 p-3">

            {erreurCycle && (
              <div
                className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                style={{
                  background:
                    CORAL_SOFT,
                  color: CORAL,
                }}
              >
                <AlertTriangle
                  size={13}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {erreurCycle}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              {/* Nom */}
              <input
                type="text"
                placeholder="Nom du cycle (ex: Internat, Cours du soir...)"
                value={
                  nouveauCycle.label
                }
                onChange={(e) =>
                  setNouveauCycle(
                    (p) => ({
                      ...p,
                      label:
                        e.target.value,
                    })
                  )
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#C89B3C] focus:outline-none sm:col-span-3"
              />

              {/* Jours */}
              <div className="sm:col-span-3">

                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Jours
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {JOURS_DISPONIBLES.map(
                    (jour) => {
                      const actif =
                        nouveauCycle.jours.includes(
                          jour
                        );

                      return (
                        <button
                          key={jour}
                          type="button"
                          onClick={() =>
                            toggleJourNouveauCycle(
                              jour
                            )
                          }
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium transition"
                          style={
                            actif
                              ? {
                                  background:
                                    TEAL,
                                  color:
                                    "#fff",
                                }
                              : {
                                  background:
                                    "#F1F5F9",
                                  color:
                                    "#64748B",
                                }
                          }
                        >
                          {jour}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Début */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Début
                </p>

                <input
                  type="time"
                  step="60"
                  value={
                    nouveauCycle.heureDebut
                  }
                  onChange={(e) =>
                    setNouveauCycle(
                      (p) => ({
                        ...p,
                        heureDebut:
                          e.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#C89B3C] focus:outline-none"
                />
              </div>

              {/* Fin */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Fin
                </p>

                <input
                  type="time"
                  step="60"
                  value={
                    nouveauCycle.heureFin
                  }
                  onChange={(e) =>
                    setNouveauCycle(
                      (p) => ({
                        ...p,
                        heureFin:
                          e.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#C89B3C] focus:outline-none"
                />
              </div>

              {/* Durée */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Durée d'un créneau
                </p>

                <select
                  value={
                    nouveauCycle.dureeCreneau
                  }
                  onChange={(e) =>
                    setNouveauCycle(
                      (p) => ({
                        ...p,
                        dureeCreneau:
                          Number(
                            e.target
                              .value
                          ),
                      })
                    )
                  }
                  disabled={
                    nouveauCycle.creneaux
                      .length > 0
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#C89B3C] focus:outline-none"
                >
                  {DUREES_PROPOSEES.map(
                    (d) => (
                      <option
                        key={d.valeur}
                        value={d.valeur}
                      >
                        {d.label}
                      </option>
                    )
                  )}
                </select>

                {nouveauCycle.creneaux
                  .length > 0 && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    Ignoré : vous utilisez des
                    créneaux personnalisés.
                  </p>
                )}
              </div>

              {/* =================================================
                  CRÉNEAUX PERSONNALISÉS
              ================================================= */}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-3">

                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Créneaux personnalisés
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Vous pouvez définir des horaires différents pour chaque créneau.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      ajouterCreneauNouveauCycle
                    }
                    className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition hover:brightness-110"
                    style={{
                      background: TEAL,
                    }}
                  >
                    <Plus size={13} />

                    Ajouter un créneau
                  </button>
                </div>

                {nouveauCycle.creneaux
                  .length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-center">

                    <p className="text-xs text-slate-400">
                      Aucun créneau personnalisé.
                    </p>

                    <p className="mt-1 text-[10px] text-slate-400">
                      La durée sélectionnée ci-dessus sera utilisée automatiquement.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">

                    {nouveauCycle.creneaux.map(
                      (
                        creneau,
                        index
                      ) => (
                        <div
                          key={
                            creneau.id
                          }
                          className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:flex-row sm:items-end"
                        >

                          <div className="flex-1">

                            <label className="mb-1 block text-[10px] font-medium text-slate-500">
                              Créneau{" "}
                              {index +
                                1}{" "}
                              — Début
                            </label>

                            <input
                              type="time"
                              step="60"
                              value={
                                creneau.debut
                              }
                              onChange={(
                                e
                              ) =>
                                modifierCreneauNouveauCycle(
                                  creneau.id,
                                  "debut",
                                  e
                                    .target
                                    .value
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#C89B3C] focus:outline-none"
                            />
                          </div>

                          <div className="flex-1">

                            <label className="mb-1 block text-[10px] font-medium text-slate-500">
                              Fin
                            </label>

                            <input
                              type="time"
                              step="60"
                              value={
                                creneau.fin
                              }
                              onChange={(
                                e
                              ) =>
                                modifierCreneauNouveauCycle(
                                  creneau.id,
                                  "fin",
                                  e
                                    .target
                                    .value
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#C89B3C] focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              supprimerCreneauNouveauCycle(
                                creneau.id
                              )
                            }
                            className="flex h-10 items-center justify-center rounded-lg px-3 transition hover:brightness-95"
                            style={{
                              background:
                                CORAL_SOFT,
                              color:
                                CORAL,
                            }}
                            title="Supprimer ce créneau"
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        </div>
                      )
                    )}

                    <p className="pt-1 text-[10px] text-slate-400">
                      Les créneaux seront automatiquement triés par heure. Ils ne doivent pas se chevaucher.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">

              <button
                type="button"
                onClick={
                  handleAjouterCycle
                }
                className="rounded-lg px-4 py-2 text-sm font-medium transition hover:brightness-110"
                style={{
                  background: `linear-gradient(135deg, ${GOLD_2}, ${GOLD})`,
                  color: INK,
                }}
              >
                Ajouter ce cycle
              </button>

            </div>
          </div>
        )}
      </div>

      {/* Synchronisation des créneaux avec le backend et le PDF */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-600">
            <strong>Créneaux du cycle de la classe</strong>
            <p className="mt-1">
              {chargementConfiguration ? "Chargement des créneaux..." :
                configurationServeur?.length
                  ? "Configuration du serveur active (également utilisée par le PDF)."
                  : "Aucune configuration serveur chargée : horaires locaux affichés."}
            </p>
          </div>
          <button type="button" onClick={enregistrerConfiguration}
            disabled={sauvegardeConfiguration || chargementConfiguration || !form.classeId}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: TEAL }}>
            {sauvegardeConfiguration ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer ces créneaux pour le PDF
          </button>
        </div>
        {messageConfiguration && <p className="text-xs text-emerald-700">{messageConfiguration}</p>}
        {erreurConfiguration && <p className="text-xs text-red-600">{erreurConfiguration}</p>}
        {!cycleBackendId && form.classeId &&
          <p className="text-xs text-amber-700">Le cycle backend de la classe est introuvable.</p>}
      </div>

      {/* =====================================================
          EN-TÊTE
      ===================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <span
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
            style={{
              background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`,
              color: INK,
            }}
          >
            <CalendarDays size={17} />
          </span>

          <h2 className="text-base font-semibold text-slate-900">
            {editingId
              ? "Modifier le créneau"
              : "Emploi du temps"}
          </h2>

        </div>

        <button
          type="button"
          onClick={toggleForm}
          className="flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white transition hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, ${INK}, #182746)`,
          }}
        >
          {showForm ? (
            <X size={15} />
          ) : (
            <Plus size={15} />
          )}

          {showForm
            ? "Fermer"
            : "Ajouter un créneau"}
        </button>

      </div>

      {/* =====================================================
          FORMULAIRE PRINCIPAL
      ===================================================== */}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 md:grid-cols-3"
        >

          {isLoadingClasse && (
            <div className="col-span-1 flex items-center gap-2 text-xs text-slate-500 sm:col-span-2 md:col-span-3">
              <Loader2
                size={12}
                className="animate-spin"
              />

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
            <option value="">
              Année scolaire
            </option>

            {donnees.annees.map((a) => (
              <option
                key={a.id}
                value={a.id}
              >
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
            <option value="">
              Classe
            </option>

            {donnees.classes.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
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
            <option value="">
              Matière
            </option>

            {matieresDisponibles.map(
              (m) => (
                <option
                  key={m.id}
                  value={m.id}
                >
                  {m.nom}
                </option>
              )
            )}
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
            <option value="">
              Enseignant
            </option>

            {enseignantsDisponibles.map(
              (e) => (
                <option
                  key={e.id}
                  value={e.id}
                >
                  {e.prenom} {e.nom}
                </option>
              )
            )}
          </select>

          {/* Sous-groupe */}
          <select
            name="sousGroupeId"
            value={form.sousGroupeId}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
          >
            <option value="">
              Classe entière
            </option>

            {donnees.sousGroupes.map(
              (sg) => (
                <option
                  key={sg.id}
                  value={sg.id}
                >
                  {sg.nom}
                </option>
              )
            )}
          </select>

          {/* Salle */}
          <select
            name="salleId"
            value={form.salleId}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
          >
            <option value="">
              Salle par défaut
            </option>

            {donnees.salles.map(
              (s) => (
                <option
                  key={s.id}
                  value={s.id}
                >
                  {s.nom}
                </option>
              )
            )}
          </select>

          {/* Jour */}
          <select
            name="jour"
            value={form.jour}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
            required
          >
            <option value="">
              Jour
            </option>

            {joursCycle.map(
              (j) => (
                <option
                  key={j}
                  value={j}
                >
                  {j}
                </option>
              )
            )}
          </select>

          {/* Heures */}
          <div className="flex gap-2">

            <select
              name="heureDebut"
              value={form.heureDebut}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
              required
            >
              <option value="">
                Début
              </option>

              {bornesCycle
                .slice(0, -1)
                .map((h) => (
                  <option
                    key={h}
                    value={h}
                  >
                    {formaterHeure(h)}
                  </option>
                ))}
            </select>

            <select
              name="heureFin"
              value={form.heureFin}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#C89B3C] focus:outline-none"
              required
              disabled={!form.heureDebut}
            >
              <option value="">
                Fin
              </option>

              {optionsHeureFin.map(
                (h) => (
                  <option
                    key={h}
                    value={h}
                  >
                    {formaterHeure(h)}
                  </option>
                )
              )}
            </select>

          </div>

          {/* Boutons */}
          <div className="col-span-1 flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center md:col-span-3">

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              style={{
                background: `linear-gradient(135deg, ${INK}, #182746)`,
              }}
            >
              {isSubmitting && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              {isSubmitting
                ? "Enregistrement..."
                : editingId
                ? "Mettre à jour"
                : "Enregistrer"}
            </button>

            <button
              type="button"
              onClick={
                editingId
                  ? resetForm
                  : toggleForm
              }
              disabled={isSubmitting}
              className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Annuler
            </button>

          </div>
        </form>
      )}

      {/* =====================================================
          MOBILE
      ===================================================== */}

      <div className="space-y-3 rounded-2xl bg-white p-3 shadow-md sm:hidden">

        <div className="flex justify-end">

          <button
            type="button"
            onClick={telechargerPdf}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110"
            style={{
              background: INK,
            }}
          >
            <Printer size={12} />

            PDF
          </button>

        </div>

        {joursCycle.map((jour) => {

          const coursDuJour =
            coursParJour.get(jour) ||
            [];

          return (
            <div key={jour}>

              <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {jour}
              </h3>

              {coursDuJour.length ===
              0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-2 py-2 text-center text-[11px] text-slate-400">
                  Aucun cours
                </p>
              ) : (
                <div className="space-y-1.5">

                  {coursDuJour.map(
                    (cours) => {

                      const enSuppression =
                        deletingId ===
                        cours.id;

                      return (
                        <div
                          key={
                            cours.id
                          }
                          className="rounded-lg px-2.5 py-1.5"
                          style={{
                            background:
                              TEAL_SOFT,
                            opacity:
                              enSuppression
                                ? 0.5
                                : 1,
                          }}
                        >

                          <div className="flex items-center justify-between gap-2">

                            <div className="min-w-0 flex-1">

                              <div className="flex items-baseline gap-1.5">

                                <span className="shrink-0 text-[10px] font-medium text-slate-500">
                                  {formaterHeure(
                                    cours.heureDebut
                                  )}
                                  -
                                  {formaterHeure(
                                    cours.heureFin
                                  )}
                                </span>

                                <span className="truncate text-xs font-bold text-slate-800">
                                  {
                                    cours
                                      .matiere
                                      ?.nom
                                  }
                                </span>

                              </div>

                              <p className="truncate text-[10px] text-slate-600">

                                {
                                  cours
                                    .enseignant
                                    ?.prenom
                                }{" "}
                                {
                                  cours
                                    .enseignant
                                    ?.nom
                                }

                                {cours.sousGroupe &&
                                  ` · ${cours.sousGroupe.nom}`}

                                {cours.salle &&
                                  ` · ${cours.salle.nom}`}
                              </p>

                            </div>

                            <div className="flex shrink-0 gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    cours
                                  )
                                }
                                className="transition hover:scale-110 disabled:opacity-40"
                                style={{
                                  color: GOLD,
                                }}
                                disabled={
                                  enSuppression
                                }
                              >
                                <Pencil
                                  size={
                                    13
                                  }
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    cours.id
                                  )
                                }
                                className="transition hover:scale-110 disabled:opacity-40"
                                style={{
                                  color: CORAL,
                                }}
                                disabled={
                                  enSuppression
                                }
                              >
                                {enSuppression ? (
                                  <Loader2
                                    size={
                                      13
                                    }
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={
                                      13
                                    }
                                  />
                                )}
                              </button>

                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* =====================================================
          DESKTOP
      ===================================================== */}

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-md sm:block">

        <div className="flex justify-end border-b border-slate-100 p-2">

          <button
            type="button"
            onClick={telechargerPdf}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110"
            style={{
              background: INK,
            }}
          >
            <Printer size={12} />

            PDF
          </button>

        </div>

        <table
          className="w-full table-fixed border-collapse text-xs"
          style={{
            minWidth: `${
              100 +
              joursCycle.length *
                100
            }px`,
          }}
        >

          <thead>

            <tr
              style={{
                background: "#F8F7F2",
              }}
            >

              <th className="w-16 border border-slate-100 p-1 text-slate-500">
                Heure
              </th>

              {joursCycle.map(
                (j) => (
                  <th
                    key={j}
                    className="border border-slate-100 p-1 text-slate-500"
                  >
                    {j}
                  </th>
                )
              )}

            </tr>

          </thead>

          <tbody>

            {creneauxCycle.map(
              (creneau) => (
                <tr
                  key={`${creneau.debut}-${creneau.fin}`}
                  className="h-10"
                >

                  <td className="whitespace-nowrap border border-slate-100 p-1 text-[11px] font-bold text-slate-600">
                    {formaterHeure(
                      creneau.debut
                    )}
                    -
                    {formaterHeure(
                      creneau.fin
                    )}
                  </td>

                  {joursCycle.map(
                    (jour) =>
                      renderCellContent(
                        jour,
                        creneau
                      )
                  )}

                </tr>
              )
            )}

          </tbody>

        </table>
      </div>
    </div>
  );
}