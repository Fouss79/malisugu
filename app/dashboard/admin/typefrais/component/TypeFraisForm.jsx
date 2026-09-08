"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";

export default function TypeFraisForm() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  const [form, setForm] = useState({
    code: "",
    libelle: "",
    frequence: "UNIQUE",
  });

  const [typesFrais, setTypesFrais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ==============================
  // Charger les types de frais
  // ==============================
  const chargerTypesFrais = async () => {
    if (!ecoleId) return;

    try {
      setLoading(true);

      const res = await api.get(`/type-frais/ecole/${ecoleId}`);

      setTypesFrais(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Erreur chargement types de frais :", error);
      setTypesFrais([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerTypesFrais();
  }, [ecoleId]);

  // ==============================
  // Modification formulaire
  // ==============================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==============================
  // Création
  // ==============================
  const submit = async (e) => {
    e.preventDefault();

    if (!ecoleId) {
      alert("École introuvable");
      return;
    }

    try {
      setSaving(true);

      await api.post(`/type-frais/ecole/${ecoleId}`, form);

      alert("Type de frais créé");

      setForm({
        code: "",
        libelle: "",
        frequence: "UNIQUE",
      });

      // Recharger la liste
      await chargerTypesFrais();
    } catch (error) {
      console.error("Erreur création type de frais :", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Erreur lors de l'enregistrement"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // Supprimer
  // ==============================
  const supprimer = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce type de frais ?")) {
      return;
    }

    try {
      await api.delete(`/type-frais/${id}`);

      await chargerTypesFrais();
    } catch (error) {
      console.error("Erreur suppression :", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Impossible de supprimer ce type de frais"
      );
    }
  };

  // ==============================
  // Libellé fréquence
  // ==============================
  const getFrequenceLabel = (frequence) => {
    switch (frequence) {
      case "UNIQUE":
        return "Paiement unique";

      case "MENSUEL":
        return "Mensuel";

      case "TRIMESTRIEL":
        return "Trimestriel";

      case "ANNUEL":
        return "Annuel";

      default:
        return frequence;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* =========================
          FORMULAIRE
      ========================== */}
      <div className="bg-white p-5 rounded-xl shadow w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          Création Type de frais
        </h2>

        <form onSubmit={submit} className="space-y-3">
          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="Ex: SCOLARITE"
            className="w-full border p-2 rounded"
            required
          />

          <input
            name="libelle"
            value={form.libelle}
            onChange={handleChange}
            placeholder="Ex: Frais de scolarité"
            className="w-full border p-2 rounded"
            required
          />

          <select
            name="frequence"
            value={form.frequence}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="UNIQUE">Paiement unique</option>
            <option value="MENSUEL">Mensuel</option>
            <option value="TRIMESTRIEL">Trimestriel</option>
            <option value="ANNUEL">Annuel</option>
          </select>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded transition"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>

      {/* =========================
          LISTE DES TYPES DE FRAIS
      ========================== */}
      <div className="bg-white rounded-xl shadow p-5 w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Types de frais enregistrés
          </h2>

          <span className="text-sm text-gray-500">
            {typesFrais.length} type{typesFrais.length > 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Chargement...
          </div>
        ) : typesFrais.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun type de frais enregistré.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-3 border-b">Code</th>
                  <th className="p-3 border-b">Libellé</th>
                  <th className="p-3 border-b">Fréquence</th>
                  <th className="p-3 border-b text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {typesFrais.map((type) => (
                  <tr
                    key={type.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="p-3 border-b">
                      <span className="font-semibold text-gray-700">
                        {type.code}
                      </span>
                    </td>

                    <td className="p-3 border-b">
                      {type.libelle}
                    </td>

                    <td className="p-3 border-b">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">
                        {getFrequenceLabel(type.frequence)}
                      </span>
                    </td>

                    <td className="p-3 border-b text-center">
                      <button
                        onClick={() => supprimer(type.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}