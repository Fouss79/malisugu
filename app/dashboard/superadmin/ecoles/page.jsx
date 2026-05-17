"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function EcolesPage() {

  const [ecoles, setEcoles] = useState([]);

  const [form, setForm] = useState({
    nom: "",
    ville: "",
    pays: ""
  });

  const [plans, setPlans] = useState({});
  const [durees, setDurees] = useState({});

  const load = async () => {
    const res = await axios.get("http://localhost:8080/api/ecoles");
    setEcoles(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  // ➕ créer école
  const create = async (e) => {
    e.preventDefault();

    await axios.post("http://localhost:8080/api/ecoles", form);

    setForm({ nom: "", ville: "", pays: "" });
    load();
  };

  // 🔥 assigner abonnement
  const assignerPlan = async (id) => {

    const plan = plans[id] || "BASIC";
    const duree = durees[id] || 1;

    console.log("DATA 👉", { id, plan, duree });

    await axios.put(
      `http://localhost:8080/api/superadmin/abonnements/${id}`,
      null,
      {
        params: { plan, duree }
      }
    );

    load();
  };

  // 🔴 toggle actif/inactif
  const toggle = async (id) => {
    await axios.put(`http://localhost:8080/api/ecoles/toggle/${id}`);
    load();
  };

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">

      <h1 className="text-2xl font-bold">Gestion des Écoles (SaaS)</h1>

      {/* FORM */}
      <form
        onSubmit={create}
        className="grid grid-cols-3 gap-3 bg-white p-4 rounded shadow"
      >
        <input
          placeholder="Nom école"
          value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
          className="border p-2 rounded"
        />

        <input
          placeholder="Ville"
          value={form.ville}
          onChange={(e) => setForm({ ...form, ville: e.target.value })}
          className="border p-2 rounded"
        />

        <input
          placeholder="Pays"
          value={form.pays}
          onChange={(e) => setForm({ ...form, pays: e.target.value })}
          className="border p-2 rounded"
        />

        <button className="bg-blue-600 text-white p-2 col-span-3 rounded">
          Créer école
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full border">

          <thead>
            <tr className="bg-gray-200">
              <th>Nom</th>
              <th>Ville</th>
              <th>Pays</th>
              <th>Statut</th>
              <th>Plan actuel</th>
              <th>Expiration</th>
              <th>Abonnement</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {ecoles.map((e) => (
              <tr key={e.id} className="text-center border-t">

                <td>{e.nom}</td>
                <td>{e.ville}</td>
                <td>{e.pays}</td>

                {/* STATUT */}
                <td>
                  {e.active ? "🟢 Actif" : "🔴 Inactif"}
                </td>

                {/* PLAN ACTUEL */}
                <td className={
                  e.plan === "PREMIUM" ? "text-pink-600 font-bold" :
                  e.plan === "PRO" ? "text-blue-600 font-bold" :
                  "text-gray-600"
                }>
                  {e.plan || "Aucun"}
                </td>
                <td>
  {e.dateFin
    ? new Date(e.dateFin) < new Date()
      ? "🔴 Expiré"
      : new Date(e.dateFin) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ? "🟡 Expire bientôt" 
      : "🟢 Active"
    : "Aucun"} 
</td>

                {/* SELECT ABONNEMENT */}
                <td className="space-x-2">

                  <select
                    value={plans[e.id] ?? "BASIC"}
                    onChange={(ev) =>
                      setPlans({
                        ...plans,
                        [e.id]: ev.target.value
                      })
                    }
                    className="border p-1 rounded"
                  >
                    <option value="BASIC">BASIC</option>
                    <option value="PRO">PRO</option>
                    <option value="PREMIUM">PREMIUM</option>
                  </select>

                  <select
                    value={durees[e.id] ?? 1}
                    onChange={(ev) =>
                      setDurees({
                        ...durees,
                        [e.id]: Number(ev.target.value)
                      })
                    }
                    className="border p-1 rounded"
                  >
                    <option value={1}>1 mois</option>
                    <option value={6}>6 mois</option>
                    <option value={12}>12 mois</option>
                  </select>

                </td>

                {/* ACTIONS */}
                <td className="space-x-2">

                  <button
                    onClick={() => assignerPlan(e.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Activer
                  </button>

                  <button
                    onClick={() => toggle(e.id)}
                    className="bg-orange-500 text-white px-3 py-1 rounded"
                  >
                    Toggle
                  </button>

                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}