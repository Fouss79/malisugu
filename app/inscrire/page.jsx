"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import api from "../../lib/api";

/* =========================================================
   TYPOGRAPHIE / PALETTE — identiques à la landing page
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
   CHAMP DE FORMULAIRE — un seul composant pour garder tous
   les champs visuellement identiques.
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
        style={{
          borderColor: "#DEDCD0",
          color: INK,
        }}
        onFocus={(e) => (e.target.style.borderColor = GOLD)}
        onBlur={(e) => (e.target.style.borderColor = "#DEDCD0")}
      />
    </label>
  );
}

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
          style={{ background: `${GOLD}22` }}
        />
        <div
          className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full blur-3xl"
          style={{ background: `${TEAL}22` }}
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
            Créez votre école en quelques minutes.
          </h2>

          <p className="mt-4 text-white/70">
            Élèves, enseignants, présences et paiements réunis dans un seul
            outil, dès aujourd&apos;hui.
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
          className="w-full max-w-lg space-y-5 rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
          style={{ borderColor: "#E4E1D6" }}
        >

          <div className="mb-2 lg:hidden">
            <span
              className="text-xl font-semibold"
              style={{ fontFamily: "var(--font-display), serif", color: INK }}
            >
              Dani<span style={{ color: GOLD }}>school</span>
            </span>
          </div>

          <div>
            <h1
              className="text-2xl font-medium"
              style={{ fontFamily: "var(--font-display), serif", color: INK }}
            >
              Créer une école
            </h1>
            <p className="mt-1 text-sm" style={{ color: INK_SOFT }}>
              Renseignez les informations de votre établissement pour démarrer.
            </p>
          </div>

          {error && (
            <p
              className="rounded-lg border px-3 py-2.5 text-sm"
              style={{ borderColor: "#F3C9BE", background: "#FBEEEA", color: "#9D3929" }}
            >
              {error}
            </p>
          )}

          {/* IDENTITÉ DE L'ÉCOLE */}

          <div className="space-y-4">
            <Champ
              label="Nom de l'école"
              required
              type="text"
              name="nomEcole"
              value={form.nomEcole}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Champ
                label="Ville"
                type="text"
                name="ville"
                value={form.ville}
                onChange={handleChange}
              />
              <Champ
                label="Pays"
                type="text"
                name="pays"
                value={form.pays}
                onChange={handleChange}
              />
            </div>

            <Champ
              label="Adresse"
              type="text"
              name="adresse"
              value={form.adresse}
              onChange={handleChange}
            />

            <Champ
              label="Téléphone"
              type="text"
              name="telephone"
              value={form.telephone}
              onChange={handleChange}
            />
          </div>

          {/* COMPTE */}

          <div className="space-y-4 border-t pt-5" style={{ borderColor: "#E4E1D6" }}>
            <Champ
              label="Email"
              required
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />

            <Champ
              label="Mot de passe"
              required
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {/* ANNEE SCOLAIRE */}

          <div className="border-t pt-5" style={{ borderColor: "#E4E1D6" }}>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: INK }}>
              Année scolaire
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Champ
                label="Date de début"
                required
                type="date"
                name="dateDebutAnneeScolaire"
                value={form.dateDebutAnneeScolaire}
                onChange={handleChange}
              />

              <Champ
                label="Date de fin"
                required
                type="date"
                name="dateFinAnneeScolaire"
                value={form.dateFinAnneeScolaire}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* BOUTON */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: INK }}
          >
            {loading ? "Création en cours..." : "Créer mon école"}
          </button>

          <p className="text-center text-sm" style={{ color: INK_SOFT }}>
            Déjà inscrit ?{" "}
            <Link href="/login" className="font-semibold" style={{ color: GOLD }}>
              Se connecter
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
}