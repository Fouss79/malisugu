import ExamenForm from "@/components/examens/ExamenForm";

// ⚠️ ADAPTER : remplacer par l'école/année courante issues de ta session/contexte auth.
const ECOLE_ID = 1;
const ANNEE_SCOLAIRE_ID = 1;

export default function NouvelExamenPage() {
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Nouvel examen</h1>
      <ExamenForm ecoleId={ECOLE_ID} anneeScolaireId={ANNEE_SCOLAIRE_ID} />
    </div>
  );
}
