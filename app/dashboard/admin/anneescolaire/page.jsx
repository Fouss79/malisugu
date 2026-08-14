"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";

export default function AnneeScolairePage() {
  const { user } = useAuth();

  const [nom, setNom] = useState("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");

  const [annees, setAnnees] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (user?.ecole?.id) {
      loadData();
      loadActive();
    }
  }, [user]);

  // ================= LOAD LIST =================
  const loadData = async () => {
    try {
      const res = await api.get(`/annees/ecole/${user.ecole.id}`);
      setAnnees(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= LOAD ACTIVE =================
  const loadActive = async () => {
    try {
      const res = await api.get(`/annees/active/${user.ecole.id}`);
      setActive(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= CREATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nom || !debut || !fin)
      return alert("Tous les champs sont obligatoires");

    try {
      await api.post(`/annees`, {
        nom,
        debut: debut,   // yyyy-MM-dd
        fin: fin,       // yyyy-MM-dd
        ecoleId: user.ecole.id,
      });

      setNom("");
      setDebut("");
      setFin("");

      loadData();
      alert("Année créée ✅");
    } catch (err) {
      alert(err.response?.data?.message || "Erreur création");
    }
  };

  // ================= ACTIVER =================
  const activer = async (id) => {
    try {
      await api.put(`/annees/activer/${id}`);
      loadData();
      loadActive();
      alert("Année activée 🔥");
    } catch (err) {
      alert("Erreur activation");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Gestion des Années Scolaires
      </h1>

      {/* ================= FORM ================= */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-6">

        <input
          type="text"
          placeholder="Ex: 2025-2026"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="border p-2"
        />

        <input
          type="date"
          value={debut}
          onChange={(e) => setDebut(e.target.value)}
          className="border p-2"
        />

        <input
          type="date"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          className="border p-2"
        />

        <button className="bg-blue-600 text-white px-4 py-2">
          Créer
        </button>
      </form>

      {/* ================= ACTIVE ================= */}
      {active && (
        <div className="mb-4 p-3 bg-green-100 border">
          Année active : <b>{active.nom}</b>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th>Nom</th>
            <th>Début</th>
            <th>Fin</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {annees.map((a) => (
            <tr key={a.id} className="text-center border-t">
              <td>{a.nom}</td>
              <td>{a.dateDebut}</td>
              <td>{a.dateFin}</td>

              <td>
                {a.active ? (
                  <span className="text-green-600 font-bold">ACTIVE</span>
                ) : (
                  <span className="text-gray-500">INACTIVE</span>
                )}
              </td>

              <td>
                {!a.active && (
                  <button
                    onClick={() => activer(a.id)}
                    className="bg-green-600 text-white px-3 py-1"
                  >
                    Activer
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}