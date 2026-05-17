"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";

export default function NiveauPage() {

  const { user } = useAuth();

  const [nom, setNom] = useState("");
  const [niveaux, setNiveaux] = useState([]);

  const load = async () => {
    const res = await axios.get(`http://localhost:8080/api/niveaux/ecole/${user.ecole.id}`)
    setNiveaux(res.data);
  };

  useEffect(() => {
    if (user?.ecole?.id) 
        
        load();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await axios.post("http://localhost:8080/api/niveaux", {
      nom,
      ecoleId: user.ecole.id
    });

    setNom("");
    load();
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/niveaux/${id}`);
    load();
  };

  return (
    <div className="p-2 space-y-6">

      <form onSubmit={handleSubmit} className="bg-white p-2 shadow rounded">
        <h2 className="font-bold">Créer un niveau</h2>

        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex: 10e, Terminale"
          className="border p-2 w-full mt-2"
        />

        <button className="bg-blue-600 text-white px-4 py-2 mt-2">
          Ajouter
        </button>
      </form>

      <table className="w-full border mt-2">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-1">Nom</th>
            <th className="border p-1">Action</th>
          </tr>
        </thead>

        <tbody>
          {niveaux.map(n => (
            <tr key={n.id}>
              <td className="border p-1">{n.nom}</td>
              <td className="border p-1">
                <button onClick={() => handleDelete(n.id)} className="bg-red-600 text-white px-2">
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