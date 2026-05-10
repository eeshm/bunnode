// @ts-nocheck
//RESP protocol


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
  if (!data || data.length == 0) throw new Error("no data");
  let start = pos + 1;
  let [length, i] = readLength(data, start);

  if (length == -1) {
    return [null, i];
  }

  if (i + length + 2 > data.length) {
    throw new Error("Incomplete bulk string");
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
  let found = false;
  for (; i < data.length; i++) {
    if (data[i] == "\r") {
      found = true;
      break;
    }
    length = length * 10 + (data[i].charCodeAt(0) - 48);
  }
  
  if (!found || i + 1 >= data.length || data[i+1] !== "\n") {
    throw new Error("Incomplete length");
  }
  return [length, i + 2]; //skip /r/n
}

export function Decode(data) {
  if (!data || data.length == 0) return [[], 0];

  let values = [];
  let pos = 0;

  while (pos < data.length) {
    try {
      let [val, nextPos] = DecodeOne(data, pos);
      values.push(val);
      pos = nextPos;
    } catch {
      // Incomplete RESP frame; wait for more bytes.
      break;
    }
  }

  return [values, pos];
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
