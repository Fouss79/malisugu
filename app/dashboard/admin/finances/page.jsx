"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, CheckCircle2 } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";

const INK = "#101B33";
const GOLD = "#C89B3C";
const GOLD_2 = "#E4B655";
const TEAL = "#2C8C82";
const TEAL_SOFT = "#DCEDEA";
const AMBER_SOFT = "#FDF3DC";
const AMBER = "#A9791F";

export default function PaiementPage() {
  const { user } = useAuth();

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [debut, setDebut] = useState(firstOfMonth.toISOString().split("T")[0]);
  const [fin, setFin] = useState(today.toISOString().split("T")[0]);

  const [anneeId, setAnneeId] = useState("");
  const [annees, setAnnees] = useState([]);

  const [mode, setMode] = useState("previsualiser"); // "previsualiser" | "historique"
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    const loadAnnees = async () => {
      if (!user?.ecole?.id) return;
      try {
        const res = await api.get(`/annees/ecole/${user.ecole.id}`);
        const anneesData = res.data || [];
        setAnnees(anneesData);
        const anneeActive = anneesData.find((a) => a.active);
        setAnneeId(anneeActive ? anneeActive.id : anneesData[0]?.id || "");
      } catch (err) {
        console.error(err);
      }
    };
    loadAnnees();
  }, [user]);

  const load = useCallback(async () => {
    if (!anneeId || !debut || !fin) return;

    try {
      setLoading(true);

      if (mode === "previsualiser") {
        const res = await api.get("/paiements/previsualiser", {
          params: { debut, fin, anneeId },
        });
        setPaiements(res.data || []);
      } else {
        const res = await api.get("/paiements", { params: { anneeId } });
        setPaiements(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debut, fin, anneeId, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const genererPaiements = async () => {
    try {
      setGenerating(true);
      await api.post("/paiements/generer", null, { params: { debut, fin, anneeId } });
      setMode("historique");
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const marquerPaye = async (id) => {
    try {
      setPayingId(id);
      await api.put(`/paiements/${id}/payer`);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setPayingId(null);
    }
  };

  const totalMontant = paiements.reduce((sum, p) => sum + (p.montant || 0), 0);

  return (
    <div className="space-y-5 p-4">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(150deg, ${GOLD_2}, ${GOLD})`, color: INK }}
        >
          <Wallet size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paiement des enseignants</h1>
          <p className="text-sm text-slate-500">Calculé sur la base des heures émargées.</p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={anneeId}
          onChange={(e) => setAnneeId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
        >
          {annees.map((a) => (
            <option key={a.id} value={a.id}>{a.nom}</option>
          ))}
        </select>

        <input
          type="date"
          value={debut}
          onChange={(e) => setDebut(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
        />
        <span className="text-sm text-slate-400">à</span>
        <input
          type="date"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C89B3C]"
        />

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setMode("previsualiser")}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
              mode === "previsualiser" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Prévisualisation
          </button>
          <button
            onClick={() => setMode("historique")}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
              mode === "historique" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Historique
          </button>
        </div>
      </div>

      {mode === "previsualiser" && (
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-500">
            Total à payer sur la période : <span className="font-semibold text-slate-800">{totalMontant.toLocaleString()} FCFA</span>
          </p>
          <button
            onClick={genererPaiements}
            disabled={generating || paiements.length === 0}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${INK}, #182746)` }}
          >
            {generating ? "Génération..." : "Générer les paiements"}
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"
                style={{ background: "#F8F7F2" }}
              >
                <th className="px-4 py-3 font-medium">Enseignant</th>
                <th className="px-4 py-3 font-medium">Heures émargées</th>
                <th className="px-4 py-3 font-medium">Taux horaire</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                {mode === "historique" && <th className="px-4 py-3 font-medium text-right">Action</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {!loading && paiements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Aucune donnée sur cette période.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              )}

              {paiements.map((p) => {
                const paye = p.statut === "PAYE";
                const style = paye
                  ? { bg: TEAL_SOFT, text: TEAL, label: "Payé" }
                  : { bg: AMBER_SOFT, text: AMBER, label: "En attente" };

                return (
                  <tr key={p.id || p.enseignantId} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {p.enseignantPrenom} {p.enseignantNom}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.totalHeures}h</td>
                    <td className="px-4 py-3 text-slate-600">{p.tauxHoraire.toLocaleString()} FCFA/h</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.montant.toLocaleString()} FCFA</td>
                    <td className="px-4 py-3">
                      {p.statut === "NON_GENERE" ? (
                        <span className="text-xs text-slate-400">Non généré</span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{ background: style.bg, color: style.text }}
                        >
                          {style.label}
                        </span>
                      )}
                    </td>
                    {mode === "historique" && (
                      <td className="px-4 py-3 text-right">
                        {!paye && (
                          <button
                            disabled={payingId === p.id}
                            onClick={() => marquerPaye(p.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110 disabled:opacity-50"
                          >
                            <CheckCircle2 size={12} />
                            {payingId === p.id ? "..." : "Marquer payé"}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}