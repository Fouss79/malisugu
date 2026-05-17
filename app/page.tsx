"use client";
import { useState, useEffect } from "react";

import Link from "next/link";
import { motion } from "framer-motion";


import {
  Menu,
   X,
  Users,
  UserCheck,
  CalendarCheck,
  Clock,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";

export default function LandingPage() {
const stats = [
  { label: "Pays", value: 20 },
  { label: "Fonctionnalités", value: 250 },
  { label: "Établissements", value: 300 },
];

function Counter({ end }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = end / (duration / 30);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 30);

    return () => clearInterval(timer);
  }, [end]);

  return <span>{count}+</span>;
}

const [open, setOpen] = useState(false);

const plans = [
  {
    name: "Basic",
    price: "5 000 FCFA",
    desc: "Pour petites écoles",
    features: ["50 élèves", "Gestion enseignants", "Présences"],
    highlight: false,
    color: "yellow-600"
  },
  {
    name: "Pro",
    price: "10 000 FCFA",
    desc: "Pour écoles en croissance",
    features: ["200 élèves", "Paiements", "Tableau de bord", "Support"],
    highlight: true,
    color:"white",
  },
  {
    name: "Enterprise",
    price: "Sur mesure",
    desc: "Pour grandes écoles",
    features: ["Illimité", "Multi-utilisateurs", "Support premium"],
    highlight: false,
    color:"yellow-600"
  },
];

  const features = [
    { label: "Gestion des élèves", icon: Users, color: "from-blue-500 to-blue-700" },
    { label: "Gestion des enseignants", icon: UserCheck, color: "from-green-500 to-green-700" },
    { label: "Suivi des présences", icon: CalendarCheck, color: "from-purple-500 to-purple-700" },
    { label: "Emploi du temps", icon: Clock, color: "from-orange-500 to-orange-700" },
    { label: "Paiements & abonnements", icon: CreditCard, color: "from-pink-500 to-pink-700" },
    { label: "Tableau de bord", icon: LayoutDashboard, color: "from-indigo-500 to-indigo-700" },
  ];
const ImageSlider = () => {
  const images = ["/Dshboard.png", "/Abs.png", "/Note.png"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full flex justify-center">
      <div className="relative w-full max-w-4xl">

        {/* 💻 MacBook frame */}
        <div className="bg-white rounded-2xl shadow-2xl ">

          {/* Top bar (Mac style) */}
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>

          {/* Screen */}
          <div className="relative bg-white rounded-xl overflow-hidden h-[350px] md:h-[450px]">
            {images.map((img, i) => (
              <motion.img
                key={i}
                src={img}
                alt="Dashboard"
                className="absolute inset-0 w-full h-full object-contain p-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: i === index ? 1 : 0 }}
                transition={{ duration: 0.8 }}
              />
            ))}

          </div>
        </div>

        {/* Shadow glow */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-black/20 blur-xl rounded-full" />

      </div>
    </div>
  );
};
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* HEADER */}
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm bg-gradient-to-r from-yellow-50 to-white">
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

      <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg">
        S'inscrire
      </button>

    </div>
  )}
</header>
      {/* HERO */}
     <section className="grid md:grid-cols-2 items-center gap-8 md:gap-12 px-4 md:px-6 py-10 md:py-12 max-w-7xl mx-auto relative  bg-gradient-to-br from-gray-50 to-white overflow-hidden">
       {/* Background décoratif */}
  <div className="absolute -top-20 -left-20 w-72 h-72 bg-yellow-200 rounded-full blur-3xl opacity-30"></div>
  <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-30"></div>

        {/* LEFT */}
        <div>
          {/* TITLE */}
      <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900">
        Gérez votre école <br />
        <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          partout, à tout moment
        </span>
      </h2>


          <p className="text-gray-600 mb-6 text-lg">
            Une solution moderne pour gérer élèves, enseignants,
            présences et paiements en toute simplicité.
          </p>

          <div className="flex gap-4">
            <button className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg">
              Essayer gratuitement
            </button>

            <button className="border px-6 py-3 rounded-xl hover:bg-gray-100 transition">
              Voir démo
            </button>
          </div>

          {/* Badge */}
          <p className="text-sm text-gray-400 mt-4">
            +50 écoles utilisent déjà KalanSO
          </p>
        </div>

        {/* RIGHT */}
          <div
            className=" h-[250px] md:h-[550px] bg-cover bg-center "
            style={{ backgroundImage: "url('/gest.png')" }}
          ></div>
      </section>

 

     {/* STATS */}
<section className="py-16 md:py-24 px-4 md:px-6 ">
  <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 text-center gap-8">

    {stats.map((stat, i) => (
      <div key={i} className="relative flex flex-col items-center">

        <motion.h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-yellow-600">
          <Counter end={stat.value} />
        </motion.h2>

        <p className="text-gray-500 mt-2">{stat.label}</p>

        {/* Séparateur vertical (desktop uniquement) */}
        {i !== stats.length - 1 && (
          <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-16 w-[1px] bg-gray-300"></div>
        )}
      </div>
    ))}

  </div>
</section>
<div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl text-center md:text-4xl font-bold mb-6 leading-tight italic "
          >
            Un logiciel de gestion scolaire adapté aux écoles, CFA et universités
       <br />
                   </motion.h1>

          <p className="text-gray-600 mb-6 text-center text-lg">
            Une solution moderne pour gérer élèves, enseignants,
            présences et paiements en toute simplicité.
          </p>
          <p className="text-600 text-center text-lg">
            Application bilingue utilisée dans plus de 20 pays, notre solution tout-en-un facilite la gestion scolaire à l’international
          </p>


        
        </div>



{/* FEATURES */}
<section className="py-24 px-6 bg-white">
  <h2 className="text-2xl md:text-5xl font-bold text-gray-600 text-center mb-8 md:mb-12 italic">
    Fonctionnalités principales
  </h2>

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 max-w-6xl mx-auto">  {features.map((feature, i) => {
      const Icon = feature.icon;

      return (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ y: -8, scale: 1.03 }}
          transition={{ duration: 0.4 }}
          className="group bg-gray-200 border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-2xl transition"
        >
          {/* ICON */}
          <div
            className={`w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-r ${feature.color} text-white mb-4 group-hover:scale-110 transition`}
          >
            <Icon size={26} />
          </div>

          {/* TITLE */}
          <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition">
            {feature.label}
          </h3>

          {/* DESCRIPTION */}
          <p className="text-gray-500 text-sm">
            Une gestion simple et efficace pour améliorer votre organisation scolaire.
          </p>
        </motion.div>
      );
    })}
  </div>
</section>
 <section className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-auto md:h-[400px]  md:p-10  flex flex-col ">
          <p className="text-gray-600 text-lg leading-relaxed max-w-xl">KalanSo est une solution de gestion scolaire multiplateforme compatible avec ordinateurs,
             tablettes et smartphones. Grâce à son application mobile disponible sur iOS et Android,
              accédez à votre établissement où que vous soyez.</p>
              <p className="text-gray-400 mt-4">Depuis votre téléphone, gérez facilement votre établissement en quelques clics :</p>
               <div className="space-y-4">
        {[
          "Effectuez l’appel en temps réel",
          "Saisissez les notes rapidement",
          "Partagez cours et devoirs facilement",
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-4 group">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600 group-hover:scale-110 transition">
              ✔
            </div>
            <p className="text-gray-700 font-medium">{item}</p>
          </div>
        ))}
      </div>

          </div>
          <div
            className="w-full md:w-1/2 h-[250px] md:h-[400px] bg-cover bg-center "
            style={{ backgroundImage: "url('/eleve1.jpg')" }}
          ></div>
        </section>
{/* PRICING */}

<section id="pricing" className="py-24 px-6 bg-gray-50">
  <h2 className="text-2xl md:text-5xl font-bold text-gray-600 text-center mb-12">
    Nos abonnements
  </h2>

  <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
    {plans.map((plan, i) => (
      <motion.div
        key={i}

        /* 👇 animation comme features */
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: i * 0.2 }}

        /* 👇 hover fluide */
        whileHover={{ y: -10, scale: 1.04 }}

        className={`group relative rounded-2xl p-6 border transition duration-300 ${
          plan.highlight
            ? "bg-gradient-to-br bg-gray-600 text-white shadow-2xl scale-105"
            : "bg-white hover:shadow-2xl"
        }`}
      >

        {/* BADGE PRO */}
        {plan.highlight && (
          <span className="absolute top-4 right-4 text-xs bg-white text-yellow-600 px-3 py-1 rounded-full font-semibold shadow">
            Populaire
          </span>
        )}

        {/* NAME */}
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>

        {/* PRICE */}
        <p
          className={`text-3xl font-extrabold mb-4 ${
            plan.highlight ? "text-white" : "text-yellow-600"
          }`}
        >
          {plan.price}
        </p>

        {/* DESC */}
        <p
          className={`mb-6 ${
            plan.highlight ? "text-white/80" : "text-gray-500"
          }`}
        >
          {plan.desc}
        </p>

        {/* FEATURES */}
        <ul className="space-y-3 mb-6">
          {plan.features.map((f, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-sm ${
                  plan.highlight
                    ? "bg-white text-yellow-600"
                    : "bg-yellow-100 text-yellow-600"
                }`}
              >
                ✔
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* BUTTON */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-full py-3 rounded-xl font-semibold transition ${
            plan.highlight
              ? "bg-white text-yellow-600 hover:bg-gray-100"
              : "bg-gray-600 text-white hover:bg-yellow-700"
          }`}
        >
          Choisir ce plan
        </motion.button>
      </motion.div>
    ))}
  </div>
</section>
<section>
  <ImageSlider/>
</section>
        <section className="py-20 px-6 bg-white text-yellow-500 text-center">
  <h2 className="text-3xl md:text-4xl font-bold mb-4">
    Commencez dès aujourd’hui 
  </h2>

  <p className="mb-6 text-lg">
    Rejoignez les écoles qui utilisent déjà KalanSO
  </p>

  <button className="bg-white text-yellow-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition shadow-lg">
    Créer un compte gratuitement
  </button>
</section>
{/* TESTIMONIALS */}
<section className="py-24 px-6 bg-gray-100">
  <h2 className="text-2xl md:text-5xl font-bold text-center mb-12 text-gray-700">
    Ce que disent nos utilisateurs
  </h2>

  <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

    {[
      {
        name: "Directeur école",
        text: "KalanSO nous a permis de digitaliser toute notre gestion scolaire en quelques jours. Un gain de temps énorme !",
      },
      {
        name: "Professeur",
        text: "Je peux faire l’appel et saisir les notes directement depuis mon téléphone. C’est juste parfait.",
      },
      {
        name: "Administrateur",
        text: "Interface simple, rapide et efficace. Nos paiements sont désormais bien organisés.",
      },
    ].map((item, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition"
      >
        {/* ⭐ STARS */}
        <div className="flex mb-4 text-yellow-400">
          {"★★★★★".split("").map((star, index) => (
            <span key={index}>{star}</span>
          ))}
        </div>

        {/* TEXT */}
        <p className="text-gray-600 italic mb-4">
          “{item.text}”
        </p>

        {/* USER */}
        <div className="flex items-center gap-3 mt-4">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-700">
            {item.name.charAt(0)}
          </div>

          <div>
            <p className="font-semibold text-gray-800">{item.name}</p>
            <p className="text-sm text-gray-400">Utilisateur KalanSO</p>
          </div>
        </div>
      </motion.div>
    ))}

  </div>
</section>
      {/* FOOTER */}
     <footer className="bg-gray-900 text-gray-300 px-6 py-12 mt-10">
  <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">

    {/* LOGO + DESC */}
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">
        Kalan<span className="text-yellow-500">SO</span>
      </h2>
      <p className="text-gray-400 text-sm">
        Une solution moderne pour digitaliser la gestion scolaire.
      </p>
    </div>

    {/* LIENS */}
    <div>
      <h3 className="text-white font-semibold mb-3">Produit</h3>
      <ul className="space-y-2 text-sm">
        <li><a href="#features" className="hover:text-white">Fonctionnalités</a></li>
        <li><a href="#pricing" className="hover:text-white">Tarifs</a></li>
        <li><a href="#" className="hover:text-white">Démo</a></li>
      </ul>
    </div>

    {/* SUPPORT */}
    <div>
      <h3 className="text-white font-semibold mb-3">Support</h3>
      <ul className="space-y-2 text-sm">
        <li><a href="#" className="hover:text-white">Contact</a></li>
        <li><a href="#" className="hover:text-white">FAQ</a></li>
        <li><a href="#" className="hover:text-white">Assistance</a></li>
      </ul>
    </div>

    {/* CTA */}
    <div>
      <h3 className="text-white font-semibold mb-3">Commencer</h3>
      <p className="text-sm text-gray-400 mb-4">
        Essayez gratuitement KalanSO dès aujourd’hui.
      </p>
      <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 w-full">
        Créer un compte
      </button>
    </div>

  </div>

  {/* BAS */}
  <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-500">
    © {new Date().getFullYear()} KalanSO — Tous droits réservés
  </div>
</footer>
    </div>
  );
}