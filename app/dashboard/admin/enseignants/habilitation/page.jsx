"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";

export default function HabilitationPage() {
  const { user } = useAuth();

  const [enseignants, setEnseignants] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [list, setList] = useState([]);

  const [form, setForm] = useState({
    enseignantId: "",
    matiereId: "",
    anneeScolaireId: ""
  });

  const API = "http://localhost:8080/api/habilitations";

  // ================= LOAD DATA =================
  useEffect(() => {
    if (!user?.ecole?.id) return;

    loadData();
  }, [user?.ecole?.id]);

  const loadData = async () => {
    try {
      const [e, m, a] = await Promise.all([
        axios.get(`http://localhost:8080/api/enseignants/ecole/${user.ecole.id}`),
        axios.get(`http://localhost:8080/api/matieres/ecole/${user.ecole.id}`),
        axios.get(`http://localhost:8080/api/annees/ecole/${user.ecole.id}`)
      ]);

      setEnseignants(e.data || []);
      setMatieres(m.data || []);
      setAnnees(a.data || []);

      // 🔥 auto sélectionner année active si existe
      const active = a.data.find(x => x.active);
      if (active) {
        setForm(prev => ({
          ...prev,
          anneeScolaireId: active.id
        }));
      }

    } catch (err) {
      console.error(err);
    }
  };

  // ================= LOAD LIST =================
  useEffect(() => {
    if (!user?.ecole?.id || !form.anneeScolaireId) return;

    loadList();
  }, [user?.ecole?.id, form.anneeScolaireId]);

  const loadList = async () => {
    try {
      const res = await axios.get(
        `${API}/ecole/${user.ecole.id}/annee/${form.anneeScolaireId}`
      );
      setList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= HANDLE =================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ================= SUBMIT =================
  const submit = async (e) => {
    e.preventDefault();

    if (!form.enseignantId || !form.matiereId || !form.anneeScolaireId) {
      alert("Tous les champs sont obligatoires");
      return;
    }

    try {
      await axios.post(API, {
        ...form,
        ecoleId: user.ecole.id
      });

      alert("Habilitation ajoutée ✅");
      loadList();

    } catch (err) {
      alert(err.response?.data?.message || "Erreur ❌");
    }
  };

  // ================= UI =================
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Gestion des Habilitations
      </h1>

      {/* 🔥 FILTRE ANNEE */}
      <div className="flex justify-end">
        <select
          name="anneeScolaireId"
          value={form.anneeScolaireId}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">Choisir année</option>
          {annees.map(a => (
            <option key={a.id} value={a.id}>
              {a.nom} {a.active ? "(Active)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* FORM */}
      <form onSubmit={submit} className="grid grid-cols-3 gap-4 bg-white p-4 rounded shadow">

        <select name="enseignantId" onChange={handleChange} value={form.enseignantId}>
          <option value="">Enseignant</option>
          {enseignants.map(e => (
            <option key={e.id} value={e.id}>
              {e.nom} {e.prenom} ({e.specialite})
            </option>
          ))}
        </select>

        <select name="matiereId" onChange={handleChange} value={form.matiereId}>
          <option value="">Matière</option>
          {matieres.map(m => (
            <option key={m.id} value={m.id}>
              {m.nom}
            </option>
          ))}
        </select>

        <button className="bg-blue-600 text-white p-2 rounded col-span-3">
          Ajouter habilitation
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-white rounded shadow p-4">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Enseignant</th>
              <th className="p-2">Matière</th>
              <th className="p-2">Année</th>
            </tr>
          </thead>

          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center p-3 text-gray-400">
                  Aucune donnée
                </td>
              </tr>
            ) : (
              list.map((h) => (
                <tr key={h.id} className="text-center border-t">
                  <td>{h.enseignant?.nom} {h.enseignant?.prenom}</td>
                  <td>{h.matiere?.nom}</td>
                  <td>{h.anneeScolaire?.nom}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}