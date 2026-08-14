"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";

const initialForm = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  sexe: "M",
  nationalite: "Malienne",
  telephone: "",
  telephoneSecondaire: "",
  email: "",
  adresse: "",
  contactUrgenceNom: "",
  contactUrgenceTelephone: "",
  specialite: "",
  niveauDiplome: "LICENCE",
  diplomeObtenu: "",
  typeContrat: "CDI",
  dateEmbauche: "",
  dateFinContrat: "",
  salaireBase: "",
  nombreHeuresParSemaine: "",
  matiereIds: []
};

function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-600">
        {label} {required && <span className="text-indigo-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition " +
  "focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100";

function Section({ number, title, description, children }) {
  return (
    <div className="relative pl-10">
      <div className="absolute left-[15px] top-9 bottom-[-24px] w-px bg-slate-200 last:hidden" />
      <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white shadow-sm shadow-indigo-200">
        {number}
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="mb-3 text-xs text-slate-400">{description}</p>}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// 🔥 embedded=true retire le wrapper plein écran, pour usage dans un modal
export default function EnseignantForm({
  enseignantId,
  embedded = false,
  onSaved,
}) {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  const [form, setForm] = useState(initialForm);
  const [matieres, setMatieres] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(!!enseignantId);
  const [toast, setToast] = useState(null);

  const isEdition = !!enseignantId;

  useEffect(() => {
  if (!ecoleId) return;

  const chargerMatieres = async () => {
    try {
      const response = await api.get(
        `/matieres/ecole/${ecoleId}`
      );

      setMatieres(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {
      console.error("Erreur chargement matières :", error);
      setMatieres([]);
    }
  };

  chargerMatieres();
}, [ecoleId]);
  // 🔥 En mode édition, charge les données actuelles de l'enseignant
  useEffect(() => {
  if (!enseignantId) return;

  setLoadingData(true);

  const chargerEnseignant = async () => {
  try {
    const response = await api.get(
      `/enseignants/${enseignantId}`
    );

    const data = response.data;

    console.log("Enseignant reçu :", data);

    setForm({
      ...initialForm,
      ...data,

      sexe: data.sexe ?? "M",

      dateNaissance: data.dateNaissance ?? "",
      lieuNaissance: data.lieuNaissance ?? "",
      nationalite: data.nationalite ?? "Malienne",

      telephone: data.telephone ?? "",
      telephoneSecondaire: data.telephoneSecondaire ?? "",
      email: data.email ?? "",
      adresse: data.adresse ?? "",

      contactUrgenceNom: data.contactUrgenceNom ?? "",
      contactUrgenceTelephone: data.contactUrgenceTelephone ?? "",

      specialite: data.specialite ?? "",
      diplomeObtenu: data.diplomeObtenu ?? "",

      typeContrat: data.typeContrat ?? "CDI",
      niveauDiplome: data.niveauDiplome ?? "LICENCE",

      dateEmbauche: data.dateEmbauche ?? "",
      dateFinContrat: data.dateFinContrat ?? "",

      salaireBase: data.salaireBase ?? "",
      nombreHeuresParSemaine:
        data.nombreHeuresParSemaine ?? "",

      matiereIds: data.matiereIds ?? []
    });

  } catch (error) {
    console.error("Erreur chargement enseignant :", error);
  } finally {
    setLoadingData(false);
  }
};

chargerEnseignant();

}, [enseignantId]);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    console.log("Données envoyées :", {
  ...form,
  salaireBase: form.salaireBase ? Number(form.salaireBase) : null,
  nombreHeuresParSemaine: form.nombreHeuresParSemaine ? Number(form.nombreHeuresParSemaine) : null,
  ecoleId
});
  };

  const toggleMatiere = (id) => {
    setForm(prev => ({
      ...prev,
      matiereIds: prev.matiereIds.includes(id)
        ? prev.matiereIds.filter(m => m !== id)
        : [...prev.matiereIds, id]
    }));
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const validerFormulaire = () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      showToast("error", "Le nom et le prénom sont obligatoires");
      return false;
    }
    if (!form.telephone.trim()) {
      showToast("error", "Le téléphone est obligatoire");
      return false;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      showToast("error", "Email invalide");
      return false;
    }
    if (form.matiereIds.length === 0) {
      showToast("error", "Sélectionnez au moins une matière enseignée");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validerFormulaire()) return;

  setSubmitting(true);

  try {
    const payload = {
      ...form,
      salaireBase: form.salaireBase
        ? Number(form.salaireBase)
        : null,
      nombreHeuresParSemaine:
        form.nombreHeuresParSemaine
          ? Number(form.nombreHeuresParSemaine)
          : null,
      ecoleId: Number(ecoleId)
    };

    if (isEdition) {
      await api.put(
        `/enseignants/${enseignantId}`,
        payload
      );
    } else {
      await api.post(
        "/enseignants",
        payload
      );
    }

    showToast(
      "success",
      isEdition
        ? "Enseignant modifié"
        : "Enseignant ajouté"
    );

    if (!isEdition) {
      setForm(initialForm);
    }

    onSaved?.();

  } catch (error) {
    console.error(
      "Erreur enregistrement enseignant :",
      error
    );

    showToast(
      "error",
      error.response?.data?.message ||
      error.response?.data ||
      "Erreur lors de l'enregistrement"
    );

  } finally {
    setSubmitting(false);
  }
};
  const contenu = (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">
          {isEdition ? "Modifier l'enseignant" : "Ajouter un enseignant"}
        </h1>
        <p className="text-sm text-slate-500">Renseignez son profil, ses coordonnées et ses matières.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">

        <Section number="1" title="Identité" description="État civil de l'enseignant">
          <Field label="Nom" required>
            <input name="nom" value={form.nom} onChange={handleChange} className={inputClass} required />
          </Field>
          <Field label="Prénom" required>
            <input name="prenom" value={form.prenom} onChange={handleChange} className={inputClass} required />
          </Field>
          <Field label="Date de naissance">
            <input type="date" name="dateNaissance" value={form.dateNaissance} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Sexe">
            <select name="sexe" value={form.sexe} onChange={handleChange} className={inputClass}>
              <option value="M">Homme</option>
              <option value="F">Femme</option>
            </select>
          </Field>
          <Field label="Lieu de naissance">
            <input name="lieuNaissance" value={form.lieuNaissance} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Nationalité">
            <input name="nationalite" value={form.nationalite} onChange={handleChange} className={inputClass} />
          </Field>
        </Section>

        <Section number="2" title="Contact" description="Coordonnées et contact d'urgence">
          <Field label="Téléphone" required>
            <input name="telephone" value={form.telephone} onChange={handleChange} className={inputClass} required />
          </Field>
          <Field label="Téléphone secondaire" hint="Optionnel">
            <input name="telephoneSecondaire" value={form.telephoneSecondaire} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Email" hint="Optionnel">
            <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Adresse">
              <input name="adresse" value={form.adresse} onChange={handleChange} className={inputClass} />
            </Field>
          </div>
          <Field label="Contact d'urgence — nom">
            <input name="contactUrgenceNom" value={form.contactUrgenceNom} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Contact d'urgence — téléphone">
            <input name="contactUrgenceTelephone" value={form.contactUrgenceTelephone} onChange={handleChange} className={inputClass} />
          </Field>
        </Section>

        <Section number="3" title="Profil professionnel" description="Qualification et matières enseignées">
          <Field label="Spécialité" hint="Matière principale">
            <input name="specialite" value={form.specialite} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Niveau de diplôme">
            <select name="niveauDiplome" value={form.niveauDiplome} onChange={handleChange} className={inputClass}>
              <option value="BEPC">BEPC</option>
              <option value="BAC">BAC</option>
              <option value="LICENCE">Licence</option>
              <option value="MASTER">Master</option>
              <option value="DOCTORAT">Doctorat</option>
              <option value="AUTRE">Autre</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Diplôme obtenu" hint="Intitulé précis, ex: Licence en Mathématiques">
              <input name="diplomeObtenu" value={form.diplomeObtenu} onChange={handleChange} className={inputClass} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Matières enseignées <span className="text-indigo-500">*</span>
            </label>
            {matieres.length === 0 ? (
              <p className="text-xs text-slate-400">Aucune matière disponible.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {matieres.map(m => {
                  const selected = form.matiereIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMatiere(m.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        selected
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {m.nom}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Section>

        <Section number="4" title="Contrat" description="Conditions d'emploi">
          <Field label="Type de contrat">
            <select name="typeContrat" value={form.typeContrat} onChange={handleChange} className={inputClass}>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="VACATAIRE">Vacataire</option>
              <option value="STAGIAIRE">Stagiaire</option>
            </select>
          </Field>
          <Field label="Nombre d'heures / semaine">
            <input type="number" name="nombreHeuresParSemaine" value={form.nombreHeuresParSemaine} onChange={handleChange} className={inputClass} />
          </Field>
          <Field label="Date d'embauche">
            <input type="date" name="dateEmbauche" value={form.dateEmbauche} onChange={handleChange} className={inputClass} />
          </Field>
          {form.typeContrat !== "CDI" && (
            <Field label="Date de fin de contrat" hint="Pour CDD, vacataire ou stagiaire">
              <input type="date" name="dateFinContrat" value={form.dateFinContrat} onChange={handleChange} className={inputClass} />
            </Field>
          )}
          <Field label="Salaire de base" hint="Optionnel">
            <input type="number" name="salaireBase" value={form.salaireBase} onChange={handleChange} className={inputClass} />
          </Field>
        </Section>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          {!isEdition && (
            <button
              type="button"
              onClick={() => setForm(initialForm)}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              Réinitialiser
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Spinner />}
            {submitting ? "Enregistrement..." : isEdition ? "Enregistrer les modifications" : "Ajouter l'enseignant"}
          </button>
        </div>
      </form>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );

  if (embedded) return contenu;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-2xl px-4">{contenu}</div>
    </div>
  );
}