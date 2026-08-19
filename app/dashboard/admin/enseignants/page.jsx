"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";
import EnseignantForm from "./component/enseignantForm"; // ⚠️ adapte le chemin réel
import Link from "next/link";
import {
  Plus,
  X,
  Pencil,
  Power,
  Phone,
  GraduationCap,
  FileText,
  Users,
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

function ModalEdition({ enseignantId, onClose, onSaved }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-0 sm:p-4" onClick={onClose}>
      <div
        className="h-full w-full overflow-y-auto bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-end bg-white p-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            <X size={15} />
            Fermer
          </button>
        </div>
        <div className="px-2 pb-6">
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="h-full w-full overflow-y-auto bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
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
            Ajouter un enseignant
          </h2>

          <button
            onClick={onClose}
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

function StatutBadge({ actif }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={actif ? { background: TEAL_SOFT, color: TEAL } : { background: CORAL_SOFT, color: CORAL }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: actif ? TEAL : CORAL }}
      />
      {actif ? "Actif" : "Inactif"}
    </span>
  );
}

export default function EnseignantPage() {
  const { user } = useAuth();

  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAjoutOuvert, setModalAjoutOuvert] = useState(false);
  const [enseignantEnEdition, setEnseignantEnEdition] = useState(null);

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
    loadEnseignants();
  }, [user]);

  const toggleStatut = async (id) => {
    try {
      const res = await api.put(`/enseignants/toggle/${id}`);
      setEnseignants((prev) => prev.map((e) => (e.id === id ? res.data : e)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen space-y-4 px-3 py-4 sm:px-0 sm:py-0">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`, color: INK }}
          >
            <Users size={20} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
              Gestion des enseignants
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Consultez, modifiez et gérez les enseignants de votre établissement.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalAjoutOuvert(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white shadow-sm transition hover:brightness-110"
          style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
        >
          <Plus size={18} />
          Ajouter un enseignant
        </button>
      </div>

      {/* ===== VUE MOBILE : CARTES ===== */}
      <div className="space-y-3 sm:hidden">
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-white p-4 text-center text-sm text-slate-400 shadow">
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: GOLD, borderTopColor: "transparent" }}
            />
            Chargement...
          </div>
        )}

        {!loading && enseignants.length === 0 && (
          <div className="rounded-lg bg-white p-4 text-center text-sm text-slate-400 shadow">
            Aucun enseignant
          </div>
        )}

        {!loading &&
          enseignants.map((e) => (
            <div key={e.id} className="rounded-xl bg-white p-4 shadow-sm shadow-slate-200/40">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
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

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-slate-400" />
                  {e.specialite || "—"}
                </p>
                <p className="flex items-center gap-1.5">
                  <FileText size={13} className="text-slate-400" />
                  {e.typeContrat || "—"}
                </p>
              </div>

              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => setEnseignantEnEdition(e.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:brightness-95"
                  style={{ background: `${GOLD}1A`, color: "#8A6A21" }}
                >
                  <Pencil size={14} />
                  Modifier
                </button>
                <button
                  onClick={() => toggleStatut(e.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:brightness-110"
                  style={{ background: e.actif ? CORAL : TEAL }}
                >
                  <Power size={14} />
                  {e.actif ? "Inactiver" : "Activer"}
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* ===== VUE DESKTOP : TABLEAU ===== */}
      <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm shadow-slate-200/40 sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead style={{ background: "#F8F7F2" }}>
              <tr className="text-left">
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Nom</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Prénom</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Téléphone</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Spécialité</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Contrat</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7" className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <div
                        className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                        style={{ borderColor: GOLD, borderTopColor: "transparent" }}
                      />
                      Chargement...
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                enseignants.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">{e.nom}</td>
                    <td className="p-3 text-slate-600">{e.prenom}</td>
                    <td className="p-3 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" />
                        {e.telephone || "—"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{e.specialite || "—"}</td>
                    <td className="p-3 text-slate-600">{e.typeContrat || "—"}</td>
                    <td className="p-3">
                      <StatutBadge actif={e.actif} />
                    </td>
                    <td className="flex gap-2 p-3">
                      <button
                        onClick={() => setEnseignantEnEdition(e.id)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition hover:brightness-95"
                        style={{ background: `${GOLD}1A`, color: "#8A6A21" }}
                      >
                        <Pencil size={14} />
                        Modifier
                      </button>
                      <button
                        onClick={() => toggleStatut(e.id)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110"
                        style={{ background: e.actif ? CORAL : TEAL }}
                      >
                        <Power size={14} />
                        {e.actif ? "Inactiver" : "Activer"}
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && enseignants.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-sm text-slate-400">
                    Aucun enseignant
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {enseignantEnEdition && (
        <ModalEdition
          enseignantId={enseignantEnEdition}
          onClose={() => setEnseignantEnEdition(null)}
          onSaved={loadEnseignants}
        />
      )}
      {modalAjoutOuvert && (
        <ModalAjout onClose={() => setModalAjoutOuvert(false)} onSaved={loadEnseignants} />
      )}
    </div>
  );
}