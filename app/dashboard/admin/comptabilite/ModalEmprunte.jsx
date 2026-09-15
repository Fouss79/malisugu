"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/api";

function getToday() {
  return new Date()
    .toISOString()
    .substring(0, 10);
}

function formatDateForBackend(
  date,
  endOfDay = false
) {
  if (!date) return null;

  return `${date}T${
    endOfDay ? "23:59:59" : "00:00:00"
  }`;
}

function estDansAnnee(dateValue, annee) {
  if (!dateValue || !annee) return true;

  const date = new Date(`${dateValue}T00:00:00`);

  const debut = annee.dateDebut
    ? new Date(
        String(annee.dateDebut).substring(0, 10) +
          "T00:00:00"
      )
    : null;

  const fin = annee.dateFin
    ? new Date(
        String(annee.dateFin).substring(0, 10) +
          "T23:59:59"
      )
    : null;

  if (debut && date < debut) return false;
  if (fin && date > fin) return false;

  return true;
}

export default function ModalEmprunt({
  ecoleId,
  anneeSelectionnee,
  onClose,
  onSaved,
}) {
  const [libelle, setLibelle] =
    useState("");

  const [preteur, setPreteur] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [montantEmprunte, setMontantEmprunte] =
    useState("");

  const [montantARembourser, setMontantARembourser] =
    useState("");

  const [dateEmprunt, setDateEmprunt] =
    useState(getToday());

  const [dateEcheance, setDateEcheance] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    setDateEmprunt(getToday());
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!ecoleId) {
      setError(
        "L'école est introuvable."
      );
      return;
    }

    if (!anneeSelectionnee?.id) {
      setError(
        "Veuillez sélectionner une année scolaire."
      );
      return;
    }

    const capital =
      Number(montantEmprunte);

    const total =
      Number(montantARembourser);

    if (!libelle.trim()) {
      setError(
        "Le libellé est obligatoire."
      );
      return;
    }

    if (!capital || capital <= 0) {
      setError(
        "Le montant emprunté doit être supérieur à zéro."
      );
      return;
    }

    if (!total || total <= 0) {
      setError(
        "Le montant à rembourser doit être supérieur à zéro."
      );
      return;
    }

    if (total < capital) {
      setError(
        "Le montant à rembourser ne peut pas être inférieur au montant emprunté."
      );
      return;
    }

    if (
      !estDansAnnee(
        dateEmprunt,
        anneeSelectionnee
      )
    ) {
      setError(
        "La date de l'emprunt doit appartenir à l'année scolaire sélectionnée."
      );
      return;
    }

    if (
      dateEcheance &&
      !estDansAnnee(
        dateEcheance,
        anneeSelectionnee
      )
    ) {
      setError(
        "La date d'échéance doit appartenir à l'année scolaire sélectionnée."
      );
      return;
    }

    if (
      dateEcheance &&
      dateEcheance < dateEmprunt
    ) {
      setError(
        "La date d'échéance ne peut pas être antérieure à la date de l'emprunt."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post(
        `/emprunts/ecole/${ecoleId}`,
        {
          libelle:
            libelle.trim(),

          preteur:
            preteur.trim() || null,

          description:
            description.trim() || null,

          montantEmprunte:
            capital,

          montantARembourser:
            total,

          dateEmprunt:
            formatDateForBackend(
              dateEmprunt
            ),

          dateEcheance:
            dateEcheance
              ? formatDateForBackend(
                  dateEcheance,
                  true
                )
              : null,

          anneeScolaireId:
            Number(
              anneeSelectionnee.id
            ),
        }
      );

      await onSaved?.();
    } catch (err) {
      console.error(
        "Erreur création emprunt :",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Impossible de créer l'emprunt."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Nouvel emprunt
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {anneeSelectionnee?.libelle ||
                anneeSelectionnee?.nom ||
                "Année sélectionnée"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-xl text-slate-400 hover:bg-slate-100"
          >
            ×
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Libellé *
            </label>

            <input
              type="text"
              value={libelle}
              onChange={(e) =>
                setLibelle(e.target.value)
              }
              placeholder="Ex : Prêt bancaire pour rénovation"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Prêteur
            </label>

            <input
              type="text"
              value={preteur}
              onChange={(e) =>
                setPreteur(e.target.value)
              }
              placeholder="Banque, personne, organisme..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Description de l'emprunt..."
              className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Montant reçu *
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={montantEmprunte}
                onChange={(e) =>
                  setMontantEmprunte(
                    e.target.value
                  )
                }
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Total à rembourser *
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={montantARembourser}
                onChange={(e) =>
                  setMontantARembourser(
                    e.target.value
                  )
                }
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Date de l'emprunt *
              </label>

              <input
                type="date"
                value={dateEmprunt}
                onChange={(e) =>
                  setDateEmprunt(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Date d'échéance
              </label>

              <input
                type="date"
                value={dateEcheance}
                onChange={(e) =>
                  setDateEcheance(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            L'emprunt sera automatiquement rattaché à l'année scolaire sélectionnée.
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Enregistrement..."
                : "Créer l'emprunt"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}