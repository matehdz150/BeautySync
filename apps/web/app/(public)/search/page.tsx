import { getExploreBranches } from "@/lib/services/public/explore";
import PageWrapper from "./pageWrapper";

export default async function Page() {
  const branches = await getExploreBranches();

  return <PageWrapper branches={branches} />;
}
