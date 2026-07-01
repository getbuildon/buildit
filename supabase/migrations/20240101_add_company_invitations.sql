-- =============================================================================
-- Add company_invitations table for pending invitations
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

CREATE INDEX IF NOT EXISTS company_invitations_company_id_idx ON public.company_invitations (company_id);
CREATE INDEX IF NOT EXISTS company_invitations_email_idx ON public.company_invitations (email);
CREATE INDEX IF NOT EXISTS company_invitations_status_idx ON public.company_invitations (status);

-- RLS
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- Invitations visible to company members
CREATE POLICY company_invitations_select_member
  ON public.company_invitations FOR SELECT TO authenticated
  USING (public.user_is_company_member(company_id));

-- Only owner/admin can create invitations
CREATE POLICY company_invitations_insert_admin
  ON public.company_invitations FOR INSERT TO authenticated
  WITH CHECK (public.user_company_role(company_id) IN ('owner', 'admin'));

-- Only owner/admin can revoke invitations
CREATE POLICY company_invitations_update_admin
  ON public.company_invitations FOR UPDATE TO authenticated
  USING (public.user_company_role(company_id) IN ('owner', 'admin'))
  WITH CHECK (public.user_company_role(company_id) IN ('owner', 'admin'));

GRANT EXECUTE ON FUNCTION public.user_is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_company_role(uuid, uuid) TO authenticated;
