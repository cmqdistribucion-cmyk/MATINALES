import { supabase } from "@/integrations/supabase/client";

export type Persona = {
  id: string;
  nombre: string;
  area: string | null;
  activo: boolean;
};

export type Capacitacion = {
  id: string;
  titulo: string;
  descripcion: string | null;
  inicio: string;
  fin: string | null;
  duracion_segundos: number | null;
};

export type Asistencia = {
  id: string;
  capacitacion_id: string;
  nombre: string;
  area: string | null;
  presente: boolean;
};

export async function listarPersonas(): Promise<Persona[]> {
  const { data, error } = await supabase
    .from("personas")
    .select("id, nombre, area, activo")
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}

export async function agregarPersona(nombre: string, area: string) {
  const { error } = await supabase
    .from("personas")
    .insert({ nombre, area: area || null });
  if (error) throw error;
}

export async function agregarPersonasMultiples(personas: { nombre: string; area: string | null }[]) {
  const { error } = await supabase
    .from("personas")
    .insert(personas.map(p => ({ nombre: p.nombre, area: p.area })));
  if (error) throw error;
}

export async function actualizarPersona(id: string, nombre: string, area: string) {
  const { error } = await supabase
    .from("personas")
    .update({ nombre, area: area || null })
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarPersona(id: string) {
  const { error } = await supabase.from("personas").delete().eq("id", id);
  if (error) throw error;
}

export async function iniciarCapacitacion(titulo: string, descripcion: string) {
  const { data, error } = await supabase
    .from("capacitaciones")
    .insert({ titulo, descripcion: descripcion || null, inicio: new Date().toISOString() })
    .select("id, titulo, descripcion, inicio, fin, duracion_segundos")
    .single();
  if (error) throw error;
  return data as Capacitacion;
}

export async function finalizarCapacitacion(
  capacitacionId: string,
  duracionSegundos: number,
  asistentes: { persona_id: string | null; nombre: string; area: string | null; presente: boolean }[],
) {
  const { error } = await supabase
    .from("capacitaciones")
    .update({ fin: new Date().toISOString(), duracion_segundos: duracionSegundos })
    .eq("id", capacitacionId);
  if (error) throw error;

  await supabase.from("asistencias").delete().eq("capacitacion_id", capacitacionId);

  if (asistentes.length > 0) {
    const { error: e2 } = await supabase
      .from("asistencias")
      .insert(asistentes.map((a) => ({ ...a, capacitacion_id: capacitacionId })));
    if (e2) throw e2;
  }
}

export type CapacitacionConAsistencias = Capacitacion & { asistencias: Asistencia[] };

export async function listarHistorial(
  desde?: string,
  hasta?: string,
): Promise<CapacitacionConAsistencias[]> {
  let query = supabase
    .from("capacitaciones")
    .select("id, titulo, descripcion, inicio, fin, duracion_segundos, asistencias(id, capacitacion_id, nombre, area, presente)")
    .order("inicio", { ascending: false });

  if (desde) query = query.gte("inicio", `${desde}T00:00:00`);
  if (hasta) query = query.lte("inicio", `${hasta}T23:59:59`);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as CapacitacionConAsistencias[]).map((c) => ({
    ...c,
    asistencias: Array.isArray(c.asistencias) ? c.asistencias : [],
  }));
}

export function formatearTiempo(segundos: number) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0"));
}
