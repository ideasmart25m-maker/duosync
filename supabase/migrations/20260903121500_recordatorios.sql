-- Parte 2 (pedido real del usuario): marcar una categoría como recurrente (arriendo,
-- servicios, suscripciones) con el día del mes en que vence, para poder avisar por correo.

alter table public.categories add column if not exists es_recurrente boolean not null default false;
alter table public.categories add column if not exists dia_vencimiento smallint
  check (dia_vencimiento is null or dia_vencimiento between 1 and 31);

-- Regla: una categoría recurrente SIEMPRE necesita su día de vencimiento (si no, no hay
-- nada que avisar); una no-recurrente no debería llevar uno para no confundir en la UI.
alter table public.categories add constraint categories_recurrente_check
  check ((es_recurrente and dia_vencimiento is not null) or (not es_recurrente and dia_vencimiento is null));

-- Evita mandar el mismo recordatorio dos veces si el cron corre más de una vez el mismo día
-- (reintento, doble deploy, etc.) — una fila por categoría+mes+año ya avisado.
create table public.recordatorios_enviados (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  anio int not null,
  mes int not null,
  enviado_at timestamptz not null default now(),
  unique (category_id, anio, mes)
);
alter table public.recordatorios_enviados enable row level security;
-- Sin políticas para authenticated/anon: la escribe y la lee solo el cron (service_role,
-- que se salta RLS) — ningún usuario necesita verla ni tocarla directamente.
