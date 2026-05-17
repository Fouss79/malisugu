"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";

export default function BesoinHeureForm() {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [annees, setAnnees] = useState([]);

  const [form, setForm] = useState({
    classeId: "",
    matiereId: "",
    anneeScolaireId: "",
    nombreHeures: ""
  });

  useEffect(() => {
    if (user?.ecole?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [c, m, a] = await Promise.all([
        axios.get(`http://localhost:8080/api/classes/ecole/${user.ecole.id}`),
        axios.get(`http://localhost:8080/api/matieres/ecole/${user.ecole.id}`),
        axios.get(`http://localhost:8080/api/annees/ecole/${user.ecole.id}`)
      ]);

      setClasses(c.data);
      setMatieres(m.data);
      setAnnees(a.data);

    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8080/api/besoin-heures", form);
      alert("Besoin ajouté ✅");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded mb-6">

      <h2 className="font-bold mb-3">Ajouter Besoin Heure</h2>

      <select onChange={(e) => setForm({...form, classeId: e.target.value})} className="border p-2 mb-2 w-full">
        <option>Classe</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.nomComplet}</option>)}
      </select>

      <select onChange={(e) => setForm({...form, matiereId: e.target.value})} className="border p-2 mb-2 w-full">
        <option>Matière</option>
        {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
      </select>

      <select onChange={(e) => setForm({...form, anneeScolaireId: e.target.value})} className="border p-2 mb-2 w-full">
        <option>Année</option>
        {annees.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
      </select>

      <input
        type="number"
        placeholder="Nombre d'heures"
        className="border p-2 mb-2 w-full"
        onChange={(e) => setForm({...form, nombreHeures: e.target.value})}
      />

      <button className="bg-blue-600 text-white p-2 w-full">
        Ajouter
      </button>
    </form>
  );
}