# Interview bank: micro1 practice question lists

Source: micro1's public practice pages (micro1.ai/interview-prep), checked 22 Nov 2026. These are the 7 practice roles closest to my work. micro1's AI interviewer adapts its questions, so these are the topics it asks about, not a script.
Questions are summarised in my own words. Open the page for the exact wording.

How this file is used: see `interview-bank/README.md`.

---

## React Developer (react-developer-interview-questions)
| id | Topic | Track |
|---|---|---|
| RE1 | Advanced JS a senior React dev must know (closures, promises, ES6+, prototypes, functional patterns) | A3, A6, A8 |
| RE2 | Component lifecycle phases and what each is for (mount, update, unmount; `useEffect`) | I1, I7 |
| RE3 | Ways to manage state in large React apps (local, Context, stores, server-state libraries) | I3, I7 |
| RE4 | Techniques to cut re-renders (`memo`, `useMemo`, `useCallback`, state structure) | I7 |
| RE5 | Controlled vs uncontrolled components | I4 |
| RE6 | Structuring components in a large codebase (feature folders, presentational vs container, barrels) | I8, A36 |
| RE7 | Ways to handle side effects (`useEffect`, `useLayoutEffect`, middleware, custom hooks) | I7, I8 |
| RE8 | Redux: strengths and limits | I11 |
| RE9 | Using ES6+ in React projects (transpiling, standards) | A8, A10 |
| RE10 | What bad state management does to performance | I7 |

## JavaScript Developer (javascript-developer-interview-questions)
| id | Topic | Track |
|---|---|---|
| JS1 | Event propagation and delegation in large apps | I12 |
| JS2 | Common async problems and fixes (callback hell, errors, race conditions) | A6, D1 |
| JS3 | Closures for modules and private state | A3 |
| JS4 | Memory leaks from DOM event listeners | I12 |
| JS5 | Controlling execution order in async code (sequence vs parallel) | A6, F1 |
| JS6 | Hoisting and how it affects scope (`var` vs `let`/`const`) | A2 |
| JS7 | Avoiding callback hell | A6 |
| JS8 | Implementing throttle and debounce | I12, M8 |
| JS9 | Advanced closure uses in async work (memoize, retries, latest-only) | A3, A6, F4 |
| JS10 | Scope with ES modules and block scoping | A2 |

## Web UI Developer (web-ui-developer-interview-questions)
| id | Topic | Track |
|---|---|---|
| WU1 | Structuring large React apps | I8, A36 |
| WU2 | Optimising component rendering | I7 |
| WU3 | CSS-in-JS for scalable styling | I10 |
| WU4 | Choosing a state library for complex apps | I11 |
| WU5 | Side effects together with state management | I7 |
| WU6 | Responsive and adaptive design with CSS-in-JS | I9, I10 |
| WU7 | Server rendering with CSS-in-JS: problems and fixes | I10, I2 |
| WU8 | Designing a shared component library with consistent styling | I10 |
| WU9 | Advanced state patterns in large apps (reducers, state machines, selectors) | I7 |
| WU10 | Keeping CSS-in-JS styles maintainable in big projects | I10 |

## Front-End Developer (front-end-developer-interview-questions)
| id | Topic | Track |
|---|---|---|
| FE1 | Keeping HTML/CSS codebases scalable | I9, I10 |
| FE2 | Cross-browser compatibility | I9 |
| FE3 | Advanced JS concepts for frontend work | A2, A3, A6, A7 |
| FE4 | Frontend performance optimisation | G5 |
| FE5 | Structuring CSS for large responsive apps | I9, I10 |
| FE6 | Main considerations for responsive layouts | I9 |
| FE7 | State and data flow in large JS apps | I3, I7 |
| FE8 | Modularising JS in big projects | A36 |
| FE9 | Debugging complex frontend issues | R2, R3, R9 |
| FE10 | Progressive enhancement vs graceful degradation | I9 |

## Node.js Developer (node-js-developer-interview-questions)
| id | Topic | Track |
|---|---|---|
| NO1 | Patterns for async programming in Node | A6, F1 |
| NO2 | Event-driven architecture and scaling | F8 |
| NO3 | Error handling in async Node code | F4 |
| NO4 | The event loop in server-side JS | A7, F8 |
| NO5 | Designing async APIs in Node | A6, F8, E2 |
| NO6 | Preventing race conditions in async code | C2, C3, D2 |
| NO7 | Integrating third-party async libraries | A6, F4 |
| NO8 | Debugging async and event-driven code | R3 |
| NO9 | Blocking code and the event loop: impact and fixes | F8 |
| NO10 | Event emitters at scale: benefits and trade-offs | F8 |

## Back-End Developer (backend-developer-interview-questions)
| id | Topic | Track |
|---|---|---|
| BE1 | Database schema design for large apps | C1, C5 |
| BE2 | REST APIs for heavy traffic | G6 |
| BE3 | Data consistency and integrity across services | C2, D1, F2 |
| BE4 | Optimising SQL under high concurrency | C3, C7 |
| BE5 | Structuring async workflows in scalable back ends | F1, F2 |
| BE6 | Transactions across multiple services (sagas, outbox) | F2, E3 |
| BE7 | API versioning | G6 |
| BE8 | Monitoring and logging API performance | F6 |
| BE9 | Async error handling and retries | F4, D2 |
| BE10 | Enforcing and auditing database security | C8, H8 |

## API Developer (api-developer-interview-questions)
| id | Topic | Track |
|---|---|---|
| AP1 | REST API design for scale and maintainability | G6 |
| AP2 | Key API security practices | H2, H5, H6 |
| AP3 | API performance under high traffic | G6 |
| AP4 | Backward compatibility during updates | G6 |
| AP5 | Authentication and authorisation for REST APIs | H1, H2 |
| AP6 | Preventing injection, CSRF and XSS | H8 |
| AP7 | Faster serialisation/deserialisation | G6 |
| AP8 | API gateways for security and performance | G6, H6 |
| AP9 | Monitoring and logging production APIs | F6 |
| AP10 | Rate limiting and throttling | G6, H6 |

---

**Priority now:** RE and JS first (frontend interviews are live). Then NO and BE, because my micro1 backend feedback asked me to explain flows end to end. Then AP, alongside Tracks C–H.
