# Migración: Company Invitations

## Instrucciones

1. Abre **Supabase Studio** → **SQL Editor**
2. Copia y ejecuta el siguiente SQL:

```sql
-- Create invitation_status enum
DO $$ BEGIN
  CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create company_invitations table
CREATE TABLE IF NOT EXISTS public.company_invitations (
  id            uuid                        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid                        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email         text                        NOT NULL,
  role          public.company_role         NOT NULL,
  invited_by    uuid                        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status        public.invitation_status    NOT NULL DEFAULT 'pending',
  accepted_at   timestamptz,
  created_at    timestamptz                 NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS company_invitations_company_id_idx ON public.company_invitations (company_id);
CREATE INDEX IF NOT EXISTS company_invitations_email_idx ON public.company_invitations (email);
CREATE INDEX IF NOT EXISTS company_invitations_status_idx ON public.company_invitations (status);

-- Enable RLS
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS company_invitations_select_member ON public.company_invitations;
CREATE POLICY company_invitations_select_member
  ON public.company_invitations FOR SELECT TO authenticated
  USING (public.user_is_company_member(company_id));

DROP POLICY IF EXISTS company_invitations_insert_admin ON public.company_invitations;
CREATE POLICY company_invitations_insert_admin
  ON public.company_invitations FOR INSERT TO authenticated
  WITH CHECK (public.user_company_role(company_id) IN ('owner', 'admin'));

DROP POLICY IF EXISTS company_invitations_update_admin ON public.company_invitations;
CREATE POLICY company_invitations_update_admin
  ON public.company_invitations FOR UPDATE TO authenticated
  USING (public.user_company_role(company_id) IN ('owner', 'admin'))
  WITH CHECK (public.user_company_role(company_id) IN ('owner', 'admin'));
```

3. ¡Listo! La migración está aplicada.

## Qué hace esta migración

- ✅ Crea tabla `company_invitations` para almacenar invitaciones pendientes
- ✅ Permite invitar usuarios sin requerir que estén registrados
- ✅ Gestiona invitaciones con estados: pending, accepted, revoked
- ✅ Aplica RLS para que solo admin/owner vean y gestionen invitaciones

## Cambios en la app

- El formulario de agregar miembros ahora permite invitar cualquier email válido
- Los usuarios no registrados aparecen con badge "Invitación pendiente"
- Se puede revocar invitaciones pendientes
- Cuando un usuario invitado se registra con ese email, automáticamente se activa su membresía
