// Top-level await makes this module (and every module importing it) asynchronous.
export const locale = await Promise.resolve("en-US");
