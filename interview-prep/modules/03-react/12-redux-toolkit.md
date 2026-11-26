# 12. ★ Redux Toolkit: store, slices, Immer, async thunks, selectors, RTK Query

Redux Toolkit was a gap in the micro1 Senior Frontend interview (24 Nov 2026), so this topic is starred.

**Versions (npm, 26 Nov 2026):** `@reduxjs/toolkit` 2.15.0 · `react-redux` 9.3.1 · `redux` 5.0.1.

**Sources (read in full unless marked):**
- redux-toolkit.js.org (from `reduxjs/redux-toolkit`, commit `b87a80f`, 25 Nov 2026): [Getting Started](https://redux-toolkit.js.org/introduction/getting-started) (purpose, what's included) · [`configureStore`](https://redux-toolkit.js.org/api/configureStore) · [`getDefaultMiddleware`](https://redux-toolkit.js.org/api/getDefaultMiddleware) · [`createSlice`](https://redux-toolkit.js.org/api/createSlice) · [Writing Reducers with Immer](https://redux-toolkit.js.org/usage/immer-reducers) (rules, reset, debugging, trade-offs) · [`createAsyncThunk`](https://redux-toolkit.js.org/api/createAsyncThunk) · [`createSelector`](https://redux-toolkit.js.org/api/createSelector) · [Immutability Middleware](https://redux-toolkit.js.org/api/immutabilityMiddleware) (intro) · [RTK Query Overview](https://redux-toolkit.js.org/rtk-query/overview) · [Automated Re-fetching](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching) (definitions)
- redux.js.org (from `reduxjs/redux`, commit `ce8d836`, 23 Nov 2026): [FAQ: General](https://redux.js.org/faq/general) · [FAQ: React Redux](https://redux.js.org/faq/react-redux) (re-render questions) · [FAQ: Organizing State](https://redux.js.org/faq/organizing-state) (first question) · [Style Guide](https://redux.js.org/style-guide/) (the rules quoted below)

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/12-redux-toolkit.tsx`)

**Replaces:** old guide R8 (advantages and limits of Redux) and R11 (Redux Toolkit in depth).

## Explain

### Redux in one paragraph, and when to use it
- One **store** holds app state. You **dispatch actions** (plain objects describing what happened); **reducers** (pure functions) return the next state; components read with selectors.
- The FAQ: Redux helps answer "when did this state change, and where did the data come from?", with predictable behaviour. The costs: more concepts, more code, indirection, and rules to follow.
- **"Not all apps need Redux."** Most useful with: lots of state needed in many places, frequent updates, complex update logic, a medium or large codebase with many people, and needing to see how state changes over time.
- Local component state is fine (Organizing State FAQ). Most form state shouldn't go in Redux (style guide).

### Redux Toolkit (RTK) is the standard way
It was built to fix three complaints: store setup too complicated, too many packages needed, too much boilerplate. The style guide marks "Use Redux Toolkit" as strongly recommended.

**`configureStore`** does in one call what used to take dozens of lines:
- combines slice reducers;
- adds the **thunk** middleware;
- in development, adds checks for **mutations**, **non-serialisable values** and misused action creators;
- connects the **Redux DevTools**.

If you pass `middleware`, you replace the defaults, so use `getDefaultMiddleware().concat(...)`.

**`createSlice({ name, initialState, reducers, extraReducers })`:**
- generates action creators and types (`"bookings/bookingPaid"`) (checked);
- `extraReducers` (builder: `addCase`, `addMatcher`) handles actions defined elsewhere, like thunks or another slice's "logged out", without generating new action creators;
- `selectors` and `reducerPath` options also exist.

### Immer inside reducers
- Redux's rule is that reducers never mutate. Inside `createSlice`/`createReducer`, "mutating" a **draft** is safe because Immer produces a new state (checked: the old state object is untouched).
- **Either mutate the draft or return a new value, never both.** `(state, action) => state.push(action.payload)` returns the new length and throws (checked). Use braces or `void`.
- **`state = newValue` does nothing.** Return the new value instead (e.g. `return initialState` to reset) (checked).
- Immer **freezes** the state it produces, so mutating store state outside a reducer throws (checked). A hand-written reducer that really mutates is caught by the immutability middleware in development (checked).
- `console.log(state)` shows a Proxy. Use `current(state)` to see it.
- Trade-offs the docs admit: about 3.3 KB min+gzip, small runtime overhead, confusing Proxies in the debugger, and newcomers may think mutation is normal outside Immer.

### `createAsyncThunk`
- `createAsyncThunk("bookings/fetch", async (arg, thunkAPI) => ...)` dispatches `pending`, then `fulfilled` or `rejected`. Handle them in `extraReducers`. It doesn't write reducers for you.
- One argument; pass an object for several.
- **The dispatched thunk always returns a resolved promise** with the final action, to avoid unhandled rejections (checked). Use **`.unwrap()`** to get the payload or throw (checked).
- Errors: a thrown error becomes a serialised `action.error`. **`rejectWithValue(payload)`** puts your own error in `action.payload`, which is also how to return API validation errors (checked).
- Cancel: `condition` skips it before it runs; `promise.abort()` and `thunkAPI.signal` cancel while running.

### Reading from the store: `useSelector`
- React-Redux runs every selector **after every dispatched action** and compares the result with `===`. Same reference → no re-render.
- **A selector that returns a new array or object every time re-renders on every action**, related or not (checked: 3 renders vs 1). In development React-Redux warns: "Selector … returned a different result when called with the same parameters" (checked).
- Fixes: `createSelector` (Reselect, re-exported by RTK; memoised on input references) (checked), select raw values and derive in the component, or `shallowEqual`.
- Style guide: prefer the hooks API (`useSelector`, `useDispatch`) over `connect`; call `useSelector` several times for small values; never `useSelector(state => state)`.

### RTK Query for server data
- RTK Query's own position: "data fetching and caching" is a **different set of concerns** than "state management". It handles loading state, duplicate requests, optimistic updates and cache lifetimes.
- `createApi({ reducerPath, baseQuery: fetchBaseQuery({ baseUrl }), endpoints })` generates hooks like `useGetSlotsQuery()`. Add `api.reducer` and `api.middleware` to the store. One API slice per base URL is the rule of thumb.
- Two components using the same query share **one request** (checked).
- **Tags:** queries `providesTags: ["Slot"]`, mutations `invalidatesTags: ["Slot"]`; after the mutation the affected queries refetch automatically (checked: booking 09:00 refetches the slot list).
- The style guide recommends RTK Query for data fetching, and thunks or listeners for other async logic.

### Style guide essentials (Priority A)
1. Don't mutate state; mutation is the most common cause of Redux bugs and breaks time-travel debugging.
2. Reducers must not have side effects (no async, `Date.now()`, `Math.random()`). Time-travel debugging replays them.
3. No non-serialisable values in state or actions (Promises, Maps/Sets, functions, class instances). RTK warns (checked with a `Date`). Store ISO strings.
4. One store per app, passed through `<Provider>`. Don't import the store directly into app code.

Also: model actions as **events, not setters**; name action types `domain/eventName`; organise **feature folders**; keep state minimal and derive the rest.

## Worked example (checked in `examples/12-redux-toolkit.tsx`)
```ts
export const fetchBookings = createAsyncThunk<Booking[], string, { rejectValue: string }>(
  "bookings/fetch",
  async (date, { rejectWithValue }) => {
    const res = await fetch(`/api/bookings?date=${date}`);
    if (!res.ok) return rejectWithValue(`No bookings for ${date}`);
    return res.json();
  },
);

const bookingsSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    bookingPaid(state, action: PayloadAction<string>) {
      const b = state.items.find((x) => x.id === action.payload);
      if (b) b.status = "paid";                      // safe: Immer draft
    },
    bookingsCleared: () => initialState,            // replace by returning
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending,   (state) => { state.status = "loading"; })
      .addCase(fetchBookings.fulfilled, (state, action) => { state.status = "done"; state.items = action.payload; })
      .addCase(fetchBookings.rejected,  (state, action) => { state.status = "failed"; state.error = action.payload ?? "unknown"; });
  },
});
// The check uses a fake request instead of fetch.
```

## Traps
- Mutating *and* returning in a reducer; `state = x`.
- "Mutating" code outside `createSlice` (it really mutates).
- A selector that builds a new array (`items.filter(...)`) inside `useSelector`.
- Expecting `await dispatch(thunk())` to throw on failure (use `.unwrap()`).
- `Date` objects or class instances in the store.
- Hand-writing thunks and loading flags for every API call when RTK Query would do it.
- Putting every form field and dropdown flag in Redux.

## Practice questions

**Q1. Advantages and limits of Redux?** Predictable one-way updates, DevTools with time-travel, and it scales for lots of shared client state across a big team. But more concepts and code, indirection, and it's overkill for small apps; the docs say not every app needs it.

**Q2. What does `configureStore` set up for you?** Combined reducers, thunk middleware, development checks for mutation and serialisability, and the DevTools connection.

**Q3. How can `state.status = "paid"` be legal in a reducer?** `createSlice` runs case reducers through Immer, which records changes to a draft and produces a new immutable state. Outside Immer it would be a real mutation.

**Q4. My thunk failed but `await dispatch(fetchX())` didn't throw. Why?** Dispatched `createAsyncThunk` thunks always resolve with the final action. Call `.unwrap()` to get the payload or have it throw.

**Q5. Why does my component re-render on every action?** Its selector returns a new reference each time (filter, map, object literal). Memoise it with `createSelector` or select raw values.

**Q6. When would you use RTK Query instead of thunks?** For server data: it caches, deduplicates, tracks loading, and refetches through tags after mutations, which removes most hand-written thunk and reducer code.

**Q7. What can't go in the store?** Non-serialisable values: promises, Maps/Sets, functions, class instances, `Date` objects. Store plain data like ISO strings.

## Say it (about 50 seconds)
"Redux keeps app-wide state in one store, changed only by dispatching actions to pure reducers, which makes changes predictable and traceable in the DevTools. Its own docs say not every app needs it; it pays off with lots of shared state, frequent complex updates and big teams. Today it means Redux Toolkit: `configureStore` sets up thunks, DevTools and development checks; `createSlice` generates action creators and uses Immer, so I can write 'mutating' updates safely, as long as I either mutate the draft or return a new value. For async I use `createAsyncThunk` with pending, fulfilled and rejected handled in `extraReducers`, `rejectWithValue` for API errors, and `.unwrap()` when the caller needs the result. I keep selectors returning stable references, using `createSelector` for derived data. For server data I'd pick RTK Query, which caches, deduplicates and refetches through tags."
