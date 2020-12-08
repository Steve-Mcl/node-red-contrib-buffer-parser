
/**
* number2bcd -> takes a bcd number and returns the corresponding decimal value
* @param {Number} number BCD number to convert
* @param {*} digits no of digits (default 4)
*/
const bcd2number = function (number, digits = 4) {
    let loByte = (number & 0x00ff);
    let hiByte = (number >> 8) & 0x00ff;
    let n = 0;
    n += (loByte & 0x0F) * 1;
    if (digits < 2) return n;
    n += ((loByte >> 4) & 0x0F) * 10;
    if (digits < 3) return n;
    n += (hiByte & 0x0F) * 100;
    if (digits < 4) return n;
    n += ((hiByte >> 4) & 0x0F) * 1000;
    return n;
}


/**
    * number2bcd -> takes a number and returns the corresponding BCD value.
    * @param {Number} number number to convert to bcd
    * @param {Number} [digits] no of digits (default 4)
    * @returns {Buffer} nodejs buffer 
    */
const number2bcd = function (number, digits) {
    var s = digits || 4; //default value: 4
    var n = 0;

    n = (number % 10);
    number = (number / 10) | 0;
    if (s < 2) return n;
    n += (number % 10) << 4;
    number = (number / 10) | 0;
    if (s < 3) return n;
    n += (number % 10) << 8;
    number = (number / 10) | 0;
    if (s < 4) return n;
    n += (number % 10) << 12;
    number = (number / 10) | 0;
    return n;
}

function byteToBits(val) {
    var bits = [];
    for (let index = 0; index < 8; index++) {
        const bit = getBit(val, index);
        bits.push(bit);
    }

    return {
        bits: bits,
        bit0: bits[0],
        bit1: bits[1],
        bit2: bits[2],
        bit3: bits[3],
        bit4: bits[4],
        bit5: bits[5],
        bit6: bits[6],
        bit7: bits[7],
    }
}
function wordToBits(val) {
    var bits = [];
    for (let index = 0; index < 16; index++) {
        const bit = getBit(val, index);
        bits.push(bit);
    }
    return {
        bits: bits,
        bit0: bits[0],
        bit1: bits[1],
        bit2: bits[2],
        bit3: bits[3],
        bit4: bits[4],
        bit5: bits[5],
        bit6: bits[6],
        bit7: bits[7],
        bit8: bits[8],
        bit9: bits[9],
        bit10: bits[10],
        bit11: bits[11],
        bit12: bits[12],
        bit13: bits[13],
        bit14: bits[14],
        bit15: bits[15],
    }
}

//Get Bit
function getBit(number, bitPosition) {
    return (number & (1 << bitPosition)) === 0 ? 0 : 1;
}
//Set Bit            
function setBit(number, bitPosition) {
    return number | (1 << bitPosition);
}
//Clear Bit            
function clearBit(number, bitPosition) {
    const mask = ~(1 << bitPosition);
    return number & mask;
}
//Update Bit            
function updateBit(number, bitPosition, bitValue) {
    const bitValueNormalized = bitValue ? 1 : 0;
    const clearMask = ~(1 << bitPosition);
    return (number & clearMask) | (bitValueNormalized << bitPosition);
}
function bitsToByte(bits) {
    var byte = 0;
    for (let index = 0; index < 8; index++) {
        let bit = bits[index];
        if (bit) byte = setBit(byte, index);
    }
    return byte;
}
function bitsToWord(val) {
    var wd = 0;
    for (let index = 0; index < 16; index++) {
        let bit = val[index];
        if (bit) wd = setBit(wd, index);
    }
    return wd;
}

const SWAPOPTS = ["swap16", "swap32", "swap64"];
const TYPEOPTS = [
    "int", "int8", "byte",
    "uint", "uint8",
    "int16", "int16le", "int16be", "uint16", "uint16le", "uint16be",
    "int32", "int32le", "int32be", "uint32", "uint32le", "uint32be",
    "bigint64", "bigint64le", "bigint64be", "biguint64", "biguint64le", "biguint64be",
    "float", "floatle", "floatbe", "double", "doublele", "doublebe",
    "8bit", "16bit", "16bitle", "16bitbe", "bool",
    "bcd", "bcdle", "bcdbe",
    "string", "hex", "ascii", "utf8", "utf-8", "utf16le", "ucs2", "latin1", "binary", "buffer"
];

/**
 * helper function to set a nested property by path
 * @param {*} obj - the object in which to set a properties value
 * @param {string} path - the path to the property e.g. payload.value
 * @param {*} val - the value to set in obj.path
 */
function setObjectProperty(obj, path, val, sep) {
    sep = sep == null ? "." : sep;
    const keys = path.split(sep);
    const lastKey = keys.pop();
    const lastObj = keys.reduce((obj, key) =>
        obj[key] = obj[key] || {},
        obj);
    lastObj[lastKey] = val;
}

/**
 * helper function to get a property by path
 * @param {*} obj - the object in which to set a properties value
 * @param {string} path - the path to the property e.g. payload.value
 * @param {*} [sep] - the path property separator (defaults to `.`)
 */
function getObjectProperty(obj, path, sep) {
    sep = sep == null ? "." : sep;
    for (var i=0, path=path.split(sep), len=path.length; i<len; i++){
        obj = obj[path[i]];
    };
    return obj;
}

function isNumber(n) {
    if (n === "" || n === true || n === false) return false;
    return !isNaN(parseFloat(n)) && isFinite(n);
}

exports.bcd2number = bcd2number;
exports.number2bcd = number2bcd;
exports.byteToBits = byteToBits;
exports.wordToBits = wordToBits;
exports.bitsToByte = bitsToByte;
exports.bitsToWord = bitsToWord;
exports.getBit = getBit;
exports.setBit = setBit;
exports.clearBit = clearBit;
exports.updateBit = updateBit;
exports.isNumber = isNumber;
exports.setObjectProperty = setObjectProperty;
exports.getObjectProperty = getObjectProperty;
exports.SWAPOPTS = SWAPOPTS;
exports.TYPEOPTS = TYPEOPTS;