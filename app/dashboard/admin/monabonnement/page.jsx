"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function AbonnementPage() {

  const { user, loading } = useAuth();

  const [abonnement, setAbonnement] = useState(null);
  const [plan, setPlan] = useState("BASIC");
  const [duree, setDuree] = useState(1);

  // 🔥 attendre chargement user
  if (loading) return <p className="p-6">Chargement...</p>;
  if (!user || !user.ecole) return <p className="p-6">Non connecté</p>;

  // 📥 charger abonnement
  useEffect(() => {
    fetch("http://localhost:8080/api/superadmin/abonnements/me", {
      headers: {
        "X-USER-EMAIL": user.email
      }
    })
      .then(res => res.json())
      .then(data => {
        setAbonnement(data);
        setPlan(data.plan || "BASIC");
      })
      .catch(console.error);
  }, [user]);

  if (!abonnement) return <p className="p-6">Chargement abonnement...</p>;

  const isExpired = new Date(abonnement.dateFin) < new Date();

  // 🔥 paiement
  const payer = async () => {
    const res = await fetch(
      `http://localhost:8080/api/paiements/init?ecoleId=${user.ecole.id}&plan=${plan}&duree=${duree}`,
      { method: "POST" }
    );

    const data = await res.json();

    if (!data.url) {
      alert("Erreur paiement");
      return;
    }

    window.location.href = data.url;
  };

  // 🔥 renouveler (sans paiement)
  const renouveler = async () => {

    await fetch(
      `http://localhost:8080/api/superadmin/abonnements/${user.ecole.id}?plan=${plan}&duree=${duree}`,
      { method: "PUT" }
    );

    alert("✅ Abonnement mis à jour !");
    window.location.reload();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <h1 className="text-2xl font-bold mb-6">Mon abonnement</h1>

      <div className="bg-white  rounded-xl shadow max-w-md space-y-4">

        <p>
          <strong>Plan :</strong>{" "}
          <span className="text-blue-600">{abonnement.plan}</span>
        </p>

        <p>
          <strong>Expire le :</strong> {abonnement.dateFin}
        </p>

        <p>
          <strong>Statut :</strong>{" "}
          {isExpired ? (
            <span className="text-red-600">❌ Expiré</span>
          ) : (
            <span className="text-green-600">✅ Actif</span>
          )}
        </p>

        {isExpired && (
          <div className="bg-red-100 p-2 text-red-600 rounded">
            ⚠️ Abonnement expiré
          </div>
        )}

        {/* PLAN */}
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="BASIC">BASIC</option>
          <option value="PRO">PRO</option>
          <option value="PREMIUM">PREMIUM</option>
        </select>

        {/* DUREE */}
        <select
          value={duree}
          onChange={(e) => setDuree(Number(e.target.value))}
          className="w-full border p-2 rounded"
        >
          <option value={1}>1 mois</option>
          <option value={6}>6 mois</option>
          <option value={12}>12 mois</option>
        </select>

        {/* ACTIONS */}
        <button
          onClick={renouveler}
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          Mettre à jour (sans paiement)
        </button>

        <button
          onClick={payer}
          className="w-full bg-yellow-500 text-white py-2 rounded"
        >
          💳 Payer maintenant
        </button>

      </div>
    </div>
  );
}