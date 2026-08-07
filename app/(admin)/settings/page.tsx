import { createClient } from "../../../lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings, error } = await supabase.from("settings").select("*").eq("id", 1).single();

  if (error || !settings) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error cargando configuración: {error?.message}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Horario de llamada, reintentos, y credenciales de Retell/Apify por sección.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
