"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  CalendarCheck,
  Clock,
  CreditCard,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";

/* ================= CONTEXT PRICING ================= */
const PricingContext = React.createContext();

const PricingProvider = ({ children }) => {
  const [yearly, setYearly] = useState(false);
  return (
    <PricingContext.Provider value={{ yearly, setYearly }}>
      {children}
    </PricingContext.Provider>
  );
};

/* ================= IMAGE SLIDER ================= */
const ImageSlider = () => {
  const images = ["/Dshboard.png", "/Abs.png", "/Note.png"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full flex justify-center">
      <div className="relative w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex gap-2 px-3 py-2">
            <div className="w-3 h-3 bg-red-400 rounded-full" />
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <div className="w-3 h-3 bg-green-400 rounded-full" />
          </div>

          <div className="relative h-[300px] md:h-[450px]">
            {images.map((img, i) => (
              <motion.img
                key={i}
                src={img}
                className="absolute inset-0 w-full h-full object-contain"
                animate={{ opacity: i === index ? 1 : 0 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= PRICING ================= */
const PricingToggle = () => {
  const { yearly, setYearly } = React.useContext(PricingContext);

  return (
    <div className="flex justify-center mt-6">
      <div
        onClick={() => setYearly(!yearly)}
        className="flex bg-white/10 p-1 rounded-full cursor-pointer border"
      >
        <span className={`px-4 py-1 ${!yearly ? "bg-yellow-400 text-black rounded-full" : ""}`}>
          Mensuel
        </span>
        <span className={`px-4 py-1 ${yearly ? "bg-yellow-400 text-black rounded-full" : ""}`}>
          Annuel
        </span>
      </div>
    </div>
  );
};

const PricingCard = ({ name, monthly, yearly, highlight }) => {
  const { yearly: isYearly } = React.useContext(PricingContext);

  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.04 }}
      className={`p-[1px] rounded-2xl ${
        highlight
          ? "bg-gradient-to-r from-yellow-400 to-orange-500"
          : "bg-white/10"
      }`}
    >
      <div className="bg-[#0f172a] text-white rounded-2xl p-6">
        <h3 className="text-xl font-bold">{name}</h3>
        <p className="text-4xl my-4">
          {monthly ? (isYearly ? yearly : monthly) : "Sur mesure"} FCFA
        </p>

        <button className="w-full py-3 rounded-xl bg-yellow-400 text-black">
          Choisir
        </button>
      </div>
    </motion.div>
  );
};

/* ================= MAIN ================= */
export default function LandingPage() {
  const [open, setOpen] = useState(false);

  return (
    <PricingProvider>
      <div className="bg-gray-50 text-gray-900">

        {/* NAVBAR */}
        <header className="flex justify-between items-center px-6 py-4 bg-white shadow sticky top-0 z-50">
          <h1 className="text-2xl font-bold">
            Kalan<span className="text-yellow-500">SO</span>
          </h1>

          <nav className="hidden md:flex gap-6">
            <a href="#features">Fonctionnalités</a>
            <a href="#pricing">Tarifs</a>
          </nav>

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </header>

        {/* HERO */}
        <section className="grid md:grid-cols-2 gap-10 px-6 py-16 max-w-7xl mx-auto">
          <div>
            <h1 className="text-5xl font-bold mb-6">
              Gérez votre école <br />
              <span className="text-yellow-500">facilement</span>
            </h1>
            <p className="text-gray-600 mb-6">
              Une solution SaaS complète pour écoles modernes.
            </p>
            <button className="bg-yellow-500 text-white px-6 py-3 rounded-xl">
              Essayer gratuitement
            </button>
          </div>

          <ImageSlider />
        </section>

        {/* FEATURES */}
        <section id="features" className="py-20 bg-white">
          <h2 className="text-3xl text-center font-bold mb-10">
            Fonctionnalités
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
            {[Users, UserCheck, CalendarCheck, Clock, CreditCard, LayoutDashboard].map((Icon, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-gray-50 rounded-xl shadow"
              >
                <Icon className="text-yellow-500 mb-4" />
                <h3 className="font-bold">Feature</h3>
                <p className="text-gray-500 text-sm">
                  Description simple
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20 bg-[#0f172a] text-white">
          <h2 className="text-3xl text-center font-bold">
            Tarifs
          </h2>

          <PricingToggle />

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-10 px-6">
            <PricingCard name="Basic" monthly={5000} yearly={45000} />
            <PricingCard name="Pro" monthly={10000} yearly={90000} highlight />
            <PricingCard name="Entreprise" />
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20 bg-gray-100 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Témoignages
          </h2>
          <p>“Super application pour notre école”</p>
        </section>

        {/* CTA */}
        <section className="py-20 bg-yellow-500 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à commencer ?
          </h2>
          <button className="bg-white text-yellow-500 px-6 py-3 rounded-xl">
            Créer un compte
          </button>
        </section>

        {/* FOOTER */}
        <footer className="text-center py-6 text-gray-500">
          © 2026 KalanSO
        </footer>
      </div>
    </PricingProvider>
  );
}