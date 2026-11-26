# 05. Managing state at scale: `useReducer`, context, and where each piece of state lives

**Sources (read in full):**
- react.dev: [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer) · [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context) · [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context) · [Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- redux.js.org: [FAQ: Organizing State](https://redux.js.org/faq/organizing-state) ("Do I have to put all my state into Redux?") · [FAQ: General](https://redux.js.org/faq/general) ("When should I use Redux?")

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/05-reducer-context.tsx`)

**Replaces:** old guide R3 (state in large apps). Redux itself is topic 12.

## Explain

### `useReducer`
- Moves update logic out of many event handlers into **one function**. Three steps from react.dev:
  1. Handlers **dispatch actions** describing *what the user did*: `dispatch({ type: "deleted", id })`.
  2. A **reducer** `(state, action) => nextState` decides *how state changes*. It's declared outside the component, conventionally with a `switch`. Wrap each `case` in braces, and always `return` to avoid falling through.
  3. `const [state, dispatch] = useReducer(reducer, initialState)`.
- Named after `Array.prototype.reduce`: a reducer "accumulates actions over time into state". You can even run `actions.reduce(reducer, initialState)` (checked).
- **Reducers must be pure.** They run during rendering (actions are queued until the next render). No requests, timers or mutation.
- **Each action is one user interaction**, even if it changes many fields (`reset_form`, not five `set_field` actions).
- `useState` vs `useReducer` (react.dev): code size, readability, debugging (log every action), testing (a pure function you test alone), and preference. They're equivalent and you can mix them. react.dev suggests a reducer when a component keeps getting update bugs.
- `useImmerReducer` lets the reducer "mutate" a draft.

### Context
- Solves **prop drilling**: a parent provides a value to the **whole tree below it**, however deep.
- `const LevelContext = createContext(defaultValue)`, read with `useContext(LevelContext)`, provide with `<LevelContext value={...}>` (React 19; `<Context.Provider>` will be deprecated).
- The **nearest provider above** wins. With no provider you get the default. Context passes through any components in between. A component can read a context and provide a new value for it (each `Section` adds one level) (checked).
- Like CSS inheritance: different contexts don't override each other.
- **A new context value re-renders every component reading it**, even inside `memo` (checked; topic 06).
- **Before reaching for context** (react.dev): first try passing props (explicit data flow), then try passing JSX as `children` so the middle layers don't need the data.
- Good uses: theme, current account, routing, and app state managed with a reducer.

### Reducer + context
- Put `state` and `dispatch` in **two contexts** (`TasksContext`, `TasksDispatchContext`) provided by a `TasksProvider` component, and expose `useTasks()` / `useTasksDispatch()` custom Hooks. Any component below can read or update without props (checked).
- The state still lives in one component; context only delivers it.
- Making the Hooks throw outside the provider (instead of returning `null`) is my addition: it turns a wiring mistake into a clear error (checked).

### Where should each piece of state live?
- react.dev: each unique piece of state has **one owner**. Keep it as low as possible and lift it only as high as needed.
- Redux FAQ: "**Using local component state is fine.**" Its rules of thumb for app-wide (Redux) state: do other parts of the app care? Is derived data built from it? Does it drive several components? Is time-travel useful? Should it be cached? Should it survive hot reloading?
- Redux FAQ, "When should I use Redux?": "Not all apps need Redux". It's most useful with lots of state needed in many places, frequent updates, complex update logic, a medium or large codebase with many people, or when you need to see how state changes over time.

### The old guide's table, checked
| Kind of state | Example | Tool | Source |
|---|---|---|---|
| Local UI | modal open | `useState` | react.dev |
| Multi-step logic | booking steps | `useReducer` | react.dev |
| Shared, read in many places | user, theme | context | react.dev use cases |
| App-wide, updated often, complex | — | Redux Toolkit (topic 12) | Redux FAQ |
| Server data | slots, bookings | the framework's data loading, or a cache (TanStack Query, SWR, RTK Query) | react.dev (Effects page), RTK Query docs |
| URL state | selected date, filters | search params | **my practice**, not from these docs |
| Form state | inputs while typing | local state or form Actions (topic 07); the Redux style guide says most form state shouldn't go in Redux | react.dev, Redux style guide |

The old guide also named Zustand and Jotai. I haven't read their docs for this module, so they're not covered here.

## Worked example (checked in `examples/05-reducer-context.tsx`)
```ts
function flowReducer(state: Flow, action: FlowAction): Flow {
  switch (action.type) {
    case "service_picked": { return { ...state, serviceId: action.serviceId, step: "time" }; }
    case "time_picked":    { return { ...state, startsAt: action.startsAt, step: "details" }; }
    case "back":           { return { ...state, step: state.step === "details" ? "time" : "service" }; }
    default: { const exhaustive: never = action; return exhaustive; } // module 02, topic 04
  }
}
```

## Traps
- Side effects (fetch, `Date.now()`) inside a reducer.
- One action per field instead of one per interaction.
- Reaching for context to avoid passing two props.
- One huge context for everything: every reader re-renders on any change. Split it (state vs dispatch, or by concern).
- Forgetting the provider and silently getting the default.

## Practice questions

**Q1. When would you switch from `useState` to `useReducer`?** When many handlers update the same state in related ways, or updates keep going wrong. A reducer puts the "how" in one pure, testable function and makes handlers say what happened.

**Q2. Why must a reducer be pure?** React calls it during rendering (and twice in Strict Mode). Side effects would run at unpredictable times, and the state transitions couldn't be replayed or tested.

**Q3. What happens if a component reads a context with no provider above it?** It gets the default value passed to `createContext`.

**Q4. A `memo`'d component reads a context. Does it re-render when the context changes?** Yes. `memo` only compares props from the parent; a context change re-renders every reader.

**Q5. Two alternatives react.dev suggests before context?** Pass props explicitly, or restructure so you pass JSX as `children` and the middle components don't handle the data.

**Q6. How do you decide whether state goes in Redux?** Keep it local unless other parts of the app need it, several components use it, you want caching or time-travel, and so on (the Redux FAQ's rules of thumb). Local state is fine.

## Say it (about 40 seconds)
"I start with local state and lift it only as far as needed, so each piece of state has one owner. When the update logic gets complicated, like a multi-step booking flow, I move it into a reducer: handlers dispatch what happened, and one pure function decides the next state, which is easy to test. For data many distant components need, like the user or theme, I use context, after trying props and the children pattern. For bigger shared state I combine a reducer with context, with state and dispatch in separate contexts behind small custom Hooks. Redux is for app-wide state that changes often and is used in many places; as its own docs say, not every app needs it."
