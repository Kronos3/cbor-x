var msgpackr = tryRequire("..");
var msgpack_node = tryRequire("msgpack");
var msgpack_lite = tryRequire("msgpack-lite");
var msgpack_js = tryRequire("msgpack-js");
var msgpack_js_v5 = tryRequire("msgpack-js-v5");
var msgpack5 = tryRequire("msgpack5");
var msgpack_unpack = tryRequire("msgpack-unpack");
var msgpack_codec = tryRequire("msgpack.codec");
var notepack = tryRequire("notepack");
var what_the_pack = tryRequire("what-the-pack");
var avro = tryRequire('avsc')

msgpack5 = msgpack5 && msgpack5();
msgpack_codec = msgpack_codec && msgpack_codec.msgpack;
what_the_pack = what_the_pack && what_the_pack.initialize(2**20);

var pkg = require("../package.json");
var data = require("./example2.json");
var packed = msgpack_lite.encode(data);
var expected = JSON.stringify(data);

var argv = Array.prototype.slice.call(process.argv, 2);

if (argv[0] === "-v") {
  console.warn(pkg.name + " " + pkg.version);
  process.exit(0);
}

var limit = 5;
if (argv[0] - 0) limit = argv.shift() - 0;
limit *= 1000;

var COL1 = 58;
var COL2 = 7;
var COL3 = 5;
var COL4 = 6;

console.log(rpad("operation", COL1), "|", "  op  ", "|", "  ms ", "|", " op/s ");
console.log(rpad("", COL1, "-"), "|", lpad(":", COL2, "-"), "|", lpad(":", COL3, "-"), "|", lpad(":", COL4, "-"));

var buf, obj;

if (JSON) {
  buf = bench('buf = Buffer(JSON.stringify(obj));', JSON_stringify, data);
  obj = bench('obj = JSON.parse(buf);', JSON.parse, buf);
  test(obj);
}

if (msgpackr) {
//  let serializer = new msgpackr.Serializer({ objectsAsMaps: true })
  buf = bench('require("msgpackr").serialize(obj);', msgpackr.serialize, data);
//    buf = bench('require("msgpack").serialize(obj);', data => {let result = serializer.serialize(data); serializer.resetMemory(); return result;}, data);

  obj = bench('require("msgpackr").parse(buf);', msgpackr.parse, buf);
  test(obj);

  serializer = new msgpackr.Serializer({ structures: [] })
  buf = bench('msgpackr w/ shared structures: serializer.serialize(obj);', serializer.serialize.bind(serializer), data);
//  buf = bench('msgpackr w/ shared structures: serializer.serialize(obj);', data => {let result = serializer.serialize(data); serializer.resetMemory(); return result;}, data);

  obj = bench('msgpackr w/ shared structures: serializer.parse(buf);', serializer.parse.bind(serializer), buf);
  test(obj);
}

if (msgpack_lite) {
  buf = bench('buf = require("msgpack-lite").encode(obj);', msgpack_lite.encode, data);
  obj = bench('obj = require("msgpack-lite").decode(buf);', msgpack_lite.decode, packed);
  test(obj);
}
/*
if (msgpack_node) {
  buf = bench('buf = require("msgpack").pack(obj);', msgpack_node.pack, data);
  obj = bench('obj = require("msgpack").unpack(buf);', msgpack_node.unpack, buf);
  test(obj);
}

if (msgpack_codec) {
  buf = bench('buf = Buffer(require("msgpack.codec").msgpack.pack(obj));', msgpack_codec_pack, data);
  obj = bench('obj = require("msgpack.codec").msgpack.unpack(buf);', msgpack_codec.unpack, buf);
  test(obj);
}

if (msgpack_js_v5) {
  buf = bench('buf = require("msgpack-js-v5").encode(obj);', msgpack_js_v5.encode, data);
  obj = bench('obj = require("msgpack-js-v5").decode(buf);', msgpack_js_v5.decode, buf);
  test(obj);
}

if (msgpack_js) {
  buf = bench('buf = require("msgpack-js").encode(obj);', msgpack_js.encode, data);
  obj = bench('obj = require("msgpack-js").decode(buf);', msgpack_js.decode, buf);
  test(obj);
}

if (msgpack5) {
  buf = bench('buf = require("msgpack5")().encode(obj);', msgpack5.encode, data);
  obj = bench('obj = require("msgpack5")().decode(buf);', msgpack5.decode, buf);
  test(obj);
}

if (notepack) {
  buf = bench('buf = require("notepack").encode(obj);', notepack.encode, data);
  obj = bench('obj = require("notepack").decode(buf);', notepack.decode, buf);
  test(obj);
}
if (what_the_pack) {
  buf = bench('require("what-the-pack")... encoder.encode(obj);', what_the_pack.encode, data);
  obj = bench('require("what-the-pack")... encoder.decode(buf);', what_the_pack.decode, buf);
  test(obj);
}

if (msgpack_unpack) {
  obj = bench('obj = require("msgpack-unpack").decode(buf);', msgpack_unpack, packed);
  test(obj);
}
*/
if (avro) {
  const type = avro.Type.forValue(data);
  buf = bench('require("avsc")...make schema/type...type.toBuffer(obj);', type.toBuffer.bind(type), data);
  obj = bench('require("avsc")...make schema/type...type.toBuffer(obj);', type.fromBuffer.bind(type), buf);
}

function JSON_stringify(src) {
  return Buffer(JSON.stringify(src));
}

function msgpack_codec_pack(data) {
  return Buffer(msgpack_codec.pack(data));
}

function bench(name, func, src) {
  if (argv.length) {
    var match = argv.filter(function(grep) {
      return (name.indexOf(grep) > -1);
    });
    if (!match.length) return SKIP;
  }
  var ret, duration;
  var start = new Date() - 0;
  var count = 0;
  while (1) {
    var end = new Date() - 0;
    duration = end - start;
    if (duration >= limit) break;
    while ((++count) % 100) ret = func(src);
  }
  name = rpad(name, COL1);
  var score = Math.floor(count / duration * 1000);
  count = lpad(count, COL2);
  duration = lpad(duration, COL3);
  score = lpad(score, COL4);
  console.log(name, "|", count, "|", duration, "|", score);
  return ret;
}

function rpad(str, len, chr) {
  if (!chr) chr = " ";
  while (str.length < len) str += chr;
  return str;
}

function lpad(str, len, chr) {
  if (!chr) chr = " ";
  str += "";
  while (str.length < len) str = chr + str;
  return str;
}

function test(actual) {
  if (actual === SKIP) return;
  actual = JSON.stringify(actual);
  if (actual === expected) return;
  console.warn("expected: " + expected);
  console.warn("actual:   " + actual);
}

function SKIP() {
}

function tryRequire(name) {
  try {
    return require(name);
  } catch (e) {
    // ignore
  }
}