"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import api from "../../../../lib/api";
import { Save, CalendarX, MessageSquare, CheckCircle, Clock } from "lucide-react";

export default function InfosBulletinMensuel({
  classeId,
  anneeId,
  mois,
  eleves,
  onToast,
  onError,
}) {
  const [saisies, setSaisies] = useState({});
  const [originales, setOriginales] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Les callbacks du parent ne sont pas mémoïsés : on les garde dans des refs
  // pour ne pas relancer le chargement à chaque rendu.
  const onToastRef = useRef(onToast);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onToastRef.current = onToast;
    onErrorRef.current = onError;
  });

  const charger = useCallback(async () => {
    if (!classeId || !anneeId || !mois) return;
    setLoading(true);
    try {
      const { data } = await api.get("/bulletins-mensuels/infos", {
        params: { classeId: Number(classeId), anneeId: Number(anneeId), mois },
      });
      const map = {};
      (Array.isArray(data) ? data : []).forEach((i) => {
        map[String(i.inscriptionId)] = {
          absences: i.absences ?? 0,
          observationMaitre: i.observationMaitre ?? "",
        };
      });
      setSaisies(map);
      setOriginales(map);
    } catch (e) {
      console.error("Erreur chargement infos bulletin:", e);
      setSaisies({});
      setOriginales({});
      onErrorRef.current?.("Impossible de charger les absences et observations.");
    } finally {
      setLoading(false);
    }
  }, [classeId, anneeId, mois]);

  useEffect(() => {
    charger();
  }, [charger]);

  const modifier = (inscriptionId, champ, valeur) => {
    if (champ === "absences" && valeur !== "" && Number(valeur) < 0) return;
    if (champ === "observationMaitre" && valeur.length > 500) return;

    setSaisies((prev) => ({
      ...prev,
      [String(inscriptionId)]: {
        ...(prev[String(inscriptionId)] || { absences: 0, observationMaitre: "" }),
        [champ]: valeur,
      },
    }));
  };

  const nbModifiees = useMemo(
    () =>
      Object.keys(saisies).filter((id) => {
        const a = saisies[id];
        const o = originales[id] || { absences: 0, observationMaitre: "" };
        return (
          String(a.absences ?? 0) !== String(o.absences ?? 0) ||
          (a.observationMaitre ?? "") !== (o.observationMaitre ?? "")
        );
      }).length,
    [saisies, originales]
  );

  const enregistrer = async () => {
    const infos = eleves.map((eleve) => {
      const s = saisies[String(eleve.id)] || { absences: 0, observationMaitre: "" };
      return {
        inscriptionId: eleve.id,
        absences: s.absences === "" ? 0 : Number(s.absences),
        observationMaitre: s.observationMaitre ?? "",
      };
    });

    setSubmitting(true);
    try {
      await api.put("/bulletins-mensuels/infos", { mois, infos });
      onToastRef.current?.("✓ Absences et observations enregistrées");
      await charger();
    } catch (e) {
      console.error("Erreur enregistrement infos bulletin:", e);
      onErrorRef.current?.(
        e.response?.data?.message || "Erreur lors de l'enregistrement des observations."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#DEDCD0] bg-white shadow-[0_10px_30px_rgba(16,27,51,0.05)]">
      <div className="border-b border-[#DEDCD0] bg-[#FCFBF8] px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#101B33] text-[#E4B655]">
            <MessageSquare size={17} />
          </span>
          <div>
            <h2 className="text-base font-bold text-[#101B33] sm:text-lg">
              Absences et observations
            </h2>
            <p className="mt-0.5 text-xs text-[#7A8190]">
              Mois de {mois} · {eleves.length} élève{eleves.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-5">
        {loading && (
          <div className="rounded-2xl border border-[#DEDCD0] bg-[#F8F7F2] px-4 py-10 text-center">
            <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#C89B3C] border-t-transparent" />
            <p className="text-sm font-medium text-[#7A8190]">Chargement...</p>
          </div>
        )}

        {!loading && eleves.length === 0 && (
          <p className="py-8 text-center text-sm font-semibold text-[#5B6478]">
            Aucun élève dans cette classe.
          </p>
        )}

        {!loading &&
          eleves.map((eleve, index) => {
            const s = saisies[String(eleve.id)] || { absences: 0, observationMaitre: "" };
            return (
              <div
                key={eleve.id}
                className="grid grid-cols-1 gap-3 rounded-2xl border border-[#DEDCD0] bg-white p-3.5 shadow-sm lg:grid-cols-[minmax(0,240px)_110px_minmax(0,1fr)] lg:items-start"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#101B33] font-mono text-xs font-bold text-[#E4B655]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#101B33]">
                      {eleve.nom} {eleve.prenom}
                    </p>
                    {eleve.matricule && (
                      <p className="mt-0.5 truncate font-mono text-[10px] text-[#8A91A2]">
                        {eleve.matricule}
                      </p>
                    )}
                  </div>
                </div>

                <label className="rounded-xl bg-[#F8F7F2] p-2.5">
                  <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#7A8190]">
                    <CalendarX size={12} /> Absences
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={s.absences ?? ""}
                    onChange={(e) => modifier(eleve.id, "absences", e.target.value)}
                    className="w-full rounded-lg border border-[#DEDCD0] bg-white px-2.5 py-2.5 text-center font-mono text-sm font-bold text-[#101B33] outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                  />
                </label>

                <label className="rounded-xl bg-[#F8F7F2] p-2.5">
                  <span className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[#7A8190]">
                    <span>Observation du maître (sse)</span>
                    <span className="font-mono normal-case">
                      {(s.observationMaitre ?? "").length}/500
                    </span>
                  </span>
                  <textarea
                    rows={2}
                    value={s.observationMaitre ?? ""}
                    onChange={(e) => modifier(eleve.id, "observationMaitre", e.target.value)}
                    className="w-full resize-none rounded-lg border border-[#DEDCD0] bg-white px-2.5 py-2 text-sm text-[#101B33] outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                  />
                </label>
              </div>
            );
          })}

        <div className="flex flex-col gap-3 rounded-2xl border border-[#DEDCD0] bg-[#F8F7F2] p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                nbModifiees > 0 ? "bg-[#F7E2DB] text-[#D2593F]" : "bg-[#DCEDEA] text-[#2C8C82]"
              }`}
            >
              {nbModifiees > 0 ? <Clock size={17} /> : <CheckCircle size={17} />}
            </div>
            <p className="text-sm font-bold text-[#101B33]">
              {nbModifiees === 0
                ? "Aucune modification en attente"
                : `${nbModifiees} élève${nbModifiees > 1 ? "s" : ""} modifié${nbModifiees > 1 ? "s" : ""} non enregistré${nbModifiees > 1 ? "s" : ""}`}
            </p>
          </div>

          <button
            type="button"
            onClick={enregistrer}
            disabled={submitting || loading || nbModifiees === 0}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#101B33] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#182746] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Save size={17} />
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </section>
  );
}
