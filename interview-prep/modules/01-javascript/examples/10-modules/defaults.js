// `export default value` exports the VALUE at that moment.
// `export { name as default }` exports the live BINDING.
let current = "first";
export default current;
export { current as liveDefault };
export function change() {
  current = "second";
}
