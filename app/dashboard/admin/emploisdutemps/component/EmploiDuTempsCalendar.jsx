"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function EmploiDuTempsCalendar({ emploi }) {
  const events = emploi.map((cours) => ({
    id: cours.id,
    title: `${cours.matiere?.nom} - ${cours.enseignant?.nom}`,
    daysOfWeek: [convertJour(cours.jour)],
    startTime: `${String(cours.heureDebut).padStart(2, "0")}:00:00`,
    endTime: `${String(cours.heureFin).padStart(2, "0")}:00:00`,
  }));
   return (
    <div className="bg-white p-4 rounded-xl shadow">
       
      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin
        ]}
        initialView="timeGridWeek"
        weekends={false}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="18:00:00"
        locale="fr"
        events={events}
        height="auto"
      />
    </div>
  );
}

function convertJour(jour) {
  const map = {
    LUNDI: 1,
    MARDI: 2,
    MERCREDI: 3,
    JEUDI: 4,
    VENDREDI: 5,
    SAMEDI: 6,
  };

  return map[jour];
}