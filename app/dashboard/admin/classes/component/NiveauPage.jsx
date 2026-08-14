"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import api from "../../../../../lib/api";

export default function NiveauPage() {

  const { user } = useAuth();

  const [nom, setNom] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [niveaux, setNiveaux] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingNom, setEditingNom] = useState("");
  const [editingCycleId, setEditingCycleId] = useState("");
  const [erreur, setErreur] = useState("");

  const load = async () => {
    const [n, c] = await Promise.all([
      api.get(`/niveaux/ecole/${user.ecole.id}`),
      api.get(`/cycles/ecole/${user.ecole.id}`)
    ]);
    setNiveaux(n.data);
    setCycles(c.data);
  };

  useEffect(() => {
    if (user?.ecole?.id) load();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;

    await api.post("/niveaux", {
      nom,
      cycleId: cycleId || null,
      ecoleId: user.ecole.id
    });

    setNom("");
    setCycleId("");
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce niveau ?")) return;
    await api.delete(`/niveaux/${id}`);
    load();
  };

  const startEdit = (n) => {
    setEditingId(n.id);
    setEditingNom(n.nom);
    setEditingCycleId(n.cycle?.id || "");
    setErreur("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingNom("");
    setEditingCycleId("");
  };

  const saveEdit = async (id) => {
    if (!editingNom.trim()) {
      setErreur("Le nom ne peut pas être vide");
      return;
    }

    try {
      await api.put(`/niveaux/${id}`, {
        nom: editingNom,
        cycleId: editingCycleId || null,
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
        <h2 className="font-bold">Créer un niveau</h2>

        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex: 10e, Terminale"
          className="border p-2 w-full mt-2"
        />

        <select
          value={cycleId}
          onChange={(e) => setCycleId(e.target.value)}
          className="border p-2 w-full mt-2"
        >
          <option value="">Cycle (optionnel)</option>
          {cycles.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>

        <button className="bg-blue-600 text-white px-4 py-2 mt-2">
          Ajouter
        </button>
      </form>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <table className="w-full border mt-2">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-1">Nom</th>
            <th className="border p-1">Cycle</th>
            <th className="border p-1">Action</th>
          </tr>
        </thead>

        <tbody>
          {niveaux.map(n => (
            <tr key={n.id}>
              <td className="border p-1">
                {editingId === n.id ? (
                  <input
                    value={editingNom}
                    onChange={(e) => setEditingNom(e.target.value)}
                    className="w-full border px-2 py-1"
                    autoFocus
                  />
                ) : n.nom}
              </td>
              <td className="border p-1">
                {editingId === n.id ? (
                  <select
                    value={editingCycleId}
                    onChange={(e) => setEditingCycleId(e.target.value)}
                    className="w-full border px-2 py-1"
                  >
                    <option value="">Aucun</option>
                    {cycles.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                ) : (n.cycle?.nom || "—")}
              </td>
              <td className="border p-1">
                {editingId === n.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(n.id)} className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded">
                      <Check size={14} /> Valider
                    </button>
                    <button onClick={cancelEdit} className="flex items-center gap-1 bg-gray-400 text-white px-2 py-1 rounded">
                      <X size={14} /> Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(n)} className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded">
                      <Pencil size={14} /> Modifier
                    </button>
                    <button onClick={() => handleDelete(n.id)} className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded">
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}

          {niveaux.length === 0 && (
            <tr>
              <td colSpan={3} className="border p-3 text-center text-gray-400">Aucun niveau pour l'instant</td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  );
}