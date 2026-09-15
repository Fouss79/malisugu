"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/api";

const MODES_PAIEMENT = [
  { value: "CASH", label: "Espèces" },
  { value: "Orange", label: "Orange Money" },
  { value: "MOOV", label: "Moov Money" },
  { value: "VIREMENT", label: "Virement" },
  { value: "CHEQUE", label: "Chèque" },
];

function formatMontant(value) {
  return new Intl.NumberFormat("fr-FR").format(
    Number(value || 0)
  );
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

export default function ModalRemboursement({
  emprunt,
  anneeSelectionnee,
  onClose,
  onSaved,
}) {
  const [montant, setMontant] =
    useState(
      String(emprunt?.resteAPayer || "")
    );

  const [dateRemboursement, setDateRemboursement] =
    useState(
      new Date()
        .toISOString()
        .substring(0, 10)
    );

  const [modePaiement, setModePaiement] =
    useState("CASH");

  const [reference, setReference] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (emprunt?.resteAPayer != null) {
      setMontant(
        String(emprunt.resteAPayer)
      );
    }
  }, [emprunt]);

  if (!emprunt) return null;

  const resteAPayer = Number(
    emprunt.resteAPayer || 0
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const montantNum = Number(montant);

    if (!montantNum || montantNum <= 0) {
      setError(
        "Le montant doit être supérieur à zéro."
      );
      return;
    }

    if (montantNum > resteAPayer) {
      setError(
        `Le montant ne peut pas dépasser le reste à rembourser (${formatMontant(
          resteAPayer
        )} FCFA).`
      );
      return;
    }

    if (
      !estDansAnnee(
        dateRemboursement,
        anneeSelectionnee
      )
    ) {
      setError(
        "La date du remboursement doit appartenir à l'année scolaire sélectionnée."
      );
      return;
    }

    if (
      modePaiement !== "CASH" &&
      !reference.trim()
    ) {
      setError(
        "La référence est obligatoire pour ce mode de paiement."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/remboursements-emprunts",
        {
          empruntId: emprunt.id,
          montant: montantNum,
          modePaiement,
          reference:
            modePaiement === "CASH"
              ? null
              : reference.trim(),
          dateRemboursement,
        }
      );

      await onSaved?.();
    } catch (err) {
      console.error(
        "Erreur remboursement emprunt :",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Impossible d'enregistrer le remboursement."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Remboursement
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {emprunt.libelle ||
                `Emprunt #${emprunt.id}`}
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

          <div className="grid grid-cols-2 gap-3">

            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-xs text-blue-600">
                À rembourser
              </p>

              <p className="mt-1 font-bold text-blue-700">
                {formatMontant(
                  emprunt.montantARembourser
                )}{" "}
                FCFA
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 p-4">
              <p className="text-xs text-orange-600">
                Reste
              </p>

              <p className="mt-1 font-bold text-orange-700">
                {formatMontant(
                  resteAPayer
                )}{" "}
                FCFA
              </p>
            </div>

          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Montant du remboursement
            </label>

            <input
              type="number"
              min="1"
              max={resteAPayer}
              step="1"
              value={montant}
              onChange={(e) =>
                setMontant(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Date
            </label>

            <input
              type="date"
              value={dateRemboursement}
              onChange={(e) =>
                setDateRemboursement(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mode de paiement
            </label>

            <select
              value={modePaiement}
              onChange={(e) =>
                setModePaiement(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
            >
              {MODES_PAIEMENT.map(
                (mode) => (
                  <option
                    key={mode.value}
                    value={mode.value}
                  >
                    {mode.label}
                  </option>
                )
              )}
            </select>
          </div>

          {modePaiement !== "CASH" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Référence
              </label>

              <input
                type="text"
                value={reference}
                onChange={(e) =>
                  setReference(
                    e.target.value
                  )
                }
                placeholder="Référence de transaction..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                required
              />
            </div>
          )}

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
              className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Enregistrement..."
                : "Enregistrer le remboursement"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}