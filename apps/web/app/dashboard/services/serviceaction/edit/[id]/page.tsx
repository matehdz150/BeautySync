"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useServiceDraft } from "@/context/ServiceDraftContext";
import { getServiceById } from "@/lib/services/services";
import NewServiceBasicInfo from "../../page";

export default function EditServicePage() {
  const params = useParams();
  const { dispatch } = useServiceDraft();

  useEffect(() => {
    if (!params?.id) return;

    async function load() {
      const service = await getServiceById(params.id as string);
      console.log(service)

      dispatch({
        type: "LOAD_EXISTING",
        value: {
          id: service.id,
          organizationId: service.organizationId,
          branchId: service.branchId,

          name: service.name,
          description: service.description ?? "",
          categoryId: service.categoryId ?? null,

          durationMin: service.durationMin,
          priceCents: service.priceCents ?? null,

          staffIds: service.staff?.map(s => s.staffId) ?? [],

          notes: service.notes ?? [],
          serviceRules: service.serviceRules ?? [],

          isActive: service.isActive,
        },
      });
    }

    load();
  }, [params?.id, dispatch]);

  return <NewServiceBasicInfo />;
}