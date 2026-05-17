import "./globals.css";
import React from "react";
import { AuthProvider } from "./context/AuthContext";
export const metadata = {
  title: "KalanSO - Logiciel de gestion scolaire",
  description:
    "Gérez votre école facilement : élèves, enseignants, présences et paiements.",
};




export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body >
        
        <AuthProvider>
      
          <div className="">

          
          {children}
          </div>
      
        </AuthProvider>
  
      </body>
    </html>
  );
}
