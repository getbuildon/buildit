import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Eye,
  ImageIcon,
  Mail,
  MessageCircle,
  Monitor,
  Plus,
  Smartphone,
  Sun,
  Trash2,
} from "lucide-react";
import { Badge } from "../atoms/badge/Badge";
import { Button } from "../atoms/button/Button";
import { IconButton } from "../atoms/button/IconButton";
import { Checkbox } from "../atoms/checkbox/Checkbox";
import { Icon } from "../atoms/icon/Icon";
import { Input, Textarea } from "../atoms/input/Input";
import { Label } from "../atoms/label/Label";
import { Progress } from "../atoms/progress/Progress";
import { formatPercent } from "../foundations/format/format";
import { cn } from "../lib/cn";
import { ConfirmDialog } from "../molecules/confirm-dialog/ConfirmDialog";
import { DatePicker } from "../molecules/date-picker/DatePicker";
import { Dialog, DialogContent } from "../molecules/dialog/Dialog";
import { Field } from "../molecules/field/Field";
import { FileField, type FileItem } from "../molecules/file-field/FileField";
import { Notice } from "../molecules/notice/Notice";
import { Segmented } from "../molecules/segmented/Segmented";
import { Select, SelectItem } from "../molecules/select/Select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../molecules/tabs/Tabs";
import { FormActions } from "../organisms/form-section/FormSection";
import { PageHeader } from "../organisms/page-header/PageHeader";
import {
  MobileHeaderToday,
  SidebarProposal,
  SidebarToday,
  TopbarProposal,
} from "./obra/ObraShell";
import { WorkspaceLayout } from "./workspace/WorkspaceLayout";

/* Portal Clientes: el editor de la constructora (clima, novedades, hitos) y «Mi Unidad»,
   lo que ve el comprador. */

/* ------------------------------------------------------------------ Datos */

type MilestoneStatus = "not_started" | "in_progress" | "completed";
type News = { id: string; title: string; description: string; image: boolean };
type Milestone = {
  id: string;
  name: string;
  description: string;
  date?: Date;
  status: MilestoneStatus;
  rubro?: string;
};
type Portal = { city: string; news: News[]; milestones: Milestone[] };

let seq = 0;
const uid = () => `x${++seq}`;

const initialPortal: Portal = {
  city: "Córdoba",
  news: [
    {
      id: "n1",
      title: "Terminamos la losa del piso 4",
      description:
        "Con esto queda completa la estructura de hormigón de la torre.",
      image: true,
    },
    {
      id: "n2",
      title: "Empezó la fachada norte",
      description: "Se están colocando los primeros paños de ladrillo visto.",
      image: true,
    },
  ],
  milestones: [
    {
      id: "m1",
      name: "Fundaciones",
      description: "Pilotes y vigas de fundación.",
      date: new Date(2026, 6, 15),
      status: "completed",
    },
    {
      id: "m2",
      name: "Estructura",
      description: "Columnas, tabiques y losas de los 4 pisos.",
      date: new Date(2026, 10, 30),
      status: "in_progress",
      rubro: "Estructura Horizontal",
    },
    {
      id: "m3",
      name: "Instalaciones",
      description: "Eléctrica, sanitaria y gas.",
      date: new Date(2027, 1, 28),
      status: "not_started",
      rubro: "Instalaciones Eléctricas",
    },
    {
      id: "m4",
      name: "Entrega de unidades",
      description: "",
      date: new Date(2027, 3, 30),
      status: "not_started",
    },
  ],
};

const unit = {
  code: "1A",
  type: "Departamento",
  rooms: 3,
  m2: 72.5,
  floor: "P1",
  progress: 41,
  delivery: "Abril 2027",
};
const shortDate = (date?: Date) =>
  date
    ? date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";
const statusLabel: Record<MilestoneStatus, string> = {
  not_started: "Sin iniciar",
  in_progress: "En proceso",
  completed: "Completado",
};

function usePortal(initial: Portal) {
  const [portal, setPortal] = useState(initial);
  const [saved, setSaved] = useState(initial);
  return {
    portal,
    setPortal,
    dirty: JSON.stringify(portal) !== JSON.stringify(saved),
    save: () => setSaved(portal),
    discard: () => setPortal(saved),
  };
}

/** Foto de ejemplo: un degradé (el catálogo no lleva fotos reales). */
function PhotoPlaceholder({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex items-center justify-center bg-linear-135 from-earth to-earth-deep text-on-earth-muted",
        className,
      )}
    >
      <Icon icon={ImageIcon} size="lg" />
    </div>
  );
}

/* ================================================================== Mi Unidad · como hoy */

function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0)
    return (
      <p className="text-body text-ink-muted">
        Todavía no hay hitos de construcción publicados.
      </p>
    );
  return (
    <ol className="flex flex-col">
      {milestones.map((milestone, index) => {
        const last = index === milestones.length - 1;
        const done = milestone.status === "completed";
        const current = milestone.status === "in_progress";
        return (
          <li
            key={milestone.id}
            aria-current={current ? "step" : undefined}
            className="flex gap-group"
          >
            <div className="flex w-7 shrink-0 flex-col items-center">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-pill border-2",
                  done && "border-fn-ok-line bg-fn-ok-canvas text-fn-ok",
                  current &&
                    "border-fn-info-line bg-fn-info-canvas text-fn-info",
                  !done &&
                    !current &&
                    "border-line bg-canvas-raised text-ink-muted",
                )}
              >
                <Icon
                  icon={done ? Check : Circle}
                  size="xs"
                  className={current ? "fill-current" : undefined}
                />
              </span>
              {last ? null : (
                <span
                  aria-hidden
                  className={cn(
                    "mt-related min-h-6 w-0.5 flex-1 rounded-pill",
                    done
                      ? "bg-fn-ok-line"
                      : current
                        ? "bg-fn-info-line"
                        : "bg-line",
                  )}
                />
              )}
            </div>
            <div
              className={cn(
                "flex min-w-0 flex-1 gap-snug",
                last ? "pb-0" : "pb-block",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-reading font-medium">
                  {milestone.name}
                  {/* Hoy el estado de los completos y pendientes es solo color e ícono. */}
                  <span className="sr-only">
                    , {statusLabel[milestone.status].toLowerCase()}
                  </span>
                </p>
                {milestone.description ? (
                  <p className="pt-0.5 text-body text-ink-muted">
                    {milestone.description}
                  </p>
                ) : null}
                {current ? (
                  <Badge
                    tone="info"
                    size="compact"
                    className="mt-compact rounded-compact"
                  >
                    En progreso
                  </Badge>
                ) : null}
              </div>
              {milestone.date ? (
                <Badge
                  tone={done ? "ok" : current ? "info" : "neutral"}
                  className="shrink-0 rounded-compact font-regular"
                >
                  {done ? "✓ " : "Est. "}
                  {shortDate(milestone.date)}
                </Badge>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function NewsCarousel({ news }: { news: News[] }) {
  const [index, setIndex] = useState(0);
  if (news.length === 0) {
    return (
      <p className="grid h-70 place-items-center rounded-surface border border-line bg-canvas-raised px-block text-center text-body text-ink-muted shadow-hint sm:h-95">
        Todavía no hay novedades publicadas en el portal.
      </p>
    );
  }
  const item = news[Math.min(index, news.length - 1)];
  const go = (next: number) => setIndex((next + news.length) % news.length);
  return (
    // Carrusel con nombre y diapositiva actual anunciada («Novedad 1 de 2»).
    <div
      role="group"
      aria-roledescription="carrusel"
      aria-label="Novedades destacadas"
      className="relative h-70 overflow-hidden rounded-surface shadow-hint sm:h-95"
    >
      <PhotoPlaceholder label={item.title} className="absolute inset-0" />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-veil-strong via-veil-soft/50 to-transparent"
      />
      <div
        className="relative flex h-full flex-col justify-end p-block text-on-earth"
        data-theme="oscuro"
      >
        <div aria-live="polite" aria-atomic>
          <p className="text-meta text-on-earth-muted">
            Novedad {index + 1} de {news.length}
          </p>
          <h3 className="pt-1.5 font-display text-heading sm:text-title">
            {item.title}
          </h3>
          {item.description ? (
            <p className="max-w-140 pt-compact text-body">{item.description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3.5 pt-5">
          <div className="flex items-center gap-1.5">
            {news.map((entry, dot) => (
              <button
                key={entry.id}
                type="button"
                aria-label={`Ir a la novedad ${dot + 1}`}
                aria-current={dot === index ? "true" : undefined}
                onClick={() => go(dot)}
                className="focus-ring grid size-6 cursor-pointer place-items-center rounded-pill"
              >
                <span
                  className={cn(
                    "rounded-pill transition-all",
                    dot === index
                      ? "h-1.25 w-5 bg-action"
                      : "size-1.25 bg-on-earth-muted",
                  )}
                />
              </button>
            ))}
          </div>
          {news.length > 1 ? (
            <div className="ml-auto flex gap-1.5">
              <IconButton
                icon={ChevronLeft}
                label="Novedad anterior"
                size="compact"
                tooltip={false}
                onClick={() => go(index - 1)}
                className="text-on-earth"
              />
              <IconButton
                icon={ChevronRight}
                label="Novedad siguiente"
                size="compact"
                tooltip={false}
                onClick={() => go(index + 1)}
                className="text-on-earth"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MiUnidadHoy({ portal }: { portal: Portal }) {
  const [unitOpen, setUnitOpen] = useState(false);
  return (
    <div className="mx-auto flex w-full max-w-252.5 flex-col gap-chapter pb-10 pt-block sm:pt-20">
      <header className="flex flex-col gap-group sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-headline">
            Hola Valeria <span aria-hidden>👋</span>
          </h1>
          <p className="pt-related text-reading">
            Seguí el avance de obra en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-block rounded-control border border-line bg-canvas-raised px-4.25 py-3.25 shadow-hint">
          <p className="text-heading font-ui">
            24°<span className="text-meta text-ink-muted">C</span>
          </p>
          <div className="flex flex-col text-meta">
            <span className="flex items-center gap-related font-medium">
              <Icon icon={Sun} size="xs" className="text-fn-caution" />{" "}
              {portal.city || "Sin ciudad"}
            </span>
            <span className="text-ink-muted">Despejado</span>
          </div>
        </div>
      </header>

      <section aria-labelledby="mi-unidad" className="flex flex-col gap-snug">
        <h2 id="mi-unidad" className="text-heading">
          Mi unidad en Torre Alamo
        </h2>
        <button
          type="button"
          onClick={() => setUnitOpen(true)}
          className="focus-ring motion-color flex h-28 cursor-pointer overflow-hidden rounded-surface border border-line bg-canvas-raised text-left shadow-hint hover:border-line-strong"
        >
          <span className="grid w-27.5 shrink-0 place-items-center bg-canvas-sunken text-ink-subtle">
            <Icon icon={Building2} size="lg" />
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-between gap-snug px-4.5">
            <span className="flex min-w-0 flex-col items-start gap-compact">
              <span className="flex items-center gap-compact">
                <span className="text-reading font-medium">
                  Unidad {unit.code}
                </span>
                <Badge tone="action" size="compact">
                  {unit.type}
                </Badge>
              </span>
              <span className="text-body text-ink-muted">
                {unit.rooms} ambientes · {unit.m2.toLocaleString("es-AR")} m² ·
                Nivel {unit.floor}
              </span>
            </span>
            <span className="hidden shrink-0 items-center gap-compact rounded-control border border-line bg-canvas px-3.25 py-2.25 sm:flex">
              <Icon icon={CalendarDays} size="xs" className="text-ink-muted" />
              <span className="flex flex-col">
                <span className="text-micro font-regular text-ink-muted">
                  Entrega estimada
                </span>
                <span className="text-label">{unit.delivery}</span>
              </span>
            </span>
          </span>
        </button>
      </section>

      <section aria-labelledby="novedades" className="flex flex-col gap-snug">
        <h2 id="novedades" className="text-heading">
          Últimas novedades
        </h2>
        <NewsCarousel news={portal.news} />
      </section>

      <section
        aria-labelledby="hitos"
        className="rounded-surface border border-line bg-canvas-raised p-block shadow-hint"
      >
        <h2 id="hitos" className="text-heading">
          Hitos de Construcción
        </h2>
        <div className="pt-group">
          <MilestoneTimeline milestones={portal.milestones} />
        </div>
      </section>

      <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
        <DialogContent
          size="wide"
          title={`Unidad ${unit.code}`}
          description={`${unit.type} · ${unit.rooms} ambientes · ${unit.m2.toLocaleString("es-AR")} m²`}
        >
          <div className="grid gap-compact sm:grid-cols-2">
            <PhotoPlaceholder
              label={`Render de la unidad ${unit.code}`}
              className="aspect-4/3 rounded-control"
            />
            <PhotoPlaceholder
              label={`Plano de la unidad ${unit.code}`}
              className="aspect-4/3 rounded-control"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================== Editor · como hoy */

type Errors = Record<string, string>;

function validate(portal: Portal): Errors {
  const errors: Errors = {};
  portal.news.forEach((item) => {
    if (!item.title.trim())
      errors[`${item.id}-title`] = "El título es obligatorio.";
    if (!item.description.trim())
      errors[`${item.id}-description`] = "La descripción es obligatoria.";
    if (!item.image) errors[`${item.id}-image`] = "La imagen es obligatoria.";
  });
  portal.milestones.forEach((item) => {
    if (!item.name.trim())
      errors[`${item.id}-name`] = "El nombre es obligatorio.";
    if (!item.date)
      errors[`${item.id}-date`] = "La fecha estimada es obligatoria.";
  });
  return errors;
}

function Card({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
    >
      <div>
        <h2 id={id} className="text-section font-regular">
          {title}
        </h2>
        {description ? (
          <p className="text-body text-ink-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const imageFiles = (item: News): FileItem[] =>
  item.image
    ? [
        {
          id: `${item.id}-img`,
          name: `${item.title || "novedad"}.webp`,
          status: "done",
        },
      ]
    : [];

function EditorHoy({ showErrors = false }: { showErrors?: boolean }) {
  const state = usePortal(
    showErrors
      ? {
          ...initialPortal,
          news: [
            ...initialPortal.news,
            { id: "n3", title: "", description: "", image: false },
          ],
        }
      : initialPortal,
  );
  const { portal, setPortal } = state;
  const [errors, setErrors] = useState<Errors>(
    showErrors
      ? validate({
          ...initialPortal,
          news: [
            ...initialPortal.news,
            { id: "n3", title: "", description: "", image: false },
          ],
        })
      : {},
  );
  const [preview, setPreview] = useState(false);
  const [removing, setRemoving] = useState<{
    title: string;
    text: string;
    run: () => void;
  }>();
  const [discarding, setDiscarding] = useState(false);
  const errorCount = Object.keys(errors).length;
  const setNews = (id: string, patch: Partial<News>) =>
    setPortal({
      ...portal,
      news: portal.news.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  const setMilestone = (id: string, patch: Partial<Milestone>) =>
    setPortal({
      ...portal,
      milestones: portal.milestones.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  const clear = (key: string) => {
    if (!errors[key]) return;
    const next = { ...errors };
    delete next[key];
    setErrors(next);
  };

  return (
    <WorkspaceLayout
      sidebar={<SidebarToday active="portal-clientes" />}
      topbar={<MobileHeaderToday active="portal-clientes" />}
    >
      {preview ? (
        <div className="flex flex-col pt-block">
          <Notice
            tone="caution"
            action={
              <Button
                variant="outline"
                size="compact"
                onClick={() => setPreview(false)}
              >
                Volver a editar
              </Button>
            }
          >
            Estás viendo la vista previa del portal de clientes, con los cambios
            sin guardar.
          </Notice>
          <MiUnidadHoy portal={portal} />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-252.5 flex-col gap-5 py-compact sm:py-block">
          <div className="flex flex-col gap-group sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-compact">
              <h1 className="text-title">Portal de Clientes</h1>
              <p className="text-body text-ink-muted">
                Mantené actualizada la información y el contenido visible para
                tus clientes.
              </p>
            </div>
            <Button variant="outline" onClick={() => setPreview(true)}>
              <Icon icon={Eye} /> Vista previa
            </Button>
          </div>

          <Card
            id="clima"
            title="Clima en Mi Unidad"
            description="Ciudad que se usa para mostrar el clima a tus clientes."
          >
            {/* Hoy «Ciudad» es un texto suelto, no el nombre del campo. */}
            <Field label="Ciudad">
              <Input
                value={portal.city}
                placeholder="Buenos Aires"
                onChange={(event) =>
                  setPortal({ ...portal, city: event.target.value })
                }
              />
            </Field>
          </Card>

          <Card id="novedades-editor" title="Banner de Últimas Novedades">
            {portal.news.length === 0 ? (
              <p className="text-body text-ink-muted">
                Todavía no hay novedades. Agregá la primera para mostrarla en el
                portal.
              </p>
            ) : null}
            {portal.news.map((item, index) => (
              <fieldset
                key={item.id}
                className="flex flex-col gap-snug border-t border-line pt-group first-of-type:border-t-0 first-of-type:pt-0"
              >
                <div className="flex items-center justify-between">
                  <legend className="text-label">Novedad {index + 1}</legend>
                  <IconButton
                    icon={Trash2}
                    label={`Eliminar la novedad ${index + 1}${item.title ? ` «${item.title}»` : ""}`}
                    size="compact"
                    onClick={() =>
                      setRemoving({
                        title: "¿Eliminar la novedad?",
                        text: `Vas a eliminar la novedad ${index + 1}${item.title ? ` «${item.title}»` : ""}.`,
                        run: () =>
                          setPortal({
                            ...portal,
                            news: portal.news.filter((n) => n.id !== item.id),
                          }),
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-snug sm:flex-row">
                  {/* Hoy el título y la descripción usan el texto gris como nombre; los errores, en un tooltip. */}
                  <div className="flex min-w-0 flex-1 flex-col gap-snug">
                    <Field
                      label="Título"
                      required
                      error={errors[`${item.id}-title`]}
                    >
                      <Input
                        value={item.title}
                        onChange={(event) => (
                          setNews(item.id, { title: event.target.value }),
                          clear(`${item.id}-title`)
                        )}
                      />
                    </Field>
                    <Field
                      label="Descripción"
                      required
                      error={errors[`${item.id}-description`]}
                    >
                      <Textarea
                        rows={3}
                        value={item.description}
                        onChange={(event) => (
                          setNews(item.id, { description: event.target.value }),
                          clear(`${item.id}-description`)
                        )}
                      />
                    </Field>
                  </div>
                  <Field
                    label="Imagen"
                    required
                    error={errors[`${item.id}-image`]}
                    className="sm:w-60"
                  >
                    {/* Hoy dice «PNG, JPG hasta 10 MB» en 8 px, aunque también acepta WebP, GIF y HEIC. */}
                    <FileField
                      files={imageFiles(item)}
                      onAdd={() => (
                        setNews(item.id, { image: true }),
                        clear(`${item.id}-image`)
                      )}
                      onRemove={() => setNews(item.id, { image: false })}
                      accept="image/*"
                      acceptLabel="JPG, PNG, WebP o HEIC"
                      maxSizeMB={10}
                      maxFiles={1}
                    />
                  </Field>
                </div>
              </fieldset>
            ))}
            <Button
              variant="outline"
              className="self-start"
              onClick={() =>
                setPortal({
                  ...portal,
                  news: [
                    ...portal.news,
                    { id: uid(), title: "", description: "", image: false },
                  ],
                })
              }
            >
              <Icon icon={Plus} /> Agregar novedad
            </Button>
          </Card>

          <Card id="hitos-editor" title="Hitos de la construcción">
            {portal.milestones.map((item, index) => (
              <fieldset
                key={item.id}
                className="flex flex-col gap-snug rounded-control bg-canvas-sunken/50 p-group lg:flex-row lg:items-start"
              >
                <legend className="sr-only">Hito {index + 1}</legend>
                <div className="flex min-w-0 flex-1 flex-col gap-snug">
                  <Field
                    label="Nombre del hito"
                    required
                    error={errors[`${item.id}-name`]}
                  >
                    <Input
                      value={item.name}
                      onChange={(event) => (
                        setMilestone(item.id, { name: event.target.value }),
                        clear(`${item.id}-name`)
                      )}
                      className="text-reading font-medium"
                    />
                  </Field>
                  <Field label="Descripción" optional>
                    <Textarea
                      rows={2}
                      value={item.description}
                      onChange={(event) =>
                        setMilestone(item.id, {
                          description: event.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="flex flex-wrap items-start gap-snug">
                  <Field
                    label="Fecha estimada"
                    required
                    error={errors[`${item.id}-date`]}
                    className="w-50"
                  >
                    <DatePicker
                      value={item.date}
                      onChange={(date) => (
                        setMilestone(item.id, { date }),
                        clear(`${item.id}-date`)
                      )}
                    />
                  </Field>
                  <div className="flex flex-col gap-compact">
                    <p className="text-label">Estado</p>
                    {/* Hoy los tres botones no dicen cuál está elegido. */}
                    <Segmented
                      label={`Estado de ${item.name || `hito ${index + 1}`}`}
                      value={item.status}
                      onValueChange={(status) =>
                        setMilestone(item.id, {
                          status: status as MilestoneStatus,
                        })
                      }
                      options={(
                        Object.keys(statusLabel) as MilestoneStatus[]
                      ).map((value) => ({ value, label: statusLabel[value] }))}
                    />
                  </div>
                  <IconButton
                    icon={Trash2}
                    label={`Eliminar el hito ${item.name || index + 1}`}
                    className="mt-7"
                    onClick={() =>
                      setRemoving({
                        title: "¿Eliminar el hito?",
                        text: `Vas a eliminar el hito ${item.name ? `«${item.name}»` : index + 1}.`,
                        run: () =>
                          setPortal({
                            ...portal,
                            milestones: portal.milestones.filter(
                              (m) => m.id !== item.id,
                            ),
                          }),
                      })
                    }
                  />
                </div>
              </fieldset>
            ))}
            <Button
              variant="outline"
              className="self-start"
              onClick={() =>
                setPortal({
                  ...portal,
                  milestones: [
                    ...portal.milestones,
                    {
                      id: uid(),
                      name: "",
                      description: "",
                      status: "not_started",
                    },
                  ],
                })
              }
            >
              <Icon icon={Plus} /> Agregar hito
            </Button>
          </Card>
        </div>
      )}

      {(state.dirty || errorCount > 0) && !preview ? (
        <section
          aria-label="Cambios sin guardar"
          className="sticky bottom-0 z-(--z-sticky) mx-auto w-full max-w-252.5 px-(--layout-margin)"
        >
          <div className="flex items-center justify-end gap-compact rounded-t-control border border-b-0 border-action/20 bg-action-soft px-block py-group sm:justify-between">
            {/* Hoy el error no se anuncia: acá es una región que se lee al cambiar. */}
            <div aria-live="polite" className="hidden sm:block">
              <p className="text-reading font-medium">Cambios sin guardar</p>
              {errorCount > 0 ? (
                <p className="text-body text-fn-danger">
                  {errorCount === 1
                    ? "1 error no permite guardar."
                    : `${errorCount} errores no permiten guardar.`}
                </p>
              ) : (
                <p className="text-body">
                  Guardá para que los cambios se vean en el portal.
                </p>
              )}
            </div>
            <div className="flex w-full gap-compact sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => setDiscarding(true)}
              >
                Descartar cambios
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                onClick={() => {
                  const next = validate(portal);
                  setErrors(next);
                  if (Object.keys(next).length === 0) state.save();
                }}
              >
                <Icon icon={Check} /> Guardar cambios
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={removing !== undefined}
        onOpenChange={(value) => (value ? null : setRemoving(undefined))}
        title={removing?.title ?? ""}
        description={removing?.text ?? ""}
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={() => {
          removing?.run();
          setRemoving(undefined);
        }}
      />
      <ConfirmDialog
        open={discarding}
        onOpenChange={setDiscarding}
        title="¿Descartar los cambios?"
        description="Se pierden los cambios que no guardaste en el portal de clientes."
        confirmLabel="Descartar cambios"
        cancelLabel="Seguir editando"
        tone="danger"
        onConfirm={() => {
          state.discard();
          setErrors({});
          setDiscarding(false);
        }}
      />
    </WorkspaceLayout>
  );
}

/* ================================================================== Propuesta */

const rubroOptions = [
  "Estructura Horizontal",
  "Mampostería",
  "Instalaciones Eléctricas",
  "Revoques",
  "Pintura",
];

/** Mi Unidad propuesta: lo que más le importa al comprador, arriba y sin carrusel. */
function MiUnidadPropuesta({
  portal,
  compact = false,
}: {
  portal: Portal;
  compact?: boolean;
}) {
  const next = portal.milestones.find((item) => item.status !== "completed");
  return (
    <div
      className={cn(
        "flex flex-col gap-block",
        compact ? "p-group" : "mx-auto w-full max-w-252.5 py-block",
      )}
    >
      <header className="flex flex-col gap-related">
        <p className="text-body text-ink-muted">
          Torre Alamo · Unidad {unit.code}
        </p>
        <h1 className={compact ? "text-heading" : "text-headline"}>
          Hola, Valeria
        </h1>
      </header>

      {/* Lo principal: cuánto avanzó su unidad, qué viene y cuándo se entrega. */}
      <section
        aria-labelledby="tu-avance"
        className={cn(
          "grid gap-group rounded-surface border border-line bg-canvas-raised p-block",
          !compact && "md:grid-cols-[minmax(0,1fr)_16rem]",
        )}
      >
        <div className="flex flex-col gap-snug">
          <h2 id="tu-avance" className="text-label text-ink-muted">
            Avance de tu unidad
          </h2>
          <p className="text-metric">{formatPercent(unit.progress)}</p>
          <Progress
            value={unit.progress}
            label="Avance de tu unidad"
            tone="stage"
          />
          <p className="text-meta text-ink-muted">Subió 3 puntos este mes.</p>
        </div>
        <dl className="flex flex-col gap-snug border-line text-body md:border-l md:pl-group">
          <div>
            <dt className="text-meta text-ink-muted">Próximo hito</dt>
            <dd className="text-label">
              {next
                ? `${next.name} · est. ${shortDate(next.date)}`
                : "Todo terminado"}
            </dd>
          </div>
          <div>
            <dt className="text-meta text-ink-muted">Entrega estimada</dt>
            <dd className="text-label">{unit.delivery}</dd>
          </div>
          <div>
            <dt className="text-meta text-ink-muted">Clima en la obra</dt>
            <dd className="flex items-center gap-related text-label">
              <Icon icon={Sun} size="xs" className="text-fn-caution" /> 24 °C en{" "}
              {portal.city || "—"}
            </dd>
          </div>
        </dl>
      </section>

      <div
        className={cn(
          "grid gap-block",
          !compact && "lg:grid-cols-[minmax(0,1fr)_22rem]",
        )}
      >
        {/* Novedades como lista (como un feed), no un carrusel que pasa solo y esconde contenido. */}
        <section
          aria-labelledby="novedades-feed"
          className="flex flex-col gap-snug"
        >
          <h2 id="novedades-feed" className="text-heading">
            Novedades
          </h2>
          {portal.news.length === 0 ? (
            <p className="text-body text-ink-muted">
              Todavía no hay novedades.
            </p>
          ) : null}
          <ul className="flex flex-col gap-snug">
            {portal.news.map((item) => (
              <li
                key={item.id}
                className="flex gap-snug overflow-hidden rounded-surface border border-line bg-canvas-raised"
              >
                {item.image ? (
                  <PhotoPlaceholder
                    label={item.title}
                    className="w-28 shrink-0 sm:w-40"
                  />
                ) : null}
                <div className="flex min-w-0 flex-col gap-related p-snug">
                  <p className="text-meta text-ink-muted">Hace 2 días</p>
                  <h3 className="text-label">{item.title || "Sin título"}</h3>
                  <p className="line-clamp-2 text-body text-ink-muted">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section
          aria-labelledby="hitos-prop"
          className="flex flex-col gap-snug"
        >
          <h2 id="hitos-prop" className="text-heading">
            Etapas de la obra
          </h2>
          <div className="rounded-surface border border-line bg-canvas-raised p-group">
            <MilestoneTimeline milestones={portal.milestones} />
          </div>
          <div className="flex flex-col gap-compact rounded-surface border border-line bg-canvas-raised p-group">
            <p className="text-label">¿Tenés dudas sobre tu unidad?</p>
            <p className="text-body text-ink-muted">Escribile a Grupo Alamo.</p>
            <div className="flex flex-wrap gap-compact">
              <Button size="compact" variant="outline">
                <Icon icon={MessageCircle} size="xs" /> WhatsApp
              </Button>
              <Button size="compact" variant="outline">
                <Icon icon={Mail} size="xs" /> Mail
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function EditorPropuesta() {
  const state = usePortal(initialPortal);
  const { portal, setPortal } = state;
  const [device, setDevice] = useState("celular");
  const [notify, setNotify] = useState(true);
  const setMilestones = (milestones: Milestone[]) =>
    setPortal({ ...portal, milestones });
  const moveMilestone = (index: number, delta: number) => {
    const list = [...portal.milestones];
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setMilestones(list);
  };

  return (
    <WorkspaceLayout
      sidebar={<SidebarProposal active="portal-clientes" />}
      topbar={<TopbarProposal active="portal-clientes" />}
      header={
        <PageHeader
          title="Portal de clientes"
          description="Lo que ven los compradores. La vista previa se actualiza mientras editás."
        />
      }
    >
      {/* Editor y vista previa lado a lado (como Shopify o Webflow): sin modo aparte. */}
      <div className="grid gap-block xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Tabs defaultValue="novedades">
          <TabsList aria-label="Qué editar">
            <TabsTrigger value="novedades">Novedades</TabsTrigger>
            <TabsTrigger value="etapas">Etapas</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          <TabsContent
            value="novedades"
            className="flex flex-col gap-group pt-block"
          >
            {portal.news.map((item, index) => (
              <fieldset
                key={item.id}
                className="flex flex-col gap-snug rounded-control border border-line p-group sm:flex-row"
              >
                <legend className="sr-only">Novedad {index + 1}</legend>
                <div className="flex min-w-0 flex-1 flex-col gap-snug">
                  <Field label="Título" required>
                    <Input
                      value={item.title}
                      onChange={(event) =>
                        setPortal({
                          ...portal,
                          news: portal.news.map((n) =>
                            n.id === item.id
                              ? { ...n, title: event.target.value }
                              : n,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="Descripción" required>
                    <Textarea
                      rows={2}
                      value={item.description}
                      onChange={(event) =>
                        setPortal({
                          ...portal,
                          news: portal.news.map((n) =>
                            n.id === item.id
                              ? { ...n, description: event.target.value }
                              : n,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field
                    label="Quién la ve"
                    description="Por ejemplo, solo los compradores del piso 1."
                  >
                    <Select
                      value="todos"
                      onValueChange={() => undefined}
                      size="compact"
                    >
                      <SelectItem value="todos">Todos los clientes</SelectItem>
                      <SelectItem value="piso-1">
                        Clientes del piso 1
                      </SelectItem>
                      <SelectItem value="piso-2">
                        Clientes del piso 2
                      </SelectItem>
                    </Select>
                  </Field>
                </div>
                <div className="flex flex-col gap-compact sm:w-52">
                  <Field label="Foto" required>
                    <FileField
                      files={imageFiles(item)}
                      onAdd={() => undefined}
                      onRemove={() => undefined}
                      accept="image/*"
                      acceptLabel="JPG, PNG, WebP o HEIC"
                      maxFiles={1}
                      maxSizeMB={10}
                    />
                  </Field>
                  <Button
                    variant="danger-quiet"
                    size="compact"
                    className="self-end"
                    onClick={() =>
                      setPortal({
                        ...portal,
                        news: portal.news.filter((n) => n.id !== item.id),
                      })
                    }
                  >
                    <Icon icon={Trash2} size="xs" /> Eliminar
                  </Button>
                </div>
              </fieldset>
            ))}
            <Button
              variant="outline"
              className="self-start"
              onClick={() =>
                setPortal({
                  ...portal,
                  news: [
                    { id: uid(), title: "", description: "", image: false },
                    ...portal.news,
                  ],
                })
              }
            >
              <Icon icon={Plus} /> Nueva novedad
            </Button>
          </TabsContent>
          <TabsContent
            value="etapas"
            className="flex flex-col gap-group pt-block"
          >
            <ol className="flex flex-col gap-snug">
              {portal.milestones.map((item, index) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-snug rounded-control border border-line p-group"
                >
                  <div className="flex items-start gap-snug">
                    <div className="flex flex-col">
                      <IconButton
                        icon={ArrowUp}
                        label={`Subir ${item.name}`}
                        size="compact"
                        tooltip={false}
                        disabled={index === 0}
                        onClick={() => moveMilestone(index, -1)}
                      />
                      <IconButton
                        icon={ArrowDown}
                        label={`Bajar ${item.name}`}
                        size="compact"
                        tooltip={false}
                        disabled={index === portal.milestones.length - 1}
                        onClick={() => moveMilestone(index, 1)}
                      />
                    </div>
                    <div className="grid min-w-0 flex-1 gap-snug sm:grid-cols-2">
                      <Field label="Etapa" required>
                        <Input
                          value={item.name}
                          onChange={(event) =>
                            setMilestones(
                              portal.milestones.map((m) =>
                                m.id === item.id
                                  ? { ...m, name: event.target.value }
                                  : m,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field label="Fecha estimada" required>
                        <DatePicker
                          value={item.date}
                          onChange={(date) =>
                            setMilestones(
                              portal.milestones.map((m) =>
                                m.id === item.id ? { ...m, date } : m,
                              ),
                            )
                          }
                        />
                      </Field>
                      {/* Vincular la etapa a un rubro: el estado sale solo del avance cargado, sin acordarse de cambiarlo. */}
                      <Field
                        label="Se actualiza con el rubro"
                        optional
                        description={
                          item.rubro
                            ? `Hoy: ${item.status === "completed" ? "completo" : item.status === "in_progress" ? "62% del rubro" : "sin empezar"}.`
                            : "Sin rubro, el estado se marca a mano."
                        }
                      >
                        <Select
                          value={item.rubro ?? "manual"}
                          onValueChange={(rubro) =>
                            setMilestones(
                              portal.milestones.map((m) =>
                                m.id === item.id
                                  ? {
                                      ...m,
                                      rubro:
                                        rubro === "manual" ? undefined : rubro,
                                    }
                                  : m,
                              ),
                            )
                          }
                          size="compact"
                        >
                          <SelectItem value="manual">Marcar a mano</SelectItem>
                          {rubroOptions.map((rubro) => (
                            <SelectItem key={rubro} value={rubro}>
                              {rubro}
                            </SelectItem>
                          ))}
                        </Select>
                      </Field>
                      {item.rubro ? (
                        <div className="flex flex-col gap-compact">
                          <p className="text-label">Estado</p>
                          <Badge
                            tone={
                              item.status === "completed"
                                ? "ok"
                                : item.status === "in_progress"
                                  ? "info"
                                  : "neutral"
                            }
                            className="self-start rounded-compact"
                          >
                            {statusLabel[item.status]}
                          </Badge>
                        </div>
                      ) : (
                        <Field label="Estado">
                          <Select
                            value={item.status}
                            onValueChange={(status) =>
                              setMilestones(
                                portal.milestones.map((m) =>
                                  m.id === item.id
                                    ? {
                                        ...m,
                                        status: status as MilestoneStatus,
                                      }
                                    : m,
                                ),
                              )
                            }
                            size="compact"
                          >
                            {(
                              Object.keys(statusLabel) as MilestoneStatus[]
                            ).map((value) => (
                              <SelectItem key={value} value={value}>
                                {statusLabel[value]}
                              </SelectItem>
                            ))}
                          </Select>
                        </Field>
                      )}
                    </div>
                    <IconButton
                      icon={Trash2}
                      label={`Eliminar la etapa ${item.name}`}
                      size="compact"
                      onClick={() =>
                        setMilestones(
                          portal.milestones.filter((m) => m.id !== item.id),
                        )
                      }
                    />
                  </div>
                </li>
              ))}
            </ol>
            <Button
              variant="outline"
              className="self-start"
              onClick={() =>
                setMilestones([
                  ...portal.milestones,
                  {
                    id: uid(),
                    name: "",
                    description: "",
                    status: "not_started",
                  },
                ])
              }
            >
              <Icon icon={Plus} /> Nueva etapa
            </Button>
          </TabsContent>
          <TabsContent
            value="general"
            className="flex max-w-reading flex-col gap-group pt-block"
          >
            <Field
              label="Ciudad para el clima"
              description="Se muestra la temperatura de la obra en el portal."
            >
              <Input
                value={portal.city}
                onChange={(event) =>
                  setPortal({ ...portal, city: event.target.value })
                }
              />
            </Field>
            <div className="flex items-start gap-compact">
              <Checkbox
                id="avisar"
                checked={notify}
                onCheckedChange={(value) => setNotify(value === true)}
                className="mt-0.5"
              />
              <Label htmlFor="avisar" variant="option">
                Avisar por mail a los clientes cuando publique una novedad
              </Label>
            </div>
          </TabsContent>
        </Tabs>

        <aside
          aria-label="Vista previa del portal"
          className="flex flex-col gap-snug xl:sticky xl:top-block xl:self-start"
        >
          <div className="flex items-center justify-between gap-snug">
            <p className="text-label">Vista previa</p>
            <Segmented
              size="compact"
              label="Ver como"
              value={device}
              onValueChange={setDevice}
              options={[
                {
                  value: "celular",
                  label: (
                    <>
                      <Icon icon={Smartphone} size="xs" />
                      <span className="sr-only">Celular</span>
                    </>
                  ),
                },
                {
                  value: "compu",
                  label: (
                    <>
                      <Icon icon={Monitor} size="xs" />
                      <span className="sr-only">Computadora</span>
                    </>
                  ),
                },
              ]}
            />
          </div>
          <div
            className={cn(
              "mx-auto w-full overflow-hidden rounded-surface border-4 border-canvas-inverse bg-canvas shadow-overlay",
              device === "celular" ? "max-w-90" : "max-w-full",
            )}
          >
            <div className="max-h-160 overflow-y-auto" inert>
              <MiUnidadPropuesta portal={portal} compact />
            </div>
          </div>
        </aside>
      </div>
      <FormActions
        dirty={state.dirty}
        onDiscard={state.discard}
        onSave={state.save}
        saveLabel={notify ? "Publicar y avisar" : "Publicar"}
        className="-mx-(--layout-margin)"
      />
    </WorkspaceLayout>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Obra/Portal Clientes",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const EditorComoHoy: StoryObj = {
  name: "Editor · como hoy",
  render: () => <EditorHoy />,
};
export const EditorComoHoyErrores: StoryObj = {
  name: "Editor · como hoy · con errores",
  render: () => <EditorHoy showErrors />,
};
export const EditorPropuestaStory: StoryObj = {
  name: "Editor · propuesta",
  render: () => <EditorPropuesta />,
};
export const MiUnidadComoHoy: StoryObj = {
  name: "Mi Unidad (cliente) · como hoy",
  render: () => (
    <WorkspaceLayout
      sidebar={<SidebarToday active="mi-unidad" />}
      topbar={<MobileHeaderToday active="mi-unidad" />}
    >
      <MiUnidadHoy portal={initialPortal} />
    </WorkspaceLayout>
  ),
};
export const MiUnidadPropuestaStory: StoryObj = {
  name: "Mi Unidad (cliente) · propuesta",
  render: () => (
    <WorkspaceLayout
      sidebar={<SidebarProposal active="mi-unidad" />}
      topbar={<TopbarProposal active="mi-unidad" />}
    >
      <MiUnidadPropuesta portal={initialPortal} />
    </WorkspaceLayout>
  ),
};
