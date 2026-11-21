# Syllabus

Style: stack-agnostic idea first, examples in TypeScript, always tied to real apps (booking, payments, reminders, invoices, dashboards). Each session: teach → check-in → build → update PROGRESS.md.

## Priority track (do these first: they came up in real interviews)
Interview feedback: explain flows end to end with architecture detail (schema, scheduling, email/payment integration), explain TypeScript fundamentals clearly (interface vs type, implements vs extends), and Stripe/webhooks/idempotency questions.
- NOW. Dates and time zones (topic 83), moved to the front because it came up in a recent interview, so expect follow-up questions or a paid task on it. Teach from MDN (Temporal and Date pages) and the date-fns docs, and check Temporal's current browser and Node.js support before stating it. Cover:
  1. Storing vs showing: store an instant (UTC) plus the business's IANA time zone (e.g. `America/New_York`), never a raw local string; show times in the viewer's zone.
  2. Daylight saving: a 9am booking on the day the clocks change, times that don't exist (spring forward) or happen twice (fall back), and recurring weekly slots across a DST change.
  3. date-fns vs Temporal: what each is for, what Temporal fixes over `Date` (immutability, real time-zone types like `ZonedDateTime` and `PlainDate`, clear arithmetic), and when you'd still use date-fns (with `@date-fns/tz`) in an existing codebase.
  4. Booking rules: overlapping slots, buffers between appointments, business hours in the business's zone, and deposit/balance due dates.
  Use `REAL-APP-NOTES.md` sections 1–2 for the real-app side: my app uses date-fns with `@date-fns/tz`, not Temporal, so teach Temporal as "what I'd use next and why", and drill the "gaps to check" list.
  Build `lesson-06/booking-timezones.ts` with `booking-timezones-TASK.md`: generate available slots for a business in one zone, viewed by a client in another, including a DST-change day, with buffers and overlap checks. Then do the "Say:" practice: explain out loud how your own booking app handles time zones, using the Trigger → Data → Processing → External → Failure → Trade-off order.
- P0. Catch-up check on topics 11–20 (taught, never checked): short re-explain + questions. Also show `pnpm exec tsc --noEmit --strict` output (topic 10).
- P1. Topics 4 and 5: `this`, call/apply/bind, prototypes (finish lesson-01 Parts 2–3). Needed before classes.
- P2. Topic 14: type aliases vs interfaces (declaration merging, unions, when to use which).
- P3. Topic 82: Stripe webhooks and payment state. Cover signature verification on the raw body, idempotency, storing processed event IDs with a unique constraint, duplicate and out-of-order events, concurrent deliveries and race conditions, transactional payment-state updates, retries, refunds, reconciliation, and Stripe CLI testing. Move this ahead of classes and inheritance due to interview feedback. Build `lesson-06/stripe-webhook.ts` with its matching `stripe-webhook-TASK.md`: process duplicate and concurrent events safely, then prove one payment-state transition is recorded.
- P4. Topic 22: classes (access modifiers, readonly, parameter properties, abstract classes).
- P5. Topic 23: extends vs implements, inheritance vs composition.
- P6. Topic 64: REST API design (idempotency, status codes, pagination, errors).
- P7. Topic 77: background jobs and scheduled work (reminders, emails), queues, retries with backoff.
- P8. Topics 70–72: keys, joins, transactions, unique constraints, indexes, N+1.
- P9. Topic 63: request lifecycle and middleware.
- P10. Topic 83: moved to NOW above. Re-test it here with harder follow-ups.
- P11. Topics 120–121: system design method + "design a booking system for many businesses" (double-booking prevention, slot holds, race conditions).
- P12. Practice: explain 3 end-to-end flows out loud (booking -> deposit -> reminder -> invoice) using Trigger -> Data -> Processing -> External -> Failure -> Trade-off.
- P13. UI interaction rules (topics 45, 53, and 55): truncation, wrapping, empty/loading/error states, and documenting assumptions with annotations and checklists before building. Build `lesson-05/booking-ui-states.ts` with `booking-ui-states-TASK.md`: model a booking list with long service names and all loading, empty, and error states; write the assumptions checklist first.
- P14. Stacking context (topics 42 and 46): what creates a context (`transform`, `opacity`, `position`, `z-index`) and how to debug layers and animations in DevTools. Build `lesson-05/booking-overlay.ts` with `booking-overlay-TASK.md`: create a booking/payment overlay and diagnose why its confirmation layer appears behind another layer.
- P15. State architecture (topic 50): local state vs lifted state vs a global store vs a state machine, and when to choose each. Build `lesson-05/booking-state-architecture.ts` with `booking-state-architecture-TASK.md`: model a booking reschedule and checkout flow, choose a state approach, and explain the trade-off.
- P16. React re-renders and memoization (topic 51): render triggers, `memo`, `useMemo`, `useCallback`, referential equality, and when not to memoise. Build `lesson-05/booking-dashboard-renders.ts` with `booking-dashboard-renders-TASK.md`: trace updates in a booking dashboard, identify unnecessary renders, and justify each memoization choice.
- P17. Code review judgment (topics 94 and 97): when to request a change or leave a comment; overused `useEffect`; when to extract a custom hook. Build `lesson-05/booking-component-review.ts` with `booking-component-review-TASK.md`: review a booking editor, separate required changes from comments, then fix only the required issues.
After the priority track, continue the stages below in order from topic 6, skipping topics already Solid.

## Stage 1 — JavaScript core under TypeScript
1. Values, types, equality (== vs ===), truthy and falsy
2. Scope: let, const, var, hoisting, block scope
3. Closures and where they are used in real apps
4. `this`, arrow functions, call / apply / bind
5. Prototypes and how JavaScript classes really work
6. Callbacks → Promises → async/await, and error handling
7. The event loop: call stack, microtasks, macrotasks, timers
8. Arrays and objects: map/filter/reduce, spread/rest, destructuring, shallow vs deep copy, immutability

## Stage 2 — TypeScript basics
9. What TypeScript is, TS vs JS, the compile step, types disappear at runtime
10. tsc, tsconfig basics, strict mode
11. Primitive types, arrays, tuples, any / unknown / never / void, null / undefined and strictNullChecks
12. Type inference vs annotations, type widening
13. Literal types, union types, intersection types
14. Type aliases vs interfaces, extending and merging
15. Object types: optional, readonly, index signatures, excess property checks
16. Functions: parameter and return types, optional/default/rest parameters, overloads
17. Narrowing: typeof, truthiness, equality, `in`, instanceof, control-flow analysis
18. Discriminated unions, `never`, exhaustiveness checking
19. Type predicates (`x is T`) and assertion functions
20. Type assertions (`as`), non-null `!`, `as const`, `satisfies`
21. Enums vs literal unions
22. Classes: access modifiers, readonly, parameter properties, abstract classes
23. extends vs implements, inheritance vs composition, overriding, polymorphism

## Stage 3 — TypeScript intermediate and advanced
24. Generics basics (functions, interfaces, classes)
25. Generic constraints, defaults, keyof
26. Structural typing and type compatibility
27. `typeof` as a type operator, indexed access types
28. Utility types 1: Partial, Required, Readonly, Pick, Omit, Record
29. Utility types 2: Exclude, Extract, NonNullable, ReturnType, Parameters, Awaited, InstanceType
30. Mapped types
31. Conditional types and `infer`
32. Template literal types
33. Recursive types
34. Typing async code and errors: Promise<T>, `unknown` in catch, Result-style returns
35. Types vs runtime validation: schemas (e.g. Zod), DTOs, sharing types between frontend and backend
36. Modules, type-only imports, declaration files (.d.ts), @types packages
37. Decorators and where they are used (e.g. NestJS, Angular)
38. tsconfig in depth (strict flags, target, module, paths), linting/formatting, common TypeScript traps

## Stage 4 — How the web works
39. The internet: IP, DNS, domains, hosting
40. HTTP: methods, status codes, headers
41. HTTPS and TLS
42. How browsers render a page (DOM, CSSOM, layout, paint)
43. Web servers, reverse proxies (e.g. Nginx), load balancers
44. Same-origin policy and CORS

## Stage 5 — Frontend concepts
45. Semantic HTML and forms
46. CSS box model, flexbox, grid
47. Responsive and mobile-first design
48. Browser APIs: fetch, localStorage/sessionStorage, cookies, IndexedDB
49. Component-based UI: props, state, composition (framework-agnostic)
50. State management patterns: local, lifted, global stores, server state
51. Re-renders and memoization
52. Client-side routing
53. Forms and validation: controlled vs uncontrolled
54. Rendering strategies: CSR, SSR, SSG, ISR, streaming, hydration, server components
55. Client data fetching and caching: loading/error states, stale-while-revalidate
56. Frontend performance and Core Web Vitals (LCP, INP, CLS)
57. Code splitting, lazy loading, bundlers and build tools
58. Accessibility (a11y)
59. Frontend security: XSS, Content Security Policy, where to store tokens
60. PWAs, service workers, web components
61. Design systems and component libraries
62. Frontend testing (unit, component, end-to-end), DevTools and Lighthouse

## Stage 6 — Backend concepts
63. Request lifecycle and middleware
64. REST API design: resources, methods, idempotency, status codes, versioning, pagination
65. GraphQL, gRPC, OpenAPI specs — when to use which
66. Authentication: basic, cookie/session, token/JWT, refresh tokens
67. OAuth 2.0, OpenID Connect, SSO, SAML basics
68. Authorization: roles, permissions, ownership checks, multi-tenant apps
69. Password hashing: bcrypt/scrypt/argon2, and why not MD5/SHA
70. Relational databases: tables, keys, joins, normalisation
71. ACID, transactions, isolation levels
72. Indexes, query plans (EXPLAIN), the N+1 problem
73. ORMs and migrations
74. NoSQL types (document, key-value, graph) and when to choose them
75. Scaling databases: replication, read replicas, sharding, connection pooling
76. CAP theorem and consistency models
77. Message brokers and queues (e.g. RabbitMQ, Kafka), pub/sub, background jobs
78. Real-time: polling, long polling, Server-Sent Events, WebSockets
79. Server-side validation and error handling
80. File uploads and object storage, signed URLs
81. Search: full-text search, search engines (e.g. Elasticsearch) basics
82. Webhooks and payments engineering: idempotency keys, retries, reconciliation, refunds
83. Dates and time zones: store UTC, show local, daylight-saving traps, date-fns vs the Temporal API
84. Rate limiting and throttling

## Stage 7 — Cross-cutting engineering
85. Caching layers and HTTP caching (Cache-Control, ETag, CDN)
86. Server caching (e.g. Redis): cache-aside, write-through, TTL, invalidation
87. Scalability: vertical vs horizontal, stateless services, load balancing
88. Resilience: timeouts, retries with backoff, circuit breakers, backpressure, graceful degradation
89. Architecture styles: monolith, SOA, microservices, serverless, service mesh
90. Observability: logs, metrics, traces, alerts
91. Profiling and backend performance tuning
92. OWASP Top 10 and server security
93. Testing strategy: test pyramid, unit/integration/E2E, mocking, TDD
94. Clean code and refactoring
95. SOLID principles
96. Design patterns: factory, singleton, strategy, observer, adapter, dependency injection
97. Git workflows and code review standards
98. CI/CD pipelines
99. Docker and containers
100. Config, secrets and the 12-factor app
101. Deployment and hosting: VMs, platforms, serverless, CDNs
102. Documentation and API docs

## Stage 8 — AI engineering basics (relevant to AI training/evaluation work)
103. How LLMs work: tokens, context window, sampling, hallucinations
104. Prompting techniques
105. Structured outputs and function/tool calling
106. Embeddings and vector search
107. RAG (retrieval-augmented generation)
108. Agents and MCP
109. AI-assisted coding: where AI code is strong and where it fails
110. Evaluating AI-generated code: correctness, edge cases, security, readability
111. Writing good evaluations: rubrics, test cases, comparing two model answers
112. Writing coding tasks for AI training: clear spec, tests, reproducible environment

## Stage 9 — Coding patterns and system design
113. Problem-solving method and Big-O
114. Arrays and hashing
115. Two pointers and sliding window
116. Stacks, queues, binary search
117. Linked lists, trees, BFS and DFS
118. Recursion, backtracking, dynamic programming basics
119. Sorting, intervals, heaps
120. System design method: requirements, estimates, components, trade-offs
121. Design: a booking system for many businesses
122. Design: URL shortener, rate limiter, chat app
123. Behavioural answers (STAR, real examples only)
124. Final mock: mixed questions

After 124: cycle 2 from topic 1 with harder follow-up questions, prioritising Shaky topics.
