"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";

export default function SuperAdminDashboard() {

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/api/superadmin/stats")
      .then(res => {
        if (!res.ok) throw new Error("Erreur serveur");
        return res.json();
      })
      .then(data => setStats(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Chargement...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  const dataChart = [
    { name: "BASIC", value: stats?.basic || 0 },
    { name: "PRO", value: stats?.pro || 0 },
    { name: "PREMIUM", value: stats?.premium || 0 }
  ];

  const COLORS = {
    BASIC: "#1f2937",
    PRO: "#2563eb",
    PREMIUM: "#db2777"
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">

      {/* 🔵 GLOBAL STATS */}
      <div className="grid grid-cols-4 gap-4">

        <div className="bg-blue-600 text-white p-4 rounded-xl shadow">
          Écoles : {stats?.totalEcoles || 0}
        </div>

        <div className="bg-green-600 text-white p-4 rounded-xl shadow">
          Élèves : {stats?.totalEleves || 0}
        </div>

        <div className="bg-purple-600 text-white p-4 rounded-xl shadow">
          Enseignants : {stats?.totalEnseignants || 0}
        </div>

        <div className="bg-yellow-500 text-white p-4 rounded-xl shadow">
          Actives : {stats?.ecolesActives || 0}
        </div>

      </div>

      {/* 🟣 PLANS */}
      <div className="grid grid-cols-3 gap-4">

        <div className="bg-gray-800 text-white p-4 rounded-xl">
          BASIC : {stats?.basic || 0}
        </div>

        <div className="bg-blue-800 text-white p-4 rounded-xl">
          PRO : {stats?.pro || 0}
        </div>

        <div className="bg-pink-600 text-white p-4 rounded-xl">
          PREMIUM : {stats?.premium || 0}
        </div>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* 📊 BAR CHART */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="mb-4 font-semibold">Répartition des plans</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dataChart}>
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />

            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#111827",
                color: "#fff"
              }}
            />

            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
              {dataChart.map((entry, index) => (
                <Cell key={index} fill={COLORS[entry.name]} />
              ))}
            </Bar>

          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* 🥧 PIE CHART */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="mb-4 font-semibold">Distribution des abonnements</h2>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataChart}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {dataChart.map((entry, index) => (
                <Cell key={index} fill={COLORS[entry.name]} />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      </div>

    </div>
  );
}