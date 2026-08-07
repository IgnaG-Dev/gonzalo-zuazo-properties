import { createClient } from "../../../lib/supabase/server";
import { DncManager } from "./DncManager";

export default async function DncPage() {
  const supabase = await createClient();
  const { data: entries, error } = await supabase
    .from("do_not_call")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Lista de exclusión
        </h1>
        <p className="mt-1 max-w-xl text-sm text-neutral-500 dark:text-neutral-400">
          Cubre solo bloqueos manuales o detectados por el propio sistema (ej. el propietario pidió
          no volver a llamar durante la llamada). No es una integración con la Lista Robinson
          oficial.
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          Error cargando lista: {error.message}
        </p>
      )}

      <DncManager entries={entries ?? []} />
    </div>
  );
}
