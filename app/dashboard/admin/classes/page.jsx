"use client";

import { useState } from "react";
import CyclePage from "./component/CyclePage";
import NiveauPage from "./component/NiveauPage";
import SeriePage from "./component/SeriePage";
import GroupePage from "./component/GroupePage";
import ClassePage from "./component/ClassePage";
import SallePage from "./component/SallePage";


export default function ParametresScolaires() {

  const [tab, setTab] = useState("cycle");

  const tabs = [
    { key: "cycle", label: "Cycle" },
    { key: "niveau", label: "Niveau" },
    { key: "serie", label: "Série" },
    { key: "groupe", label: "Groupe" },
    { key: "salle", label: "Salle" },
    { key: "classe", label: "Classe" } // 🔥 AJOUT ICI
  ];

  return (
    <div className="">
     
      <h1 className="text-2xl font-bold">
        Paramètres scolaires
      </h1>

      {/* TABS */}
      <div className="flex gap-2 border-b pb-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1 rounded ${
              tab === t.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="mt-1">

        {tab === "cycle" && <CyclePage />}
        {tab === "niveau" && <NiveauPage />}
        {tab === "serie" && <SeriePage />}
        {tab === "groupe" && <GroupePage />}
        {tab === "classe" && <ClassePage />}
        {tab === "salle" && <SallePage />} {/* 🔥 AJOUT ICI */}

      </div>

    </div>
  );
}