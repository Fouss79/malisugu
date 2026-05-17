"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";

import axios from "axios";

export default function MatiereClassePage() {
  const [matieres, setMatieres] = useState([]);
  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [list, setList] = useState([]);
   const { user } = useAuth();
  const [form, setForm] = useState({
  matiereId: null,
  classeId: null,
  anneeScolaireId: null, // ✅ CORRIGÉ
  coefficient: 1,
  nombreHeures:2
});
  // 🔥 Charger les données
 useEffect(() => {
  if (user && user.ecole) {
    
    loadData();
  }
}, [user]); // ✅ stable
 const loadData = async () => {
  if (!user || !user.ecole) return; // 🔥 protection

  try {
    const [mRes, cRes, aRes] = await Promise.all([
        axios.get(`http://localhost:8080/api/matieres/ecole/${user.ecole.id}`),
      axios.get(`http://localhost:8080/api/classes/ecole/${user.ecole.id}`),
      
      axios.get(`http://localhost:8080/api/annees/ecole/${user.ecole.id}`)
    ]);

    setClasses(cRes.data);
    setMatieres(mRes.data);
    setAnnees(aRes.data);
    console.log(classes);

  } catch (error) {
    console.error("Erreur chargement:", error);
  }
};
const loadList = async () => {
  if (!form.classeId || !form.anneeScolaireId) return;

  try {
    const res = await axios.get(
      `http://localhost:8080/api/matiereclasse/classe/${form.classeId}/annee/${form.anneeScolaireId}`
    );

    setList(res.data);
  } catch (err) {
    console.error("Erreur chargement liste:", err);
  }
};
useEffect(() => {
  loadList();
}, [form.classeId, form.anneeScolaireId]);

// 🔥 Handle change
 const handleChange = (e) => {
  const { name, value } = e.target;

  setForm({
    ...form,
    [name]: value === "" ? null : Number(value), // 🔥 clé
  });
};

  // 🔥 Submit
 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!form.matiereId || !form.classeId) {
    alert("Matière et classe obligatoires !");
    return;
  }

  try {
    await axios.post("http://localhost:8080/api/matiereclasse", form);

    console.log("DATA ENVOYÉE :", form); // 🔥 debug propre

    alert("Ajout réussi ✅");
    
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Erreur ❌");
  }
};

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Gestion Matière - Classe</h1>

      {/* FORMULAIRE */}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">

        {/* Matière */}
        <select name="matiereId" onChange={handleChange} className="p-2 border">
          <option value="">Choisir matière</option>
          {matieres.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
            </option>
          ))}
        </select>

        {/* Classe */}
        <select name="classeId" onChange={handleChange} className="p-2 border">
          <option value="">Choisir classe</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
                  {c.nomComplet || `${c.niveau?.nom} ${c.serie?.nom} ${c.groupe?.nom}`}
                </option>
          ))}
        </select>

        {/* Année */}
        <select name="anneeScolaireId" onChange={handleChange} className="p-2 border">
          <option value="">Choisir année</option>
          {annees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>

        {/* Coefficient */}
        <input
          type="number"
          name="coefficient"
          value={form.coefficient}
          onChange={handleChange}
          className="p-2 border"
          placeholder="Coefficient"
        />
        <input
          type="number"
          name="nombreHeures"
          value={form.nombreHeures}
          onChange={handleChange}
          className="p-2 border"
          placeholder="nombreHeures"
        />

        <button className="bg-blue-600 text-white p-2 col-span-2">
          Ajouter
        </button>
      </form>

      {/* LISTE */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th>Matière</th>
            <th>Classe</th>
            <th>Année</th>
            <th>Coefficient</th>
            <th>Nombre d'heure</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item) => (
            <tr key={item.id} className="text-center border-t">
              <td>{item.matiere?.nom}</td>
              <td>{item.classe?.nomComplet}</td>
              <td>{item.anneeScolaire?.nom}</td>
              <td>{item.coefficient}</td>
               <td>{item.nombreHeures}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}