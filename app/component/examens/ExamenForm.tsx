"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { examensApi } from "@/lib/api/examens";
import { messageErreur } from "@/lib/api/client";
import { ui } from "./ui";

interface Props {
  ecoleId: number;
  anneeScolaireId: number;
}

export default function ExamenForm({ ecoleId, anneeScolaireId }: Props) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const examen = await examensApi.create({
        nom,
        ecoleId,
        anneeScolaireId,
        dateDebut: dateDebut || null,
        dateFin: dateFin || null,
      });
      router.push(`/examens/${examen.id}`);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={ui.card + " space-y-4 max-w-lg"}>
      <div>
        <label className={ui.label} htmlFor="nom">
          Nom de l'examen
        </label>
        <input
          id="nom"
          className={ui.input}
          placeholder="Composition du 1er trimestre 2026-2027"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={ui.label} htmlFor="dateDebut">
            Date de début
          </label>
          <input
            id="dateDebut"
            type="date"
            className={ui.input}
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
          />
        </div>
        <div>
          <label className={ui.label} htmlFor="dateFin">
            Date de fin
          </label>
          <input
            id="dateFin"
            type="date"
            className={ui.input}
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
          />
        </div>
      </div>

      {erreur && <p className={ui.errorText}>{erreur}</p>}

      <button type="submit" className={ui.btnPrimary} disabled={enCours}>
        {enCours ? "Création..." : "Créer l'examen"}
      </button>
    </form>
  );
}
