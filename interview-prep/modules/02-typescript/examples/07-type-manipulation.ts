// Topic 07: keyof, typeof, indexed access, conditional types, infer, mapped and template literal types.
// Most checks here are type-level: `Expect<Equal<A, B>>` fails to compile unless A and B are the same type.
import assert from "node:assert/strict";

// A small helper used throughout (a common community pattern, not a built-in type).
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
// @ts-expect-error TS2344 — proof the helper isn't vacuous: different types fail
type _0 = Expect<Equal<string, number>>;

// --- 1. keyof --------------------------------------------------------------------
type Point = { x: number; y: number };
type P = keyof Point;
type _1 = Expect<Equal<P, "x" | "y">>;
type Arrayish = { [n: number]: unknown };
type Mapish = { [k: string]: boolean };
type _2 = Expect<Equal<keyof Arrayish, number>>;
type _3 = Expect<Equal<keyof Mapish, string | number>>; // obj[0] is the same as obj["0"]

// --- 2. typeof in a TYPE position ------------------------------------------------
const s = "hello";
let n: typeof s = "hello"; // the literal "hello"
function f() {
  return { x: 10, y: 3 };
}
type R = ReturnType<typeof f>;
type _4 = Expect<Equal<R, { x: number; y: number }>>;
// @ts-expect-error TS2749 — 'f' is a value; you need typeof f
type R2 = ReturnType<f>;
assert.equal(n, "hello");

// --- 3. Indexed access types -------------------------------------------------------
type Person = { age: number; name: string; alive: boolean };
type _5 = Expect<Equal<Person["age"], number>>;
type _6 = Expect<Equal<Person["age" | "name"], number | string>>;
type _7 = Expect<Equal<Person[keyof Person], number | string | boolean>>;
// @ts-expect-error TS2339 — no such property
type I1 = Person["alve"];

const MyArray = [
  { name: "Alice", age: 15 },
  { name: "Bob", age: 23 },
];
type Item = (typeof MyArray)[number]; // element type of an array
type _8 = Expect<Equal<Item, { name: string; age: number }>>;
type _9 = Expect<Equal<(typeof MyArray)[number]["age"], number>>;
const key = "age";
// @ts-expect-error TS2749 — a const VALUE can't index a type; use `type key = "age"`
type Age = Person[key];

// --- 4. Conditional types ------------------------------------------------------------
interface IdLabel {
  id: number;
}
interface NameLabel {
  name: string;
}
type NameOrId<T extends number | string> = T extends number ? IdLabel : NameLabel;
function createLabel<T extends number | string>(idOrName: T): NameOrId<T> {
  return (typeof idOrName === "number" ? { id: idOrName } : { name: idOrName }) as NameOrId<T>;
}
const lbl = createLabel("typescript"); // NameLabel — one signature instead of 3 overloads
assert.equal(lbl.name, "typescript");

type MessageOf<T> = T extends { message: unknown } ? T["message"] : never;
type _10 = Expect<Equal<MessageOf<{ message: string }>, string>>;
type _11 = Expect<Equal<MessageOf<{ bark(): void }>, never>>;

type Flatten<T> = T extends unknown[] ? T[number] : T;
type _12 = Expect<Equal<Flatten<string[]>, string>>;
type _13 = Expect<Equal<Flatten<number>, number>>;

// infer: pull a type out of another type.
type GetReturnType<T> = T extends (...args: never[]) => infer Return ? Return : never;
type _14 = Expect<Equal<GetReturnType<() => number>, number>>;
type _15 = Expect<Equal<GetReturnType<(a: boolean, b: boolean) => boolean[]>, boolean[]>>;
// With overloads, inference uses the LAST signature.
declare function stringOrNum(x: string): number;
declare function stringOrNum(x: number): string;
declare function stringOrNum(x: string | number): string | number;
type _16 = Expect<Equal<ReturnType<typeof stringOrNum>, string | number>>;

// Distributive: a conditional on a naked type parameter maps over each union member.
type ToArray<T> = T extends unknown ? T[] : never;
type _17 = Expect<Equal<ToArray<string | number>, string[] | number[]>>;
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;
type _18 = Expect<Equal<ToArrayNonDist<string | number>, (string | number)[]>>;

// --- 5. Mapped types ---------------------------------------------------------------------
type OptionsFlags<T> = { [K in keyof T]: boolean };
type Features = { darkMode: () => void; newUserProfile: () => void };
type _19 = Expect<Equal<OptionsFlags<Features>, { darkMode: boolean; newUserProfile: boolean }>>;

type CreateMutable<T> = { -readonly [K in keyof T]: T[K] };
type LockedAccount = { readonly id: string; readonly name: string };
type _20 = Expect<Equal<CreateMutable<LockedAccount>, { id: string; name: string }>>;
type Concrete<T> = { [K in keyof T]-?: T[K] };
type MaybeUser = { id: string; name?: string; age?: number };
type _21 = Expect<Equal<Concrete<MaybeUser>, { id: string; name: string; age: number }>>;

// Key remapping with `as`.
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type LazyPerson = Getters<{ name: string; age: number }>;
type _22 = Expect<Equal<LazyPerson, { getName: () => string; getAge: () => number }>>;
type RemoveKindField<T> = { [K in keyof T as Exclude<K, "kind">]: T[K] };
type _23 = Expect<Equal<RemoveKindField<{ kind: "circle"; radius: number }>, { radius: number }>>;

// --- 6. Template literal types -------------------------------------------------------------
type EmailLocaleIDs = "welcome_email" | "email_heading";
type FooterLocaleIDs = "footer_title" | "footer_sendoff";
type AllLocaleIDs = `${EmailLocaleIDs | FooterLocaleIDs}_id`;
type _24 = Expect<Equal<AllLocaleIDs, "welcome_email_id" | "email_heading_id" | "footer_title_id" | "footer_sendoff_id">>;
type Lang = "en" | "ja";
type _25 = Expect<Equal<`${Lang}_${"a" | "b"}`, "en_a" | "en_b" | "ja_a" | "ja_b">>; // cross-multiplied

type PropEventSource<T> = {
  on<K extends string & keyof T>(eventName: `${K}Changed`, callback: (newValue: T[K]) => void): void;
};
function makeWatchedObject<T extends object>(obj: T): T & PropEventSource<T> {
  const handlers: Record<string, ((v: unknown) => void)[]> = {};
  const source: PropEventSource<T> = {
    on(eventName, callback) {
      (handlers[eventName] ??= []).push(callback as (v: unknown) => void);
    },
  };
  return Object.assign(obj, source);
}
const person = makeWatchedObject({ firstName: "Sam", lastName: "Okafor", age: 26 });
person.on("ageChanged", (newAge) => {
  newAge.toFixed(); // newAge: number, inferred from the event name
});
person.on("firstNameChanged", (newName) => newName.toUpperCase()); // string
// @ts-expect-error TS2345 — "firstName" (missing "Changed") isn't a valid event name
person.on("firstName", () => {});
// @ts-expect-error TS2345 — typo caught at compile time
person.on("frstNameChanged", () => {});

type _26 = Expect<Equal<Uppercase<"hi">, "HI">>;
type _27 = Expect<Equal<Uncapitalize<"Hello">, "hello">>;

console.log("07 type manipulation: all checks passed");
