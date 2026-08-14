"use client"

import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";

export default function DebugPermissions() {
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token"); // ou cookie

    if (!token) return;

    try {
      const decoded = jwtDecode(token);

      console.log("JWT DECODED = ", decoded);

      setPermissions(decoded.permissions || []);
    } catch (e) {
      console.error("Erreur decode JWT", e);
    }
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2>Permissions utilisateur :</h2>

      {permissions.length === 0 ? (
        <p>Aucune permission</p>
      ) : (
        <ul>
          {permissions.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}