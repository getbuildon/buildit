# Supabase — Build It

**Proyecto remoto:** `vsxjirpsrfwrzkclbczo` (URL en `build-it/.env.local`).

**Tenant = `projects.id`** (`project_id` en tablas hijas).

## Por qué no se aplicó solo desde Cursor

1. **MCP Supabase** devolvió `Unauthorized`: el servidor MCP no está vinculado a la cuenta/org que posee este proyecto (o no iniciaste sesión en *Cursor → Settings → MCP → Supabase*).
2. **Supabase CLI** (`supabase login` en esta máquina) solo ve otros proyectos (TreesPOP, Rootsy). La cuenta del CLI **no tiene privilegios** sobre `vsxjirpsrfwrzkclbczo`.

El SQL está listo en el repo; falta ejecutarlo con credenciales del dueño del proyecto Build It.

## Aplicar el esquema (elegí una)

### A) SQL Editor (más rápido si no tenés CLI)

1. [Dashboard Build It](https://supabase.com/dashboard/project/vsxjirpsrfwrzkclbczo/sql/new)
2. Pegá y ejecutá todo `docs/supabase/001_projects_schema.sql` (o `supabase/migrations/20260605120000_projects_schema.sql`).

### B) Supabase CLI (cuenta con acceso al proyecto)

```bash
cd build-it
supabase login   # cuenta que posee vsxjirpsrfwrzkclbczo
supabase link --project-ref vsxjirpsrfwrzkclbczo
supabase db push
```

### C) MCP en Cursor (para que el agente pueda migrar después)

1. *Settings → MCP → Supabase* → conectar e iniciar sesión.
2. Elegir el proyecto **vsxjirpsrfwrzkclbczo**.
3. Pedir de nuevo “aplicar migración projects_schema”.

## Contenido de la migración

Catálogos con seed: `unit_types`, `task_tracking_types`, `user_types`, `project_roles`.

Obra y wizard: `projects`, `project_floors`, `project_units`, `rubro_groups`, `rubros`, `rubro_tasks`, `project_members`, `project_invitations`.

RLS: `user_has_project_access` / `user_can_access_project` (miembro o creador de la obra).

Orden al persistir el wizard: `projects` → `project_members` (administrador) → estructura → rubros → invitaciones.

Slugs en app: `lib/projects/catalogSlugs.ts`.
