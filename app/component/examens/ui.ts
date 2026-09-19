// Petits utilitaires de classes partagés pour rester cohérent visuellement
// sur tout le module. Palette : ardoise (neutre) + indigo (accent unique).

export const ui = {
  card: "rounded-lg border border-slate-200 bg-white p-5 shadow-sm",
  label: "block text-sm font-medium text-slate-700 mb-1",
  input:
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
  select:
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
  btnPrimary:
    "inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50",
  btnDanger:
    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50",
  table: "w-full border-collapse text-sm",
  th: "border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-500",
  td: "border-b border-slate-100 px-3 py-2 text-slate-800",
  badge: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
  badgeOk: "bg-emerald-50 text-emerald-700",
  badgeWarn: "bg-amber-50 text-amber-700",
  errorText: "text-sm text-red-600",
};
