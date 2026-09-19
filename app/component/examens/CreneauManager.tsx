"use client";

import { useEffect, useState } from "react";
import { creneauxApi } from "@/lib/api/examens";
import { messageErreur } from "@/lib/api/client";
import type { CreneauExamen } from "@/types/examens";
import { ui } from "./ui";

interface Props {
  examenId: number;
}

export default function CreneauManager({ examenId }: Props) {
  const [creneaux, setCreneaux] = useState<CreneauExamen[]>([]);
  const [date, setDate] = useState("");
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function charger() {
    setCreneaux(await creneauxApi.listByExamen(examenId));
  }

  useEffect(() => {
    charger();
  }, [examenId]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await creneauxApi.create({
        examenId,
        date,
        heureDebut: heureDebut + ":00",
        heureFin: heureFin + ":00",
      });
      setDate("");
      setHeureDebut("");
      setHeureFin("");
      await charger();
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer(id: number) {
    if (!confirm("Supprimer ce créneau ?")) return;
    await creneauxApi.remove(id);
    await charger();
  }

  return (
    <div className={ui.card + " space-y-4"}>
      <h3 className="text-base font-semibold text-slate-900">Créneaux</h3>

      <table className={ui.table}>
        <thead>
          <tr>
            <th className={ui.th}>Date</th>
            <th className={ui.th}>Début</th>
            <th className={ui.th}>Fin</th>
            <th className={ui.th}></th>
          </tr>
        </thead>
        <tbody>
          {creneaux.map((c) => (
            <tr key={c.id}>
              <td className={ui.td}>{c.date}</td>
              <td className={ui.td}>{c.heureDebut.slice(0, 5)}</td>
              <td className={ui.td}>{c.heureFin.slice(0, 5)}</td>
              <td className={ui.td}>
                <button className={ui.btnDanger} onClick={() => supprimer(c.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          {creneaux.length === 0 && (
            <tr>
              <td className={ui.td} colSpan={4}>
                Aucun créneau pour l'instant.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form onSubmit={ajouter} className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
        <div>
          <label className={ui.label}>Date</label>
          <input type="date" className={ui.input} value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className={ui.label}>Heure début</label>
          <input
            type="time"
            className={ui.input}
            value={heureDebut}
            onChange={(e) => setHeureDebut(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={ui.label}>Heure fin</label>
          <input
            type="time"
            className={ui.input}
            value={heureFin}
            onChange={(e) => setHeureFin(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={ui.btnPrimary} disabled={enCours}>
          {enCours ? "Ajout..." : "Ajouter le créneau"}
        </button>
      </form>

      {erreur && <p className={ui.errorText}>{erreur}</p>}
    </div>
  );
}
