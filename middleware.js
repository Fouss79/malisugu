import { NextResponse } from "next/server";


const routesPermissions = {

  "/dashboard/admin/eleves": "GESTION_ELEVES",

  "/dashboard/admin/matieres": "GESTION_MATIERES",

  "/dashboard/admin/afficheclasse": "GESTION_CLASSES",

  "/dashboard/admin/enseignants": "GESTION_ENSEIGNANTS",

  "/dashboard/admin/notes": "GESTION_NOTES",

  "/dashboard/admin/presences": "GESTION_PRESENCES",

  "/dashboard/admin/finances": "GESTION_PAIEMENTS",

  "/dashboard/admin/emploisdutemps": "GESTION_EMPLOIS_DU_TEMPS",

  "/dashboard/admin/emargement": "GESTION_EMARGEMENTS",

  "/dashboard/admin/utilisateurs": "GESTION_UTILISATEURS",

  "/dashboard/admin/roles": "GESTION_ROLES",

};


export function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;
  const url = request.nextUrl;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let permissions = [];
  const permissionsCookie = request.cookies.get("permissions")?.value;

  if (permissionsCookie) {
    try {
      permissions = JSON.parse(decodeURIComponent(permissionsCookie));
    } catch (e) {
      permissions = [];
    }
  }

  // SUPER ADMIN
  if (url.pathname.startsWith("/dashboard/superadmin")) {
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Seul l'admin (ou super admin) accède à /dashboard/admin
  if (url.pathname === "/dashboard/admin") {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    return NextResponse.next(); // page racine ok, pas de permission spécifique requise
  }

  // Vérification permissions par page précise (sous-pages)
  const sortedPaths = Object.keys(routesPermissions).sort(
    (a, b) => b.length - a.length
  );

  for (const path of sortedPaths) {
    if (url.pathname.startsWith(path)) {
      const permissionRequired = routesPermissions[path];

      if (!permissions.includes(permissionRequired)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}



export const config = {

 matcher:[
   "/dashboard/:path*"
 ]

};