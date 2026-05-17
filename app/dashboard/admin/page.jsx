"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    enseignants: 0,
    matieres: 0,
    classes: 0,
  });

  const [chartData, setChartData] = useState([]);

  // 🔥 LOAD STATS
  const loadStats = async () => {
    if (!user?.ecole?.id) return;

    try {
      const res = await axios.get(
        `http://localhost:8080/api/dashboard/stats/${user.ecole.id}`
      );
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 LOAD CHART
  const loadChart = async () => {
    if (!user?.ecole?.id) return;

    try {
      const res = await axios.get(
        `http://localhost:8080/api/dashboard/chart/${user.ecole.id}`
      );
      setChartData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStats();
    loadChart();
  }, [user]);

  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6"];

  return (
    <div className="space-y-6">

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-gray-500">Enseignants</h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats.enseignants}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-gray-500">Matières</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats.matieres}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-gray-500">Classes</h3>
          <p className="text-3xl font-bold text-purple-600">
            {stats.classes}
          </p>
        </div>

      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* BAR CHART */}
        <div className="bg-white p-6 rounded-2xl shadow h-80">
          <h3 className="mb-4 text-gray-600 font-semibold">
            Répartition
          </h3>

          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART */}
        <div className="bg-white p-6 rounded-2xl shadow h-80">
          <h3 className="mb-4 text-gray-600 font-semibold">
            Distribution
          </h3>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  );
}