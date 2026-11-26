# 13. Server Components and `'use client'` (React's side)

**Sources (react.dev, read in full unless marked):**
[Server Components](https://react.dev/reference/rsc/server-components) (prose) ·
[`'use client'`](https://react.dev/reference/rsc/use-client) (caveats, how it marks client code, advantages and limits, serialisable types) ·
[React 19.3 post: `<Context>` in Server Components](https://react.dev/blog/2026/09/09/react-19-3#context-can-be-rendered-directly-in-server-components) ·
[Synchronizing with Effects: alternatives to fetching in Effects](https://react.dev/learn/synchronizing-with-effects#what-are-good-alternatives-to-data-fetching-in-effects)

**No runnable checks:** Server Components need a framework or bundler, so this page is read-only. The Next.js App Router side (file conventions, Server Actions, caching, deploying) is in module 08a.

**Replaces:** the React parts of the old guide's R6 follow-up ("server vs client components") and R7 follow-up ("fetching in Next.js instead of `useEffect`").

## Explain

### What they are
- A component type that **renders ahead of time, before bundling, in an environment separate from the client app**: once at build time (on CI), or per request on a web server.
- **At build time:** read files or a CMS and send only the rendered result. react.dev's example drops about 75 KB (gzipped) of markdown libraries and a second request from the client bundle.
- **Per request:** read your data layer **directly, without building an API**, then pass data and JSX as props to Client Components.
- Server Components can be **`async`** and `await` during render; React suspends and streams with Suspense. You can also start a promise on the server and read it on the client with `use` (topic 10).
- React's stance: stable for apps in React 19, but the bundler/framework APIs underneath don't follow semver, so frameworks pin versions.

### `'use client'`
- At the very top of a file, before imports (comments are fine).
- It marks that module **and everything it imports** as client code, sent to and run in the browser.
- A component usage is a Client Component if it's defined in a `'use client'` module or imported and called from a Client Component; otherwise it's a Server Component.
- **There's no directive for Server Components.** `'use server'` is for **Server Functions** (actions called from the client), a common confusion.
- Props passed from server to client must be **serialisable**: primitives, iterables of serialisable values, `Date`, plain objects, Server Functions, and the other types on the page. Not arbitrary class instances or ordinary functions.

### Trade-offs (from the `'use client'` page)
- **Server Components:** less code sent to and run by the client; close to the data (filesystem, low-latency fetches).
- **Limits:** no interactivity (event handlers must be registered on the client) and most Hooks aren't available (`useState`, Effects).
- So: server by default for fetching and rendering, and a small `'use client'` component where you need state, effects or handlers. Putting the directive as low in the tree as possible is the common advice; that phrasing is mine, following from "it marks the whole imported subtree".

### Context with Server Components
Server Components can't **create** context, but they can render a provider imported from a `'use client'` module. Since **React 19.3** they can render `<SomeContext value={…}>` directly, with no wrapper `Provider` component.

### Where data fetching should live
react.dev's recommendation for apps: use your framework's data fetching, or a client cache like TanStack Query, useSWR or React Router, rather than raw `fetch` in Effects. Effects don't run on the server, cause waterfalls and don't cache (topic 03).

## Practice questions

**Q1. What's a Server Component?** A component that renders ahead of time on the server (at build or request time), so its code and dependencies never reach the browser; it can be async and read data directly.

**Q2. Does `'use server'` mark a Server Component?** No. Server Components are the default in frameworks that support them; `'use server'` marks Server Functions.

**Q3. Why can't a Server Component use `useState`?** It doesn't run in the browser and isn't re-rendered there; interactivity needs a Client Component.

**Q4. What does `'use client'` do to files it imports?** They become client code too, so keep the boundary small.

**Q5. What can you pass from a Server Component to a Client Component?** Serialisable props (primitives, plain objects, arrays, `Date`, Server Functions, JSX) but not ordinary functions or class instances.

## Say it (about 30 seconds)
"Server Components render ahead of time on the server, at build time or per request. They can be async and read the database directly, and none of their code ships to the browser. Client Components, marked with `'use client'` at the top of a module, run in the browser and are needed for state, effects and event handlers; the directive pulls in everything that module imports, so I keep it on small interactive pieces. Props across that boundary must be serialisable. And `'use server'` isn't for Server Components; it marks Server Functions."
