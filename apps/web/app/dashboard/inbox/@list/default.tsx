import { redirect } from "next/navigation";

export default function DefaultList() {
  redirect("/dashboard/inbox/main");
}