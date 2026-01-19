import { PublicAuthProvider } from "@/context/public/PublicAuthContext";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicAuthProvider>
      <div className="min-h-screen bg-white">{children}</div>
    </PublicAuthProvider>
  );
}