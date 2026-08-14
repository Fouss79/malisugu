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
  XCircle
} from "lucide-react";
import Link from "next/link";
import EleveForm from "../Component/ElevePage";
import api from "../../../../../lib/api";

const STATUT_STYLES = {
  PREINSCRIT: "bg-amber-50 text-amber-700 ring-amber-200",
  INSCRIT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  VALIDE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REFUSE: "bg-rose-50 text-rose-700 ring-rose-200"
};

function StatutBadge({ statut }) {
  const style = STATUT_STYLES[statut] || "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statut}
    </span>
  );
}

function Avatar({ nom, prenom, sexe, size = "h-8 w-8 text-xs" }) {
  const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
  const color = sexe === "F" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${size} ${color}`}>
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

function formatMontant(valeur) {
  if (valeur == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(valeur) + " FCFA";
}
function ModalAjout({ onClose, onSaved }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">
            Ajouter un élève
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 hover:bg-slate-100"
          >
            ✕
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">
            Modifier l'élève
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 hover:bg-slate-100"
          >
            ✕
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
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  if (!eleve) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <Avatar nom={eleve.nom} prenom={eleve.prenom} sexe={eleve.sexe} size="h-11 w-11 text-sm" />
            <div>
              <h2 className="font-semibold text-slate-900">{eleve.prenom} {eleve.nom}</h2>
              <p className="text-xs text-slate-400">Matricule {eleve.matricule || "—"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenu */}
       {/* Contenu */}
<div className="space-y-6 p-5">

  <div>
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-600">
      Identité
    </h3>
    <div className="grid grid-cols-2 gap-4">
      <InfoRow label="Nom" value={eleve.nom} />
      <InfoRow label="Prénom" value={eleve.prenom} />
      <InfoRow label="Date de naissance" value={eleve.dateNaissance} />
      <InfoRow label="Lieu de naissance" value={eleve.lieuNaissance} />
      <InfoRow label="Sexe" value={eleve.sexe === "F" ? "Fille" : "Garçon"} />
      <InfoRow label="Nationalité" value={eleve.nationalite} />
      <InfoRow label="Matricule" value={eleve.matricule} />
      <InfoRow label="Groupe sanguin" value={eleve.groupeSanguin} />
    </div>
    {eleve.allergiesMaladies && (
      <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 ring-1 ring-inset ring-amber-100">
        <span className="font-medium">Allergies / maladies : </span>
        {eleve.allergiesMaladies}
      </div>
    )}
  </div>

  <div>
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-600">
      Contact élève
    </h3>
    <div className="grid grid-cols-2 gap-4">
      <InfoRow label="Adresse" value={eleve.adresse} />
      <InfoRow label="Téléphone" value={eleve.telephone} />
      <InfoRow label="Email" value={eleve.email} />
    </div>
  </div>

  {(eleve.nomTuteur || eleve.telephoneTuteur) && (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-600">
        Parent / Tuteur
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <InfoRow label="Nom" value={`${eleve.prenomTuteur ?? ""} ${eleve.nomTuteur ?? ""}`.trim() || "—"} />
        <InfoRow label="Lien de parenté" value={eleve.lienParente} />
        <InfoRow label="Téléphone" value={eleve.telephoneTuteur} />
        <InfoRow label="Email" value={eleve.emailTuteur} />
      </div>
    </div>
  )}

  <div>
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-600">
      Scolarité
    </h3>
    <div className="grid grid-cols-2 gap-4">
      <InfoRow label="Classe" value={eleve.classeNom} />
      <InfoRow label="Année scolaire" value={eleve.annee}  />
      <InfoRow label="Date d'inscription" value={eleve.dateInscription?.substring(0, 10)} />
      <div>
        <p className="text-xs font-medium text-slate-400">Statut</p>
        <div className="mt-1"><StatutBadge statut={eleve.statut} /></div>
      </div>
    </div>
  </div>

  <div>
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-600">
      Paiement
    </h3>
    <div className="grid grid-cols-3 gap-4">
      <InfoRow label="Montant total" value={formatMontant(eleve.montantTotal)} />
      <InfoRow label="Payé" value={formatMontant(eleve.montantPaye)} />
      <InfoRow label="Reste à payer" value={formatMontant(eleve.resteAPayer)} />
    </div>
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
      const res = await api.get(
        `/inscriptions/ecole/${user.ecole.id}/active`
      );
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
    console.log("➡️ Changement statut :", { id, action });

    const response = await api.put(`/inscriptions/${id}/${action}`);

    console.log("✅ Réponse backend :", response.data);

    await loadEleves();  // ✅ nom correct de la fonction

  } catch (error) {
    console.error("❌ ERREUR CHANGEMENT STATUT");
    console.error("Status :", error?.response?.status);
    console.error("Data :", error?.response?.data);
    console.error("Message :", error?.message);
    console.error("URL :", error?.config?.url);

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
    () => [...new Set(eleves.map(e => e.classeNom).filter(Boolean))],
    [eleves]
  );

  const filteredEleves = useMemo(() => {
    return eleves
      .filter(e => {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Liste des élèves</h1>
          <p className="text-sm text-slate-500">
            {loading ? "Chargement..." : `${filteredEleves.length} élève${filteredEleves.length > 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un nom, un matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {/* SELECT CLASSE */}
          <select
            value={classeFilter}
            onChange={(e) => setClasseFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-indigo-400"
          >
            <option value="">Toutes les classes</option>
            {classesUniques.map((classe) => (
              <option key={classe} value={classe}>{classe}</option>
            ))}
          </select>

 {/* ACTIONS TABLEAU */}
        </div>

      </div>
      <div className="flex justify-center gap-3">
  <button
    onClick={() => setModalAjoutOuvert(true)}
    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
  >
    <Plus size={18} />
    Ajouter
  </button>

  <Link
    href="/dashboard/admin/eleves/reinscription"
    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
  >
    <Users size={18} />
    Réinscrire
  </Link>
</div>


      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Élève</th>
                <th className="px-4 py-3 font-medium">Matricule</th>
                <th className="px-4 py-3 font-medium">Classe</th>
                <th className="px-4 py-3 font-medium">Date naissance</th>
                <th className="px-4 py-3 font-medium">Sexe</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr>
                  <td colSpan={COLONNES} className="px-4 py-10 text-center text-sm text-slate-400">
                    Chargement des élèves...
                  </td>
                </tr>
              )}

              {!loading && filteredEleves.length === 0 && (
                <tr>
                  <td colSpan={COLONNES} className="px-4 py-14">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <Users className="text-slate-400" size={22} />
                      </div>
                      <p className="text-sm font-medium text-slate-600">Aucun élève trouvé</p>
                      <p className="text-xs text-slate-400">
                        Essayez un autre nom, matricule ou changez de filtre de classe.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredEleves.map((e) => (
                <tr key={e.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar nom={e.nom} prenom={e.prenom} sexe={e.sexe} />
                      <div>
                        <p className="font-medium text-slate-800">{e.prenom} {e.nom}</p>
                        <p className="text-xs text-slate-400">{e.classeNom || "Non affecté"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{e.matricule}</td>
                  <td className="px-4 py-3 text-slate-500">{e.classeNom || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{e.dateNaissance}</td>
                  <td className="px-4 py-3 text-slate-500">{e.sexe === "F" ? "Fille" : "Garçon"}</td>
                  <td className="px-4 py-3">
                    <StatutBadge statut={e.statut} />
                  </td>
                
                 <td className="px-4 py-3">
  <div className="flex justify-end gap-2">
  {/* Détails */}
  <button
    onClick={() => setEleveDetail(e)}
    title="Voir détails"
    className="rounded-lg bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
  >
    <Eye size={16} />
  </button>


  {/* Modifier */}
  <button
    onClick={() => setEleveEnEdition(e.id)}
    title="Modifier"
    className="rounded-lg bg-amber-500 p-2 text-white transition hover:bg-amber-600"
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
    className="rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
  >
    <Check size={16} />
  </button>


  {/* Rejeter */}
  <button
    onClick={() => changerStatut(e.id, "rejeter")}
    disabled={
      busyId === e.id ||
      e.statut === "REJETE"
    }
    title="Rejeter"
    className="rounded-lg bg-rose-600 p-2 text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
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

      {/* MODAL DÉTAIL */}
      {modalAjoutOuvert && (
  <ModalAjout
    onClose={() => setModalAjoutOuvert(false)}
    onSaved={loadEleves}
  />
)}

{eleveEnEdition && (
  <ModalEdition
    eleveId={eleveEnEdition}
    onClose={() => setEleveEnEdition(null)}
    onSaved={loadEleves}
  />
)}

<EleveDetailModal
  eleve={eleveDetail}
  onClose={() => setEleveDetail(null)}
/>
    </div>
  );
}