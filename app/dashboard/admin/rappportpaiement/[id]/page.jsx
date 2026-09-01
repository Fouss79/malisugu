
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";

export default function RapportPaiementPage() {
  const params = useParams();
  const inscriptionId = params?.inscriptionId;

  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const API_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  useEffect(() => {
    if (!inscriptionId) return;

    chargerRapport();
  }, [inscriptionId]);

  const chargerRapport = async () => {
    try {
      setLoading(true);
      setErreur("");

      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/api/rapports-paiements/inscription/${inscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Rapport paiement :", response.data);

      setRapport(response.data);
    } catch (error) {
      console.error("❌ Erreur chargement rapport :", error);

      if (error.response?.status === 403) {
        setErreur("Vous n'avez pas l'autorisation d'accéder à ce rapport.");
      } else if (error.response?.status === 404) {
        setErreur("Rapport ou inscription introuvable.");
      } else {
        setErreur(
          error.response?.data?.message ||
            "Impossible de charger le rapport des paiements."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR").format(montant || 0) + " FCFA";
  };

  const imprimer = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-gray-500">
            Chargement du rapport...
          </p>
        </div>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <span>{erreur}</span>
        </div>
      </div>
    );
  }

  if (!rapport) {
    return (
      <div className="p-6">
        <div className="alert alert-warning">
          <span>Aucun rapport disponible.</span>
        </div>
      </div>
    );
  }

  const paiements = rapport.paiements || [];

  const pourcentage =
    rapport.totalAPayer > 0
      ? Math.min(
          100,
          Math.round(
            (rapport.totalPaye / rapport.totalAPayer) * 100
          )
        )
      : 0;

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-6">

      {/* ============================= */}
      {/* EN-TÊTE */}
      {/* ============================= */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">

        <div>
          <h1 className="text-2xl font-bold">
            Rapport des paiements
          </h1>

          <p className="text-sm text-gray-500">
            Historique financier de l'élève
          </p>
        </div>

        <button
          onClick={imprimer}
          className="btn btn-primary"
        >
          🖨️ Imprimer
        </button>
      </div>


      {/* ============================= */}
      {/* RAPPORT */}
      {/* ============================= */}

      <div className="mx-auto max-w-6xl rounded-xl bg-white p-5 shadow-md md:p-8">

        {/* ============================= */}
        {/* INFORMATIONS ÉCOLE / ÉLÈVE */}
        {/* ============================= */}

        <div className="border-b pb-6">

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold uppercase">
              Rapport des paiements
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Année scolaire :{" "}
              <span className="font-semibold text-gray-700">
                {rapport.anneeScolaire || "-"}
              </span>
            </p>
          </div>


          <div className="grid gap-4 rounded-lg bg-base-200 p-5 md:grid-cols-3">

            <div>
              <p className="text-xs uppercase text-gray-500">
                Élève
              </p>

              <p className="mt-1 text-lg font-bold">
                {rapport.nomEleve || "-"}
              </p>
            </div>


            <div>
              <p className="text-xs uppercase text-gray-500">
                Classe
              </p>

              <p className="mt-1 text-lg font-bold">
                {rapport.classe || "-"}
              </p>
            </div>


            <div>
              <p className="text-xs uppercase text-gray-500">
                Nombre de paiements
              </p>

              <p className="mt-1 text-lg font-bold">
                {paiements.length}
              </p>
            </div>

          </div>

        </div>


        {/* ============================= */}
        {/* RÉSUMÉ FINANCIER */}
        {/* ============================= */}

        <div className="grid gap-4 py-6 md:grid-cols-3">

          {/* Total à payer */}

          <div className="rounded-xl border bg-base-100 p-5">
            <p className="text-sm text-gray-500">
              Total à payer
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatMontant(rapport.totalAPayer)}
            </p>
          </div>


          {/* Total payé */}

          <div className="rounded-xl border border-success/30 bg-success/5 p-5">
            <p className="text-sm text-gray-500">
              Total payé
            </p>

            <p className="mt-2 text-2xl font-bold text-success">
              {formatMontant(rapport.totalPaye)}
            </p>
          </div>


          {/* Reste */}

          <div
            className={`rounded-xl border p-5 ${
              rapport.resteAPayer > 0
                ? "border-error/30 bg-error/5"
                : "border-success/30 bg-success/5"
            }`}
          >
            <p className="text-sm text-gray-500">
              Reste à payer
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                rapport.resteAPayer > 0
                  ? "text-error"
                  : "text-success"
              }`}
            >
              {formatMontant(rapport.resteAPayer)}
            </p>
          </div>

        </div>


        {/* ============================= */}
        {/* PROGRESSION */}
        {/* ============================= */}

        <div className="mb-8">

          <div className="mb-2 flex justify-between text-sm">

            <span className="font-medium">
              Progression des paiements
            </span>

            <span className="font-bold">
              {pourcentage}%
            </span>

          </div>

          <progress
            className={`progress w-full ${
              pourcentage >= 100
                ? "progress-success"
                : "progress-primary"
            }`}
            value={pourcentage}
            max="100"
          />

        </div>


        {/* ============================= */}
        {/* HISTORIQUE */}
        {/* ============================= */}

        <div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold">
              Historique des paiements
            </h3>

            <span className="badge badge-primary">
              {paiements.length} paiement
              {paiements.length > 1 ? "s" : ""}
            </span>
          </div>


          {paiements.length === 0 ? (

            <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
              Aucun paiement enregistré pour cet élève.
            </div>

          ) : (

            <div className="overflow-x-auto rounded-lg border">

              <table className="table w-full">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Référence</th>
                    <th>Date</th>
                    <th>Type de frais</th>
                    <th>Période</th>
                    <th>Mode</th>
                    <th className="text-right">
                      Montant
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {paiements.map((paiement, index) => (

                    <tr key={paiement.reference || index}>

                      <td>
                        {index + 1}
                      </td>


                      <td>
                        <span className="font-mono text-sm">
                          {paiement.reference || "-"}
                        </span>
                      </td>


                      <td>
                        {paiement.date || "-"}
                      </td>


                      <td>
                        {paiement.typeFrais || "-"}
                      </td>


                      <td>
                        {paiement.periode || "-"}
                      </td>


                      <td>

                        <span className="badge badge-outline">
                          {paiement.modePaiement || "-"}
                        </span>

                      </td>


                      <td className="text-right font-bold">
                        {formatMontant(
                          paiement.montant
                        )}
                      </td>

                    </tr>

                  ))}

                </tbody>


                <tfoot>

                  <tr>

                    <td
                      colSpan="6"
                      className="text-right font-bold"
                    >
                      TOTAL PAYÉ
                    </td>

                    <td className="text-right text-lg font-bold text-success">
                      {formatMontant(
                        rapport.totalPaye
                      )}
                    </td>

                  </tr>

                </tfoot>

              </table>

            </div>

          )}

        </div>


        {/* ============================= */}
        {/* RÉSUMÉ FINAL */}
        {/* ============================= */}

        <div className="mt-8 border-t pt-6">

          <div className="ml-auto max-w-md space-y-3">

            <div className="flex justify-between">
              <span className="text-gray-600">
                Total à payer
              </span>

              <span className="font-semibold">
                {formatMontant(
                  rapport.totalAPayer
                )}
              </span>
            </div>


            <div className="flex justify-between">
              <span className="text-gray-600">
                Total payé
              </span>

              <span className="font-semibold text-success">
                {formatMontant(
                  rapport.totalPaye
                )}
              </span>
            </div>


            <div className="flex justify-between border-t pt-3 text-lg">

              <span className="font-bold">
                Reste à payer
              </span>

              <span
                className={`font-bold ${
                  rapport.resteAPayer > 0
                    ? "text-error"
                    : "text-success"
                }`}
              >
                {formatMontant(
                  rapport.resteAPayer
                )}
              </span>

            </div>

          </div>

        </div>


        {/* ============================= */}
        {/* PIED DE PAGE */}
        {/* ============================= */}

        <div className="mt-10 border-t pt-4 text-center text-xs text-gray-400">
          Rapport généré automatiquement par le système de gestion scolaire.
        </div>

      </div>


      {/* ============================= */}
      {/* STYLE IMPRESSION */}
      {/* ============================= */}

      <style jsx global>{`
        @media print {

          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .bg-base-200 {
            background: white !important;
          }

          .shadow-md {
            box-shadow: none !important;
          }

          .rounded-xl {
            border-radius: 0 !important;
          }

          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>

    </div>
  );
}

