import { getExploreBranches } from "@/lib/services/public/explore";
import PageWrapper from "./pageWrapper";

export default async function Page() {
  // 🔥 solo fetch inicial (sin filtros)
  const branches = await getExploreBranches();

  return <PageWrapper branches={branches} />;
}