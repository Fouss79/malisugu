"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import api from "../../../../lib/api";

export default function PeriodePage() {

  const { user } = useAuth();

  const [annees, setAnnees] = useState([]);
  const [anneeId, setAnneeId] = useState("");
  const [periodes, setPeriodes] = useState([]);

  const [form, setForm] = useState({ nom: "", ordre: "", dateDebut: "", dateFin: "" });
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({ nom: "", ordre: "", dateDebut: "", dateFin: "" });
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!user?.ecole?.id) return;

    api.get(`/annees/ecole/${user.ecole.id}`)
      .then(res => {
        setAnnees(res.data);
        const active = res.data.find(a => a.active);
        if (active) setAnneeId(active.id.toString());
      })
      .catch(err => console.error(err));
  }, [user]);

  const load = async () => {
    if (!user?.ecole?.id || !anneeId) return;
    const res = await api.get(
      `/periodes/ecole/${user.ecole.id}/annee/${anneeId}`
    );
    setPeriodes(res.data);
  };

  useEffect(() => {
    load();
  }, [anneeId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    if (!form.nom.trim() || !anneeId) {
      setErreur("Le nom et l'année scolaire sont obligatoires");
      return;
    }

    try {
      await api.post("/periodes", {
        nom: form.nom,
        ordre: form.ordre ? Number(form.ordre) : null,
        dateDebut: form.dateDebut || null,
        dateFin: form.dateFin || null,
        anneeScolaireId: anneeId,
        ecoleId: user.ecole.id
      });

      setForm({ nom: "", ordre: "", dateDebut: "", dateFin: "" });
      load();
    } catch (err) {
      console.error(err);
      setErreur(err.response?.data || "Erreur lors de la création");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette période ?")) return;
    await api.delete(`/periodes/${id}`);
    load();
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditingForm({
      nom: p.nom,
      ordre: p.ordre || "",
      dateDebut: p.dateDebut || "",
      dateFin: p.dateFin || ""
    });
    setErreur("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingForm({ nom: "", ordre: "", dateDebut: "", dateFin: "" });
  };

  const handleEditingChange = (e) => setEditingForm({ ...editingForm, [e.target.name]: e.target.value });

  const saveEdit = async (id) => {
    if (!editingForm.nom.trim()) {
      setErreur("Le nom ne peut pas être vide");
      return;
    }

    try {
      await api.put(`/periodes/${id}`, {
        nom: editingForm.nom,
        ordre: editingForm.ordre ? Number(editingForm.ordre) : null,
        dateDebut: editingForm.dateDebut || null,
        dateFin: editingForm.dateFin || null,
        anneeScolaireId: anneeId,
        ecoleId: user.ecole.id
      });
      cancelEdit();
      load();
    } catch (err) {
      console.error(err);
      setErreur(err.response?.data || "Erreur lors de la modification");
    }
  };

  return (
    <div className="p-2 space-y-6">

      <div>
        <h2 className="font-bold text-lg">Périodes (trimestres)</h2>
        <select
          value={anneeId}
          onChange={(e) => setAnneeId(e.target.value)}
          className="border p-2 mt-2"
        >
          <option value="">Choisir l'année scolaire</option>
          {annees.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
        </select>
      </div>

      {anneeId && (
        <>
          <form onSubmit={handleSubmit} className="bg-white p-3 shadow rounded space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                name="nom"
                value={form.nom}
                onChange={handleChange}
                placeholder="Ex: Trimestre 1"
                className="border p-2"
              />
              <input
                type="number"
                name="ordre"
                value={form.ordre}
                onChange={handleChange}
                placeholder="Ordre (1, 2, 3...)"
                className="border p-2"
              />
              <div>
                <label className="text-xs text-gray-500">Date de début</label>
                <input
                  type="date"
                  name="dateDebut"
                  value={form.dateDebut}
                  onChange={handleChange}
                  className="border p-2 w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Date de fin</label>
                <input
                  type="date"
                  name="dateFin"
                  value={form.dateFin}
                  onChange={handleChange}
                  className="border p-2 w-full"
                />
              </div>
            </div>

            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Ajouter
            </button>
          </form>

          {erreur && <p className="text-sm text-red-600">{erreur}</p>}

          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-1">Nom</th>
                <th className="border p-1">Ordre</th>
                <th className="border p-1">Début</th>
                <th className="border p-1">Fin</th>
                <th className="border p-1">Action</th>
              </tr>
            </thead>

            <tbody>
              {periodes.map(p => (
                <tr key={p.id}>
                  {editingId === p.id ? (
                    <>
                      <td className="border p-1">
                        <input
                          name="nom"
                          value={editingForm.nom}
                          onChange={handleEditingChange}
                          className="w-full border px-2 py-1"
                        />
                      </td>
                      <td className="border p-1">
                        <input
                          type="number"
                          name="ordre"
                          value={editingForm.ordre}
                          onChange={handleEditingChange}
                          className="w-full border px-2 py-1"
                        />
                      </td>
                      <td className="border p-1">
                        <input
                          type="date"
                          name="dateDebut"
                          value={editingForm.dateDebut}
                          onChange={handleEditingChange}
                          className="w-full border px-2 py-1"
                        />
                      </td>
                      <td className="border p-1">
                        <input
                          type="date"
                          name="dateFin"
                          value={editingForm.dateFin}
                          onChange={handleEditingChange}
                          className="w-full border px-2 py-1"
                        />
                      </td>
                      <td className="border p-1">
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(p.id)} className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded">
                            <Check size={14} /> Valider
                          </button>
                          <button onClick={cancelEdit} className="flex items-center gap-1 bg-gray-400 text-white px-2 py-1 rounded">
                            <X size={14} /> Annuler
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border p-1">{p.nom}</td>
                      <td className="border p-1">{p.ordre ?? "—"}</td>
                      <td className="border p-1">{p.dateDebut || "—"}</td>
                      <td className="border p-1">{p.dateFin || "—"}</td>
                      <td className="border p-1">
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(p)} className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded">
                            <Pencil size={14} /> Modifier
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded">
                            <Trash2 size={14} /> Supprimer
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {periodes.length === 0 && (
                <tr>
                  <td colSpan={5} className="border p-3 text-center text-gray-400">
                    Aucune période pour cette année
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}