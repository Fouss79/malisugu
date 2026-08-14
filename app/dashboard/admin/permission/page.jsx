"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { Rss } from "lucide-react";

export default function PermissionsRolePage() {
  const [roles, setRoles] = useState([]);
  const [roleId, setRoleId] = useState(null);
 const {user}= useAuth();
 const ecoleId= user?.ecole.id;
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les rôles
  useEffect(() => {
    api.get(`/roles/ecole/${ecoleId}`)
      .then(res => {
        setRoles(res.data);

        if (res.data.length > 0) {
          setRoleId(res.data[0].id);
          console.log(res.data);
        }
      });
  }, []);

  // Charger rôle + permissions
  useEffect(() => {
    if (roleId) {
      loadData(roleId);
    }
  }, [roleId]);

  const loadData = async (id) => {
    setLoading(true);

    try {
      const roleRes = await api.get(
        `/roles/${id}`
      );

      const permissionsRes = await api.get(
        "/permissions"
      );

      setRole(roleRes.data);
      setPermissions(permissionsRes.data);

      setSelectedPermissions(
        roleRes.data.permissions?.map(p => p.id) || []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = (permissionId) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const enregistrer = async () => {
    try {
      await api.put(
        `/roles/${roleId}/permissions`,
        selectedPermissions
      );

      alert("Permissions mises à jour");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  if (loading || !role) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6">

      {/* SELECT ROLE */}
      <select
        value={roleId || ""}
        onChange={(e) => setRoleId(e.target.value)}
        className="border p-2 rounded mb-6"
      >
        {roles.map(role => (
          <option key={role.id} value={role.id}>
            {role.nom}
          </option>
        ))}
      </select>

      <h1 className="text-2xl font-bold mb-6">
        Permissions du rôle : {role.nom}
      </h1>

      <div className="bg-white rounded-xl shadow p-6">

        <div className="grid md:grid-cols-2 gap-4">

          {permissions.map(permission => (
            <label
              key={permission.id}
              className="flex items-center gap-3 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedPermissions.includes(permission.id)}
                onChange={() => handleCheck(permission.id)}
              />

              <div>
                <p className="font-semibold">
                  {permission.code}
                </p>
                <p className="text-sm text-gray-500">
                  {permission.description}
                </p>
              </div>
            </label>
          ))}

        </div>

        <button
          onClick={enregistrer}
          className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          Enregistrer
        </button>

      </div>
    </div>
  );
}