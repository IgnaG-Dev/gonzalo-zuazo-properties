"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmActionButton } from "../../ConfirmActionButton";

export function DeleteLeadButton({ leadId, address }: { leadId: string; address: string | null }) {
  const router = useRouter();

  async function handleDelete() {
    const response = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/leads");
      router.refresh();
    }
  }

  return (
    <ConfirmActionButton
      icon={Trash2}
      label="Eliminar lead"
      variant="danger"
      confirmMessage={`¿Eliminar el lead "${address ?? leadId}"? Esta acción no se puede deshacer.`}
      onConfirm={handleDelete}
    />
  );
}
