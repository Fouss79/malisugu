"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);

  const plans = [
    {
      name: "Basic",
      monthly: 5000,
      yearly: 45000,
      desc: "Pour petites écoles",
      features: ["50 élèves", "Gestion enseignants", "Présences"],
      highlight: false,
    },
    {
      name: "Pro",
      monthly: 10000,
      yearly: 90000,
      desc: "Pour écoles en croissance",
      features: ["200 élèves", "Paiements", "Dashboard", "Support"],
      highlight: true,
    },
    {
      name: "Enterprise",
      monthly: null,
      yearly: null,
      desc: "Pour grandes écoles",
      features: ["Illimité", "Multi-utilisateurs", "Support premium"],
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 bg-[#0f172a] text-white relative overflow-hidden">

      {/* 🔥 Glow background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-500/20 blur-[120px] rounded-full"></div>

      <h2 className="text-3xl md:text-5xl font-bold text-center mb-6">
        Tarification simple et transparente
      </h2>

      {/* 🔄 Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-white/10 backdrop-blur-md p-1 rounded-full flex">
          <button
            onClick={() => setYearly(false)}
            className={`px-6 py-2 rounded-full text-sm ${
              !yearly ? "bg-yellow-500 text-black" : "text-white"
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-6 py-2 rounded-full text-sm ${
              yearly ? "bg-yellow-500 text-black" : "text-white"
            }`}
          >
            Annuel (-10%)
          </button>
        </div>
      </div>

      {/* 💳 Plans */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            whileHover={{ scale: 1.04 }}
            className={`relative p-[1px] rounded-2xl ${
              plan.highlight
                ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                : "bg-white/10"
            }`}
          >
            {/* Glass card */}
            <div className="rounded-2xl p-6 bg-white/5 backdrop-blur-xl h-full flex flex-col">

              {/* Badge */}
              {plan.highlight && (
                <span className="absolute top-4 right-4 text-xs bg-yellow-400 text-black px-3 py-1 rounded-full font-semibold">
                  Populaire
                </span>
              )}

              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>

              {/* PRICE */}
              <p className="text-4xl font-extrabold mb-4">
                {plan.monthly
                  ? `${yearly ? plan.yearly : plan.monthly} FCFA`
                  : "Sur mesure"}
              </p>

              <p className="text-gray-300 mb-6">{plan.desc}</p>

              {/* FEATURES */}
              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-200">
                    ✔ {f}
                  </li>
                ))}
              </ul>

              {/* BUTTON */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  plan.highlight
                    ? "bg-yellow-400 text-black hover:bg-yellow-300"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Choisir
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}