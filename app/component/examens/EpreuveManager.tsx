"use client";

import { useEffect, useState } from "react";
import { epreuvesApi, creneauxApi } from "@/lib/api/examens";
import { programmeApi, type CoefficientMatiereOption } from "@/lib/api/programme";
import { messageErreur } from "@/lib/api/client";
import type { EpreuveExamen, CreneauExamen } from "@/types/examens";
import { ui } from "./ui";

interface Props {
  examenId: number;
  ecoleId: number;
  anneeScolaireId: number;
}

function labelCoefficient(cm: CoefficientMatiereOption) {
  const programme = cm.serieNom ? `${cm.niveauNom} ${cm.serieNom}` : cm.niveauNom;
  return `${cm.matiereNom} — ${programme} — coeff ${cm.coefficient}`;
}

export default function EpreuveManager({ examenId, ecoleId, anneeScolaireId }: Props) {
  const [epreuves, setEpreuves] = useState<EpreuveExamen[]>([]);
  const [creneaux, setCreneaux] = useState<CreneauExamen[]>([]);
  const [options, setOptions] = useState<CoefficientMatiereOption[]>([]);
  const [coefficientMatiereId, setCoefficientMatiereId] = useState("");
  const [creneauId, setCreneauId] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function charger() {
    const [ep, cr, opts] = await Promise.all([
      epreuvesApi.listByExamen(examenId),
      creneauxApi.listByExamen(examenId),
      programmeApi.listCoefficientMatieres(ecoleId, anneeScolaireId),
    ]);
    setEpreuves(ep);
    setCreneaux(cr);
    setOptions(opts);
  }

  useEffect(() => {
    charger();
  }, [examenId]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await epreuvesApi.add({
        examenId,
        coefficientMatiereId: Number(coefficientMatiereId),
        creneauId: creneauId ? Number(creneauId) : null,
      });
      setCoefficientMatiereId("");
      setCreneauId("");
      await charger();
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer(id: number) {
    if (!confirm("Supprimer cette épreuve ?")) return;
    await epreuvesApi.remove(id);
    await charger();
  }

  return (
    <div className={ui.card + " space-y-4"}>
      <h3 className="text-base font-semibold text-slate-900">Épreuves</h3>

      <table className={ui.table}>
        <thead>
          <tr>
            <th className={ui.th}>Matière</th>
            <th className={ui.th}>Programme</th>
            <th className={ui.th}>Coeff.</th>
            <th className={ui.th}>Créneau</th>
            <th className={ui.th}></th>
          </tr>
        </thead>
        <tbody>
          {epreuves.map((ep) => (
            <tr key={ep.id}>
              <td className={ui.td}>{ep.matiereNom}</td>
              <td className={ui.td}>
                {ep.niveauNom}
                {ep.serieNom ? ` ${ep.serieNom}` : ""}
              </td>
              <td className={ui.td}>{ep.coefficient}</td>
              <td className={ui.td}>
                {ep.creneauDate ? (
                  `${ep.creneauDate} · ${ep.creneauHeureDebut?.slice(0, 5)}–${ep.creneauHeureFin?.slice(0, 5)}`
                ) : (
                  <span className={ui.badge + " " + ui.badgeWarn}>Non programmée</span>
                )}
              </td>
              <td className={ui.td}>
                <button className={ui.btnDanger} onClick={() => supprimer(ep.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          {epreuves.length === 0 && (
            <tr>
              <td className={ui.td} colSpan={5}>
                Aucune épreuve pour l'instant.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form onSubmit={ajouter} className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
        <div className="min-w-[280px]">
          <label className={ui.label}>Matière / programme</label>
          <select
            className={ui.select}
            value={coefficientMatiereId}
            onChange={(e) => setCoefficientMatiereId(e.target.value)}
            required
          >
            <option value="">Sélectionner...</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {labelCoefficient(o)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[220px]">
          <label className={ui.label}>Créneau (optionnel)</label>
          <select className={ui.select} value={creneauId} onChange={(e) => setCreneauId(e.target.value)}>
            <option value="">À programmer plus tard</option>
            {creneaux.map((c) => (
              <option key={c.id} value={c.id}>
                {c.date} · {c.heureDebut.slice(0, 5)}–{c.heureFin.slice(0, 5)}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className={ui.btnPrimary} disabled={enCours}>
          {enCours ? "Ajout..." : "Ajouter l'épreuve"}
        </button>
      </form>

      {erreur && <p className={ui.errorText}>{erreur}</p>}
    </div>
  );
}
