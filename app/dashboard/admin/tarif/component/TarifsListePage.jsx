"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { Pencil, Trash2, X } from "lucide-react";
import api from "../../../../../lib/api";

function formatMontant(valeur) {
  if (valeur == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(valeur) + " FCFA";
}

// --- Modal de modification ---
function ModifierTarifModal({ tarif, onClose, onSaved, ecoleId }) {
  const [montant, setMontant] = useState(tarif.montant);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post(`/tarifs`, null, {
        params: {
          ecoleId,
          niveauId: tarif.niveauId,
          anneeId: tarif.anneeScolaireId,
          codeTypeFrais: tarif.typeFraisCode,
          montant,
        },
      });
      onSaved();
    } catch (err) {
      alert("Erreur lors de la modification");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Modifier le tarif</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <p className="mb-3 text-sm text-slate-500">
          {tarif.niveauNom} — {tarif.typeFraisLibelle} — {tarif.anneeNom}
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="number"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            required
          />
          <button
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TarifsListePage({ anneeFilter }) {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  const [tarifs, setTarifs] = useState([]);


  const [loading, setLoading] = useState(true);
  const [tarifAModifier, setTarifAModifier] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const safeArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    return [];
  };

  const loadTarifs = async () => {
    if (!ecoleId) return;
    setLoading(true);
    try {
      const url = anneeFilter
        ? `/tarifs/ecole/${ecoleId}/annee/${anneeFilter}`
        : `/tarifs/ecole/${ecoleId}`;
      const res = await api.get(url);
      setTarifs(safeArray(res.data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    loadTarifs();
  }, [ecoleId, anneeFilter]);

  const supprimer = async (id) => {
    try {
      await api.delete(`/tarifs/${id}`);
      setTarifs(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const tarifsTries = useMemo(
    () => [...tarifs].sort((a, b) => (a.niveauNom || "").localeCompare(b.niveauNom || "")),
    [tarifs]
  );

  return (
    <div className="space-y-5">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
        
          <p className="text-sm text-slate-500">
            {loading ? "Chargement..." : `${tarifsTries.length} tarif${tarifsTries.length > 1 ? "s" : ""}`}
          </p>
        </div>

       
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Niveau</th>
                <th className="px-4 py-3 font-medium">Type de frais</th>
                <th className="px-4 py-3 font-medium">Année scolaire</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    Chargement des tarifs...
                  </td>
                </tr>
              )}

              {!loading && tarifsTries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    Aucun tarif enregistré pour l'instant.
                  </td>
                </tr>
              )}

              {!loading && tarifsTries.map(t => (
                <tr key={t.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-slate-800">{t.niveauNom}</td>
                  <td className="px-4 py-3 text-slate-500">{t.typeFraisLibelle}</td>
                  <td className="px-4 py-3 text-slate-500">{t.anneeNom}</td>
                  <td className="px-4 py-3 font-semibold text-indigo-600">
                    {formatMontant(t.montant)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setTarifAModifier(t)}
                        className="flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                      >
                        <Pencil size={14} />
                        Modifier
                      </button>

                      {confirmDeleteId === t.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => supprimer(t.id)}
                            className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-700"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(t.id)}
                          className="flex items-center gap-1 rounded-md bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {tarifAModifier && (
        <ModifierTarifModal
          tarif={tarifAModifier}
          ecoleId={ecoleId}
          onClose={() => setTarifAModifier(null)}
          onSaved={() => {
            setTarifAModifier(null);
            loadTarifs();
          }}
        />
      )}
    </div>
  );
}