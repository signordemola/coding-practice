// Topic 12: Redux Toolkit — configureStore, createSlice + Immer rules, createAsyncThunk,
// useSelector re-render rules, createSelector, and RTK Query tags.
import { captureConsole, click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import {
  configureStore,
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch, useSelector } from "react-redux";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container);
  await act(async () => root.render(ui));
  return { container, root };
}

// --- 1. createSlice generates action types and creators; Immer makes "mutation" safe ---------
type Booking = { id: string; status: "pending" | "paid" | "cancelled" };
type BookingsState = { items: Booking[]; status: "idle" | "loading" | "done" | "failed"; error: string | null };
const initialState: BookingsState = { items: [], status: "idle", error: null };

let serverFails = false;
export const fetchBookings = createAsyncThunk<Booking[], string, { rejectValue: string }>(
  "bookings/fetch",
  async (date, { rejectWithValue }) => {
    await new Promise((r) => setTimeout(r, 5));
    if (serverFails) return rejectWithValue(`No bookings service for ${date}`);
    return [
      { id: "b1", status: "pending" },
      { id: "b2", status: "paid" },
    ];
  },
);

const bookingsSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    bookingPaid(state, action: PayloadAction<string>) {
      const b = state.items.find((x) => x.id === action.payload);
      if (b) b.status = "paid"; // ✅ "mutating" a draft: Immer produces a new state
    },
    bookingsCleared() {
      return initialState; // ✅ replacing state: return it (`state = initialState` would do nothing)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.status = "done";
        state.items = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message ?? "unknown";
      });
  },
});
const { bookingPaid, bookingsCleared } = bookingsSlice.actions;
assert.equal(bookingPaid.type, "bookings/bookingPaid"); // name + key
assert.deepEqual(bookingPaid("b1"), { type: "bookings/bookingPaid", payload: "b1" });
assert.equal(fetchBookings.pending.type, "bookings/fetch/pending");

function makeStore() {
  return configureStore({ reducer: { bookings: bookingsSlice.reducer } });
}
type RootState = ReturnType<ReturnType<typeof makeStore>["getState"]>;
{
  const store = makeStore();
  const before = store.getState();
  await store.dispatch(fetchBookings("2026-12-01"));
  store.dispatch(bookingPaid("b1"));
  assert.equal(store.getState().bookings.items[0]!.status, "paid");
  assert.equal(before.bookings.items.length, 0); // the old state object was never mutated
  assert.notEqual(store.getState(), before);
  store.dispatch(bookingsCleared());
  assert.deepEqual(store.getState().bookings, initialState);
}

// --- 2. Immer rule: mutate OR return, never both ----------------------------------------------
{
  const broken = createSlice({
    name: "todos",
    initialState: [] as string[],
    reducers: {
      added: (state, action: PayloadAction<string>) => state.push(action.payload) as never, // 🔴 returns the new length
    },
  });
  const store = configureStore({ reducer: broken.reducer });
  assert.throws(() => store.dispatch(broken.actions.added("x")), /modified its draft|returned a new value/i);
}

// --- 3. Dispatched thunks always resolve; unwrap() turns a rejection back into a throw ---------
{
  const store = makeStore();
  serverFails = true;
  const action = await store.dispatch(fetchBookings("2026-12-02")); // does NOT throw
  assert.equal(action.type, "bookings/fetch/rejected");
  assert.equal(store.getState().bookings.error, "No bookings service for 2026-12-02"); // from rejectWithValue
  await assert.rejects(store.dispatch(fetchBookings("2026-12-02")).unwrap(), (e) => e === "No bookings service for 2026-12-02");
  serverFails = false;
  const ok = await store.dispatch(fetchBookings("2026-12-03")).unwrap();
  assert.equal(ok.length, 2);
}

// --- 4. configureStore's development checks ---------------------------------------------------
{
  // Immer freezes the state it produces, so a mutation outside a reducer throws straight away.
  const store = makeStore();
  await store.dispatch(fetchBookings("2026-12-01"));
  assert.throws(() => {
    (store.getState().bookings.items[0] as Booking).status = "cancelled"; // 🔴 mutate outside a reducer
  }, TypeError);
}
{
  // A hand-written reducer (no Immer) that mutates: the immutability check middleware throws.
  const store = configureStore({
    reducer: (state: { n: number } = { n: 0 }, action: { type: string }) => {
      if (action.type === "inc") state.n++; // 🔴 real mutation
      return state;
    },
  });
  assert.throws(() => store.dispatch({ type: "inc" }), /mutation/i);
}
{
  const dateSlice = createSlice({
    name: "when",
    initialState: { at: null as Date | null },
    reducers: { set: (state, action: PayloadAction<Date>) => void (state.at = action.payload) },
  });
  const store = configureStore({ reducer: dateSlice.reducer });
  const messages = await captureConsole(() => store.dispatch(dateSlice.actions.set(new Date(0))));
  assert.ok(messages.some((m) => m.includes("non-serializable"))); // store ISO strings, not Date objects
}

// --- 5. useSelector: === comparison after every dispatch ----------------------------------------
const counts = { newArray: 0, memoized: 0 };
const selectPaidNew = (s: RootState) => s.bookings.items.filter((b) => b.status === "paid"); // new array each call
const selectPaidMemo = createSelector([(s: RootState) => s.bookings.items], (items) =>
  items.filter((b) => b.status === "paid"),
);
function PaidNew() {
  counts.newArray++;
  return <p>{useSelector(selectPaidNew).length}</p>;
}
function PaidMemo() {
  counts.memoized++;
  return <p>{useSelector(selectPaidMemo).length}</p>;
}
const otherSlice = createSlice({ name: "ui", initialState: { open: false }, reducers: { toggled: (s) => void (s.open = !s.open) } });
function Toggle() {
  const dispatch = useDispatch();
  return <button onClick={() => dispatch(otherSlice.actions.toggled())} />;
}
{
  const store = configureStore({ reducer: { bookings: bookingsSlice.reducer, ui: otherSlice.reducer } });
  await store.dispatch(fetchBookings("2026-12-01"));
  let container!: HTMLElement;
  const messages = await captureConsole(async () => {
    ({ container } = await render(
      <Provider store={store}>
        <PaidNew />
        <PaidMemo />
        <Toggle />
      </Provider>,
    ));
  });
  // React-Redux's development check: it runs each selector twice and warns if the results differ.
  assert.ok(messages.some((m) => m.includes("returned a different result when called with the same parameters")));
  await act(async () => click(container.querySelector("button"))); // unrelated action
  await act(async () => click(container.querySelector("button")));
  assert.equal(counts.newArray, 3); // re-rendered on every unrelated dispatch
  assert.equal(counts.memoized, 1); // same reference → no re-render
}

// --- 6. RTK Query: tags make a mutation refetch the queries that provide them -----------------------
const fakeDb = { slots: ["09:00", "10:00"] };
let slotFetches = 0;
const api = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Slot"],
  endpoints: (build) => ({
    getSlots: build.query<string[], void>({
      queryFn: async () => {
        slotFetches++;
        return { data: [...fakeDb.slots] };
      },
      providesTags: ["Slot"],
    }),
    bookSlot: build.mutation<null, string>({
      queryFn: async (time) => {
        fakeDb.slots = fakeDb.slots.filter((s) => s !== time);
        return { data: null };
      },
      invalidatesTags: ["Slot"],
    }),
  }),
});
function SlotList() {
  const { data, isLoading } = api.useGetSlotsQuery();
  const [bookSlot] = api.useBookSlotMutation();
  if (isLoading) return <p>Loading...</p>;
  return (
    <>
      <p className="slots">{data?.join(",")}</p>
      <button onClick={() => void bookSlot("09:00")}>Book 09:00</button>
    </>
  );
}
{
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });
  const { container, root } = await render(
    <Provider store={store}>
      <SlotList />
      <SlotList />
    </Provider>,
  );
  await act(async () => new Promise((r) => setTimeout(r, 20)));
  assert.equal(slotFetches, 1); // two components, one request (deduplicated cache)
  assert.equal(container.querySelector(".slots")!.textContent, "09:00,10:00");
  await act(async () => click(container.querySelector("button")));
  await act(async () => new Promise((r) => setTimeout(r, 20)));
  assert.equal(slotFetches, 2); // invalidatesTags → automatic refetch
  assert.equal(container.querySelector(".slots")!.textContent, "10:00");
  await act(async () => root.unmount());
  store.dispatch(api.util.resetApiState());
}

console.log("12 redux toolkit: all checks passed");
