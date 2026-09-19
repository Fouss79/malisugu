"use client";

import { useEffect, useMemo, useState } from "react";

import {
  epreuvesApi,
  coefficientsApi,
  creneauxApi,
  sallesApi,
  epreuveSallesApi,
  repartitionEpreuvesApi,
  examensApi
} from "../../../../../lib/examens";

export default function ExamenTabs({
  examenId,
  ecoleId,
  anneeScolaireId,
}) {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "Vue générale" },
    { id: "epreuves", label: "Épreuves" },
    { id: "creneaux", label: "Créneaux" },
    { id: "salles", label: "Salles" },
    { id: "repartition", label: "Répartition" },
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
        <Salles ecoleId={ecoleId} />
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
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Vue générale
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Consultez ici les informations générales de l'examen.
      </p>

      <div className="mt-6 rounded-xl bg-gray-50 border border-gray-200 p-5">
        <p className="text-sm text-gray-500">
          Identifiant de l'examen
        </p>

        <p className="mt-1 font-semibold text-gray-900">
          #{examenId}
        </p>
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
const [loadingExamen, setLoadingExamen] = useState(false);
  const [creneaux, setCreneaux] = useState([]);
  const [salles, setSalles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingProgrammes, setLoadingProgrammes] = useState(false);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [loadingSalles, setLoadingSalles] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showCreneauModal, setShowCreneauModal] = useState(false);
  const [showSalleModal, setShowSalleModal] = useState(false);

  const [selectedProgrammeId, setSelectedProgrammeId] =
    useState("");

  const [dureeMinutes, setDureeMinutes] = useState(120);

  const [editingEpreuve, setEditingEpreuve] = useState(null);
  const [selectedCreneauId, setSelectedCreneauId] = useState("");

  const [editingEpreuveSalles, setEditingEpreuveSalles] =
    useState(null);

  const [sallesAffectees, setSallesAffectees] = useState([]);

  const [saving, setSaving] = useState(false);
  const [savingCreneau, setSavingCreneau] = useState(false);
  const [savingSalle, setSavingSalle] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ----------------------------------------------------------
     CHARGEMENT
  ---------------------------------------------------------- */

  const chargerEpreuves = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await epreuvesApi.listByExamen(examenId);

      setEpreuves(Array.isArray(data) ? data : []);
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

  const chargerProgrammes = async () => {
  if (!examenId || !ecoleId || !anneeScolaireId) return;

  try {
    setLoadingExamen(true);
    setLoadingProgrammes(true);
    setError("");

    // 1. Charger l'examen avec ses classes
    const examenData = await examensApi.get(examenId);

    setExamen(examenData);

    const classes = Array.isArray(examenData?.classes)
      ? examenData.classes
      : [];

    if (classes.length === 0) {
      setProgrammes([]);
      setError(
        "Aucune classe n'est associée à cet examen."
      );
      return;
    }

    // ----------------------------------------------------------
    // 2. Construire les couples UNIQUES : Niveau + Série
    // ----------------------------------------------------------

    const niveauxSeries = [];

    classes.forEach((classe) => {
      if (!classe?.niveauId) return;

      const niveauId = Number(classe.niveauId);

      const serieId =
        classe.serieId != null
          ? Number(classe.serieId)
          : null;

      const existe = niveauxSeries.some(
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

    if (niveauxSeries.length === 0) {
      setProgrammes([]);
      setError(
        "Impossible de déterminer les niveaux et séries de l'examen."
      );
      return;
    }

    // ----------------------------------------------------------
    // 3. Charger les programmes pour chaque Niveau + Série
    // ----------------------------------------------------------

    const resultats = await Promise.all(
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

    // ----------------------------------------------------------
    // 4. Fusionner les résultats
    // ----------------------------------------------------------

    const tousLesProgrammes = resultats.flat();

    // ----------------------------------------------------------
    // 5. Supprimer les doublons
    // ----------------------------------------------------------

    const programmesUniques = Array.from(
      new Map(
        tousLesProgrammes.map((programme) => [
          programme.id,
          programme,
        ])
      ).values()
    );

    setProgrammes(programmesUniques);
  } catch (err) {
    console.error(err);

    setProgrammes([]);

    setError(
      err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Impossible de charger les programmes de l'examen."
    );
  } finally {
    setLoadingExamen(false);
    setLoadingProgrammes(false);
  }
};
  const chargerCreneaux = async () => {
    if (!examenId) return;

    try {
      setLoadingCreneaux(true);

      const data =
        await creneauxApi.listByExamen(examenId);

      setCreneaux(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de charger les créneaux."
      );
    } finally {
      setLoadingCreneaux(false);
    }
  };

  const chargerSalles = async () => {
    if (!ecoleId) return;

    try {
      setLoadingSalles(true);

      const data =
        await sallesApi.listByEcole(ecoleId);

      setSalles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de charger les salles."
      );
    } finally {
      setLoadingSalles(false);
    }
  };

  useEffect(() => {
  if (!examenId) return;

  chargerEpreuves();
  chargerCreneaux();
}, [examenId]);

useEffect(() => {
  if (!examenId || !ecoleId || !anneeScolaireId) return;

  chargerProgrammes();
  chargerSalles();
}, [examenId, ecoleId, anneeScolaireId]);
  /* ----------------------------------------------------------
     CRÉNEAU
  ---------------------------------------------------------- */

  const ouvrirAffectationCreneau = (epreuve) => {
    setEditingEpreuve(epreuve);

    setSelectedCreneauId(
      epreuve.creneauId
        ? String(epreuve.creneauId)
        : ""
    );

    setShowCreneauModal(true);
    setError("");
    setSuccess("");
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
          examenId,
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
     SALLES D'UNE ÉPREUVE
  ---------------------------------------------------------- */

  const ouvrirAffectationSalles = async (epreuve) => {
    try {
      setEditingEpreuveSalles(epreuve);
      setShowSalleModal(true);
      setError("");
      setSuccess("");

      const data =
        await epreuveSallesApi.listByEpreuve(
          epreuve.id
        );

      setSallesAffectees(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de charger les salles de l'épreuve."
      );
    }
  };

  const affecterSalle = async (salle) => {
    if (!editingEpreuveSalles) return;

    const dejaAffectee = sallesAffectees.some(
      (item) =>
        Number(item.salleId) === Number(salle.id)
    );

    if (dejaAffectee) {
      return;
    }

    try {
      setSavingSalle(true);
      setError("");
      setSuccess("");

      const data =
        await epreuveSallesApi.affecter(
          editingEpreuveSalles.id,
          salle.id
        );

      setSallesAffectees((prev) => [
        ...prev,
        data,
      ]);

      setSuccess(
        `La salle ${salle.nom} a été affectée.`
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
      setSavingSalle(false);
    }
  };

  const retirerSalle = async (salleId) => {
    if (!editingEpreuveSalles) return;

    try {
      setSavingSalle(true);
      setError("");
      setSuccess("");

      await epreuveSallesApi.retirer(
        editingEpreuveSalles.id,
        salleId
      );

      setSallesAffectees((prev) =>
        prev.filter(
          (item) =>
            Number(item.salleId) !== Number(salleId)
        )
      );

      setSuccess("La salle a été retirée.");
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de retirer la salle."
      );
    } finally {
      setSavingSalle(false);
    }
  };

  /* ----------------------------------------------------------
     AJOUT ÉPREUVE
  ---------------------------------------------------------- */

  const ouvrirAjout = () => {
    setSelectedProgrammeId("");
    setDureeMinutes(120);
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const ajouterEpreuve = async () => {
    if (!selectedProgrammeId) {
      setError(
        "Veuillez sélectionner un programme."
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
        dureeMinutes: Number(dureeMinutes),
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

  const supprimerEpreuve = async (epreuve) => {
    const confirmation = window.confirm(
      `Voulez-vous supprimer l'épreuve ${
        epreuve.matiereNom || ""
      } ?`
    );

    if (!confirmation) return;

    try {
      setError("");
      setSuccess("");

      await epreuvesApi.remove(epreuve.id);

      await chargerEpreuves();

      setSuccess("Épreuve supprimée.");
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

  const epreuveExiste = (programmeId) =>
    epreuves.some(
      (epreuve) =>
        Number(epreuve.coefficientMatiereId) ===
        Number(programmeId)
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
            Définissez les matières qui seront évaluées
            pendant cet examen.
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {typeof error === "string"
            ? error
            : "Une erreur est survenue."}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
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
              Commencez par ajouter les matières de
              l'examen.
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
                {epreuves.map((epreuve) => (
                  <tr
                    key={epreuve.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {epreuve.matiereNom || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {epreuve.niveauNom || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {epreuve.serieNom || "-"}
                    </td>

                    <td className="px-5 py-4">
                      {epreuve.coefficient ?? "-"}
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
                      {epreuve.dureeMinutes || 0} min
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
                            ? "Modifier créneau"
                            : "Créneau"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            ouvrirAffectationSalles(
                              epreuve
                            )
                          }
                          className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 text-xs hover:bg-blue-50"
                        >
                          Salles
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            supprimerEpreuve(epreuve)
                          }
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs hover:bg-red-50"
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
        )}
      </div>

      {/* MODAL AJOUT */}

      {showModal && (
        <Modal
          title="Ajouter une épreuve"
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programme / matière
              </label>

              <select
                value={selectedProgrammeId}
                onChange={(e) =>
                  setSelectedProgrammeId(e.target.value)
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
      !epreuveExiste(programme.id)
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
        ? ` ${programme.serieNom || programme.serie?.nom}`
        : ""}
      {" — coef. "}
      {programme.coefficient ?? "-"}
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

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={ajouterEpreuve}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : "Ajouter"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL CRÉNEAU */}

      {showCreneauModal && editingEpreuve && (
        <Modal
          title="Affecter un créneau"
          onClose={() =>
            setShowCreneauModal(false)
          }
        >
          <div className="space-y-5">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Épreuve
              </p>

              <p className="font-semibold text-gray-900">
                {editingEpreuve.matiereNom}
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

                {creneaux.map((creneau) => (
                  <option
                    key={creneau.id}
                    value={creneau.id}
                  >
                    {creneau.date} —{" "}
                    {creneau.heureDebut} à{" "}
                    {creneau.heureFin}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowCreneauModal(false)
                }
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

      {/* MODAL SALLES */}

      {showSalleModal &&
        editingEpreuveSalles && (
          <Modal
            title={`Salles — ${
              editingEpreuveSalles.matiereNom ||
              "Épreuve"
            }`}
            onClose={() =>
              setShowSalleModal(false)
            }
          >
            <div className="space-y-5">
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                <p className="text-sm text-blue-800">
                  Sélectionnez les salles qui pourront
                  accueillir les élèves de cette épreuve.
                </p>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {salles
                  .filter(
                    (salle) =>
                      salle.active !== false
                  )
                  .map((salle) => {
                    const affectee =
                      sallesAffectees.some(
                        (item) =>
                          Number(item.salleId) ===
                          Number(salle.id)
                      );

                    return (
                      <div
                        key={salle.id}
                        className={`flex items-center justify-between border rounded-xl p-3 ${
                          affectee
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {salle.nom}
                          </p>

                          <p className="text-xs text-gray-500">
                            Capacité :{" "}
                            {salle.capacite ?? 0} places
                          </p>
                        </div>

                        {affectee ? (
                          <button
                            type="button"
                            disabled={savingSalle}
                            onClick={() =>
                              retirerSalle(
                                salle.id
                              )
                            }
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs"
                          >
                            Retirer
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={savingSalle}
                            onClick={() =>
                              affecterSalle(
                                salle
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs"
                          >
                            Affecter
                          </button>
                        )}
                      </div>
                    );
                  })}

                {salles.filter(
                  (salle) => salle.active !== false
                ).length === 0 && (
                  <div className="text-center py-8 text-sm text-gray-500">
                    Aucune salle active disponible.
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Salles affectées
                  </span>

                  <span className="font-semibold">
                    {sallesAffectees.length}
                  </span>
                </div>

                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">
                    Capacité totale
                  </span>

                  <span className="font-semibold">
                    {sallesAffectees.reduce(
                      (total, salle) =>
                        total +
                        Number(
                          salle.capacite || 0
                        ),
                      0
                    )}{" "}
                    places
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowSalleModal(false)
                  }
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white"
                >
                  Fermer
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
  const [creneaux, setCreneaux] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [date, setDate] = useState("");
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const charger = async () => {
    try {
      setLoading(true);

      const data = await creneauxApi.listByExamen(examenId);

      setCreneaux(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les créneaux.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examenId) {
      charger();
    }
  }, [examenId]);

  const ouvrirAjout = () => {
    setDate("");
    setHeureDebut("");
    setHeureFin("");
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const fermerModal = () => {
    if (saving) return;

    setShowModal(false);
    setError("");
  };

  const ajouterCreneau = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!date) {
      setError("Veuillez sélectionner une date.");
      return;
    }

    if (!heureDebut || !heureFin) {
      setError("Veuillez renseigner les heures.");
      return;
    }

    if (heureDebut >= heureFin) {
      setError("L'heure de fin doit être supérieure à l'heure de début.");
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

      setSuccess("Créneau ajouté avec succès.");

      await charger();

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
          "Impossible d'ajouter le créneau."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* EN-TÊTE */}
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
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
        >
          + Ajouter un créneau
        </button>
      </div>

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

            <button
              type="button"
              onClick={ouvrirAjout}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              + Créer le premier créneau
            </button>

          </div>
        ) : (
          <div className="divide-y">

            {creneaux.map((creneau) => (
              <div
                key={creneau.id}
                className="p-5 flex items-center justify-between gap-4"
              >

                <div>
                  <p className="font-semibold text-gray-900">
                    {creneau.date}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {creneau.heureDebut} — {creneau.heureFin}
                  </p>
                </div>

                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  Créneau
                </span>

              </div>
            ))}

          </div>
        )}

      </div>

      {/* MODALE AJOUT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">

            {/* HEADER MODALE */}
            <div className="flex items-center justify-between px-6 py-5 border-b">

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Ajouter un créneau
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Définissez la date et les horaires.
                </p>
              </div>

              <button
                type="button"
                onClick={fermerModal}
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ×
              </button>

            </div>

            {/* FORMULAIRE */}
            <form
              onSubmit={ajouterCreneau}
              className="p-6 space-y-5"
            >

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
                  {success}
                </div>
              )}

              {/* DATE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* HEURES */}
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de début
                  </label>

                  <input
                    type="time"
                    value={heureDebut}
                    onChange={(e) => setHeureDebut(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
                    onChange={(e) => setHeureFin(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={fermerModal}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : "Ajouter"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
/* ============================================================
   SALLES
============================================================ */

function Salles({ ecoleId }) {
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const charger = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await sallesApi.listByEcole(ecoleId);

      setSalles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de charger les salles."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ecoleId) {
      charger();
    }
  }, [ecoleId]);

  const changerStatut = async (salle) => {
    try {
      setError("");

      const salleModifiee =
        await sallesApi.changerStatut(
          salle.id,
          !salle.active
        );

      setSalles((prev) =>
        prev.map((item) =>
          item.id === salleModifiee.id
            ? salleModifiee
            : item
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de modifier le statut de la salle."
      );
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Salles
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Gérez les salles disponibles pour les examens.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Chargement des salles...
          </div>
        ) : salles.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Aucune salle enregistrée.
          </div>
        ) : (
          <div className="divide-y">
            {salles.map((salle) => (
              <div
                key={salle.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {salle.nom}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Capacité :{" "}
                    {salle.capacite ?? 0} places
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs ${
                      salle.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {salle.active
                      ? "Active"
                      : "Inactive"}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      changerStatut(salle)
                    }
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                  >
                    {salle.active
                      ? "Désactiver"
                      : "Activer"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   RÉPARTITION
============================================================ */

function Repartition({ examenId }) {
  const [epreuves, setEpreuves] = useState([]);
  const [selectedEpreuveId, setSelectedEpreuveId] =
    useState("");

  const [eleves, setEleves] = useState([]);
  const [repartition, setRepartition] = useState([]);
  const [sallesAffectees, setSallesAffectees] =
    useState([]);

  const [loadingEpreuves, setLoadingEpreuves] =
    useState(true);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ----------------------------------------------------------
     CHARGER ÉPREUVES
  ---------------------------------------------------------- */

  const chargerEpreuves = async () => {
    try {
      setLoadingEpreuves(true);
      setError("");

      const data =
        await epreuvesApi.listByExamen(examenId);

      const liste =
        Array.isArray(data) ? data : [];

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
     CHARGER DONNÉES
  ---------------------------------------------------------- */

  const chargerDonnees = async (
    epreuveId = selectedEpreuveId
  ) => {
    if (!epreuveId) {
      setEleves([]);
      setRepartition([]);
      setSallesAffectees([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        elevesData,
        repartitionData,
        sallesData,
      ] = await Promise.all([
        repartitionEpreuvesApi.getEleves(
          Number(epreuveId)
        ),

        repartitionEpreuvesApi.getRepartition(
          Number(epreuveId)
        ),

        epreuveSallesApi.listByEpreuve(
          Number(epreuveId)
        ),
      ]);

      setEleves(
        Array.isArray(elevesData)
          ? elevesData
          : []
      );

      setRepartition(
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
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Impossible de charger les données."
      );

      setEleves([]);
      setRepartition([]);
      setSallesAffectees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!examenId) return;

    chargerEpreuves();
  }, [examenId]);

  useEffect(() => {
    if (!selectedEpreuveId) return;

    chargerDonnees(selectedEpreuveId);
  }, [selectedEpreuveId]);

  /* ----------------------------------------------------------
     ÉPREUVE SÉLECTIONNÉE
  ---------------------------------------------------------- */

  const epreuveSelectionnee = useMemo(
    () =>
      epreuves.find(
        (epreuve) =>
          Number(epreuve.id) ===
          Number(selectedEpreuveId)
      ),
    [epreuves, selectedEpreuveId]
  );

  /* ----------------------------------------------------------
     STATISTIQUES SALLES
  ---------------------------------------------------------- */

  const capaciteTotale = useMemo(
    () =>
      sallesAffectees.reduce(
        (total, salle) =>
          total +
          Number(salle.capacite || 0),
        0
      ),
    [sallesAffectees]
  );

  const nombreEleves = eleves.length;

  const nombreAffectes =
    repartition.length;

  const nombreNonAffectes = Math.max(
    0,
    nombreEleves - nombreAffectes
  );

  const placesRestantes = Math.max(
    0,
    capaciteTotale - nombreEleves
  );

  /* ----------------------------------------------------------
     GROUPEMENT PAR SALLE
  ---------------------------------------------------------- */

  const repartitionParSalle = useMemo(() => {
    const groupes = {};

    sallesAffectees.forEach((salle) => {
      groupes[salle.salleId] = {
        salleId: salle.salleId,
        salleNom:
          salle.salleNom ||
          `Salle ${salle.salleId}`,
        capacite:
          Number(salle.capacite || 0),
        eleves: [],
      };
    });

    repartition.forEach((item) => {
      if (!groupes[item.salleId]) {
        groupes[item.salleId] = {
          salleId: item.salleId,
          salleNom:
            item.salleNom ||
            `Salle ${item.salleId}`,
          capacite:
            Number(item.salleCapacite || 0),
          eleves: [],
        };
      }

      groupes[item.salleId].eleves.push(
        item
      );
    });

    return Object.values(groupes);
  }, [sallesAffectees, repartition]);

  /* ----------------------------------------------------------
     GÉNÉRER
  ---------------------------------------------------------- */

  const lancerRepartition = async () => {
    if (!selectedEpreuveId) {
      setError(
        "Veuillez sélectionner une épreuve."
      );
      return;
    }

    if (eleves.length === 0) {
      setError(
        "Aucun élève n'est concerné par cette épreuve."
      );
      return;
    }

    if (sallesAffectees.length === 0) {
      setError(
        "Aucune salle n'est affectée à cette épreuve."
      );
      return;
    }

    if (capaciteTotale < nombreEleves) {
      setError(
        `Capacité insuffisante : ${nombreEleves} élèves pour ${capaciteTotale} places.`
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await repartitionEpreuvesApi.repartir(
        Number(selectedEpreuveId)
      );

      setSuccess(
        "La répartition des élèves a été générée avec succès."
      );

      await chargerDonnees(
        selectedEpreuveId
      );
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

  const supprimerRepartition = async () => {
    if (!selectedEpreuveId) return;

    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer la répartition actuelle de cette épreuve ?"
    );

    if (!confirmation) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await repartitionEpreuvesApi.supprimer(
        Number(selectedEpreuveId)
      );

      setRepartition([]);

      setSuccess(
        "La répartition a été supprimée."
      );

      await chargerDonnees(
        selectedEpreuveId
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
            Répartissez automatiquement les élèves
            dans les salles affectées à chaque épreuve.
          </p>
        </div>

        <div className="w-full lg:w-96">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Épreuve
          </label>

          <select
            value={selectedEpreuveId}
            onChange={(e) =>
              setSelectedEpreuveId(
                e.target.value
              )
            }
            disabled={loadingEpreuves}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 bg-white"
          >
            <option value="">
              {loadingEpreuves
                ? "Chargement..."
                : "Sélectionner une épreuve"}
            </option>

            {epreuves.map((epreuve) => (
              <option
                key={epreuve.id}
                value={epreuve.id}
              >
                {epreuve.matiereNom ||
                  "Épreuve"}{" "}
                {epreuve.niveauNom
                  ? `— ${epreuve.niveauNom}`
                  : ""}
                {epreuve.serieNom
                  ? ` ${epreuve.serieNom}`
                  : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MESSAGES */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {typeof error === "string"
            ? error
            : "Une erreur est survenue."}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {!selectedEpreuveId ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">
            🧑‍🎓
          </div>

          <h3 className="font-semibold text-gray-900">
            Aucune épreuve sélectionnée
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Sélectionnez une épreuve pour préparer
            la répartition.
          </p>
        </div>
      ) : (
        <>
          {/* INFORMATIONS ÉPREUVE */}

          {epreuveSelectionnee && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Épreuve sélectionnée
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

          {/* STATISTIQUES */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Élèves concernés"
              value={nombreEleves}
              icon="👨‍🎓"
            />

            <StatCard
              label="Élèves affectés"
              value={nombreAffectes}
              icon="✓"
            />

            <StatCard
              label="Salles"
              value={sallesAffectees.length}
              icon="🏫"
            />

            <StatCard
              label="Capacité disponible"
              value={capaciteTotale}
              suffix="places"
              icon="💺"
            />
          </div>

          {/* CAPACITÉ */}

          <div
            className={`rounded-2xl border p-5 ${
              capaciteTotale >= nombreEleves
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p
                  className={`font-semibold ${
                    capaciteTotale >= nombreEleves
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

              {capaciteTotale >=
                nombreEleves && (
                <div className="text-sm text-green-700">
                  {placesRestantes} place
                  {placesRestantes > 1
                    ? "s"
                    : ""}{" "}
                  restante
                  {placesRestantes > 1
                    ? "s"
                    : ""}
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS */}

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Répartition automatique
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Les élèves seront affectés aux salles
                  dans l'ordre, selon la capacité de
                  chaque salle.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {repartition.length > 0 && (
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={
                      supprimerRepartition
                    }
                    className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting
                      ? "Suppression..."
                      : "Effacer la répartition"}
                  </button>
                )}

                <button
                  type="button"
                  disabled={
                    saving ||
                    loading ||
                    nombreEleves === 0 ||
                    sallesAffectees.length ===
                      0 ||
                    capaciteTotale <
                      nombreEleves
                  }
                  onClick={lancerRepartition}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Génération..."
                    : repartition.length > 0
                    ? "Regénérer la répartition"
                    : "Générer la répartition"}
                </button>
              </div>
            </div>
          </div>

          {/* CHARGEMENT */}

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
              Chargement de la répartition...
            </div>
          ) : (
            <>
              {/* AUCUNE RÉPARTITION */}

              {repartition.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-3">
                    🪑
                  </div>

                  <h3 className="font-semibold text-gray-900">
                    Répartition non générée
                  </h3>

                  <p className="text-sm text-gray-500 mt-1 max-w-lg mx-auto">
                    {sallesAffectees.length === 0
                      ? "Aucune salle n'est encore affectée à cette épreuve."
                      : nombreEleves === 0
                      ? "Aucun élève n'est concerné par cette épreuve."
                      : capaciteTotale <
                        nombreEleves
                      ? "La capacité des salles affectées est insuffisante."
                      : "Les élèves peuvent maintenant être répartis dans les salles."}
                  </p>
                </div>
              ) : (
                /* SALLES */

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {repartitionParSalle.map(
                    (salle) => {
                      const occupation =
                        salle.capacite > 0
                          ? Math.round(
                              (salle.eleves
                                .length /
                                salle.capacite) *
                                100
                            )
                          : 0;

                      return (
                        <div
                          key={salle.salleId}
                          className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
                        >
                          {/* HEADER SALLE */}

                          <div className="p-5 border-b bg-gray-50">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-bold text-gray-900">
                                  {salle.salleNom}
                                </h3>

                                <p className="text-sm text-gray-500 mt-1">
                                  {salle.eleves.length}{" "}
                                  /{" "}
                                  {salle.capacite}{" "}
                                  places
                                </p>
                              </div>

                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  occupation >=
                                  100
                                    ? "bg-red-100 text-red-700"
                                    : occupation >=
                                      80
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {occupation}%
                              </span>
                            </div>

                            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(
                                    occupation,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* ÉLÈVES */}

                          <div className="p-4">
                            <div className="max-h-80 overflow-y-auto space-y-2">
                              {salle.eleves.map(
                                (
                                  eleve,
                                  index
                                ) => (
                                  <div
                                    key={
                                      eleve.id ||
                                      `${eleve.inscriptionId}-${index}`
                                    }
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                      {index + 1}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="font-medium text-sm text-gray-900 truncate">
                                        {
                                          eleve.eleveNom
                                        }{" "}
                                        {
                                          eleve.elevePrenom
                                        }
                                      </p>

                                      {eleve.classeNom && (
                                        <p className="text-xs text-gray-500 truncate">
                                          {
                                            eleve.classeNom
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {/* NON AFFECTÉS */}

              {nombreNonAffectes > 0 && (
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                  <p className="font-semibold text-yellow-800">
                    {nombreNonAffectes} élève
                    {nombreNonAffectes > 1
                      ? "s"
                      : ""}{" "}
                    non affecté
                    {nombreNonAffectes > 1
                      ? "s"
                      : ""}
                  </p>

                  <p className="text-sm text-yellow-700 mt-1">
                    Tous les élèves concernés ne sont
                    pas encore présents dans une salle.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  suffix,
  icon,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-2xl">
          {icon}
        </span>

        <span className="text-xs text-gray-400">
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

/* ============================================================
   MODAL
============================================================ */

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