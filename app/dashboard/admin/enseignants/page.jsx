"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";
import EnseignantForm from "./component/enseignantForm";// ⚠️ adapte le chemin réel
import Link from "next/link";


function ModalEdition({ enseignantId, onClose, onSaved }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-0 sm:p-4" onClick={onClose}>
      <div
        className="h-full w-full overflow-y-auto bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-end bg-white p-3">
          <button onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-slate-400 hover:bg-slate-100">
            ✕ Fermer
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
          <h2 className="text-lg font-semibold">
            Ajouter un enseignant
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-slate-400 hover:bg-slate-100"
          >
            ✕
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
        <div>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
            Gestion des enseignants
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Consultez, modifiez et gérez les enseignants de votre établissement.
          </p>
        </div>

        <button
          onClick={() => setModalAjoutOuvert(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          + Ajouter un enseignant
        </button>
      </div>

      {/* ===== VUE MOBILE : CARTES ===== */}
      <div className="space-y-3 sm:hidden">
        {loading && (
          <div className="rounded-lg bg-white p-4 text-center text-gray-400 shadow">
            Chargement...
          </div>
        )}

        {!loading && enseignants.length === 0 && (
          <div className="rounded-lg bg-white p-4 text-center text-gray-400 shadow">
            Aucun enseignant
          </div>
        )}

        {!loading && enseignants.map((e) => (
          <div key={e.id} className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800">
                  {e.prenom} {e.nom}
                </p>
                <p className="truncate text-xs text-slate-400">{e.telephone || "—"}</p>
              </div>
              <span className={`shrink-0 text-xs font-medium ${e.actif ? "text-emerald-600" : "text-rose-600"}`}>
                {e.actif ? "Actif" : "Inactif"}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <p><span className="text-slate-400">Spécialité :</span> {e.specialite || "—"}</p>
              <p><span className="text-slate-400">Contrat :</span> {e.typeContrat || "—"}</p>
            </div>

            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setEnseignantEnEdition(e.id)}
                className="flex-1 rounded bg-yellow-500 px-3 py-2 text-sm text-white hover:bg-yellow-600"
              >
                Modifier
              </button>
              <button
                onClick={() => toggleStatut(e.id)}
                className={`flex-1 rounded px-3 py-2 text-sm text-white ${e.actif ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                {e.actif ? "Inactiver" : "Activer"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ===== VUE DESKTOP : TABLEAU ===== */}
      <div className="hidden overflow-hidden rounded-lg bg-white shadow sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="p-3">Nom</th>
                <th className="p-3">Prénom</th>
                <th className="p-3">Téléphone</th>
                <th className="p-3">Spécialité</th>
                <th className="p-3">Contrat</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr><td colSpan="7" className="p-4 text-center text-gray-400">Chargement...</td></tr>
              )}

              {!loading && enseignants.map((e) => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{e.nom}</td>
                  <td className="p-3">{e.prenom}</td>
                  <td className="p-3">{e.telephone}</td>
                  <td className="p-3">{e.specialite || "—"}</td>
                  <td className="p-3">{e.typeContrat || "—"}</td>
                  <td className="p-3">
                    <span className={e.actif ? "text-emerald-600" : "text-rose-600"}>
                      {e.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="flex gap-2 p-3">
                    <button
                      onClick={() => setEnseignantEnEdition(e.id)}
                      className="rounded bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => toggleStatut(e.id)}
                      className={`rounded px-3 py-1 text-white ${e.actif ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                    >
                      {e.actif ? "Inactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && enseignants.length === 0 && (
                <tr><td colSpan="7" className="p-4 text-center text-gray-400">Aucun enseignant</td></tr>
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
  <ModalAjout
    onClose={() => setModalAjoutOuvert(false)}
    onSaved={loadEnseignants}
  />
)}
    </div>
  );
}