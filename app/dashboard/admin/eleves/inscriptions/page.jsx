"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";

export default function ElevePage() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    sexe: "M",
    classeId: ""
  });

  const [classes, setClasses] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [filtreClasse, setFiltreClasse] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    garcons: 0,
    filles: 0
  });

  // ================= LOAD CLASSES =================
  useEffect(() => {
    if (!user?.ecole?.id) return;

    fetch(`http://localhost:8080/api/classes/ecole/${user.ecole.id}`)
      .then(res => res.json())
      .then(data => setClasses(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

  }, [user?.ecole?.id]);

  // ================= LOAD ELEVES =================
  const loadEleves = async () => {
    if (!user?.ecole?.id) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/inscriptions/ecole/${user.ecole.id}/active`
      );

      const data = await res.json();

      // 🔥 protection
      const safeData = Array.isArray(data) ? data : [];

      setEleves(safeData);
      calculStats(safeData);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEleves();
  }, [user?.ecole?.id]);

  // ================= STATS =================
  const calculStats = (data) => {
    if (!Array.isArray(data)) return;

    const garcons = data.filter(e => e.sexe === "M").length;
    const filles = data.filter(e => e.sexe === "F").length;

    setStats({
      total: data.length,
      garcons,
      filles
    });
  };

  // ================= FILTRE =================
  const elevesFiltres = eleves.filter(e =>
    !filtreClasse || e.classeId == filtreClasse
  );

  // ================= FORM =================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
     const res = await fetch("http://localhost:8080/api/inscriptions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-USER-EMAIL": user.email
  },
  body: JSON.stringify({
    ...form,
    ecoleId: user?.ecole?.id
  })
});

const text = await res.text();
console.log("RESPONSE 👉", text);

if (!res.ok) {
  if (res.status === 403) {
    alert("🚫 Abonnement expiré ou école désactivée");
  } else {
    alert(text);
  }
  return;
}

      if (!res.ok) throw new Error("Erreur");

      alert("✅ Élève inscrit !");

      // reset form
      setForm({
        nom: "",
        prenom: "",
        dateNaissance: "",
        sexe: "M",
        classeId: ""
      });

      loadEleves();

    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'inscription");
    }
  };

  // ================= UI =================
  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">

      {/* 🔵 STATS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow">
          Total élèves : {stats.total}
        </div>
        <div className="bg-green-600 text-white p-4 rounded-xl shadow">
          Garçons : {stats.garcons}
        </div>
        <div className="bg-pink-500 text-white p-4 rounded-xl shadow">
          Filles : {stats.filles}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* 🔵 FORM */}
        <div className="bg-white p-5 rounded-2xl shadow space-y-4">
          <h2 className="font-semibold text-lg">Inscription Élève</h2>

          <form onSubmit={handleSubmit} className="space-y-3">

            <input
              name="nom"
              placeholder="Nom"
              value={form.nom}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />

            <input
              name="prenom"
              placeholder="Prénom"
              value={form.prenom}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />

            <input
              type="date"
              name="dateNaissance"
              value={form.dateNaissance}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />

            <select
              name="sexe"
              value={form.sexe}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="M">Garçon</option>
              <option value="F">Fille</option>
            </select>

            <select
              name="classeId"
              value={form.classeId}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Choisir classe</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nomComplet}
                </option>
              ))}
            </select>

            <button className="bg-blue-600 text-white w-full py-2 rounded-lg">
              Inscrire
            </button>

          </form>
        </div>

        {/* 🟢 TABLE */}
        <div className="col-span-2 bg-white p-5 rounded-2xl shadow">

          <div className="flex justify-between mb-4">
            <h2 className="font-semibold">Liste des élèves</h2>

            <select
              value={filtreClasse}
              onChange={(e) => setFiltreClasse(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">Toutes classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nomComplet}
                </option>
              ))}
            </select>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Matricule</th>
                <th className="p-2">Nom</th>
                <th className="p-2">Prénom</th>
                <th className="p-2">Classe</th>
                <th className="p-2">Année</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>

            <tbody>
              {elevesFiltres.map(e => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{e.numeroMatricule}</td>
                  <td className="p-2">{e.nom}</td>
                  <td className="p-2">{e.prenom}</td>
                  <td className="p-2">{e.classeNom}</td>
                  <td className="p-2">{e.anneeScolaire}</td>
                  <td className="p-2">{e.statut}</td>
                  <td className="p-2">
                    {e.dateInscription?.substring(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>

      </div>
    </div>
  );
}