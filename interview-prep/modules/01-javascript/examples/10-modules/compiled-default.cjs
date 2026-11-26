// What a transpiler typically emits for `export default function area() {}` (MDN example).
module.exports.default = function area(side) {
  return side ** 2;
};
