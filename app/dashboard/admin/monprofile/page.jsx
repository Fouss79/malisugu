"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/api";

function Avatar({ nom, photo, taille = 96 }) {
  const initiale = (nom || "?").trim().charAt(0).toUpperCase();

  return photo ? (
    <img
      src={photo}
      alt={nom}
      className="rounded-full object-cover"
      style={{ width: taille, height: taille }}
    />
  ) : (
    <span
      className="flex items-center justify-center rounded-full bg-[#054861] text-white text-3xl font-semibold"
      style={{ width: taille, height: taille }}
    >
      {initiale}
    </span>
  );
}

function Alerte({ type, children }) {
  const styles =
    type === "erreur"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export default function ProfilPage() {
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);

  // ----- Infos -----
  const [nom, setNom] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [savingInfos, setSavingInfos] = useState(false);
  const [infosMsg, setInfosMsg] = useState(null); // { type, texte }

  // ----- Mot de passe -----
  const [mdp, setMdp] = useState({ ancien: "", nouveau: "", confirmation: "" });
  const [savingMdp, setSavingMdp] = useState(false);
  const [mdpMsg, setMdpMsg] = useState(null);

  // ============================================================
  // GET /users/me
  // ============================================================

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await api.get("/users/me");
        setProfil(res.data);
        setNom(res.data.nom || "");
        setPhotoPreview(res.data.photo || null);
      } catch (err) {
        console.error(err);
        setInfosMsg({
          type: "erreur",
          texte: "Impossible de charger votre profil.",
        });
      } finally {
        setLoading(false);
      }
    };

    charger();
  }, []);

  const choisirPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setInfosMsg({ type: "erreur", texte: "Le fichier doit être une image." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setInfosMsg({
        type: "erreur",
        texte: "L'image ne doit pas dépasser 5 Mo.",
      });
      return;
    }

    setInfosMsg(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ============================================================
  // PUT /users/me          -> nom
  // POST /users/me/photo   -> photo (si changée)
  // ============================================================

  const enregistrerInfos = async (e) => {
    e.preventDefault();
    setInfosMsg(null);

    if (!nom.trim()) {
      setInfosMsg({ type: "erreur", texte: "Le nom est obligatoire." });
      return;
    }

    setSavingInfos(true);

    try {
      let res = await api.put("/users/me", { nom: nom.trim() });

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);

        res = await api.post("/users/me/photo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setPhotoFile(null);
      }

      setProfil(res.data);
      setPhotoPreview(res.data.photo || null);
      setInfosMsg({ type: "succes", texte: "Profil mis à jour." });
    } catch (err) {
      console.error(err);
      setInfosMsg({
        type: "erreur",
        texte:
          err.response?.data?.message ||
          err.message ||
          "Erreur lors de la mise à jour du profil.",
      });
    } finally {
      setSavingInfos(false);
    }
  };

  // ============================================================
  // PUT /users/me/password
  // ============================================================

  const changerMotDePasse = async (e) => {
    e.preventDefault();
    setMdpMsg(null);

    if (!mdp.ancien) {
      setMdpMsg({ type: "erreur", texte: "Saisissez votre mot de passe actuel." });
      return;
    }

    if (mdp.nouveau.length < 6) {
      setMdpMsg({
        type: "erreur",
        texte: "Le nouveau mot de passe doit contenir au moins 6 caractères.",
      });
      return;
    }

    if (mdp.nouveau !== mdp.confirmation) {
      setMdpMsg({
        type: "erreur",
        texte: "La confirmation ne correspond pas au nouveau mot de passe.",
      });
      return;
    }

    setSavingMdp(true);

    try {
      await api.put("/users/me/password", {
        ancienMotDePasse: mdp.ancien,
        nouveauMotDePasse: mdp.nouveau,
      });

      setMdp({ ancien: "", nouveau: "", confirmation: "" });
      setMdpMsg({ type: "succes", texte: "Mot de passe modifié." });
    } catch (err) {
      console.error(err);
      setMdpMsg({
        type: "erreur",
        texte:
          err.response?.data?.message ||
          "Erreur lors du changement de mot de passe.",
      });
    } finally {
      setSavingMdp(false);
    }
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!profil) {
    return (
      <div className="p-6">
        {infosMsg && <Alerte type={infosMsg.type}>{infosMsg.texte}</Alerte>}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Mon profil</h1>

      {/* ===== INFORMATIONS ===== */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Informations</h2>

        {infosMsg && <Alerte type={infosMsg.type}>{infosMsg.texte}</Alerte>}

        <form onSubmit={enregistrerInfos} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar nom={nom} photo={photoPreview} />

            <div>
              <label className="block text-sm font-medium mb-1">Photo</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={choisirPhoto}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG ou WebP, 5 Mo maximum.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={profil.email || ""}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rôle</label>
              <input
                type="text"
                value={profil.role?.nom || ""}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">École</label>
              <input
                type="text"
                value={profil.ecole?.nom || ""}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingInfos}
              className="bg-[#054861] text-white px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {savingInfos ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>

      {/* ===== MOT DE PASSE ===== */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Mot de passe</h2>

        {mdpMsg && <Alerte type={mdpMsg.type}>{mdpMsg.texte}</Alerte>}

        <form onSubmit={changerMotDePasse} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={mdp.ancien}
              onChange={(e) => setMdp({ ...mdp, ancien: e.target.value })}
              autoComplete="current-password"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={mdp.nouveau}
              onChange={(e) => setMdp({ ...mdp, nouveau: e.target.value })}
              autoComplete="new-password"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={mdp.confirmation}
              onChange={(e) =>
                setMdp({ ...mdp, confirmation: e.target.value })
              }
              autoComplete="new-password"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingMdp}
              className="bg-[#054861] text-white px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {savingMdp ? "Modification..." : "Changer le mot de passe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}