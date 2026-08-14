"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";

export default function GestionRolesPage() {

  const { user } = useAuth();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nom, setNom] = useState("");
  const [edition, setEdition] = useState(null);

  useEffect(() => {
    if (user?.ecole?.id) {
      chargerRoles();
    }
  }, [user]);

  async function chargerRoles() {

    try {

      const res = await api.get(
        `/roles/ecole/${user.ecole.id}`
      );

      setRoles(res.data);

    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }

  async function enregistrer() {

    try {

      if (edition) {

        await api.put(
          `/roles/${edition.id}`,
          {
            nom
          }
        );

      } else {

        await api.post(
          "/roles",
          {
            nom,
            ecole: {
              id: user.ecole.id
            }
          }
        );

      }

      setNom("");
      setEdition(null);

      chargerRoles();

    } catch (e) {

      alert("Erreur");

    }

  }

  async function supprimer(id) {

    if (!confirm("Supprimer ce rôle ?"))
      return;

    try {

      await api.delete(
        `/roles/${id}`
      );

      chargerRoles();

    } catch (e) {

      alert("Impossible");

    }

  }

  if (loading)
    return <div className="p-6">Chargement...</div>;

  return (

    <div className="p-6">

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-bold">
          Gestion des rôles
        </h1>

      </div>

      <div className="bg-white shadow rounded-lg p-4 mb-6">

        <div className="flex gap-3">

          <input
            value={nom}
            onChange={(e)=>setNom(e.target.value)}
            placeholder="Nom du rôle"
            className="border rounded px-3 py-2 flex-1"
          />

          <button
            onClick={enregistrer}
            className="bg-[#054861] text-white px-4 rounded flex items-center gap-2"
          >
            <Plus size={18}/>
            {edition ? "Modifier" : "Créer"}
          </button>

        </div>

      </div>

      <div className="bg-white rounded shadow overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="p-3 text-left">
                Nom
              </th>

              <th className="p-3 text-center">
                Permissions
              </th>

              <th className="p-3 text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {roles.map(role=>(

              <tr
                key={role.id}
                className="border-b"
              >

                <td className="p-3 font-medium">

                  {role.nom}

                </td>

                <td className="text-center">

                  {role.permissions?.length || 0}

                </td>

                <td>

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={()=>{
                        setEdition(role);
                        setNom(role.nom);
                      }}
                      className="bg-blue-500 text-white p-2 rounded"
                    >
                      <Pencil size={16}/>
                    </button>

                    <button
                      onClick={()=>supprimer(role.id)}
                      className="bg-red-500 text-white p-2 rounded"
                    >
                      <Trash2 size={16}/>
                    </button>

                    <button
                      className="bg-green-600 text-white px-3 rounded"
                    >
                      Permissions
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}