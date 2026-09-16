import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  actualizarPersona,
  agregarPersona,
  agregarPersonasMultiples,
  eliminarPersona,
  type Persona,
} from "@/lib/capacitaciones";

export function Nomina({ personas }: { personas: Persona[] }) {
  const qc = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [area, setArea] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editArea, setEditArea] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refrescar = () => qc.invalidateQueries({ queryKey: ["personas"] });

  const alta = useMutation({
    mutationFn: () => agregarPersona(nombre.trim(), area.trim()),
    onSuccess: () => {
      setNombre("");
      setArea("");
      refrescar();
      toast.success("Persona agregada a la nómina");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const guardar = useMutation({
    mutationFn: (id: string) => actualizarPersona(id, editNombre.trim(), editArea.trim()),
    onSuccess: () => {
      setEditando(null);
      refrescar();
      toast.success("Cambios guardados");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const borrar = useMutation({
    mutationFn: (id: string) => eliminarPersona(id),
    onSuccess: () => {
      refrescar();
      toast.success("Persona eliminada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cargarExcel = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        toast.error("El archivo Excel no tiene hojas");
        return;
      }
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        toast.error("No se pudo leer la hoja del Excel");
        return;
      }

      // Leer el rango completo de la hoja
      const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1");
      const rows: string[][] = [];

      // Leer cada fila como array de valores
      for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
        const row: string[] = [];
        for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
          const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
          const cell = worksheet[cellAddress];
          row.push(cell ? String(cell.v) : "");
        }
        rows.push(row);
      }

      console.log("Filas del Excel:", rows); // Debug: ver qué filas se están leyendo

      const personasParaAgregar: { nombre: string; area: string | null }[] = [];

      // Saltar la primera fila (encabezados) y procesar el resto
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue; // Skip undefined rows

        const nombre = row[0] || ""; // Primera columna: nombre
        const area = row[1] || "";  // Segunda columna: empresa

        if (nombre && nombre.trim()) {
          personasParaAgregar.push({
            nombre: nombre.trim(),
            area: area ? area.trim() : null
          });
        }
      }

      console.log("Personas a agregar:", personasParaAgregar); // Debug: ver qué personas se van a agregar

      if (personasParaAgregar.length > 0) {
        await agregarPersonasMultiples(personasParaAgregar);
        refrescar();
        toast.success(`Se cargaron ${personasParaAgregar.length} personas del Excel`);
      } else {
        toast.error("No se encontraron personas válidas en el archivo. Asegúrate de que el Excel tenga al menos una columna con nombres.");
      }
    } catch (error) {
      console.error("Error al cargar Excel:", error);
      toast.error("Error al leer el archivo Excel");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      cargarExcel(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <section
      id="nomina"
      className="rounded-[min(1vw,20px)] bg-card p-6 ring-1 ring-steel sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold leading-tight">Nómina · administración</h2>
          <p className="mt-1 text-sm text-ink/60">
            Cargá las personas manualmente o subí un archivo Excel (columnas: Nombre, Área).
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-moss/90"
        >
          Cargar Excel
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <form
        className="mt-5 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!nombre.trim()) {
            toast.error("Escribí el nombre");
            return;
          }
          alta.mutate();
        }}
      >
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre y apellido"
          className="min-w-[220px] flex-1 rounded-full bg-cream px-4 py-2.5 text-sm ring-1 ring-steel focus:outline-none focus:ring-2 focus:ring-ink"
        />
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Área o sector (opcional)"
          className="min-w-[200px] flex-1 rounded-full bg-cream px-4 py-2.5 text-sm ring-1 ring-steel focus:outline-none focus:ring-2 focus:ring-ink"
        />
        <button
          type="submit"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream"
        >
          Guardar persona
        </button>
      </form>

      <div className="mt-6 divide-y divide-steel/10">
        {personas.length === 0 && (
          <p className="py-4 text-sm text-ink/50">Todavía no hay personas en la nómina.</p>
        )}
        {personas.map((p) =>
          editando === p.id ? (
            <div key={p.id} className="flex flex-wrap items-center gap-3 py-3">
              <input
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                className="min-w-[180px] flex-1 rounded-full bg-cream px-4 py-2 text-sm ring-1 ring-steel"
              />
              <input
                value={editArea}
                onChange={(e) => setEditArea(e.target.value)}
                className="min-w-[160px] flex-1 rounded-full bg-cream px-4 py-2 text-sm ring-1 ring-steel"
              />
              <button
                onClick={() => guardar.mutate(p.id)}
                className="rounded-full bg-moss px-4 py-1.5 text-sm font-semibold text-cream"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditando(null)}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-ink/60 ring-1 ring-steel"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div key={p.id} className="flex items-center gap-4 py-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-steel/20 font-mono text-sm font-bold">
                {p.nombre
                  .split(" ")
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.nombre}</p>
                {p.area && <p className="text-xs text-ink/55">{p.area}</p>}
              </div>
              <button
                onClick={() => {
                  setEditando(p.id);
                  setEditNombre(p.nombre);
                  setEditArea(p.area ?? "");
                }}
                className="rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-steel"
              >
                Editar
              </button>
              <button
                onClick={() => borrar.mutate(p.id)}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-signal ring-1 ring-signal/40"
              >
                Eliminar
              </button>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
