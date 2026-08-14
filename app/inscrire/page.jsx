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
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Gestion des inputs
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  setLoading(true);
  setError("");

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Créer une école</h2>

        {error && <p className="text-red-500">{error}</p>}

        <input
          type="text"
          name="nomEcole"
          placeholder="Nom de l'école"
          value={form.nomEcole}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="text"
          name="adresse"
          placeholder="Adresse"
          value={form.adresse}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          name="ville"
          placeholder="Ville"
          value={form.ville}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          name="pays"
          placeholder="Pays"
          value={form.pays}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          name="telephone"
          placeholder="Téléphone"
          value={form.telephone}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Chargement..." : "S'inscrire"}
        </button>

      </form>
    </div>
  );
}