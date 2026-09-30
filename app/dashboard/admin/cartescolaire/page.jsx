"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";
import {
  IdCard,
  Download,
  Users,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";

const STYLES = {
  input:
    "w-full rounded-xl border border-[#DEDCD0] bg-[#F8F7F2] px-3.5 py-3 text-sm font-medium text-[#1B2333] outline-none transition focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/10",
  card:
    "rounded-[20px] border border-[#DEDCD0] bg-white shadow-[0_10px_30px_rgba(16,27,51,0.05)]",
};

function telechargerBlob(blob, nomFichier) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomFichier;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function extraireMessageErreur(error, messageParDefaut) {
  const data = error?.response?.data;

  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      return parsed.message || parsed.error || messageParDefaut;
    } catch {
      return messageParDefaut;
    }
  }

  if (data && typeof data === "object") {
    return data.message || data.error || messageParDefaut;
  }

  return messageParDefaut;
}

export default function CartesScolairesPage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [classeId, setClasseId] = useState("");
  const [anneeId, setAnneeId] = useState("");

  const [eleves, setEleves] = useState([]);
  const [loadingEleves, setLoadingEleves] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [generatingId, setGeneratingId] = useState(null);
  const [generatingClasse, setGeneratingClasse] = useState(false);

  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState(null);

  const afficherToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // ============================================================
  // CHARGEMENT INITIAL (classes + années)
  // ============================================================

  useEffect(() => {
    if (!user?.ecole?.id) return;

    const charger = async () => {
      try {
        const ecoleId = user.ecole.id;

        const [classesRes, anneesRes] = await Promise.all([
          api.get(`/classes/ecole/${ecoleId}`),
          api.get(`/annees/ecole/${ecoleId}`),
        ]);

        setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);

        const anneesData = Array.isArray(anneesRes.data) ? anneesRes.data : [];
        setAnnees(anneesData);

        const anneeActive = anneesData.find((a) => a.active);
        if (anneeActive) {
          setAnneeId(String(anneeActive.id));
        }
      } catch (error) {
        console.error("Erreur chargement initial :", error);
        setErreur("Impossible de charger les données initiales.");
      } finally {
        setLoadingInitial(false);
      }
    };

    charger();
  }, [user]);

  // ============================================================
  // CHARGEMENT DES ÉLÈVES DE LA CLASSE
  // ============================================================

  useEffect(() => {
    if (!classeId || !anneeId) {
      setEleves([]);
      return;
    }

    const chargerEleves = async () => {
      setLoadingEleves(true);
      setErreur("");

      try {
        const response = await api.get(
          `/inscriptions/actif/classe/${classeId}/annee/${anneeId}`
        );

        const data = Array.isArray(response.data) ? response.data : [];

        const triees = [...data].sort((a, b) => {
          const nomA = `${a.nom ?? ""} ${a.prenom ?? ""}`.trim();
          const nomB = `${b.nom ?? ""} ${b.prenom ?? ""}`.trim();
          return nomA.localeCompare(nomB, "fr");
        });

        setEleves(triees);
      } catch (error) {
        console.error("Erreur chargement élèves :", error);
        setErreur("Impossible de charger les élèves de cette classe.");
        setEleves([]);
      } finally {
        setLoadingEleves(false);
      }
    };

    chargerEleves();
  }, [classeId, anneeId]);

  const classeChoisie = useMemo(
    () => classes.find((c) => String(c.id) === String(classeId)),
    [classes, classeId]
  );

  // ============================================================
  // TÉLÉCHARGER LA CARTE D'UN ÉLÈVE
  // ============================================================

  const telechargerCarteEleve = async (eleve) => {
    setGeneratingId(eleve.id);
    setErreur("");

    try {
      const response = await api.get(
        `/cartes-scolaires/eleve/${eleve.id}/pdf`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });

      telechargerBlob(
        blob,
        `carte-scolaire-${eleve.matricule || eleve.id}.pdf`
      );

      afficherToast(`✓ Carte générée pour ${eleve.prenom} ${eleve.nom}`);
    } catch (error) {
      console.error("Erreur génération carte :", error);
      setErreur(
        await extraireMessageErreur(
          error,
          "Impossible de générer la carte scolaire."
        )
      );
    } finally {
      setGeneratingId(null);
    }
  };

  // ============================================================
  // TÉLÉCHARGER LA PLANCHE DE TOUTE LA CLASSE
  // ============================================================

  const telechargerCartesClasse = async () => {
    if (!classeId || !anneeId) {
      setErreur("Choisissez une classe et une année scolaire.");
      return;
    }

    setGeneratingClasse(true);
    setErreur("");

    try {
      const response = await api.get(
        `/cartes-scolaires/classe/${classeId}/pdf`,
        {
          params: { anneeScolaireId: Number(anneeId) },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });

      telechargerBlob(blob, `cartes-scolaires-classe-${classeId}.pdf`);

      afficherToast("✓ Planche de cartes générée avec succès");
    } catch (error) {
      console.error("Erreur génération planche :", error);
      setErreur(
        await extraireMessageErreur(
          error,
          "Impossible de générer les cartes scolaires de la classe."
        )
      );
    } finally {
      setGeneratingClasse(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C89B3C] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-5 bg-[#ECEAE2] p-3 sm:p-5 lg:p-6">

      {/* HEADER */}

      <section
        className="overflow-hidden rounded-[22px] shadow-lg"
        style={{ background: INK }}
      >
        <div className="px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div
                className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"
                style={{ color: GOLD_2 }}
              >
                <IdCard size={14} />
                Identité scolaire
              </div>

              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Cartes scolaires
              </h1>

              <p className="mt-2 text-sm text-slate-300">
                Générez la carte d&apos;identité de chaque élève, ou une
                planche imprimable pour toute la classe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ERREUR */}

      {erreur && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{erreur}</span>
        </div>
      )}

      {/* FILTRES */}

      <section className={`${STYLES.card} overflow-hidden`}>
        <div className="border-b border-[#DEDCD0] bg-[#FCFBF8] px-5 py-4">
          <h2 className="font-bold text-[#101B33]">Sélection</h2>
          <p className="mt-1 text-xs text-[#7A8190]">
            Choisissez la classe et l&apos;année scolaire.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
              Classe
            </span>
            <select
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              className={STYLES.input}
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nomComplet}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
              Année scolaire
            </span>
            <select
              value={anneeId}
              onChange={(e) => setAnneeId(e.target.value)}
              className={STYLES.input}
            >
              <option value="">Sélectionner une année</option>
              {annees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom} {a.active ? "— Active" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* LISTE DES ÉLÈVES */}

      {classeId && anneeId && (
        <section className={`${STYLES.card} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-[#DEDCD0] bg-[#FCFBF8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-[#101B33]">
                {classeChoisie?.nomComplet || "Classe"}
              </h2>
              <p className="mt-1 text-xs text-[#7A8190]">
                {eleves.length} élève{eleves.length > 1 ? "s" : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={telechargerCartesClasse}
              disabled={generatingClasse || loadingEleves || !eleves.length}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: TEAL }}
            >
              <Download size={17} />
              {generatingClasse
                ? "Génération..."
                : "Télécharger la planche complète"}
            </button>
          </div>

          {loadingEleves ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#C89B3C] border-t-transparent" />
              <p className="text-sm text-[#7A8190]">Chargement des élèves...</p>
            </div>
          ) : eleves.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Users className="mx-auto mb-3 text-[#9BA2B1]" size={30} />
              <p className="font-semibold text-[#5B6478]">
                Aucun élève dans cette classe.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EEE7]">
              {eleves.map((eleve, index) => (
                <div
                  key={eleve.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-[#FCFBF8]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                      style={{ background: INK, color: GOLD_2 }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#101B33]">
                        {eleve.prenom} {eleve.nom}
                      </div>
                      {eleve.matricule && (
                        <div className="font-mono text-[10px] text-[#8A91A2]">
                          {eleve.matricule}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => telechargerCarteEleve(eleve)}
                    disabled={generatingId === eleve.id}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#DEDCD0] bg-white px-3 py-2 text-xs font-semibold text-[#101B33] transition hover:bg-[#F8F7F2] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <IdCard size={14} />
                    {generatingId === eleve.id ? "..." : "Carte"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TOAST */}

      {toast && (
        <div className="fixed bottom-4 left-3 right-3 z-50 sm:left-auto sm:right-6 sm:max-w-md">
          <div
            className="flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium text-white shadow-[0_16px_40px_rgba(16,27,51,0.25)]"
            style={{ background: INK }}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: TEAL_SOFT, color: TEAL }}
            >
              <CheckCircle size={15} />
            </span>
            <span className="pt-1">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}