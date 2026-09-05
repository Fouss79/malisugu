"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../../lib/api";

function formatMontant(montant) {
  return (
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(montant || 0) + " FCFA"
  );
}

function premierJourDuMois() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

function aujourdHui() {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    enseignants: 0,
    matieres: 0,
    classes: 0,
  });

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rapport, setRapport] = useState(null);
  const [loadingRapport, setLoadingRapport] = useState(true);

  const [dateDebut, setDateDebut] = useState(premierJourDuMois());
  const [dateFin, setDateFin] = useState(aujourdHui());

  const loadStats = async () => {
    if (!user?.ecole?.id) return;

    try {
      const res = await api.get(`/dashboard/stats/${user.ecole.id}`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadChart = async () => {
    if (!user?.ecole?.id) return;

    try {
      const res = await api.get(`/dashboard/chart/${user.ecole.id}`);
      setChartData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRapport = async () => {
    if (!user?.ecole?.id) return;

    setLoadingRapport(true);

    try {
      const res = await api.get(`/operations-comptables/rapport/${user.ecole.id}`, {
        params: { debut: dateDebut, fin: dateFin },
      });

      setRapport(res.data);
    } catch (err) {
      console.error("Erreur chargement rapport comptable :", err);
    } finally {
      setLoadingRapport(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadChart()]);
      setLoading(false);
    };

    load();
  }, [user]);

  useEffect(() => {
    loadRapport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateDebut, dateFin]);

  const appliquerPeriode = (debut, fin) => {
    setDateDebut(debut);
    setDateFin(fin);
  };

  const total = stats.enseignants + stats.matieres + stats.classes;
  const pct = (n) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

  const angEnseignants = total === 0 ? 0 : (stats.enseignants / total) * 360;
  const angMatieres = total === 0 ? 0 : (stats.matieres / total) * 360;

  const maxBar = Math.max(stats.enseignants, stats.matieres, stats.classes, 1);
  const barHeight = (n) => Math.round((n / maxBar) * 190) + 10;

  const ecoleNom = user?.ecole?.nom || "Mon École";
  const anneeLabel = user?.anneeScolaire?.libelle || "";

  const recettes = rapport?.totalRecettes || 0;
  const depenses = rapport?.totalDepenses || 0;
  const solde = rapport?.solde || 0;
  const maxFinance = Math.max(recettes, depenses, 1);
  const financeBarHeight = (n) => Math.round((n / maxFinance) * 150) + 8;

  return (
    <div className="dashboard-root">
      {/* ================= HERO ================= */}
      <div className="hero">
        {anneeLabel ? (
          <div className="hero-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10 12 5 2 10l10 5 10-5Z" />
              <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
            </svg>
            Année {anneeLabel}
          </div>
        ) : null}
        <h1>Tableau de bord</h1>
        <p>Aperçu général de l&apos;établissement {ecoleNom}</p>
      </div>

      {loading ? (
        <div className="loading-block">
          <div className="spinner" />
          <p>Chargement du tableau de bord...</p>
        </div>
      ) : (
        <>
          {/* ================= REGISTRE COMPTABLE ================= */}
          <section className="ledger ledger-finance">
            <div className="ledger-head">
              <div>
                <h2>Comptabilité</h2>
                <p>Recettes, dépenses et trésorerie sur la période sélectionnée</p>
              </div>

              <div className="periode-controls">
                <div className="periode-presets">
                  <button
                    className="preset-btn"
                    onClick={() => appliquerPeriode(premierJourDuMois(), aujourdHui())}
                  >
                    Ce mois
                  </button>
                  <button
                    className="preset-btn"
                    onClick={() => {
                      const d = new Date();
                      const debut = new Date(d.getFullYear(), 0, 1).toISOString().split("T")[0];
                      appliquerPeriode(debut, aujourdHui());
                    }}
                  >
                    Cette année
                  </button>
                </div>

                <div className="date-inputs">
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="date-input"
                  />
                  <span className="date-sep">→</span>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="date-input"
                  />
                </div>
              </div>
            </div>

            {loadingRapport ? (
              <div className="ledger-loading">
                <div className="spinner spinner-sm" />
              </div>
            ) : (
              <div className="ledger-row">
                <div className="ledger-item">
                  <span className="ledger-label">Recettes</span>
                  <span className="ledger-value ledger-positive">{formatMontant(recettes)}</span>
                </div>

                <div className="ledger-item">
                  <span className="ledger-label">Dépenses</span>
                  <span className="ledger-value ledger-negative">{formatMontant(depenses)}</span>
                </div>

                <div className="ledger-item">
                  <span className="ledger-label">Solde</span>
                  <span className={`ledger-value ${solde >= 0 ? "ledger-neutral" : "ledger-negative"}`}>
                    {formatMontant(solde)}
                  </span>
                </div>

                <div className="ledger-item">
                  <span className="ledger-label">Opérations</span>
                  <span className="ledger-value ledger-neutral">{rapport?.nombreOperations || 0}</span>
                </div>
              </div>
            )}
          </section>

          {/* ================= REGISTRE EFFECTIFS ================= */}
          <section className="ledger ledger-effectifs">
            <div className="ledger-row ledger-row-icons">
              <div className="ledger-item">
                <div className="ledger-icon icon-gold">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                    <circle cx="10" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <span className="ledger-label">Enseignants</span>
                  <span className="ledger-value ledger-neutral">{stats.enseignants}</span>
                </div>
              </div>

              <div className="ledger-item">
                <div className="ledger-icon icon-teal">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
                    <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5z" />
                  </svg>
                </div>
                <div>
                  <span className="ledger-label">Matières</span>
                  <span className="ledger-value ledger-neutral">{stats.matieres}</span>
                </div>
              </div>

              <div className="ledger-item">
                <div className="ledger-icon icon-coral">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
                    <path d="M7 11.8V16c0 1.4 2.2 2.8 5 2.8s5-1.4 5-2.8v-4.2" />
                  </svg>
                </div>
                <div>
                  <span className="ledger-label">Classes</span>
                  <span className="ledger-value ledger-neutral">{stats.classes}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ================= GRAPHIQUES ================= */}
          <div className="charts-grid">
            <div className="panel">
              <div className="panel-head">
                <h3>Répartition du personnel</h3>
                <span className="panel-tag">{anneeLabel || "Année en cours"}</span>
              </div>

              <div className="bars">
                <div className="gridline" style={{ bottom: 0 }} />
                <div className="gridline" style={{ bottom: "33%" }} />
                <div className="gridline" style={{ bottom: "66%" }} />
                <div className="gridline" style={{ bottom: "100%" }} />

                <div className="bar-col">
                  <div className="bar-val">{stats.enseignants}</div>
                  <div className="bar-shape bar-gold" style={{ height: `${barHeight(stats.enseignants)}px` }} />
                </div>
                <div className="bar-col">
                  <div className="bar-val">{stats.matieres}</div>
                  <div className="bar-shape bar-teal" style={{ height: `${barHeight(stats.matieres)}px` }} />
                </div>
                <div className="bar-col">
                  <div className="bar-val">{stats.classes}</div>
                  <div className="bar-shape bar-coral" style={{ height: `${barHeight(stats.classes)}px` }} />
                </div>
              </div>

              <div className="bar-labels">
                <span>Enseignants</span>
                <span>Matières</span>
                <span>Classes</span>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Distribution</h3>
                <span className="panel-tag">Total {total}</span>
              </div>

              <div className="donut-wrap">
                <div
                  className="donut"
                  style={{
                    background:
                      total === 0
                        ? "var(--line)"
                        : `conic-gradient(
                            var(--gold) 0deg ${angEnseignants}deg,
                            var(--teal) ${angEnseignants}deg ${angEnseignants + angMatieres}deg,
                            var(--coral) ${angEnseignants + angMatieres}deg 360deg
                          )`,
                  }}
                >
                  <div className="donut-center">
                    <div className="num">{total}</div>
                    <div className="lbl">Total</div>
                  </div>
                </div>

                <div className="legend">
                  <div className="legend-item">
                    <span className="dot" style={{ background: "var(--gold)" }} />
                    <span className="lname">Enseignants</span>
                    <span className="lcount">{stats.enseignants}</span>
                    <span className="lpct">{pct(stats.enseignants)}%</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot" style={{ background: "var(--teal)" }} />
                    <span className="lname">Matières</span>
                    <span className="lcount">{stats.matieres}</span>
                    <span className="lpct">{pct(stats.matieres)}%</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot" style={{ background: "var(--coral)" }} />
                    <span className="lname">Classes</span>
                    <span className="lcount">{stats.classes}</span>
                    <span className="lpct">{pct(stats.classes)}%</span>
                  </div>
                </div>
              </div>

              {chartData.length > 0 && (
                <p className="chart-source-note">{chartData.length} entrée(s) reçues de /dashboard/chart.</p>
              )}
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Recettes vs Dépenses</h3>
                <span className="panel-tag">Période sélectionnée</span>
              </div>

              {loadingRapport ? (
                <div className="ledger-loading">
                  <div className="spinner spinner-sm" />
                </div>
              ) : (
                <>
                  <div className="finance-bars">
                    <div className="finance-bar-col">
                      <div className="finance-bar-val">{formatMontant(recettes)}</div>
                      <div
                        className="finance-bar-shape finance-bar-recette"
                        style={{ height: `${financeBarHeight(recettes)}px` }}
                      />
                    </div>

                    <div className="finance-bar-col">
                      <div className="finance-bar-val">{formatMontant(depenses)}</div>
                      <div
                        className="finance-bar-shape finance-bar-depense"
                        style={{ height: `${financeBarHeight(depenses)}px` }}
                      />
                    </div>
                  </div>

                  <div className="bar-labels">
                    <span>Recettes</span>
                    <span>Dépenses</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .dashboard-root {
          --ink: #101b33;
          --ink-2: #182746;
          --paper: #f7f5f0;
          --white: #ffffff;
          --gold: #c89b3c;
          --gold-2: #e4b655;
          --gold-soft: #f3e9d2;
          --teal: #2c8c82;
          --teal-soft: #dcedea;
          --coral: #d2593f;
          --coral-soft: #f7e2db;
          --text: #1b2333;
          --text-soft: #5b6478;
          --line: #e4e1d6;
          --radius: 18px;

          font-family: "Inter", sans-serif;
          color: var(--text);
          background: var(--paper);
          padding: 28px;
          border-radius: 24px;
        }
        .dashboard-root * {
          box-sizing: border-box;
        }

        /* ---------- HERO ---------- */
        .hero {
          background: linear-gradient(135deg, var(--ink), var(--ink-2) 65%, #22335a);
          border-radius: var(--radius);
          padding: 30px 34px;
          position: relative;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .hero::after {
          content: "";
          position: absolute;
          top: -70px;
          right: -70px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200, 155, 60, 0.28), transparent 70%);
        }
        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(228, 182, 85, 0.55);
          color: var(--gold-2);
          font-size: 12px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 20px;
          margin-bottom: 14px;
          position: relative;
        }
        .hero h1 {
          font-size: 27px;
          margin: 0 0 6px;
          font-weight: 600;
          letter-spacing: -0.3px;
          color: #fff;
          position: relative;
        }
        .hero p {
          margin: 0;
          color: #cfd5e8;
          font-size: 13.5px;
          position: relative;
        }

        .loading-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 60px 0;
          color: var(--text-soft);
        }
        .spinner {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 4px solid var(--line);
          border-top-color: var(--gold);
          animation: spin 0.8s linear infinite;
        }
        .spinner-sm {
          width: 22px;
          height: 22px;
          border-width: 3px;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ---------- REGISTRE (LEDGER) ---------- */
        .ledger {
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 22px 26px;
          margin-bottom: 18px;
        }
        .ledger-head {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }
        .ledger-head h2 {
          font-size: 17px;
          margin: 0 0 4px;
          font-weight: 600;
          color: var(--ink);
        }
        .ledger-head p {
          margin: 0;
          font-size: 12.5px;
          color: var(--text-soft);
        }
        .periode-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .periode-presets {
          display: flex;
          gap: 6px;
        }
        .preset-btn {
          font-size: 12px;
          font-weight: 600;
          padding: 6px 13px;
          border-radius: 20px;
          border: 1px solid var(--line);
          background: var(--paper);
          color: var(--text);
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .preset-btn:hover {
          background: var(--gold-soft);
          border-color: var(--gold);
        }
        .date-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .date-input {
          font-size: 12.5px;
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid var(--line);
          color: var(--text);
          background: var(--white);
        }
        .date-sep {
          color: var(--text-soft);
          font-size: 12px;
        }

        .ledger-loading {
          display: flex;
          justify-content: center;
          padding: 20px 0;
        }

        .ledger-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .ledger-item {
          padding: 4px 22px;
          border-left: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ledger-item:first-child {
          border-left: none;
          padding-left: 0;
        }
        .ledger-label {
          font-size: 12px;
          color: var(--text-soft);
          font-weight: 500;
        }
        .ledger-value {
          font-family: "IBM Plex Mono", monospace;
          font-size: 21px;
          font-weight: 600;
          line-height: 1.1;
        }
        .ledger-positive {
          color: var(--teal);
        }
        .ledger-negative {
          color: var(--coral);
        }
        .ledger-neutral {
          color: var(--ink);
        }

        .ledger-row-icons {
          grid-template-columns: repeat(3, 1fr);
        }
        .ledger-row-icons .ledger-item {
          flex-direction: row;
          align-items: center;
          gap: 14px;
        }
        .ledger-row-icons .ledger-item > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ledger-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon-gold {
          background: var(--gold-soft);
          color: var(--gold);
        }
        .icon-teal {
          background: var(--teal-soft);
          color: var(--teal);
        }
        .icon-coral {
          background: var(--coral-soft);
          color: var(--coral);
        }

        /* ---------- CHARTS ---------- */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        .panel {
          background: var(--white);
          border-radius: var(--radius);
          border: 1px solid var(--line);
          padding: 22px;
        }
        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .panel-head h3 {
          font-size: 14.5px;
          margin: 0;
          font-weight: 600;
          color: var(--ink);
        }
        .panel-tag {
          font-size: 11px;
          color: var(--text-soft);
          background: var(--paper);
          padding: 4px 10px;
          border-radius: 20px;
        }

        .bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 190px;
          border-bottom: 1px solid var(--line);
          position: relative;
          padding: 0 4px;
        }
        .gridline {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--line);
          opacity: 0.6;
        }
        .bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 60px;
          z-index: 1;
        }
        .bar-val {
          font-family: "IBM Plex Mono", monospace;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--ink);
        }
        .bar-shape {
          width: 38px;
          border-radius: 8px 8px 3px 3px;
          transition: height 0.4s ease;
        }
        .bar-gold {
          background: linear-gradient(180deg, var(--gold-2), var(--gold));
        }
        .bar-teal {
          background: linear-gradient(180deg, #4fa69b, var(--teal));
        }
        .bar-coral {
          background: linear-gradient(180deg, #e0836c, var(--coral));
        }
        .bar-labels {
          display: flex;
          justify-content: space-around;
          margin-top: 10px;
          padding: 0 4px;
        }
        .bar-labels span {
          width: 60px;
          text-align: center;
          font-size: 11.5px;
          color: var(--text-soft);
          font-weight: 500;
        }

        .donut-wrap {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .donut {
          width: 148px;
          height: 148px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
          transition: background 0.4s ease;
        }
        .donut::before {
          content: "";
          position: absolute;
          width: 92px;
          height: 92px;
          border-radius: 50%;
          background: var(--white);
        }
        .donut-center {
          position: relative;
          text-align: center;
        }
        .donut-center .num {
          font-family: "IBM Plex Mono", monospace;
          font-size: 21px;
          font-weight: 600;
        }
        .donut-center .lbl {
          font-size: 10px;
          color: var(--text-soft);
          letter-spacing: 0.4px;
        }
        .legend {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .legend-item .lname {
          color: var(--text);
          font-weight: 500;
          min-width: 82px;
        }
        .legend-item .lcount {
          font-family: "IBM Plex Mono", monospace;
          font-weight: 600;
        }
        .legend-item .lpct {
          color: var(--text-soft);
          margin-left: auto;
        }

        .chart-source-note {
          margin: 14px 0 0;
          font-size: 11px;
          color: var(--text-soft);
        }

        .finance-bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 190px;
          border-bottom: 1px solid var(--line);
          padding: 0 12px;
        }
        .finance-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 60px;
        }
        .finance-bar-val {
          font-family: "IBM Plex Mono", monospace;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--ink);
        }
        .finance-bar-shape {
          width: 38px;
          border-radius: 8px 8px 3px 3px;
          transition: height 0.4s ease;
        }
        .finance-bar-recette {
          background: linear-gradient(180deg, #4fa69b, var(--teal));
        }
        .finance-bar-depense {
          background: linear-gradient(180deg, #e0836c, var(--coral));
        }

        @media (max-width: 1200px) {
          .charts-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 860px) {
          .dashboard-root {
            padding: 18px;
          }
          .ledger-row,
          .ledger-row-icons,
          .charts-grid {
            grid-template-columns: 1fr;
          }
          .ledger-item {
            border-left: none;
            padding-left: 0;
            border-top: 1px solid var(--line);
            padding-top: 12px;
          }
          .ledger-item:first-child {
            border-top: none;
            padding-top: 0;
          }
        }
      `}</style>
    </div>
  );
}