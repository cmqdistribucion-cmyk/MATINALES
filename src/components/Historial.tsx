import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { listarHistorial, type CapacitacionConAsistencias } from "@/lib/capacitaciones";

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR");
}
function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function Historial() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtro, setFiltro] = useState<{ desde?: string | undefined; hasta?: string | undefined }>({});
  const [abierta, setAbierta] = useState<string | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["historial", filtro],
    queryFn: () => listarHistorial(filtro.desde, filtro.hasta),
  });

  function descargar(filas: CapacitacionConAsistencias[]) {
    if (filas.length === 0) {
      toast.error("No hay capacitaciones para descargar");
      return;
    }
    const resumen = filas.map((c) => ({
      Matinal: c.titulo,
      Descripción: c.descripcion ?? "",
      Fecha: fecha(c.inicio),
      Hora: hora(c.inicio),
      Duración: c.duracion_segundos
        ? new Date(c.duracion_segundos * 1000).toISOString().substring(11, 19)
        : "",
      Presentes: c.asistencias.filter((a) => a.presente).length,
      Ausentes: c.asistencias.filter((a) => !a.presente).length,
    }));
    const detalle = filas.flatMap((c) =>
      c.asistencias.map((a) => ({
        Capacitación: c.titulo,
        Fecha: fecha(c.inicio),
        Hora: hora(c.inicio),
        Persona: a.nombre,
        Área: a.area ?? "",
        Asistió: a.presente ? "Sí" : "No",
      })),
    );
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(resumen), "Matinales");
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(detalle), "Asistentes");
    XLSX.writeFile(libro, "historial-matinales.xlsx");
  }

  return (
    <section
      id="historial"
      className="rounded-[min(1vw,20px)] bg-card p-6 ring-1 ring-border sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold leading-tight text-ink">Historial</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-full bg-cream border-2 border-border px-4 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-signal focus:border-signal"
          />
          <span className="font-medium text-ink/40">—</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-full bg-cream border-2 border-border px-4 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-signal focus:border-signal"
          />
          <button
            onClick={() => setFiltro({ desde: desde || undefined, hasta: hasta || undefined })}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Filtrar
          </button>
          <button
            onClick={() => {
              setDesde("");
              setHasta("");
              setFiltro({});
            }}
            className="rounded-full bg-cream px-4 py-2 text-sm font-medium text-ink ring-1 ring-border hover:bg-cream/80 transition-colors"
          >
            Limpiar
          </button>
          <button
            onClick={() => descargar(data)}
            className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-cream ring-1 ring-moss/30 shadow-sm shadow-moss/10 hover:bg-moss/90 transition-colors"
          >
            Descargar Excel
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-bold uppercase tracking-[0.15em] text-ink/50">
              <th className="py-2 pr-4">Matinal</th>
              <th className="py-2 pr-4">Fecha</th>
              <th className="py-2 pr-4">Hora</th>
              <th className="py-2 pr-4">Duración</th>
              <th className="py-2 pr-4">Presentes</th>
              <th className="py-2">Ausentes</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 font-display text-sm text-ink/50">
                  No hay MATINALES registradas en este período.
                </td>
              </tr>
            )}
            {data.map((c) => {
              const asis = c.asistencias ?? [];
              const pres = asis.filter((a) => a.presente).length;
              const aus = asis.filter((a) => !a.presente).length;
              return (
                <tr
                  key={c.id}
                  onClick={() => setAbierta(abierta === c.id ? null : c.id)}
                  className="cursor-pointer border-t border-ink/10 hover:bg-ink/[0.03]"
                >
                  <td className="py-2.5 pr-4 font-display font-medium">{c.titulo}</td>
                  <td className="py-2.5 pr-4">{fecha(c.inicio)}</td>
                  <td className="py-2.5 pr-4">{hora(c.inicio)}</td>
                  <td className="py-2.5 pr-4">
                    {c.duracion_segundos
                      ? new Date(c.duracion_segundos * 1000).toISOString().substring(11, 19)
                      : "—"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block size-2 rounded-full bg-moss" />
                      <span className="font-bold text-moss">{pres}</span>
                      <span className="text-ink/40">/ {asis.length}</span>
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block size-2 rounded-full bg-signal" />
                      <span className="font-bold text-signal">{aus}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {abierta && (
        <div className="mt-5 rounded-[min(1vw,16px)] bg-ink/[0.04] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50">
            Detalle de asistentes
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data
              .find((c) => c.id === abierta)
              ?.asistencias.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {a.nombre}
                    {a.area ? <span className="text-ink/50"> · {a.area}</span> : null}
                  </span>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-semibold text-cream ${
                      a.presente ? "bg-moss" : "bg-signal"
                    }`}
                  >
                    {a.presente ? "Sí" : "No"}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  );
}
