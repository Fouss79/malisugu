'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nomEcole: "",
    adresse: "",
    ville: "",
    pays: "",
    telephone: "",
    email: "",
    password: "",

    // Année scolaire
    dateDebutAnneeScolaire: "",
    dateFinAnneeScolaire: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Gestion des inputs
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    // Vérification des dates
    if (
      form.dateDebutAnneeScolaire &&
      form.dateFinAnneeScolaire &&
      form.dateFinAnneeScolaire <= form.dateDebutAnneeScolaire
    ) {
      setError(
        "La date de fin doit être postérieure à la date de début."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/register", form);

      console.log("✅ Inscription réussie :", res.data);

      // Redirection vers la page de connexion
      router.push("/login");
    } catch (err) {
      console.error("❌ Erreur inscription :", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de l'inscription"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">
          Créer une école
        </h2>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-2 rounded">
            {error}
          </p>
        )}

        {/* NOM ECOLE */}
        <input
          type="text"
          name="nomEcole"
          placeholder="Nom de l'école"
          value={form.nomEcole}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        {/* ADRESSE */}
        <input
          type="text"
          name="adresse"
          placeholder="Adresse"
          value={form.adresse}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* VILLE */}
        <input
          type="text"
          name="ville"
          placeholder="Ville"
          value={form.ville}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* PAYS */}
        <input
          type="text"
          name="pays"
          placeholder="Pays"
          value={form.pays}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* TELEPHONE */}
        <input
          type="text"
          name="telephone"
          placeholder="Téléphone"
          value={form.telephone}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* EMAIL */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        {/* MOT DE PASSE */}
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        {/* ANNEE SCOLAIRE */}
        <div className="pt-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Année scolaire
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* DATE DEBUT */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Date de début
              </label>

              <input
                type="date"
                name="dateDebutAnneeScolaire"
                value={form.dateDebutAnneeScolaire}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>

            {/* DATE FIN */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Date de fin
              </label>

              <input
                type="date"
                name="dateFinAnneeScolaire"
                value={form.dateFinAnneeScolaire}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
          </div>
        </div>

        {/* BOUTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Chargement..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
}