
/*
MIT License

Copyright (c) 2020 Steve-Mcl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
*/

module.exports = function (RED) {
    const { number2bcd, bitsToByte, bitsToWord, setObjectProperty, isNumber, TYPEOPTS, SWAPOPTS } = require('./common-functions.js');

    function bufferMakerNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.specification = config.specification || "";//specification
        node.specificationType = config.specificationType || "ui";

        node.items = config.items || [];
        node.swap1 = config.swap1 || '';
        node.swap2 = config.swap2 || '';
        node.swap3 = config.swap3 || '';
        node.swap1Type = config.swap1Type || 'swap';
        node.swap2Type = config.swap2Type || 'swap';
        node.swap3Type = config.swap3Type || 'swap';
        node.msgProperty = config.msgProperty || 'payload';
        node.msgPropertyType = config.msgPropertyType || 'str';


        /**
         *  Generate a spec item from users input
         * @param {object} item - a spec item with properties name, type, offset and length
         * @param {Number} itemNumber - which item is this
         * @returns An object with expected properties that has been (kinda) validated
         */
        function parseSpecificationItem(item, itemNumber) {

            if (!item)
                throw new Error("Spec item is invalid");
            let isObject = (item != null && typeof item === 'object' && (Array.isArray(item) === false));
            if (!isObject)
                throw new Error("Spec item is invalid");
            let formattedSpecItem = Object.assign({}, item, {
                "name": item.name || "item" + itemNumber,
                "type": item.type,
                "data": item.data,
                "dataType": item.dataType,
                "length": item.length || 1,
                "id": itemNumber - 1
            });

            //ensure name is something
            if (!formattedSpecItem.name) {
                formattedSpecItem.name = `item[${formattedSpecItem.id}]`
            }

            //ensure type is provided
            if (!formattedSpecItem.type)
                throw new Error("type is not specified for item '" + (formattedSpecItem.name || "unnamed") + "'");

            //ensure data is provided
            if (!formattedSpecItem.data)
                throw new Error("data is not specified for item '" + (formattedSpecItem.name || "unnamed") + "'");

            //ensure dataType is provided
            if (!formattedSpecItem.dataType)
                throw new Error("dataType is not specified for item '" + (formattedSpecItem.name || "unnamed") + "'");

            //validate type     
            if (!TYPEOPTS.includes(formattedSpecItem.type.toLowerCase())) {
                throw new Error("'" + formattedSpecItem.type + "' is not a valid type (item '" + (formattedSpecItem.name || "unnamed") + "')");
            }

            //ensure length is valid
            if (formattedSpecItem.length == null || formattedSpecItem.length == undefined) {
                formattedSpecItem.length = 1;
            } else if (isNumber(formattedSpecItem.length)) {
                formattedSpecItem.length = parseInt(formattedSpecItem.length);
                if (formattedSpecItem.length == 0 /* || formattedSpecItem.length < -1 */) {
                    throw new Error("length is not a valid number (item '" + (formattedSpecItem.name || "unnamed") + "')");
                }
            } else {
                throw new Error("length is not a valid number (item '" + (formattedSpecItem.name || "unnamed") + "')");
            }

            return formattedSpecItem;
        }

        /**
         * Check the provided specification is valid & set any defaults. Throws an error if the specification is invalid.
         * @param {object | string} specification
         * @returns correctly formated and validate specification object
         */
        function parseSpecification(specification) {
            if (typeof specification == "string") {
                specification = JSON.parse();
            }
            let _spec = {
                options: {
                    byteSwap: false
                },
                items: []
            };

            _spec.options.byteSwap = specification.options.byteSwap || false;
            _spec.options.msgProperty = specification.options.msgProperty || "payload";


            //validate byteSwap     
            if (Array.isArray(_spec.options.byteSwap)) {
                let allFound = _spec.options.byteSwap.every(ai => SWAPOPTS.includes(ai));
                if (!allFound) {
                    throw new Error("byteSwap property contains unsupported option");
                }
            }


            //validate items
            if (specification.items == null || Array.isArray(specification.items) == false || specification.items.length < 1) {
                throw new Error("items property is not an array of objects")
            }
            let itemNum = 0;
            _spec.items = specification.items.map(function (item) {
                itemNum++;
                return parseSpecificationItem(item, itemNum);
            });


            return _spec;
        }

        /**
         * maker function reads the provided `specification` (json or JS object) and converts the items into the a buffer/array
         *
         * @param {Object} validatedSpec - The specification object with `{options:{byteSwap: boolean}}` and `{items[ {name: string, offset: number, length: number, type: string} ]}` 
         * @param {Object} msg - the incoming msg object 
         * @returns {Object} Returns an object containing `buffer` and `specification`
         */
        function maker(validatedSpec, msg) {

            let result = {
                /** @type Buffer */buffer: null,
                specification: validatedSpec
            }
            let bufferExpectedLength = 0;
            const itemCount = validatedSpec.items.length;
            /** @type Buffer */ var buf = Buffer.alloc(0);

            //#region Helper function ......................................................

            /**
             * helper function to return 1 or more correctly formatted values from the buffer
             * @param {Object} item item to convert 
             * @param {String} bufferFunction The buffer function to use
             * @param {Number} dataSize 
             * @param {Function} [dataConversion] the conversion function to execute
             */
            function itemReader(item, bufferFunction, dataSize, dataConversion) {
                const data = Array.isArray(item.value) ? item.value : [item.value];
                const dataCount = item.length === -1 ? data.length : item.length;
                const b = dataToBuffer(data, dataCount, bufferFunction, dataSize, dataConversion);
                const expectedLength = dataCount * dataSize;
                if (!b) throw new Error(`Data item ${item.name} converted data is empty`);
                if (b.length != expectedLength) throw new Error(`Data item ${item.name} converted byte length error. Expected ${expectedLength}, got ${b.length != expectedLength}`);
                return {
                    buffer: b,
                    dataCount: dataCount,
                    dataSize: dataSize
                };
            }

            //helper function to return 1 or more correctly formatted values from the buffer
            function dataToBuffer(data, dataCount, bufferFunction, dataSize, dataConversion) {
                const siz = dataSize * dataCount;
                let buf = Buffer.alloc(siz);
                if (buf[bufferFunction] == null) {
                    throw new Error(`Unknown Buffer method '${bufferFunction}'`);
                }
                let fn = buf[bufferFunction].bind(buf);
                if (!Array.isArray(data)) data = [data];
                for (let index = 0; index < dataCount; index++) {
                    let bufPos = (index * dataSize);
                    let dataItem = data[index];
                    if (dataConversion) dataItem = dataConversion(dataItem);
                    fn(dataItem, bufPos);//call specified function on the buffer
                }
                return buf;
            }

            /** Convert string or integer to bigint */
            function toBigint(e) {
                return BigInt(e);//a data convertor to handle implicit int ot big int conversions (otherwise buffer throws error)
            }
            function appendBuffer(dst, buf) {
                return Buffer.concat([dst, buf]);
            }
            //#endregion 

            const options = {
                lengthMultiplier: {
                    "hex": 0.5,
                    "utf16le": 2
                },
                lengthMod: {
                    "hex": 2
                }
            }
            for (var itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                let item = validatedSpec.items[itemIndex];
                let itemDesc = item.name || ("item " + (itemIndex + 1));
                let type = item.type;
                let length = item.length || item.bytes || 1;
                RED.util.evaluateNodeProperty(item.data, item.dataType, node, msg, (err, value) => {
                    if (err) {
                        node.error("Unable to evaluate data of '" + itemDesc + "'", msg);
                        node.status({ fill: "red", shape: "ring", text: "Unable to evaluate data" });
                        return;//halt flow!
                    } else {
                        item.value = value;
                    }
                });

                switch (type.toLowerCase()) {
                    case 'int':
                    case 'int8':
                        {
                            const dataSize = 1;
                            const irResult = itemReader(item, "writeInt8", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;
                    case 'uint':
                    case 'uint8':
                    case 'byte':
                        {
                            const dataSize = 1;
                            const irResult = itemReader(item, "writeUInt8", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;

                    case 'int16le':
                        {
                            const dataSize = 2;
                            const irResult = itemReader(item, "writeInt16LE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;

                    case 'int16':
                    case 'int16be':
                        {
                            const dataSize = 2;
                            const irResult = itemReader(item, "writeInt16BE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;

                    case 'uint16le':
                        {
                            const dataSize = 2;
                            const irResult = itemReader(item, "writeUInt16LE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;

                    case 'uint16':
                    case 'uint16be':
                        {
                            const dataSize = 2;
                            const irResult = itemReader(item, "writeUInt16BE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;

                    case 'int32le':
                        {
                            const dataSize = 4;
                            const irResult = itemReader(item, "writeInt32LE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;

                    case 'int32':
                    case 'int32be':
                        {
                            const dataSize = 4;
                            const irResult = itemReader(item, "writeInt32BE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;

                    case 'uint32le':
                        {
                            const dataSize = 4;
                            const irResult = itemReader(item, "writeUInt32LE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;
                    case 'uint32':
                    case 'uint32be':
                        {
                            const dataSize = 4;
                            const irResult = itemReader(item, "writeUInt32BE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;

                    case 'bigint64le':
                        {
                            const dataSize = 8;
                            const irResult = itemReader(item, "writeBigInt64LE", dataSize, toBigint);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;

                    case 'bigint64':
                    case 'bigint64be':
                        {
                            const dataSize = 8;
                            const irResult = itemReader(item, "writeBigInt64BE", dataSize, toBigint);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;

                    case 'biguint64le':
                        {
                            const dataSize = 8;
                            const irResult = itemReader(item, "writeBigUInt64LE", dataSize, toBigint);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;
                    case 'biguint64':
                    case 'biguint64be':
                        {
                            const dataSize = 8;
                            const irResult = itemReader(item, "writeBigUInt64BE", dataSize, toBigint);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break;

                    case 'floatle': //Reads a 32-bit float from buf at the specified offset
                        {
                            const dataSize = 4;
                            const irResult = itemReader(item, "writeFloatLE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break
                    case 'float': //Reads a 32-bit float from buf at the specified offset
                    case 'floatbe': //Reads a 32-bit float from buf at the specified offset
                        {
                            const dataSize = 4;
                            const irResult = itemReader(item, "writeFloatBE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break

                    case 'doublele': //Reads a 64-bit double from buf at the specified offset
                        {
                            const dataSize = 8;
                            const irResult = itemReader(item, "writeDoubleLE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break

                    case 'double': //Reads a 64-bit double from buf at the specified offset
                    case 'doublebe': //Reads a 64-bit double from buf at the specified offset
                        {
                            const dataSize = 8;
                            const irResult = itemReader(item, "writeDoubleBE", dataSize);
                            bufferExpectedLength += (irResult.dataCount * irResult.dataSize);
                            buf = appendBuffer(buf, irResult.buffer);
                        }
                        break

                    case 'string':// supported: 'ascii', 'utf8', 'utf16le', 'ucs2', 'latin1', and 'binary'.
                        type = "ascii";
                    case 'ascii':
                    case 'hex':
                    case 'utf8':
                    case 'utf-8':
                    case "utf16le":
                    case "ucs2":
                    case "latin1":
                    case "binary":
                        {
                            const dataSize = 1;
                            const _end = length === -1 ? undefined : length;
                            let itemValue = item.value;
                            const _length = _end || itemValue.length;
                            const lengthMod = options.lengthMod[type.toLowerCase()];
                            if (lengthMod) {
                                let m = _length % lengthMod;
                                if (m) throw new Error(`Length of '${itemDesc}' should be divisible by ${lengthMod}`);
                            }
                            const lengthMultiplier = options.lengthMultiplier[type.toLowerCase()];
                            if (lengthMultiplier != null) {
                                bufferExpectedLength += (_length * lengthMultiplier);
                            } else {
                                bufferExpectedLength += _length;
                            }
                            if (itemValue.length < _length) {
                                if(type=="ascii"||type=="utf8"||type=="utf-8"||type=="latin1") {
                                    itemValue += "\0".repeat(_length-itemValue.length);//pad nulls to string
                                } else if(type=="utf16le"||type=="ucs2") {
                                    itemValue += "\0\0".repeat(_length-itemValue.length);//pad nulls to string
                                } else {
                                    throw new Error(`data for '${itemDesc}' is shorter than required length`);
                                }
                            }
                            const v = itemValue.slice(0, _end);
                            const b = Buffer.from(v, type);
                            buf = appendBuffer(buf, b);
                        }
                        break;
                    case "bool":
                    case "boolean":
                        {
                            //expect bools to be an array e.g. [true,false,true...]
                            let _byteCount;
                            if (length === -1) {
                                _byteCount = Math.floor(item.value.length / 8) + ((item.value.length % 8) > 0 ? 1 : 0)
                            } else {
                                _byteCount = Math.floor(length / 8) + ((length % 8) > 0 ? 1 : 0)
                            }
                            bufferExpectedLength += (_byteCount);
                            const b = Buffer.alloc(_byteCount);
                            for (let index = 0; index < _byteCount; index++) {
                                const offs = index * 8;
                                const bits = item.value.slice(offs, 8);
                                const bval = bitsToByte(bits);
                                b.writeUInt8(bval, index);
                            }
                            buf = appendBuffer(buf, b);
                        }
                        break;
                    case "8bit":
                        {
                            //expect bits to be an array of 8bit arrays e.g. [ [1,0,1,0,...], [1,0,1,0,...], ... ]
                            let _byteCount;
                            if (length === -1) {
                                _byteCount = item.value.length;
                            } else {
                                _byteCount = length;
                            }
                            bufferExpectedLength += (_byteCount);
                            const b = Buffer.alloc(_byteCount);
                            for (let index = 0; index < _byteCount; index++) {
                                const bits = item.value[index];
                                const bval = bitsToByte(bits);
                                b.writeUInt8(bval, index);
                            }
                            buf = appendBuffer(buf, b);
                        }
                        break;
                    case "16bit":
                    case "16bitle":
                    case "16bitbe":
                        {
                            //expect bits to be an array of 16bit arrays e.g. [ [1,0,1,0,...], [1,0,1,0,...], ... ]
                            let _byteCount;
                            let _len;
                            if (length === -1) {
                                _byteCount = item.value.length * 2;
                                _len = item.value.length;
                            } else {
                                _byteCount = length * 2;
                                _len = length;
                            }
                            bufferExpectedLength += _byteCount;
                            const b = Buffer.alloc(_byteCount);
                            let fn = type == "16bitle" ? b.writeUInt16LE.bind(b) : b.writeUInt16BE.bind(b);
                            for (let index = 0; index < _len; index++) {
                                const bits = item.value[index];
                                const bval = bitsToWord(bits);
                                fn(bval, index * 2);
                            }
                            buf = appendBuffer(buf, b);

                        }
                        break;
                    case "bcd":
                    case "bcdle":
                    case "bcdbe":
                        {
                            let _byteCount;
                            let _len;
                            let data = item.value;
                            if (!Array.isArray(data)) data = [data];
                            if (length === -1) {
                                _byteCount = data.length * 2;
                                _len = data.length;
                            } else {
                                _byteCount = length * 2;
                                _len = length;
                            }
                            data = data.slice(0, _len);
                            bufferExpectedLength += _byteCount;
                            dataBCD = data.map(e => number2bcd(e));
                            const b = Buffer.alloc(_byteCount);
                            let fn = type === "bcdle" ? b.writeUInt16LE.bind(b) : b.writeUInt16BE.bind(b);
                            for (let index = 0; index < _len; index++) {
                                fn(dataBCD[index], index * 2);
                            }
                            buf = appendBuffer(buf, b);
                        }
                        break;
                    case "buffer":
                        {
                            const _end = length === -1 ? undefined : length;
                            if (!(item.value instanceof Buffer)) throw new Error(`Expected value of '${itemDesc}' to be a Buffer`)
                            const b = item.value.slice(0, _end);
                            const _length = _end || b.length;
                            bufferExpectedLength += _length;
                            buf = appendBuffer(buf, b);
                        }
                        break;
                    default: {
                        const errmsg = `type '${item.type}' specified in '${itemDesc}' is not a recognised spec type`;
                        console.warn(errmsg);
                        throw new Error(errmsg);
                        break;
                    }
                }
            }


            //byte swap the data if requested
            //byteSwap can be boolean (i.e. swap16) 
            //or 
            //an array of directives e.g. ["swap64", "swap", "swap32"] - they will be executed in order
            if (validatedSpec.options.byteSwap) {
                if (Array.isArray(validatedSpec.options.byteSwap)) {
                    let swaps = validatedSpec.options.byteSwap;
                    for (let index = 0; index < swaps.length; index++) {
                        let sw = swaps[index];
                        if (sw && typeof sw == "string" && sw.length > 0) {
                            sw = sw.toLowerCase();
                            try {
                                switch (sw) {
                                    case "swap":
                                    case "swap16":
                                        buf.swap16();
                                        break;
                                    case "swap32":
                                        buf.swap32();
                                        break;
                                    case "swap64":
                                        buf.swap64();
                                        break;
                                    default:
                                        break;
                                }
                            } catch (error) {
                                throw new Error("Cannot " + sw + ": " + error.message);
                            }

                        }

                    }
                } else {
                    try {
                        buf.swap16();
                    } catch (error) {
                        throw new Error("Cannot swap16: " + error.message);
                    }
                }
            }
            if (buf.length !== bufferExpectedLength) throw new Error(`Final buffer length is not correct. Expected ${bufferExpectedLength}, got ${buf.length}`)
            result.buffer = buf;
            return result;
        }


        node.on('input', function (msg) {
            node.status({});//clear status
            let specification;
            RED.util.evaluateNodeProperty(node.specification, node.specificationType, node, msg, (err, value) => {
                if (err) {
                    node.error("Unable to evaluate specification", msg);
                    node.status({ fill: "red", shape: "ring", text: "Unable to evaluate specification" });
                    return;//halt flow!
                } else {
                    specification = value;
                }
            });

            if (node.specificationType == "ui") {
                specification = {};
                var swap1;
                RED.util.evaluateNodeProperty(node.swap1, node.swap1Type, node, msg, (err, value) => {
                    if (err) {
                        node.error("Unable to evaluate swap1", msg);
                        node.status({ fill: "red", shape: "ring", text: "Unable to evaluate swap1" });
                        return;//halt flow!
                    } else {
                        if (node.swap1Type == "env") {
                            swap1 = value.split(",");
                            swap1 = swap1.map(e => e.trim());
                        } else {
                            swap1 = value;
                        }
                    }
                });
                var swap2;
                var swap3;
                if (node.swap1Type == "swap") {
                    RED.util.evaluateNodeProperty(node.swap2, node.swap2Type, node, msg, (err, value) => {
                        if (err) {
                            node.error("Unable to evaluate swap2", msg);
                            node.status({ fill: "red", shape: "ring", text: "Unable to evaluate swap2" });
                            return;//halt flow!
                        } else {
                            swap2 = value;
                        }
                    });
                    RED.util.evaluateNodeProperty(node.swap3, node.swap3Type, node, msg, (err, value) => {
                        if (err) {
                            node.error("Unable to evaluate swap3", msg);
                            node.status({ fill: "red", shape: "ring", text: "Unable to evaluate swap3" });
                            return;//halt flow!
                        } else {
                            swap3 = value;
                        }
                    });
                }


                var msgProperty = node.msgProperty;


                var swap = [];
                if (Array.isArray(swap1)) {
                    swap = swap1;
                } else {
                    if (swap1) {
                        swap.push(swap1);
                        if (swap2) {
                            swap.push(swap2);
                            if (swap3) {
                                swap.push(swap3);
                            }
                        }
                    }
                }
                specification = {
                    "options": {
                        "byteSwap": swap,
                        "msgProperty": msgProperty,
                    },
                    "items": node.items
                }

            }

            let validatedSpec;
            try {
                validatedSpec = parseSpecification(specification)
            } catch (error) {
                node.error(error, msg);
                node.status({ fill: "red", shape: "dot", text: error.message });
                return;//halt flow
            }

            msg.originalPayload = msg.payload;//store original Payload incase user still wants it
            try {

                let results = maker(validatedSpec, msg);
                if (validatedSpec.options.singleResult !== false) {
                    msg.specification = results.specification;
                    setObjectProperty(msg, validatedSpec.options.msgProperty, results.buffer, ".")
                    node.send(msg);
                }

            } catch (error) {
                node.error(error, msg);
                node.status({ fill: "red", shape: "dot", text: "Error parsing data" });
                return;//halt flow
            }


        });
    }
    RED.nodes.registerType("buffer-maker", bufferMakerNode);
}