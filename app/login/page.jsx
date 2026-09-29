"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import api from "../../lib/api";

/* =========================================================
   TYPOGRAPHIE / PALETTE — identiques aux autres pages
========================================================= */

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const INK = "#101B33";
const INK_SOFT = "#5B6478";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const CREAM = "#F8F6EF";

/* =========================================================
   CHAMP — même composant que RegisterPage
========================================================= */

function Champ({ label, required, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium" style={{ color: INK_SOFT }}>
        {label}
        {required && <span style={{ color: GOLD }}> *</span>}
      </span>

      <input
        {...props}
        required={required}
        className="w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2"
        style={{ borderColor: "#DEDCD0", color: INK }}
        onFocus={(e) => (e.target.style.borderColor = GOLD)}
        onBlur={(e) => (e.target.style.borderColor = "#DEDCD0")}
      />
    </label>
  );
}

export default function LoginPage() {

  const { login } = useAuth();
  const router = useRouter();

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
  // REDIRECTION SELON LE RÔLE
  // =====================================================
  const getDashboardRoute = (role) => {

    const normalizedRole = role?.trim().toUpperCase();

    // Exception SUPER_ADMIN
    if (normalizedRole === "SUPER_ADMIN") {
      return "/dashboard/superadmin";
    }

    // Exception ADMIN
    if (normalizedRole === "ADMIN") {
      return "/dashboard/admin";
    }

    // Tous les autres rôles sont dynamiques
    if (normalizedRole) {
      return `/dashboard/admin/${normalizedRole.toLowerCase()}`;
    }

    // Aucun rôle
    return "/dashboard";
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
      console.log("👤 Rôle :", data.role);

      // =====================================================
      // ENREGISTREMENT DE L'UTILISATEUR
      // =====================================================
      login(data);

      // =====================================================
      // REDIRECTION
      // =====================================================
      const destination = getDashboardRoute(data.role);

      console.log("🚀 Redirection vers :", destination);

      router.push(destination);

    } catch (err) {

      console.error("❌ Erreur connexion :", err);

      if (err.response) {

        setError(
          err.response.data?.message ||
          "Email ou mot de passe incorrect"
        );

      } else if (err.request) {

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
    <div
      className={`${fraunces.variable} ${inter.variable} flex min-h-screen`}
      style={{ fontFamily: "var(--font-body), sans-serif" }}
    >

      {/* =====================================================
          PANNEAU DE MARQUE (masqué sur mobile)
      ===================================================== */}

      <div
        className="relative hidden w-[42%] flex-col justify-between overflow-hidden px-12 py-14 lg:flex"
        style={{ background: INK }}
      >
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: `${TEAL}22` }}
        />
        <div
          className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full blur-3xl"
          style={{ background: `${GOLD}22` }}
        />

        <Link
          href="/"
          className="relative text-2xl font-semibold text-white"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Dani<span style={{ color: GOLD_2 }}>school</span>
        </Link>

        <div className="relative max-w-sm">
          <h2
            className="text-3xl font-medium leading-tight text-white"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Retrouvez votre école en un instant.
          </h2>

          <p className="mt-4 text-white/70">
            Élèves, enseignants, présences et paiements — tout est déjà là,
            là où vous l&apos;avez laissé.
          </p>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Danischool
        </p>
      </div>

      {/* =====================================================
          FORMULAIRE
      ===================================================== */}

      <div
        className="flex flex-1 items-center justify-center p-4 sm:p-8"
        style={{ background: CREAM }}
      >
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-5 rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
          style={{ borderColor: "#E4E1D6" }}
        >

          <div className="mb-2 lg:hidden">
            <Link
              href="/"
              className="text-xl font-semibold"
              style={{ fontFamily: "var(--font-display), serif", color: INK }}
            >
              Dani<span style={{ color: GOLD }}>school</span>
            </Link>
          </div>

          <div>
            <h1
              className="text-2xl font-medium"
              style={{ fontFamily: "var(--font-display), serif", color: INK }}
            >
              Connexion
            </h1>
            <p className="mt-1 text-sm" style={{ color: INK_SOFT }}>
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          {/* ERREUR */}
          {error && (
            <p
              className="rounded-lg border px-3 py-2.5 text-sm"
              style={{ borderColor: "#F3C9BE", background: "#FBEEEA", color: "#9D3929" }}
            >
              {error}
            </p>
          )}

          {/* EMAIL */}
          <Champ
            label="Email"
            required
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />

          {/* MOT DE PASSE */}
          <Champ
            label="Mot de passe"
            required
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
          />

          {/* BOUTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: INK }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <p className="text-center text-sm" style={{ color: INK_SOFT }}>
            Pas encore de compte ?{" "}
            <Link href="/inscrire" className="font-semibold" style={{ color: GOLD }}>
              Créer une école
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
}