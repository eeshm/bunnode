// @ts-nocheck

function readSimpleString(data, pos = 0) {
  if (data.length == 0 || !data) return "no data";

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

function readError(data) {
  return readSimpleString(data);
}

function readBulkString(data,pos =0){
    if (!data || data.length == 0) return "no data";
    let start = pos +1;
    let [data, pos]= readLength(data,start);


}





function readLength (data,start){
    let i = pos;
    let length =0;
    for(;i <data.length;i++){
        if(data[i] == "\r") break;

        length = length *10 + (data[i].charCodeAt(0) -48);
    }
}

function Decode(data) {
  if (!data || data.value == null) return null;

  let { val, err } = DecodeOne(data);

  return val;
}

function DecodeOne(data) {
  if (data.length == 0) return "No Data";

  switch (data[0]) {
    case "+":
      return readSimpleString(data);
    case ":":
      return readInteger(data);
    case "-":
      return readError(data);
    case "$":
      return readBulkString(data);
    case "*":
      return readableStreamToArray(data);
  }
  return null || 0;
}
