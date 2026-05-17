"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

export default function MatierePage() {
  const { user } = useAuth();

  const [nom, setNom] = useState("");
  const [matieres, setMatieres] = useState([]);

  const loadMatieres = async () => {
    if (!user?.ecole?.id) return;

    try {
      const res = await axios.get(
        `http://localhost:8080/api/matieres/ecole/${user.ecole.id}`
      );
      setMatieres(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMatieres();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8080/api/matieres", {
        nom: nom,
        ecoleId: user.ecole.id,
      });

      setNom("");
      loadMatieres();
      alert("✅ Matière ajoutée !");
    } catch (err) {
      console.error(err);
      alert("Erreur !");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ?")) return;

    await axios.delete(`http://localhost:8080/api/matieres/${id}`);
    loadMatieres();
  };

  return (
    <div className="min-h-screen">

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ================= FORM ================= */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow-md space-y-4 md:col-span-1 h-fit"
        >
          <h2 className="text-xl font-semibold text-gray-700">
            Ajouter une matière
          </h2>

          <input
            type="text"
            placeholder="Nom de la matière"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none p-3 w-full rounded-lg"
            required
          />

          <button className="w-full bg-[#2E7C99] hover:bg-blue-700 transition text-white px-5 py-2 rounded-lg shadow">
            Ajouter
          </button>
        </form>

        {/* ================= TABLE ================= */}
        <div className="bg-white p-6 rounded-2xl shadow-md md:col-span-2">

          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Liste des matières
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="p-3 text-left">Nom</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {matieres.map((m, index) => (
                  <tr
                    key={m.id}
                    className={`border-t hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-3">{m.nom}</td>

                    <td className="p-3 flex gap-2">
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 transition text-white px-3 py-1 rounded-lg"
                        onClick={() => alert("Modifier à faire")}
                      >
                        Modifier
                      </button>

                      <button
                        className="bg-red-600 hover:bg-red-700 transition text-white px-3 py-1 rounded-lg"
                        onClick={() => handleDelete(m.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}