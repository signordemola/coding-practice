# 07. ★ Forms: controlled vs uncontrolled, form Actions, `useActionState`, `useFormStatus`

Controlled vs uncontrolled is a common interview question, so this topic is starred.

**Sources (react.dev, read in full unless marked):**
[`<input>`](https://react.dev/reference/react-dom/components/input) (reference, usage, troubleshooting) ·
[`<form>`](https://react.dev/reference/react-dom/components/form) (reference) ·
[`useActionState`](https://react.dev/reference/react/useActionState) (reference, caveats, usage headings, form section) ·
[`useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus) ·
[`useOptimistic`](https://react.dev/reference/react/useOptimistic) (reference and how it works) ·
[Sharing State: controlled and uncontrolled components](https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components) ·
[React 19 release post](https://react.dev/blog/2024/12/05/react-19) (Actions)

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/07-forms.tsx`)

**Replaces:** old guide R5.

## Explain

### Controlled inputs
- Pass `value` (text) or `checked` (checkbox, radio). React **forces** the input to show that value (checked: uppercasing in `onChange` shows uppercase).
- **Every controlled input needs an `onChange` that synchronously updates its state.** Without it, typing is impossible: React reverts every keystroke and warns: "You provided a `value` prop to a form field without an `onChange` handler…" (checked). Use `readOnly` if that's intended.
- Checkboxes: read `e.target.checked`, not `e.target.value`.
- Good when you need the value on every edit: live validation, a disabled Pay button until consent is ticked, formatting, several controls editing the same value.
- Caret jumping to the start: you set something other than `e.target.value`, updated asynchronously, or the input is being re-created (changing `key`, nested component definitions).

### Uncontrolled inputs
- Use `defaultValue` / `defaultChecked` for the starting value; the DOM holds the value; read it on submit (`FormData`) or with a ref.
- An input can't be both, and **can't switch over its lifetime**. `value={undefined}` then a string gives "A component is changing an uncontrolled input to be controlled" (checked). Fix: `value={phone ?? ""}`.

### "Controlled" components in general
react.dev uses the same words for your own components: controlled when the important information comes from props, uncontrolled when it's local state. Not strict terms (topic 02).

### Form Actions (React 19)
- `<form action={fn}>`: React calls `fn` with the form's **`FormData`**, inside a **Transition**. It may be async. A function action always submits with POST. `formAction` on a button overrides the form's action.
- After the Action **succeeds, React resets uncontrolled fields** (checked).
- `onSubmit` with `e.preventDefault()` still works (topic 08).

### `useActionState`
```js
const [state, dispatchAction, isPending] = useActionState(reducerAction, initialState);
<form action={dispatchAction}>…</form>   // reducerAction(previousState, formData)
```
- `reducerAction` gets the previous state and the payload (the `FormData` when used as a form action). It may be async and **may have side effects**, unlike a `useReducer` reducer. It isn't double-invoked in Strict Mode. Its return value becomes the new state.
- `isPending` is true while dispatched Actions are running (checked).
- Calls are **queued and run one after another**, each getting the previous result. If one throws, React cancels the queue and shows the nearest Error Boundary.
- `useReducer` vs `useActionState` (react.dev): `useReducer` for UI state with a pure reducer; `useActionState` for the state of Actions.
- **Keeping values after a validation error:** return the error *and* the submitted values, and use them as the inputs' `defaultValue`, so the automatic reset keeps them.
- No built-in reset; handle a reset payload in your reducer.
- With Server Functions, the initial state and payloads must be serialisable. Setting state after an `await` currently needs an extra `startTransition`.

### `useFormStatus`
`const { pending, data, method, action } = useFormStatus()` gives the status of the **parent** `<form>`. It must be called in a component rendered **inside** the form; in the component that renders the form, it never reports pending (checked). The usual pattern is a `SubmitButton` component.

### `useOptimistic`
`const [optimistic, setOptimistic] = useOptimistic(value, reducer?)` shows a temporary value **while an Action runs**. Call the setter inside an Action. When the Action ends, the UI shows whatever `value` is then; if it failed, the parent didn't update `value`, so the UI goes back. (Read, not run in this module.)

### Validate on the client *and* the server
The old guide's follow-up: client checks give fast feedback; the server **never trusts** the request (anyone can send one directly) and checks business rules like whether the slot is still free and the real price. That's standard practice, not from these React pages. Schema libraries like Zod come up in module 04.

## Worked example (checked in `examples/07-forms.tsx`)
```jsx
function BookingForm() {
  const [state, formAction, isPending] = useActionState(async (_prev, formData) => {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Name is required", saved: null };
    return { error: null, saved: await saveBooking(name) };
  }, { error: null, saved: null });

  return (
    <form action={formAction}>
      <input name="name" defaultValue="" />   {/* uncontrolled: reset after success */}
      <SubmitButton />                        {/* useFormStatus inside the form */}
      {state.error && <p>{state.error}</p>}
    </form>
  );
}
```

## Traps
- `value` without `onChange`.
- `value={maybeUndefined}`.
- `e.target.value` on a checkbox.
- `useFormStatus` in the same component as the `<form>`.
- Expecting values to stay after a successful Action (they're reset unless you pass `defaultValue`).
- Trusting client validation.

## Practice questions

**Q1. Controlled vs uncontrolled input?** Controlled: React state holds the value via `value`/`checked` plus `onChange`, so you can react to every keystroke. Uncontrolled: the DOM holds it, you set `defaultValue` and read it on submit. Less code, fewer renders.

**Q2. I can't type into my input. Why?** It has `value` but no `onChange` (or the handler doesn't set the state to `e.target.value`), so React keeps reverting it.

**Q3. Fix "changing an uncontrolled input to be controlled".** The value started as `undefined`. Always pass a string: `value={x ?? ""}`.

**Q4. What does `<form action={fn}>` give you over `onSubmit`?** React calls `fn` with the `FormData` inside a Transition, tracks pending state (with `useActionState`/`useFormStatus`), and resets uncontrolled fields after success.

**Q5. How does a submit button know the form is submitting?** `useFormStatus().pending`, called in a component rendered inside the form.

**Q6. How do you keep the user's input when validation fails in an Action?** Return the submitted values with the error and use them as `defaultValue`.

## Say it (about 40 seconds)
"Controlled means React state holds the value: `value` plus an `onChange` that sets it, so I can validate as the user types, like keeping the Pay button disabled until consent is ticked. Uncontrolled means the DOM holds it: `defaultValue`, read on submit. An input can't switch between the two, which is why I write `value={x ?? ''}`. In React 19, I often use form Actions: the form's action gets the FormData inside a Transition, `useActionState` gives me the result and a pending flag, `useFormStatus` lets a submit button show it, and React resets uncontrolled fields on success. And I always validate again on the server."
