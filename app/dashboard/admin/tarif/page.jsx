"use client";

import React, { useEffect, useState } from "react";
import TarifForm from "./component/TarifForm";
import TarifsListePage from "./component/TarifsListePage";
import { BanniereTarifsIncomplets } from "../component/BanniereTarifsIncomplets";
import api from "../../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

const Page = () => {
  const { user } = useAuth();

  const [annees, setAnnees] = useState([]);
  const [anneeFilter, setAnneeFilter] = useState("");

  useEffect(() => {
    if (!user?.ecole?.id) return;

    const chargerAnnees = async () => {
      try {
        const res = await api.get(
  `/annees/ecole/${user.ecole.id}`
);

        setAnnees(
  Array.isArray(res.data)
    ? res.data
    : Array.isArray(res.data?.content)
      ? res.data.content
      : []
);
      } catch (error) {
        console.error("Erreur chargement années scolaires :", error);
      }
    };

    chargerAnnees();
  }, [user?.ecole?.id]);

  return (
    <div className="space-y-6">

      {/* Bannière */}
      <BanniereTarifsIncomplets />

      {/* En-tête */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Tarifs par niveau
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gérez les tarifs selon l'année scolaire et les niveaux.
          </p>
        </div>

        {/* Filtre année */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="anneeFilter"
            className="text-sm font-medium text-slate-600"
          >
            Année :
          </label>

          <select
            id="anneeFilter"
            value={anneeFilter}
            onChange={(e) => setAnneeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">
              Toutes les années
            </option>

            {annees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenu */}
      <div className="">

        {/* Formulaire */}
        <div className="lg:col-span-1">
          <TarifForm />
        </div>

        {/* Liste */}
        <div className="lg:col-span-2">
          <TarifsListePage anneeFilter={anneeFilter} />
        </div>

      </div>
    </div>
  );
};

export default Page;