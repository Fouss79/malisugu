"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import api from "../../../../../lib/api";

export default function ClassePage() {

  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [series, setSeries] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [salles, setSalles] = useState([]);

  const [form, setForm] = useState({ niveauId: "", serieId: "", groupeId: "", salleId: "" });

  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({ niveauId: "", serieId: "", groupeId: "", salleId: "" });
  const [erreur, setErreur] = useState("");

  // ================= LOAD DATA =================
  const loadData = async () => {
    if (!user?.ecole?.id) return;

    try {
      const [c, n, s, g, sa] = await Promise.all([
        api.get(`/classes/ecole/${user.ecole.id}`),
        api.get(`/niveaux/ecole/${user.ecole.id}`),
        api.get(`/series/ecole/${user.ecole.id}`),
        api.get(`/groupes/ecole/${user.ecole.id}`),
        api.get(`/salles/ecole/${user.ecole.id}`)
      ]);

      setClasses(c.data);
      setNiveaux(n.data);
      setSeries(s.data);
      setGroupes(g.data);
      setSalles(sa.data);
    } catch (err) {
      console.error("Erreur loadData:", err);
    }
  };

  useEffect(() => {
    if (user?.ecole?.id) loadData();
  }, [user]);

  // ================= CRÉATION =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.niveauId || !form.serieId) {
      alert("⚠️ Le niveau et la série sont obligatoires");
      return;
    }

    try {
      await api.post("/classes", {
        niveauId: form.niveauId,
        serieId: form.serieId,
        groupeId: form.groupeId || null,
        salleId: form.salleId || null,
        ecoleId: user.ecole.id
      });

      alert("✅ Classe créée");
      setForm({ niveauId: "", serieId: "", groupeId: "", salleId: "" });
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data || "❌ Erreur création classe");
    }
  };

  // ================= ÉDITION =================
  const startEdit = (c) => {
    setEditingId(c.id);
    setEditingForm({
      niveauId: c.niveau?.id || "",
      serieId: c.serie?.id || "",
      groupeId: c.groupe?.id || "",
      salleId: c.salle?.id || ""
    });
    setErreur("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingForm({ niveauId: "", serieId: "", groupeId: "", salleId: "" });
  };

  const handleEditingChange = (e) => {
    const { name, value } = e.target;
    setEditingForm(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async (id) => {
    if (!editingForm.niveauId || !editingForm.serieId) {
      setErreur("Le niveau et la série sont obligatoires");
      return;
    }

    try {
      await api.put(`/classes/${id}`, {
        niveauId: editingForm.niveauId,
        serieId: editingForm.serieId,
        groupeId: editingForm.groupeId || null,
        salleId: editingForm.salleId || null,
        ecoleId: user.ecole.id
      });
      cancelEdit();
      loadData();
    } catch (err) {
      console.error(err);
      setErreur(err.response?.data || "Erreur lors de la modification");
    }
  };

  // ================= SUPPRESSION =================
  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette classe ?")) return;
    try {
      await api.delete(`/classes/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data || "Impossible de supprimer cette classe (des élèves y sont peut-être encore inscrits)");
    }
  };

  return (
    <div className="space-y-6">

      {/* FORMULAIRE */}
      <div className="rounded bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-bold">Créer une classe</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
          <select name="niveauId" value={form.niveauId} onChange={handleChange} className="border p-2">
            <option value="">Niveau</option>
            {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
          </select>

          <select name="serieId" value={form.serieId} onChange={handleChange} className="border p-2">
            <option value="">Série</option>
            {series.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>

          <select name="groupeId" value={form.groupeId} onChange={handleChange} className="border p-2">
            <option value="">Groupe</option>
            {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>

          <select name="salleId" value={form.salleId} onChange={handleChange} className="border p-2">
            <option value="">Salle fixe (optionnel)</option>
            {salles.map(s => (
              <option key={s.id} value={s.id}>
                {s.nom}{s.capacite ? ` (${s.capacite} places)` : ""}
              </option>
            ))}
          </select>

          <button type="submit" className="col-span-2 rounded bg-blue-600 py-2 text-white">
            Créer classe
          </button>
        </form>
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      {/* TABLE */}
      <div className="rounded p-1 shadow">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-1">Niveau</th>
              <th className="border p-1">Série</th>
              <th className="border p-1">Groupe</th>
              <th className="border p-1">Salle</th>
              <th className="border p-1">Nom complet</th>
              <th className="border p-1">Action</th>
            </tr>
          </thead>

          <tbody>
            {classes.map(c => (
              <tr key={c.id}>
                {editingId === c.id ? (
                  <>
                    <td className="border p-1">
                      <select
                        name="niveauId"
                        value={editingForm.niveauId}
                        onChange={handleEditingChange}
                        className="w-full border p-1"
                      >
                        <option value="">Niveau</option>
                        {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
                      </select>
                    </td>
                    <td className="border p-1">
                      <select
                        name="serieId"
                        value={editingForm.serieId}
                        onChange={handleEditingChange}
                        className="w-full border p-1"
                      >
                        <option value="">Série</option>
                        {series.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                      </select>
                    </td>
                    <td className="border p-1">
                      <select
                        name="groupeId"
                        value={editingForm.groupeId}
                        onChange={handleEditingChange}
                        className="w-full border p-1"
                      >
                        <option value="">Groupe</option>
                        {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
                      </select>
                    </td>
                    <td className="border p-1">
                      <select
                        name="salleId"
                        value={editingForm.salleId}
                        onChange={handleEditingChange}
                        className="w-full border p-1"
                      >
                        <option value="">Salle (optionnel)</option>
                        {salles.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nom}{s.capacite ? ` (${s.capacite} places)` : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-1 text-center text-gray-400">—</td>
                    <td className="border p-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(c.id)}
                          className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-white"
                        >
                          <Check size={14} />
                          Valider
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 rounded bg-gray-400 px-2 py-1 text-white"
                        >
                          <X size={14} />
                          Annuler
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border p-1">{c.niveau?.nom}</td>
                    <td className="border p-1">{c.serie?.nom}</td>
                    <td className="border p-1">{c.groupe?.nom || "—"}</td>
                    <td className="border p-1">{c.salle?.nom || "—"}</td>
                    <td className="border p-1 font-bold text-blue-600">
                      {c.niveau?.nom} {c.serie?.nom} {c.groupe?.nom}
                    </td>
                    <td className="border p-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(c)}
                          className="flex items-center gap-1 rounded bg-yellow-500 px-2 py-1 text-white"
                        >
                          <Pencil size={14} />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-white"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {classes.length === 0 && (
              <tr>
                <td colSpan={6} className="border p-3 text-center text-gray-400">
                  Aucune classe pour l'instant
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}