/** Catalogue specimens for the studio track. Each component adds a <Specimen> here with every state. */
import { useState, type ReactNode } from "react";

import { Icon } from "~/components/icons";
import { Alert, Banner, EditorBanner } from "~/components/studio/Banner";
import { Button, IconButton } from "~/components/studio/Button";
import { Chip, Mono } from "~/components/studio/Chip";
import { CodeInput, type CodeStatus } from "~/components/studio/CodeInput";
import { Checkbox, RadioCards, Segmented, Switch } from "~/components/studio/Controls";
import { Dialog } from "~/components/studio/Dialog";
import { SelectField, TextArea, TextField } from "~/components/studio/Field";
import { Glyph } from "~/components/studio/glyphs";
import { SaveStatus } from "~/components/studio/SaveStatus";
import { Shim } from "~/components/studio/Skeleton";
import { Spinner } from "~/components/studio/Spinner";
import { Toast, ToastProvider, useToast } from "~/components/studio/Toast";
import { TopicPicker, type TopicUse } from "~/components/studio/TopicPicker";
import { SOFT_LIMITS } from "~/lib/schemas";

import { Specimen, State } from "./Specimen";

const noop = () => undefined;

/** StudioWriting's vocabulary: five topics (chips), then thirteen (the dropdown). */
const FEW: TopicUse[] = [
  { name: "Product", uses: 4 },
  { name: "AI", uses: 2 },
  { name: "Health-tech", uses: 3 },
  { name: "Data", uses: 2 },
  { name: "Growth", uses: 1 },
];
const MANY: TopicUse[] = [
  ...FEW,
  { name: "Experimentation", uses: 2 },
  { name: "Analytics", uses: 1 },
  { name: "Strategy", uses: 3 },
  { name: "Leadership", uses: 1 },
  { name: "Design", uses: 1 },
  { name: "Monetisation", uses: 1 },
  { name: "Career", uses: 1 },
  { name: "Prototyping", uses: 2 },
];

function Box({ width = 360, children }: { width?: number; children: ReactNode }) {
  // The specimen grid sizes its track to content, so cap by the viewport: the page gutters plus the stage padding.
  return <div style={{ width, maxWidth: "calc(100vw - 88px)" }}>{children}</div>;
}

function Topics({
  vocabulary,
  initial,
  noun = "post",
  open,
  query,
}: {
  vocabulary: TopicUse[];
  initial: string[];
  noun?: "post" | "project";
  open?: boolean;
  query?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Box width={286}>
      <TopicPicker
        vocabulary={vocabulary}
        value={value}
        onChange={setValue}
        noun={noun}
        initialOpen={open ?? false}
        initialQuery={query ?? ""}
      />
    </Box>
  );
}

function Code({ id, initial = "", status = "idle" }: { id: string; initial?: string; status?: CodeStatus }) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<CodeStatus>(status);
  return (
    <Box width={440}>
      <CodeInput
        id={`${id}-in`}
        hintId={`${id}-h`}
        value={value}
        onChange={(v) => {
          setValue(v);
          if (state === "wrong" || state === "expired") setState("idle");
        }}
        onComplete={() => {
          setState("checking");
        }}
        status={state}
      />
      <Button
        variant="pbtn"
        style={{ marginTop: 18 }}
        busy={state === "checking"}
        disabled={state !== "checking" && (value.length < 6 || state === "locked")}
      >
        {state === "checking" ? "Checking code…" : "Sign in"}
      </Button>
    </Box>
  );
}

function Fields() {
  const [title, setTitle] = useState("Puja engagement platform");
  const [summary, setSummary] = useState(
    "A devotional app's booking and video features, rebuilt around trust: clear prices, verified priests and a calendar.",
  );
  const [excerpt, setExcerpt] = useState("");
  return (
    <>
      <State label="Default · counter">
        <Box>
          <TextField
            id="cat-title"
            label="Project title"
            required
            hint="Sentence case reads best. Keep it under 60 characters."
            counter={{ limit: SOFT_LIMITS.projectTitle }}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
        </Box>
      </State>
      <State label="Error">
        <Box>
          <TextField
            id="cat-title-err"
            label="Project title"
            required
            error="Add a title. It’s used on the card, the page and in search."
            counter={{ limit: SOFT_LIMITS.projectTitle }}
            value=""
            onChange={noop}
          />
        </Box>
      </State>
      <State label="Textarea · near the limit (amber)">
        <Box>
          <TextArea
            id="cat-sum"
            label="Summary"
            required
            hint="The card’s summary and the default search description. Say what you built and why."
            counter={{ limit: SOFT_LIMITS.summary, warnAbove: 120 }}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
            }}
          />
        </Box>
      </State>
      <State label="Over the soft limit (red)">
        <Box>
          <TextArea
            id="cat-sum-over"
            label="Summary"
            hint="The card’s summary and the default search description. Say what you built and why."
            counter={{ limit: SOFT_LIMITS.summary, warnAbove: 120 }}
            value={`${summary} It shipped to every user in two weeks, with a smaller team than planned.`}
            onChange={noop}
          />
        </Box>
      </State>
      <State label="Warning">
        <Box>
          <TextField
            id="cat-role"
            label="My role"
            warning="My role is empty, so that chapter stays hidden."
            value=""
            onChange={noop}
            placeholder="What you owned, in one or two sentences"
          />
        </Box>
      </State>
      <State label="Excerpt · placeholder">
        <Box>
          <TextArea
            id="cat-ex"
            label="Excerpt"
            hint="Shown on cards and in search."
            counter={{ limit: 160 }}
            minHeight={76}
            placeholder="Leave empty to use the first lines"
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
            }}
          />
        </Box>
      </State>
      <State label="Mono · disabled">
        <Box>
          <TextField
            id="cat-slug"
            label="Address"
            mono
            value="puja-engagement-platform"
            disabled
            onChange={noop}
          />
        </Box>
      </State>
      <State label="Select">
        <Box>
          <SelectField id="cat-scr" label="Opens on" defaultValue="Home">
            <option>Home</option>
            <option>Recommendations</option>
            <option>Booking</option>
          </SelectField>
        </Box>
      </State>
    </>
  );
}

function Selection() {
  const [shelf, setShelf] = useState<"a" | "b">("b");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [feat, setFeat] = useState(true);
  const [off, setOff] = useState(false);
  const [deco, setDeco] = useState(false);
  const [title, setTitle] = useState<"pm" | "spm">("pm");
  return (
    <>
      <State label="Segmented · 36px">
        <Segmented
          label="Homepage shelf"
          options={[
            { value: "a", label: "Shipped" },
            { value: "b", label: "Strategy & prototypes" },
          ]}
          value={shelf}
          onChange={setShelf}
        />
      </State>
      <State label="Segmented · 34px">
        <Segmented
          label="When"
          size={34}
          options={[
            { value: "now", label: "Publish now" },
            { value: "later", label: "Schedule" },
          ]}
          value={when}
          onChange={setWhen}
        />
      </State>
      <State label="Switch · on, off">
        <div>
          <Switch checked={feat} onCheckedChange={setFeat}>
            Show on my homepage
          </Switch>
          <Switch checked={off} onCheckedChange={setOff}>
            Show hidden
          </Switch>
        </div>
      </State>
      <State label="Checkbox">
        <Checkbox checked={deco} onCheckedChange={setDeco}>
          Decorative image
        </Checkbox>
      </State>
      <State label="Radio cards">
        <Box>
          <RadioCards
            label="Current title"
            options={[
              { value: "pm", label: "Product Manager", note: "As on your résumé" },
              { value: "spm", label: "Senior Product Manager", note: "As on your current site" },
            ]}
            value={title}
            onChange={setTitle}
          />
        </Box>
      </State>
    </>
  );
}

function DialogDemo({
  label,
  children,
}: {
  label: string;
  children: (open: boolean, setOpen: (open: boolean) => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        {label}
      </Button>
      {children(open, setOpen)}
    </>
  );
}

function PublishingDemo() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button
        variant="cta"
        onClick={() => {
          setOpen(true);
        }}
      >
        Publish
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setBusy(false);
        }}
        layout="panel"
        kicker="Publish changes"
        title="Update the live page for “Puja engagement platform”?"
        description="The live version is replaced. The page updates within a minute; its link stays the same."
        footerStart={
          <a
            href="#studio-dialogs"
            style={{ fontSize: 14, fontWeight: 500, textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Preview first
          </a>
        }
        confirmLabel={busy ? "Publishing…" : "Publish now"}
        busy={busy}
        onConfirm={() => {
          setBusy(true);
        }}
      >
        <div style={{ marginTop: 14, display: "grid", gap: 8, fontSize: 14, lineHeight: 1.5 }}>
          <div style={{ display: "flex", gap: 10, color: "var(--ok)" }}>
            <Glyph name="tick" />
            <span style={{ color: "var(--tx2)" }}>Cover, prototype and every image’s alt text are set.</span>
          </div>
          <div style={{ display: "flex", gap: 10, color: "var(--warn)" }}>
            <Icon name="alert" />
            <span style={{ color: "var(--tx2)" }}>
              My role is empty, so that chapter stays hidden. You can publish anyway.
            </span>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function ToastTrigger() {
  const toast = useToast();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      <Button
        onClick={() => {
          toast.show({
            message: "Deleted “Arcana Workspace”.",
            tone: "neutral",
            action: {
              label: "Undo",
              onAction: () => {
                toast.show({ message: "Restored “Arcana Workspace”." });
              },
            },
          });
        }}
      >
        Delete with Undo
      </Button>
      <Button
        onClick={() => {
          toast.show({
            message: "Published. The live page updates within a minute.",
            link: { label: "View live page ↗", href: "/" },
          });
        }}
      >
        Publish toast
      </Button>
    </div>
  );
}

export default function StudioSpecimens() {
  return (
    <>
      <Specimen
        studio
        title="Studio · Buttons"
        board="StudioDashboard / StudioLogin / StudioProjects · .cta .btn .pbtn .btn2 .ib"
      >
        <State label=".cta · default, disabled, busy">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="cta">Publish</Button>
            <Button variant="cta" disabled>
              Fix 2 to publish
            </Button>
            <Button variant="cta" busy>
              Publishing…
            </Button>
          </div>
        </State>
        <State label=".btn · ghost · .ib">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Button>Preview</Button>
            <Button variant="ghost">Unschedule</Button>
            <IconButton label="More actions">
              <Icon name="more" />
            </IconButton>
            <IconButton label="Close" size={36}>
              <Icon name="close" />
            </IconButton>
          </div>
        </State>
        <State label="Destructive · default, disabled">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="danger">Delete project</Button>
            <Button variant="danger" disabled>
              Delete forever
            </Button>
          </div>
        </State>
        <State label=".pbtn · default, disabled, busy">
          <Box width={340}>
            <div style={{ display: "grid", gap: 10 }}>
              <Button variant="pbtn">Email me a code</Button>
              <Button variant="pbtn" disabled>
                Sign in
              </Button>
              <Button variant="pbtn" busy>
                Sending code…
              </Button>
            </div>
          </Box>
        </State>
        <State label=".btn2 · .link">
          <div style={{ display: "flex", gap: "12px 20px", flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="btn2">Use a different email</Button>
            <Button variant="btn2-dark">
              Open the dashboard
              <Icon name="arrow-right" />
            </Button>
            <Button variant="link">Resend code</Button>
            <Button variant="link" disabled>
              Resend code in 0:52
            </Button>
          </div>
        </State>
      </Specimen>

      <Specimen studio title="Studio · Chips, mono, skeleton" board="StudioDashboard · .chip .mono .shim">
        <State label="Chips">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Chip tone="ok" dot>
              Live
            </Chip>
            <Chip>Draft</Chip>
            <Chip tone="warn">Edits not live</Chip>
            <Chip tone="err">Couldn’t publish</Chip>
            <Chip tone="outline">TARGET</Chip>
            <Chip tone="ok" size="sm">
              Published
            </Chip>
            <Chip size="sm">Draft</Chip>
          </div>
        </State>
        <State label="Mono">
          <Mono>Studio · system states</Mono>
        </State>
        <State label="Loading">
          <div
            aria-busy="true"
            aria-label="Loading"
            role="status"
            style={{
              width: 260,
              padding: 18,
              display: "grid",
              gap: 12,
              background: "var(--sf)",
              border: "1px solid var(--ln)",
              borderRadius: 14,
            }}
          >
            <Shim height={18} width="60%" />
            <Shim height={90} />
            <Shim height={14} width="80%" />
            <Shim height={14} width="45%" />
          </div>
        </State>
        <State label="Spinners">
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Spinner kind="save" />
            <Spinner kind="dark" />
            <Spinner kind="large" />
          </div>
        </State>
      </Specimen>

      <Specimen
        studio
        title="C22 · Form controls (Studio)"
        board="EditorOverview / StudioWriting / StudioStates · .inp .hrow .cnt"
      >
        <Fields />
      </Specimen>

      <Specimen
        studio
        title="C22 · Selection controls (Studio)"
        board="EditorOverview / StudioWriting / StudioProfile · .seg .sw .chk .rc"
      >
        <Selection />
      </Specimen>

      <Specimen studio title="S1 · Topic picker" board="StudioWriting.dc.html · Post settings › Topics">
        <State label="Chips · writing a draft">
          <Topics vocabulary={FEW} initial={["Product", "Health-tech"]} />
        </State>
        <State label="Chips · project editor">
          <Topics vocabulary={FEW} initial={["AI"]} noun="project" />
        </State>
        <State label="Dropdown · many topics">
          <Topics vocabulary={MANY} initial={["Product", "Health-tech", "Strategy"]} />
        </State>
        <State label="Dropdown · none chosen">
          <Topics vocabulary={MANY} initial={[]} />
        </State>
        <State label="Dropdown · at the cap of 8">
          <Topics
            vocabulary={MANY}
            initial={["Product", "AI", "Health-tech", "Data", "Growth", "Strategy", "Design", "Career"]}
          />
        </State>
        <State label="Dropdown open · “pro”">
          <div style={{ paddingBottom: 300 }}>
            <Topics vocabulary={MANY} initial={["Product", "Health-tech", "Strategy"]} open query="pro" />
          </div>
        </State>
      </Specimen>

      <Specimen
        studio
        title="S2 · Code input"
        board="StudioLogin.dc.html · .otp .box (enter code … too many tries)"
      >
        <State label="Enter code">
          <Code id="otp-a" />
        </State>
        <State label="Code typed">
          <Code id="otp-b" initial="4829" />
        </State>
        <State label="Checking code">
          <Code id="otp-c" initial="482913" status="checking" />
        </State>
        <State label="Wrong code">
          <Code id="otp-d" initial="482931" status="wrong" />
        </State>
        <State label="Code expired (boxes stay normal)">
          <Code id="otp-e" initial="482913" status="expired" />
        </State>
        <State label="Too many tries">
          <Code id="otp-f" status="locked" />
        </State>
      </Specimen>

      <Specimen studio title="Studio · Save status" board="StudioStates · Saving; EditorOverview header">
        <State label="Saved">
          <SaveStatus state="saved" />
        </State>
        <State label="Saved just now">
          <SaveStatus state="saved" savedLabel="Saved just now" />
        </State>
        <State label="Saving">
          <SaveStatus state="saving" />
        </State>
        <State label="Offline">
          <SaveStatus state="offline" />
        </State>
        <State label="Save failed">
          <SaveStatus state="failed" onRetry={noop} />
        </State>
      </Specimen>

      <Specimen
        studio
        title="Studio · Banners and alerts"
        board="StudioStates · Banners; StudioLogin · .alert; EditorOverview"
      >
        <State label="Sign-in alerts">
          <Box width={440}>
            <div style={{ display: "grid", gap: 12 }}>
              <Alert tone="err" icon={<Icon name="alert" />}>
                <b>That code didn’t work.</b> Check the latest email from Studio: each new code replaces the
                one before.
              </Alert>
              <Alert tone="warn" icon={<Icon name="clock" />}>
                <b>That code has expired.</b> Codes last 10 minutes. Send a new one and use it straight away.
              </Alert>
              <Alert tone="info" icon={<Icon name="arrow-right" />}>
                After you sign in, you’ll go straight back to{" "}
                <b style={{ color: "var(--tx)" }}>Puja engagement platform</b>.
              </Alert>
            </div>
          </Box>
        </State>
        <State label="Banners">
          <Box width={420}>
            <div style={{ display: "grid", gap: 10 }}>
              <Banner tone="warn" icon={<Glyph name="cloud-off" />}>
                <strong>You’re offline.</strong> Keep editing; publishing is paused.
              </Banner>
              <Banner tone="err" icon={<Glyph name="alert-circle" />}>
                <strong>Your last change didn’t save.</strong> Retrying.
              </Banner>
              <Banner tone="info" icon={<Glyph name="clock-sm" />}>
                A code was sent moments ago. You can ask for another in 0:42.
              </Banner>
            </div>
          </Box>
        </State>
        <State label="Editor banners">
          <Box width={720}>
            <EditorBanner tone="warn" icon={<Glyph name="cloud-off" />}>
              <strong>You’re offline.</strong> Keep editing. Changes are kept on this device and sync when you
              reconnect. Publishing is paused.
            </EditorBanner>
            <EditorBanner
              tone="err"
              icon={<Glyph name="alert-circle" />}
              action={
                <Button style={{ height: 34, borderColor: "#F0B4AD" }} onClick={noop}>
                  Retry now
                </Button>
              }
            >
              <strong>Your last change didn’t save.</strong> Studio will keep retrying. Keep this tab open
              until it says Saved.
            </EditorBanner>
          </Box>
        </State>
      </Specimen>

      <Specimen
        studio
        title="Studio · Toasts"
        board="StudioStates · Toasts; StudioProjects (placed, 7 seconds)"
      >
        <State label="Published">
          <Box width={321}>
            <Toast message="Published. Live within a minute." link={{ label: "View ↗", href: "/" }} />
          </Box>
        </State>
        <State label="Undoable delete">
          <Box width={321}>
            <Toast message="Block deleted." tone="neutral" action={{ label: "Undo", onAction: noop }} />
          </Box>
        </State>
        <State label="Copied">
          <Box width={321}>
            <Toast message="Preview link copied." />
          </Box>
        </State>
        <State label="Failed action">
          <Box width={321}>
            <Toast
              message="Couldn’t publish. Your draft is safe."
              tone="error"
              action={{ label: "Try again", onAction: noop }}
            />
          </Box>
        </State>
        <State label="Placed, bottom centre">
          <ToastProvider>
            <ToastTrigger />
          </ToastProvider>
        </State>
      </Specimen>

      <Specimen
        studio
        title="Studio · Dialogs"
        board="StudioStates · Confirmations; StudioProjects; EditorOverview"
      >
        <State label="Publish (panel)">
          <PublishingDemo />
        </State>
        <State label="Delete (plain, icon)">
          <DialogDemo label="Delete…">
            {(open, setOpen) => (
              <Dialog
                open={open}
                onOpenChange={setOpen}
                icon={<Icon name="trash" />}
                iconTone="err"
                title="Delete “Arcana Workspace”?"
                description="It comes off the live site straight away and its link, /work/arcana-workspace, stops working. Its images and videos stay in your media library."
                footerStart={
                  <Button variant="link" onClick={noop}>
                    Unpublish instead
                  </Button>
                }
                confirmLabel="Delete project"
                confirmVariant="danger"
                onConfirm={() => {
                  setOpen(false);
                }}
              />
            )}
          </DialogDemo>
        </State>
        <State label="Type to confirm">
          <DialogDemo label="Delete forever…">
            {(open, setOpen) => (
              <Dialog
                open={open}
                onOpenChange={setOpen}
                title="Delete “Puja engagement platform”?"
                description="This can’t be undone. Images and videos stay in your media library."
                confirmPhrase="puja-engagement-platform"
                confirmLabel="Delete forever"
                confirmVariant="danger"
                onConfirm={() => {
                  setOpen(false);
                }}
              />
            )}
          </DialogDemo>
        </State>
        <State label="Publish blocked">
          <DialogDemo label="Publish blocked…">
            {(open, setOpen) => (
              <Dialog
                open={open}
                onOpenChange={setOpen}
                title="Fix 2 things to publish"
                description="Each item links to the field. Drafts keep saving while you fix them."
                cancelLabel="Close"
                confirmLabel="Fix 2 to publish"
                confirmDisabled
                onConfirm={noop}
              />
            )}
          </DialogDemo>
        </State>
      </Specimen>
    </>
  );
}
