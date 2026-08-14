"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";

function AffectationEnseignantFormInner() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;
  const searchParams = useSearchParams();

  const [enseignantsMatiere, setEnseignantsMatiere] = useState([]);
  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [programmeClasse, setProgrammeClasse] = useState([]);
  const [affectations, setAffectations] = useState([]);

  const [form, setForm] = useState({ enseignantId: "", classeId: "", anneeScolaireId: "", coefficientMatiereId: "" });
  const [erreur, setErreur] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [prerempliDepuisUrl, setPrerempliDepuisUrl] = useState(false);

  useEffect(() => {
    if (!ecoleId) return;

    api.get(`/classes/ecole/${ecoleId}`).then(res => setClasses(res.data));
    api.get(`/annees/ecole/${ecoleId}`).then((res) => {
      const data = res.data;
      setAnnees(data);

      // 🔥 Paramètres d'URL, prioritaires sur l'année active par défaut
      const anneeIdUrl = searchParams.get("anneeScolaireId");
      const active = data.find(a => a.active);

      setForm(prev => ({
        ...prev,
        anneeScolaireId: anneeIdUrl || (active ? active.id.toString() : "")
      }));
    });
  }, [ecoleId, searchParams]);

  // 🔥 Préremplit classeId depuis l'URL, dès que les classes sont chargées
  useEffect(() => {
    const classeIdUrl = searchParams.get("classeId");
    if (classeIdUrl && classes.length > 0 && !form.classeId) {
      setForm(prev => ({ ...prev, classeId: classeIdUrl }));
    }
  }, [classes, searchParams]);

  // Charge le programme (matières + coeff + heures) correspondant au niveau/série de la classe choisie
  useEffect(() => {
    if (!form.classeId || !form.anneeScolaireId) return;

    const classe = classes.find(c => String(c.id) === String(form.classeId));
    if (!classe) return;

    const params = {
      ecoleId,
      anneeScolaireId: form.anneeScolaireId,
      niveauId: classe.niveau?.id,
    };
    if (classe.serie?.id) params.serieId = classe.serie.id;

    api.get(`/coefficients/programme/niveau`, { params })
      .then((res) => {
        const data = res.data;
        setProgrammeClasse(data);

        // 🔥 Préremplit coefficientMatiereId depuis l'URL, une seule fois,
        // une fois que le programme de la classe est bien chargé
        const coefIdUrl = searchParams.get("coefficientMatiereId");
        if (coefIdUrl && !prerempliDepuisUrl) {
          const existeDansLeProgramme = data.some(p => String(p.id) === String(coefIdUrl));
          if (existeDansLeProgramme) {
            setForm(prev => ({ ...prev, coefficientMatiereId: coefIdUrl }));
          }
          setPrerempliDepuisUrl(true);
        }
      })
      .catch(() => setProgrammeClasse([]));
  }, [form.classeId, form.anneeScolaireId, classes, ecoleId, searchParams, prerempliDepuisUrl]);

  useEffect(() => {
    const ligne = programmeClasse.find(
      p => String(p.id) === String(form.coefficientMatiereId)
    );

    if (!ligne?.matiereId) {
      setEnseignantsMatiere([]);
      return;
    }

    api.get(`/enseignants/matiere/${ligne.matiereId}`)
      .then(res => {
        setEnseignantsMatiere(res.data);
        // Ne réinitialise pas enseignantId ici si on vient de préremplir depuis l'URL
        // (évite d'effacer une éventuelle présélection future)
      })
      .catch(() => setEnseignantsMatiere([]));
  }, [form.coefficientMatiereId, programmeClasse]);

  const loadAffectations = () => {
    if (!form.classeId || !form.anneeScolaireId) { setAffectations([]); return; }
    api.get(`/affectations-enseignants/classe/${form.classeId}`, {
      params: { anneeScolaireId: form.anneeScolaireId },
    })
      .then(res => setAffectations(res.data));
  };

  useEffect(() => { loadAffectations(); }, [form.classeId, form.anneeScolaireId]);

  const ligneChoisie = useMemo(
    () => programmeClasse.find(p => String(p.id) === String(form.coefficientMatiereId)),
    [programmeClasse, form.coefficientMatiereId]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setErreur("");

    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === "classeId" && {
        coefficientMatiereId: "",
        enseignantId: ""
      }),
      ...(name === "coefficientMatiereId" && {
        enseignantId: ""
      })
    }));

    if (name === "classeId") {
      setEnseignantsMatiere([]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErreur("");

    if (!form.enseignantId || !form.classeId || !form.coefficientMatiereId) {
      setErreur("Choisissez un enseignant, une classe et une matière du programme");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/affectations-enseignants", {
        enseignantId: form.enseignantId,
        classeId: form.classeId,
        coefficientMatiereId: form.coefficientMatiereId
      });

      setToast("✓ Enseignant affecté");
      setTimeout(() => setToast(null), 3000);
      setForm(prev => ({ ...prev, coefficientMatiereId: "" }));
      loadAffectations();
    } catch (err) {
      console.error(err);
      setErreur(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de l'affectation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const supprimer = async (id) => {
    try {
      await api.delete(`/affectations-enseignants/${id}`);
      loadAffectations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/40">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Affecter un enseignant</h2>
        <p className="mb-4 text-sm text-slate-500">Le coefficient et le volume horaire viennent du programme de la classe.</p>

        {erreur && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">{erreur}</div>}

        <form onSubmit={submit} className="space-y-3">
          <select name="anneeScolaireId" value={form.anneeScolaireId} onChange={handleChange} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400">
            <option value="">Année</option>
            {annees.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>

          <select name="classeId" value={form.classeId} onChange={handleChange} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400">
            <option value="">Classe</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nomComplet}</option>)}
          </select>

          <select
            name="coefficientMatiereId" value={form.coefficientMatiereId} onChange={handleChange}
            disabled={!form.classeId}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 disabled:opacity-60"
          >
            <option value="">
              {!form.classeId ? "Choisissez d'abord une classe" : programmeClasse.length === 0 ? "Aucune matière au programme" : "Matière"}
            </option>
            {programmeClasse.map(p => (
              <option key={p.id} value={p.id}>
                {p.matiereNom} — Coeff. {p.coefficient}{p.nombreHeuresParSemaine ? ` — ${p.nombreHeuresParSemaine}h` : ""}
              </option>
            ))}
          </select>

          <select
            name="enseignantId"
            value={form.enseignantId}
            onChange={handleChange}
            disabled={!form.coefficientMatiereId}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">
              {!form.coefficientMatiereId
                ? "Choisissez une matière"
                : enseignantsMatiere.length === 0
                ? "Aucun enseignant pour cette matière"
                : "Enseignant"}
            </option>
            {enseignantsMatiere.map(e => (
              <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
            ))}
          </select>

          {ligneChoisie && (
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              Coefficient : <span className="font-semibold text-slate-700">{ligneChoisie.coefficient}</span>
              {ligneChoisie.nombreHeuresParSemaine && (
                <> — Volume horaire : <span className="font-semibold text-slate-700">{ligneChoisie.nombreHeuresParSemaine}h/semaine</span></>
              )}
            </div>
          )}

          <button disabled={submitting} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? "Affectation..." : "Affecter"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/40">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Enseignants affectés</h2>
        {affectations.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun enseignant affecté pour l'instant.</p>
        ) : (
          <ul className="space-y-2">
            {affectations.map(a => (
              <li key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.enseignantPrenom} {a.enseignantNom}</p>
                  <p className="text-xs text-slate-400">
                    {a.matiereNom} — Coeff. {a.coefficient}{a.nombreHeuresParSemaine ? ` — ${a.nombreHeuresParSemaine}h/semaine` : ""}
                  </p>
                </div>
                <button onClick={() => supprimer(a.id)} className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-100">
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {toast && <div className="fixed bottom-6 right-6 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}

export default function AffectationEnseignantForm() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Chargement...</p>}>
      <AffectationEnseignantFormInner />
    </Suspense>
  );
}