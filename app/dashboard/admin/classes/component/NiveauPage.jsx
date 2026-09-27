
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { Pencil, Check, X, Trash2, Loader2 } from "lucide-react";
import api from "../../../../../lib/api";

export default function NiveauPage() {
const { user } = useAuth();

const [nom, setNom] = useState("");
const [cycleId, setCycleId] = useState("");
const [niveaux, setNiveaux] = useState([]);
const [cycles, setCycles] = useState([]);

const [editingId, setEditingId] = useState(null);
const [editingNom, setEditingNom] = useState("");
const [editingCycleId, setEditingCycleId] = useState("");

const [erreur, setErreur] = useState("");
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);

// =========================================================
// CHARGEMENT
// =========================================================
const load = async () => {
if (!user?.ecole?.id) return;


try {
  setLoading(true);
  setErreur("");

  const [n, c] = await Promise.all([
    api.get(`/niveaux/ecole/${user.ecole.id}`),
    api.get(`/cycles/ecole/${user.ecole.id}`),
  ]);

  setNiveaux(Array.isArray(n.data) ? n.data : []);
  setCycles(Array.isArray(c.data) ? c.data : []);
} catch (err) {
  console.error("Erreur chargement niveaux/cycles :", err);
  setErreur("Impossible de charger les niveaux et les cycles.");
} finally {
  setLoading(false);
}

};

useEffect(() => {
if (user?.ecole?.id) {
load();
}
}, [user?.ecole?.id]);

// =========================================================
// CREATION
// =========================================================
const handleSubmit = async (e) => {
e.preventDefault();


if (!nom.trim()) {
  setErreur("Le nom du niveau est obligatoire.");
  return;
}

if (!cycleId) {
  setErreur("Veuillez sélectionner un cycle.");
  return;
}

try {
  setSaving(true);
  setErreur("");

  await api.post("/niveaux", {
    nom: nom.trim(),
    cycleId: Number(cycleId),
    ecoleId: user.ecole.id,
  });

  setNom("");
  setCycleId("");

  await load();
} catch (err) {
  console.error("Erreur création niveau :", err);

  setErreur(
    err?.response?.data?.message ||
      "Erreur lors de la création du niveau."
  );
} finally {
  setSaving(false);
}

};

// =========================================================
// SUPPRESSION
// =========================================================
const handleDelete = async (id) => {
if (!confirm("Supprimer ce niveau ?")) return;

try {
  setErreur("");

  await api.delete(`/niveaux/${id}`);

  await load();
} catch (err) {
  console.error("Erreur suppression niveau :", err);

  setErreur(
    err?.response?.data?.message ||
      "Impossible de supprimer ce niveau."
  );
}
const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;

    await api.post("/niveaux", {
      nom,
      cycleId: cycleId || null,
      ecoleId: user.ecole.id
    });

    setNom("");
    setCycleId("");
    load();
  };

};

// =========================================================
// MODIFICATION
// =========================================================
const startEdit = (n) => {
setEditingId(n.id);
setEditingNom(n.nom || "");
setEditingCycleId(n.cycle?.id ? String(n.cycle.id) : "");
setErreur("");
};

const cancelEdit = () => {
setEditingId(null);
setEditingNom("");
setEditingCycleId("");
setErreur("");
};

const saveEdit = async (id) => {
if (!editingNom.trim()) {
setErreur("Le nom ne peut pas être vide.");
return;
}

if (!editingCycleId) {
  setErreur("Veuillez sélectionner un cycle.");
  return;
}

try {
  setErreur("");

  await api.put(`/niveaux/${id}`, {
    nom: editingNom.trim(),
    cycleId: Number(editingCycleId),
    ecoleId: user.ecole.id,
  });

  cancelEdit();
  await load();
} catch (err) {
  console.error("Erreur modification niveau :", err);

  setErreur(
    err?.response?.data?.message ||
      "Erreur lors de la modification."
  );
}

};

// =========================================================
// RENDU
// =========================================================
return ( <div className="p-2 space-y-6">
{/* =====================================================
FORMULAIRE CREATION
===================================================== */} <form
     onSubmit={handleSubmit}
     className="bg-white p-4 shadow rounded-lg"
   > <h2 className="font-bold text-lg mb-3">
Créer un niveau </h2>
    <div className="space-y-3">
      {/* NOM */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Nom du niveau <span className="text-red-600">*</span>
        </label>

        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex : 10e, 9e, Terminale"
          className="border rounded p-2 w-full"
        />
      </div>

      {/* CYCLE */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Cycle <span className="text-red-600">*</span>
        </label>

        <select
          value={cycleId}
          onChange={(e) => setCycleId(e.target.value)}
          className="border rounded p-2 w-full"
        >
          <option value="">Sélectionner un cycle</option>

          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>

      {/* BOUTON */}
      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Ajout...
          </>
        ) : (
          "Ajouter"
        )}
      </button>
    </div>
  </form>

  {/* =====================================================
      ERREUR
  ===================================================== */}
  {erreur && (
    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
      {erreur}
    </div>
  )}

  {/* =====================================================
      TABLEAU
  ===================================================== */}
  <div className="bg-white shadow rounded-lg overflow-hidden">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-200">
          <th className="border p-2 text-left">
            Nom
          </th>

          <th className="border p-2 text-left">
            Cycle
          </th>

          <th className="border p-2 text-center">
            Action
          </th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td
              colSpan={3}
              className="border p-5 text-center text-gray-500"
            >
              <div className="flex justify-center items-center gap-2">
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Chargement...
              </div>
            </td>
          </tr>
        ) : niveaux.length === 0 ? (
          <tr>
            <td
              colSpan={3}
              className="border p-4 text-center text-gray-400"
            >
              Aucun niveau pour l'instant
            </td>
          </tr>
        ) : (
          niveaux.map((n) => (
            <tr key={n.id}>
              {/* NOM */}
              <td className="border p-2">
                {editingId === n.id ? (
                  <input
                    value={editingNom}
                    onChange={(e) =>
                      setEditingNom(e.target.value)
                    }
                    className="w-full border rounded px-2 py-1"
                    autoFocus
                  />
                ) : (
                  n.nom
                )}
              </td>

              {/* CYCLE */}
              <td className="border p-2">
                {editingId === n.id ? (
                  <select
                    value={editingCycleId}
                    onChange={(e) =>
                      setEditingCycleId(e.target.value)
                    }
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="">
                      Sélectionner un cycle
                    </option>

                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                ) : (
                  n.cycle?.nom || "—"
                )}
              </td>

              {/* ACTIONS */}
              <td className="border p-2">
                {editingId === n.id ? (
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => saveEdit(n.id)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                    >
                      <Check size={14} />
                      Valider
                    </button>

                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center gap-1 bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded"
                    >
                      <X size={14} />
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => startEdit(n)}
                      className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                    >
                      <Pencil size={14} />
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>


);
}
