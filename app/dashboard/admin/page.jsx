"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../../lib/api";

export default function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    enseignants: 0,
    matieres: 0,
    classes: 0,
  });

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadChart()]);
      setLoading(false);
    };

    load();
  }, [user]);

  const total = stats.enseignants + stats.matieres + stats.classes;
  const pct = (n) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

  const angEnseignants = total === 0 ? 0 : (stats.enseignants / total) * 360;
  const angMatieres = total === 0 ? 0 : (stats.matieres / total) * 360;

  const maxBar = Math.max(stats.enseignants, stats.matieres, stats.classes, 1);
  const barHeight = (n) => Math.round((n / maxBar) * 200) + 10;

  const ecoleNom = user?.ecole?.nom || "Mon École";
  const anneeLabel = user?.anneeScolaire?.libelle || "";

  return (
    <div className="dashboard-root">
      <div className="topbar">
        <div
          style={{
            background: "linear-gradient(135deg, #101B33, #182746 60%, #22335A)",
            borderRadius: "18px",
            padding: "28px 32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {anneeLabel ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(228,182,85,0.6)",
                color: "#E4B655",
                fontSize: "12px",
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: "20px",
                marginBottom: "12px",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
              </svg>
              Année {anneeLabel}
            </div>
          ) : null}
          <h1
            style={{
              fontSize: "26px",
              margin: "0 0 6px",
              fontWeight: 600,
              letterSpacing: "-0.3px",
              color: "#FFFFFF",
            }}
          >
            Tableau de bord
          </h1>
          <p
            style={{
              margin: 0,
              color: "#D6DBEC",
              fontSize: "13.5px",
            }}
          >
            Aperçu général de l&apos;établissement {ecoleNom}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-block">
          <div className="spinner" />
          <p>Chargement du tableau de bord...</p>
        </div>
      ) : (
        <>
          {/* ================= STATS ================= */}
          <div className="kpi-grid">
            <div className="kpi-card c-teal">
              <div className="kpi-top">
                <div className="kpi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                    <circle cx="10" cy="7" r="4" />
                  </svg>
                </div>
              </div>
              <div className="kpi-label">Enseignants</div>
              <div className="kpi-value">{String(stats.enseignants).padStart(2, "0")}</div>
              <div className="kpi-note">Équipe pédagogique active</div>
            </div>

            <div className="kpi-card c-violet">
              <div className="kpi-top">
                <div className="kpi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
                    <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5z" />
                  </svg>
                </div>
              </div>
              <div className="kpi-label">Matières</div>
              <div className="kpi-value">{String(stats.matieres).padStart(2, "0")}</div>
              <div className="kpi-note">Disciplines enseignées</div>
            </div>

            <div className="kpi-card c-coral">
              <div className="kpi-top">
                <div className="kpi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
                    <path d="M7 11.8V16c0 1.4 2.2 2.8 5 2.8s5-1.4 5-2.8v-4.2" />
                  </svg>
                </div>
              </div>
              <div className="kpi-label">Classes</div>
              <div className="kpi-value">{String(stats.classes).padStart(2, "0")}</div>
              <div className="kpi-note">Classes ouvertes cette année</div>
            </div>
          </div>

          {/* ================= CHARTS ================= */}
          <div className="charts-grid">
            {/* BAR CHART (recréé en CSS, plus besoin de recharts) */}
            <div className="panel">
              <div className="panel-head">
                <h3>Répartition du personnel</h3>
                <div className="tag">{anneeLabel || "Année en cours"}</div>
              </div>

              <div className="bars">
                <div className="gridline" style={{ bottom: 0 }} />
                <div className="gridline" style={{ bottom: "33%" }} />
                <div className="gridline" style={{ bottom: "66%" }} />
                <div className="gridline" style={{ bottom: "100%" }} />

                <div className="bar-col">
                  <div className="bar-val">{stats.enseignants}</div>
                  <div
                    className="bar-shape bar-gold"
                    style={{ height: `${barHeight(stats.enseignants)}px` }}
                  />
                </div>
                <div className="bar-col">
                  <div className="bar-val">{stats.matieres}</div>
                  <div
                    className="bar-shape bar-teal"
                    style={{ height: `${barHeight(stats.matieres)}px` }}
                  />
                </div>
                <div className="bar-col">
                  <div className="bar-val">{stats.classes}</div>
                  <div
                    className="bar-shape bar-violet"
                    style={{ height: `${barHeight(stats.classes)}px` }}
                  />
                </div>
              </div>

              <div className="bar-labels">
                <span>Enseignants</span>
                <span>Matières</span>
                <span>Classes</span>
              </div>
            </div>

            {/* DONUT (recréé en CSS conic-gradient, remplace le PieChart recharts) */}
            <div className="panel">
              <div className="panel-head">
                <h3>Distribution</h3>
                <div className="tag">Total {total}</div>
              </div>

              <div className="donut-wrap">
                <div
                  className="donut"
                  style={{
                    background:
                      total === 0
                        ? "var(--line)"
                        : `conic-gradient(
                            var(--violet) 0deg ${angEnseignants}deg,
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
                    <span className="dot" style={{ background: "var(--violet)" }} />
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
                <p className="chart-source-note">
                  {chartData.length} entrée(s) reçues de /dashboard/chart — actuellement non utilisées par ce visuel (donut basé sur /dashboard/stats). Dis-moi si le chart doit remplacer les stats.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .dashboard-root {
          --ink: #101b33;
          --ink-2: #182746;
          --paper: #eceae2;
          --white: #ffffff;
          --gold: #c89b3c;
          --gold-2: #e4b655;
          --teal: #2c8c82;
          --teal-soft: #dcedea;
          --violet: #6e5dc6;
          --violet-soft: #e7e3f8;
          --coral: #d2593f;
          --coral-soft: #f7e2db;
          --text: #1b2333;
          --text-soft: #5b6478;
          --line: #dedcd0;
          --radius: 18px;

          font-family: "Inter", sans-serif;
          color: var(--text);
        }
        .dashboard-root * {
          box-sizing: border-box;
        }

        .topbar {
          margin-bottom: 24px;
        }
        .hero-band {
          background: linear-gradient(135deg, var(--ink), var(--ink-2) 60%, var(--ink-3));
          border-radius: var(--radius);
          padding: 28px 32px;
          position: relative;
          overflow: hidden;
        }
        .hero-band::after {
          content: "";
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200, 155, 60, 0.25), transparent 70%);
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(228, 182, 85, 0.5);
          color: var(--gold-2);
          font-size: 12px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 20px;
          margin-bottom: 12px;
          position: relative;
        }
        .hero-band h1 {
          font-size: 26px;
          margin: 0 0 6px;
          font-weight: 600;
          letter-spacing: -0.3px;
          color: var(--white);
          position: relative;
        }
        .hero-band p {
          margin: 0;
          color: #b7bfd6;
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
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 4px solid var(--line);
          border-top-color: var(--gold);
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ---------- KPI CARDS ---------- */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 22px;
        }
        .kpi-card {
          background: var(--white);
          border-radius: var(--radius);
          padding: 22px 22px 20px;
          border: 1px solid var(--line);
          position: relative;
          overflow: hidden;
        }
        .kpi-card::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 4px;
        }
        .kpi-card.c-teal::after {
          background: var(--teal);
        }
        .kpi-card.c-violet::after {
          background: var(--violet);
        }
        .kpi-card.c-coral::after {
          background: var(--coral);
        }
        .kpi-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .c-teal .kpi-icon {
          background: var(--teal-soft);
          color: var(--teal);
        }
        .c-violet .kpi-icon {
          background: var(--violet-soft);
          color: var(--violet);
        }
        .c-coral .kpi-icon {
          background: var(--coral-soft);
          color: var(--coral);
        }
        .kpi-label {
          font-size: 12.5px;
          color: var(--text-soft);
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        .kpi-value {
          font-family: "IBM Plex Mono", monospace;
          font-size: 38px;
          font-weight: 600;
          margin: 14px 0 4px;
          line-height: 1;
        }
        .kpi-note {
          font-size: 12px;
          color: var(--text-soft);
        }

        /* ---------- CHARTS ---------- */
        .charts-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 18px;
        }
        .panel {
          background: var(--white);
          border-radius: var(--radius);
          border: 1px solid var(--line);
          padding: 24px;
        }
        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        .panel-head h3 {
          font-size: 16px;
          margin: 0;
          font-weight: 600;
        }
        .panel-head .tag {
          font-size: 11.5px;
          color: var(--text-soft);
          background: var(--paper);
          padding: 4px 10px;
          border-radius: 20px;
        }

        .bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 210px;
          border-bottom: 1px solid var(--line);
          position: relative;
          padding: 0 8px;
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
          width: 80px;
          z-index: 1;
        }
        .bar-val {
          font-family: "IBM Plex Mono", monospace;
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
        }
        .bar-shape {
          width: 46px;
          border-radius: 10px 10px 4px 4px;
          transition: height 0.4s ease;
        }
        .bar-gold {
          background: linear-gradient(180deg, var(--gold-2), var(--gold));
        }
        .bar-teal {
          background: linear-gradient(180deg, #4fa69b, var(--teal));
        }
        .bar-violet {
          background: linear-gradient(180deg, #8b7cdb, var(--violet));
        }
        .bar-labels {
          display: flex;
          justify-content: space-around;
          margin-top: 10px;
          padding: 0 8px;
        }
        .bar-labels span {
          width: 80px;
          text-align: center;
          font-size: 12.5px;
          color: var(--text-soft);
          font-weight: 500;
        }

        .donut-wrap {
          display: flex;
          align-items: center;
          gap: 22px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .donut {
          width: 168px;
          height: 168px;
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
          width: 104px;
          height: 104px;
          border-radius: 50%;
          background: var(--white);
        }
        .donut-center {
          position: relative;
          text-align: center;
        }
        .donut-center .num {
          font-family: "IBM Plex Mono", monospace;
          font-size: 24px;
          font-weight: 600;
        }
        .donut-center .lbl {
          font-size: 10.5px;
          color: var(--text-soft);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .legend {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
        }
        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .legend-item .lname {
          color: var(--text);
          font-weight: 500;
          min-width: 88px;
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
          margin: 16px 0 0;
          font-size: 11.5px;
          color: var(--text-soft);
        }

        @media (max-width: 980px) {
          .kpi-grid,
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}