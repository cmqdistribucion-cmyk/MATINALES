CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  area TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.capacitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fin TIMESTAMPTZ,
  duracion_segundos INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capacitacion_id UUID NOT NULL REFERENCES public.capacitaciones(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  area TEXT,
  presente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asistencias_capacitacion ON public.asistencias(capacitacion_id);
CREATE INDEX idx_capacitaciones_inicio ON public.capacitaciones(inicio);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capacitaciones TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asistencias TO anon, authenticated;
GRANT ALL ON public.personas TO service_role;
GRANT ALL ON public.capacitaciones TO service_role;
GRANT ALL ON public.asistencias TO service_role;

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acceso publico personas" ON public.personas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acceso publico capacitaciones" ON public.capacitaciones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acceso publico asistencias" ON public.asistencias FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);