"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

export default function NotesPage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [notes, setNotes] = useState([]);

  const [coeff, setCoeff] = useState(1); // ✅ coeff dynamique

  const [form, setForm] = useState({
    classeId: "",
    eleveId: "",
    matiereId: "",
    anneeScolaireId: "",
    periode: "",
    nClass: "",
    nExem: ""
  });

  // ================= INIT =================
  useEffect(() => {
    if (!user?.ecole?.id) return;

    const loadData = async () => {
      try {
        const ecoleId = user.ecole.id;

        const [c, a] = await Promise.all([
          axios.get(`http://localhost:8080/api/classes/ecole/${ecoleId}`),
          axios.get(`http://localhost:8080/api/annees/ecole/${ecoleId}`)
        ]);

        setClasses(c.data);
        setAnnees(a.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [user]);

  // ================= ELEVE + MATIERE =================
  useEffect(() => {
    if (!form.classeId || !form.anneeScolaireId) return;

    const load = async () => {
      try {
        const [e, m] = await Promise.all([
          axios.get(
            `http://localhost:8080/api/inscriptions/classe/${form.classeId}/annee/${form.anneeScolaireId}`
          ),
          axios.get(
            `http://localhost:8080/api/matiereclasse/classe/${form.classeId}/annee/${form.anneeScolaireId}`
          )
        ]);

        setEleves(e.data);
        setMatieres(m.data);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [form.classeId, form.anneeScolaireId]);

  // ================= NOTES =================
  useEffect(() => {
    if (!form.classeId || !form.anneeScolaireId || !form.eleveId || !form.periode) return;

    const loadNotes = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/notes", {
          params: {
            classeId: form.classeId,
            anneeScolaireId: form.anneeScolaireId,
            eleveId: form.eleveId,
            periode: form.periode
          }
        });

        setNotes(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadNotes();
  }, [form.classeId, form.anneeScolaireId, form.eleveId, form.periode]);

  // ================= CHANGE =================
  const handleChange = (e) => {
    const updatedForm = {
      ...form,
      [e.target.name]: e.target.value
    };
    setForm(updatedForm);
  };

  // ================= GET COEFF =================
  const fetchCoeff = async (matiereId) => {
    if (!matiereId || !form.classeId || !form.anneeScolaireId) return;

    try {
      const res = await axios.get("http://localhost:8080/api/matiereclasse/coef", {
        params: {
          matiereId,
          classeId: form.classeId,
          anneeId: form.anneeScolaireId
        }
      });

      setCoeff(res.data);
    } catch (err) {
      console.error(err);
      setCoeff(1);
    }
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.eleveId ||
      !form.matiereId ||
      !form.classeId ||
      !form.anneeScolaireId ||
      !form.periode
    ) {
      alert("Champs manquants");
      return;
    }

    try {
      await axios.post("http://localhost:8080/api/notes", {
        eleveId: Number(form.eleveId),
        matiereId: Number(form.matiereId),
        classeId: Number(form.classeId),
        anneeScolaireId: Number(form.anneeScolaireId),
        periode: form.periode,
        nClass: Number(form.nClass),
        nExem: Number(form.nExem),
        coeff: coeff // ✅ backend
      });

      alert("Note ajoutée ✅");
    } catch (err) {
      alert(err.response?.data?.message || "Erreur");
    }
  };

  // ================= DOWNLOAD =================
  const downloadBulletin = async () => {
    try {
      if (!form.eleveId || !form.classeId || !form.anneeScolaireId || !form.periode) {
        alert("Remplis tout");
        return;
      }

      const res = await fetch(
        `http://localhost:8080/api/bulletins/generate?eleveId=${form.eleveId}&classeId=${form.classeId}&anneeId=${form.anneeScolaireId}&periode=${encodeURIComponent(form.periode)}`
      );

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "bulletin.pdf";
      a.click();
    } catch (err) {
      console.error(err);
      alert("Erreur PDF");
    }
  };

  return (
   <div className="min-h-screen  space-y-2">

  {/* TITLE */}
  <h1 className="text-2xl font-bold text-gray-700">
    Gestion des Notes
  </h1>

  {/* ================= FILTRES ================= */}
  <div className="bg-white p-4 rounded-2xl shadow-md">
    <h2 className="font-semibold mb-3 text-gray-600">Filtres</h2>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

      <select name="classeId" onChange={handleChange} className="input">
        <option value="">Classe</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>{c.nomComplet}</option>
        ))}
      </select>

      <select name="anneeScolaireId" onChange={handleChange} className="input">
        <option value="">Année</option>
        {annees.map(a => (
          <option key={a.id} value={a.id}>{a.nom}</option>
        ))}
      </select>

      <select name="eleveId" onChange={handleChange} className="input">
        <option value="">Élève</option>
        {eleves.map(e => (
          <option key={e.eleve?.id} value={e.eleve?.id}>
            {e.eleve?.nom} {e.eleve?.prenom}
          </option>
        ))}
      </select>

      <select name="periode" onChange={handleChange} className="input">
        <option value="">Période</option>
        <option>Trimestre 1</option>
        <option>Trimestre 2</option>
        <option>Trimestre 3</option>
      </select>

    </div>
  </div>

  {/* ================= FORM ================= */}
  <div className="bg-white p-4 rounded-2xl shadow-md space-y-3">
    <h2 className="font-semibold text-gray-600">Ajouter une note</h2>

    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">

      <select
        name="matiereId"
        onChange={(e) => {
          handleChange(e);
          fetchCoeff(e.target.value);
        }}
        className="input"
      >
        <option value="">Matière</option>
        {matieres.map(m => (
          <option key={m.matiere?.id} value={m.matiere?.id}>
            {m.matiere?.nom}
          </option>
        ))}
      </select>

      <input type="number" name="nClass" placeholder="Note classe" onChange={handleChange} className="input" />

      <input type="number" name="nExem" placeholder="Note examen" onChange={handleChange} className="input" />

      <button className="btn-primary">
        Ajouter
      </button>

      <button type="button" onClick={downloadBulletin} className="btn-success">
        Bulletin
      </button>

    </form>

    <p className="text-sm text-gray-500">
      Coefficient : <span className="font-semibold">{coeff}</span>
    </p>
  </div>

  {/* ================= TABLE ================= */}
  <div className="bg-white p-4 rounded-2xl shadow-md">

    <h2 className="font-semibold text-gray-600 mb-3">
      Liste des notes
    </h2>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">

        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="p-3 text-left">Matière</th>
            <th className="p-3">Classe</th>
            <th className="p-3">Examen</th>
            <th className="p-3">Coeff</th>
            <th className="p-3">Moyenne</th>
            <th className="p-3">Points</th>
          </tr>
        </thead>

        <tbody>
          {notes.map((n, index) => {
            const moyenne = ((n.nClass || 0) + (n.nExem || 0) * 2) / 3;
            const points = moyenne * (n.coeff || 1);

            return (
              <tr
                key={n.id}
                className={`border-t text-center ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100`}
              >
                <td className="p-3 text-left">{n.matiereNom}</td>
                <td className="p-3">{n.nClass}</td>
                <td className="p-3">{n.nExem}</td>
                <td className="p-3">{n.coeff || 1}</td>

                <td
                  className={`p-3 font-semibold ${
                    moyenne < 10
                      ? "text-red-500"
                      : moyenne < 12
                      ? "text-orange-500"
                      : "text-green-600"
                  }`}
                >
                  {moyenne.toFixed(2)}
                </td>

                <td className="p-3 font-bold">
                  {points.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>

      </table>
    </div>

    {/* MOYENNE GENERALE */}
    {notes.length > 0 && (
      <div className="mt-6 text-right">
        <span className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-bold text-lg">
          Moyenne Générale :{" "}
          {(
            notes.reduce((sum, n) => {
              const moyenne = ((n.nClass || 0) + (n.nExem || 0) * 2) / 3;
              return sum + moyenne * (n.coeff || 1);
            }, 0) /
            notes.reduce((sum, n) => sum + (n.coeff || 1), 0)
          ).toFixed(2)}
        </span>
      </div>
    )}

  </div>
</div> );
}