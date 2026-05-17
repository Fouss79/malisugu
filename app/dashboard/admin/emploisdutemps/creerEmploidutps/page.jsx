"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";

export default function EmploiPage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [emploi, setEmploi] = useState([]);

  const [selectedClasse, setSelectedClasse] = useState("");
  const [selectedAnnee, setSelectedAnnee] = useState("");

  const jours = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI","SAMEDI"];

  // 🔥 Générer les horaires dynamiques
  const getHoraires = () => {
    const all = emploi
      .map(e => ({
        debut: e.heureDebut,
        fin: e.heureFin
      }))
      .sort((a, b) => a.debut - b.debut);

    const uniques = [];
    all.forEach(h => {
      if (!uniques.find(u => u.debut === h.debut && u.fin === h.fin)) {
        uniques.push(h);
      }
    });

    return uniques;
  };

  // 🔥 Trouver un cours (gestion chevauchement)
  const getCours = (jour, debut, fin) => {
    return emploi.find(
      (c) =>
        c.jour === jour &&
        c.heureDebut < fin &&
        c.heureFin > debut
    );
  };

  // 🔥 Charger données
  useEffect(() => {
    if (user?.ecole?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        axios.get(`http://localhost:8080/api/classes/ecole/${user.ecole.id}`),
        axios.get(`http://localhost:8080/api/annees/ecole/${user.ecole.id}`)
      ]);

      setClasses(cRes.data);
      setAnnees(aRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 Générer
  const genererEDT = async () => {
    if (!selectedAnnee) {
      alert("Choisir une année !");
      return;
    }

    try {
      await axios.post(`http://localhost:8080/api/emploi/generer/${selectedAnnee}`);
      alert("Emploi généré ✅");
      await loadEDT();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 Charger EDT
  const loadEDT = async () => {
    if (!selectedClasse || !selectedAnnee) {
      alert("Choisir classe et année !");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:8080/api/emploi/classe/${selectedClasse}/${selectedAnnee}`
      );

      setEmploi(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">Emploi du Temps</h1>

      {/* FILTRES */}
      <div className="grid grid-cols-3 gap-4 mb-4">

        <select onChange={(e) => setSelectedClasse(e.target.value)} className="p-2 border">
          <option value="">Classe</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nomComplet}
            </option>
          ))}
        </select>

        <select onChange={(e) => setSelectedAnnee(e.target.value)} className="p-2 border">
          <option value="">Année</option>
          {annees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>

        <button onClick={loadEDT} className="bg-blue-600 text-white p-2">
          Voir
        </button>
      </div>

      {/* GENERER */}
      <button onClick={genererEDT} className="bg-green-600 text-white p-2 mb-6">
        Générer automatiquement
      </button>

     {/* 🔥 GRILLE STYLE LYCEE */}
<table className="w-full border">
  <thead>
    <tr className="bg-gray-200">
      <th className="border p-2">Heure</th>
      {jours.map(j => (
        <th key={j} className="border p-2">{j}</th>
      ))}
    </tr>
  </thead>

  <tbody>
    {Array.from({ length: 10 }, (_, i) => 8 + i).map((heure) => (
      <tr key={heure}>
        
        {/* Heure */}
        <td className="border p-2 font-bold">
          {heure}:00 - {heure + 1}:00
        </td>

        {jours.map((jour) => {

          const cours = emploi.find(
            (c) =>
              c.jour === jour &&
              c.heureDebut <= heure &&
              c.heureFin > heure
          );

          // Pas de cours
          if (!cours) {
            return (
              <td key={jour + heure} className="border text-center text-gray-400">
                -
              </td>
            );
          }

          // 🔥 calcul rowspan
          const isStart = cours.heureDebut === heure;
          const rowSpan = cours.heureFin - cours.heureDebut;

          if (!isStart) return null;

          // 🎨 couleur par matière
          const getColor = (matiere) => {
            const colors = {
              Math: "bg-blue-200",
              Français: "bg-green-200",
              Physique: "bg-yellow-200",
              Anglais: "bg-purple-200",
            };
            return colors[matiere] || "bg-blue-100";
          };

          return (
            <td
              key={jour + heure}
              rowSpan={rowSpan}
              className={`border text-center p-2 ${getColor(cours.matiere?.nom)}`}
            >
              <div className="font-bold text-sm">
                {cours.matiere?.nom}
              </div>

              <div className="text-xs text-gray-700">
                {cours.heureDebut}:00 - {cours.heureFin}:00
              </div>

              <div className="text-xs text-gray-600">
                {cours.enseignant?.nom}
              </div>
            </td>
          );
        })}
      </tr>
    ))}
  </tbody>
</table>
    </div>
  );
}