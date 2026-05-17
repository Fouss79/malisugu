"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

export default function EmploiDuTempsForm() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    classeId: "",
    matiereId: "",
    enseignantId: "",
    anneeId: "",
    jour: "",
    heureDebut: "",
    heureFin: "",
  });

  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [emploi, setEmploi] = useState([]);

  const jours = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];

  // ================= LOAD =================
  useEffect(() => {
    if (!user?.ecole?.id) return;

    axios.get(`http://localhost:8080/api/annees/ecole/${user.ecole.id}`)
      .then(res => setAnnees(res.data));

    axios.get(`http://localhost:8080/api/classes/ecole/${user.ecole.id}`)
      .then(res => setClasses(res.data));
  }, [user]);

  useEffect(() => {
    if (user?.anneeId) {
      setForm(prev => ({ ...prev, anneeId: user.anneeId }));
    }
  }, [user]);

  useEffect(() => {
    if (form.classeId && form.anneeId) {
      axios.get(`http://localhost:8080/api/matiereclasse/classe/${form.classeId}/annee/${form.anneeId}`)
        .then(res => setMatieres(res.data));

      loadEDT();
    }
  }, [form.classeId, form.anneeId]);

  useEffect(() => {
    if (form.matiereId && form.anneeId) {
      axios.get(`http://localhost:8080/api/habilitations/matiere/${form.matiereId}/annee/${form.anneeId}`)
        .then(res => setEnseignants(res.data));
    }
  }, [form.matiereId]);

  // ================= HANDLERS =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === "matiereId" && { enseignantId: "" })
    }));
  };

  const loadEDT = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/emploi/classe/${form.classeId}/${form.anneeId}`
      );
      setEmploi(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8080/api/emploi", form);
      loadEDT();
      alert("✅ Créé !");
    } catch (err) {
      alert("Erreur !");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ?")) return;
    await axios.delete(`http://localhost:8080/api/emploi/${id}`);
    loadEDT();
  };

  const handleEdit = (c) => {
    setForm({
      classeId: c.classe?.id,
      matiereId: c.matiere?.id,
      enseignantId: c.enseignant?.id,
      anneeId: c.anneeScolaire?.id,
      jour: c.jour,
      heureDebut: c.heureDebut,
      heureFin: c.heureFin,
    });
  };

  // ================= UI =================
  return (
    <div className="space-y-2">

      {/* ================= FORM ================= */}
     
       

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <select name="anneeId" value={form.anneeId} onChange={handleChange} className="input bg-white">
            <option value="">Année</option>
            {annees.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>

          <select name="classeId" value={form.classeId} onChange={handleChange} className="input bg-white">
            <option value="">Classe</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nomComplet}</option>)}
          </select>

          <select name="matiereId" value={form.matiereId} onChange={handleChange} className="input bg-white">
            <option value="">Matière</option>
            {matieres.map(m => (
              <option key={m.id} value={m.matiere?.id}>
                {m.matiere?.nom}
              </option>
            ))}
          </select>

          <select name="enseignantId" value={form.enseignantId} onChange={handleChange} className="input bg-white">
            <option value="">Enseignant</option>
            {enseignants.map(e => (
              <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>
            ))}
          </select>

          <select name="jour" value={form.jour} onChange={handleChange} className="input bg-white">
            <option value="">Jour</option>
            {jours.map(j => <option key={j}>{j}</option>)}
          </select>

          <div className="flex gap-2">
            <input type="number" name="heureDebut" value={form.heureDebut} onChange={handleChange} placeholder="Début" className="input bg-white" />
            <input type="number" name="heureFin" value={form.heureFin} onChange={handleChange} placeholder="Fin" className="input bg-white" />
          </div>

          <div className="col-span-1 md:col-span-3 flex justify-between ">
            <button className="bg-blue-600 text-white px-6 py-1 rounded-lg">
              Enregistrer
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-gray-700 text-white px-4 py-1 rounded-lg"
            >
              🖨️ Imprimer
            </button>
          </div>

        </form>
      

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-md overflow-auto">

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Heure</th>
              {jours.map(j => (
                <th key={j} className="p-2 border">{j}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 9 }, (_, i) => 8 + i).map((heure) => (
              <tr key={heure}>
                <td className="border p-2 font-bold">
                  {heure}:00 - {heure + 1}:00
                </td>

                {jours.map(jour => {
                  const cours = emploi.find(
                    c => c.jour === jour && c.heureDebut <= heure && c.heureFin > heure
                  );

                  if (!cours) {
                    return <td key={jour} className="border text-center">-</td>;
                  }

                  const isStart = cours.heureDebut === heure;
                  if (!isStart) return null;

                  const rowSpan = cours.heureFin - cours.heureDebut;

                  return (
                    <td key={jour} rowSpan={rowSpan} className="border text-center p-2 bg-blue-100">
                      <div className="font-bold">{cours.matiere?.nom}</div>
                      <div className="text-xs">{cours.enseignant?.nom}</div>

                      <div className="flex justify-center gap-2 mt-2">
                        <button onClick={() => handleEdit(cours)}>✏️</button>
                        <button onClick={() => handleDelete(cours.id)}>🗑️</button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}