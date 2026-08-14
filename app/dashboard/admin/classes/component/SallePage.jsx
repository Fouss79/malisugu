"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import api from "../../../../../lib/api";

export default function SallePage() {

  const { user } = useAuth();

  const [nom, setNom] = useState("");
  const [capacite, setCapacite] = useState("");
  const [salles, setSalles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingNom, setEditingNom] = useState("");
  const [editingCapacite, setEditingCapacite] = useState("");
  const [erreur, setErreur] = useState("");

  const load = async () => {
    const res = await api.get(`/salles/ecole/${user.ecole.id}`);
    setSalles(res.data);
  };

  useEffect(() => {
    if (user?.ecole?.id) load();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;

    await api.post("/salles", {
      nom,
      capacite: capacite ? Number(capacite) : null,
      ecoleId: user.ecole.id
    });

    setNom("");
    setCapacite("");
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette salle ?")) return;
    await api.delete(`/salles/${id}`);
    load();
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditingNom(s.nom);
    setEditingCapacite(s.capacite || "");
    setErreur("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingNom("");
    setEditingCapacite("");
  };

  const saveEdit = async (id) => {
    if (!editingNom.trim()) {
      setErreur("Le nom ne peut pas être vide");
      return;
    }

    try {
      await api.put(`/salles/${id}`, {
        nom: editingNom,
        capacite: editingCapacite ? Number(editingCapacite) : null,
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
        <h2 className="font-bold">Créer une salle</h2>

        <div className="flex gap-2 mt-2">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Salle 12, Labo Physique"
            className="border p-2 flex-1"
          />
          <input
            type="number"
            value={capacite}
            onChange={(e) => setCapacite(e.target.value)}
            placeholder="Capacité"
            className="border p-2 w-32"
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 mt-2">
          Ajouter
        </button>
      </form>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-1">Nom</th>
            <th className="border p-1">Capacité</th>
            <th className="border p-1">Action</th>
          </tr>
        </thead>

        <tbody>
          {salles.map(s => (
            <tr key={s.id}>
              <td className="border p-1">
                {editingId === s.id ? (
                  <input
                    value={editingNom}
                    onChange={(e) => setEditingNom(e.target.value)}
                    className="w-full border px-2 py-1"
                    autoFocus
                  />
                ) : s.nom}
              </td>
              <td className="border p-1">
                {editingId === s.id ? (
                  <input
                    type="number"
                    value={editingCapacite}
                    onChange={(e) => setEditingCapacite(e.target.value)}
                    className="w-full border px-2 py-1"
                  />
                ) : (s.capacite || "—")}
              </td>
              <td className="border p-1">
                {editingId === s.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(s.id)} className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded">
                      <Check size={14} /> Valider
                    </button>
                    <button onClick={cancelEdit} className="flex items-center gap-1 bg-gray-400 text-white px-2 py-1 rounded">
                      <X size={14} /> Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(s)} className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded">
                      <Pencil size={14} /> Modifier
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded">
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}

          {salles.length === 0 && (
            <tr>
              <td colSpan={3} className="border p-3 text-center text-gray-400">Aucune salle pour l'instant</td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  );
}