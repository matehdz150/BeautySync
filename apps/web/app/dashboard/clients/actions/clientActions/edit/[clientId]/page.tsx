"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import {
  ClientEditData,
  getClientDetail,
  getClientEdit,
} from "@/lib/services/clients";
import { ClientDraft, useClientDraft } from "@/context/ClientDraftContext";

import ClientForm from "../../new/page";

export function mapClientEditToDraft(
  data: ClientEditData,
  orgId: string,
): ClientDraft {
  return {
    id: data.id,
    organizationId: orgId,

    name: data.name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    avatarUrl: data.avatarUrl ?? null,

    birthdate: data.birthdate ?? null,

    profile: {
      gender: data.profile?.gender ?? null,
      occupation: data.profile?.occupation ?? null,
      city: data.profile?.city ?? null,
    },

    editable: data.editable
  };
}

export default function EditClientPage() {
  const params = useParams();

  const { dispatch } = useClientDraft();

  useEffect(() => {
    if (!params?.clientId) return;

    async function load() {
      const data = await getClientEdit(params.clientId as string);
      console.log(data)
      const user = JSON.parse(localStorage.getItem("user") || "{}")

      dispatch({
        type: "LOAD_EXISTING",
        value: mapClientEditToDraft(data, user.orgId),
      });
    }

    load();
  }, [params?.clientId, dispatch]);

  return <ClientForm />;
}
