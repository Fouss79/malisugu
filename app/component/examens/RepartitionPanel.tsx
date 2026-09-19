"use client";

import { useMemo, useState } from "react";
import { repartitionApi } from "@/lib/api/examens";
import { messageErreur } from "@/lib/api/client";
import type { RepartitionPreview, AffectationEleveExamen } from "@/types/examens";
import { ui } from "./ui";

interface Props {
  examenId: number;
}

export default function RepartitionPanel({ examenId }: Props) {
  const [apercu, setApercu] = useState<RepartitionPreview | null>(null);
  const [affectations, setAffectations] = useState<AffectationEleveExamen[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [filtreSalle, setFiltreSalle] = useState("");
  const [recherche, setRecherche] = useState("");

  async function voirApercu() {
    setErreur(null);
    setEnCours(true);
    setAffectations(null);
    try {
      setApercu(await repartitionApi.apercu(examenId));
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  async function confirmer() {
    setErreur(null);
    setEnCours(true);
    try {
      await repartitionApi.generer(examenId);
      setAffectations(await repartitionApi.affectations(examenId));
      setApercu(null);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  async function voirResultatsExistants() {
    setErreur(null);
    setEnCours(true);
    try {
      const data = await repartitionApi.affectations(examenId);
      setAffectations(data.length > 0 ? data : null);
      if (data.length === 0) setErreur("Aucune répartition générée pour l'instant.");
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  const sallesDisponibles = useMemo(
    () => (affectations ? Array.from(new Set(affectations.map((a) => a.salleNom))).sort() : []),
    [affectations]
  );

  const affectationsFiltrees = useMemo(() => {
    if (!affectations) return [];
    return affectations.filter((a) => {
      if (filtreSalle && a.salleNom !== filtreSalle) return false;
      if (recherche && !a.eleveNomComplet.toLowerCase().includes(recherche.toLowerCase())) return false;
      return true;
    });
  }, [affectations, filtreSalle, recherche]);

  return (
    <div className={ui.card + " space-y-4"}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Répartition des élèves</h3>
        <div className="flex gap-2">
          <button className={ui.btnSecondary} onClick={voirResultatsExistants} disabled={enCours}>
            Voir la répartition actuelle
          </button>
          <button className={ui.btnPrimary} onClick={voirApercu} disabled={enCours}>
            {enCours ? "Calcul..." : "Générer la répartition"}
          </button>
        </div>
      </div>

      {erreur && <p className={ui.errorText}>{erreur}</p>}

      {apercu && (
        <div className="space-y-3 rounded-md border border-indigo-100 bg-indigo-50/40 p-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Élèves concernés</div>
              <div className="text-lg font-semibold text-slate-900">{apercu.nombreEleves}</div>
            </div>
            <div>
              <div className="text-slate-500">Capacité totale</div>
              <div className="text-lg font-semibold text-slate-900">{apercu.capaciteTotale}</div>
            </div>
            <div>
              <div className="text-slate-500">Salles actives</div>
              <div className="text-lg font-semibold text-slate-900">{apercu.nombreSalles}</div>
            </div>
          </div>

          {!apercu.capaciteSuffisante && (
            <p className={ui.errorText}>
              Capacité insuffisante : il manque {apercu.nombreEleves - apercu.capaciteTotale} place(s).
              Ajoute ou active des salles avant de confirmer.
            </p>
          )}

          <table className={ui.table}>
            <thead>
              <tr>
                <th className={ui.th}>Salle</th>
                <th className={ui.th}>Capacité</th>
                <th className={ui.th}>Élèves prévus</th>
              </tr>
            </thead>
            <tbody>
              {apercu.repartitionPrevue.map((s) => (
                <tr key={s.salleId}>
                  <td className={ui.td}>{s.salleNom}</td>
                  <td className={ui.td}>{s.capacite}</td>
                  <td className={ui.td}>{s.nombreElevesPrevu}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className={ui.btnPrimary} onClick={confirmer} disabled={enCours || !apercu.capaciteSuffisante}>
            {enCours ? "Génération..." : "Confirmer et générer"}
          </button>
        </div>
      )}

      {affectations && affectations.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
            <div>
              <label className={ui.label}>Filtrer par salle</label>
              <select className={ui.select} value={filtreSalle} onChange={(e) => setFiltreSalle(e.target.value)}>
                <option value="">Toutes les salles</option>
                {sallesDisponibles.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className={ui.label}>Rechercher un élève</label>
              <input
                className={ui.input}
                placeholder="Nom de l'élève..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>
          </div>

          <table className={ui.table}>
            <thead>
              <tr>
                <th className={ui.th}>Place</th>
                <th className={ui.th}>Élève</th>
                <th className={ui.th}>Classe</th>
                <th className={ui.th}>Salle</th>
              </tr>
            </thead>
            <tbody>
              {affectationsFiltrees.map((a) => (
                <tr key={a.id}>
                  <td className={ui.td}>{a.numeroPlace}</td>
                  <td className={ui.td}>{a.eleveNomComplet}</td>
                  <td className={ui.td}>{a.classeNom}</td>
                  <td className={ui.td}>{a.salleNom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
