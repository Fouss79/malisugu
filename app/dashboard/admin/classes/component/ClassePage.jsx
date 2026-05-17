"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";

export default function ClassePage() {

  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [series, setSeries] = useState([]);
  const [groupes, setGroupes] = useState([]);

  const [form, setForm] = useState({
    niveauId: "",
    serieId: "",
    groupeId: ""
  });

  // ================= LOAD DATA =================
  const loadData = async () => {
    if (!user?.ecole?.id) return;

    try {
      const [c, n, s, g] = await Promise.all([
        axios.get(`http://localhost:8080/api/classes/ecole/${user.ecole.id}`),
        axios.get(`http://localhost:8080/api/niveaux/ecole/${user.ecole.id}`),
        axios.get(`http://localhost:8080/api/series/ecole/${user.ecole.id}`),
        axios.get(`http://localhost:8080/api/groupes/ecole/${user.ecole.id}`)
      ]);

      setClasses(c.data);
      setNiveaux(n.data);
      setSeries(s.data);
      setGroupes(g.data);

    } catch (err) {
      console.error("Erreur loadData:", err);
    }
  };

  useEffect(() => {
    if (user?.ecole?.id) {
      loadData();
    }
  }, [user]);

  // ================= HANDLE =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.niveauId || !form.serieId || !form.groupeId) {
      alert("⚠️ Tous les champs sont obligatoires");
      return;
    }

    try {
      await axios.post("http://localhost:8080/api/classes", {
        niveauId: form.niveauId,
        serieId: form.serieId,
        groupeId: form.groupeId,
        ecoleId: user.ecole.id // ✅ correct
      });

      alert("✅ Classe créée");

      setForm({
        niveauId: "",
        serieId: "",
        groupeId: ""
      });

      loadData();

    } catch (err) {
      console.error(err);
      alert("❌ Erreur création classe");
    }
  };

  // ================= UI =================

  return (
    <div className="space-y-6 ">

      {/* FORMULAIRE */}
      <div className="bg-white p-4 shadow rounded">
        <h2 className="text-lg font-bold mb-4">
          Créer une classe
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">

          <select
            name="niveauId"
            value={form.niveauId}
            onChange={handleChange}
            className="border p-2"
          >
            <option value="">Niveau</option>
            {niveaux.map(n => (
              <option key={n.id} value={n.id}>
                {n.nom}
              </option>
            ))}
          </select>

          <select
            name="serieId"
            value={form.serieId}
            onChange={handleChange}
            className="border p-2"
          >
            <option value="">Série</option>
            {series.map(s => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>

          <select
            name="groupeId"
            value={form.groupeId}
            onChange={handleChange}
            className="border p-2"
          >
            <option value="">Groupe</option>
            {groupes.map(g => (
              <option key={g.id} value={g.id}>
                {g.nom}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="col-span-2 bg-blue-600 text-white py-2 rounded"
          >
            Créer classe
          </button>

        </form>
      </div>

      {/* TABLE */}
      <div className="p-1 shadow rounded">
        <table className="w-full border">

          <thead>
            <tr className="bg-gray-200">
              <th className="border p-1">Niveau</th>
              <th className="border p-1">Série</th>
              <th className="border p-1">Groupe</th>
              <th className="border p-1">Nom complet</th>
            </tr>
          </thead>

          <tbody>
            {classes.map(c => (
              <tr key={c.id}>
                <td className="border p-1">{c.niveau?.nom}</td>
                <td className="border p-1">{c.serie?.nom}</td>
                <td className="border p-1">{c.groupe?.nom}</td>
                <td className="border p-1 font-bold text-blue-600">
                  {c.niveau?.nom} {c.serie?.nom} {c.groupe?.nom}
                </td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  );
}