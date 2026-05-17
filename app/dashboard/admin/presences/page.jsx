"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

export default function PresenceTable() {
  const { user } = useAuth();

  const [classeId, setClasseId] = useState("");
  const [jour, setJour] = useState("Lundi");

  const [classes, setClasses] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [cours, setCours] = useState([]);
  const [presences, setPresences] = useState([]);
  const [stats, setStats] = useState([]);

  // ================= LOAD CLASSES =================
  useEffect(() => {
    if (!user?.ecole?.id) return;

    axios
      .get(`http://localhost:8080/api/classes/ecole/${user.ecole.id}`)
      .then(res => setClasses(res.data))
      .catch(err => console.error("classes error:", err));
  }, [user]);

  // ================= LOAD DATA =================
  const loadData = async () => {
    if (!classeId || !jour) {
      setEleves([]);
      setCours([]);
      setPresences([]);
      return;
    }

    try {
      const [resEleves, resCours] = await Promise.all([
        axios.get(`http://localhost:8080/api/classes/${classeId}/eleves`),
        axios.get(`http://localhost:8080/api/emploi/classe/${classeId}/jour/${jour}`)
      ]);

      setEleves(resEleves.data || []);
      setCours(resCours.data || []);

      const presencesResponses = await Promise.all(
        (resCours.data || []).map(c =>
          axios.get(`http://localhost:8080/api/presence/cours/${c.id}`)
        )
      );

      const allPresences = presencesResponses.flatMap(r => r.data || []);
      setPresences(allPresences);

    } catch (err) {
      console.error("loadData error:", err);
    }
  };
   const getAbsences = (eleveId) => {
  const s = stats.find(st => st.eleveId === eleveId);
  return s ? s.absent : 0;
};
  // ================= LOAD STATS =================
  const loadStats = async () => {
    if (!classeId) return;

    try {
      const res = await axios.get(
        `http://localhost:8080/api/presence/stats/classe/${classeId}`
      );

      setStats(res.data || []);
    } catch (err) {
      console.error("stats error:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadStats();
  }, [classeId, jour]);

  const toggleAbsence = async (eleveId, edtId) => {
  await axios.post(
    "http://localhost:8080/api/presence/toggle-absence",
    null,
    { params: { eleveId, edtId } }
  );

  loadData();
  loadStats();
};

  // ================= CHECK ABSENCE =================
  const isAbsent = (eleveId, edtId) => {
  return presences.some(
    p =>
      Number(p.eleve?.id) === Number(eleveId) &&
      Number(p.emploiDuTemps?.id) === Number(edtId)
  );
};

  // ================= ACTIONS GLOBAL =================
  const markAllPresent = async () => {
    try {
      await axios.post("http://localhost:8080/api/presence/all-present", {
        classeId,
        jour
      });

      loadData();
      loadStats();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAbsent = async () => {
    try {
      await axios.post("http://localhost:8080/api/presence/all-absent", {
        classeId,
        jour
      });

      loadData();
      loadStats();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen">

      {/* FILTRES */}
      <div className="flex gap-2 mb-2">
       
        <select
          value={classeId}
          onChange={(e) => setClasseId(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Classe</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.nomComplet}
            </option>
          ))}
        </select>

        <select
          value={jour}
          onChange={(e) => setJour(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option>Lundi</option>
          <option>Mardi</option>
          <option>Mercredi</option>
          <option>Jeudi</option>
          <option>Vendredi</option>
        </select>

        <button onClick={markAllPresent} className="bg-green-600 text-white px-4 rounded">
          Tout Présent
        </button>

        <button onClick={markAllAbsent} className="bg-red-600 text-white px-4 rounded">
          Tout Absent
        </button>

      </div>
        
      {/* TABLEAU */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* TABLE */}
      <table className="w-full">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-1">Élèves</th>

              {cours.map(c => (
                <th key={c.id} className="p-1">
                  {c.matiere?.nom} <br />
                  {c.heureDebut}h-{c.heureFin}h
                </th>
                
              ))}
              <th className="p-1 bg-red-100">Absences</th>
            </tr>
          </thead>

         <tbody>
  {eleves.map(eleve => (
    <tr key={eleve.id} className="border-t">

      {/* NOM ELEVE */}
      <td className="p-1">
        {eleve.nom} {eleve.prenom}
      </td>

      {/* COURS */}
      {cours.map(c => {
        const absent = isAbsent(eleve.id, c.id);

        return (
          <td key={c.id} className="p-1 text-center">
            <button
              onClick={() => toggleAbsence(eleve.id, c.id)}
              className={`px-2 py-1 rounded text-white
                ${absent ? "bg-red-500" : "bg-green-500"}`}
            >
              {absent ? "✖" : "✔"}
            </button>
          </td>
        );
      })}

      {/* ✅ COLONNE ABSENCES */}
      <td className="p-1 text-center font-bold text-red-600">
        {getAbsences(eleve.id)}
      </td>

    </tr>
  ))}
</tbody>
        </table>

      </div>
    </div>
  );
}