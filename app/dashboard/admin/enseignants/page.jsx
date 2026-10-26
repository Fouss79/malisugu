"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";
import EnseignantForm from "./component/enseignantForm"; // ⚠️ adapte le chemin réel
import {
  Plus,
  X,
  Pencil,
  Power,
  Phone,
  GraduationCap,
  FileText,
  Users,
  Eye,
  Download,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";

/* =========================================================
   PALETTE (identique au reste de l'application)
========================================================= */
const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const CORAL = "#D2593F";
const CORAL_SOFT = "#F7E2DB";

/* =========================================================
   HOOK : fermeture par Échap + blocage du scroll arrière-plan
========================================================= */
function useModalBehavior(onClose) {
  useEffect(() => {
    const onKey = (ev) => ev.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);
}

/* =========================================================
   PETITS COMPOSANTS
========================================================= */
function Avatar({ prenom, nom, size = "h-10 w-10 text-sm" }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${size}`}
      style={{ background: TEAL_SOFT, color: TEAL }}
    >
      {prenom?.charAt(0)}
      {nom?.charAt(0)}
    </div>
  );
}

function StatutBadge({ actif }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={
        actif
          ? { background: TEAL_SOFT, color: TEAL }
          : { background: CORAL_SOFT, color: CORAL }
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: actif ? TEAL : CORAL }}
      />
      {actif ? "Actif" : "Inactif"}
    </span>
  );
}

function InfoItem({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
        {icon}
        {label}
      </p>
      <p className="break-words text-sm font-semibold text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 sm:p-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
        style={{ background: bg, color }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none text-slate-800 sm:text-2xl">
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/2 rounded bg-slate-100" />
          <div className="h-3 w-1/3 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 h-8 rounded-lg bg-slate-100" />
    </div>
  );
}

function EmptyState({ search, onAdd }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-slate-100">
      <span
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: TEAL_SOFT, color: TEAL }}
      >
        <Users size={26} />
      </span>
      <h3 className="text-base font-semibold text-slate-800">
        {search ? "Aucun résultat" : "Aucun enseignant pour le moment"}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        {search
          ? "Essayez avec un autre nom, une autre spécialité ou un autre filtre."
          : "Commencez par ajouter votre premier enseignant."}
      </p>
      {!search && (
        <button
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
          style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
        >
          <Plus size={16} />
          Ajouter un enseignant
        </button>
      )}
    </div>
  );
}

/* =========================================================
   MODALE : INFOS ENSEIGNANT
========================================================= */
function ModalInfoEnseignant({ enseignant, onClose, anneeId }) {
  useModalBehavior(onClose);
  const [downloading, setDownloading] = useState(false);

  if (!enseignant) return null;

  const formatMontant = (montant) =>
    montant === null || montant === undefined
      ? "—"
      : new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  const handleRapportPDF = async () => {
    try {
      if (!anneeId) {
        alert("Aucune année scolaire active trouvée.");
        return;
      }
      setDownloading(true);

      const response = await api.get(
        `/paiements/enseignant/${enseignant.id}/rapport-pdf`,
        { params: { anneeId }, responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rapport-paiements-${enseignant.nom}-${enseignant.prenom}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur génération rapport PDF :", error);
      alert("Impossible de générer le rapport PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
        >
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white">
              Informations de l'enseignant
            </h2>
            <p className="mt-0.5 truncate text-sm text-white/70">
              {enseignant.prenom} {enseignant.nom}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENU */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-4">
            <Avatar
              prenom={enseignant.prenom}
              nom={enseignant.nom}
              size="h-14 w-14 text-lg"
            />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-slate-800">
                {enseignant.prenom} {enseignant.nom}
              </h3>
              <p className="truncate text-sm text-slate-500">
                {enseignant.specialite || "Enseignant"}
              </p>
            </div>
            <StatutBadge actif={enseignant.actif} />
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <InfoItem label="Nom" value={enseignant.nom} />
            <InfoItem label="Prénom" value={enseignant.prenom} />
            <InfoItem
              label="Téléphone"
              value={enseignant.telephone}
              icon={<Phone size={14} />}
            />
            <InfoItem
              label="Spécialité"
              value={enseignant.specialite}
              icon={<GraduationCap size={14} />}
            />
            <InfoItem
              label="Type de contrat"
              value={enseignant.typeContrat}
              icon={<FileText size={14} />}
            />
            <InfoItem label="Matricule" value={enseignant.matricule} />
            <InfoItem
              label="Taux horaire"
              value={formatMontant(enseignant.tauxHoraire)}
            />
            <InfoItem
              label="Salaire de base"
              value={formatMontant(enseignant.salaireBase)}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <button
            onClick={handleRapportPDF}
            disabled={downloading}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ background: `linear-gradient(135deg, ${TEAL}, #236f68)` }}
          >
            {downloading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Download size={18} />
            )}
            {downloading ? "Génération..." : "Rapport des paiements PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MODALES : ÉDITION / AJOUT
========================================================= */
function ModalEdition({ enseignantId, onClose, onSaved }) {
  useModalBehavior(onClose);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="h-full w-full overflow-y-auto bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 p-4 backdrop-blur">
          <h2
            className="flex items-center gap-2 text-lg font-semibold"
            style={{ color: INK }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: `${GOLD}1A`, color: "#8A6A21" }}
            >
              <Pencil size={15} />
            </span>
            Modifier l'enseignant
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <EnseignantForm
            enseignantId={enseignantId}
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

function ModalAjout({ onClose, onSaved }) {
  useModalBehavior(onClose);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="h-full w-full overflow-y-auto bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 p-4 backdrop-blur">
          <h2
            className="flex items-center gap-2 text-lg font-semibold"
            style={{ color: INK }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: TEAL_SOFT, color: TEAL }}
            >
              <Plus size={16} />
            </span>
            Ajouter un enseignant
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <EnseignantForm
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
   PAGE
========================================================= */
export default function EnseignantPage() {
  const { user } = useAuth();

  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anneeId, setAnneeId] = useState(null);

  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState("tous"); // tous | actifs | inactifs

  const [modalAjoutOuvert, setModalAjoutOuvert] = useState(false);
  const [enseignantEnEdition, setEnseignantEnEdition] = useState(null);
  const [enseignantSelectionne, setEnseignantSelectionne] = useState(null);

  const loadAnneeActive = async () => {
    if (!user?.ecole?.id) return;
    try {
      const res = await api.get(`/annees/active/${user.ecole.id}`);
      setAnneeId(res.data?.id || null);
    } catch (err) {
      console.error("Erreur récupération année scolaire active :", err);
      setAnneeId(null);
    }
  };

  const loadEnseignants = async () => {
    if (!user?.ecole?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/enseignants/ecole/${user.ecole.id}`);
      setEnseignants(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setEnseignants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.ecole?.id) return;
    loadEnseignants();
    loadAnneeActive();
  }, [user]);

  const toggleStatut = async (id) => {
    try {
      const res = await api.put(`/enseignants/toggle/${id}`);
      setEnseignants((prev) => prev.map((e) => (e.id === id ? res.data : e)));
    } catch (err) {
      console.error(err);
    }
  };

  /* ---- Stats + filtrage ---- */
  const stats = useMemo(() => {
    const actifs = enseignants.filter((e) => e.actif).length;
    return {
      total: enseignants.length,
      actifs,
      inactifs: enseignants.length - actifs,
    };
  }, [enseignants]);

  const liste = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enseignants.filter((e) => {
      if (filtre === "actifs" && !e.actif) return false;
      if (filtre === "inactifs" && e.actif) return false;
      if (!q) return true;
      return [e.nom, e.prenom, e.telephone, e.specialite, e.typeContrat]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [enseignants, search, filtre]);

  const filtres = [
    { key: "tous", label: "Tous" },
    { key: "actifs", label: "Actifs" },
    { key: "inactifs", label: "Inactifs" },
  ];

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-4 sm:py-6 lg:px-6">
      {/* ===== EN-TÊTE ===== */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm"
            style={{
              background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`,
              color: INK,
            }}
          >
            <Users size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
              Gestion des enseignants
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Consultez, modifiez et gérez les enseignants de votre
              établissement.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalAjoutOuvert(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:w-auto"
          style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
        >
          <Plus size={18} />
          Ajouter un enseignant
        </button>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          icon={<Users size={20} />}
          label="Total"
          value={stats.total}
          color={INK}
          bg="#E8EBF2"
        />
        <StatCard
          icon={<UserCheck size={20} />}
          label="Actifs"
          value={stats.actifs}
          color={TEAL}
          bg={TEAL_SOFT}
        />
        <StatCard
          icon={<UserX size={20} />}
          label="Inactifs"
          value={stats.inactifs}
          color={CORAL}
          bg={CORAL_SOFT}
        />
      </div>

      {/* ===== RECHERCHE + FILTRES ===== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un nom, une spécialité, un téléphone..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20"
          />
        </div>

        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {filtres.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              className={`flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition sm:flex-none ${
                filtre === f.key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== CHARGEMENT ===== */}
      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* ===== ÉTAT VIDE ===== */}
      {!loading && liste.length === 0 && (
        <EmptyState
          search={search || filtre !== "tous"}
          onAdd={() => setModalAjoutOuvert(true)}
        />
      )}

      {/* ===== VUE MOBILE + TABLETTE : CARTES (< lg) ===== */}
      {!loading && liste.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
          {liste.map((e) => (
            <div
              key={e.id}
              className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <Avatar prenom={e.prenom} nom={e.nom} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">
                    {e.prenom} {e.nom}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400">
                    <Phone size={11} />
                    {e.telephone || "—"}
                  </p>
                </div>
                <StatutBadge actif={e.actif} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                <p className="flex items-center gap-1.5 truncate">
                  <GraduationCap size={13} className="shrink-0 text-slate-400" />
                  <span className="truncate">{e.specialite || "—"}</span>
                </p>
                <p className="flex items-center gap-1.5 truncate">
                  <FileText size={13} className="shrink-0 text-slate-400" />
                  <span className="truncate">{e.typeContrat || "—"}</span>
                </p>
              </div>

              <div className="mt-auto flex gap-2 pt-3">
                <button
                  onClick={() => setEnseignantSelectionne(e)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition hover:brightness-95"
                  style={{ background: `${TEAL}18`, color: TEAL }}
                >
                  <Eye size={14} />
                  Voir
                </button>
                <button
                  onClick={() => setEnseignantEnEdition(e.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition hover:brightness-95"
                  style={{ background: `${GOLD}1F`, color: "#8A6A21" }}
                >
                  <Pencil size={14} />
                  Modifier
                </button>
                <button
                  onClick={() => toggleStatut(e.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-white transition hover:brightness-110"
                  style={{ background: e.actif ? CORAL : TEAL }}
                >
                  <Power size={14} />
                  {e.actif ? "Inactiver" : "Activer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== VUE DESKTOP : TABLEAU (≥ lg) ===== */}
      {(loading || liste.length > 0) && (
        <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead style={{ background: "#F8F7F2" }}>
                <tr className="text-left">
                  {["Enseignant", "Téléphone", "Spécialité", "Contrat", "Statut"].map(
                    (h) => (
                      <th
                        key={h}
                        className="p-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {h}
                      </th>
                    )
                  )}
                  <th className="p-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                        <div
                          className="h-4 w-4 animate-spin rounded-full border-2"
                          style={{
                            borderColor: GOLD,
                            borderTopColor: "transparent",
                          }}
                        />
                        Chargement...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  liste.map((e) => (
                    <tr
                      key={e.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/80"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar prenom={e.prenom} nom={e.nom} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">
                              {e.prenom} {e.nom}
                            </p>
                            {e.matricule && (
                              <p className="text-xs text-slate-400">
                                {e.matricule}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <Phone size={13} className="text-slate-400" />
                          {e.telephone || "—"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {e.specialite || "—"}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {e.typeContrat || "—"}
                      </td>
                      <td className="p-3.5">
                        <StatutBadge actif={e.actif} />
                      </td>
                      <td className="p-3.5">
                        {/* ✅ le flex est dans un div, pas sur le td */}
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEnseignantSelectionne(e)}
                            title="Voir les détails"
                            aria-label="Voir les détails"
                            className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:brightness-95"
                            style={{ background: `${TEAL}18`, color: TEAL }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setEnseignantEnEdition(e.id)}
                            title="Modifier"
                            aria-label="Modifier"
                            className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:brightness-95"
                            style={{ background: `${GOLD}1F`, color: "#8A6A21" }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => toggleStatut(e.id)}
                            title={e.actif ? "Inactiver" : "Activer"}
                            aria-label={e.actif ? "Inactiver" : "Activer"}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:brightness-110"
                            style={{ background: e.actif ? CORAL : TEAL }}
                          >
                            <Power size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MODALES ===== */}
      {enseignantEnEdition && (
        <ModalEdition
          enseignantId={enseignantEnEdition}
          onClose={() => setEnseignantEnEdition(null)}
          onSaved={loadEnseignants}
        />
      )}
      {modalAjoutOuvert && (
        <ModalAjout
          onClose={() => setModalAjoutOuvert(false)}
          onSaved={loadEnseignants}
        />
      )}
      {enseignantSelectionne && (
        <ModalInfoEnseignant
          enseignant={enseignantSelectionne}
          anneeId={anneeId}
          onClose={() => setEnseignantSelectionne(null)}
        />
      )}
    </div>
  );
}