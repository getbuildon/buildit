import { useState, type FormEvent, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Bell,
  Building2,
  Camera,
  Check,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Palette,
  Smartphone,
  Sun,
  User,
  X,
} from "lucide-react";
import { Avatar } from "../atoms/avatar/Avatar";
import { Badge } from "../atoms/badge/Badge";
import { Button } from "../atoms/button/Button";
import { Icon } from "../atoms/icon/Icon";
import { Input } from "../atoms/input/Input";
import { Switch } from "../atoms/switch/Switch";
import { cn } from "../lib/cn";
import { Field } from "../molecules/field/Field";
import { InputGroup } from "../molecules/input-group/InputGroup";
import { Notice } from "../molecules/notice/Notice";
import { PasswordInput } from "../molecules/password-input/PasswordInput";
import { Segmented } from "../molecules/segmented/Segmented";
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

/* Mi perfil (components/profile/PerfilView): datos personales y foto, mail y contraseña. */

const person = {
  firstName: "Lucía",
  lastName: "Fernández",
  email: "lucia@grupoalamo.com.ar",
  phone: "+54 9 351 612 4410",
  badge: "Owner",
  role: "Founder",
};

/** Las reglas de hoy para la contraseña nueva, una por una. */
const rules: { label: string; test: (value: string) => boolean }[] = [
  { label: "8 caracteres o más", test: (value) => value.length >= 8 },
  { label: "Una minúscula", test: (value) => /[a-z]/.test(value) },
  { label: "Una mayúscula", test: (value) => /[A-Z]/.test(value) },
  { label: "Un número", test: (value) => /\d/.test(value) },
  {
    label: "Un carácter especial (! @ # $ %)",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];
const strengthError = (value: string) => {
  if (!value) return "Ingresá la contraseña nueva.";
  const missing = rules.find((rule) => !rule.test(value));
  return missing ? `Falta: ${missing.label.toLowerCase()}.` : undefined;
};

type Feedback = { type: "ok" | "danger"; message: string } | null;

/** Hoy el aviso aparece sin anunciarse; acá se lee al aparecer. */
function FeedbackLine({ state }: { state: Feedback }) {
  if (!state) return null;
  return (
    <p
      role={state.type === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-center gap-compact text-body",
        state.type === "ok" ? "text-fn-ok" : "text-fn-danger",
      )}
    >
      <Icon icon={state.type === "ok" ? Check : X} size="xs" />
      {state.message}
    </p>
  );
}

/* ================================================================== Como hoy */

function Card({
  icon,
  title,
  id,
  onSubmit,
  children,
}: {
  icon: typeof User;
  title: string;
  id: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <form
      aria-labelledby={id}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-group rounded-surface border border-line bg-canvas-raised p-group shadow-hint sm:p-block"
    >
      <h2
        id={id}
        className="flex items-center gap-compact text-section font-regular"
      >
        <Icon icon={icon} className="text-action" />
        {title}
      </h2>
      {children}
    </form>
  );
}

function PerfilHoy({ withErrors = false }: { withErrors?: boolean }) {
  const [first, setFirst] = useState(person.firstName);
  const [last, setLast] = useState(withErrors ? "" : person.lastName);
  const [phone, setPhone] = useState(person.phone);
  const [email, setEmail] = useState(person.email);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState(withErrors ? "obra2026" : "");
  const [confirm, setConfirm] = useState("");
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(
    withErrors
      ? { type: "danger", message: "El nombre y el apellido son obligatorios." }
      : null,
  );
  const [emailFeedback, setEmailFeedback] = useState<Feedback>(null);
  const [passwordErrors, setPasswordErrors] = useState<
    Record<string, string | undefined>
  >(
    withErrors
      ? {
          current: "Ingresá tu contraseña actual.",
          next: strengthError("obra2026"),
        }
      : {},
  );
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  return (
    <WorkspaceLayout
      sidebar={<SidebarToday active="perfil" />}
      topbar={<MobileHeaderToday active="perfil" />}
      width="reading"
    >
      <div className="flex flex-col gap-5.5 py-compact sm:py-block">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-heading">Mi Perfil</h1>
          {/* Hoy dice «Administra» (de tú); el resto de la app habla de vos. */}
          <p className="text-body">
            Administrá tu información personal y tus credenciales
          </p>
        </div>

        <Card
          id="personal"
          icon={User}
          title="Información Personal"
          onSubmit={(event) => {
            event.preventDefault();
            setProfileFeedback(
              first.trim() && last.trim()
                ? { type: "ok", message: "Perfil actualizado." }
                : {
                    type: "danger",
                    message: "El nombre y el apellido son obligatorios.",
                  },
            );
          }}
        >
          <div className="flex items-center gap-group">
            {/* Hoy es un círculo que se toca para cambiar la foto, sin nada que lo indique a la vista. */}
            <label className="group/avatar relative cursor-pointer rounded-pill has-[input:focus-visible]:[box-shadow:var(--focus-ring)]">
              <Avatar name={`${first} ${last}`} size="xl" tone="naranja" />
              <span
                aria-hidden
                className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-pill border-2 border-canvas-raised bg-canvas-inverse text-ink-inverse"
              >
                <Icon icon={Camera} size="xs" />
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                aria-label="Cambiar foto de perfil"
              />
            </label>
            <div className="min-w-0 flex-1">
              <p className="truncate text-reading font-medium">
                {first} {last}
              </p>
              <p className="truncate text-body text-ink-muted">
                {person.email}
              </p>
              <p className="mt-related flex items-center gap-1.5">
                <Badge tone="action" size="compact">
                  {person.badge}
                </Badge>
                <span className="text-meta">{person.role}</span>
              </p>
            </div>
          </div>
          <div className="grid gap-snug sm:grid-cols-2">
            <Field
              label="Nombre"
              required
              error={
                profileFeedback?.type === "danger" && !first.trim()
                  ? "Ingresá tu nombre."
                  : undefined
              }
            >
              <Input
                value={first}
                autoComplete="given-name"
                onChange={(event) => (
                  setFirst(event.target.value),
                  setProfileFeedback(null)
                )}
              />
            </Field>
            <Field
              label="Apellido"
              required
              error={
                profileFeedback?.type === "danger" && !last.trim()
                  ? "Ingresá tu apellido."
                  : undefined
              }
            >
              <Input
                value={last}
                autoComplete="family-name"
                onChange={(event) => (
                  setLast(event.target.value),
                  setProfileFeedback(null)
                )}
              />
            </Field>
          </div>
          <Field label="Teléfono" optional>
            <Input
              type="tel"
              value={phone}
              autoComplete="tel"
              placeholder="+54 9 1234 567890"
              onChange={(event) => (
                setPhone(event.target.value),
                setProfileFeedback(null)
              )}
            />
          </Field>
          <FeedbackLine state={profileFeedback} />
          <Button type="submit" className="self-end">
            <Icon icon={Check} /> Guardar cambios
          </Button>
        </Card>

        <Card
          id="correo"
          icon={Mail}
          title="Correo electrónico"
          onSubmit={(event) => {
            event.preventDefault();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
              setEmailFeedback({
                type: "danger",
                message: "Ingresá un mail válido.",
              });
            else if (email === person.email)
              setEmailFeedback({
                type: "danger",
                message: "El mail es igual al actual.",
              });
            else
              setEmailFeedback({
                type: "ok",
                message:
                  "Te mandamos un mail de confirmación. El cambio se aplica cuando lo confirmes.",
              });
          }}
        >
          <Field
            label="Correo electrónico"
            error={
              emailFeedback?.type === "danger"
                ? emailFeedback.message
                : undefined
            }
          >
            <InputGroup
              type="email"
              start={<Icon icon={Mail} size="xs" />}
              value={email}
              autoComplete="email"
              onChange={(event) => (
                setEmail(event.target.value),
                setEmailFeedback(null)
              )}
            />
          </Field>
          {emailFeedback?.type === "ok" ? (
            <FeedbackLine state={emailFeedback} />
          ) : null}
          <Button type="submit" className="self-end">
            <Icon icon={Check} /> Guardar correo
          </Button>
        </Card>

        <Card
          id="contrasena"
          icon={Lock}
          title="Cambiar contraseña"
          onSubmit={(event) => {
            event.preventDefault();
            const found = {
              current: current ? undefined : "Ingresá tu contraseña actual.",
              next: strengthError(next),
              confirm: !confirm
                ? "Confirmá tu contraseña."
                : confirm !== next
                  ? "Las contraseñas no coinciden."
                  : undefined,
            };
            setPasswordErrors(found);
            setPasswordFeedback(
              Object.values(found).some(Boolean)
                ? null
                : { type: "ok", message: "Contraseña actualizada." },
            );
          }}
        >
          {/* Hoy hay un solo aviso para los tres campos; acá cada error va en su campo. */}
          <Field
            label="Contraseña actual"
            required
            error={passwordErrors.current}
          >
            <PasswordInput
              autoComplete="current-password"
              value={current}
              onChange={(event) => (
                setCurrent(event.target.value),
                setPasswordErrors({ ...passwordErrors, current: undefined })
              )}
            />
          </Field>
          <Field
            label="Contraseña nueva"
            required
            description="Mínimo 8 caracteres, con mayúsculas, minúsculas, un número y un carácter especial."
            error={passwordErrors.next}
          >
            <PasswordInput
              autoComplete="new-password"
              value={next}
              onChange={(event) => (
                setNext(event.target.value),
                setPasswordErrors({ ...passwordErrors, next: undefined })
              )}
            />
          </Field>
          <Field
            label="Confirmar contraseña nueva"
            required
            error={passwordErrors.confirm}
          >
            <PasswordInput
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => (
                setConfirm(event.target.value),
                setPasswordErrors({ ...passwordErrors, confirm: undefined })
              )}
            />
          </Field>
          <FeedbackLine state={passwordFeedback} />
          <Button type="submit" className="self-end">
            <Icon icon={Check} /> Cambiar contraseña
          </Button>
        </Card>
      </div>
    </WorkspaceLayout>
  );
}

/* ================================================================== Propuesta */

const events = [
  {
    id: "avance",
    label: "Cargan un avance en mis obras",
    mail: false,
    whatsapp: false,
    app: true,
  },
  {
    id: "bloqueo",
    label: "Una tarea queda bloqueada",
    mail: true,
    whatsapp: true,
    app: true,
  },
  {
    id: "certificar",
    label: "Hay tareas para certificar hace más de 7 días",
    mail: true,
    whatsapp: false,
    app: true,
  },
  {
    id: "equipo",
    label: "Alguien acepta una invitación",
    mail: false,
    whatsapp: false,
    app: true,
  },
  {
    id: "resumen",
    label: "Resumen semanal de cada obra",
    mail: true,
    whatsapp: false,
    app: false,
  },
];

const sessions = [
  {
    id: "s1",
    device: "Chrome en macOS",
    place: "Córdoba",
    when: "Esta sesión",
    icon: Laptop,
    current: true,
  },
  {
    id: "s2",
    device: "BuildOn en iPhone",
    place: "Córdoba",
    when: "Hace 2 horas",
    icon: Smartphone,
  },
  {
    id: "s3",
    device: "Chrome en Windows",
    place: "Villa Carlos Paz",
    when: "Hace 12 días",
    icon: Monitor,
  },
];

function PerfilPropuesta() {
  const [first, setFirst] = useState(person.firstName);
  const [savedFirst, setSavedFirst] = useState(person.firstName);
  const [next, setNext] = useState("Obra2026");
  const [prefs, setPrefs] = useState(events);
  const [theme, setTheme] = useState("sistema");

  return (
    <WorkspaceLayout
      sidebar={<SidebarProposal active="perfil" />}
      topbar={<TopbarProposal active="perfil" />}
      header={
        <PageHeader
          title="Mi perfil"
          description="Tus datos, cómo entrás y qué avisos recibís."
        />
      }
    >
      {/* Por temas (como la cuenta de Google o la configuración de Linear), con dos que hoy no existen: avisos y apariencia. */}
      <Tabs defaultValue="perfil">
        <TabsList aria-label="Secciones del perfil">
          <TabsTrigger value="perfil">
            <Icon icon={User} size="xs" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="seguridad">
            <Icon icon={KeyRound} size="xs" /> Cuenta y seguridad
          </TabsTrigger>
          <TabsTrigger value="avisos">
            <Icon icon={Bell} size="xs" /> Avisos
          </TabsTrigger>
          <TabsTrigger value="apariencia">
            <Icon icon={Palette} size="xs" /> Apariencia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="pt-block">
          <div className="grid gap-chapter lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="flex max-w-reading flex-col gap-group">
              <div className="flex items-center gap-group">
                <Avatar
                  name={`${first} ${person.lastName}`}
                  size="xl"
                  tone="naranja"
                />
                <div className="flex flex-wrap gap-compact">
                  <Button variant="outline" size="compact" asChild>
                    <label className="cursor-pointer has-[input:focus-visible]:[box-shadow:var(--focus-ring)]">
                      <Icon icon={Camera} size="xs" /> Cambiar foto
                      <input type="file" accept="image/*" className="sr-only" />
                    </label>
                  </Button>
                  <Button variant="ghost" size="compact">
                    Quitar
                  </Button>
                </div>
              </div>
              <div className="grid gap-snug sm:grid-cols-2">
                <Field label="Nombre" required>
                  <Input
                    value={first}
                    autoComplete="given-name"
                    onChange={(event) => setFirst(event.target.value)}
                  />
                </Field>
                <Field label="Apellido" required>
                  <Input
                    defaultValue={person.lastName}
                    autoComplete="family-name"
                  />
                </Field>
              </div>
              <Field
                label="Celular"
                optional
                description="Para los avisos por WhatsApp."
              >
                <InputGroup
                  type="tel"
                  start="+54"
                  defaultValue="9 351 612 4410"
                  autoComplete="tel-national"
                />
              </Field>
            </div>
            {/* Dónde trabaja y con qué rol, a la vista: hoy solo se ve el rol de la obra abierta. */}
            <section
              aria-labelledby="mis-obras"
              className="flex flex-col gap-snug"
            >
              <h2 id="mis-obras" className="text-label">
                Mis obras
              </h2>
              <ul className="flex flex-col divide-y divide-line rounded-control border border-line">
                {[
                  ["Torre Alamo", "Owner"],
                  ["Barrio Los Álamos", "Admin"],
                  ["Edificio Mirador", "Supervisor"],
                ].map(([name, role]) => (
                  <li
                    key={name}
                    className="flex items-center gap-compact px-snug py-compact"
                  >
                    <Icon
                      icon={Building2}
                      size="xs"
                      className="text-ink-muted"
                    />
                    <span className="flex-1 text-body">{name}</span>
                    <Badge
                      size="compact"
                      tone={role === "Owner" ? "action" : "neutral"}
                    >
                      {role}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <FormActions
            dirty={first !== savedFirst}
            onDiscard={() => setFirst(savedFirst)}
            onSave={() => setSavedFirst(first)}
            className="-mx-(--layout-margin) mt-block"
          />
        </TabsContent>

        <TabsContent
          value="seguridad"
          className="flex max-w-reading flex-col gap-chapter pt-block"
        >
          <section
            aria-labelledby="mail-titulo"
            className="flex flex-col gap-snug"
          >
            <h2 id="mail-titulo" className="text-section">
              Mail
            </h2>
            <Field
              label="Mail para entrar"
              description="Al cambiarlo te mandamos un mail para confirmarlo; hasta entonces seguís entrando con el actual."
            >
              <InputGroup
                type="email"
                start={<Icon icon={Mail} size="xs" />}
                defaultValue={person.email}
                autoComplete="email"
              />
            </Field>
            <Notice tone="info" title="Cambio pendiente">
              Confirmá el mail que te mandamos a lucia.fernandez@gmail.com.{" "}
              <button
                type="button"
                className="focus-ring cursor-pointer rounded-box font-medium underline"
              >
                Reenviar
              </button>
            </Notice>
          </section>

          <section
            aria-labelledby="pass-titulo"
            className="flex flex-col gap-snug"
          >
            <h2 id="pass-titulo" className="text-section">
              Contraseña
            </h2>
            <Field label="Contraseña actual" required>
              <PasswordInput autoComplete="current-password" />
            </Field>
            <Field label="Contraseña nueva" required>
              <PasswordInput
                autoComplete="new-password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
              />
            </Field>
            {/* Las reglas como lista que se va tildando (como Google o Stripe), en vez de un párrafo. */}
            <ul
              aria-label="Requisitos de la contraseña"
              className="grid gap-related sm:grid-cols-2"
            >
              {rules.map((rule) => {
                const ok = rule.test(next);
                return (
                  <li
                    key={rule.label}
                    className={cn(
                      "flex items-center gap-compact text-meta",
                      ok ? "text-fn-ok" : "text-ink-muted",
                    )}
                  >
                    <Icon icon={ok ? Check : X} size="xs" />
                    {rule.label}
                    <span className="sr-only">
                      {ok ? ": cumplido" : ": falta"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Button className="self-start">Cambiar contraseña</Button>
          </section>

          <section
            aria-labelledby="sesiones-titulo"
            className="flex flex-col gap-snug"
          >
            <h2 id="sesiones-titulo" className="text-section">
              Dónde está abierta tu cuenta
            </h2>
            <ul className="flex flex-col divide-y divide-line rounded-control border border-line">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center gap-snug px-group py-snug"
                >
                  <Icon icon={session.icon} className="text-ink-muted" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-label">{session.device}</span>
                    <span className="text-meta text-ink-muted">
                      {session.place} · {session.when}
                    </span>
                  </span>
                  {session.current ? (
                    <Badge tone="ok" size="compact">
                      Esta
                    </Badge>
                  ) : (
                    <Button variant="ghost" size="compact">
                      Cerrar
                      <span className="sr-only">
                        {" "}
                        la sesión de {session.device}
                      </span>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <Button variant="danger-quiet" className="self-start">
              <Icon icon={LogOut} /> Cerrar todas las demás
            </Button>
          </section>
        </TabsContent>

        <TabsContent
          value="avisos"
          className="flex max-w-reading flex-col gap-group pt-block"
        >
          <p className="text-body text-ink-muted">
            Elegí qué te avisamos y por dónde. Lo que no marques lo vas a ver
            igual dentro de BuildOn.
          </p>
          <div
            role="region"
            aria-label="Avisos"
            tabIndex={0}
            className="focus-ring overflow-x-auto rounded-control border border-line"
          >
            <table className="w-full min-w-120 border-collapse text-body">
              <caption className="sr-only">Avisos por canal</caption>
              <thead className="bg-canvas-sunken text-meta text-ink-muted">
                <tr>
                  <th
                    scope="col"
                    className="px-group py-compact text-left font-medium"
                  >
                    Cuando…
                  </th>
                  {["Mail", "WhatsApp", "En la app"].map((channel) => (
                    <th
                      key={channel}
                      scope="col"
                      className="w-24 px-compact py-compact text-center font-medium"
                    >
                      {channel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prefs.map((pref) => (
                  <tr key={pref.id} className="border-t border-line">
                    <th
                      scope="row"
                      className="px-group py-snug text-left font-regular"
                    >
                      {pref.label}
                    </th>
                    {(["mail", "whatsapp", "app"] as const).map((channel) => (
                      <td
                        key={channel}
                        className="px-compact py-snug text-center"
                      >
                        <Switch
                          aria-label={`${pref.label}: ${channel === "app" ? "en la app" : channel === "mail" ? "por mail" : "por WhatsApp"}`}
                          checked={pref[channel]}
                          onCheckedChange={(value) =>
                            setPrefs(
                              prefs.map((item) =>
                                item.id === pref.id
                                  ? { ...item, [channel]: value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent
          value="apariencia"
          className="flex max-w-reading flex-col gap-group pt-block"
        >
          {/* La librería ya tiene modo oscuro: acá se elige. */}
          <div className="flex flex-col gap-compact">
            <p className="text-label">Tema</p>
            <Segmented
              label="Tema"
              value={theme}
              onValueChange={setTheme}
              className="self-start"
              options={[
                {
                  value: "claro",
                  label: (
                    <span className="flex items-center gap-related">
                      <Icon icon={Sun} size="xs" /> Claro
                    </span>
                  ),
                },
                {
                  value: "oscuro",
                  label: (
                    <span className="flex items-center gap-related">
                      <Icon icon={Moon} size="xs" /> Oscuro
                    </span>
                  ),
                },
                {
                  value: "sistema",
                  label: (
                    <span className="flex items-center gap-related">
                      <Icon icon={Monitor} size="xs" /> Como el dispositivo
                    </span>
                  ),
                },
              ]}
            />
            <p className="text-meta text-ink-muted">
              «Como el dispositivo» cambia solo cuando el celular o la compu
              pasan a modo oscuro.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </WorkspaceLayout>
  );
}

/* ------------------------------------------------------------------ Historias */

const meta = {
  title: "Pantallas/Mi perfil",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

export const ComoHoy: StoryObj = {
  name: "Como hoy",
  render: () => <PerfilHoy />,
};
export const ComoHoyErrores: StoryObj = {
  name: "Como hoy · con errores",
  render: () => <PerfilHoy withErrors />,
};
export const Propuesta: StoryObj = {
  name: "Propuesta",
  render: () => <PerfilPropuesta />,
};
