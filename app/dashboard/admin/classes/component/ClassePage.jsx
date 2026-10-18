"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import api from "../../../../../lib/api";

const FORM_VIDE = { cycleId: "", niveauId: "", serieId: "", groupeId: "", salleId: "" };

// Extrait un message lisible d'une erreur Spring (texte ou objet JSON)
const messageErreur = (err, parDefaut) => {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return data?.message || data?.error || parDefaut;
};

// ---------- Lecture du cycle d'un niveau (accepte cycle: {id, nom} ou cycleId / cycleNom) ----------
const cleCycle = (niveau) =>
  String(niveau?.cycle?.id ?? niveau?.cycleId ?? niveau?.cycle?.nom ?? niveau?.cycleNom ?? "");

const nomCycle = (niveau) => niveau?.cycle?.nom ?? niveau?.cycleNom ?? "";

export default function ClassePage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [series, setSeries] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [salles, setSalles] = useState([]);

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

  // Séries du niveau choisi (les anciennes séries sans niveau restent visibles)
  const seriesDuNiveau = (niveauId) =>
    niveauId
      ? series.filter((s) => {
          const nid = s.niveau?.id ?? s.niveauId;
          return nid == null || String(nid) === String(niveauId);
        })
      : [];

  const niveauxDuCycle = (cycleId) =>
    cycleId ? niveaux.filter((n) => cleCycle(n) === String(cycleId)) : [];

  // ================= LOAD DATA =================
  const loadData = async () => {
    if (!user?.ecole?.id) return;

    try {
      const [c, n, s, g, sa] = await Promise.all([
        api.get(`/classes/ecole/${user.ecole.id}`),
        api.get(`/niveaux/ecole/${user.ecole.id}`),
        api.get(`/series/ecole/${user.ecole.id}`),
        api.get(`/groupes/ecole/${user.ecole.id}`),
        api.get(`/salles/ecole/${user.ecole.id}`),
      ]);

      setClasses(c.data);
      setNiveaux(n.data);
      setSeries(s.data);
      setGroupes(g.data);
      setSalles(sa.data);
    } catch (err) {
      console.error("Erreur loadData:", err);
    }
  };

  useEffect(() => {
    if (user?.ecole?.id) loadData();
  }, [user]);

  // ================= CHANGEMENT DE CHAMP (commun création / édition) =================
  const appliquerChangement = (prev, name, value) => {
    const suivant = { ...prev, [name]: value };

    // Changer de cycle : on vide le niveau et la série
    if (name === "cycleId") {
      suivant.niveauId = "";
      suivant.serieId = "";
    }

    // Changer de niveau : la série dépend du niveau, on la vide
    if (name === "niveauId") {
      suivant.serieId = "";
    }

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

    if (!form.cycleId) {
      alert("⚠️ Choisis d'abord un cycle");
      return;
    }

    if (!form.niveauId) {
      alert("⚠️ Le niveau est obligatoire");
      return;
    }

    if (!form.serieId) {
      alert("⚠️ La série est obligatoire");
      return;
    }

    try {
      await api.post("/classes", {
        niveauId: form.niveauId,
        serieId: form.serieId || null,
        groupeId: form.groupeId || null,
        salleId: form.salleId || null,
        ecoleId: user.ecole.id,
      });

      alert("✅ Classe créée");
      setForm(FORM_VIDE);
      loadData();
    } catch (err) {
      console.error(err);
      alert(messageErreur(err, "❌ Erreur création classe"));
    }
  };

  // ================= ÉDITION =================
  const startEdit = (c) => {
    const niveau = niveaux.find((n) => n.id === c.niveau?.id) ?? c.niveau;

    setEditingId(c.id);
    setEditingForm({
      cycleId: cleCycle(niveau),
      niveauId: c.niveau?.id || "",
      serieId: c.serie?.id || "",
      groupeId: c.groupe?.id || "",
      salleId: c.salle?.id || "",
    });
    setErreur("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingForm(FORM_VIDE);
  };

  const saveEdit = async (id) => {
    if (!editingForm.niveauId) {
      setErreur("Le niveau est obligatoire");
      return;
    }

    if (!editingForm.serieId) {
      setErreur("La série est obligatoire");
      return;
    }

    try {
      await api.put(`/classes/${id}`, {
        niveauId: editingForm.niveauId,
        serieId: editingForm.serieId || null,
        groupeId: editingForm.groupeId || null,
        salleId: editingForm.salleId || null,
        ecoleId: user.ecole.id,
      });
      setErreur("");
      cancelEdit();
      loadData();
    } catch (err) {
      console.error(err);
      setErreur(messageErreur(err, "Erreur lors de la modification"));
    }
  };

  // ================= SUPPRESSION =================
  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette classe ?")) return;
    try {
      await api.delete(`/classes/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
      alert(
        messageErreur(
          err,
          "Impossible de supprimer cette classe (des élèves y sont peut-être encore inscrits)"
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* FORMULAIRE */}
      <div className="rounded bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-bold">Créer une classe</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
          {/* 1. CYCLE */}
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

          {/* 2. NIVEAU (filtré par cycle) */}
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

          {/* 3. SÉRIE */}
          <select
            name="serieId"
            value={form.serieId}
            onChange={handleChange}
            required
            disabled={!form.niveauId}
            className="border p-2 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">
              {form.niveauId ? "3. Série (obligatoire)" : "3. Série (choisis un niveau)"}
            </option>
            {seriesDuNiveau(form.niveauId).map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>

          <select name="groupeId" value={form.groupeId} onChange={handleChange} className="border p-2">
            <option value="">Groupe</option>
            {groupes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom}
              </option>
            ))}
          </select>

          <select
            name="salleId"
            value={form.salleId}
            onChange={handleChange}
            className="col-span-2 border p-2"
          >
            <option value="">Salle fixe (optionnel)</option>
            {salles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
                {s.capacite ? ` (${s.capacite} places)` : ""}
              </option>
            ))}
          </select>

          <button type="submit" className="col-span-2 rounded bg-blue-600 py-2 text-white">
            Créer classe
          </button>
        </form>
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      {/* TABLE */}
      <div className="rounded p-1 shadow">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-1">Cycle / Niveau</th>
              <th className="border p-1">Série</th>
              <th className="border p-1">Groupe</th>
              <th className="border p-1">Salle</th>
              <th className="border p-1">Nom complet</th>
              <th className="border p-1">Action</th>
            </tr>
          </thead>

          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                {editingId === c.id ? (
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
                          {cycles.map((cy) => (
                            <option key={cy.id} value={cy.id}>
                              {cy.nom}
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
                      <select
                        name="serieId"
                        value={editingForm.serieId}
                        onChange={handleEditingChange}
                        className="w-full border p-1"
                      >
                        <option value="">Série (obligatoire)</option>
                        {seriesDuNiveau(editingForm.niveauId).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nom}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-1">
                      <select
                        name="groupeId"
                        value={editingForm.groupeId}
                        onChange={handleEditingChange}
                        className="w-full border p-1"
                      >
                        <option value="">Groupe</option>
                        {groupes.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nom}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-1">
                      <select
                        name="salleId"
                        value={editingForm.salleId}
                        onChange={handleEditingChange}
                        className="w-full border p-1"
                      >
                        <option value="">Salle (optionnel)</option>
                        {salles.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nom}
                            {s.capacite ? ` (${s.capacite} places)` : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-1 text-center text-gray-400">—</td>
                    <td className="border p-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(c.id)}
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
                      <div className="font-medium">{c.niveau?.nom}</div>
                      {nomCycle(c.niveau) && (
                        <div className="text-xs text-gray-500">{nomCycle(c.niveau)}</div>
                      )}
                    </td>
                    <td className="border p-1">{c.serie?.nom || "—"}</td>
                    <td className="border p-1">{c.groupe?.nom || "—"}</td>
                    <td className="border p-1">{c.salle?.nom || "—"}</td>
                    <td className="border p-1 font-bold text-blue-600">
                      {c.nomComplet ||
                        [c.niveau?.nom, c.serie?.nom, c.groupe?.nom].filter(Boolean).join(" ")}
                    </td>
                    <td className="border p-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(c)}
                          className="flex items-center gap-1 rounded bg-yellow-500 px-2 py-1 text-white"
                        >
                          <Pencil size={14} />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
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

            {classes.length === 0 && (
              <tr>
                <td colSpan={6} className="border p-3 text-center text-gray-400">
                  Aucune classe pour l'instant
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}