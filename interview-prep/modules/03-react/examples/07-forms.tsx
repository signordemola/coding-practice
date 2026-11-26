// Topic 07: forms — controlled vs uncontrolled inputs, React's warnings, form Actions with
// useActionState, automatic reset, and useFormStatus.
import { captureConsole, click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import { act, useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { createRoot } from "react-dom/client";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container);
  await act(async () => root.render(ui));
  return { container, root };
}
// Simulates typing: set the DOM value the way a browser would, then fire the `input` event
// React listens to for onChange.
function type(input: HTMLInputElement, text: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, text);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

// --- 1. Controlled: React state is the source of truth -------------------------------------
function Consent() {
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  return (
    <>
      <input className="name" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} />
      <input className="consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
      <button className="pay" disabled={!consent || name === ""}>
        Pay deposit
      </button>
    </>
  );
}
{
  const { container } = await render(<Consent />);
  const name = container.querySelector<HTMLInputElement>(".name")!;
  const pay = container.querySelector<HTMLButtonElement>(".pay")!;
  await act(async () => type(name, "ada"));
  assert.equal(name.value, "ADA"); // React forced the value it holds (we uppercase on change)
  assert.equal(pay.disabled, true);
  await act(async () => click(container.querySelector(".consent"))); // read e.target.checked, not value
  assert.equal(pay.disabled, false);
}

// --- 2. value without onChange: read-only + a warning; undefined → string: another warning ----
{
  const messages = await captureConsole(async () => {
    const { container } = await render(<input className="ro" value="fixed" />);
    const input = container.querySelector<HTMLInputElement>(".ro")!;
    await act(async () => type(input, "changed"));
    assert.equal(input.value, "fixed"); // React reverted the keystroke
  });
  assert.ok(messages.some((m) => m.includes("without an `onChange` handler")));
}
function Phone({ phone }: { phone: string | undefined }) {
  return <input value={phone} onChange={() => {}} />;
}
{
  const messages = await captureConsole(async () => {
    const { root } = await render(<Phone phone={undefined} />);
    await act(async () => root.render(<Phone phone="0800" />));
  });
  assert.ok(messages.some((m) => m.includes("changing an uncontrolled input to be controlled")));
  // Fix from react.dev: value={phone ?? ""}
}

// --- 3. Uncontrolled + a form Action: FormData in, state out, pending flag ---------------------
let release: () => void = () => {};
async function saveBooking(name: string) {
  await new Promise<void>((r) => (release = r)); // wait until the test releases the "server"
  return name;
}
type Result = { error: string | null; saved: string | null };
function BookingForm() {
  const [state, formAction, isPending] = useActionState<Result, FormData>(async (_prev, formData) => {
    const name = String(formData.get("name") ?? "").trim();
    if (name === "") return { error: "Name is required", saved: null };
    const saved = await saveBooking(name);
    return { error: null, saved };
  }, { error: null, saved: null });
  return (
    <form action={formAction}>
      <input name="name" defaultValue="" />
      <SubmitButton />
      <p className="pending">{String(isPending)}</p>
      <p className="error">{state.error}</p>
      <p className="saved">{state.saved}</p>
    </form>
  );
}
function SubmitButton() {
  const { pending } = useFormStatus(); // reads the PARENT <form>'s status
  return <button type="submit">{pending ? "Booking..." : "Book"}</button>;
}
{
  const { container } = await render(<BookingForm />);
  const form = container.querySelector("form")!;
  const input = container.querySelector<HTMLInputElement>("input[name=name]")!;
  const text = (sel: string) => container.querySelector(sel)!.textContent;

  await act(async () => form.requestSubmit()); // empty name
  assert.equal(text(".error"), "Name is required");

  input.value = "Ada"; // uncontrolled: the DOM holds the value
  await act(async () => form.requestSubmit());
  assert.equal(text(".pending"), "true"); // the Action is still running
  assert.equal(text("button"), "Booking...");
  await act(async () => release());
  assert.equal(text(".pending"), "false");
  assert.equal(text(".saved"), "Ada");
  assert.equal(input.value, ""); // React reset the uncontrolled field after the Action succeeded
}

// --- 4. useFormStatus only works in a component rendered INSIDE the form -----------------------
function SameComponentForm() {
  const { pending } = useFormStatus(); // 🔴 this component renders the form, it isn't inside it
  const [, action] = useActionState(async () => new Promise<null>((r) => setTimeout(() => r(null), 20)), null);
  return (
    <form action={action}>
      <p className="p">{String(pending)}</p>
    </form>
  );
}
{
  const { container } = await render(<SameComponentForm />);
  await act(async () => {
    container.querySelector("form")!.requestSubmit();
    await new Promise((r) => setTimeout(r, 5));
  });
  assert.equal(container.querySelector(".p")!.textContent, "false"); // never true
  await act(async () => new Promise((r) => setTimeout(r, 30)));
}

console.log("07 forms: all checks passed");
