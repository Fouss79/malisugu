"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import EmargementEnseignantPage from "../../component/Emargementenseignantpage";
// ↑ adapte ce chemin selon où tu ranges tes composants

export default function Page() {
  const params = useParams();
  const router = useRouter();

  const enseignantId = params.id;
  const enseignantNom = null; // optionnel, voir note plus bas

  return (
    <div>
      <div className="p-4 pb-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft size={16} />
          Retour au résumé
        </button>
      </div>

      <EmargementEnseignantPage enseignantId={enseignantId} enseignantNom={enseignantNom} />
    </div>
  );
}