"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";
export default function PersonnelForm({ onSaved }) {

  const { user } = useAuth();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    lieuNaissance: "",
    sexe: "",
    nationalite: "",

    telephone: "",
    telephoneSecondaire: "",
    email: "",
    adresse: "",

    contactUrgenceNom: "",
    contactUrgenceTelephone: "",

    dateEmbauche: "",
    dateFinContrat: "",

    role: ""
  });


  const [roles, setRoles] = useState([]);


  useState(() => {

    if(user?.ecole?.id){

      api.get(
        `/roles/ecole/${user.ecole.id}`
      )
      .then(res=>{
        setRoles(res.data);
      });

    }

  },[user]);


  const handleChange = (e)=>{

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };


  const enregistrer = async(e)=>{

    e.preventDefault();


    try{

      const data = {

        ...form,

        ecoleId:user.ecole.id

      };


      await api.post(
        "/personnels",
        data
      );


      alert("Personnel ajouté avec succès");


      onSaved?.();


    }catch(error){

      console.log(error);
      alert("Erreur lors de l'ajout");

    }

  };



return (

<form 
onSubmit={enregistrer}
className="bg-white shadow rounded-lg p-6 grid grid-cols-2 gap-4"
>


<h2 className="col-span-2 text-xl font-bold">
Ajouter un personnel
</h2>


<input
name="nom"
placeholder="Nom"
className="input input-bordered"
onChange={handleChange}
/>


<input
name="prenom"
placeholder="Prénom"
className="input input-bordered"
onChange={handleChange}
/>



<input
type="date"
name="dateNaissance"
className="input input-bordered"
onChange={handleChange}
/>



<input
name="lieuNaissance"
placeholder="Lieu naissance"
className="input input-bordered"
onChange={handleChange}
/>



<select
name="sexe"
className="input input-bordered"
onChange={handleChange}
>

<option value="">
Sexe
</option>

<option value="M">
Masculin
</option>

<option value="F">
Féminin
</option>

</select>



<input
name="nationalite"
placeholder="Nationalité"
className="input input-bordered"
onChange={handleChange}
/>




<input
name="telephone"
placeholder="Téléphone"
className="input input-bordered"
onChange={handleChange}
/>



<input
name="telephoneSecondaire"
placeholder="Téléphone secondaire"
className="input input-bordered"
onChange={handleChange}
/>




<input
name="email"
placeholder="Email"
className="input input-bordered"
onChange={handleChange}
/>



<input
name="adresse"
placeholder="Adresse"
className="input input-bordered"
onChange={handleChange}
/>




<input
name="contactUrgenceNom"
placeholder="Contact urgence"
className="input input-bordered"
onChange={handleChange}
/>



<input
name="contactUrgenceTelephone"
placeholder="Téléphone urgence"
className="input input-bordered"
onChange={handleChange}
/>




<input
type="date"
name="dateEmbauche"
className="input input-bordered"
onChange={handleChange}
/>



<input
type="date"
name="dateFinContrat"
className="input input-bordered"
onChange={handleChange}
/>






<select
name="role"
className="input input-bordered"
onChange={handleChange}
>

<option value="">
Choisir un rôle
</option>

{
roles.map(role=>(

<option
key={role.id}
value={role.nom}
>
{role.nom}
</option>

))
}

</select>


<button
className="col-span-2 bg-[#054861] text-white py-2 rounded-lg"
>

Enregistrer

</button>



</form>

);


}