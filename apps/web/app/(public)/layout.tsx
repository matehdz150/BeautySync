import { PublicAuthProvider } from "@/context/public/PublicAuthContext";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicAuthProvider>
      {children}
    </PublicAuthProvider>
  );
}