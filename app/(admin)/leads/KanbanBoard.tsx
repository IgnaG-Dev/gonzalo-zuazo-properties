"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { useState } from "react";
import type { Lead, LeadStatus } from "../../../lib/types";

const COLUMNS: LeadStatus[] = ["nuevo lead", "en duda", "interesado", "no interesado"];

export function KanbanBoard({ leads }: { leads: Lead[] }) {
  const [items, setItems] = useState(leads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const columns = COLUMNS.map((status) => ({
    status,
    leads: items.filter((lead) => lead.status === status),
  }));

  const activeLead = activeId ? items.find((lead) => lead.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const newStatus = over.id as LeadStatus;
    const lead = items.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    const previousStatus = lead.status;
    setItems((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    setError(null);

    const response = await fetch(`/api/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      setItems((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: previousStatus } : l)));
      setError("No se pudo actualizar el estado. Probá de nuevo.");
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((column) => (
            <KanbanColumn key={column.status} status={column.status} leads={column.leads} />
          ))}
        </div>
        <DragOverlay>{activeLead ? <LeadCard lead={activeLead} dragging /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({ status, leads }: { status: LeadStatus; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const visible = leads.slice(0, 50);

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column transition-colors duration-150 ${isOver ? "bg-accent-50 dark:bg-accent-900/20" : ""}`}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          {status}
        </h3>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          {leads.length}
        </span>
      </div>
      <div className="flex min-h-24 flex-col gap-2 px-3 pb-3">
        {visible.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length > visible.length && (
          <p className="px-1 text-xs text-neutral-500 dark:text-neutral-500">
            +{leads.length - visible.length} más
          </p>
        )}
        {leads.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-neutral-400 dark:text-neutral-600">
            Sin leads acá
          </p>
        )}
      </div>
    </div>
  );
}

function DraggableLeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-30" : ""}
    >
      <LeadCard lead={lead} />
    </div>
  );
}

function LeadCard({ lead, dragging }: { lead: Lead; dragging?: boolean }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      onClick={(e) => dragging && e.preventDefault()}
      className={`kanban-card block ${dragging ? "rotate-2 shadow-lg" : ""}`}
    >
      <p className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {lead.address ?? "(sin dirección)"}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-500">
        {lead.owner_name ?? "—"}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-medium tabular-nums text-neutral-700 dark:text-neutral-300">
          {lead.price != null ? `${lead.price.toLocaleString("es-ES")} €` : "—"}
        </span>
        {lead.meeting_requested && (
          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Reunión
          </span>
        )}
      </div>
      {!lead.phone_e164 && (
        <p className="mt-1.5 text-[11px] text-neutral-400 dark:text-neutral-600">sin teléfono</p>
      )}
    </Link>
  );
}
