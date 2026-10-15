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
  IdCard,
  User,
  Phone,
  GraduationCap,
  Wallet,
  CalendarCheck,
  HeartPulse,
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

/* =========================================================
   À COLLER dans la page des élèves, en remplacement de l'ancien
   EleveDetailModal. Les imports et composants existants (Avatar,
   InfoRow, SectionTitle, StatutBadge, formatMontant, api, constantes
   de couleurs) sont inchangés.
========================================================= */

// Le premier cycle suit ses absences via les bulletins mensuels (BulletinMensuelInfo)
function estPremierCycle(eleve) {
  const nom = String(eleve?.cycleNom ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents
    .toLowerCase();

  return nom.includes("premier") || nom.includes("1er") || nom.includes("cycle 1");
}

// --- Modal détail élève ---
/* =========================================================
   REMPLACE l'ancien EleveDetailModal.

   1) Dans l'import lucide-react existant, AJOUTE ces icônes :
      User, Phone, GraduationCap, Wallet, CalendarCheck, HeartPulse, MapPin

   2) Garde tel quel : estPremierCycle, StatutBadge, Avatar,
      formatMontant, api et les constantes de couleurs.
      InfoRow et SectionTitle ne sont plus utilisés par ce modal
      (tu peux les laisser ou les supprimer).
========================================================= */

/* ---------- Petits blocs réutilisables ---------- */

function Carte({ icon: Icon, titre, couleur = TEAL, fond = TEAL_SOFT, children }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40">
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: fond, color: couleur }}
        >
          <Icon size={16} />
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{titre}</h3>
      </div>
      {children}
    </section>
  );
}

function Champ({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">
        {value || value === 0 ? value : "—"}
      </p>
    </div>
  );
}

function Chiffre({ label, valeur, couleur = INK, fond = "#F8F7F2" }) {
  return (
    <div className="rounded-xl p-3" style={{ background: fond }}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold leading-tight" style={{ color: couleur }}>
        {valeur}
      </p>
    </div>
  );
}

/* ---------- Modal détail élève ---------- */

function EleveDetailModal({ eleve, onClose }) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingFiche, setGeneratingFiche] = useState(false);
  const [generatingCertificat, setGeneratingCertificat] = useState(false);

  const [absences, setAbsences] = useState(null);
  const [absencesLoading, setAbsencesLoading] = useState(false);
  const [absencesError, setAbsencesError] = useState(false);

  const premierCycle = estPremierCycle(eleve);

  // Assiduité : premier cycle = bulletins mensuels, sinon présences par cours
  useEffect(() => {
    if (!eleve?.id) {
      setAbsences(null);
      setAbsencesLoading(false);
      setAbsencesError(false);
      return;
    }

    let annule = false;
    setAbsencesLoading(true);
    setAbsencesError(false);
    setAbsences(null);

    const url = premierCycle
      ? `/presences/inscription/${eleve.id}/absences/premier-cycle`
      : `/presences/inscription/${eleve.id}/absences/resume`;

    api
      .get(url)
      .then((res) => {
        if (!annule) setAbsences(res.data);
      })
      .catch(() => {
        if (!annule) {
          setAbsences(null);
          setAbsencesError(true);
        }
      })
      .finally(() => {
        if (!annule) setAbsencesLoading(false);
      });

    return () => {
      annule = true;
    };
  }, [eleve?.id, premierCycle]);

  // Fermeture avec Échap
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  if (!eleve) return null;

  /* ---------- Téléchargements ---------- */

  const telechargerBlob = (response, nomFichier) => {
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = nomFichier;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  };

  const gererErreurPdf = async (error, messageParDefaut) => {
    console.error(messageParDefaut, error);

    if (error?.response?.data instanceof Blob) {
      try {
        const texte = await error.response.data.text();
        const json = JSON.parse(texte);
        alert(json?.message || json?.error || messageParDefaut);
      } catch {
        alert(messageParDefaut);
      }
    } else {
      alert(error?.response?.data?.message || error?.response?.data?.error || messageParDefaut);
    }
  };

  const nomFichier = (prefixe) => `${prefixe}-${eleve.prenom || "eleve"}-${eleve.nom || ""}.pdf`;

  const telecharger = async (url, setLoading, prefixe, messageErreur) => {
    if (!eleve.id) {
      alert("Inscription introuvable.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(url, { responseType: "blob" });
      telechargerBlob(response, nomFichier(prefixe));
    } catch (error) {
      await gererErreurPdf(error, messageErreur);
    } finally {
      setLoading(false);
    }
  };

  const genererRapportPaiement = () =>
    telecharger(
      `/rapports/paiements/inscription/${eleve.id}/pdf`,
      setGeneratingPdf,
      "rapport-paiement",
      "Erreur lors de la génération du rapport PDF."
    );

  const genererCertificatScolarite = () =>
    telecharger(
      `/inscriptions/${eleve.id}/certificat-scolarite`,
      setGeneratingCertificat,
      "certificat-scolarite",
      "Impossible de générer le certificat de scolarité."
    );

  const genererFicheRenseignement = () =>
    telecharger(
      `/inscriptions/${eleve.id}/fiche-renseignement`,
      setGeneratingFiche,
      "fiche-renseignement",
      "Erreur lors de la génération de la fiche."
    );

  /* ---------- Valeurs calculées ---------- */

  const nomTuteur = `${eleve.prenomTuteur ?? ""} ${eleve.nomTuteur ?? ""}`.trim();
  const aUnTuteur = Boolean(nomTuteur || eleve.telephoneTuteur);

  const total = Number(eleve.montantTotal) || 0;
  const paye = Number(eleve.montantPaye) || 0;
  const reste = Number(eleve.resteAPayer) || 0;
  const pourcentage = total > 0 ? Math.min(100, Math.round((paye / total) * 100)) : 0;
  const soldee = total > 0 && reste <= 0;

  const valeurAbsence = (v) => (absencesLoading ? "…" : absencesError ? "—" : v ?? 0);

  /* ---------- Rendu ---------- */

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-[#F8F7F2] shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== EN-TÊTE ===== */}
        <div
          className="relative shrink-0 px-5 pb-5 pt-5"
          style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
        >
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4 pr-8">
            <div className="rounded-full p-1" style={{ background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})` }}>
              <Avatar nom={eleve.nom} prenom={eleve.prenom} sexe={eleve.sexe} size="h-16 w-16 text-xl" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-white">
                {eleve.prenom} {eleve.nom}
              </h2>
              <p className="mt-0.5 text-sm text-white/60">Matricule {eleve.matricule || "—"}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatutBadge statut={eleve.statut} />
                {eleve.classeNom && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">
                    {eleve.classeNom}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== CONTENU ===== */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {/* IDENTITÉ */}
          <Carte icon={User} titre="Identité">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Champ label="Date de naissance" value={eleve.dateNaissance} />
              <Champ label="Lieu de naissance" value={eleve.lieuNaissance} />
              <Champ label="Sexe" value={eleve.sexe === "F" ? "Fille" : "Garçon"} />
              <Champ label="Nationalité" value={eleve.nationalite} />
              <Champ label="Groupe sanguin" value={eleve.groupeSanguin} />
            </div>

            {eleve.allergiesMaladies && (
              <div
                className="mt-4 flex items-start gap-2.5 rounded-xl p-3 text-sm"
                style={{ background: CORAL_SOFT, color: CORAL }}
              >
                <HeartPulse size={16} className="mt-0.5 shrink-0" />
                <p>
                  <span className="font-semibold">Allergies / maladies : </span>
                  {eleve.allergiesMaladies}
                </p>
              </div>
            )}
          </Carte>

          {/* SCOLARITÉ */}
          <Carte icon={GraduationCap} titre="Scolarité" couleur="#8A6A21" fond={`${GOLD}1A`}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Champ label="Classe" value={eleve.classeNom} />
              <Champ label="Cycle" value={eleve.cycleNom} />
              <Champ label="Année scolaire" value={eleve.annee} />
              <Champ label="Date d'inscription" value={eleve.dateInscription?.substring(0, 10)} />
            </div>
          </Carte>

          {/* CONTACTS */}
          <Carte icon={Phone} titre="Contacts" couleur={VIOLET} fond={VIOLET_SOFT}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Champ label="Téléphone de l'élève" value={eleve.telephone} />
              <Champ label="Email de l'élève" value={eleve.email} />
              <div className="col-span-2">
                <Champ label="Adresse" value={eleve.adresse} />
              </div>
            </div>

            {aUnTuteur && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">Parent / Tuteur</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <Champ label="Nom" value={nomTuteur} />
                  <Champ label="Lien de parenté" value={eleve.lienParente} />
                  <Champ label="Téléphone" value={eleve.telephoneTuteur} />
                  <Champ label="Email" value={eleve.emailTuteur} />
                </div>
              </div>
            )}
          </Carte>

          {/* ASSIDUITÉ */}
          <Carte icon={CalendarCheck} titre="Assiduité">
            {premierCycle ? (
              <>
                <Chiffre
                  label="Absences (bulletins mensuels)"
                  valeur={valeurAbsence(absences?.total)}
                  couleur={CORAL}
                  fond={CORAL_SOFT}
                />

                {!absencesLoading && !absencesError && absences?.parMois?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {absences.parMois.map((m) => (
                      <span
                        key={m.mois}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        {m.mois} : {m.absences}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Chiffre label="Cours manqués" valeur={valeurAbsence(absences?.cours)} />
                <Chiffre label="Jours d'absence" valeur={valeurAbsence(absences?.jours)} />
              </div>
            )}
          </Carte>

          {/* PAIEMENT */}
          <Carte icon={Wallet} titre="Paiement" couleur={TEAL} fond={TEAL_SOFT}>
            <div className="mb-3 flex items-end justify-between">
              <p className="text-xs text-slate-500">Scolarité payée</p>
              <p className="text-sm font-bold" style={{ color: soldee ? TEAL : INK }}>
                {pourcentage}%
              </p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pourcentage}%`,
                  background: soldee ? TEAL : `linear-gradient(90deg, ${GOLD}, ${GOLD_2})`,
                }}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Chiffre label="Total" valeur={formatMontant(eleve.montantTotal)} />
              <Chiffre label="Payé" valeur={formatMontant(eleve.montantPaye)} couleur={TEAL} fond={TEAL_SOFT} />
              <Chiffre
                label="Reste"
                valeur={formatMontant(eleve.resteAPayer)}
                couleur={reste > 0 ? CORAL : TEAL}
                fond={reste > 0 ? CORAL_SOFT : TEAL_SOFT}
              />
            </div>
          </Carte>
        </div>

        {/* ===== ACTIONS (toujours visibles) ===== */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              onClick={genererFicheRenseignement}
              disabled={generatingFiche}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingFiche ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Fiche
            </button>

            <button
              onClick={genererCertificatScolarite}
              disabled={generatingCertificat}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingCertificat ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Certificat
            </button>

            <button
              onClick={genererRapportPaiement}
              disabled={generatingPdf}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
            >
              {generatingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Paiements
            </button>
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
  const [generatingFormulaire, setGeneratingFormulaire] = useState(false);
  const [generatingListeClasse, setGeneratingListeClasse] = useState(false);
  const [generatingCarteId, setGeneratingCarteId] = useState(null);
  const [generatingCartesClasse, setGeneratingCartesClasse] = useState(false);
const telechargerCarteScolaire = async (eleve) => {
  if (!eleve?.id) {
    alert("Impossible de générer la carte : inscription introuvable.");
    return;
  }

  setGeneratingCarteId(eleve.id);

  try {
    const response = await api.get(
      `/cartes-scolaires/eleve/${eleve.id}/pdf`,
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
    link.download = `carte-scolaire-${eleve.matricule || eleve.id}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur génération carte scolaire :", error);

    if (error?.response?.data instanceof Blob) {
      try {
        const texte = await error.response.data.text();
        const json = JSON.parse(texte);

        alert(
          json?.message ||
            json?.error ||
            "Impossible de générer la carte scolaire."
        );
      } catch {
        alert("Impossible de générer la carte scolaire.");
      }
    } else {
      alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Impossible de générer la carte scolaire."
      );
    }
  } finally {
    setGeneratingCarteId(null);
  }
};
  const telechargerFormulaireVierge = async () => {
    setGeneratingFormulaire(true);

    try {
      const response = await api.get("/inscriptions/formulaire-vierge", {
        params: user?.ecole?.id ? { ecoleId: user.ecole.id } : {},
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "formulaire-inscription.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur génération formulaire vierge :", error);
      alert("Impossible de générer le formulaire.");
    } finally {
      setGeneratingFormulaire(false);
    }
  };
  
  const telechargerListeElevesClasse = async () => {
  if (!classeFilter) {
    alert("Veuillez sélectionner une classe.");
    return;
  }

  const inscriptionClasse = eleves.find(
    (e) => e.classeNom === classeFilter
  );

  if (!inscriptionClasse) {
    alert("Impossible de trouver la classe sélectionnée.");
    return;
  }

  if (!inscriptionClasse.classeId || !inscriptionClasse.anneeId) {
    console.error("Données de l'inscription :", inscriptionClasse);
    alert("Les informations de la classe ou de l'année sont introuvables.");
    return;
  }

  setGeneratingListeClasse(true);

  try {
    const response = await api.get(
      `/inscriptions/classe/${inscriptionClasse.classeId}/${inscriptionClasse.anneeId}/pdf`,
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
    link.download = `liste-eleves-${classeFilter}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error(
      "Erreur génération liste élèves :",
      error
    );

    if (error?.response?.data instanceof Blob) {
      try {
        const texte = await error.response.data.text();
        const json = JSON.parse(texte);

        alert(
          json?.message ||
          json?.error ||
          "Impossible de générer la liste."
        );
      } catch {
        alert("Impossible de générer la liste des élèves.");
      }
    } else {
      alert(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Impossible de générer la liste des élèves."
      );
    }
  } finally {
    setGeneratingListeClasse(false);
  }
};
const telechargerCartesClasse = async () => {
  if (!classeFilter) {
    alert("Veuillez sélectionner une classe.");
    return;
  }

  const inscriptionClasse = eleves.find((e) => e.classeNom === classeFilter);

  if (!inscriptionClasse?.classeId || !inscriptionClasse?.anneeId) {
    console.error("Données de l'inscription :", inscriptionClasse);
    alert("Les informations de la classe ou de l'année sont introuvables.");
    return;
  }

  setGeneratingCartesClasse(true);

  try {
    const response = await api.get(
      `/cartes-scolaires/classe/${inscriptionClasse.classeId}/pdf`,
      {
        params: { anneeScolaireId: inscriptionClasse.anneeId },
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `cartes-scolaires-${classeFilter}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur génération cartes de la classe :", error);

    const messageParDefaut = "Impossible de générer les cartes de la classe.";

    if (error?.response?.data instanceof Blob) {
      try {
        const texte = await error.response.data.text();
        const json = JSON.parse(texte);
        alert(json?.message || json?.error || messageParDefaut);
      } catch {
        alert(messageParDefaut);
      }
    } else {
      alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          messageParDefaut
      );
    }
  } finally {
    setGeneratingCartesClasse(false);
  }
};


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
          href="/dashboard/admin/eleves/inscriptions/re"
          className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
          style={{ background: TEAL }}
        >
          <Users size={18} />
          Réinscrire
        </Link>

        <button
          onClick={telechargerFormulaireVierge}
          disabled={generatingFormulaire}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generatingFormulaire ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <FileText size={18} />
              Formulaire vierge
            </>
          )}
        </button>
        <button
  onClick={telechargerListeElevesClasse}
  disabled={generatingListeClasse || !classeFilter}
  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
>
  {generatingListeClasse ? (
    <>
      <Loader2 size={18} className="animate-spin" />
      Génération...
    </>
  ) : (
    <>
      <Download size={18} />
      Liste de la classe
    </>
  )}
</button>
<button
  onClick={telechargerCartesClasse}
  disabled={generatingCartesClasse || !classeFilter}
  className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
  style={{ background: GOLD }}
>
  {generatingCartesClasse ? (
    <>
      <Loader2 size={18} className="animate-spin" />
      Génération des cartes...
    </>
  ) : (
    <>
      <IdCard size={18} />
      Cartes de la classe
    </>
  )}
</button>
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

  {/* Carte scolaire */}
  <button
    onClick={() => telechargerCarteScolaire(e)}
    disabled={generatingCarteId === e.id}
    title="Télécharger la carte scolaire"
    className="rounded-lg p-2 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
    style={{ background: INK }}
  >
    {generatingCarteId === e.id ? (
      <Loader2 size={16} className="animate-spin" />
    ) : (
      <IdCard size={16} />
    )}
  </button>

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
    disabled={
      busyId === e.id ||
      e.statut === "INSCRIT" ||
      e.statut === "VALIDE"
    }
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

  {/* Carte scolaire */}
  <button
    onClick={() => telechargerCarteScolaire(e)}
    disabled={generatingCarteId === e.id}
    title="Télécharger la carte scolaire"
    className="rounded-lg p-2 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
    style={{ background: INK }}
  >
    {generatingCarteId === e.id ? (
      <Loader2 size={16} className="animate-spin" />
    ) : (
      <IdCard size={16} />
    )}
  </button>

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
    disabled={
      busyId === e.id ||
      e.statut === "INSCRIT" ||
      e.statut === "VALIDE"
    }
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