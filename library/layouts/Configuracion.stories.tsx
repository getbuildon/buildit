import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Building2, CalendarDays, Check, MapPin } from "lucide-react";
import { Button } from "../atoms/button/Button";
import { Icon } from "../atoms/icon/Icon";
import { Input } from "../atoms/input/Input";
import { Link } from "../atoms/link/Link";
import { formatArea } from "../foundations/format/format";
import { ConfirmDialog } from "../molecules/confirm-dialog/ConfirmDialog";
import { DatePicker } from "../molecules/date-picker/DatePicker";
import { Field } from "../molecules/field/Field";
import { InputGroup } from "../molecules/input-group/InputGroup";
import { Notice } from "../molecules/notice/Notice";
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

/* Configuración (app/project/[projectId]/configuracion): datos de la obra, niveles y
   locales, rubros y tareas con su incidencia, y qué tareas lleva cada unidad. */

/* ------------------------------------------------------------------ Datos */

import {
  RubrosProposal,
  RubrosToday,
  SettingsCard,
  StructureProposal,
  StructureToday,
  UnitTasksMatrix,
  UnitTasksTree,
  toNumber,
  useConfigState,
  weightsOf,
} from "./obra/ConfigParts";
function ConfiguracionHoy({ surfaceOver = false }: { surfaceOver?: boolean }) {
  const state = useConfigState();
  const [name, setName] = useState("Torre Alamo");
  const [location, setLocation] = useState("Av. Siempreviva 742, Córdoba");
  const [surface, setSurface] = useState(surfaceOver ? "2.400,00" : "1.240,00");
  const [start, setStart] = useState<Date | undefined>(new Date(2026, 5, 1));
  const [end, setEnd] = useState<Date | undefined>(new Date(2027, 3, 30));
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    text: string;
    run: () => void;
  }>();
  const touch = () => state.setDirty(true);
  const ask = (text: string) => (run: () => void) =>
    setPendingDelete({ text, run });

  return (
    <WorkspaceLayout
      sidebar={<SidebarToday active="configuracion" />}
      topbar={<MobileHeaderToday active="configuracion" />}
    >
      <div className="mx-auto flex w-full max-w-252.75 flex-col gap-group py-compact sm:gap-block sm:py-block">
        <div className="flex flex-col gap-compact">
          <h1 className="text-title">Configuración del Proyecto</h1>
          <p className="text-body text-ink-muted">
            Administrá la estructura, los rubros y las tareas de la obra.
          </p>
        </div>

        <SettingsCard id="basica" title="Información Básica">
          {toNumber(surface) > 2000 ? (
            <Notice
              tone="info"
              title={`Superaste la superficie permitida por tu plan (${formatArea(2000)}).`}
              action={
                <Link href="#mejorar-plan" tone="ink">
                  Mejorar plan
                </Link>
              }
            >
              Para agregar más metros cuadrados, pedile una mejora del plan al
              administrador de la organización.
            </Notice>
          ) : null}
          <div className="flex flex-col gap-group sm:flex-row sm:items-end">
            <span className="grid size-16 shrink-0 place-items-center rounded-mark bg-action text-action-ink sm:size-20">
              <Icon icon={Building2} size="lg" />
            </span>
            {/* Hoy el error está escondido en un ícono con tooltip; acá va escrito debajo del campo. */}
            <Field
              label="Nombre del Proyecto"
              required
              error={name.trim() ? undefined : "Ingresá el nombre de la obra."}
              className="flex-1"
            >
              <Input
                value={name}
                onChange={(event) => (setName(event.target.value), touch())}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-group sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Ubicación" required>
              <InputGroup
                start={<Icon icon={MapPin} size="xs" />}
                value={location}
                onChange={(event) => (setLocation(event.target.value), touch())}
              />
            </Field>
            <Field label="Superficie total" required>
              <InputGroup
                end="m²"
                inputMode="decimal"
                placeholder="Ej. 2.000,50"
                value={surface}
                onChange={(event) => (setSurface(event.target.value), touch())}
              />
            </Field>
            <Field label="Fecha de inicio" required>
              <DatePicker
                value={start}
                max={end}
                onChange={(date) => (setStart(date), touch())}
              />
            </Field>
            <Field label="Finalización estimada" required>
              <DatePicker
                value={end}
                min={start}
                onChange={(date) => (setEnd(date), touch())}
              />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard
          id="estructura"
          title="Configuración de Niveles y Locales"
          collapsible
        >
          <StructureToday
            state={state}
            onDelete={(what, run) =>
              ask(
                what === "nivel"
                  ? "Al eliminar el nivel se eliminan todas sus unidades y las tareas asignadas. ¿Querés continuar?"
                  : "Al eliminar esta unidad se eliminan las tareas que tiene asignadas. ¿Querés continuar?",
              )(run)
            }
          />
        </SettingsCard>
        <SettingsCard
          id="rubros"
          title="Rubros y Tareas"
          collapsible
          defaultOpen={false}
        >
          <RubrosToday
            state={state}
            onDelete={ask(
              "Los cambios se van a ver en todas las unidades. ¿Querés continuar?",
            )}
          />
        </SettingsCard>
        <SettingsCard
          id="por-unidad"
          title="Aplicación de Rubros y Tareas por Unidad Funcional"
          collapsible
          defaultOpen={false}
        >
          <UnitTasksTree state={state} />
        </SettingsCard>
      </div>

      {state.dirty ? (
        <section
          aria-label="Cambios sin guardar"
          className="sticky bottom-0 z-(--z-sticky) mx-auto w-full max-w-252.75 px-(--layout-margin)"
        >
          <div className="flex items-center justify-end gap-compact rounded-t-control border border-b-0 border-action/20 bg-action-soft px-block py-group sm:justify-between">
            <div className="hidden sm:block" aria-live="polite">
              <p className="text-reading font-medium">Cambios sin guardar</p>
              <p className="text-body">
                Guardá para aplicar la configuración del proyecto
              </p>
            </div>
            <div className="flex w-full gap-compact sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => setConfirmDiscard(true)}
              >
                Descartar cambios
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                disabled={weightsOf(state.groups).over}
                onClick={() => setConfirmSave(true)}
              >
                <Icon icon={Check} /> Guardar cambios
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title="¿Guardar los cambios?"
        description="Se actualiza la estructura del edificio y los rubros de la obra."
        confirmLabel="Guardar cambios"
        cancelLabel="Seguir editando"
        onConfirm={() => (state.setDirty(false), setConfirmSave(false))}
      />
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="¿Descartar los cambios?"
        description="Se pierden todos los cambios que no guardaste en la configuración."
        confirmLabel="Descartar cambios"
        cancelLabel="Seguir editando"
        tone="danger"
        onConfirm={() => (state.reset(), setConfirmDiscard(false))}
      />
      <ConfirmDialog
        open={pendingDelete !== undefined}
        onOpenChange={(value) => (value ? null : setPendingDelete(undefined))}
        title="¿Eliminar?"
        description={pendingDelete?.text ?? ""}
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={() => {
          pendingDelete?.run();
          setPendingDelete(undefined);
        }}
      />
    </WorkspaceLayout>
  );
}

function ConfiguracionPropuesta() {
  const state = useConfigState();
  const [tab, setTab] = useState("general");
  const [name, setName] = useState("Torre Alamo");
  const touch = () => state.setDirty(true);
  return (
    <WorkspaceLayout
      sidebar={<SidebarProposal active="configuracion" />}
      topbar={<TopbarProposal active="configuracion" />}
      header={
        <PageHeader
          title="Configuración"
          description="Datos de la obra, estructura del edificio y cómo se mide el avance."
        />
      }
    >
      {/* Una pestaña por tema (como la configuración de Linear o Procore), en vez de una página larga con todo. */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Secciones de la configuración">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="estructura">Estructura</TabsTrigger>
          <TabsTrigger value="rubros">Rubros y tareas</TabsTrigger>
          <TabsTrigger value="por-unidad">Rubros por unidad</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="pt-block">
          <div className="grid max-w-reading gap-group">
            <Field label="Nombre de la obra" required>
              <Input
                value={name}
                onChange={(event) => (setName(event.target.value), touch())}
              />
            </Field>
            <Field label="Dirección" required>
              <InputGroup
                start={<Icon icon={MapPin} size="xs" />}
                defaultValue="Av. Siempreviva 742, Córdoba"
                onChange={touch}
              />
            </Field>
            <div className="grid gap-group sm:grid-cols-2">
              <Field label="Inicio de obra" required>
                <InputGroup
                  start={<Icon icon={CalendarDays} size="xs" />}
                  defaultValue="01/06/2026"
                  onChange={touch}
                />
              </Field>
              <Field
                label="Fin estimado"
                required
                description="Faltan 5 meses y 11 días."
              >
                <InputGroup
                  start={<Icon icon={CalendarDays} size="xs" />}
                  defaultValue="30/04/2027"
                  onChange={touch}
                />
              </Field>
            </div>
            <Field
              label="Superficie total"
              required
              description="La suma de las unidades da 373,10 m²."
            >
              <InputGroup
                end="m²"
                inputMode="decimal"
                defaultValue="1.240,00"
                onChange={touch}
              />
            </Field>
          </div>
        </TabsContent>
        <TabsContent value="estructura" className="pt-block">
          <StructureProposal state={state} />
        </TabsContent>
        <TabsContent value="rubros" className="pt-block">
          <RubrosProposal state={state} />
        </TabsContent>
        <TabsContent value="por-unidad" className="pt-block">
          <UnitTasksMatrix state={state} />
        </TabsContent>
      </Tabs>
      <FormActions
        dirty={state.dirty}
        onDiscard={state.reset}
        onSave={() => state.setDirty(false)}
        className="-mx-(--layout-margin) mt-auto"
      />
    </WorkspaceLayout>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Obra/Configuración",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const ComoHoy: StoryObj = {
  name: "Como hoy",
  render: () => <ConfiguracionHoy />,
};
export const ComoHoyLimite: StoryObj = {
  name: "Como hoy · superficie sobre el plan",
  render: () => <ConfiguracionHoy surfaceOver />,
};
export const Propuesta: StoryObj = {
  name: "Propuesta",
  render: () => <ConfiguracionPropuesta />,
};
