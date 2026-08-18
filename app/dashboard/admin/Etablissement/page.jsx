"use client";

import { useEffect, useRef, useState } from "react";
import { Save, Upload, X, Building2 } from "lucide-react";
import api from "../../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

export default function ModifierEcolePage() {
  const { user } = useAuth();

  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ecoleId, setEcoleId] = useState(null);

  const [form, setForm] = useState({
    nom: "",
    codeEcole: "",
    adresse: "",
    ville: "",
    pays: "",
    telephone: "",
    email: "",
  });

  const [logoActuel, setLogoActuel] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  // =========================================================
  // CHARGER L'ÉCOLE
  // =========================================================

  useEffect(() => {
    chargerEcole();
  }, []);

  const chargerEcole = async () => {
    try {
      setLoading(true);

      /*
       * Adapte cette ligne selon la façon dont ton AuthContext
       * stocke l'école.
       *
       * Exemple :
       * user.ecoleId
       */

      const id = user?.ecoleId || user?.ecole?.id;

      if (!id) {
        console.error("❌ ID école introuvable");
        return;
      }

      setEcoleId(id);

      const response = await api.get(`/ecoles/${id}`);

      const ecole = response.data;

      setForm({
        nom: ecole.nom || "",
        codeEcole: ecole.codeEcole || "",
        adresse: ecole.adresse || "",
        ville: ecole.ville || "",
        pays: ecole.pays || "",
        telephone: ecole.telephone || "",
        email: ecole.email || "",
      });

      setLogoActuel(ecole.logo || "");

    } catch (error) {
      console.error(
        "❌ Erreur chargement école :",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CHANGEMENT INPUT
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // CHOIX LOGO
  // =========================================================

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Vérification type
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image.");
      return;
    }

    // Limite 2 Mo
    if (file.size > 2 * 1024 * 1024) {
      alert("Le logo ne doit pas dépasser 2 Mo.");
      return;
    }

    setLogoFile(file);

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  // =========================================================
  // SUPPRIMER NOUVEAU LOGO
  // =========================================================

  const supprimerLogoSelectionne = () => {
    setLogoFile(null);
    setLogoPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================================================
  // ENREGISTRER
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ecoleId) {
      alert("École introuvable.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("nom", form.nom);
      formData.append("codeEcole", form.codeEcole);
      formData.append("adresse", form.adresse);
      formData.append("ville", form.ville);
      formData.append("pays", form.pays);
      formData.append("telephone", form.telephone);
      formData.append("email", form.email);

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const response = await api.put(
        `/ecoles/${ecoleId}`,
        formData
      );

      console.log("✅ École modifiée :", response.data);

      // Mettre à jour le logo affiché
      if (response.data.logo) {
        setLogoActuel(response.data.logo);
      }

      setLogoFile(null);
      setLogoPreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      alert("Les informations de l'école ont été modifiées avec succès.");

    } catch (error) {
      console.error(
        "❌ Erreur modification école :",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Une erreur est survenue lors de la modification."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-slate-500">
          Chargement des informations de l'école...
        </div>
      </div>
    );
  }

  // =========================================================
  // URL LOGO
  // =========================================================

  
  const getLogoUrl = (logo) => {
  if (!logo) return null;

  if (
    logo.startsWith("http://") ||
    logo.startsWith("https://")
  ) {
    return logo;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8080";

  return `${baseUrl.replace(/\/$/, "")}${
    logo.startsWith("/") ? logo : `/${logo}`
  }`;
};

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Building2 size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Informations de l'école
            </h1>

            <p className="text-sm text-slate-500">
              Modifiez les informations générales de votre établissement.
            </p>
          </div>

        </div>
      </div>

      {/* FORMULAIRE */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >

        {/* INFORMATIONS GÉNÉRALES */}
        <div className="border-b border-slate-200 p-6">

          <h2 className="mb-5 text-lg font-semibold text-slate-800">
            Informations générales
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* NOM */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nom de l'école
              </label>

              <input
                type="text"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ex : Groupe Scolaire Excellence"
              />
            </div>

            {/* CODE */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Code école
              </label>

              <input
                type="text"
                name="codeEcole"
                value={form.codeEcole}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ex : GSE001"
              />
            </div>

            {/* ADRESSE */}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Adresse
              </label>

              <input
                type="text"
                name="adresse"
                value={form.adresse}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Adresse de l'établissement"
              />
            </div>

            {/* VILLE */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Ville
              </label>

              <input
                type="text"
                name="ville"
                value={form.ville}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ex : Bamako"
              />
            </div>

            {/* PAYS */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Pays
              </label>

              <input
                type="text"
                name="pays"
                value={form.pays}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ex : Mali"
              />
            </div>

            {/* TELEPHONE */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Téléphone
              </label>

              <input
                type="tel"
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ex : +223 70 00 00 00"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="contact@ecole.com"
              />
            </div>

          </div>
        </div>

        {/* LOGO */}
        <div className="border-b border-slate-200 p-6">

          <h2 className="mb-5 text-lg font-semibold text-slate-800">
            Logo de l'école
          </h2>

          <div className="flex flex-col gap-6 md:flex-row">

            {/* APERCU */}
            <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">

              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Nouveau logo"
                  className="h-full w-full object-contain"
                />
              ) : logoActuel ? (
                <img
                  src={getLogoUrl(logoActuel)}
                  alt="Logo actuel"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <Building2
                    size={40}
                    className="mx-auto mb-2"
                  />

                  <span className="text-xs">
                    Aucun logo
                  </span>
                </div>
              )}

            </div>

            {/* UPLOAD */}
            <div className="flex flex-1 flex-col justify-center">

              <p className="mb-2 text-sm font-medium text-slate-700">
                {logoPreview
                  ? "Nouveau logo sélectionné"
                  : "Logo actuel"}
              </p>

              {logoFile && (
                <p className="mb-4 text-xs text-slate-500">
                  {logoFile.name}
                </p>
              )}

              <div className="flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  <Upload size={17} />

                  Choisir un logo
                </button>

                {logoFile && (
                  <button
                    type="button"
                    onClick={supprimerLogoSelectionne}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    <X size={17} />

                    Annuler
                  </button>
                )}

              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleLogoChange}
                className="hidden"
              />

              <p className="mt-3 text-xs text-slate-400">
                PNG, JPG ou WEBP — maximum 2 Mo.
              </p>

            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 bg-slate-50 p-6">

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            <Save size={18} />

            {saving
              ? "Enregistrement..."
              : "Enregistrer les modifications"}

          </button>

        </div>

      </form>
    </div>
  );
}