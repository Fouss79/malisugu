"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../../../context/AuthContext";
import {
  Search,
  Plus,
  Users,
  X,
  Eye,
  Pencil,
  Check,
  XCircle,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import EleveForm from "../Component/ElevePage";
import api from "../../../../../lib/api";

/* =========================================================
   PALETTE (identique au reste de l'application)
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

const STATUT_STYLES = {
  PREINSCRIT: { background: `${GOLD}1A`, color: "#8A6A21" },
  INSCRIT: { background: TEAL_SOFT, color: TEAL },
  VALIDE: { background: TEAL_SOFT, color: TEAL },
  REFUSE: { background: CORAL_SOFT, color: CORAL },
};

function StatutBadge({ statut }) {
  const style = STATUT_STYLES[statut] || { background: "#F1F5F9", color: "#64748B" };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={style}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />
      {statut}
    </span>
  );
}

function Avatar({ nom, prenom, sexe, size = "h-8 w-8 text-xs" }) {
  const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
  const style =
    sexe === "F" ? { background: VIOLET_SOFT, color: VIOLET } : { background: TEAL_SOFT, color: TEAL };
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${size}`} style={style}>
      {initials}
    </div>
  );
}

// --- Ligne info dans le modal ---
function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">{value ?? "—"}</p>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3
      className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
      style={{ color: TEAL }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />
      {children}
    </h3>
  );
}

function formatMontant(valeur) {
  if (valeur == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(valeur) + " FCFA";
}

function ModalAjout({ onClose, onSaved }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="h-full w-full overflow-y-auto bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ color: INK }}>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: TEAL_SOFT, color: TEAL }}
            >
              <Plus size={16} />
            </span>
            Ajouter un élève
          </h2>

          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <EleveForm
            embedded
            onSaved={() => {
              onSaved();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ModalEdition({ eleveId, onClose, onSaved }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="h-full w-full overflow-y-auto bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ color: INK }}>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: `${GOLD}1A`, color: "#8A6A21" }}
            >
              <Pencil size={16} />
            </span>
            Modifier l&apos;élève
          </h2>

          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <EleveForm
            eleveId={eleveId}
            embedded
            onSaved={() => {
              onSaved();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

// --- Modal détail élève ---
function EleveDetailModal({ eleve, onClose }) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);

    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  if (!eleve) return null;

  const genererRapportPaiement = async () => {
    if (!eleve.id) {
      alert("Impossible de générer le rapport : inscription introuvable.");
      return;
    }

    setGeneratingPdf(true);

    try {
      const response = await api.get(
        `/rapports/paiements/inscription/${eleve.id}/pdf`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      link.download = `rapport-paiement-${eleve.prenom || "eleve"}-${
        eleve.nom || ""
      }.pdf`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ ERREUR GÉNÉRATION RAPPORT PAIEMENT", error);

      // Si Spring renvoie une erreur alors que responseType = blob
      if (error?.response?.data instanceof Blob) {
        try {
          const texte = await error.response.data.text();
          const json = JSON.parse(texte);

          alert(
            json?.message ||
              json?.error ||
              "Erreur lors de la génération du rapport."
          );
        } catch {
          alert("Erreur lors de la génération du rapport PDF.");
        }
      } else {
        alert(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Erreur lors de la génération du rapport PDF."
        );
      }
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="h-full w-full overflow-y-auto bg-white shadow-xl sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <Avatar
              nom={eleve.nom}
              prenom={eleve.prenom}
              sexe={eleve.sexe}
              size="h-11 w-11 text-sm"
            />

            <div>
              <h2 className="font-semibold text-slate-900">
                {eleve.prenom} {eleve.nom}
              </h2>

              <p className="text-xs text-slate-400">
                Matricule {eleve.matricule || "—"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* =====================================================
            CONTENU
        ====================================================== */}
        <div className="space-y-6 p-5">

          {/* IDENTITÉ */}
          <div>
            <SectionTitle>Identité</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Nom" value={eleve.nom} />
              <InfoRow label="Prénom" value={eleve.prenom} />

              <InfoRow
                label="Date de naissance"
                value={eleve.dateNaissance}
              />

              <InfoRow
                label="Lieu de naissance"
                value={eleve.lieuNaissance}
              />

              <InfoRow
                label="Sexe"
                value={eleve.sexe === "F" ? "Fille" : "Garçon"}
              />

              <InfoRow
                label="Nationalité"
                value={eleve.nationalite}
              />

              <InfoRow
                label="Matricule"
                value={eleve.matricule}
              />

              <InfoRow
                label="Groupe sanguin"
                value={eleve.groupeSanguin}
              />
            </div>

            {eleve.allergiesMaladies && (
              <div
                className="mt-3 rounded-lg p-3 text-sm"
                style={{
                  background: `${GOLD}1A`,
                  color: "#8A6A21",
                }}
              >
                <span className="font-medium">
                  Allergies / maladies :{" "}
                </span>

                {eleve.allergiesMaladies}
              </div>
            )}
          </div>

          {/* CONTACT */}
          <div>
            <SectionTitle>Contact élève</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow
                label="Adresse"
                value={eleve.adresse}
              />

              <InfoRow
                label="Téléphone"
                value={eleve.telephone}
              />

              <InfoRow
                label="Email"
                value={eleve.email}
              />
            </div>
          </div>

          {/* TUTEUR */}
          {(eleve.nomTuteur || eleve.telephoneTuteur) && (
            <div>
              <SectionTitle>Parent / Tuteur</SectionTitle>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow
                  label="Nom"
                  value={`${eleve.prenomTuteur ?? ""} ${
                    eleve.nomTuteur ?? ""
                  }`.trim() || "—"}
                />

                <InfoRow
                  label="Lien de parenté"
                  value={eleve.lienParente}
                />

                <InfoRow
                  label="Téléphone"
                  value={eleve.telephoneTuteur}
                />

                <InfoRow
                  label="Email"
                  value={eleve.emailTuteur}
                />
              </div>
            </div>
          )}

          {/* SCOLARITÉ */}
          <div>
            <SectionTitle>Scolarité</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow
                label="Classe"
                value={eleve.classeNom}
              />

              <InfoRow
                label="Année scolaire"
                value={eleve.annee}
              />

              <InfoRow
                label="Date d'inscription"
                value={
                  eleve.dateInscription?.substring(0, 10)
                }
              />

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Statut
                </p>

                <div className="mt-1">
                  <StatutBadge statut={eleve.statut} />
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              PAIEMENT
          ================================================== */}
          <div>
            <SectionTitle>Paiement</SectionTitle>

            <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3">
              <InfoRow
                label="Montant total"
                value={formatMontant(eleve.montantTotal)}
              />

              <InfoRow
                label="Payé"
                value={formatMontant(eleve.montantPaye)}
              />

              <InfoRow
                label="Reste à payer"
                value={formatMontant(eleve.resteAPayer)}
              />
            </div>

            {/* BOUTON RAPPORT */}
            <button
              onClick={genererRapportPaiement}
              disabled={generatingPdf}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, ${INK}, #182746)`,
              }}
            >
              {generatingPdf ? (
                <>
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  />

                  Génération du rapport...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v6h6" />
                    <path d="M8 13h8" />
                    <path d="M8 17h5" />
                  </svg>

                  Rapport des paiements
                </>
              )}
            </button>

            <p className="mt-2 text-center text-xs text-slate-400">
              Télécharger l'historique complet des paiements de cet élève
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const COLONNES = 9;

export default function ElevesPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [eleves, setEleves] = useState([]);
  const [classeFilter, setClasseFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [eleveDetail, setEleveDetail] = useState(null);
  const [modalAjoutOuvert, setModalAjoutOuvert] = useState(false);
  const [eleveEnEdition, setEleveEnEdition] = useState(null);

  const loadEleves = async () => {
    if (!user?.ecole?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/inscriptions/ecole/${user.ecole.id}/active`);
      setEleves(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setEleves([]);
    } finally {
      setLoading(false);
    }
  };

  const changerStatut = async (id, action) => {
    setBusyId(id);

    try {
      const response = await api.put(`/inscriptions/${id}/${action}`);
      await loadEleves();
    } catch (error) {
      console.error("❌ ERREUR CHANGEMENT STATUT", error);
      alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          `Erreur serveur (${error?.response?.status || "inconnue"})`
      );
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    loadEleves();
  }, [user?.ecole?.id]);

  const classesUniques = useMemo(
    () => [...new Set(eleves.map((e) => e.classeNom).filter(Boolean))],
    [eleves]
  );

  const filteredEleves = useMemo(() => {
    return eleves
      .filter((e) => {
        const matchSearch = `${e.nom} ${e.prenom} ${e.matricule ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchClasse = classeFilter === "" || e.classeNom === classeFilter;
        return matchSearch && matchClasse;
      })
      .sort((a, b) => (a.classeNom || "").localeCompare(b.classeNom || ""));
  }, [eleves, search, classeFilter]);

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`, color: INK }}
          >
            <Users size={20} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Liste des élèves</h1>
            <p className="text-sm text-slate-500">
              {loading ? "Chargement..." : `${filteredEleves.length} élève${filteredEleves.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un nom, un matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:ring-4 sm:w-64"
              style={{ "--tw-ring-color": `${GOLD}33` }}
              onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "")}
            />
          </div>

          {/* SELECT CLASSE */}
          <select
            value={classeFilter}
            onChange={(e) => setClasseFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none sm:w-auto"
          >
            <option value="">Toutes les classes</option>
            {classesUniques.map((classe) => (
              <option key={classe} value={classe}>
                {classe}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={() => setModalAjoutOuvert(true)}
          className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
          style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
        >
          <Plus size={18} />
          Ajouter
        </button>

        <Link
          href="/dashboard/admin/eleves/reinscription"
          className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
          style={{ background: TEAL }}
        >
          <Users size={18} />
          Réinscrire
        </Link>
      </div>

      {/* ===== VUE MOBILE : CARTES ===== */}
      <div className="space-y-3 sm:hidden">
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-10 text-center text-sm text-slate-400 shadow-sm">
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: GOLD, borderTopColor: "transparent" }}
            />
            Chargement des élèves...
          </div>
        )}

        {!loading && filteredEleves.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-10 shadow-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: `${INK}0D`, color: INK }}
              >
                <Users size={22} />
              </div>
              <p className="text-sm font-medium text-slate-600">Aucun élève trouvé</p>
              <p className="text-xs text-slate-400">
                Essayez un autre nom, matricule ou changez de filtre de classe.
              </p>
            </div>
          </div>
        )}

        {!loading &&
          filteredEleves.map((e) => (
            <div key={e.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar nom={e.nom} prenom={e.prenom} sexe={e.sexe} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {e.prenom} {e.nom}
                    </p>
                    <p className="truncate text-xs text-slate-400">{e.classeNom || "Non affecté"}</p>
                  </div>
                </div>
                <StatutBadge statut={e.statut} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <p>
                  <span className="text-slate-400">Matricule :</span> {e.matricule || "—"}
                </p>
                <p>
                  <span className="text-slate-400">Sexe :</span> {e.sexe === "F" ? "Fille" : "Garçon"}
                </p>
                <p className="col-span-2">
                  <span className="text-slate-400">Naissance :</span> {e.dateNaissance || "—"}
                </p>
              </div>

              <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => setEleveDetail(e)}
                  title="Voir détails"
                  className="rounded-lg p-2 transition hover:brightness-95"
                  style={{ background: "#F1F5F9", color: "#475569" }}
                >
                  <Eye size={16} />
                </button>

                <button
                  onClick={() => setEleveEnEdition(e.id)}
                  title="Modifier"
                  className="rounded-lg p-2 text-white transition hover:brightness-110"
                  style={{ background: GOLD }}
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => changerStatut(e.id, "valider")}
                  disabled={busyId === e.id || e.statut === "INSCRIT" || e.statut === "VALIDE"}
                  title="Inscrire"
                  className="rounded-lg p-2 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: TEAL }}
                >
                  <Check size={16} />
                </button>

                <button
                  onClick={() => changerStatut(e.id, "rejeter")}
                  disabled={busyId === e.id || e.statut === "REJETE"}
                  title="Rejeter"
                  className="rounded-lg p-2 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: CORAL }}
                >
                  <XCircle size={16} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* ===== VUE DESKTOP : TABLEAU ===== */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40 sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400" style={{ background: "#F8F7F2" }}>
                <th className="px-4 py-3 font-medium">Élève</th>
                <th className="px-4 py-3 font-medium">Matricule</th>
                <th className="px-4 py-3 font-medium">Classe</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Date naissance</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Sexe</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr>
                  <td colSpan={COLONNES} className="px-4 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <div
                        className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                        style={{ borderColor: GOLD, borderTopColor: "transparent" }}
                      />
                      Chargement des élèves...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredEleves.length === 0 && (
                <tr>
                  <td colSpan={COLONNES} className="px-4 py-14">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{ background: `${INK}0D`, color: INK }}
                      >
                        <Users size={22} />
                      </div>
                      <p className="text-sm font-medium text-slate-600">Aucun élève trouvé</p>
                      <p className="text-xs text-slate-400">
                        Essayez un autre nom, matricule ou changez de filtre de classe.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredEleves.map((e) => (
                  <tr key={e.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar nom={e.nom} prenom={e.prenom} sexe={e.sexe} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">
                            {e.prenom} {e.nom}
                          </p>
                          <p className="truncate text-xs text-slate-400">{e.classeNom || "Non affecté"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{e.matricule}</td>
                    <td className="px-4 py-3 text-slate-500">{e.classeNom || "—"}</td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">{e.dateNaissance}</td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                      {e.sexe === "F" ? "Fille" : "Garçon"}
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={e.statut} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {/* Détails */}
                        <button
                          onClick={() => setEleveDetail(e)}
                          title="Voir détails"
                          className="rounded-lg p-2 transition hover:brightness-95"
                          style={{ background: "#F1F5F9", color: "#475569" }}
                        >
                          <Eye size={16} />
                        </button>

                        {/* Modifier */}
                        <button
                          onClick={() => setEleveEnEdition(e.id)}
                          title="Modifier"
                          className="rounded-lg p-2 text-white transition hover:brightness-110"
                          style={{ background: GOLD }}
                        >
                          <Pencil size={16} />
                        </button>

                        {/* Inscrire */}
                        <button
                          onClick={() => changerStatut(e.id, "valider")}
                          disabled={busyId === e.id || e.statut === "INSCRIT" || e.statut === "VALIDE"}
                          title="Inscrire"
                          className="rounded-lg p-2 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ background: TEAL }}
                        >
                          <Check size={16} />
                        </button>

                        {/* Rejeter */}
                        <button
                          onClick={() => changerStatut(e.id, "rejeter")}
                          disabled={busyId === e.id || e.statut === "REJETE"}
                          title="Rejeter"
                          className="rounded-lg p-2 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ background: CORAL }}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAjoutOuvert && <ModalAjout onClose={() => setModalAjoutOuvert(false)} onSaved={loadEleves} />}

      {eleveEnEdition && (
        <ModalEdition eleveId={eleveEnEdition} onClose={() => setEleveEnEdition(null)} onSaved={loadEleves} />
      )}

      <EleveDetailModal eleve={eleveDetail} onClose={() => setEleveDetail(null)} />
    </div>
  );
}