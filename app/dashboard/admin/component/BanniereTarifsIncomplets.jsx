"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import Link from "next/link";

export function BanniereTarifsIncomplets() {
  const { user } = useAuth();
  const ecoleId = user?.ecole?.id;
  const [configures, setConfigures] = useState(true);

  useEffect(() => {
    if (!ecoleId) return;
    fetch(`http://localhost:8080/api/ecoles/ecole/${ecoleId}/tarifs-configures`)
      .then(r => r.json())
      .then(setConfigures)
      .catch(() => setConfigures(true));
  }, [ecoleId]);

  if (configures) return null;

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-inset ring-amber-100">
      <span>⚠️ Certains tarifs ne sont pas encore configurés pour cette année scolaire.</span>
      <Link href="/dashboard/admin/tarif" className="font-semibold underline hover:text-amber-900">
        Configurer maintenant
      </Link>
    </div>
  );
}