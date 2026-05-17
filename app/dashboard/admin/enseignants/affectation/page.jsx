"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";

export default function AffectationForm() {

  const { user } = useAuth();

  const [form, setForm] = useState({
    classeId: "",
    matiereId: "",
    enseignantId: "",
    anneeId: ""
  });

  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [affectations, setAffectations] = useState([]);

  // ================= LOAD DATA =================

  useEffect(() => {
    if (user?.ecole?.id) {
      axios.get(`http://localhost:8080/api/annees/ecole/${user.ecole.id}`)
        .then(res => setAnnees(res.data));

      axios.get(`http://localhost:8080/api/classes/ecole/${user.ecole.id}`)
        .then(res => setClasses(res.data));
    }
  }, [user]);

  // 🔥 année auto
  useEffect(() => {
    if (user?.anneeId) {
      setForm(prev => ({ ...prev, anneeId: user.anneeId }));
    }
  }, [user]);

  // 🔥 matières par classe + année
  useEffect(() => {
    if (form.classeId && form.anneeId) {
      axios.get(`http://localhost:8080/api/matiereclasse/classe/${form.classeId}/annee/${form.anneeId}`)
        .then(res => setMatieres(res.data));
    }
  }, [form.classeId, form.anneeId]);

  // 🔥 enseignants par matière
  useEffect(() => {
    if (form.matiereId && form.anneeId) {
      axios.get(`http://localhost:8080/api/habilitations/matiere/${form.matiereId}/annee/${form.anneeId}`)
        .then(res => setEnseignants(res.data));
    }
  }, [form.matiereId, form.anneeId]);

  // 🔥 charger affectations
  const loadAffectations = async () => {
    if (!form.anneeId) return;

    const res = await axios.get(
      `http://localhost:8080/api/affectations/annee/${form.anneeId}`
    );
    setAffectations(res.data);
  };
   
 const anneeId = form?.anneeId;

useEffect(() => {
  if (!anneeId) return;

  loadAffectations();
}, [anneeId]);

  // ================= HANDLERS =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === "matiereId") {
      setForm(prev => ({
        ...prev,
        matiereId: value,
        enseignantId: ""
      }));
      setEnseignants([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8080/api/affectations", form);
      alert("✅ Affectation créée !");
      loadAffectations();
    } catch (err) {
      alert("Erreur !");
    }
  };

  // ================= UI =================

  return (
    <div className="p-4 space-y-4">

      {/* ================= FORM ================= */}
      <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 shadow rounded">

        <h2 className="font-bold text-lg">Affectation enseignant</h2>

        <select name="anneeId" value={form.anneeId} onChange={handleChange} className="p-2 border w-full">
          <option value="">Année</option>
          {annees.map(a => (
            <option key={a.id} value={a.id}>{a.nom}</option>
          ))}
        </select>

        <select name="classeId" value={form.classeId} onChange={handleChange} className="p-2 border w-full">
          <option value="">Classe</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.nomComplet}</option>
          ))}
        </select>

        <select name="matiereId" value={form.matiereId} onChange={handleChange} className="p-2 border w-full">
          <option value="">Matière</option>
          {matieres.map(m => (
            <option key={m.matiere.id} value={m.matiere.id}>
              {m.matiere.nom}
            </option>
          ))}
        </select>

        <select
          name="enseignantId"
          value={form.enseignantId}
          onChange={handleChange}
          className="p-2 border w-full"
          disabled={!form.matiereId}
        >
          <option value="">Enseignant</option>
          {enseignants.map(e => (
            <option key={e.id} value={e.id}>
              {e.nom} {e.prenom}
            </option>
          ))}
        </select>

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Affecter
        </button>
      </form>

      {/* ================= TABLE ================= */}
      <div className="bg-white p-4 shadow rounded">
        <h2 className="font-bold mb-3">Liste des affectations</h2>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Classe</th>
              <th className="border p-2">Matière</th>
              <th className="border p-2">Enseignant</th>
              <th className="border p-2">Année</th>
            </tr>
          </thead>

          <tbody>
            {affectations.map(a => (
              <tr key={a.id}>
                <td className="border p-2">{a.classe?.nomComplet}</td>
                <td className="border p-2">{a.matiere?.nom}</td>
                <td className="border p-2">
                  {a.enseignant?.nom} {a.enseignant?.prenom}
                </td>
                <td className="border p-2">{a.anneeScolaire?.nom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}