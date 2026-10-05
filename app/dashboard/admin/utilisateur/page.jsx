"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import PersonnelForm from "./Component/personnelForm";

// La colonne `photo` contient l'URL publique Supabase complète
const urlPhoto = (photo) => photo || null;

function Avatar({ nom, photo, taille = 36 }) {
  const url = urlPhoto(photo);
  const initiale = (nom || "?").trim().charAt(0).toUpperCase();

  return url ? (
    <img
      src={url}
      alt={nom}
      width={taille}
      height={taille}
      className="rounded-full object-cover"
      style={{ width: taille, height: taille }}
    />
  ) : (
    <span
      className="flex items-center justify-center rounded-full bg-[#054861] text-white font-semibold"
      style={{ width: taille, height: taille }}
    >
      {initiale}
    </span>
  );
}

export default function GestionRolesPage() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;

  const [showModal, setShowModal] = useState(false);

  // ===== MODIFICATION =====
  const [editUser, setEditUser] = useState(null); // utilisateur en cours de modification
  const [editForm, setEditForm] = useState({
    nom: "",
    email: "",
    roleId: "",
    password: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editErreur, setEditErreur] = useState("");

  useEffect(() => {
    if (ecoleId) {
      chargerDonnees();
    }
  }, [ecoleId]);

  const chargerDonnees = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get(`/users/ecole/${ecoleId}/utilisateurs`),
        api.get(`/roles/ecole/${ecoleId}`),
      ]);

      setUtilisateurs(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const changerRole = async (utilisateurId, roleId) => {
    try {
      await api.put("/users/changer-role", {
        utilisateurId,
        roleId,
      });

      setUtilisateurs((prev) =>
        prev.map((u) =>
          u.id === utilisateurId
            ? { ...u, role: roles.find((r) => r.id === Number(roleId)) }
            : u
        )
      );

      alert("Rôle modifié avec succès");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la modification");
    }
  };

  // ============================================================
  // OUVRIR / FERMER LE MODAL DE MODIFICATION
  // ============================================================

  const ouvrirModification = (u) => {
    setEditUser(u);
    setEditForm({
      nom: u.nom || "",
      email: u.email || "",
      roleId: u.role?.id || "",
      password: "",
    });
    setPhotoFile(null);
    setPhotoPreview(urlPhoto(u.photo));
    setEditErreur("");
  };

  const fermerModification = () => {
    setEditUser(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditErreur("");
  };

  const choisirPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditErreur("Le fichier doit être une image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditErreur("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    setEditErreur("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const modifierChamp = (champ) => (e) =>
    setEditForm((f) => ({ ...f, [champ]: e.target.value }));

  // ============================================================
  // ENREGISTRER LA MODIFICATION
  // PUT /users/{id}          -> nom, email, password (optionnel)
  // PUT /users/changer-role  -> seulement si le rôle a changé
  // ============================================================

  const enregistrerModification = async (e) => {
    e.preventDefault();
    setEditErreur("");

    if (!editForm.nom.trim()) {
      setEditErreur("Le nom est obligatoire.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(editForm.email)) {
      setEditErreur("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      setEditErreur("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nom: editForm.nom.trim(),
        email: editForm.email.trim(),
      };

      if (editForm.password) {
        payload.password = editForm.password;
      }

      await api.put(`/users/${editUser.id}`, payload);

      // Envoi de la photo au backend (qui la stocke dans Supabase)
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);

        await api.post(`/users/${editUser.id}/photo`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (
        editForm.roleId &&
        Number(editForm.roleId) !== Number(editUser.role?.id)
      ) {
        await api.put("/users/changer-role", {
          utilisateurId: editUser.id,
          roleId: editForm.roleId,
        });
      }

      await chargerDonnees();
      fermerModification();
      alert("Utilisateur modifié avec succès");
    } catch (error) {
      console.error(error);
      setEditErreur(
        error.response?.data?.message ||
          error.message ||
          "Erreur lors de la modification de l'utilisateur."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des rôles</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#054861] text-white px-4 py-2 rounded-lg"
        >
          + Ajouter personnel
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Nom</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Mot de passe</th>
              <th className="text-left p-3">Rôle actuel</th>
              <th className="text-left p-3">Changer rôle</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {utilisateurs.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar nom={u.nom} photo={u.photo} />
                    <span>{u.nom}</span>
                  </div>
                </td>

                <td className="p-3">{u.email}</td>

                <td className="p-3">{u.motDePasseTemporaire || "-"}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-white ${
                      u.role?.nom === "ADMIN"
                        ? "bg-red-500"
                        : u.role?.nom === "ELEVE"
                        ? "bg-blue-500"
                        : u.role?.nom === "PROF"
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  >
                    {u.role?.nom}
                  </span>
                </td>

                <td className="p-3">
                  <select
                    value={u.role?.id || ""}
                    onChange={(e) => changerRole(u.id, e.target.value)}
                    className="border rounded px-3 py-2"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.nom}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="p-3">
                  <button
                    onClick={() => ouvrirModification(u)}
                    className="border border-[#054861] text-[#054861] px-3 py-2 rounded-lg text-sm hover:bg-[#054861] hover:text-white transition"
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== MODAL AJOUT ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-4xl p-10 mt-20 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-3 text-xl"
            >
              ✕
            </button>

            <PersonnelForm
              onSaved={() => {
                chargerDonnees();
              }}
            />
          </div>
        </div>
      )}

      {/* ===== MODAL MODIFICATION ===== */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-lg p-8 relative">
            <button
              onClick={fermerModification}
              className="absolute right-4 top-3 text-xl"
              aria-label="Fermer"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">
              Modifier l'utilisateur
            </h2>

            {editErreur && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {editErreur}
              </div>
            )}

            <form onSubmit={enregistrerModification} className="space-y-4">
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Aperçu"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <Avatar nom={editForm.nom} taille={80} />
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Photo
                  </label>
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
                  value={editForm.nom}
                  onChange={modifierChamp("nom")}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={modifierChamp("email")}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rôle</label>
                <select
                  value={editForm.roleId}
                  onChange={modifierChamp("roleId")}
                  className="w-full border rounded px-3 py-2"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={modifierChamp("password")}
                  autoComplete="new-password"
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laissez vide pour conserver le mot de passe actuel.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={fermerModification}
                  className="border px-4 py-2 rounded-lg"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#054861] text-white px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}