"use client";

import { useEffect, useState } from "react";
import { sallesApi } from "@/lib/api/examens";
import { messageErreur } from "@/lib/api/client";
import type { Salle } from "@/types/examens";
import { ui } from "./ui";

interface Props {
  ecoleId: number;
}

export default function SalleManager({ ecoleId }: Props) {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [nom, setNom] = useState("");
  const [capacite, setCapacite] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function charger() {
    setSalles(await sallesApi.listByEcole(ecoleId));
  }

  useEffect(() => {
    charger();
  }, [ecoleId]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await sallesApi.create({ nom, capacite: Number(capacite), ecoleId, active: true });
      setNom("");
      setCapacite("");
      await charger();
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  async function basculerActive(salle: Salle) {
    await sallesApi.setActive(salle.id, !salle.active);
    await charger();
  }

  return (
    <div className={ui.card + " space-y-4"}>
      <h3 className="text-base font-semibold text-slate-900">Salles</h3>

      <table className={ui.table}>
        <thead>
          <tr>
            <th className={ui.th}>Nom</th>
            <th className={ui.th}>Capacité</th>
            <th className={ui.th}>Statut</th>
            <th className={ui.th}></th>
          </tr>
        </thead>
        <tbody>
          {salles.map((s) => (
            <tr key={s.id}>
              <td className={ui.td}>{s.nom}</td>
              <td className={ui.td}>{s.capacite}</td>
              <td className={ui.td}>
                <span className={ui.badge + " " + (s.active ? ui.badgeOk : ui.badgeWarn)}>
                  {s.active ? "Active" : "Désactivée"}
                </span>
              </td>
              <td className={ui.td}>
                <button className={ui.btnSecondary} onClick={() => basculerActive(s)}>
                  {s.active ? "Désactiver" : "Activer"}
                </button>
              </td>
            </tr>
          ))}
          {salles.length === 0 && (
            <tr>
              <td className={ui.td} colSpan={4}>
                Aucune salle pour l'instant.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form onSubmit={ajouter} className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
        <div>
          <label className={ui.label}>Nom</label>
          <input className={ui.input} placeholder="Salle A" value={nom} onChange={(e) => setNom(e.target.value)} required />
        </div>
        <div>
          <label className={ui.label}>Capacité</label>
          <input
            type="number"
            min={1}
            className={ui.input}
            value={capacite}
            onChange={(e) => setCapacite(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={ui.btnPrimary} disabled={enCours}>
          {enCours ? "Ajout..." : "Ajouter la salle"}
        </button>
      </form>

      {erreur && <p className={ui.errorText}>{erreur}</p>}
    </div>
  );
}
