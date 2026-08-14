"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import api from "../../../../../lib/api";

export default function SeriePage() {

  const { user } = useAuth();

  const [nom, setNom] = useState("");
  const [series, setSeries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingNom, setEditingNom] = useState("");
  const [erreur, setErreur] = useState("");

  const load = async () => {
    const res = await api.get(`/series/ecole/${user.ecole.id}`);
    setSeries(res.data);
  };

  useEffect(() => {
    if (user?.ecole?.id) load();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;

    await api.post("/series", {
      nom,
      ecoleId: user.ecole.id
    });

    setNom("");
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette série ?")) return;
    // ⚠️ corrigé — URL relative remplacée par l'URL complète du back
    await api.delete(`/series/${id}`);
    load();
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditingNom(s.nom);
    setErreur("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingNom("");
  };

  const saveEdit = async (id) => {
    if (!editingNom.trim()) {
      setErreur("Le nom ne peut pas être vide");
      return;
    }

    try {
      await api.put(`/series/${id}`, {
        nom: editingNom,
        ecoleId: user.ecole.id
      });
      cancelEdit();
      load();
    } catch (err) {
      console.error(err);
      setErreur("Erreur lors de la modification");
    }
  };

  return (
    <div className="p-2 space-y-6">

      <form onSubmit={handleSubmit} className="bg-white p-2 shadow rounded">
        <h2 className="font-bold">Créer une série</h2>

        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex: S, L, E"
          className="border p-2 w-full mt-2"
        />

        <button className="bg-blue-600 text-white px-4 py-2 mt-2">
          Ajouter
        </button>
      </form>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-1">Nom</th>
            <th className="border p-1">Action</th>
          </tr>
        </thead>

        <tbody>
          {series.map(s => (
            <tr key={s.id}>
              <td className="border p-1">
                {editingId === s.id ? (
                  <input
                    value={editingNom}
                    onChange={(e) => setEditingNom(e.target.value)}
                    className="w-full border px-2 py-1"
                    autoFocus
                  />
                ) : (
                  s.nom
                )}
              </td>
              <td className="border p-1">
                {editingId === s.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(s.id)}
                      className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded"
                    >
                      <Check size={14} />
                      Valider
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 bg-gray-400 text-white px-2 py-1 rounded"
                    >
                      <X size={14} />
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      <Pencil size={14} />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded"
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}

          {series.length === 0 && (
            <tr>
              <td colSpan={2} className="border p-3 text-center text-gray-400">
                Aucune série pour l'instant
              </td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  );
}