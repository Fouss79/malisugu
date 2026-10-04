"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";
const initialForm = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  nationalite: "Malienne",
  sexe: "M",
  numeroExtraitNaissance: "",
  groupeSanguin: "",
  allergiesMaladies: "",
  adresse: "",
  telephone: "",
  email: "",
  nomTuteur: "",
  prenomTuteur: "",
  lienParente: "Père",
  telephoneTuteur: "",
  emailTuteur: "",
  professionTuteur: "",
  adresseTuteur: "",
  classeId: "",
  anneeScolaire: "",
  ecoleProvenance: "",
  photo: null,
};

// --- Petits composants réutilisables ---

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
      {/* Ligne verticale connectant les sections */}
      <div className="absolute left-[15px] top-9 bottom-[-24px] w-px bg-slate-200 last:hidden" />
      <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white shadow-sm shadow-indigo-200">
        {number}
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="mb-3 text-xs text-slate-400">{description}</p>
      )}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {children}
      </div>
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

export default function EleveForm({
  eleveId,
  embedded = false,
  onSaved,
}) {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [classes, setClasses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }
  const [loadingData, setLoadingData] = useState(!!eleveId);
  const [photoPreview, setPhotoPreview] = useState(null);
const isEdition = !!eleveId;
useEffect(() => {
  if (!user?.ecole?.id) return;

  const chargerClasses = async () => {
    try {
      const response = await api.get(
        `/classes/ecole/${user.ecole.id}`
      );

      setClasses(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error("Erreur chargement classes :", error);
      setClasses([]);
    }
  };

  chargerClasses();
}, [user?.ecole?.id]);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };
useEffect(() => {
  if (!eleveId || !user?.email) return;

  setLoadingData(true);

  const chargerEleve = async () => {
    try {
      const response = await api.get(
        `/inscriptions/${eleveId}`,
        {
          headers: {
            "X-USER-EMAIL": user.email
          }
        }
      );

      const data = response.data;

      console.log("Élève reçu :", data);

      setForm({
        ...initialForm,
        ...data,
        classeId: data.classeId ?? ""
      });

    } catch (error) {
      console.error(
        "Erreur chargement élève :",
        error
      );

      const message =
        error.response?.status === 403
          ? "Accès refusé"
          : error.response?.data?.message ||
            "Impossible de charger l'élève";

      showToast("error", message);

    } finally {
      setLoadingData(false);
    }
  };

  chargerEleve();
}, [eleveId, user?.email]);
  const validerFormulaire = () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      showToast("error", "Le nom et le prénom sont obligatoires");
      return false;
    }
    if (!form.dateNaissance) {
      showToast("error", "La date de naissance est obligatoire");
      return false;
    }
    if (!form.classeId) {
      showToast("error", "Veuillez choisir une classe");
      return false;
    }
    if (!form.nomTuteur.trim() || !form.telephoneTuteur.trim()) {
      showToast("error", "Le nom et le téléphone du tuteur sont obligatoires");
      return false;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      showToast("error", "Email de l'élève invalide");
      return false;
    }
    if (form.emailTuteur && !/^\S+@\S+\.\S+$/.test(form.emailTuteur)) {
      showToast("error", "Email du tuteur invalide");
      return false;
    }
    return true;
  };
const handlePhotoChange = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("error", "Veuillez sélectionner une image.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("error", "La photo ne doit pas dépasser 5 Mo.");
    return;
  }

  setForm((prev) => ({
    ...prev,
    photo: file
  }));

  setPhotoPreview(URL.createObjectURL(file));
};
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validerFormulaire()) return;

  setSubmitting(true);

  try {
    const { photo, ...formData } = form;

    const payload = {
      ...formData,
      ecoleId: Number(user.ecole.id),
    };

    let currentEleveId = null;

    if (isEdition) {
      // Modification d'une inscription existante
      const response = await api.put(
        `/inscriptions/${eleveId}`,
        payload,
        {
          headers: {
            "X-USER-EMAIL": user.email,
          },
        }
      );

      /*
       * Ici eleveId correspond actuellement à l'ID de l'inscription
       * car ton formulaire utilise /inscriptions/{id}.
       *
       * On récupère ensuite l'élève lié à cette inscription.
       */
      const inscriptionResponse = await api.get(
        `/inscriptions/${eleveId}`,
        {
          headers: {
            "X-USER-EMAIL": user.email,
          },
        }
      );

      /*
       * Ton InscriptionResponseDTO doit idéalement contenir eleveId.
       * Si ce n'est pas encore le cas, on pourra l'ajouter.
       */
      currentEleveId = inscriptionResponse.data.eleveId;

    } else {
      // Création de l'inscription
      const response = await api.post(
        "/inscriptions",
        payload,
        {
          headers: {
            "X-USER-EMAIL": user.email,
          },
        }
      );

      const {
        inscriptionId,
        eleveId: newEleveId,
      } = response.data;

      currentEleveId = newEleveId;
    }

    // Upload de la photo vers Supabase
    if (photo && currentEleveId) {
      const photoData = new FormData();

      photoData.append("file", photo);

      await api.post(
        `/eleves/${currentEleveId}/photo`,
        photoData,
        {
          headers: {
            "X-USER-EMAIL": user.email,
            "Content-Type": "multipart/form-data",
          },
        }
      );
    }

    showToast(
      "success",
      isEdition
        ? "Élève modifié avec succès"
        : "Élève préinscrit avec succès"
    );

    if (!isEdition) {
      setForm(initialForm);
      setPhotoPreview(null);
    }

    onSaved?.();

  } catch (error) {
    console.error("Erreur inscription :", error);

    const message =
      error.response?.status === 403
        ? "Abonnement expiré ou école désactivée"
        : error.response?.data?.message ||
          error.response?.data ||
          "Erreur lors de l'inscription";

    showToast("error", message);

  } finally {
    setSubmitting(false);
  }
};
  const contenu = (
    <>
          <div className="py-10">
      <div className="mx-auto max-w-2xl px-4">

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">
            {isEdition
    ? "Modifier l'élève"
    : "Préinscription d'un élève"}
          </h1>
          <p className="text-sm text-slate-500">
            Renseignez les informations de l'élève et de son tuteur légal.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8"
        >
          <Section
            number="1"
            title="Identité de l'élève"
            description="État civil tel qu'il figure sur l'acte de naissance"
          >
            <Field label="Nom" required>
              <input name="nom" value={form.nom} onChange={handleChange} className={inputClass} required />
            </Field>
            <Field label="Prénom" required>
              <input name="prenom" value={form.prenom} onChange={handleChange} className={inputClass} required />
            </Field>
            <Field label="Date de naissance" required>
              <input type="date" name="dateNaissance" value={form.dateNaissance} onChange={handleChange} className={inputClass} required />
            </Field>
            <Field label="Sexe">
              <select name="sexe" value={form.sexe} onChange={handleChange} className={inputClass}>
                <option value="M">Garçon</option>
                <option value="F">Fille</option>
              </select>
            </Field>
            <Field label="Lieu de naissance">
              <input name="lieuNaissance" value={form.lieuNaissance} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Nationalité">
              <input name="nationalite" value={form.nationalite} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="N° extrait de naissance">
              <input name="numeroExtraitNaissance" value={form.numeroExtraitNaissance} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Groupe sanguin">
              <select name="groupeSanguin" value={form.groupeSanguin} onChange={handleChange} className={inputClass}>
                <option value="">Non renseigné</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
  <Field
    label="Photo de l'élève"
    hint="JPG, PNG ou WEBP — maximum 5 Mo"
  >
    <div className="flex items-center gap-4">

      {photoPreview ? (
        <img
          src={photoPreview}
          alt="Aperçu"
          className="h-24 w-24 rounded-xl object-cover border border-slate-200"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-400">
          Aucune photo
        </div>
      )}

      <div className="flex-1">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          className="w-full text-sm text-slate-500
                     file:mr-3 file:rounded-lg
                     file:border-0 file:bg-indigo-50
                     file:px-4 file:py-2
                     file:text-sm file:font-medium
                     file:text-indigo-600
                     hover:file:bg-indigo-100"
        />
      </div>

    </div>
  </Field>
</div>
            <Field label="Téléphone élève" hint="Optionnel">
              <input name="telephone" value={form.telephone} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Email élève" hint="Optionnel">
              <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Adresse de résidence">
                <input name="adresse" value={form.adresse} onChange={handleChange} className={inputClass} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Allergies / maladies particulières" hint="Optionnel — utile pour l'infirmerie">
                <textarea
                  name="allergiesMaladies"
                  value={form.allergiesMaladies}
                  onChange={handleChange}
                  rows={2}
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Section
            number="2"
            title="Parent / Tuteur légal"
            description="Contact principal à joindre en cas de besoin"
          >
            <Field label="Nom du tuteur" required>
              <input name="nomTuteur" value={form.nomTuteur} onChange={handleChange} className={inputClass} required />
            </Field>
            <Field label="Prénom du tuteur">
              <input name="prenomTuteur" value={form.prenomTuteur} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Lien de parenté">
              <select name="lienParente" value={form.lienParente} onChange={handleChange} className={inputClass}>
                <option value="Père">Père</option>
                <option value="Mère">Mère</option>
                <option value="Tuteur légal">Tuteur légal</option>
                <option value="Autre">Autre</option>
              </select>
            </Field>
            <Field label="Téléphone" required>
              <input name="telephoneTuteur" value={form.telephoneTuteur} onChange={handleChange} className={inputClass} required />
            </Field>
            <Field label="Email" hint="Optionnel">
              <input type="email" name="emailTuteur" value={form.emailTuteur} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Profession">
              <input name="professionTuteur" value={form.professionTuteur} onChange={handleChange} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Adresse" hint="Si différente de celle de l'élève">
                <input name="adresseTuteur" value={form.adresseTuteur} onChange={handleChange} className={inputClass} />
              </Field>
            </div>
          </Section>

          <Section number="3" title="Scolarité">
            <Field label="Classe" required>
              <select name="classeId" value={form.classeId} onChange={handleChange} className={inputClass} required>
                <option value="">Choisir une classe</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.nomComplet}</option>
                ))}
              </select>
            </Field>
            <Field label="Année scolaire" hint="Ex : 2025-2026">
              <input name="anneeScolaire" value={form.anneeScolaire} onChange={handleChange} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="École de provenance" hint="Si transfert d'un autre établissement">
                <input name="ecoleProvenance" value={form.ecoleProvenance} onChange={handleChange} className={inputClass} />
              </Field>
            </div>
          </Section>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setForm(initialForm)}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              Réinitialiser
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Spinner />}
              {submitting
    ? "Enregistrement..."
    : isEdition
        ? "Enregistrer les modifications"
        : "Préinscrire l'élève"}
            </button>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
    </>
);

if (embedded) return contenu;

return (
    <div className="min-h-screen bg-slate-50 py-10">
        <div className="mx-auto max-w-2xl px-4">
            {contenu}
        </div>
    </div>
);
  
  
}