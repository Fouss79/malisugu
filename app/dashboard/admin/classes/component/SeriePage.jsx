"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";

export default function SeriePage() {

  const { user } = useAuth();

  const [nom, setNom] = useState("");
  const [series, setSeries] = useState([]);

  const load = async () => {
    const res = await axios.get(`http://localhost:8080/api/series/ecole/${user.ecole.id}`)
    setSeries(res.data);
  };

  useEffect(() => {
    if (user?.ecole?.id) load();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await axios.post("http://localhost:8080/api/series", {
      nom,
      ecoleId: user.ecole.id
    });

    setNom("");
    load();
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/series/${id}`);
    load();
  };

  return (
    <div className="p-2 space-y-6">

      <form onSubmit={handleSubmit} className="bg-white p-2 shadow rounded">
        <h2 className="font-bold">Créer une série</h2>

        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex: S, L, E"
          className="border p-2 w-full mt-2"
        />

        <button className="bg-blue-600 text-white px-4 py-2 mt-2">
          Ajouter
        </button>
      </form>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-1">Nom</th>
            <th className="border p-1">Action</th>
          </tr>
        </thead>

        <tbody>
          {series.map(s => (
            <tr key={s.id}>
              <td className="border p-1">{s.nom}</td>
              <td className="border p-1">
                <button onClick={() => handleDelete(s.id)} className="bg-red-600 text-white px-2">
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}