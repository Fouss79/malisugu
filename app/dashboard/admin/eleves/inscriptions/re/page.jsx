
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  GraduationCap,
  School,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../../../../context/AuthContext";
import api from "../../../../../../lib/api";

import ReinscriptionPrimaireSection from "./component/ReinscriptionPrimaireSection";
import ReinscriptionSecondaireSection from "./component/ReinscriptionSecondaireSection";

const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";

function normaliserNom(nom = "") {
  return String(nom)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[_\s-]+/g, " ");
}

function estPrimaire(nom) {
  return [
    "PREMIER CYCLE",
    "PRIMAIRE",
    "FONDAMENTAL 1",
  ].includes(normaliserNom(nom));
}

export default function ReinscriptionPage() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  const [cycles, setCycles] = useState([]);
  const [cycleId, setCycleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!ecoleId) {
      setCycles([]);
      setCycleId(null);
      setLoading(false);
      return;
    }

    let actif = true;

    const chargerCycles = async () => {
      setLoading(true);
      setErreur("");
      setCycles([]);
      setCycleId(null);

      try {
        const res = await api.get(
          `/cycles/ecole/${ecoleId}`
        );

        if (!actif) return;

        const liste = Array.isArray(res.data)
          ? res.data
          : [];

        setCycles(liste);

        if (liste.length > 0) {
          setCycleId(liste[0].id);
        }
      } catch (error) {
        if (!actif) return;

        console.error(
          "Erreur chargement cycles :",
          error
        );

        setErreur(
          error.response?.data?.message ||
          "Impossible de charger les cycles de l'école."
        );
      } finally {
        if (actif) setLoading(false);
      }
    };

    chargerCycles();

    return () => {
      actif = false;
    };
  }, [ecoleId]);

  const cycleSelectionne = cycles.find(
    (c) => String(c.id) === String(cycleId)
  );

  const primaire = cycleSelectionne
    ? estPrimaire(cycleSelectionne.nom)
    : false;

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`,
              color: INK,
            }}
          >
            <Users size={20} />
          </span>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Réinscription des élèves
            </h1>

            <p className="text-sm text-slate-500">
              Choisissez un cycle de votre établissement.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/admin/eleves/listeinscrit"
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, ${INK}, #182746)`,
          }}
        >
          <ArrowLeft size={18} />
          Retour aux inscriptions
        </Link>
      </div>

      {/* CHARGEMENT */}
      {loading && (
        <div className="flex items-center gap-2 rounded-xl border bg-white p-5 text-sm text-slate-500">
          <Loader2
            size={18}
            className="animate-spin"
            style={{ color: GOLD }}
          />
          Chargement des cycles...
        </div>
      )}

      {/* ERREUR */}
      {!loading && erreur && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {erreur}
        </div>
      )}

      {/* AUCUN CYCLE */}
      {!loading &&
        !erreur &&
        cycles.length === 0 && (
          <div className="rounded-2xl border bg-white p-8 text-center">
            <School
              size={32}
              className="mx-auto mb-3 text-slate-400"
            />

            <p className="font-medium text-slate-700">
              Aucun cycle disponible
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Aucun cycle n'est encore enregistré
              pour cette école.
            </p>
          </div>
        )}

      {/* CYCLES DE LA BASE DE DONNÉES */}
      {!loading &&
        !erreur &&
        cycles.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm">
              {cycles.map((item) => {
                const actif =
                  String(cycleId) === String(item.id);

                const Icon = estPrimaire(item.nom)
                  ? School
                  : GraduationCap;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCycleId(item.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      actif
                        ? "text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                    style={
                      actif
                        ? { background: INK }
                        : undefined
                    }
                  >
                    <Icon size={16} />
                    {item.nom}
                  </button>
                );
              })}
            </div>

            {/* SECTION SELON LE CYCLE */}
            {cycleSelectionne && (
              <div key={cycleSelectionne.id}>
                {primaire ? (
                  <ReinscriptionPrimaireSection
                    cycleId={cycleSelectionne.id}
                    cycleNom={cycleSelectionne.nom}
                  />
                ) : (
                  <ReinscriptionSecondaireSection
                    cycleId={cycleSelectionne.id}
                    cycleNom={cycleSelectionne.nom}
                  />
                )}
              </div>
            )}
          </>
        )}
    </div>
  );
}