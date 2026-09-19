import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// Ajouter automatiquement le JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token && token !== "null") {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Extrait un message lisible depuis une erreur Axios
export function messageErreur(err) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;

    if (data?.message) {
      return data.message;
    }

    if (err.message) {
      return err.message;
    }
  }

  return "Une erreur inattendue est survenue";
}