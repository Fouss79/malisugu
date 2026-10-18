"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import api from "../../../../../lib/api";

// ---------- Lecture du cycle d'un niveau (accepte cycle: {id, nom} ou cycleId / cycleNom) ----------
const cleCycle = (niveau) =>
  String(niveau?.cycle?.id ?? niveau?.cycleId ?? niveau?.cycle?.nom ?? niveau?.cycleNom ?? "");

const nomCycle = (niveau) => niveau?.cycle?.nom ?? niveau?.cycleNom ?? "";

// Extrait un message lisible d'une erreur Spring (texte ou objet JSON)
const messageErreur = (err, parDefaut) => {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return data?.message || data?.error || parDefaut;
};

const FORM_VIDE = { cycleId: "", niveauId: "", nom: "" };

export default function SeriePage() {
  const { user } = useAuth();

  const [series, setSeries] = useState([]);
  const [niveaux, setNiveaux] = useState([]);

  const [form, setForm] = useState(FORM_VIDE);

  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(FORM_VIDE);
  const [erreur, setErreur] = useState("");

  // ================= CYCLES (déduits des niveaux) =================
  const cycles = useMemo(() => {
    const vus = new Map();
    niveaux.forEach((n) => {
      const cle = cleCycle(n);
      if (cle && !vus.has(cle)) vus.set(cle, { id: cle, nom: nomCycle(n) || `Cycle ${cle}` });
    });
    return [...vus.values()];
  }, [niveaux]);

  const niveauxDuCycle = (cycleId) =>
    cycleId ? niveaux.filter((n) => cleCycle(n) === String(cycleId)) : [];

  // ================= CHARGEMENT =================
  const load = async () => {
    try {
      const [s, n] = await Promise.all([
        api.get(`/series/ecole/${user.ecole.id}`),
        api.get(`/niveaux/ecole/${user.ecole.id}`),
      ]);
      setSeries(s.data);
      setNiveaux(n.data);
    } catch (err) {
      console.error("Erreur chargement séries :", err);
    }
  };

  useEffect(() => {
    if (user?.ecole?.id) load();
  }, [user]);

  // ================= CHANGEMENT DE CHAMP (commun création / édition) =================
  const appliquerChangement = (prev, name, value) => {
    const suivant = { ...prev, [name]: value };
    if (name === "cycleId") suivant.niveauId = "";
    return suivant;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => appliquerChangement(prev, name, value));
  };

  const handleEditingChange = (e) => {
    const { name, value } = e.target;
    setEditingForm((prev) => appliquerChangement(prev, name, value));
  };

  // ================= CRÉATION =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    if (!form.cycleId || !form.niveauId) {
      setErreur("Le cycle et le niveau sont obligatoires");
      return;
    }

    if (!form.nom.trim()) {
      setErreur("Le nom de la série est obligatoire");
      return;
    }

    try {
      await api.post("/series", {
        nom: form.nom.trim(),
        niveauId: form.niveauId,
        ecoleId: user.ecole.id,
      });

      // On garde cycle et niveau pour enchaîner plusieurs séries sur le même niveau
      setForm((prev) => ({ ...prev, nom: "" }));
      load();
    } catch (err) {
      console.error(err);
      setErreur(messageErreur(err, "Erreur lors de la création de la série"));
    }
  };

  // ================= SUPPRESSION =================
  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette série ?")) return;

    try {
      await api.delete(`/series/${id}`);
      load();
    } catch (err) {
      console.error(err);
      setErreur(
        messageErreur(err, "Impossible de supprimer cette série (des classes l'utilisent peut-être)")
      );
    }
  };

  // ================= ÉDITION =================
  const startEdit = (s) => {
    const niveau = niveaux.find((n) => n.id === (s.niveau?.id ?? s.niveauId)) ?? s.niveau;

    setEditingId(s.id);
    setEditingForm({
      cycleId: niveau ? cleCycle(niveau) : "",
      niveauId: s.niveau?.id ?? s.niveauId ?? "",
      nom: s.nom,
    });
    setErreur("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingForm(FORM_VIDE);
  };

  const saveEdit = async (id) => {
    if (!editingForm.nom.trim()) {
      setErreur("Le nom ne peut pas être vide");
      return;
    }

    if (!editingForm.niveauId) {
      setErreur("Le niveau est obligatoire");
      return;
    }

    try {
      await api.put(`/series/${id}`, {
        nom: editingForm.nom.trim(),
        niveauId: editingForm.niveauId,
        ecoleId: user.ecole.id,
      });
      setErreur("");
      cancelEdit();
      load();
    } catch (err) {
      console.error(err);
      setErreur(messageErreur(err, "Erreur lors de la modification"));
    }
  };

  // Séries triées par cycle, puis niveau, puis nom (les séries sans niveau en dernier)
  const seriesTriees = useMemo(() => {
    const cle = (s) => `${nomCycle(s.niveau) || "~"}|${s.niveau?.nom || "~"}|${s.nom}`;
    return [...series].sort((a, b) => cle(a).localeCompare(cle(b)));
  }, [series]);

  return (
    <div className="space-y-6 p-2">
      {/* FORMULAIRE */}
      <form onSubmit={handleSubmit} className="rounded bg-white p-2 shadow">
        <h2 className="font-bold">Créer une série</h2>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <select
            name="cycleId"
            value={form.cycleId}
            onChange={handleChange}
            required
            className="border p-2"
          >
            <option value="">1. Cycle</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>

          <select
            name="niveauId"
            value={form.niveauId}
            onChange={handleChange}
            required
            disabled={!form.cycleId}
            className="border p-2 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">
              {form.cycleId ? "2. Niveau" : "2. Niveau (choisis un cycle)"}
            </option>
            {niveauxDuCycle(form.cycleId).map((n) => (
              <option key={n.id} value={n.id}>
                {n.nom}
              </option>
            ))}
          </select>

          <input
            name="nom"
            value={form.nom}
            onChange={handleChange}
            placeholder="3. Nom de la série (Ex: TSE, TSS, GENERAL)"
            className="col-span-2 border p-2"
          />
        </div>

        <button className="mt-2 bg-blue-600 px-4 py-2 text-white">Ajouter</button>
      </form>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      {/* TABLE */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-1">Cycle / Niveau</th>
            <th className="border p-1">Nom</th>
            <th className="border p-1">Action</th>
          </tr>
        </thead>

        <tbody>
          {seriesTriees.map((s) => (
            <tr key={s.id}>
              {editingId === s.id ? (
                <>
                  <td className="border p-1">
                    <div className="flex flex-col gap-1">
                      <select
                        name="cycleId"
                        value={editingForm.cycleId}
                        onChange={handleEditingChange}
                        className="w-full border p-1"
                      >
                        <option value="">Cycle</option>
                        {cycles.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nom}
                          </option>
                        ))}
                      </select>

                      <select
                        name="niveauId"
                        value={editingForm.niveauId}
                        onChange={handleEditingChange}
                        disabled={!editingForm.cycleId}
                        className="w-full border p-1 disabled:bg-gray-100"
                      >
                        <option value="">Niveau</option>
                        {niveauxDuCycle(editingForm.cycleId).map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  <td className="border p-1">
                    <input
                      name="nom"
                      value={editingForm.nom}
                      onChange={handleEditingChange}
                      className="w-full border px-2 py-1"
                      autoFocus
                    />
                  </td>

                  <td className="border p-1">
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(s.id)}
                        className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-white"
                      >
                        <Check size={14} />
                        Valider
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 rounded bg-gray-400 px-2 py-1 text-white"
                      >
                        <X size={14} />
                        Annuler
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="border p-1">
                    {s.niveau ? (
                      <>
                        <div className="font-medium">{s.niveau.nom}</div>
                        {nomCycle(s.niveau) && (
                          <div className="text-xs text-gray-500">{nomCycle(s.niveau)}</div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-orange-600">Sans niveau — à rattacher</span>
                    )}
                  </td>

                  <td className="border p-1">{s.nom}</td>

                  <td className="border p-1">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(s)}
                        className="flex items-center gap-1 rounded bg-yellow-500 px-2 py-1 text-white"
                      >
                        <Pencil size={14} />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-white"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}

          {series.length === 0 && (
            <tr>
              <td colSpan={3} className="border p-3 text-center text-gray-400">
                Aucune série pour l'instant
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}