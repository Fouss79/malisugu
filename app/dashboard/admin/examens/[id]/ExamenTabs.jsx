"use client";

import { useEffect, useMemo, useState } from "react";
  
import {
  epreuvesApi,
  coefficientsApi,
  creneauxApi,
  sallesApi,
  examenSallesApi,
  repartitionExamenApi,
  examensApi,
  compositionEpreuveApi,
  examenDocumentsApi
} from "../../../../../lib/examens";

/* ============================================================
   EXAM TABS
============================================================ */

export default function ExamenTabs({
  examenId,
  ecoleId,
  anneeScolaireId,
}) {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    {
      id: "general",
      label: "Vue générale",
    },
    {
      id: "epreuves",
      label: "Épreuves",
    },
    {
      id: "creneaux",
      label: "Créneaux",
    },
    {
      id: "salles",
      label: "Salles",
    },
    {
      id: "repartition",
      label: "Répartition",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ======================================================
          ONGLETS
      ====================================================== */}

      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================
          CONTENU
      ====================================================== */}

      {activeTab === "general" && (
        <VueGenerale examenId={examenId} />
      )}

      {activeTab === "epreuves" && (
        <Epreuves
          examenId={examenId}
          ecoleId={ecoleId}
          anneeScolaireId={anneeScolaireId}
        />
      )}

      {activeTab === "creneaux" && (
        <Creneaux examenId={examenId} />
      )}

      {activeTab === "salles" && (
        <SallesExamen
          examenId={examenId}
          ecoleId={ecoleId}
        />
      )}

      {activeTab === "repartition" && (
        <Repartition examenId={examenId} />
      )}
    </div>
  );
}

/* ============================================================
   VUE GÉNÉRALE
============================================================ */

function VueGenerale({ examenId }) {
  const [examen, setExamen] = useState(null);
  const [epreuves, setEpreuves] = useState([]);
  const [creneaux, setCreneaux] = useState([]);
  const [salles, setSalles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const charger = async () => {
    if (!examenId) return;

    try {
      setLoading(true);
      setError("");

      const [
        examenData,
        epreuvesData,
        creneauxData,
        sallesData,
      ] = await Promise.all([
        examensApi.get(examenId),
        epreuvesApi.listByExamen(examenId),
        creneauxApi.listByExamen(examenId),
        examenSallesApi.list(examenId),
      ]);

      setExamen(examenData);

      setEpreuves(
        Array.isArray(epreuvesData)
          ? epreuvesData
          : []
      );

      setCreneaux(
        Array.isArray(creneauxData)
          ? creneauxData
          : []
      );

      setSalles(
        Array.isArray(sallesData)
          ? sallesData
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de charger les informations de l'examen."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, [examenId]);

  const epreuvesAvecCreneau = epreuves.filter(
    (item) => item.creneauId
  ).length;

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
        Chargement de l'examen...
      </div>
    );
  }

  if (error) {
    return (
      <Message type="error">
        {error}
      </Message>
    );
  }

  if (!examen) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
        Examen introuvable.
      </div>
    );
  }

  const classes = Array.isArray(examen.classes)
    ? examen.classes
    : [];

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">
                {examen.nom || "Examen"}
              </h2>

              <StatutBadge statut={examen.statut} />
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Gestion et préparation de cet examen.
            </p>
          </div>

          <div className="text-sm text-gray-500 lg:text-right">
            <p>
              ID :{" "}
              <span className="font-medium text-gray-900">
                #{examen.id}
              </span>
            </p>

            {examen.dateDebut && (
              <p className="mt-1">
                Du{" "}
                <span className="font-medium text-gray-900">
                  {examen.dateDebut}
                </span>
              </p>
            )}

            {examen.dateFin && (
              <p>
                Au{" "}
                <span className="font-medium text-gray-900">
                  {examen.dateFin}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* STATISTIQUES */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Classes"
          value={classes.length}
          icon="🎓"
        />

        <StatCard
          label="Épreuves"
          value={epreuves.length}
          icon="📝"
        />

        <StatCard
          label="Créneaux"
          value={creneaux.length}
          icon="🕐"
        />

        <StatCard
          label="Salles examen"
          value={salles.length}
          icon="🏫"
        />
      </div>

      {/* PROGRESSION */}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div>
          <h3 className="font-semibold text-gray-900">
            Préparation de l'examen
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Vérifiez les éléments nécessaires avant la répartition.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <ProgressRow
            label="Épreuves créées"
            value={epreuves.length}
            total={epreuves.length}
            complete={epreuves.length > 0}
          />

          <ProgressRow
            label="Épreuves avec créneau"
            value={epreuvesAvecCreneau}
            total={epreuves.length}
            complete={
              epreuves.length > 0 &&
              epreuvesAvecCreneau === epreuves.length
            }
          />

          <ProgressRow
            label="Créneaux configurés"
            value={creneaux.length}
            total={epreuves.length}
            complete={
              epreuves.length > 0 &&
              creneaux.length > 0
            }
          />

          <ProgressRow
            label="Salles d'examen"
            value={salles.length}
            total={1}
            complete={salles.length > 0}
          />
        </div>
      </div>

      {/* CLASSES */}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900">
          Classes concernées
        </h3>

        {classes.length === 0 ? (
          <p className="text-sm text-gray-500 mt-4">
            Aucune classe associée à cet examen.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-4">
            {classes.map((classe) => (
              <span
                key={classe.id}
                className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm"
              >
                {classe.nom || `Classe #${classe.id}`}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ÉPREUVES
============================================================ */

function Epreuves({
  examenId,
  ecoleId,
  anneeScolaireId,
}) {
  const [epreuves, setEpreuves] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [examen, setExamen] = useState(null);
  const [creneaux, setCreneaux] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingProgrammes, setLoadingProgrammes] =
    useState(false);
  const [loadingCreneaux, setLoadingCreneaux] =
    useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showCreneauModal, setShowCreneauModal] =
    useState(false);

  const [selectedProgrammeId, setSelectedProgrammeId] =
    useState("");

  const [dureeMinutes, setDureeMinutes] =
    useState(120);

  const [editingEpreuve, setEditingEpreuve] =
    useState(null);

  const [selectedCreneauId, setSelectedCreneauId] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [savingCreneau, setSavingCreneau] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ----------------------------------------------------------
     CHARGEMENT ÉPREUVES
  ---------------------------------------------------------- */

  const chargerEpreuves = async () => {
    if (!examenId) return;

    try {
      setLoading(true);
      setError("");

      const data =
        await epreuvesApi.listByExamen(examenId);

      setEpreuves(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de charger les épreuves."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------------
     PROGRAMMES
  ---------------------------------------------------------- */

  const chargerProgrammes = async () => {
    if (
      !examenId ||
      !ecoleId ||
      !anneeScolaireId
    ) {
      return;
    }

    try {
      setLoadingProgrammes(true);
      setError("");

      const examenData =
        await examensApi.get(examenId);

      setExamen(examenData);

      const classes =
        Array.isArray(examenData?.classes)
          ? examenData.classes
          : [];

      if (classes.length === 0) {
        setProgrammes([]);
        return;
      }

      const niveauxSeries = [];

      classes.forEach((classe) => {
        if (!classe?.niveauId) return;

        const niveauId =
          Number(classe.niveauId);

        const serieId =
          classe.serieId != null
            ? Number(classe.serieId)
            : null;

        const existe =
          niveauxSeries.some(
            (item) =>
              item.niveauId === niveauId &&
              item.serieId === serieId
          );

        if (!existe) {
          niveauxSeries.push({
            niveauId,
            serieId,
          });
        }
      });

      const resultats =
        await Promise.all(
          niveauxSeries.map(
            ({ niveauId, serieId }) =>
              coefficientsApi.listPourNiveauEtSerie(
                ecoleId,
                anneeScolaireId,
                niveauId,
                serieId
              )
          )
        );

      const tous = resultats.flat();

      const uniques =
        Array.from(
          new Map(
            tous.map((programme) => [
              programme.id,
              programme,
            ])
          ).values()
        );

      setProgrammes(uniques);
    } catch (err) {
      console.error(err);

      setProgrammes([]);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de charger les programmes."
      );
    } finally {
      setLoadingProgrammes(false);
    }
  };

  /* ----------------------------------------------------------
     CRÉNEAUX
  ---------------------------------------------------------- */

  const chargerCreneaux = async () => {
    if (!examenId) return;

    try {
      setLoadingCreneaux(true);

      const data =
        await creneauxApi.listByExamen(
          examenId
        );

      setCreneaux(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de charger les créneaux."
      );
    } finally {
      setLoadingCreneaux(false);
    }
  };

  useEffect(() => {
    if (!examenId) return;

    chargerEpreuves();
    chargerCreneaux();
  }, [examenId]);

  useEffect(() => {
    if (
      !examenId ||
      !ecoleId ||
      !anneeScolaireId
    ) {
      return;
    }

    chargerProgrammes();
  }, [
    examenId,
    ecoleId,
    anneeScolaireId,
  ]);

  /* ----------------------------------------------------------
     AFFECTATION CRÉNEAU
  ---------------------------------------------------------- */

  const ouvrirAffectationCreneau = (
    epreuve
  ) => {
    setEditingEpreuve(epreuve);

    setSelectedCreneauId(
      epreuve.creneauId
        ? String(epreuve.creneauId)
        : ""
    );

    setError("");
    setSuccess("");
    setShowCreneauModal(true);
  };

  const affecterCreneau = async () => {
    if (!editingEpreuve) return;

    try {
      setSavingCreneau(true);
      setError("");
      setSuccess("");

      await epreuvesApi.update(
        editingEpreuve.id,
        {
          examenId: Number(examenId),
          coefficientMatiereId:
            editingEpreuve.coefficientMatiereId,
          creneauId: selectedCreneauId
            ? Number(selectedCreneauId)
            : null,
          dureeMinutes:
            editingEpreuve.dureeMinutes,
        }
      );

      setShowCreneauModal(false);
      setEditingEpreuve(null);

      await chargerEpreuves();

      setSuccess(
        "Le créneau a été affecté avec succès."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible d'affecter le créneau."
      );
    } finally {
      setSavingCreneau(false);
    }
  };

  /* ----------------------------------------------------------
     AJOUT ÉPREUVE
  ---------------------------------------------------------- */

  const ouvrirAjout = () => {
    setSelectedProgrammeId("");
    setDureeMinutes(120);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const ajouterEpreuve = async () => {
    if (!selectedProgrammeId) {
      setError(
        "Veuillez sélectionner une matière."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await epreuvesApi.add({
        examenId: Number(examenId),
        coefficientMatiereId:
          Number(selectedProgrammeId),
        dureeMinutes:
          Number(dureeMinutes),
      });

      setShowModal(false);

      await chargerEpreuves();

      setSuccess(
        "L'épreuve a été créée avec succès."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de créer l'épreuve."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------------------------------------------
     SUPPRESSION
  ---------------------------------------------------------- */

  const supprimerEpreuve = async (
    epreuve
  ) => {
    const confirmation =
      window.confirm(
        `Voulez-vous supprimer l'épreuve ${
          epreuve.matiereNom || ""
        } ?`
      );

    if (!confirmation) return;

    try {
      setError("");
      setSuccess("");

      await epreuvesApi.remove(
        epreuve.id
      );

      await chargerEpreuves();

      setSuccess(
        "Épreuve supprimée."
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de supprimer l'épreuve."
      );
    }
  };

  const epreuveExiste = (
    programmeId
  ) =>
    epreuves.some(
      (epreuve) =>
        Number(
          epreuve.coefficientMatiereId
        ) === Number(programmeId)
    );

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Épreuves
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Définissez les matières qui seront évaluées pendant cet examen.
          </p>
        </div>

        <button
          type="button"
          onClick={ouvrirAjout}
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          + Ajouter une épreuve
        </button>
      </div>

      {/* MESSAGES */}

      {error && (
        <Message type="error">
          {error}
        </Message>
      )}

      {success && (
        <Message type="success">
          {success}
        </Message>
      )}

      {/* TABLE */}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Chargement des épreuves...
          </div>
        ) : epreuves.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">
              📝
            </div>

            <h3 className="font-semibold text-gray-900">
              Aucune épreuve
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Commencez par ajouter les matières de l'examen.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3">
                    Matière
                  </th>

                  <th className="text-left px-5 py-3">
                    Niveau
                  </th>

                  <th className="text-left px-5 py-3">
                    Série
                  </th>

                  <th className="text-left px-5 py-3">
                    Coef.
                  </th>

                  <th className="text-left px-5 py-3">
                    Créneau
                  </th>

                  <th className="text-left px-5 py-3">
                    Durée
                  </th>

                  <th className="text-right px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {epreuves.map(
                  (epreuve) => (
                    <tr
                      key={epreuve.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {epreuve.matiereNom ||
                          "-"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {epreuve.niveauNom ||
                          "-"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {epreuve.serieNom ||
                          "-"}
                      </td>

                      <td className="px-5 py-4">
                        {epreuve.coefficient ??
                          "-"}
                      </td>

                      <td className="px-5 py-4">
                        {epreuve.creneauId ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                            {epreuve.creneauDate
                              ? `${epreuve.creneauDate} ${
                                  epreuve.creneauHeureDebut ||
                                  ""
                                }`
                              : "Affecté"}
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                            Non affecté
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {epreuve.dureeMinutes ||
                          0}{" "}
                        min
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              ouvrirAffectationCreneau(
                                epreuve
                              )
                            }
                            className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs hover:bg-gray-50"
                          >
                            {epreuve.creneauId
                              ? "Créneau"
                              : "Affecter"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              supprimerEpreuve(
                                epreuve
                              )
                            }
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================
          MODAL AJOUT
      ====================================================== */}

      {showModal && (
        <Modal
          title="Ajouter une épreuve"
          onClose={() =>
            !saving &&
            setShowModal(false)
          }
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programme / matière
              </label>

              <select
                value={selectedProgrammeId}
                onChange={(e) =>
                  setSelectedProgrammeId(
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5"
              >
                <option value="">
                  {loadingProgrammes
                    ? "Chargement..."
                    : "Sélectionner une matière"}
                </option>

                {programmes
                  .filter(
                    (programme) =>
                      !epreuveExiste(
                        programme.id
                      )
                  )
                  .map((programme) => (
                    <option
                      key={programme.id}
                      value={programme.id}
                    >
                      {programme.matiereNom ||
                        programme.matiere?.nom ||
                        "Matière"}
                      {" — "}
                      {programme.niveauNom ||
                        programme.niveau?.nom ||
                        "Niveau"}
                      {(
                        programme.serieNom ||
                        programme.serie?.nom
                      )
                        ? ` ${
                            programme.serieNom ||
                            programme.serie?.nom
                          }`
                        : ""}
                      {" — coef. "}
                      {programme.coefficient ??
                        "-"}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée
              </label>

              <select
                value={dureeMinutes}
                onChange={(e) =>
                  setDureeMinutes(
                    Number(e.target.value)
                  )
                }
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5"
              >
                <option value={60}>
                  1 heure
                </option>

                <option value={90}>
                  1 h 30
                </option>

                <option value={120}>
                  2 heures
                </option>

                <option value={150}>
                  2 h 30
                </option>

                <option value={180}>
                  3 heures
                </option>

                <option value={240}>
                  4 heures
                </option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-gray-300"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={ajouterEpreuve}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : "Ajouter"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================
          MODAL CRÉNEAU
      ====================================================== */}

      {showCreneauModal &&
        editingEpreuve && (
          <Modal
            title="Affecter un créneau"
            onClose={() =>
              !savingCreneau &&
              setShowCreneauModal(false)
            }
          >
            <div className="space-y-5">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Épreuve
                </p>

                <p className="font-semibold text-gray-900">
                  {editingEpreuve.matiereNom ||
                    "Épreuve"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Créneau
                </label>

                <select
                  value={selectedCreneauId}
                  onChange={(e) =>
                    setSelectedCreneauId(
                      e.target.value
                    )
                  }
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5"
                >
                  <option value="">
                    Aucun créneau
                  </option>

                  {creneaux.map(
                    (creneau) => (
                      <option
                        key={creneau.id}
                        value={creneau.id}
                      >
                        {creneau.date} —{" "}
                        {
                          creneau.heureDebut
                        }{" "}
                        à{" "}
                        {creneau.heureFin}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreneauModal(
                      false
                    )
                  }
                  disabled={savingCreneau}
                  className="px-4 py-2 rounded-xl border border-gray-300"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  disabled={savingCreneau}
                  onClick={affecterCreneau}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
                >
                  {savingCreneau
                    ? "Enregistrement..."
                    : "Enregistrer"}
                </button>
              </div>
            </div>
          </Modal>
        )}
    </div>
  );
}

/* ============================================================
   CRÉNEAUX
============================================================ */

function Creneaux({ examenId }) {
  const [creneaux, setCreneaux] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [date, setDate] =
    useState("");

  const [heureDebut, setHeureDebut] =
    useState("");

  const [heureFin, setHeureFin] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const charger = async () => {
    if (!examenId) return;

    try {
      setLoading(true);
      setError("");

      const data =
        await creneauxApi.listByExamen(
          examenId
        );

      setCreneaux(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de charger les créneaux."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, [examenId]);

  const ouvrirAjout = () => {
    setDate("");
    setHeureDebut("");
    setHeureFin("");
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const ajouterCreneau = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!date) {
      setError(
        "Veuillez sélectionner une date."
      );
      return;
    }

    if (!heureDebut || !heureFin) {
      setError(
        "Veuillez renseigner les heures."
      );
      return;
    }

    if (heureDebut >= heureFin) {
      setError(
        "L'heure de fin doit être supérieure à l'heure de début."
      );
      return;
    }

    try {
      setSaving(true);

      await creneauxApi.create({
        examenId: Number(examenId),
        date,
        heureDebut,
        heureFin,
      });

      await charger();

      setSuccess(
        "Créneau ajouté avec succès."
      );

      setDate("");
      setHeureDebut("");
      setHeureFin("");

      setTimeout(() => {
        setShowModal(false);
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible d'ajouter le créneau."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Créneaux
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Créez les horaires disponibles pour les épreuves.
          </p>
        </div>

        <button
          type="button"
          onClick={ouvrirAjout}
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          + Ajouter un créneau
        </button>
      </div>

      {error && (
        <Message type="error">
          {error}
        </Message>
      )}

      {success && (
        <Message type="success">
          {success}
        </Message>
      )}

      {/* LISTE */}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Chargement...
          </div>
        ) : creneaux.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">
              🕐
            </div>

            <p className="font-medium text-gray-700">
              Aucun créneau enregistré.
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Commencez par créer un créneau pour cet examen.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {creneaux.map(
              (creneau) => (
                <div
                  key={creneau.id}
                  className="p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {creneau.date}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {creneau.heureDebut} —{" "}
                      {creneau.heureFin}
                    </p>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                    Créneau
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* MODAL */}

      {showModal && (
        <Modal
          title="Ajouter un créneau"
          onClose={() =>
            !saving &&
            setShowModal(false)
          }
        >
          <form
            onSubmit={ajouterCreneau}
            className="space-y-5"
          >
            {error && (
              <Message type="error">
                {error}
              </Message>
            )}

            {success && (
              <Message type="success">
                {success}
              </Message>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de début
                </label>

                <input
                  type="time"
                  value={heureDebut}
                  onChange={(e) =>
                    setHeureDebut(
                      e.target.value
                    )
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de fin
                </label>

                <input
                  type="time"
                  value={heureFin}
                  onChange={(e) =>
                    setHeureFin(
                      e.target.value
                    )
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-gray-300"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : "Ajouter"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   SALLES DE L'EXAMEN
============================================================ */

function SallesExamen({
  examenId,
  ecoleId,
}) {
  const [sallesEcole, setSallesEcole] =
    useState([]);

  const [sallesExamen, setSallesExamen] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const charger = async () => {
    if (!examenId || !ecoleId) return;

    try {
      setLoading(true);
      setError("");

      const [
        toutesLesSalles,
        sallesDeExamen,
      ] = await Promise.all([
        sallesApi.listByEcole(ecoleId),
        examenSallesApi.list(examenId),
      ]);

      setSallesEcole(
        Array.isArray(toutesLesSalles)
          ? toutesLesSalles
          : []
      );

      setSallesExamen(
        Array.isArray(sallesDeExamen)
          ? sallesDeExamen
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de charger les salles de l'examen."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, [examenId, ecoleId]);

  const affecteesIds = useMemo(
    () =>
      new Set(
        sallesExamen.map(
          (item) =>
            Number(item.salleId)
        )
      ),
    [sallesExamen]
  );

  const sallesActives =
    sallesEcole.filter(
      (salle) =>
        salle.active !== false
    );

  const capaciteTotale =
    sallesExamen.reduce(
      (total, salle) =>
        total +
        Number(
          salle.capacite || 0
        ),
      0
    );

  const affecter = async (salle) => {
    if (
      affecteesIds.has(
        Number(salle.id)
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data =
        await examenSallesApi.affecter(
          examenId,
          salle.id
        );

      setSallesExamen(
        (prev) => [
          ...prev,
          data,
        ]
      );

      setSuccess(
        `La salle ${salle.nom} a été ajoutée à l'examen.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible d'affecter la salle."
      );
    } finally {
      setSaving(false);
    }
  };

  const retirer = async (salle) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await examenSallesApi.retirer(
        examenId,
        salle.salleId
      );

      setSallesExamen(
        (prev) =>
          prev.filter(
            (item) =>
              Number(
                item.salleId
              ) !==
              Number(
                salle.salleId
              )
          )
      );

      setSuccess(
        `La salle ${salle.salleNom} a été retirée de l'examen.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de retirer la salle."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Salles de l'examen
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Sélectionnez les salles qui seront disponibles pour l'ensemble de cet examen.
        </p>
      </div>

      {error && (
        <Message type="error">
          {error}
        </Message>
      )}

      {success && (
        <Message type="success">
          {success}
        </Message>
      )}

      {/* RÉSUMÉ */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Salles sélectionnées"
          value={sallesExamen.length}
          icon="🏫"
        />

        <StatCard
          label="Capacité totale"
          value={capaciteTotale}
          suffix="places"
          icon="💺"
        />

        <StatCard
          label="Salles actives"
          value={sallesActives.length}
          icon="✓"
        />
      </div>

      {/* LISTE */}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Chargement des salles...
          </div>
        ) : sallesActives.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3">
              🏫
            </div>

            <p className="font-semibold text-gray-900">
              Aucune salle active
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Activez d'abord des salles dans la gestion de l'école.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {sallesActives.map(
              (salle) => {
                const affectee =
                  affecteesIds.has(
                    Number(
                      salle.id
                    )
                  );

                return (
                  <div
                    key={salle.id}
                    className={`p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                      affectee
                        ? "bg-blue-50/50"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {salle.nom}
                        </p>

                        {affectee && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                            Sélectionnée
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 mt-1">
                        Capacité :{" "}
                        {salle.capacite ??
                          0}{" "}
                        places
                      </p>
                    </div>

                    {affectee ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          const item =
                            sallesExamen.find(
                              (x) =>
                                Number(
                                  x.salleId
                                ) ===
                                Number(
                                  salle.id
                                )
                            );

                          if (item) {
                            retirer(item);
                          }
                        }}
                        className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50"
                      >
                        Retirer
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          affecter(salle)
                        }
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Affecter à l'examen
                      </button>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* CAPACITÉ */}

      {sallesExamen.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="font-semibold text-blue-900">
            Capacité disponible pour l'examen
          </p>

          <p className="text-sm text-blue-700 mt-1">
            {sallesExamen.length} salle
            {sallesExamen.length > 1
              ? "s"
              : ""}{" "}
            sélectionnée
            {sallesExamen.length > 1
              ? "s"
              : ""}{" "}
            pour une capacité totale de{" "}
            <strong>
              {capaciteTotale} places
            </strong>.
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   RÉPARTITION
============================================================ */

function Repartition({ examenId }) {
  const [epreuves, setEpreuves] =
    useState([]);

  const [
    selectedEpreuveId,
    setSelectedEpreuveId,
  ] = useState("");

  /*
   * Élèves concernés par TOUT l'examen.
   * La génération de la répartition se fait au niveau examen.
   */
  const [elevesExamen, setElevesExamen] =
    useState([]);

  /*
   * Répartition complète de l'examen.
   */
  const [repartitionComplete, setRepartitionComplete] =
    useState([]);

  /*
   * Répartition filtrée pour l'épreuve sélectionnée.
   */
  const [repartitionAffichee, setRepartitionAffichee] =
    useState([]);

  const [
    sallesAffectees,
    setSallesAffectees,
  ] = useState([]);

  const [
    loadingEpreuves,
    setLoadingEpreuves,
  ] = useState(true);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
   * Statuts de composition (présence à l'épreuve)
   * indexés par inscriptionId, pour l'épreuve sélectionnée.
   */
  const [statutsComposition, setStatutsComposition] =
    useState({});

  const [loadingComposition, setLoadingComposition] =
    useState(false);
    const [generatingPdf, setGeneratingPdf] = useState("");

  /* ----------------------------------------------------------
     ÉPREUVES
  ---------------------------------------------------------- */

  const chargerEpreuves = async () => {
    if (!examenId) return;

    try {
      setLoadingEpreuves(true);
      setError("");

      const data =
        await epreuvesApi.listByExamen(
          examenId
        );

      const liste =
        Array.isArray(data)
          ? data
          : [];

      setEpreuves(liste);

      if (liste.length > 0) {
        setSelectedEpreuveId(
          String(liste[0].id)
        );
      } else {
        setSelectedEpreuveId("");
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de charger les épreuves."
      );
    } finally {
      setLoadingEpreuves(false);
    }
  };

  /* ----------------------------------------------------------
     DONNÉES RÉPARTITION
  ---------------------------------------------------------- */

const chargerDonnees = async () => {
  if (!examenId) return;

  try {
    setLoading(true);
    setError("");

    const id = Number(examenId);

    console.log("🔎 Chargement répartition examen :", id);

    let elevesData = [];
    let repartitionData = [];
    let sallesData = [];

    try {
      elevesData = await repartitionExamenApi.getEleves(id);
      console.log("✅ Élèves :", elevesData);
    } catch (err) {
      console.error(
        "❌ getEleves()",
        err.response?.status,
        err.response?.data,
        err.config?.url
      );
      throw err;
    }

    try {
      repartitionData = await repartitionExamenApi.getRepartition(id);
      console.log("✅ Répartition :", repartitionData);
    } catch (err) {
      console.error(
        "❌ getRepartition()",
        err.response?.status,
        err.response?.data,
        err.config?.url
      );
      throw err;
    }

    try {
      sallesData = await examenSallesApi.list(id);
      console.log("✅ Salles :", sallesData);
    } catch (err) {
      console.error(
        "❌ examenSallesApi.list()",
        err.response?.status,
        err.response?.data,
        err.config?.url
      );
      throw err;
    }

    setElevesExamen(
  Array.isArray(elevesData) ? elevesData : []
);

setRepartitionComplete(
  Array.isArray(repartitionData)
    ? repartitionData
    : []
);

setSallesAffectees(
  Array.isArray(sallesData)
    ? sallesData
    : []
);
  } catch (err) {
    console.error("❌ Erreur chargement répartition :", err);

    setError(
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Impossible de charger les données de répartition."
    );
  } finally {
    setLoading(false);
  }
};

  /* ----------------------------------------------------------
     COMPOSITIONS (présence à l'épreuve sélectionnée)
  ---------------------------------------------------------- */

  const chargerCompositions = async () => {
    if (!selectedEpreuveId) {
      setStatutsComposition({});
      return;
    }

    try {
      setLoadingComposition(true);

      const data = await compositionEpreuveApi.list(
        Number(selectedEpreuveId)
      );

      const map = {};

      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (item.inscriptionId != null) {
            map[item.inscriptionId] =
              item.statut || "NON_CONFIRME";
          }
        });
      }

      setStatutsComposition(map);
    } catch (error) {
      console.error(
        "Erreur chargement compositions :",
        error
      );
    } finally {
      setLoadingComposition(false);
    }
  };

  const modifierStatutComposition = async (
    inscriptionId,
    statut
  ) => {
    if (!selectedEpreuveId || !inscriptionId) return;

    try {
      setLoadingComposition(true);

      const result =
        await compositionEpreuveApi.modifierStatut(
          Number(selectedEpreuveId),
          Number(inscriptionId),
          statut
        );

      setStatutsComposition((prev) => ({
        ...prev,
        [inscriptionId]:
          result?.statut || statut,
      }));
    } catch (error) {
      console.error(
        "Erreur modification composition :",
        error
      );

      alert(
        error?.response?.data?.message ||
        "Impossible de modifier le statut."
      );
    } finally {
      setLoadingComposition(false);
    }
  };
  const telechargerPdf = (blob, nomFichier) => {
  const url = window.URL.createObjectURL(blob);

  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;

  document.body.appendChild(lien);
  lien.click();
  lien.remove();

  window.URL.revokeObjectURL(url);
};
const handleListesSallesPdf = async () => {
  try {
    setGeneratingPdf("salles");
    setError("");
    setSuccess("");

    const blob =
      await examenDocumentsApi.listesSalles(examenId);

    telechargerPdf(
      blob,
      `listes-salles-examen-${examenId}.pdf`
    );

    setSuccess("Les listes des salles ont été générées.");
  } catch (err) {
    console.error(err);
    setError(
      "Impossible de générer les listes des salles."
    );
  } finally {
    setGeneratingPdf("");
  }
};
const genererListesSallesPdf = () => {
  if (!examenId) return;

  const url = `${process.env.NEXT_PUBLIC_API_URL}/examens/${examenId}/documents/listes-salles.pdf`;

  window.open(url, "_blank", "noopener,noreferrer");
};

const genererFeuillePresencePdf = () => {
  if (!examenId || !selectedEpreuveId) return;

  const url =
    `${process.env.NEXT_PUBLIC_API_URL}` +
    `/examens/${examenId}/epreuves/${selectedEpreuveId}/documents/feuille-presence.pdf`;

  window.open(url, "_blank", "noopener,noreferrer");
};
const handleFeuillePresencePdf = async () => {
  if (!selectedEpreuveId) {
    setError("Veuillez sélectionner une épreuve.");
    return;
  }

  try {
    setGeneratingPdf("presence");
    setError("");
    setSuccess("");

    const blob =
      await examenDocumentsApi.feuillePresence(
        examenId,
        selectedEpreuveId
      );

    const nomEpreuve =
      epreuveSelectionnee?.coefficientMatiere?.matiere?.nom ||
      "epreuve";

    const nomFichier = `feuille-presence-${nomEpreuve
      .toLowerCase()
      .replace(/\s+/g, "-")}-examen-${examenId}.pdf`;

    telechargerPdf(blob, nomFichier);

    setSuccess(
      "La feuille de présence a été générée."
    );
  } catch (err) {
    console.error(err);
    setError(
      "Impossible de générer la feuille de présence."
    );
  } finally {
    setGeneratingPdf("");
  }
};

  useEffect(() => {
    chargerEpreuves();
  }, [examenId]);

  /*
   * Chargement principal de l'examen.
   */
  useEffect(() => {
    chargerDonnees();
  }, [examenId]);

  /*
   * Recharge les statuts de composition
   * à chaque changement d'épreuve sélectionnée.
   */
  useEffect(() => {
    chargerCompositions();
  }, [selectedEpreuveId]);

  /*
   * Lorsque l'utilisateur change d'épreuve,
   * on ne régénère PAS la répartition.
   * On filtre simplement l'affichage.
   */
  useEffect(() => {
    const chargerParEpreuve = async () => {
      if (!examenId) return;

      if (!selectedEpreuveId) {
        setRepartitionAffichee(
          repartitionComplete
        );
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await repartitionExamenApi.getParEpreuve(
            Number(examenId),
            Number(selectedEpreuveId)
          );

        setRepartitionAffichee(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(err);

        /*
         * Fallback sur la répartition complète.
         */
        setRepartitionAffichee(
          repartitionComplete
        );
      } finally {
        setLoading(false);
      }
    };

    /*
     * Évite de refaire une requête inutile
     * au premier chargement si aucune épreuve n'est encore définie.
     */
    if (
      selectedEpreuveId &&
      epreuves.length > 0
    ) {
      chargerParEpreuve();
    }
  }, [
    selectedEpreuveId,
    examenId,
  ]);

  const epreuveSelectionnee =
    useMemo(
      () =>
        epreuves.find(
          (epreuve) =>
            Number(epreuve.id) ===
            Number(
              selectedEpreuveId
            )
        ),
      [
        epreuves,
        selectedEpreuveId,
      ]
    );

  /* ----------------------------------------------------------
     STATISTIQUES EXAMEN
  ---------------------------------------------------------- */

  const capaciteTotale =
    sallesAffectees.reduce(
      (total, salle) =>
        total +
        Number(
          salle.capacite || 0
        ),
      0
    );

  /*
   * Ces statistiques sont volontairement basées
   * sur TOUT l'examen.
   */
  const nombreEleves =
    elevesExamen.length;

  const nombreAffectes =
    repartitionComplete.length;

  const nombreNonAffectes =
    Math.max(
      0,
      nombreEleves -
        nombreAffectes
    );

  const placesRestantes =
    Math.max(
      0,
      capaciteTotale -
        nombreAffectes
    );

  /* ----------------------------------------------------------
     GROUPES PAR SALLE
  ---------------------------------------------------------- */

  const repartitionParSalle = useMemo(() => {
  const groupes = sallesAffectees.map((salle) => ({
    salleId: salle.salleId,
    salleNom: salle.salleNom,
    capacite: Number(salle.capacite || 0),
    eleves: [],
  }));

  repartitionComplete.forEach((eleve) => {
    const groupe = groupes.find(
      (salle) => Number(salle.salleId) === Number(eleve.salleId)
    );

    if (groupe) {
      groupe.eleves.push(eleve);
    }
  });

  return groupes;
}, [sallesAffectees, repartitionComplete]);

  /* ----------------------------------------------------------
     GÉNÉRER LA RÉPARTITION DE L'EXAMEN
  ---------------------------------------------------------- */

  const lancerRepartition =
    async () => {
      if (nombreEleves === 0) {
        setError(
          "Aucun élève n'est concerné par cet examen."
        );
        return;
      }

      if (
        sallesAffectees.length ===
        0
      ) {
        setError(
          "Aucune salle n'est affectée à cet examen."
        );
        return;
      }

      if (
        capaciteTotale <
        nombreEleves
      ) {
        setError(
          `Capacité insuffisante : ${nombreEleves} élèves pour ${capaciteTotale} places.`
        );
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        /*
         * IMPORTANT :
         * La génération est maintenant faite
         * au niveau de l'EXAMEN.
         */
        await repartitionExamenApi.repartir(
          Number(examenId)
        );

        setSuccess(
          "La répartition des élèves de l'examen a été générée avec succès."
        );

        /*
         * Recharge toute la répartition.
         */
        await chargerDonnees();
      } catch (err) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            err?.response?.data ||
            err?.message ||
            "Impossible de générer la répartition."
        );
      } finally {
        setSaving(false);
      }
    };

  /* ----------------------------------------------------------
     SUPPRIMER
  ---------------------------------------------------------- */

  const supprimerRepartition =
    async () => {
      if (!examenId) return;

      const confirmation =
        window.confirm(
          "Voulez-vous vraiment supprimer la répartition actuelle de tout l'examen ?"
        );

      if (!confirmation) return;

      try {
        setDeleting(true);
        setError("");
        setSuccess("");

        /*
         * Suppression au niveau EXAMEN.
         */
        await repartitionExamenApi.supprimer(
          Number(examenId)
        );

        setRepartitionComplete([]);
        setRepartitionAffichee([]);

        await chargerDonnees();

        setSuccess(
          "La répartition de l'examen a été supprimée."
        );
      } catch (err) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            err?.response?.data ||
            err?.message ||
            "Impossible de supprimer la répartition."
        );
      } finally {
        setDeleting(false);
      }
    };

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Répartition des élèves
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Répartissez automatiquement les élèves dans les salles disponibles pour tout l'examen.
          </p>
        </div>

        <div className="w-full lg:w-96">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Afficher une épreuve
          </label>

          <select
            value={
              selectedEpreuveId
            }
            onChange={(e) =>
              setSelectedEpreuveId(
                e.target.value
              )
            }
            disabled={
              loadingEpreuves
            }
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 bg-white"
          >
            <option value="">
              {loadingEpreuves
                ? "Chargement..."
                : "Sélectionner une épreuve"}
            </option>

            {epreuves.map(
              (epreuve) => (
                <option
                  key={epreuve.id}
                  value={epreuve.id}
                >
                  {epreuve.matiereNom ||
                    "Épreuve"}
                  {epreuve.niveauNom
                    ? ` — ${epreuve.niveauNom}`
                    : ""}
                  {epreuve.serieNom
                    ? ` ${epreuve.serieNom}`
                    : ""}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {error && (
        <Message type="error">
          {error}
        </Message>
      )}

      {success && (
        <Message type="success">
          {success}
        </Message>
      )}

      {/* ======================================================
          PAS D'ÉPREUVES
      ====================================================== */}

      {epreuves.length === 0 &&
      !loadingEpreuves ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">
            📝
          </div>

          <h3 className="font-semibold text-gray-900">
            Aucune épreuve
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Créez d'abord les épreuves de cet examen.
          </p>
        </div>
      ) : (
        <>
          {/* ÉPREUVE SÉLECTIONNÉE */}

          {epreuveSelectionnee && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Affichage
                  </p>

                  <h3 className="text-lg font-bold text-gray-900 mt-1">
                    {epreuveSelectionnee.matiereNom ||
                      "Matière"}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {epreuveSelectionnee.niveauNom ||
                      "Niveau non défini"}

                    {epreuveSelectionnee.serieNom
                      ? ` • ${epreuveSelectionnee.serieNom}`
                      : ""}

                    {epreuveSelectionnee.coefficient
                      ? ` • Coefficient ${epreuveSelectionnee.coefficient}`
                      : ""}
                  </p>
                </div>

                <div className="text-sm text-gray-500">
                  {epreuveSelectionnee.creneauDate
                    ? `${epreuveSelectionnee.creneauDate} ${
                        epreuveSelectionnee.creneauHeureDebut ||
                        ""
                      }`
                    : "Créneau non défini"}
                </div>
              </div>
            </div>
          )}

          {/* INFORMATION */}

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <div className="text-xl">
                🏫
              </div>

              <div>
                <p className="font-semibold text-blue-900">
                  Répartition au niveau de l'examen
                </p>

                <p className="text-sm text-blue-700 mt-1">
                  Les salles sont communes à l'ensemble de
                  l'examen. La répartition est donc générée une
                  seule fois pour tous les élèves concernés.
                </p>

                {selectedEpreuveId && (
                  <p className="text-sm text-blue-700 mt-2">
                    L'épreuve sélectionnée sert uniquement à
                    filtrer l'affichage des élèves affectés,
                    et à afficher leur statut de composition.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* STATISTIQUES */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Élèves examen"
              value={nombreEleves}
              icon="👨‍🎓"
            />

            <StatCard
              label="Affectés"
              value={nombreAffectes}
              icon="✓"
            />

            <StatCard
              label="Non affectés"
              value={nombreNonAffectes}
              icon="⚠️"
            />

            <StatCard
              label="Salles examen"
              value={
                sallesAffectees.length
              }
              icon="🏫"
            />

            <StatCard
              label="Places restantes"
              value={
                placesRestantes
              }
              icon="💺"
            />
          </div>
          <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
  <div className="mb-4">
    <h2 className="text-lg font-semibold text-gray-900">
      Documents d'examen
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Générez les documents nécessaires pour l'organisation
      et le suivi des épreuves.
    </p>
  </div>

  <div className="flex flex-wrap gap-3">

    {/* LISTES DES SALLES */}
    <button
      type="button"
      onClick={handleListesSallesPdf}
      disabled={
        generatingPdf === "salles" ||
        repartitionComplete.length === 0
      }
      className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {generatingPdf === "salles" ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Génération...
        </>
      ) : (
        <>
          🖨️
          Listes des salles
        </>
      )}
    </button>

    {/* FEUILLE DE PRÉSENCE */}
    <button
      type="button"
      onClick={handleFeuillePresencePdf}
      disabled={
        generatingPdf === "presence" ||
        !selectedEpreuveId ||
        repartitionComplete.length === 0
      }
      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {generatingPdf === "presence" ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
          Génération...
        </>
      ) : (
        <>
          📋
          Feuille de présence
        </>
      )}
    </button>
  </div>

  {/* ÉPREUVE SÉLECTIONNÉE */}
  {selectedEpreuveId && epreuveSelectionnee && (
    <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm">
      <span className="text-gray-500">
        Feuille de présence :
      </span>{" "}
      <span className="font-semibold text-gray-900">
        {epreuveSelectionnee?.coefficientMatiere?.matiere?.nom ||
          "Épreuve"}
      </span>
    </div>
  )}
</div>

          {/* CAPACITÉ */}

          <div
            className={`rounded-2xl border p-5 ${
              capaciteTotale >=
              nombreEleves
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <p
              className={`font-semibold ${
                capaciteTotale >=
                nombreEleves
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {capaciteTotale >=
              nombreEleves
                ? "Capacité suffisante"
                : "Capacité insuffisante"}
            </p>

            <p
              className={`text-sm mt-1 ${
                capaciteTotale >=
                nombreEleves
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {nombreEleves} élèves pour{" "}
              {capaciteTotale} places.
            </p>
          </div>

          {/* ACTIONS */}

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Répartition automatique
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  La génération concerne tous les élèves de
                  l'examen et toutes les salles sélectionnées.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {repartitionComplete.length >
                  0 && (
                  <button
                    type="button"
                    disabled={
                      deleting
                    }
                    onClick={
                      supprimerRepartition
                    }
                    className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting
                      ? "Suppression..."
                      : "Effacer"}
                  </button>
                )}

                <button
                  type="button"
                  disabled={
                    saving ||
                    loading ||
                    nombreEleves ===
                      0 ||
                    sallesAffectees.length ===
                      0 ||
                    capaciteTotale <
                      nombreEleves
                  }
                  onClick={
                    lancerRepartition
                  }
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Génération..."
                    : repartitionComplete.length >
                      0
                    ? "Regénérer"
                    : "Générer la répartition"}
                </button>
              </div>
            </div>
          </div>

    {/* CONTENU */}

{loading ? (
  <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
    Chargement de la répartition...
  </div>
) : repartitionComplete.length === 0 ? (
  <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
    <div className="text-4xl mb-3">
      🪑
    </div>

    <h3 className="font-semibold text-gray-900">
      Répartition non générée
    </h3>

    <p className="text-sm text-gray-500 mt-1">
      Configurez les salles de l'examen puis générez
      la répartition.
    </p>
  </div>
) : repartitionAffichee.length === 0 ? (
  <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
    <div className="text-4xl mb-3">
      🧑‍🎓
    </div>

    <h3 className="font-semibold text-gray-900">
      Aucun élève pour cette épreuve
    </h3>

    <p className="text-sm text-gray-500 mt-1">
      La répartition de l'examen existe, mais aucun
      élève n'est retourné pour l'épreuve sélectionnée.
    </p>
  </div>
) : (
  <div className="space-y-6">
    {repartitionParSalle.map((salle) => {
      const occupation =
        salle.capacite > 0
          ? Math.round(
              (salle.eleves.length / salle.capacite) * 100
            )
          : 0;

      return (
        <div
          key={salle.salleId}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
        >
          {/* ==================================================
              EN-TÊTE SALLE
          ================================================== */}

          <div className="px-5 py-4 bg-gray-50 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {salle.salleNom}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {salle.eleves.length} /{" "}
                  {salle.capacite} places occupées
                </p>
              </div>

              <span className="inline-flex w-fit px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {occupation}% occupée
              </span>
            </div>

            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{
                  width: `${Math.min(occupation, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* ==================================================
              TABLEAU DES ÉLÈVES
          ================================================== */}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-white text-left">
                  <th className="px-5 py-3 w-16 text-xs font-semibold text-gray-500 uppercase">
                    N°
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Élève
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Classe
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Matricule
                  </th>

                  {selectedEpreuveId && (
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Composition
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {salle.eleves.map(
                  (eleve, index) => {
                    const statutActuel =
                      statutsComposition[
                        eleve.inscriptionId
                      ] || "NON_CONFIRME";

                    return (
                      <tr
                        key={
                          eleve.id ||
                          `${eleve.inscriptionId}-${index}`
                        }
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* N° */}

                        <td className="px-5 py-3 font-medium text-gray-500">
                          {index + 1}
                        </td>

                        {/* ÉLÈVE */}

                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">
                            {eleve.eleveNom}{" "}
                            {eleve.elevePrenom}
                          </div>
                        </td>

                        {/* CLASSE */}

                        <td className="px-5 py-3 text-gray-600">
                          {eleve.classeNom || "-"}
                        </td>

                        {/* MATRICULE */}

                        <td className="px-5 py-3 text-gray-600 font-mono text-xs">
                          {eleve.matricule || "-"}
                        </td>

                        {/* COMPOSITION */}

                        {selectedEpreuveId && (
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">

                              <StatutCompositionBadge
                                statut={
                                  statutActuel
                                }
                              />

                              <select
                                value={
                                  statutActuel
                                }
                                disabled={
                                  loadingComposition
                                }
                                onChange={(e) =>
                                  modifierStatutComposition(
                                    eleve.inscriptionId,
                                    e.target.value
                                  )
                                }
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white disabled:opacity-50"
                              >
                                <option value="NON_CONFIRME">
                                  Non confirmé
                                </option>

                                <option value="A_COMPOSE">
                                  A composé
                                </option>

                                <option value="ABSENT">
                                  Absent
                                </option>
                              </select>

                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {/* ==================================================
              PIED DE SALLE
          ================================================== */}

          <div className="px-5 py-3 bg-gray-50 border-t text-sm text-gray-500">
            <span className="font-medium text-gray-700">
              {salle.eleves.length}
            </span>{" "}
            élève
            {salle.eleves.length > 1 ? "s" : ""} dans cette
            salle sur{" "}
            <span className="font-medium text-gray-700">
              {salle.capacite}
            </span>{" "}
            places.
          </div>
        </div>
      );
    })}
  </div>
)}
        </>
      )}
    </div>
  );
}

/* ============================================================
   COMPOSANTS UI
============================================================ */

function StatCard({
  label,
  value,
  suffix,
  icon,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl">
          {icon}
        </span>

        <span className="text-xs text-gray-400 text-right">
          {label}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900">
          {value}
        </p>

        {suffix && (
          <p className="text-xs text-gray-500 mt-1">
            {suffix}
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  complete,
}) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (value / total) * 100
          )
        )
      : complete
      ? 100
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-600">
          {label}
        </span>

        <span
          className={
            complete
              ? "text-green-600 font-medium"
              : "text-gray-500"
          }
        >
          {value}
          {total > 1
            ? ` / ${total}`
            : ""}
        </span>
      </div>

      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            complete
              ? "bg-green-500"
              : "bg-blue-500"
          }`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function StatutBadge({ statut }) {
  const config = {
    PLANIFIE: {
      label: "Planifié",
      className:
        "bg-blue-100 text-blue-700",
    },

    EN_COURS: {
      label: "En cours",
      className:
        "bg-yellow-100 text-yellow-700",
    },

    TERMINE: {
      label: "Terminé",
      className:
        "bg-green-100 text-green-700",
    },
  };

  const current =
    config[statut] || {
      label:
        statut || "Inconnu",
      className:
        "bg-gray-100 text-gray-600",
    };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${current.className}`}
    >
      {current.label}
    </span>
  );
}

/*
 * Badge de statut de composition (présence à une épreuve).
 */
function StatutCompositionBadge({ statut }) {
  switch (statut) {
    case "A_COMPOSE":
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          ✓ A composé
        </span>
      );

    case "ABSENT":
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
          ✕ Absent
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
          ○ Non confirmé
        </span>
      );
  }
}

function Message({
  type,
  children,
}) {
  const classes =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${classes}`}
    >
      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}