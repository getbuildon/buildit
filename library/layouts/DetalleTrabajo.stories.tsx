import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Clock,
  Paperclip,
  Pencil,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "../atoms/avatar/Avatar";
import { Badge } from "../atoms/badge/Badge";
import { Button } from "../atoms/button/Button";
import { Icon } from "../atoms/icon/Icon";
import { Textarea } from "../atoms/input/Input";
import { cn } from "../lib/cn";
import { ConfirmDialog } from "../molecules/confirm-dialog/ConfirmDialog";
import { Dialog, DialogContent } from "../molecules/dialog/Dialog";
import { Field } from "../molecules/field/Field";
import { FileField, type FileItem } from "../molecules/file-field/FileField";
import { Select, SelectItem } from "../molecules/select/Select";
import { Sheet, SheetContent } from "../organisms/sheet/Sheet";
import {
  MobileHeaderToday,
  SidebarProposal,
  SidebarToday,
  TopbarProposal,
} from "./obra/ObraShell";
import { WorkspaceLayout } from "./workspace/WorkspaceLayout";

/* Trabajo diario → detalle de un trabajo cargado: estado, comentarios, fotos, historial,
   editar el estado y certificar. */

/* ------------------------------------------------------------------ Datos */

type Status = "Completado" | "En Proceso" | "Bloqueado" | "Certificada";
type Editable = Exclude<Status, "Certificada">;

const statusTone = {
  Completado: "ok",
  "En Proceso": "caution",
  Bloqueado: "danger",
  Certificada: "info",
} as const;
const statusText: Record<Status, string> = {
  Completado: "text-fn-ok",
  "En Proceso": "text-fn-caution",
  Bloqueado: "text-fn-danger",
  Certificada: "text-fn-info",
};
const statusIcon: Record<Status, LucideIcon> = {
  Completado: CheckCircle2,
  "En Proceso": CircleDashed,
  Bloqueado: AlertCircle,
  Certificada: ShieldCheck,
};

type HistoryItem = {
  id: string;
  status: Status;
  date: string;
  comment: string;
  by: string;
  photos: number;
};

const work = {
  name: "Cableado de tomas",
  code: "ELE-031",
  rubro: "Instalación eléctrica",
  floor: "Piso 1",
  floorShort: "P1",
  unit: "1A",
  date: "Miércoles, 18 de noviembre de 2026",
  status: "Completado" as Status,
  comment: "Se terminó el cableado de los 6 tomas del living y la cocina.",
  photos: 2,
};

const history: HistoryItem[] = [
  {
    id: "h3",
    status: "Completado",
    date: "18 nov · 16:40 h",
    comment: work.comment,
    by: "Sofía Ruiz",
    photos: 2,
  },
  {
    id: "h2",
    status: "En Proceso",
    date: "16 nov · 11:05 h",
    comment: "Se pasaron los cables de la cocina.",
    by: "Sofía Ruiz",
    photos: 1,
  },
  {
    id: "h1",
    status: "Bloqueado",
    date: "14 nov · 09:30 h",
    comment: "Falta material: cable de 2,5 mm.",
    by: "Martín Gómez",
    photos: 0,
  },
];

const photoCount = (count: number) =>
  count === 0
    ? "Sin fotografías"
    : count === 1
      ? "1 foto adjunta"
      : `${count} fotos adjuntas`;

/** Foto de ejemplo: un recuadro con el ícono (el catálogo no lleva fotos reales). */
function PhotoPlaceholder({
  index,
  className,
}: {
  index: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-4/3 items-center justify-center rounded-control bg-canvas-sunken text-ink-muted",
        className,
      )}
    >
      <span className="flex flex-col items-center gap-related text-meta">
        <Icon icon={Camera} size="md" />
        Foto {index + 1}
      </span>
    </div>
  );
}

function Gallery({
  open,
  onOpenChange,
  count,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide" title={title} description={work.date}>
        <ul className="grid grid-cols-2 gap-compact">
          {Array.from({ length: count }, (_, index) => (
            <li key={index}>
              <PhotoPlaceholder index={index} />
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function StatusPill({ status }: { status: Status }) {
  return (
    <Badge
      tone={statusTone[status]}
      icon={statusIcon[status]}
      className="w-fit rounded-compact"
    >
      {status}
    </Badge>
  );
}

function Background({
  version,
  children,
}: {
  version: "hoy" | "propuesta";
  children: React.ReactNode;
}) {
  return version === "hoy" ? (
    <WorkspaceLayout
      sidebar={<SidebarToday active="trabajo-diario" />}
      topbar={<MobileHeaderToday active="trabajo-diario" />}
    >
      <div className="flex flex-col gap-group py-compact sm:py-block">
        <h1 className="text-title">Trabajo Diario</h1>
        {children}
      </div>
    </WorkspaceLayout>
  ) : (
    <WorkspaceLayout
      sidebar={<SidebarProposal active="trabajo-diario" />}
      topbar={<TopbarProposal active="trabajo-diario" />}
    >
      <div className="flex flex-col gap-group py-compact sm:py-block">
        <h1 className="text-title">Trabajo diario</h1>
        {children}
      </div>
    </WorkspaceLayout>
  );
}

/* ================================================================== Como hoy */

const editOptions: { status: Editable; active: string }[] = [
  {
    status: "Completado",
    active: "border-fn-ok-solid bg-fn-ok-canvas text-fn-ok",
  },
  {
    status: "En Proceso",
    active: "border-fn-caution-solid bg-fn-caution-canvas text-fn-caution",
  },
  {
    status: "Bloqueado",
    active: "border-fn-danger-solid bg-fn-danger-canvas text-fn-danger",
  },
];

function DetalleHoy({
  startEditing = false,
  canCertify = true,
}: {
  startEditing?: boolean;
  canCertify?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<"view" | "edit">(
    startEditing ? "edit" : "view",
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [gallery, setGallery] = useState<{ count: number; title: string }>();
  const [draft, setDraft] = useState<Editable>("Completado");
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<FileItem[]>([]);
  const [certifying, setCertifying] = useState(false);
  const showCertify =
    canCertify && mode === "view" && work.status === "Completado";

  return (
    <Background version="hoy">
      <Button
        variant="outline"
        className="self-start"
        onClick={() => setOpen(true)}
      >
        Abrir el detalle de «{work.name}»
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setMode("view");
        }}
      >
        <DialogContent
          size="wide"
          title={work.name}
          description={`${work.floorShort} • ${work.unit} • ${work.date}`}
          footer={
            mode === "view" ? (
              showCertify ? (
                <>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cerrar
                  </Button>
                  <Button onClick={() => setCertifying(true)}>
                    <Icon icon={BadgeCheck} /> Certificar
                  </Button>
                </>
              ) : (
                <Button className="w-full" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
              )
            ) : (
              <>
                <Button variant="outline" onClick={() => setMode("view")}>
                  Cancelar
                </Button>
                <Button onClick={() => setMode("view")}>Guardar cambio</Button>
              </>
            )
          }
        >
          {mode === "view" ? (
            <div className="flex flex-col gap-block">
              <div className="flex items-start justify-between gap-snug">
                <Field label="Estado">
                  <StatusPill status={work.status} />
                </Field>
                <Button
                  variant="ghost"
                  size="compact"
                  className="text-action-text"
                  onClick={() => setMode("edit")}
                >
                  <Icon icon={Pencil} /> Editar Estado
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-meta text-ink-muted">Rubro</p>
                <p className="text-label">{work.rubro}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-meta text-ink-muted">Comentarios</p>
                <p className="rounded-control bg-canvas-sunken px-group py-snug text-body">
                  {work.comment || "Sin comentarios"}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-meta text-ink-muted">Fotografías</p>
                <button
                  type="button"
                  disabled={work.photos === 0}
                  onClick={() =>
                    setGallery({
                      count: work.photos,
                      title: "Fotografías del avance",
                    })
                  }
                  className="focus-ring motion-color flex w-full cursor-pointer items-center gap-compact rounded-control bg-canvas-sunken px-group py-snug text-left text-body hover:bg-canvas-track disabled:cursor-default disabled:text-ink-muted"
                >
                  <Icon icon={Camera} className="text-ink-muted" />
                  {photoCount(work.photos)}
                </button>
              </div>
              <div className="flex flex-col gap-compact">
                {/* Hoy no dice si está abierto o cerrado (sin aria-expanded). */}
                <button
                  type="button"
                  aria-expanded={historyOpen}
                  aria-controls="historial"
                  onClick={() => setHistoryOpen((value) => !value)}
                  className="focus-ring flex cursor-pointer items-center justify-between rounded-box py-related text-left"
                >
                  <span className="inline-flex items-center gap-compact text-label">
                    <Icon icon={Clock} className="text-ink-muted" />
                    Ver Historial de Cambios
                  </span>
                  <Icon
                    icon={ChevronDown}
                    className={cn(
                      "text-ink-muted transition-transform duration-(--duration-base)",
                      historyOpen && "rotate-180",
                    )}
                  />
                </button>
                {historyOpen ? (
                  <ul id="historial" className="flex flex-col gap-compact">
                    {history.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-snug rounded-control bg-canvas-sunken px-group py-snug"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-snug">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 text-meta font-medium",
                                statusText[item.status],
                              )}
                            >
                              <Icon icon={statusIcon[item.status]} />
                              {item.status}
                            </span>
                            <span className="shrink-0 text-meta text-ink-muted">
                              {item.date}
                            </span>
                          </div>
                          <p className="mt-compact text-body">{item.comment}</p>
                          <p className="mt-1.5 text-meta text-ink-muted">
                            Por: {item.by}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={item.photos === 0}
                          onClick={() =>
                            setGallery({
                              count: item.photos,
                              title: "Fotografías del cambio",
                            })
                          }
                          aria-label={
                            item.photos === 0
                              ? "Sin fotografías"
                              : `Ver ${item.photos === 1 ? "1 foto" : `${item.photos} fotos`} del cambio del ${item.date}`
                          }
                          className="focus-ring motion-color grid size-8 shrink-0 cursor-pointer place-items-center rounded-compact border border-line bg-canvas-raised text-ink-muted hover:border-action hover:text-action-text disabled:cursor-default disabled:opacity-50 disabled:hover:border-line disabled:hover:text-ink-muted"
                        >
                          <Icon icon={Camera} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-block">
              <Badge tone="action" className="self-start rounded-control">
                Editando
              </Badge>
              <div className="flex flex-col gap-group">
                <p className="text-label">Actualizar Estado de la tarea</p>
                {/* Hoy los botones no dicen cuál está elegido (sin aria-pressed) ni a qué grupo pertenecen. */}
                <div
                  role="group"
                  aria-labelledby="nuevo-estado"
                  className="flex flex-col gap-compact"
                >
                  <p id="nuevo-estado" className="text-meta text-ink-muted">
                    Nuevo Estado
                  </p>
                  <div className="grid grid-cols-1 gap-compact sm:grid-cols-3">
                    {editOptions.map((option) => {
                      const active = draft === option.status;
                      return (
                        <button
                          key={option.status}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setDraft(option.status)}
                          className={cn(
                            "focus-ring motion-color flex h-11 cursor-pointer items-center justify-center gap-compact rounded-control border-2 px-compact text-label",
                            active
                              ? option.active
                              : "border-line bg-canvas-raised text-ink-muted hover:bg-surface-hover",
                          )}
                        >
                          <Icon
                            icon={statusIcon[option.status]}
                            size="md"
                            className={active ? undefined : "text-ink-disabled"}
                          />
                          {option.status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <Field label="Comentarios sobre el cambio">
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  placeholder="Contá el motivo del cambio de estado…"
                />
              </Field>
              <Field label="Fotos" optional>
                <FileField
                  files={photos}
                  onAdd={(files) =>
                    setPhotos((current) => [
                      ...current,
                      ...files.map((file) => ({
                        id: `${file.name}-${Math.random()}`,
                        name: file.name,
                        previewUrl: URL.createObjectURL(file),
                        status: "done" as const,
                      })),
                    ])
                  }
                  onRemove={(id) =>
                    setPhotos((current) =>
                      current.filter((photo) => photo.id !== id),
                    )
                  }
                  accept="image/*"
                  acceptLabel="JPG, PNG o HEIC"
                  multiple
                  capture="environment"
                />
              </Field>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Gallery
        open={gallery !== undefined}
        onOpenChange={(value) => (value ? null : setGallery(undefined))}
        count={gallery?.count ?? 0}
        title={gallery?.title ?? ""}
      />
      <ConfirmDialog
        open={certifying}
        onOpenChange={setCertifying}
        title={`¿Certificar «${work.name}»?`}
        description={`${work.floor} · Unidad ${work.unit} · ${work.rubro}. Una vez certificada, solo quien certifica puede cambiar su estado.`}
        confirmLabel="Certificar"
        onConfirm={() => setCertifying(false)}
      />
    </Background>
  );
}

/* ================================================================== Propuesta */

const proposalStatus: { value: Editable; label: string }[] = [
  { value: "En Proceso", label: "En proceso" },
  { value: "Completado", label: "Completado" },
  { value: "Bloqueado", label: "Bloqueado" },
];
const sentence = (status: Status) =>
  status === "En Proceso" ? "En proceso" : status;

function DetallePropuesta() {
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState<Status>(work.status);
  const [items, setItems] = useState(history);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [gallery, setGallery] = useState<{ count: number; title: string }>();
  const [certifying, setCertifying] = useState(false);
  const pendingReason =
    status === "Bloqueado" && items[0].status !== "Bloqueado";

  const addActivity = (next: Status, text: string) => {
    setItems((current) => [
      {
        id: `h${current.length + 1}`,
        status: next,
        date: "Recién",
        comment: text,
        by: "Lucía Fernández",
        photos: 0,
      },
      ...current,
    ]);
  };

  return (
    <Background version="propuesta">
      <Button
        variant="outline"
        className="self-start"
        onClick={() => setOpen(true)}
      >
        Abrir el detalle de «{work.name}»
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          title={work.name}
          description={`${work.code} · ${work.rubro}`}
          footer={
            status === "Completado" ? (
              <Button onClick={() => setCertifying(true)}>
                <Icon icon={BadgeCheck} /> Certificar
              </Button>
            ) : status === "Certificada" ? (
              <p className="flex items-center gap-compact text-body text-fn-info">
                <Icon icon={ShieldCheck} /> Certificada
              </p>
            ) : null
          }
        >
          <div className="flex flex-col gap-block p-group">
            {/* Propiedades editables en el lugar (como Linear): sin «modo edición». */}
            <dl className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-group gap-y-snug text-body">
              <dt className="text-ink-muted">Estado</dt>
              <dd>
                {status === "Certificada" ? (
                  <StatusPill status={status} />
                ) : (
                  <Select
                    size="compact"
                    aria-label="Estado"
                    value={status}
                    onValueChange={(value) => setStatus(value as Status)}
                    className="w-44"
                  >
                    {proposalStatus.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </dd>
              <dt className="text-ink-muted">Ubicación</dt>
              <dd>
                {work.floor} · Unidad {work.unit}
              </dd>
              <dt className="text-ink-muted">Fecha</dt>
              <dd>{work.date}</dd>
              <dt className="text-ink-muted">Cargó</dt>
              <dd className="flex items-center gap-compact">
                <Avatar name="Sofía Ruiz" size="sm" />
                Sofía Ruiz
              </dd>
            </dl>

            {pendingReason ||
            (status !== items[0].status && status !== "Certificada") ? (
              <div className="flex flex-col gap-compact rounded-control border border-line p-snug">
                <Field
                  label={
                    status === "Bloqueado"
                      ? "¿Por qué está bloqueada?"
                      : "Comentario del cambio"
                  }
                  optional={status !== "Bloqueado"}
                >
                  <Textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={2}
                    placeholder="Contá qué cambió…"
                  />
                </Field>
                <div className="flex justify-end gap-compact">
                  <Button
                    variant="ghost"
                    size="compact"
                    onClick={() => {
                      setStatus(items[0].status);
                      setReason("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="compact"
                    disabled={status === "Bloqueado" && reason.trim() === ""}
                    onClick={() => {
                      addActivity(status, reason.trim() || "Sin comentarios");
                      setReason("");
                    }}
                  >
                    Guardar estado
                  </Button>
                </div>
              </div>
            ) : null}

            <section
              aria-labelledby="fotos-titulo"
              className="flex flex-col gap-compact"
            >
              <div className="flex items-center justify-between">
                <h3 id="fotos-titulo" className="text-label">
                  Fotos{" "}
                  <span className="text-meta font-regular text-ink-muted">
                    · {work.photos}
                  </span>
                </h3>
                <Button variant="ghost" size="compact">
                  <Icon icon={Camera} /> Agregar
                </Button>
              </div>
              {/* Las fotos a la vista: hoy hay que tocar «2 fotos adjuntas» para verlas. */}
              <ul className="grid grid-cols-3 gap-compact">
                {Array.from({ length: work.photos }, (_, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      aria-label={`Ver foto ${index + 1} de ${work.photos}`}
                      onClick={() =>
                        setGallery({
                          count: work.photos,
                          title: "Fotografías del avance",
                        })
                      }
                      className="focus-ring w-full cursor-pointer rounded-control"
                    >
                      <PhotoPlaceholder index={index} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="actividad-titulo"
              className="flex flex-col gap-snug"
            >
              <h3 id="actividad-titulo" className="text-label">
                Actividad
              </h3>
              {/* Línea de tiempo (como GitHub y Linear): quién, qué cambió, cuándo, con su nota. */}
              <ol className="flex flex-col">
                {items.map((item, index) => (
                  <li
                    key={item.id}
                    className="relative flex gap-snug pb-group last:pb-0"
                  >
                    {index < items.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute top-8 bottom-0 left-3.75 w-px bg-line"
                      />
                    ) : null}
                    <Avatar name={item.by} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col gap-related">
                      <p className="text-body">
                        <span className="font-medium">{item.by}</span>{" "}
                        <span className="text-ink-muted">marcó</span>{" "}
                        <Badge
                          tone={statusTone[item.status]}
                          size="compact"
                          className="rounded-compact align-middle"
                        >
                          {sentence(item.status)}
                        </Badge>
                        <span className="text-ink-muted"> · {item.date}</span>
                      </p>
                      <p className="text-body text-ink">{item.comment}</p>
                      {item.photos > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setGallery({
                              count: item.photos,
                              title: "Fotografías del cambio",
                            })
                          }
                          className="focus-ring inline-flex w-fit cursor-pointer items-center gap-related rounded-box text-meta text-ink-muted underline-offset-4 hover:underline"
                        >
                          <Icon icon={Paperclip} size="xs" />{" "}
                          {item.photos === 1
                            ? "1 foto"
                            : `${item.photos} fotos`}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
              <form
                className="flex flex-col gap-compact"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!comment.trim()) return;
                  addActivity(status, comment.trim());
                  setComment("");
                }}
              >
                <Field label="Comentar">
                  <Textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={2}
                    placeholder="Escribí una nota para el equipo…"
                  />
                </Field>
                <Button
                  type="submit"
                  variant="outline"
                  size="compact"
                  className="self-end"
                  disabled={!comment.trim()}
                >
                  Comentar
                </Button>
              </form>
            </section>
          </div>
        </SheetContent>
      </Sheet>
      <Gallery
        open={gallery !== undefined}
        onOpenChange={(value) => (value ? null : setGallery(undefined))}
        count={gallery?.count ?? 0}
        title={gallery?.title ?? ""}
      />
      <ConfirmDialog
        open={certifying}
        onOpenChange={setCertifying}
        title={`¿Certificar «${work.name}»?`}
        description={`${work.floor} · Unidad ${work.unit} · ${work.rubro}. Una vez certificada, solo quien certifica puede cambiar su estado.`}
        confirmLabel="Certificar"
        onConfirm={() => {
          setStatus("Certificada");
          addActivity("Certificada", "Certificada en la inspección.");
          setCertifying(false);
        }}
      />
    </Background>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Obra/Detalle de trabajo",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const ComoHoy: StoryObj = {
  name: "Como hoy",
  render: () => <DetalleHoy />,
};
export const ComoHoyEditando: StoryObj = {
  name: "Como hoy · editando",
  render: () => <DetalleHoy startEditing />,
};
export const ComoHoySinCertificar: StoryObj = {
  name: "Como hoy · sin permiso para certificar",
  render: () => <DetalleHoy canCertify={false} />,
};
export const Propuesta: StoryObj = {
  name: "Propuesta",
  render: () => <DetallePropuesta />,
};
