import { log } from "./log.js";
log.push("main body");
import "./first.js"; // imports are hoisted: dependencies run before main's body
import "./second.js";
