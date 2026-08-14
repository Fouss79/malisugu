"use client";

import { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";

export default function TypeFraisForm() {

  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;


  const [form, setForm] = useState({
    code: "",
    libelle: "",
    frequence: "UNIQUE"
  });


  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };


  const submit = async (e) => {

    e.preventDefault();


    if (!ecoleId) {
      alert("École introuvable");
      return;
    }


    try {

      await api.post(`/type-frais/ecole/${ecoleId}`, form);

      alert("Type de frais créé");


      setForm({
        code: "",
        libelle: "",
        frequence: "UNIQUE"
      });


    } catch (error) {

      console.error(error);
      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Erreur lors de l'enregistrement"
      );

    }

  };


  return (

    <div className="bg-white p-5 rounded-xl shadow w-full max-w-md">


      <h2 className="text-lg font-semibold mb-4">
        Création Type de frais
      </h2>


      <form onSubmit={submit} className="space-y-3">


        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Ex: SCOLARITE"
          className="w-full border p-2 rounded"
          required
        />


        <input
          name="libelle"
          value={form.libelle}
          onChange={handleChange}
          placeholder="Ex: Frais de scolarité"
          className="w-full border p-2 rounded"
          required
        />


        <select
          name="frequence"
          value={form.frequence}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >

          <option value="UNIQUE">
            Paiement unique
          </option>

          <option value="MENSUEL">
            Mensuel
          </option>

          <option value="TRIMESTRIEL">
            Trimestriel
          </option>

          <option value="ANNUEL">
            Annuel
          </option>

        </select>



        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Enregistrer
        </button>


      </form>


    </div>

  );
}