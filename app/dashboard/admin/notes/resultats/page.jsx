"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";

import {
  Eye,
  Download,
  Printer,
  Search,
  X,
  GraduationCap,
  Award,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

// =========================================================
// STYLES APPRECIATIONS
// =========================================================

const STATUT_STYLES = {
  "Très Bien":
    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Bien:
    "bg-teal-50 text-teal-700 ring-teal-200",
  "Assez Bien":
    "bg-sky-50 text-sky-700 ring-sky-200",
  Passable:
    "bg-amber-50 text-amber-700 ring-amber-200",
  Insuffisant:
    "bg-rose-50 text-rose-700 ring-rose-200",
};

// =========================================================
// BADGE APPRECIATION
// =========================================================

function AppreciationBadge({ appreciation }) {
  const style =
    STATUT_STYLES[appreciation] ||
    "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-2.5
        py-1
        text-[11px]
        font-semibold
        ring-1
        ring-inset
        ${style}
      `}
    >
      {appreciation || "—"}
    </span>
  );
}

// =========================================================
// MODAL BULLETIN
// =========================================================

function ModalApercu({ resultat, onClose }) {
  const matieres = resultat?.matieres || [];

  const formatNote = (value) => {
    if (
      value == null ||
      Number.isNaN(Number(value))
    ) {
      return "0.00";
    }

    return Number(value).toFixed(2);
  };

  const formatPoints = (value) => {
    if (
      value == null ||
      Number.isNaN(Number(value))
    ) {
      return "0.00";
    }

    return Number(value).toFixed(2);
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-[#101B33]/70
        p-3
        backdrop-blur-sm
      "
      onClick={onClose}
    >
      <div
        className="
          flex
          max-h-[94vh]
          w-full
          max-w-4xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            shrink-0
            border-b
            border-[#DEDCD0]
            bg-white
            px-4
            py-4
            sm:px-6
          "
        >

          <div className="flex items-start justify-between gap-4">

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-[#182746]
                    text-[#E4B655]
                  "
                >
                  <GraduationCap size={18} />
                </div>

                <div>

                  <h2
                    className="
                      font-display
                      text-base
                      font-bold
                      text-[#101B33]
                      sm:text-lg
                    "
                  >
                    Bulletin scolaire
                  </h2>

                  <p className="text-[11px] text-[#5B6478]">
                    {resultat.anneeScolaire ||
                      "Année scolaire"}
                    {" · "}
                    {resultat.periode || "Période"}
                  </p>

                </div>

              </div>

            </div>

            <button
              onClick={onClose}
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                text-[#5B6478]
                transition
                hover:bg-slate-100
                hover:text-[#101B33]
              "
              title="Fermer"
            >
              <X size={18} />
            </button>

          </div>

          {/* INFOS ELEVE */}

          <div
            className="
              mt-4
              grid
              grid-cols-2
              gap-2
              sm:grid-cols-4
            "
          >

            <InfoBox
              label="Élève"
              value={`${resultat.prenom || ""} ${
                resultat.nom || ""
              }`}
            />

            <InfoBox
              label="Matricule"
              value={resultat.matricule || "—"}
            />

            <InfoBox
              label="Classe"
              value={resultat.classeNom || "—"}
            />

            <InfoBox
              label="Niveau"
              value={resultat.niveauNom || "—"}
            />

          </div>

        </div>

        {/* =================================================
            CONTENU
        ================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto">

          {/* TABLEAU MATIERES */}

          <div className="px-4 py-4 sm:px-6">

            <div className="mb-3 flex items-center justify-between">

              <div>

                <h3
                  className="
                    font-display
                    text-sm
                    font-bold
                    text-[#101B33]
                  "
                >
                  Résultats par matière
                </h3>

                <p className="mt-0.5 text-[11px] text-[#5B6478]">
                  Détail des notes et coefficients
                </p>

              </div>

              <span
                className="
                  rounded-full
                  bg-[#ECEAE2]
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  text-[#5B6478]
                "
              >
                {matieres.length} matière
                {matieres.length > 1 ? "s" : ""}
              </span>

            </div>

            <div className="overflow-hidden rounded-xl border border-[#DEDCD0]">

              <div className="overflow-x-auto">

                <table
                  className="
                    w-full
                    min-w-[680px]
                    text-xs
                  "
                >

                  <thead>

                    <tr className="bg-[#F6F5F0]">

                      {[
                        ["Matière", "text-left"],
                        ["Sous-groupe", "text-left"],
                        ["Classe", "text-center"],
                        ["Examen", "text-center"],
                        ["Moyenne", "text-center"],
                        ["Coef.", "text-center"],
                        ["Points", "text-right"],
                      ].map(([label, align]) => (
                        <th
                          key={label}
                          className={`
                            px-3
                            py-2.5
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-wider
                            text-[#5B6478]
                            ${align}
                          `}
                        >
                          {label}
                        </th>
                      ))}

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-[#ECEAE2]">

                    {matieres.length === 0 ? (

                      <tr>

                        <td
                          colSpan={7}
                          className="
                            px-3
                            py-10
                            text-center
                            text-xs
                            text-[#8A93A5]
                          "
                        >
                          Aucune matière disponible
                        </td>

                      </tr>

                    ) : (

                      matieres.map(
                        (matiere, index) => (

                          <tr
                            key={`
                              ${matiere.matiereId}-
                              ${matiere.sousGroupeId || "none"}-
                              ${index}
                            `}
                            className="
                              transition
                              hover:bg-[#FAFAF7]
                            "
                          >

                            <td
                              className="
                                px-3
                                py-2.5
                                font-semibold
                                text-[#1B2333]
                              "
                            >
                              {matiere.matiereNom || "—"}
                            </td>

                            <td
                              className="
                                px-3
                                py-2.5
                                text-[#5B6478]
                              "
                            >
                              {matiere.sousGroupeNom || "—"}
                            </td>

                            <td className="px-3 py-2.5 text-center text-[#1B2333]">
                              {formatNote(
                                matiere.noteClasse
                              )}
                            </td>

                            <td className="px-3 py-2.5 text-center text-[#1B2333]">
                              {formatNote(
                                matiere.noteExamen
                              )}
                            </td>

                            <td
                              className="
                                px-3
                                py-2.5
                                text-center
                                font-bold
                                text-[#101B33]
                              "
                            >
                              {formatNote(
                                matiere.moyenne
                              )}
                            </td>

                            <td
                              className="
                                px-3
                                py-2.5
                                text-center
                                font-semibold
                                text-[#5B6478]
                              "
                            >
                              {matiere.coefficient ??
                                "—"}
                            </td>

                            <td
                              className="
                                px-3
                                py-2.5
                                text-right
                                font-bold
                                text-[#101B33]
                              "
                            >
                              {formatPoints(
                                matiere.points
                              )}
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                  <tfoot>

                    <tr
                      className="
                        border-t-2
                        border-[#DEDCD0]
                        bg-[#F6F5F0]
                      "
                    >

                      <td
                        colSpan={5}
                        className="
                          px-3
                          py-3
                          text-right
                          text-[11px]
                          font-bold
                          uppercase
                          tracking-wide
                          text-[#5B6478]
                        "
                      >
                        Totaux
                      </td>

                      <td
                        className="
                          px-3
                          py-3
                          text-center
                          text-xs
                          font-bold
                          text-[#101B33]
                        "
                      >
                        {resultat.totalCoefficients ??
                          "—"}
                      </td>

                      <td
                        className="
                          px-3
                          py-3
                          text-right
                          text-xs
                          font-bold
                          text-[#101B33]
                        "
                      >
                        {formatPoints(
                          resultat.totalPoints
                        )}
                      </td>

                    </tr>

                  </tfoot>

                </table>

              </div>

            </div>

          </div>

          {/* =================================================
              MOYENNE / RANG / APPRECIATION
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              gap-3
              px-4
              pb-4
              sm:grid-cols-3
              sm:px-6
            "
          >

            {/* MOYENNE */}

            <StatCard
              icon={<TrendingUp size={17} />}
              label="Moyenne générale"
              value={
                resultat.moyenneGenerale != null
                  ? Number(
                      resultat.moyenneGenerale
                    ).toFixed(2)
                  : "—"
              }
              suffix="/20"
              variant="gold"
            />

            {/* RANG */}

            <StatCard
              icon={<Award size={17} />}
              label="Rang"
              value={
                resultat.rang
                  ? `${resultat.rang}ᵉ`
                  : "—"
              }
              suffix="dans la classe"
              variant="navy"
            />

            {/* APPRECIATION */}

            <div
              className="
                rounded-xl
                border
                border-[#DEDCD0]
                bg-white
                p-4
              "
            >

              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-[#8A93A5]
                "
              >
                Appréciation
              </p>

              <div className="mt-3">

                <AppreciationBadge
                  appreciation={
                    resultat.appreciation
                  }
                />

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            flex
            shrink-0
            flex-col-reverse
            gap-2
            border-t
            border-[#DEDCD0]
            bg-[#F8F7F2]
            px-4
            py-3
            sm:flex-row
            sm:justify-end
            sm:px-6
          "
        >

          <button
            onClick={onClose}
            className="
              rounded-lg
              border
              border-[#DEDCD0]
              bg-white
              px-4
              py-2
              text-xs
              font-semibold
              text-[#5B6478]
              transition
              hover:bg-slate-50
            "
          >
            Fermer
          </button>

          <button
            onClick={() => window.print()}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-[#101B33]
              px-4
              py-2
              text-xs
              font-semibold
              text-white
              transition
              hover:bg-[#182746]
            "
          >
            <Printer size={14} />
            Imprimer
          </button>

        </div>

      </div>
    </div>
  );
}

// =========================================================
// INFO BOX
// =========================================================

function InfoBox({ label, value }) {
  return (
    <div
      className="
        min-w-0
        rounded-lg
        bg-[#F6F5F0]
        px-3
        py-2
      "
    >
      <p
        className="
          text-[8px]
          font-bold
          uppercase
          tracking-wider
          text-[#8A93A5]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-0.5
          truncate
          text-[11px]
          font-semibold
          text-[#1B2333]
        "
      >
        {value}
      </p>
    </div>
  );
}

// =========================================================
// STAT CARD
// =========================================================

function StatCard({
  icon,
  label,
  value,
  suffix,
  variant,
}) {
  const styles = {
    gold: {
      box: "border-[#E8D8AF] bg-[#FBF7EA]",
      icon: "bg-[#C89B3C] text-white",
      value: "text-[#8B681E]",
    },

    navy: {
      box: "border-[#D8DEEA] bg-[#F5F7FB]",
      icon: "bg-[#101B33] text-white",
      value: "text-[#101B33]",
    },
  };

  const s = styles[variant];

  return (
    <div
      className={`
        rounded-xl
        border
        p-4
        ${s.box}
      `}
    >

      <div className="flex items-center gap-2">

        <div
          className={`
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-lg
            ${s.icon}
          `}
        >
          {icon}
        </div>

        <p
          className="
            text-[9px]
            font-bold
            uppercase
            tracking-wider
            text-[#8A93A5]
          "
        >
          {label}
        </p>

      </div>

      <div className="mt-2 flex items-baseline gap-1">

        <span
          className={`
            font-mono
            text-2xl
            font-bold
            ${s.value}
          `}
        >
          {value}
        </span>

        <span
          className="
            text-[9px]
            text-[#8A93A5]
          "
        >
          {suffix}
        </span>

      </div>

    </div>
  );
}

// =========================================================
// PAGE RESULTATS
// =========================================================

export default function ResultatsPage() {
  const { user } = useAuth();

  const ecoleId = user?.ecole?.id;

  const [cycles, setCycles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [resultats, setResultats] = useState([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [apercu, setApercu] = useState(null);
  const [loadingBulletinId, setLoadingBulletinId] =
    useState(null);

  const [filtres, setFiltres] = useState({
    cycleId: "",
    classeId: "",
    anneeScolaireId: "",
    periode: "",
  });

  // =========================================================
  // INIT
  // =========================================================

  useEffect(() => {
    if (!ecoleId) return;

    api
      .get(`/cycles/ecole/${ecoleId}`)
      .then((r) => setCycles(r.data || []));

    api
      .get(`/classes/ecole/${ecoleId}`)
      .then((r) => setClasses(r.data || []));

    api
      .get(`/annees/ecole/${ecoleId}`)
      .then((r) => {
        setAnnees(r.data || []);

        const active = (r.data || []).find(
          (a) => a.active
        );

        if (active) {
          setFiltres((prev) => ({
            ...prev,
            anneeScolaireId:
              active.id.toString(),
          }));
        }
      });
  }, [ecoleId]);

  // =========================================================
  // CLASSES PAR CYCLE
  // =========================================================

  const classesDuCycle = useMemo(() => {
    if (!filtres.cycleId) return classes;

    return classes.filter(
      (c) =>
        c.niveau?.cycle?.id ===
        Number(filtres.cycleId)
    );
  }, [classes, filtres.cycleId]);

  // =========================================================
  // FILTRES
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFiltres((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "cycleId"
        ? { classeId: "" }
        : {}),
    }));
  };

  // =========================================================
  // CHARGEMENT RESULTATS
  // =========================================================

  const loadResultats = async () => {
    const {
      classeId,
      anneeScolaireId,
      periode,
    } = filtres;

    setLoading(true);

    try {
      if (classeId) {
        const res = await api.get(
          `/resultats/classe/${classeId}`,
          {
            params: {
              anneeScolaireId,
              periode,
            },
          }
        );

        setResultats(res.data || []);
      } else if (
        ecoleId &&
        anneeScolaireId &&
        periode
      ) {
        const res = await api.get(
          `/resultats/ecole/${ecoleId}`,
          {
            params: {
              anneeScolaireId,
              periode,
            },
          }
        );

        setResultats(res.data || []);
      } else {
        setResultats([]);
      }
    } catch (err) {
      console.error(err);
      setResultats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      filtres.anneeScolaireId &&
      filtres.periode
    ) {
      loadResultats();
    } else {
      setResultats([]);
    }
  }, [
    filtres.classeId,
    filtres.anneeScolaireId,
    filtres.periode,
    ecoleId,
  ]);

  // =========================================================
  // TRI / RECHERCHE
  // =========================================================

  const resultatsTries = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...resultats]
      .filter((r) => {
        const nomComplet =
          `${r.nom} ${r.prenom} ${r.matricule}`.toLowerCase();

        return !q || nomComplet.includes(q);
      })
      .sort((a, b) => {
        const cycleCompare =
          (a.cycleNom || "").localeCompare(
            b.cycleNom || ""
          );

        if (cycleCompare !== 0) {
          return cycleCompare;
        }

        const classeCompare =
          (a.classeNom || "").localeCompare(
            b.classeNom || ""
          );

        if (classeCompare !== 0) {
          return classeCompare;
        }

        return (
          (a.rang || 999) -
          (b.rang || 999)
        );
      });
  }, [resultats, search]);

  // =========================================================
  // BULLETIN
  // =========================================================

  const ouvrirBulletin = async (resultat) => {
    setLoadingBulletinId(
      resultat.inscriptionId
    );

    try {
      const res = await api.get(
        `/resultats/eleve/${resultat.inscriptionId}`,
        {
          params: {
            periode: filtres.periode,
          },
        }
      );

      setApercu(res.data);
    } catch (err) {
      console.error(
        "❌ ERREUR CHARGEMENT BULLETIN"
      );
      console.error(
        "Status :",
        err.response?.status
      );
      console.error(
        "Data :",
        err.response?.data
      );
      console.error(
        "Message :",
        err.message
      );

      alert(
        "Erreur lors du chargement du bulletin."
      );
    } finally {
      setLoadingBulletinId(null);
    }
  };

  // =========================================================
  // PDF
  // =========================================================

  const telechargerPdf = async (resultat) => {
    try {
      const res = await api.get(
        "/bulletins/generate",
        {
          params: {
            inscriptionId:
              resultat.inscriptionId,

            classeId: classes.find(
              (c) =>
                c.nomComplet ===
                resultat.classeNom
            )?.id,

            anneeId:
              filtres.anneeScolaireId,

            periode: filtres.periode,
          },

          responseType: "blob",
        }
      );

      const url =
        window.URL.createObjectURL(
          new Blob([res.data])
        );

      const a =
        document.createElement("a");

      a.href = url;
      a.download = `bulletin_${resultat.matricule}.pdf`;

      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);

      alert(
        "Erreur lors du téléchargement du PDF"
      );
    }
  };

  // =========================================================
  // IMPRESSION
  // =========================================================

  const imprimerTableau = () => {
    window.print();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-5 pb-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          print:hidden
        "
      >

        <div>

          <div className="flex items-center gap-2">

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-[#101B33]
                text-[#E4B655]
              "
            >
              <Award size={18} />
            </div>

            <h1
              className="
                font-display
                text-2xl
                font-bold
                tracking-tight
                text-[#101B33]
              "
            >
              Résultats
            </h1>

          </div>

          <p
            className="
              mt-1
              pl-11
              text-xs
              text-[#5B6478]
              sm:text-sm
            "
          >
            Moyennes générales et appréciations
            par élève.
          </p>

        </div>

        <button
          onClick={imprimerTableau}
          disabled={
            resultatsTries.length === 0
          }
          className="
            inline-flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[#101B33]
            px-4
            py-2.5
            text-xs
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-[#182746]
            disabled:cursor-not-allowed
            disabled:opacity-40
            sm:w-auto
          "
        >
          <Printer size={15} />
          Imprimer la liste
        </button>

      </div>

      {/* =====================================================
          FILTRES
      ===================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-[#DEDCD0]
          bg-white
          p-3
          shadow-sm
          sm:p-4
          print:hidden
        "
      >

        <div className="mb-3 flex items-center justify-between">

          <div>

            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[1.2px]
                text-[#8A93A5]
              "
            >
              Filtres
            </p>

            <p className="mt-0.5 text-xs text-[#5B6478]">
              Sélectionnez une période pour
              afficher les résultats.
            </p>

          </div>

        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-2
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >

          <select
            name="cycleId"
            value={filtres.cycleId}
            onChange={handleChange}
            className="
              h-10
              w-full
              rounded-lg
              border
              border-[#DEDCD0]
              bg-[#FAFAF7]
              px-3
              text-xs
              font-medium
              text-[#1B2333]
              outline-none
              transition
              focus:border-[#C89B3C]
              focus:ring-2
              focus:ring-[#C89B3C]/10
            "
          >
            <option value="">
              Tous les cycles
            </option>

            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>

          <select
            name="classeId"
            value={filtres.classeId}
            onChange={handleChange}
            className="
              h-10
              w-full
              rounded-lg
              border
              border-[#DEDCD0]
              bg-[#FAFAF7]
              px-3
              text-xs
              font-medium
              text-[#1B2333]
              outline-none
              transition
              focus:border-[#C89B3C]
              focus:ring-2
              focus:ring-[#C89B3C]/10
            "
          >
            <option value="">
              Toutes les classes
            </option>

            {classesDuCycle.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomComplet}
              </option>
            ))}
          </select>

          <select
            name="anneeScolaireId"
            value={filtres.anneeScolaireId}
            onChange={handleChange}
            className="
              h-10
              w-full
              rounded-lg
              border
              border-[#DEDCD0]
              bg-[#FAFAF7]
              px-3
              text-xs
              font-medium
              text-[#1B2333]
              outline-none
              transition
              focus:border-[#C89B3C]
              focus:ring-2
              focus:ring-[#C89B3C]/10
            "
          >
            <option value="">
              Année scolaire
            </option>

            {annees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>

          <select
            name="periode"
            value={filtres.periode}
            onChange={handleChange}
            className="
              h-10
              w-full
              rounded-lg
              border
              border-[#DEDCD0]
              bg-[#FAFAF7]
              px-3
              text-xs
              font-medium
              text-[#1B2333]
              outline-none
              transition
              focus:border-[#C89B3C]
              focus:ring-2
              focus:ring-[#C89B3C]/10
            "
          >
            <option value="">
              Période
            </option>

            <option value="Trimestre 1">
              Trimestre 1
            </option>

            <option value="Trimestre 2">
              Trimestre 2
            </option>

            <option value="Trimestre 3">
              Trimestre 3
            </option>
          </select>

        </div>

        {/* RECHERCHE */}

        <div className="relative mt-2">

          <Search
            size={15}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-[#8A93A5]
            "
          />

          <input
            type="text"
            placeholder="Rechercher un élève, matricule..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="
              h-10
              w-full
              rounded-lg
              border
              border-[#DEDCD0]
              bg-[#FAFAF7]
              py-2
              pl-9
              pr-3
              text-xs
              text-[#1B2333]
              outline-none
              transition
              placeholder:text-[#9AA2B2]
              focus:border-[#C89B3C]
              focus:ring-2
              focus:ring-[#C89B3C]/10
            "
          />

        </div>

      </div>

      {/* =====================================================
          RESULTATS DESKTOP
      ===================================================== */}

      <div
        className="
          hidden
          overflow-hidden
          rounded-2xl
          border
          border-[#DEDCD0]
          bg-white
          shadow-sm
          lg:block
          print:block
          print:border-0
          print:shadow-none
        "
      >

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead>

              <tr
                className="
                  border-b
                  border-[#DEDCD0]
                  bg-[#F8F7F2]
                "
              >

                {[
                  "Matricule",
                  "Élève",
                  "Cycle",
                  "Classe",
                  "Rang",
                  "Moyenne",
                  "Appréciation",
                  "Action",
                ].map((label) => (
                  <th
                    key={label}
                    className="
                      whitespace-nowrap
                      px-4
                      py-3
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-[#8A93A5]
                    "
                  >
                    {label}
                  </th>
                ))}

              </tr>

            </thead>

            <tbody className="divide-y divide-[#F0EFEA]">

              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="
                      px-4
                      py-14
                      text-center
                    "
                  >
                    <LoadingState />
                  </td>
                </tr>
              )}

              {!loading &&
                resultatsTries.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="
                        px-4
                        py-14
                        text-center
                      "
                    >
                      <EmptyState />
                    </td>
                  </tr>
                )}

              {!loading &&
                resultatsTries.map((r) => (
                  <tr
                    key={r.inscriptionId}
                    className="
                      transition
                      hover:bg-[#FAFAF7]
                    "
                  >

                    <td className="px-4 py-3 text-xs font-mono text-[#5B6478]">
                      {r.matricule || "—"}
                    </td>

                    <td className="px-4 py-3">

                      <div className="flex items-center gap-2.5">

                        <div
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-[#E7E3F8]
                            text-[10px]
                            font-bold
                            text-[#6E5DC6]
                          "
                        >
                          {`${r.prenom?.[0] || ""}${
                            r.nom?.[0] || ""
                          }`.toUpperCase()}
                        </div>

                        <span className="text-xs font-semibold text-[#1B2333]">
                          {r.prenom} {r.nom}
                        </span>

                      </div>

                    </td>

                    <td className="px-4 py-3 text-xs text-[#5B6478]">
                      {r.cycleNom || "—"}
                    </td>

                    <td className="px-4 py-3 text-xs font-medium text-[#1B2333]">
                      {r.classeNom || "—"}
                    </td>

                    <td className="px-4 py-3 text-center">

                      <span
                        className="
                          inline-flex
                          min-w-7
                          items-center
                          justify-center
                          rounded-md
                          bg-[#F8F7F2]
                          px-2
                          py-1
                          font-mono
                          text-xs
                          font-bold
                          text-[#101B33]
                        "
                      >
                        {r.rang || "—"}
                      </span>

                    </td>

                    <td className="px-4 py-3 text-center">

                      <span
                        className="
                          font-mono
                          text-sm
                          font-bold
                          text-[#101B33]
                        "
                      >
                        {r.moyenneGenerale != null
                          ? Number(
                              r.moyenneGenerale
                            ).toFixed(2)
                          : "—"}
                      </span>

                    </td>

                    <td className="px-4 py-3">

                      <AppreciationBadge
                        appreciation={
                          r.appreciation
                        }
                      />

                    </td>

                    <td className="px-4 py-3 text-right print:hidden">

                      <ActionButtons
                        resultat={r}
                        loadingBulletinId={
                          loadingBulletinId
                        }
                        onView={
                          ouvrirBulletin
                        }
                        onDownload={
                          telechargerPdf
                        }
                      />

                    </td>

                  </tr>
                ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          RESULTATS MOBILE
      ===================================================== */}

      <div className="space-y-2 lg:hidden print:hidden">

        {loading && <LoadingState />}

        {!loading &&
          resultatsTries.length === 0 && (
            <EmptyState />
          )}

        {!loading &&
          resultatsTries.map((r) => (

            <div
              key={r.inscriptionId}
              className="
                rounded-2xl
                border
                border-[#DEDCD0]
                bg-white
                p-3
                shadow-sm
              "
            >

              {/* HEADER CARTE */}

              <div className="flex items-start justify-between gap-3">

                <div className="flex min-w-0 items-center gap-2.5">

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#E7E3F8]
                      text-xs
                      font-bold
                      text-[#6E5DC6]
                    "
                  >
                    {`${r.prenom?.[0] || ""}${
                      r.nom?.[0] || ""
                    }`.toUpperCase()}
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-bold text-[#101B33]">
                      {r.prenom} {r.nom}
                    </p>

                    <p className="mt-0.5 truncate font-mono text-[10px] text-[#8A93A5]">
                      {r.matricule || "Sans matricule"}
                    </p>

                  </div>

                </div>

                <div
                  className="
                    shrink-0
                    rounded-lg
                    bg-[#FBF7EA]
                    px-2.5
                    py-1.5
                    text-center
                  "
                >

                  <p className="font-mono text-base font-bold text-[#8B681E]">
                    {r.moyenneGenerale != null
                      ? Number(
                          r.moyenneGenerale
                        ).toFixed(2)
                      : "—"}
                  </p>

                  <p className="text-[8px] text-[#9B8144]">
                    /20
                  </p>

                </div>

              </div>

              {/* INFOS */}

              <div
                className="
                  mt-3
                  grid
                  grid-cols-2
                  gap-2
                "
              >

                <MobileInfo
                  label="Cycle"
                  value={r.cycleNom || "—"}
                />

                <MobileInfo
                  label="Classe"
                  value={r.classeNom || "—"}
                />

                <MobileInfo
                  label="Rang"
                  value={
                    r.rang
                      ? `${r.rang}ᵉ`
                      : "—"
                  }
                />

                <div
                  className="
                    rounded-lg
                    bg-[#F8F7F2]
                    px-2.5
                    py-2
                  "
                >

                  <p className="text-[8px] font-bold uppercase tracking-wide text-[#8A93A5]">
                    Appréciation
                  </p>

                  <div className="mt-1.5">
                    <AppreciationBadge
                      appreciation={
                        r.appreciation
                      }
                    />
                  </div>

                </div>

              </div>

              {/* ACTIONS */}

              <div
                className="
                  mt-3
                  flex
                  gap-2
                  border-t
                  border-[#F0EFEA]
                  pt-3
                "
              >

                <button
                  onClick={() =>
                    ouvrirBulletin(r)
                  }
                  disabled={
                    loadingBulletinId ===
                    r.inscriptionId
                  }
                  className="
                    flex
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    bg-[#101B33]
                    px-3
                    py-2
                    text-[11px]
                    font-semibold
                    text-white
                    transition
                    hover:bg-[#182746]
                    disabled:opacity-50
                  "
                >

                  {loadingBulletinId ===
                  r.inscriptionId ? (
                    <span
                      className="
                        h-3.5
                        w-3.5
                        animate-spin
                        rounded-full
                        border-2
                        border-white/30
                        border-t-white
                      "
                    />
                  ) : (
                    <Eye size={14} />
                  )}

                  Voir le bulletin

                </button>

                <button
                  onClick={() =>
                    telechargerPdf(r)
                  }
                  className="
                    flex
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-[#DEDCD0]
                    bg-white
                    px-3
                    text-[#101B33]
                    transition
                    hover:bg-[#F8F7F2]
                  "
                  title="Télécharger PDF"
                >
                  <Download size={15} />
                </button>

              </div>

            </div>

          ))}

      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {apercu && (
        <ModalApercu
          resultat={apercu}
          onClose={() => setApercu(null)}
        />
      )}

    </div>
  );
}

// =========================================================
// ACTION BUTTONS
// =========================================================

function ActionButtons({
  resultat,
  loadingBulletinId,
  onView,
  onDownload,
}) {
  const loading =
    loadingBulletinId ===
    resultat.inscriptionId;

  return (
    <div className="flex justify-end gap-1.5">

      <button
        onClick={() => onView(resultat)}
        disabled={loading}
        title="Voir le bulletin"
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          bg-[#F1F2F5]
          text-[#5B6478]
          transition
          hover:bg-[#E7E3F8]
          hover:text-[#6E5DC6]
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >

        {loading ? (
          <span
            className="
              h-3.5
              w-3.5
              animate-spin
              rounded-full
              border-2
              border-slate-300
              border-t-[#101B33]
            "
          />
        ) : (
          <Eye size={14} />
        )}

      </button>

      <button
        onClick={() => onDownload(resultat)}
        title="Télécharger PDF"
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          bg-[#FBF7EA]
          text-[#9B7428]
          transition
          hover:bg-[#F3E7C7]
        "
      >
        <Download size={14} />
      </button>

      <button
        onClick={() => onView(resultat)}
        title="Ouvrir"
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          text-[#8A93A5]
          transition
          hover:bg-[#F8F7F2]
          hover:text-[#101B33]
        "
      >
        <ChevronRight size={15} />
      </button>

    </div>
  );
}

// =========================================================
// MOBILE INFO
// =========================================================

function MobileInfo({ label, value }) {
  return (
    <div
      className="
        rounded-lg
        bg-[#F8F7F2]
        px-2.5
        py-2
      "
    >

      <p
        className="
          text-[8px]
          font-bold
          uppercase
          tracking-wide
          text-[#8A93A5]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-0.5
          truncate
          text-[11px]
          font-semibold
          text-[#1B2333]
        "
      >
        {value}
      </p>

    </div>
  );
}

// =========================================================
// LOADING
// =========================================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">

      <div
        className="
          h-7
          w-7
          animate-spin
          rounded-full
          border-2
          border-[#DEDCD0]
          border-t-[#C89B3C]
        "
      />

      <p className="mt-3 text-xs text-[#8A93A5]">
        Chargement des résultats...
      </p>

    </div>
  );
}

// =========================================================
// EMPTY
// =========================================================

function EmptyState() {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        rounded-2xl
        border
        border-dashed
        border-[#DEDCD0]
        bg-white
        px-5
        py-12
        text-center
      "
    >

      <div
        className="
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-full
          bg-[#F8F7F2]
          text-[#8A93A5]
        "
      >
        <GraduationCap size={22} />
      </div>

      <p className="mt-3 text-sm font-semibold text-[#1B2333]">
        Aucun résultat
      </p>

      <p className="mt-1 max-w-xs text-xs text-[#8A93A5]">
        Choisissez une année scolaire et une
        période pour afficher les résultats.
      </p>

    </div>
  );
}