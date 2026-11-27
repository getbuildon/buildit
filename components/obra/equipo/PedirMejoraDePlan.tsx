"use client"

import { Send } from "lucide-react"
import { useState } from "react"

import { Button } from "@/library/atoms/button/Button"
import { Icon } from "@/library/atoms/icon/Icon"
import { Textarea } from "@/library/atoms/input/Input"
import { Dialog, DialogContent } from "@/library/molecules/dialog/Dialog"
import { Field } from "@/library/molecules/field/Field"
import { Notice } from "@/library/molecules/notice/Notice"

import { submitPlanUpgradeRequest } from "@/app/project/[projectId]/equipo/actions"
import { useToast } from "@/components/ui/toast"
import type { ProjectUserType } from "@/lib/projects/createProjectDraft"

/**
 * Pedirle al administrador de la organización que mejore el plan porque no quedan
 * lugares para un tipo de usuario. Quien lo usa le cambia la `key` al abrirlo, así
 * arranca siempre vacío.
 */
export function PedirMejoraDePlan({
  projectId,
  tipo,
  abierto,
  alCambiar,
  sinSenal,
}: {
  projectId: string
  tipo: ProjectUserType | null
  abierto: boolean
  alCambiar: (abierto: boolean) => void
  /** Sin conexión no se puede enviar: el botón queda desactivado. */
  sinSenal: boolean
}) {
  const toast = useToast()
  const [comentarios, setComentarios] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")

  const enviar = async () => {
    if (enviando || !tipo || sinSenal) return
    setEnviando(true)
    setError("")
    try {
      const resultado = await submitPlanUpgradeRequest(projectId, {
        kind: "userType",
        userType: tipo,
        comments: comentarios.trim() || undefined,
      })
      if (!resultado.ok) {
        setError(resultado.error)
        return
      }
      toast.success("Solicitud enviada al administrador de la organización.")
      alCambiar(false)
    } catch {
      setError("No pudimos enviar la solicitud. Revisá la conexión y probá de nuevo.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(valor) => !enviando && alCambiar(valor)}>
      <DialogContent
        size="narrow"
        title="Solicitar mejora de plan"
        description="Le vas a enviar una solicitud al administrador de la organización para mejorar el plan."
        footer={
          <>
            <Button variant="outline" onClick={() => alCambiar(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button onClick={() => void enviar()} loading={enviando} loadingLabel="Enviando…" disabled={!tipo || sinSenal}>
              <Icon icon={Send} /> Enviar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-group">
          <Field label="Comentarios" optional>
            <Textarea
              value={comentarios}
              onChange={(evento) => {
                setComentarios(evento.target.value)
                if (error) setError("")
              }}
              placeholder="Contale qué necesitás (opcional)"
            />
          </Field>
          {error ? <Notice tone="danger">{error}</Notice> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
