"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Fraunces, Inter } from "next/font/google";

import {
  Menu,
  X,
  Users,
  UserCheck,
  CalendarCheck,
  Clock,
  CreditCard,
  LayoutDashboard,
  Check,
} from "lucide-react";

/* =========================================================
   TYPOGRAPHIE
   Fraunces (serif à caractère) pour les titres, Inter pour
   le texte courant — ni le duo "serif chaud + terracotta"
   par défaut, ni une police display générique.
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

/* =========================================================
   PALETTE — reprise de l'application (dashboard) :
   encre navy, or, sarcelle. Évoque le ruban de diplôme et
   le tampon d'approbation plutôt qu'un bleu SaaS générique.
========================================================= */

const INK = "#101B33";
const INK_SOFT = "#5B6478";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const CREAM = "#F8F6EF";

/* =========================================================
   DONNÉES
========================================================= */

const STATS = [
  { label: "Pays", value: 20 },
  { label: "Fonctionnalités", value: 250 },
  { label: "Établissements", value: 300 },
];

const FEATURES = [
  {
    label: "Gestion des élèves",
    description:
      "Dossiers, inscriptions et historiques centralisés, du premier cycle au lycée.",
    icon: Users,
  },
  {
    label: "Gestion des enseignants",
    description:
      "Contrats, affectations et salaires suivis sans tableur ni paperasse.",
    icon: UserCheck,
  },
  {
    label: "Suivi des présences",
    description:
      "Émargement en quelques secondes, visible par la direction en temps réel.",
    icon: CalendarCheck,
  },
  {
    label: "Emploi du temps",
    description:
      "Cours, salles et enseignants organisés sans conflit d'horaire.",
    icon: Clock,
  },
  {
    label: "Paiements & abonnements",
    description:
      "Scolarité, bulletins de salaire et reçus générés automatiquement.",
    icon: CreditCard,
  },
  {
    label: "Tableau de bord",
    description:
      "Une vue d'ensemble claire pour la direction, classe par classe.",
    icon: LayoutDashboard,
  },
];

const PLANS = [
  {
    name: "Basic",
    price: "5 000",
    desc: "Pour les petites écoles qui démarrent",
    features: ["Jusqu'à 50 élèves", "Gestion enseignants", "Présences"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "10 000",
    desc: "Pour les écoles en croissance",
    features: [
      "Jusqu'à 200 élèves",
      "Paiements & bulletins",
      "Tableau de bord complet",
      "Support prioritaire",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Sur mesure",
    desc: "Pour les grands établissements et groupes scolaires",
    features: ["Élèves illimités", "Multi-établissements", "Support dédié"],
    highlight: false,
  },
];

const TEMOIGNAGES = [
  {
    name: "Directeur d'école",
    text: "Danischool nous a permis de digitaliser toute notre gestion scolaire en quelques jours. Un gain de temps énorme.",
  },
  {
    name: "Professeur",
    text: "Je fais l'appel et je saisis les notes directement depuis mon téléphone, entre deux cours.",
  },
  {
    name: "Administrateur",
    text: "Interface simple et rapide. Nos paiements de scolarité sont enfin bien organisés.",
  },
];

const IMAGES_APERCU = ["/Capture d’écran 2026-09-29 012344.png","/Capture d’écran 2026-09-29 005449.png", "/Capture d’écran 2026-09-29 010505.png","/Capture d’écran 2026-09-29 003616.png","/Capture d’écran 2026-09-29 012344.png"];

/* =========================================================
   COMPTEUR ANIMÉ — sorti du composant de page pour ne pas
   être redéfini (et redémarré) à chaque rendu.
========================================================= */

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

/* =========================================================
   CARROUSEL D'APERÇU — même correction : sorti du composant
   de page, ne se réinitialise plus à chaque rendu du parent.
========================================================= */

function ApercuCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IMAGES_APERCU.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-xl">
      <div
        className="overflow-hidden rounded-2xl border shadow-2xl"
        style={{ borderColor: "#DEDCD0", background: "#fff" }}
      >
        <div className="flex items-center gap-1.5 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: TEAL }} />
        </div>

        <div className="relative h-[280px] bg-[#F8F6EF] sm:h-[360px]">
          {IMAGES_APERCU.map((src, i) => (
            <motion.img
              key={src}
              src={src}
              alt="Aperçu Danischool"
              className="absolute inset-0 h-full w-full object-contain p-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: i === index ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            />
          ))}
        </div>
      </div>

      <div
        className="absolute -bottom-4 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full blur-2xl"
        style={{ background: `${INK}22` }}
      />
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function LandingPage() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`${fraunces.variable} ${inter.variable} min-h-screen`}
      style={{
        background: CREAM,
        color: INK,
        fontFamily: "var(--font-body), sans-serif",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ borderColor: "#E4E1D6", background: "rgba(248,246,239,0.9)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-6">

          <span
            className="text-xl font-semibold tracking-tight md:text-2xl"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Dani<span style={{ color: GOLD }}>school</span>
          </span>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" style={{ color: INK_SOFT }}>
            <a href="#features" className="transition hover:text-current" style={{ "--hover": INK }}>
              Fonctionnalités
            </a>
            <a href="#pricing" className="transition hover:opacity-100">
              Tarifs
            </a>
            <a href="#stats" className="transition hover:opacity-100">
              Statistiques
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login">
              <button
                className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-white"
                style={{ borderColor: "#DEDCD0", color: INK }}
              >
                Se connecter
              </button>
            </Link>
            <Link href="/inscrire">
              <button
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                style={{ background: INK }}
              >
                S&apos;inscrire
              </button>
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {open && (
          <div className="space-y-4 border-t px-4 py-4 md:hidden" style={{ borderColor: "#E4E1D6" }}>
            <a href="#features" className="block text-sm font-medium" style={{ color: INK_SOFT }}>
              Fonctionnalités
            </a>
            <a href="#pricing" className="block text-sm font-medium" style={{ color: INK_SOFT }}>
              Tarifs
            </a>
            <a href="#stats" className="block text-sm font-medium" style={{ color: INK_SOFT }}>
              Statistiques
            </a>

            <Link href="/login">
              <button className="w-full rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "#DEDCD0" }}>
                Se connecter
              </button>
            </Link>

            <Link href="/inscrire">
              <button
                className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: INK }}
              >
                S&apos;inscrire
              </button>
            </Link>
          </div>
        )}
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 md:grid-cols-2 md:px-6 md:py-20">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className="text-4xl font-medium leading-[1.08] tracking-tight md:text-5xl lg:text-[3.4rem]"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            La gestion de votre école,
            <br />
            <span style={{ color: GOLD }}>partout, à tout moment.</span>
          </h1>

          <p className="mt-6 max-w-md text-lg" style={{ color: INK_SOFT }}>
            Élèves, enseignants, présences et paiements réunis dans un seul
            outil, pensé pour les établissements francophones.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              style={{ background: INK }}
            >
              Essayer gratuitement
            </button>

            <button
              className="rounded-xl border px-6 py-3 text-sm font-semibold transition hover:bg-white"
              style={{ borderColor: "#DEDCD0" }}
            >
              Voir la démo
            </button>
          </div>

          <p className="mt-5 text-sm" style={{ color: INK_SOFT }}>
            Déjà plus de 50 écoles utilisent Danischool.
          </p>
        </motion.div>

        <motion.div
          className="flex justify-center md:justify-end"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <ApercuCarousel />
        </motion.div>
      </section>

      {/* =====================================================
          STATS
      ===================================================== */}

      <section id="stats" className="border-y" style={{ borderColor: "#E4E1D6" }}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 text-center sm:grid-cols-3 md:px-6 md:py-20">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="relative flex flex-col items-center">
              <span
                className="text-4xl font-medium sm:text-5xl md:text-6xl"
                style={{ fontFamily: "var(--font-display), serif", color: INK }}
              >
                <Counter end={stat.value} />
              </span>

              <p className="mt-2 text-sm" style={{ color: INK_SOFT }}>
                {stat.label}
              </p>

              {i !== STATS.length - 1 && (
                <div
                  className="absolute right-0 top-1/2 hidden h-14 w-px -translate-y-1/2 sm:block"
                  style={{ background: "#DEDCD0" }}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          INTRO / POSITIONNEMENT
      ===================================================== */}

      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6">
        <h2
          className="text-2xl font-medium leading-snug md:text-4xl"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Un logiciel de gestion scolaire pensé pour les écoles, les CFA et
          les universités.
        </h2>

        <p className="mt-5 text-lg" style={{ color: INK_SOFT }}>
          Bilingue et déployée dans plus de 20 pays, Danischool réunit tout ce
          dont une direction a besoin pour piloter son établissement au
          quotidien.
        </p>
      </section>

      {/* =====================================================
          FEATURES — liste éditoriale, pas une grille de cartes
          identiques.
      ===================================================== */}

      <section id="features" className="px-4 py-16 md:px-6 md:py-24" style={{ background: "#fff" }}>
        <div className="mx-auto max-w-5xl">
          <h2
            className="mb-12 text-2xl font-medium md:text-4xl"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Ce que Danischool gère pour vous
          </h2>

          <div className="divide-y" style={{ borderColor: "#E4E1D6" }}>
            {FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.label}
                  className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:gap-8"
                  style={{ borderColor: "#E4E1D6" }}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${TEAL}14`, color: TEAL }}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="sm:flex sm:flex-1 sm:items-baseline sm:justify-between sm:gap-6">
                    <h3 className="text-base font-semibold sm:w-64 sm:shrink-0">
                      {feature.label}
                    </h3>

                    <p className="mt-1 text-sm sm:mt-0" style={{ color: INK_SOFT }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          MOBILE — image + liste d'usages courts
      ===================================================== */}

      <section className="flex flex-col md:flex-row">
        <div
          className="order-2 flex w-full flex-col justify-center px-4 py-12 md:order-1 md:w-1/2 md:px-12 md:py-20"
          style={{ background: INK }}
        >
          <p className="max-w-md text-lg leading-relaxed text-white/80">
            Danischool fonctionne sur ordinateur, tablette et smartphone.
            Grâce à l&apos;application mobile, gérez votre établissement où
            que vous soyez.
          </p>

          <div className="mt-8 space-y-4">
            {[
              "Effectuer l'appel en temps réel",
              "Saisir les notes rapidement",
              "Partager cours et devoirs facilement",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${GOLD_2}20`, color: GOLD_2 }}
                >
                  <Check size={16} />
                </span>
                <p className="text-white/90">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="order-1 h-[220px] w-full bg-cover bg-center md:order-2 md:h-auto md:w-1/2"
          style={{ backgroundImage: "url('/eleve1.jpg')" }}
        />
      </section>

      {/* =====================================================
          PRICING — asymétrique : le plan Pro est mis en avant,
          pas trois cartes identiques.
      ===================================================== */}

      <section id="pricing" className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2
            className="mb-3 text-center text-2xl font-medium md:text-4xl"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Des abonnements simples
          </h2>

          <p className="mx-auto mb-12 max-w-md text-center" style={{ color: INK_SOFT }}>
            Choisissez selon la taille de votre établissement. Changez de
            formule à tout moment.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-2xl border p-7 ${
                  plan.highlight ? "md:-mt-4 md:mb-4 md:shadow-xl" : "shadow-sm"
                }`}
                style={{
                  borderColor: plan.highlight ? INK : "#E4E1D6",
                  background: plan.highlight ? INK : "#fff",
                  color: plan.highlight ? "#fff" : INK,
                }}
              >
                {plan.highlight && (
                  <span
                    className="mb-4 w-fit rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: GOLD_2, color: INK }}
                  >
                    Le plus choisi
                  </span>
                )}

                <h3 className="text-lg font-semibold">{plan.name}</h3>

                <p
                  className="mt-3 text-3xl font-medium"
                  style={{ fontFamily: "var(--font-display), serif" }}
                >
                  {plan.price}
                  {plan.price !== "Sur mesure" && (
                    <span
                      className="ml-1 text-sm font-normal"
                      style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : INK_SOFT }}
                    >
                      FCFA / mois
                    </span>
                  )}
                </p>

                <p
                  className="mt-2 text-sm"
                  style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : INK_SOFT }}
                >
                  {plan.desc}
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: plan.highlight ? "rgba(255,255,255,0.15)" : `${TEAL}14`,
                          color: plan.highlight ? GOLD_2 : TEAL,
                        }}
                      >
                        <Check size={12} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className="mt-8 w-full rounded-xl py-3 text-sm font-semibold transition hover:brightness-110"
                  style={
                    plan.highlight
                      ? { background: GOLD_2, color: INK }
                      : { background: CREAM, color: INK, border: "1px solid #E4E1D6" }
                  }
                >
                  Choisir {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="px-4 py-20 text-center md:px-6" style={{ background: INK }}>
        <h2
          className="text-2xl font-medium text-white md:text-4xl"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Commencez dès aujourd&apos;hui
        </h2>

        <p className="mt-3 text-white/70">
          Rejoignez les écoles qui utilisent déjà Danischool.
        </p>

        <button
          className="mt-7 rounded-xl px-8 py-3.5 font-semibold shadow-lg transition hover:brightness-110"
          style={{ background: GOLD_2, color: INK }}
        >
          Créer un compte gratuitement
        </button>
      </section>

      {/* =====================================================
          TÉMOIGNAGES
      ===================================================== */}

      <section className="px-4 py-16 md:px-6 md:py-24" style={{ background: "#fff" }}>
        <div className="mx-auto max-w-5xl">
          <h2
            className="mb-12 text-2xl font-medium md:text-4xl"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            Ce que disent nos utilisateurs
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {TEMOIGNAGES.map((item) => (
              <div key={item.name} className="border-l-2 pl-5" style={{ borderColor: GOLD }}>
                <p className="italic leading-relaxed" style={{ color: INK }}>
                  &ldquo;{item.text}&rdquo;
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                    style={{ background: `${TEAL}14`, color: TEAL }}
                  >
                    {item.name.charAt(0)}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs" style={{ color: INK_SOFT }}>
                      Utilisateur Danischool
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="px-4 py-14 md:px-6" style={{ background: INK, color: "rgba(255,255,255,0.7)" }}>
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">

          <div>
            <span
              className="text-xl font-semibold text-white"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              Dani<span style={{ color: GOLD_2 }}>school</span>
            </span>
            <p className="mt-3 text-sm">
              Une solution moderne pour digitaliser la gestion scolaire.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Produit</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-white">Tarifs</a></li>
              <li><a href="#" className="hover:text-white">Démo</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">FAQ</a></li>
              <li><a href="#" className="hover:text-white">Assistance</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Commencer</h3>
            <p className="mb-4 text-sm">Essayez gratuitement Danischool dès aujourd&apos;hui.</p>
            <button
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold"
              style={{ background: GOLD_2, color: INK }}
            >
              Créer un compte
            </button>
          </div>

        </div>

        <div
          className="mx-auto mt-10 max-w-7xl border-t pt-6 text-center text-xs"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          © {new Date().getFullYear()} Danischool — Tous droits réservés
        </div>
      </footer>
    </div>
  );
}