// @ts-nocheck

function readSimpleString(data, pos = 0) {
  if (!data || data.length == 0) return [null, pos];

  let start = pos + 1;
  pos = start;
  for (; pos < data.length; pos++) {
    if (data[pos] == "\r") {
      break;
    }
  }
  return [data.slice(start, pos), pos + 2];
}

function readInteger(data, pos = 0) {
  if (!data || data.length == 0) return "no data";

  let start = pos + 1;
  pos = start;
  let value = 0;

  for (; pos < data.length; pos++) {
    if (data[pos] == "\r") break;
    value = value * 10 + (data[pos].charCodeAt(0) - 48);
  }

  return [value, pos + 2];
}

function readError(data, pos = 0) {
  let [msg, nextPos] = readSimpleString(data, pos);
  return [new Error(msg), nextPos];
}

function readBulkString(data, pos = 0) {
  if (!data || data.length == 0) return "no data";
  let start = pos + 1;
  let [length, i] = readLength(data, start);

  if (length == -1) {
    return [null, i];
  }

  let value = data.slice(i, i + length);

  return [value, i + length + 2];
}

function readArray(data, pos = 0) {
  if (!data || data.length === 0) return "no data";

  let start = pos + 1;
  let [length, i] = readLength(data, start);

  let result = [];

  for (let j = 0; j < length; j++) {
    let [value, nextPos] = DecodeOne(data, i);
    result.push(value);
    i = nextPos;
  }
  return [result, i];
}

export function readLength(data, start) {
  let i = start;
  let length = 0;
  for (; i < data.length; i++) {
    if (data[i] == "\r") break;
    length = length * 10 + (data[i].charCodeAt(0) - 48);
  }
  return [length, i + 2];
}

export function Decode(data) {
  if (!data || data.length == 0) return null;

  let [val, pos] = DecodeOne(data);

  return val;
}

export function DecodeOne(data, pos = 0) {
  if (!data || data.length == 0) return "No Data";

  switch (data[pos]) {
    case "+":
      return readSimpleString(data, pos);
    case ":":
      return readInteger(data, pos);
    case "-":
      return readError(data, pos);
    case "$":
      return readBulkString(data, pos);
    case "*":
      return readArray(data, pos);
    default:
      throw new Error("unknown resp type");
  }
}