const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ============================================================
   UTILITAIRES
============================================================ */

function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("token");
}

function buildUrl(endpoint) {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL n'est pas configurée."
    );
  }

  return `${API_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
}

async function request(endpoint, options = {}) {
  const token = getToken();

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  const headers = {
    ...(isFormData
      ? {}
      : {
          "Content-Type": "application/json",
        }),

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),

    ...(options.headers || {}),
  };

  const url = buildUrl(endpoint);

  console.log("API REQUEST:", {
    method: options.method || "GET",
    url,
  });

  const response = await fetch(url, {
    ...options,
    headers,
  });

  /* ==========================================================
     GESTION DES ERREURS
  ========================================================== */

  if (!response.ok) {
    let message = "Une erreur est survenue.";

    try {
      const contentType =
        response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        const data = await response.json();

        console.error("Erreur API :", {
          url,
          status: response.status,
          data,
        });

        message =
          data?.message ||
          data?.error ||
          data?.detail ||
          message;
      } else {
        const text = await response.text();

        console.error("Erreur API :", {
          url,
          status: response.status,
          response: text,
        });

        if (text) {
          message = text;
        }
      }
    } catch (error) {
      console.error(
        "Impossible de lire la réponse API :",
        error
      );
    }

    if (response.status === 401) {
      message =
        message ||
        "Votre session a expiré. Veuillez vous reconnecter.";
    }

    if (response.status === 403) {
      message =
        message ||
        "Vous n'avez pas les droits nécessaires.";
    }

    if (response.status === 404) {
      message =
        message ||
        "Ressource introuvable.";
    }

    if (response.status >= 500) {
      message =
        message ||
        "Une erreur est survenue sur le serveur.";
    }

    const error = new Error(message);

    error.status = response.status;
    error.url = url;

    throw error;
  }

  /* ==========================================================
     PAS DE CONTENU
  ========================================================== */

  if (response.status === 204) {
    return null;
  }

  /* ==========================================================
     CONTENU JSON / TEXTE
  ========================================================== */

  const contentType =
    response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

/* ============================================================
   EXAMENS
============================================================ */

export async function getExamens(
  ecoleId,
  anneeScolaireId
) {
  if (!ecoleId) {
    throw new Error("Identifiant de l'école manquant.");
  }

  if (!anneeScolaireId) {
    throw new Error(
      "Identifiant de l'année scolaire manquant."
    );
  }

  return request(
    `/examens/ecole/${ecoleId}/annee/${anneeScolaireId}`
  );
}

export async function getExamen(id) {
  if (!id) {
    throw new Error("Identifiant de l'examen manquant.");
  }

  return request(`/examens/${id}`);
}

export async function createExamen(data) {
  return request("/examens", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateExamen(id, data) {
  if (!id) {
    throw new Error("Identifiant de l'examen manquant.");
  }

  return request(`/examens/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteExamen(id) {
  if (!id) {
    throw new Error("Identifiant de l'examen manquant.");
  }

  return request(`/examens/${id}`, {
    method: "DELETE",
  });
}

/* ============================================================
   CRÉNEAUX
============================================================ */

export async function getCreneaux(examenId) {
  if (!examenId) {
    throw new Error("Identifiant de l'examen manquant.");
  }

  return request(
    `/creneaux/examen/${examenId}`
  );
}

export async function createCreneau(data) {
  return request("/creneaux", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCreneau(id, data) {
  if (!id) {
    throw new Error("Identifiant du créneau manquant.");
  }

  return request(`/creneaux/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCreneau(id) {
  if (!id) {
    throw new Error("Identifiant du créneau manquant.");
  }

  return request(`/creneaux/${id}`, {
    method: "DELETE",
  });
}

/* ============================================================
   ÉPREUVES
============================================================ */

export async function getEpreuves(examenId) {
  if (!examenId) {
    throw new Error("Identifiant de l'examen manquant.");
  }

  return request(
    `/epreuves/examen/${examenId}`
  );
}

export async function createEpreuve(data) {
  return request("/epreuves", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEpreuve(id, data) {
  if (!id) {
    throw new Error("Identifiant de l'épreuve manquant.");
  }

  return request(`/epreuves/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteEpreuve(id) {
  if (!id) {
    throw new Error("Identifiant de l'épreuve manquant.");
  }

  return request(`/epreuves/${id}`, {
    method: "DELETE",
  });
}

/* ============================================================
   SALLES
============================================================ */

export async function getSalles(ecoleId) {
  if (!ecoleId) {
    throw new Error("Identifiant de l'école manquant.");
  }

  return request(
    `/salles/ecole/${ecoleId}`
  );
}

export async function createSalle(data) {
  return request("/salles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSalle(id, data) {
  if (!id) {
    throw new Error("Identifiant de la salle manquant.");
  }

  return request(`/salles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSalle(id) {
  if (!id) {
    throw new Error("Identifiant de la salle manquant.");
  }

  return request(`/salles/${id}`, {
    method: "DELETE",
  });
}

export async function toggleSalle(id) {
  if (!id) {
    throw new Error("Identifiant de la salle manquant.");
  }

  return request(`/salles/${id}/toggle`, {
    method: "PATCH",
  });
}

/* ============================================================
   RÉPARTITION
============================================================ */

export async function getApercuRepartition(
  examenId
) {
  if (!examenId) {
    throw new Error("Identifiant de l'examen manquant.");
  }

  return request(
    `/examens/${examenId}/repartition/apercu`
  );
}

export async function genererRepartition(
  examenId
) {
  if (!examenId) {
    throw new Error("Identifiant de l'examen manquant.");
  }

  return request(
    `/examens/${examenId}/repartition`,
    {
      method: "POST",
    }
  );
}

export async function getRepartition(
  examenId
) {
  if (!examenId) {
    throw new Error("Identifiant de l'examen manquant.");
  }

  return request(
    `/examens/${examenId}/repartition`
  );
}