"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import PersonnelForm from "./Component/personnelForm";
export default function GestionRolesPage() {

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;
const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    if (ecoleId) {
      chargerDonnees();
    }
  }, [ecoleId]);

  const chargerDonnees = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get(
          `/users/ecole/${ecoleId}/utilisateurs`
        ),
        api.get(`/roles/ecole/${ecoleId}`)
      ]);

      setUtilisateurs(usersRes.data);
      setRoles(rolesRes.data);
      console.log(usersRes);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const changerRole = async (utilisateurId, roleId) => {
    try {

      await api.put(
        "/users/changer-role",
        {
          utilisateurId,
          roleId
        }
      );

      setUtilisateurs(prev =>
        prev.map(u =>
          u.id === utilisateurId
            ? {
                ...u,
                role: roles.find(r => r.id === Number(roleId))
              }
            : u
        )
      );

      alert("Rôle modifié avec succès");

    } catch (error) {
      console.error(error);
      alert("Erreur lors de la modification");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Chargement...
      </div>
    );
  }

  return (
    <div className="p-6">


       <div className="flex justify-between items-center mb-6">

<h1 className="text-2xl font-bold">
Gestion des rôles
</h1>


<button
onClick={()=>setShowModal(true)}
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
              <th className="text-left p-3"> Mot de passe
              </th>
              <th className="text-left p-3">Rôle actuel</th>
              <th className="text-left p-3">Changer rôle</th>
            </tr>
          </thead>

          <tbody>
            {utilisateurs.map((u) => (
              <tr
                key={u.id}
                className="border-b"
              >
                <td className="p-3">
                  {u.nom}
                </td>

                <td className="p-3">
                  {u.email}
                </td>
                   <td className="p-3">
                    {u.motDePasseTemporaire || "-"}
                  </td>
                <td className="p-3">
                <span className={`px-2 py-1 rounded text-white ${
  u.role?.nom === "ADMIN" ? "bg-red-500" :
  u.role?.nom === "ELEVE" ? "bg-blue-500" :
  u.role?.nom === "PROF" ? "bg-green-500" :
  "bg-gray-500"
}`}>
  {u.role?.nom}
</span>
                </td>

                <td className="p-3">

                  <select
                    value={u.role?.id || ""}
                    onChange={(e) =>
                      changerRole(
                        u.id,
                        e.target.value
                      )
                    }
                    className="border rounded px-3 py-2"
                  >

                    {roles.map(role => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.nom}
                      </option>
                    ))}

                  </select>

                </td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>
      {
showModal && (

<div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50">


<div className="bg-white  rounded-lg shadow-xl w-[90%] max-w-4xl p-10 mt-20 relative">


<button
onClick={()=>setShowModal(false)}
className="absolute right-4 top-3 text-xl"
>
✕
</button>


<PersonnelForm
onSaved={()=>{
chargerDonnees();
}}
/>


</div>


</div>

)
}
    </div>
  );
}