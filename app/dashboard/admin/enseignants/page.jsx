"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

export default function EnseignantPage() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    specialite: "",
  });

  const [enseignants, setEnseignants] = useState([]);

  const loadEnseignants = async () => {
    if (!user?.ecole?.id) return;

    try {
      const res = await axios.get(
        `http://localhost:8080/api/enseignants/ecole/${user.ecole.id}`
      );
      setEnseignants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEnseignants();
  }, [user]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8080/api/enseignants", {
        ...form,
        ecoleId: user.ecole.id,
      });

      setForm({
        nom: "",
        prenom: "",
        telephone: "",
        specialite: "",
      });

      loadEnseignants();
      alert("✅ Enseignant ajouté !");
    } catch (err) {
      console.error(err);
      alert("Erreur !");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cet enseignant ?")) return;

    try {
      await axios.delete(`http://localhost:8080/api/enseignants/${id}`);
      loadEnseignants();
    } catch (err) {
      console.error(err);
    }
  };
return (
  <div className="min-h-screen  space-y-4">

    {/* FORMULAIRE (style filtre) */}
    <div className="bg-white p-2 rounded-lg shadow flex flex-wrap gap-3 items-end">

      <input
        type="text"
        name="nom"
        placeholder="Nom"
        value={form.nom}
        onChange={handleChange}
        className="border rounded-lg px-3 py-2 text-sm"
      />

      <input
        type="text"
        name="prenom"
        placeholder="Prénom"
        value={form.prenom}
        onChange={handleChange}
        className="border rounded-lg px-3 py-2 text-sm"
      />

      <input
        type="text"
        name="telephone"
        placeholder="Téléphone"
        value={form.telephone}
        onChange={handleChange}
        className="border rounded-lg px-3 py-2 text-sm"
      />

      <input
        type="text"
        name="specialite"
        placeholder="Spécialité"
        value={form.specialite}
        onChange={handleChange}
        className="border rounded-lg px-3 py-2 text-sm"
      />

      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
        Ajouter
      </button>
    </div>

    {/* TABLEAU */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr className="text-left">
            <th className="p-3">Nom</th>
            <th className="p-3">Prénom</th>
            <th className="p-3">Téléphone</th>
            <th className="p-3">Spécialité</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {enseignants.map((e) => (
            <tr key={e.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{e.nom}</td>
              <td className="p-3">{e.prenom}</td>
              <td className="p-3">{e.telephone}</td>
              <td className="p-3">{e.specialite}</td>

              <td className="p-3 flex gap-2">
                <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">
                  Modifier
                </button>

                <button
                  onClick={() => handleDelete(e.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}

          {enseignants.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center p-4 text-gray-400">
                Aucun enseignant
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

  </div>
);
}