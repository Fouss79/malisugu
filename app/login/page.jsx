'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { X,Menu } from "lucide-react";

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

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const res = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    if (!res.ok) {
      throw new Error("Email ou mot de passe incorrect");
    }

    const data = await res.json();

    // 🔥 login (stockage + cookies)
    login(data);
    document.cookie = "test=ok; path=/";
console.log("COOKIES:", document.cookie);

    // 🔥 redirection
    const role = data.role;

    if (role === "SUPER_ADMIN") {
      router.push("dashboard/superadmin");
    } else if (role === "ADMIN") {
      router.push("/dashboard/admin");
    } else if (role === "PROF") {
      router.push("/dashboard/prof");
    } else if (role === "PROPRIETAIRE") {
      router.push("/dashboard/proprietaire");
    }

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
    
     <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex justify-between items-center px-4 md:px-6 py-3 max-w-7xl mx-auto">
    
        {/* LOGO */}
        <h1 className="text-xl md:text-2xl font-bold italic text-gray-700">
          Kalan<span className="text-yellow-600">SO</span>
        </h1>
    
        {/* MENU DESKTOP */}
        <nav className="hidden md:flex items-center gap-6 text-gray-600 font-medium">
          <a href="#features" className="hover:text-yellow-600 transition">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-yellow-600 transition">Tarifs</a>
          <a href="#stats" className="hover:text-yellow-600 transition">Statistiques</a>
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
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
    
      {/* MENU MOBILE */}
      {open && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-4 shadow-md">
          
          <a href="#features" className="block text-gray-600 hover:text-yellow-600">
            Fonctionnalités
          </a>
    
          <a href="#pricing" className="block text-gray-600 hover:text-yellow-600">
            Tarifs
          </a>
    
          <a href="#stats" className="block text-gray-600 hover:text-yellow-600">
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
     

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-md w-full max-w-md space-y-4">

        <h2 className="text-2xl font-bold text-center">Connexion</h2>

        {error && <p className="text-red-500">{error}</p>}

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
          className="w-full bg-yellow-600 text-white py-2 rounded"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

      </form>
    </div>
    </div>
    
  );
}