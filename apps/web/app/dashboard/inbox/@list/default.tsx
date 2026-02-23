"use client";

import { usePathname } from "next/navigation";
import MessagesListPage from "./messages/page";
import InboxMainList from "./main/page";

export default function DefaultList() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard/inbox/messages")) {
    return <MessagesListPage />;
  }

  return <InboxMainList />;
}