"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";

export default function TarifForm() {
  const { user } = useAuth();

  const ecoleId = user?.ecole?.id;

  const [form, setForm] = useState({
    niveauId: "",
    anneeId: "",
    codeTypeFrais: "",
    montant: "",
  });

  const [niveaux, setNiveaux] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [types, setTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // ================= SAFE PARSE =================
  const safeArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  // ================= LOAD DATA =================
  useEffect(() => {
    if (!ecoleId) return;

    // NIVEAUX
    api.get(`/niveaux/ecole/${ecoleId}`)
      .then((res) => setNiveaux(safeArray(res.data)))
      .catch((err) => {
        console.error(err);
        setNiveaux([]);
      });

    // ANNEES SCOLAIRES
    api.get(`/annees/ecole/${ecoleId}`)
      .then((res) => setAnnees(safeArray(res.data)))
      .catch((err) => {
        console.error(err);
        setAnnees([]);
      });

    // TYPES DE FRAIS
    api.get(`/type-frais/ecole/${ecoleId}`)
      .then((res) => setTypes(safeArray(res.data)))
      .catch((err) => {
        console.error(err);
        setTypes([]);
      });
  }, [ecoleId]);

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= SUBMIT =================
  const submit = async (e) => {
    e.preventDefault();

    if (!ecoleId) {
      alert("❌ École introuvable");
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/tarifs`, null, {
        params: {
          ecoleId,
          niveauId: form.niveauId,
          anneeId: form.anneeId,
          codeTypeFrais: form.codeTypeFrais,
          montant: form.montant,
        },
      });

      alert("✅ Tarif enregistré avec succès");

      setForm({
        niveauId: "",
        anneeId: "",
        codeTypeFrais: "",
        montant: "",
      });
    } catch (err) {
      console.error("Erreur tarif :", err);
      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "❌ Erreur lors de l'enregistrement du tarif"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ================= UI =================
  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Gestion des tarifs
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Le tarif s'applique à tout un niveau, toutes séries et groupes
          confondus.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {/* NIVEAU */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Niveau
          </label>

          <select
            name="niveauId"
            value={form.niveauId}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">Sélectionner un niveau</option>

            {niveaux.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nom}
              </option>
            ))}
          </select>
        </div>

        {/* ANNEE */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Année scolaire
          </label>

          <select
            name="anneeId"
            value={form.anneeId}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">Sélectionner une année</option>

            {annees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>
        </div>

        {/* TYPE DE FRAIS */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Type de frais
          </label>

          <select
            name="codeTypeFrais"
            value={form.codeTypeFrais}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">Sélectionner un type de frais</option>

            {types.map((t) => (
              <option key={t.id} value={t.code}>
                {t.libelle}
              </option>
            ))}
          </select>
        </div>

        {/* MONTANT */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Montant
          </label>

          <input
            type="number"
            name="montant"
            value={form.montant}
            onChange={handleChange}
            placeholder="Ex : 50000"
            min="0"
            step="1"
            required
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        {/* BOUTON */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Enregistrement..." : "Enregistrer le tarif"}
          </button>
        </div>
      </form>
    </div>
  );
}