"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { X, Menu } from "lucide-react";
import api from "../../lib/api";

export default function LoginPage() {

  const { login } = useAuth();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // =====================================================
  // Mapping rôle -> route de destination
  // Adapte les clés exactement aux valeurs renvoyées par ton backend
  // =====================================================
  const redirectByRole = {
    SUPER_ADMIN: "/dashboard/superadmin",
    ADMIN: "/dashboard/admin",
    ENSEIGNANT: "/dashboard/enseignant",
    ELEVE: "/dashboard/eleve",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // =====================================================
      // CONNEXION
      // =====================================================
      const res = await api.post("/auth/login", form);

      const data = res.data;

      console.log("✅ Connexion réussie :", data);

      // =====================================================
      // LOGIN CONTEXT (pose les cookies token / role / permissions)
      // =====================================================
      login(data);

      // =====================================================
      // REDIRECTION SELON LE RÔLE RÉEL DE L'UTILISATEUR
      // =====================================================
      const destination = redirectByRole[data.role] || "/dashboard";

      router.push(destination);

    } catch (err) {

      console.error("❌ Erreur connexion :", err);

      if (err.response) {
        // Erreur venant du backend
        setError(
          err.response.data?.message ||
          "Email ou mot de passe incorrect"
        );
      } else if (err.request) {
        // Backend inaccessible
        setError(
          "Impossible de contacter le serveur. Vérifiez votre connexion."
        );
      } else {
        setError("Une erreur est survenue.");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">

        <div className="flex justify-between items-center px-4 md:px-6 py-3 max-w-7xl mx-auto">

          {/* LOGO */}
          <Link href="/">
            <h1 className="text-xl md:text-2xl font-bold italic text-gray-700">
              Kalan<span className="text-yellow-600">SO</span>
            </h1>
          </Link>

          {/* MENU DESKTOP */}
          <nav className="hidden md:flex items-center gap-6 text-gray-600 font-medium">

            <a
              href="#features"
              className="hover:text-yellow-600 transition"
            >
              Fonctionnalités
            </a>

            <a
              href="#pricing"
              className="hover:text-yellow-600 transition"
            >
              Tarifs
            </a>

            <a
              href="#stats"
              className="hover:text-yellow-600 transition"
            >
              Statistiques
            </a>

          </nav>

          {/* ACTIONS DESKTOP */}
          <div className="hidden md:flex items-center gap-3">

            <Link href="/login">
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition">
                Se connecter
              </button>
            </Link>

            <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition shadow">
              S'inscrire
            </button>

          </div>

          {/* BURGER MOBILE */}
          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>

        </div>

        {/* =====================================================
            MENU MOBILE
        ===================================================== */}
        {open && (
          <div className="md:hidden bg-white border-t px-4 py-4 space-y-4 shadow-md">

            <a
              href="#features"
              className="block text-gray-600 hover:text-yellow-600"
              onClick={() => setOpen(false)}
            >
              Fonctionnalités
            </a>

            <a
              href="#pricing"
              className="block text-gray-600 hover:text-yellow-600"
              onClick={() => setOpen(false)}
            >
              Tarifs
            </a>

            <a
              href="#stats"
              className="block text-gray-600 hover:text-yellow-600"
              onClick={() => setOpen(false)}
            >
              Statistiques
            </a>

            <Link href="/login">
              <button className="w-full px-4 py-2 border rounded-lg">
                Se connecter
              </button>
            </Link>

            <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg">
              S'inscrire
            </button>

          </div>
        )}

      </header>

      {/* =====================================================
          LOGIN
      ===================================================== */}
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
        >

          <h2 className="text-2xl font-bold text-center">
            Connexion
          </h2>

          {/* ERREUR */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* EMAIL */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
            autoComplete="email"
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
            autoComplete="current-password"
          />

          {/* BOUTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

        </form>

      </div>

    </div>
  );
}