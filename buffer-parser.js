
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
    const SUPPORTS_BIGINT = parseFloat(process.versions.node) >= 10.4;
    const RESULTYPEOPTS = ["object", "keyvalue", "value", "array", "buffer"];
    const { setObjectProperty, bcd2number, byteToBits, wordToBits, isNumber, TYPEOPTS, SWAPOPTS } = require('./common-functions.js');
    const scalingOps = {
        ">": (v, o) => v > o,
        "<": (v, o) => v < o,
        "==": (v, o) => v == o,
        "!=": (v, o) => v != o,
        "%": (v, o) => v % o,
        "<<": (v, o) => v << o,
        ">>": (v, o) => v >> o,
        ">>>": (v, o) => v >>> o,
        "**": (v, o) => v ** o,
        "^": (v, o) => v ^ o,
        "/": (v, o) => v / o,
        "*": (v, o) => v * o,
        "+": (v, o) => v + o,
        "-": (v, o) => v - o,
        "!!": (v) => !!v,
    };
    const scalerRegex = /\s*?([\/\-\+\*<>^!%=]*?)\s*?(\w+)/g;
    function bufferParserNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.data = config.data || "";//data
        node.dataType = config.dataType || "msg";
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
        node.resultType = config.resultType || 'value';
        node.resultTypeType = config.resultTypeType || 'str';
        node.multipleResult = config.multipleResult == true;
        node.fanOutMultipleResult = node.multipleResult == true && config.fanOutMultipleResult == true;
        node.setTopic = config.setTopic != false;

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
                "offset": item.offset,
                "offsetbit": item.offsetbit,
                "scale": item.scale,
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

            //ensure offest is something (check other permissable property names for "offset"  e.g. index & start)
            if (formattedSpecItem.offset == null || formattedSpecItem.offset == undefined) {
                formattedSpecItem.offset == item.index;
                if (formattedSpecItem.offset == null)
                    formattedSpecItem.offset == item.start || 0;
            }
            formattedSpecItem.offset = formattedSpecItem.offset || 0;
            if (isNumber(formattedSpecItem.offset)) {
                formattedSpecItem.offset = parseInt(formattedSpecItem.offset)
                if (formattedSpecItem.offset < 0) {
                    throw new Error("offsetbit must be zero or greater (item '" + (formattedSpecItem.name || "unnamed") + "')");
                }
            } else {
                throw new Error("offset is not a number (item '" + (formattedSpecItem.name || "unnamed") + "')");
            }

            //ensure offsetbit is something
            if (formattedSpecItem.offsetbit == null || formattedSpecItem.offsetbit == undefined) {
                formattedSpecItem.offsetbit = 0;
            }
            if (isNumber(formattedSpecItem.offsetbit)) {
                formattedSpecItem.offsetbit = parseInt(formattedSpecItem.offsetbit);
                if (formattedSpecItem.offsetbit < 0) {
                    throw new Error("offsetbit must be zero or greater (item '" + (formattedSpecItem.name || "unnamed") + "')");
                }
            } else {
                throw new Error("offsetbit is not a number (item '" + (formattedSpecItem.name || "unnamed") + "')");
            }

            //compile scaler
            let scale = null;
            if (formattedSpecItem.scale) {
                if (typeof formattedSpecItem.scale == "number") {
                    scale = formattedSpecItem.scale.toString();
                } else {
                    scale = formattedSpecItem.scale && formattedSpecItem.scale.trim();
                }
            }

            if (scale) {
                try {
                    if (scale != "1" && scale != "0") {
                        if (isNumber(scale)) {
                            formattedSpecItem.scaler = { operator: '*', operand: Number(scale) };
                        } else {
                            if (scale == "!" || scale == "!!") scale += "0"
                            let matches = [];
                            if(!scale.matchAll) {
                                //throw new Error("Scaling equations not supported by the running version of node-js. It is recommended you upgrade nodejs to V12 or greater. Alternatively, do your own scaling on the output.")
                                //TEMP: emulate matchAll
                                while ((match = scalerRegex.exec(scale)) !== null) {
                                    matches.push([...match])
                                    break;
                                }
                            } else {
                                matches = scale.matchAll(scalerRegex);
                            }
                            for (const match of matches) {
                                formattedSpecItem.scaler = {
                                    operator: match["1"].trim(),
                                    operand: Number(match["2"])
                                }
                                break;
                            }
                            if (!formattedSpecItem.scaler || !formattedSpecItem.scaler.operator || !scalingOps[formattedSpecItem.scaler.operator] || !isNumber(formattedSpecItem.scaler.operand)) {
                                throw new Error("scaling equation '" + formattedSpecItem.scale + "' is not valid (item " + itemNumber + " '" + (formattedSpecItem.name || "unnamed") + "')");
                            }
                        }
                    }
                } catch (e) {
                    throw e
                }
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
                    byteSwap: false,
                    resultType: "value",
                    singleResult: true
                },
                items: []
            };

            _spec.options.resultType = specification.options.resultType || "value";
            _spec.options.byteSwap = specification.options.byteSwap || false;
            _spec.options.msgProperty = specification.options.msgProperty || "payload";
            if (specification.options.multipleResult === true) _spec.options.singleResult = false;
            if (specification.options.multipleResult === false) _spec.options.singleResult = true;
            if (specification.options.singleResult === false) _spec.options.singleResult = false;
            if (specification.options.singleResult === true) _spec.options.singleResult = true;

            _spec.options.setTopic = specification.options.setTopic === false ? false : true;

            //validate resultType     
            if (!RESULTYPEOPTS.includes(_spec.options.resultType)) {
                throw new Error("resultType property is invalid");
            }

            //validate byteSwap     
            if (Array.isArray(_spec.options.byteSwap)) {
                let allFound = _spec.options.byteSwap.every(ai => SWAPOPTS.includes(ai));
                if (!allFound) {
                    throw new Error("byteSwap property contains unsupported option");
                }
            }

            //dont parse .items if user just wants a buffer
            if (_spec.options.resultType !== "buffer") {
                //validate items
                if (specification.items == null || Array.isArray(specification.items) == false || specification.items.length < 1) {
                    throw new Error("items property is not an array of objects")
                }
                let itemNum = 0;
                _spec.items = specification.items.map(function (item) {
                    itemNum++;
                    return parseSpecificationItem(item, itemNum);
                });
            }

            return _spec;
        }

        /**
         * parser function reads the provided `specification` (json or JS object) and converts the items in the `data` to the type specified in each element of `specification.items`
         *
         * @param {Buffer|integer[]} data - The data to parse. Must be either an array of `integer` or a `Buffer`
         * @param {object} specification - an object with `{options:{byteSwap: boolean}}` and `{items[ {name: string, offset: number, length: number, type: string} ]}` 
         * @returns result object containing . `objectResults:{}`, `arrayResults[]`, `values[]`
         */
        function parser(data, validatedSpec, msg) {

            let result = {
                objectResults: {},
                keyvalues: {},
                arrayResults: [],
                values: [],
                specification: validatedSpec
            }


            /** @type Buffer */ var buf;
            let isArray = Array.isArray(data);
            let isBuffer = Buffer.isBuffer(data);
            if (typeof data == "string") {
                data = new Buffer.from(data, "hex");
                isBuffer = true;
            }
            if (!isArray && !isBuffer) {
                throw new Error(`data is not an array or a buffer`);
            }

            //get buffer
            if (isBuffer) {
                buf = data;
            }

            //convert int16 array to buffer for easy access to data
            if (isArray) {
                buf = new Buffer.alloc(data.length * 2);
                let pos = 0;
                var arrayLength = data.length;
                for (var i = 0; i < arrayLength; i++) {
                    let lb = (data[i] & 0x00ff);
                    let hb = ((data[i] & 0xff00) >> 8);
                    buf.writeUInt8(hb, pos++);
                    buf.writeUInt8(lb, pos++);
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

            //helper function to return 1 or more correctly formatted values from the buffer
            function itemReader(item, buffer, bufferFunction, dataSize) {
                item.value = dataGetter(buffer, item.offset, item.length, bufferFunction, dataSize, item.mask, item.scaler);
                // result.objectResults[item.name] = item;
                setObjectProperty(result.objectResults, item.name, item, "=>");
                // result.keyvalues[item.name] = item.value;
                setObjectProperty(result.keyvalues, item.name, item.value, "=>");
                result.arrayResults.push(item);
                result.values.push(item.value);
            }
            function sanitizeMask(mask, numberFn, throwError) {
                let _mask = mask
                try {
                    if (_mask) {
                        if (typeof _mask == "string" && _mask.trim() == "") {
                            return 0;
                        }
                        _mask = numberFn(_mask)
                        if (isNaN(Number(_mask))) {
                            if (throwError) throw new Error("mask " + mask + " is invalid")
                        }
                    }
                } catch (error) {
                    if (throwError) throw e
                }
                return _mask;
            }
            //helper function to return 1 or more correctly formatted values from the buffer
            function dataGetter(buffer, startByte, dataCount, bufferFunction, dataSize, mask, scaler) {
                const numberConvertor = bufferFunction.indexOf("readBig") == 0 ? BigInt : Number
                const _mask = sanitizeMask(mask, numberConvertor, true);
                let index = 0;
                let value;
                if (dataCount === -1) {
                    dataCount = Math.floor((buffer.length - startByte) / dataSize);
                }
                if (dataCount > 1) {
                    value = [];
                }
                if (buffer[bufferFunction] == null) {
                    throw new Error(`Unknown Buffer method '${bufferFunction}'`);
                }
                const fn = buffer[bufferFunction].bind(buffer);
                for (index = 0; index < dataCount; index++) {
                    const bufPos = startByte + (index * dataSize);
                    let val = fn(bufPos);//call specified function on the buffer
                    if (_mask != 0) {
                        val = (val & _mask);
                    }
                    if (scaler && scaler.operator && scalingOps[scaler.operator]) {
                        val = scalingOps[scaler.operator](val, scaler.operand);
                    }
                    if (dataCount > 1) {
                        value.push(val);
                    } else {
                        value = val
                    }
                }

                return value;

            }


            result.buffer = buf;
            if (validatedSpec.options.resultType === "buffer") {
                return result;
            }

            var itemCount = validatedSpec.items.length;
            var fanOut = [];
            for (var itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                let item = validatedSpec.items[itemIndex];
                let type = item.type;
                let offset = item.startByte || item.offset || 0;
                let length = item.length || item.bytes || 1;
                switch (type.toLowerCase()) {
                    case 'int':
                    case 'int8':
                        itemReader(item, buf, "readInt8", 1);
                        break;
                    case 'uint':
                    case 'uint8':
                    case 'byte':
                        itemReader(item, buf, "readUInt8", 1);
                        break;

                    case 'int16le':
                        itemReader(item, buf, "readInt16LE", 2);
                        break;

                    case 'int16':
                    case 'int16be':
                        itemReader(item, buf, "readInt16BE", 2);
                        break;

                    case 'uint16le':
                        itemReader(item, buf, "readUInt16LE", 2);
                        break;

                    case 'uint16':
                    case 'uint16be':
                        itemReader(item, buf, "readUInt16BE", 2);
                        break;

                    case 'int32le':
                        itemReader(item, buf, "readInt32LE", 4);
                        break;

                    case 'int32':
                    case 'int32be':
                        itemReader(item, buf, "readInt32BE", 4);
                        break;

                    case 'uint32le':
                        itemReader(item, buf, "readUInt32LE", 4);
                        break;
                    case 'uint32':
                    case 'uint32be':
                        itemReader(item, buf, "readUInt32BE", 4);
                        break;

                    case 'bigint64le':
                        if(!SUPPORTS_BIGINT) {
                            throw new Error("BigInt operations require NODE v10.4.0 or greater")
                        }
                        itemReader(item, buf, "readBigInt64LE", 8);
                        break;

                    case 'bigint64':
                    case 'bigint64be':
                        if(!SUPPORTS_BIGINT) {
                            throw new Error("BigInt operations require NODE v10.4.0 or greater")
                        }
                        itemReader(item, buf, "readBigInt64BE", 8);
                        break;

                    case 'biguint64le':
                        if(!SUPPORTS_BIGINT) {
                            throw new Error("BigInt operations require NODE v10.4.0 or greater")
                        }
                        itemReader(item, buf, "readBigUInt64LE", 8);
                        break;
                    case 'biguint64':
                    case 'biguint64be':
                        if(!SUPPORTS_BIGINT) {
                            throw new Error("BigInt operations require NODE v10.4.0 or greater")
                        }
                        itemReader(item, buf, "readBigUInt64BE", 8);
                        break;

                    case 'floatle': //Reads a 32-bit float from buf at the specified offset
                        itemReader(item, buf, "readFloatLE", 4);
                        break
                    case 'float': //Reads a 32-bit float from buf at the specified offset
                    case 'floatbe': //Reads a 32-bit float from buf at the specified offset
                        itemReader(item, buf, "readFloatBE", 4);
                        break

                    case 'doublele': //Reads a 64-bit double from buf at the specified offset
                        itemReader(item, buf, "readDoubleLE", 8);
                        break

                    case 'double': //Reads a 64-bit double from buf at the specified offset
                    case 'doublebe': //Reads a 64-bit double from buf at the specified offset
                        itemReader(item, buf, "readDoubleBE", 8);
                        break

                    case 'string':// supported: 'ascii', 'utf8', 'utf16le', 'ucs2', 'latin1', and 'binary'.
                        type = "ascii"
                    case 'ascii':
                    case 'hex':
                    case 'utf8':
                    case "utf16le":
                    case "ucs2":
                    case "latin1":
                    case "binary":
                        {
                            let _end = length === -1 ? undefined : offset + length;
                            item.value = buf.toString(type, offset, _end);
                            if(type=="ascii"||type=="utf8"||type=="utf-8"||type=="latin1") {
                                const nullIdx = item.value.indexOf('\0');
                                if(nullIdx > -1) {
                                    item.value = item.value.substr(0, nullIdx);
                                }
                            }
                            setObjectProperty(result.objectResults, item.name, item, "=>");
                            setObjectProperty(result.keyvalues, item.name, item.value, "=>");
                            result.arrayResults.push(item);
                            result.values.push(item.value);
                        }
                        break;
                    case "bool":
                    case "boolean":
                        {
                            let _byteCount;
                            if (length === -1) {
                                _byteCount = -1
                            } else {
                                _byteCount = Math.floor(((item.offsetbit + length) / 8)) + (((item.offsetbit + length) % 8) > 0 ? 1 : 0)
                            }
                            let data = dataGetter(buf, item.offset, _byteCount, "readUInt8", 1, item.mask)
                            let bitData = []

                            if (Array.isArray(data) == false) {
                                data = [data]
                            }
                            for (let index = 0; index < data.length; index++) {
                                const thisByte = data[index];
                                let bits = byteToBits(thisByte);
                                bitData.push(...bits.bits.map(e => e ? true : false));
                            }
                            if (length === 1) {
                                item.value = bitData[item.offsetbit];
                            } else if (length === -1) {
                                item.value = bitData.slice(item.offsetbit); // -1 - return all to the end.
                            } else {
                                item.value = bitData.slice(item.offsetbit, item.offsetbit + length);
                            }
                            setObjectProperty(result.objectResults, item.name, item, "=>");
                            setObjectProperty(result.keyvalues, item.name, item.value, "=>");
                            result.arrayResults.push(item);
                            result.values.push(item.value);
                        }
                        break;
                    case "8bit":
                        {
                            let data = dataGetter(buf, item.offset, length, "readUInt8", 1, item.mask)
                            let bitData = [];
                            if (Array.isArray(data) === false) {
                                data = [data]
                            }
                            for (let index = 0; index < data.length; index++) {
                                const thisByte = data[index];
                                let bits = byteToBits(thisByte);
                                bitData.push(bits);
                            }
                            item.value = bitData;
                            setObjectProperty(result.objectResults, item.name, item, "=>");
                            setObjectProperty(result.keyvalues, item.name, item.value, "=>");
                            result.arrayResults.push(item);
                            result.values.push(item.value);
                        }
                        break;
                    case "16bit":
                    case "16bitle":
                    case "16bitbe":
                        {
                            let fn = type == "16bitle" ? "readUInt16LE" : "readUInt16BE";
                            let data = dataGetter(buf, item.offset, length, fn, 2, item.mask)
                            let bitData = [];
                            if (Array.isArray(data) == false) {
                                data = [data];
                            }
                            for (let index = 0; index < data.length; index++) {
                                const thisByte = data[index];
                                let bits = wordToBits(thisByte);
                                bitData.push(bits);
                            }
                            item.value = bitData;
                            setObjectProperty(result.objectResults, item.name, item, "=>");
                            setObjectProperty(result.keyvalues, item.name, item.value, "=>");
                            result.arrayResults.push(item);
                            result.values.push(item.value);
                        }
                        break;
                    case "bcd":
                    case "bcdle":
                    case "bcdbe":
                        {
                            let fn = type == "bcdle" ? "readUInt16LE" : "readUInt16BE";
                            let data = dataGetter(buf, item.offset, length, fn, 2, item.mask)
                            if (item.length > 1) {
                                dataBCD = data.map(e => bcd2number(e));
                            } else {
                                dataBCD = bcd2number(data)
                            }
                            item.value = dataBCD;
                            setObjectProperty(result.objectResults, item.name, item, "=>");
                            setObjectProperty(result.keyvalues, item.name, item.value, "=>");
                            result.arrayResults.push(item);
                            result.values.push(item.value);
                        }
                        break;
                    case "buffer":
                        {
                            let _end = length === -1 ? undefined : offset + length;
                            item.value = buf.slice(offset, _end);
                            setObjectProperty(result.objectResults, item.name, item, "=>", "=>");
                            setObjectProperty(result.keyvalues, item.name, item.value, "=>", "=>");
                            result.arrayResults.push(item);
                            result.values.push(item.value);
                        }
                        break;
                    default: {
                        let errmsg = `type '${item.type}' is not a recognised parse specification`;
                        console.warn(errmsg);
                        throw new Error(errmsg);
                        break;
                    }
                }
                if (validatedSpec.options.singleResult === false) {
                    let m = { topic: msg.topic, specification: item };
                    if (validatedSpec.options.setTopic) m.topic = item.name;
                    switch (validatedSpec.options.resultType) {
                        case "value":
                        case "keyvalue":
                            setObjectProperty(m, validatedSpec.options.msgProperty, item.value, ".")
                            break;
                        case "object":
                            setObjectProperty(m, validatedSpec.options.msgProperty, item, ".")
                            break;
                    }
                    if (node.fanOutMultipleResult) {
                        fanOut[itemIndex] = m;
                    } else {
                        node.send(m);
                    }

                }
            }
            if (node.fanOutMultipleResult) {
                return fanOut;
            }
            return result;
        }


        node.on('input', function (msg) {
            node.status({});//clear status
            var data;
            RED.util.evaluateNodeProperty(node.data, node.dataType, node, msg, (err, value) => {
                if (err) {
                    node.error("Unable to evaluate data", msg);
                    node.status({ fill: "red", shape: "ring", text: "Unable to evaluate data" });
                    return;//halt flow!
                } else {
                    data = value;
                }
            });
            var specification;
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

                var resultType;
                RED.util.evaluateNodeProperty(node.resultType, node.resultTypeType, node, msg, (err, value) => {
                    if (err) {
                        node.error("Unable to evaluate resultType", msg);
                        node.status({ fill: "red", shape: "ring", text: "Unable to evaluate resultType" });
                        return;//halt flow!
                    } else {
                        resultType = value;
                    }
                });
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
                        "resultType": resultType,
                        "msgProperty": msgProperty,
                        "multipleResult": node.multipleResult,
                        "setTopic": node.setTopic
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

            msg.originalPayload = msg.payload;//store original Payload in case user still wants it
            try {

                let results = parser(data, validatedSpec, msg);
                if (validatedSpec.options.singleResult !== false) {
                    msg.specification = results.specification;
                    msg.values = results.values;
                    msg.objectResults = results.objectResults;
                    msg.keyvalues = results.keyvalues;
                    msg.arrayResults = results.arrayResults;
                    msg.buffer = results.buffer;

                    switch (validatedSpec.options.resultType) {
                        case "buffer":
                            setObjectProperty(msg, validatedSpec.options.msgProperty, msg.buffer, ".");
                            break;
                        case "value":
                            setObjectProperty(msg, validatedSpec.options.msgProperty, msg.values, ".");
                            break;
                        case "object":
                            setObjectProperty(msg, validatedSpec.options.msgProperty, msg.objectResults, ".");
                            break;
                        case "keyvalue":
                        case "keyvalues":
                            setObjectProperty(msg, validatedSpec.options.msgProperty, msg.keyvalues, ".");
                            break;
                        case "array":
                            setObjectProperty(msg, validatedSpec.options.msgProperty, msg.arrayResults, ".");
                            break;
                    }
                    node.send(msg);
                } else if (node.fanOutMultipleResult) {
                    node.send(results);
                }

            } catch (error) {
                node.error(error, msg);
                node.status({ fill: "red", shape: "dot", text: "Error parsing data" });
                return;//halt flow
            }
        });
    }
    RED.nodes.registerType("buffer-parser", bufferParserNode);
}