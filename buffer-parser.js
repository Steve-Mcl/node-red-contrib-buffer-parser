
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

module.exports = function(RED) {
    const RESULTYPEOPTS = ["object", "value", "array", "buffer"];
    const SWAPOPTS = ["swap16", "swap32", "swap64"];
    const TYPEOPTS = [  
        "int", "int8", "byte",
        "int16", "int16le", "int16be", "uint16", "uint16le", "uint16be",
        "int32", "int32le", "int32be", "uint32", "uint32le", "uint32be",
        "bigint64", "bigint64le", "bigint64be", "biguint64", "biguint64le", "biguint64be",
        "float", "floatle", "floatbe", "double", "doublele", "doublebe",
        "8bit", "16bit", "16bitle", "16bitbe", "bool",
        "bcd", "bcdle", "bcdbe",
        "string", "ascii", "utf8", "utf16le", "ucs2", "latin1", "binary" 
    ];
    function bufferParserNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
		node.data = config.data || "";//data
		node.dataType = config.dataType || "msg";
        node.specification = config.specification || "";//specification
        node.specificationType = config.specificationType || "str";


        function isNumber(n) {
            if(n === "" || n === true || n === false) return false;
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        /**
         *  Generate a spec item from users input
         * @param {object} item - a spec item with properties name, type, offset and length
         * @param {Number} itemNumber - which item is this
         * @returns An object with expected properties that has been (kinda) validated
         */
        function parseSpecificationItem(item, itemNumber) {

            if(!item)
                throw new Error("Spec item is invalid");
            let isObject = (item != null && typeof item === 'object' && (Array.isArray(item) === false));
            if(!isObject)
                throw new Error("Spec item is invalid");

            let formattedSpecItem = {
                "name": item.name || "item" + itemNumber,
                "type": item.type,
                "offset": item.offset,
                "offsetbit": item.offsetbit,
                "length": item.length || 1,
                "id" : itemNumber - 1
            }; 
            
            //ensure name is something
            if(!formattedSpecItem.name){
                formattedSpecItem.name = `item[${formattedSpecItem.id}]`
            }

            //ensure type is provided
            if(!formattedSpecItem.type)
                throw new Error("type is not specified for item '" + (formattedSpecItem.name || "unnamed") + "'");
            
            //validate type     
            if(!TYPEOPTS.includes(formattedSpecItem.type.toLowerCase())){
                throw new Error("'" + formattedSpecItem.type + "' is not a valid type (item '" + (formattedSpecItem.name || "unnamed") + "')");
            }
                
            //ensure length is valid
            if(formattedSpecItem.length == null || formattedSpecItem.length == undefined){
                formattedSpecItem.length = 1;
            } else if(isNumber(formattedSpecItem.length)){
                formattedSpecItem.length = parseInt(formattedSpecItem.length);
                if(formattedSpecItem.length == 0 /* || formattedSpecItem.length < -1 */ ){
                    throw new Error("length is not a valid number (item '" + (formattedSpecItem.name || "unnamed") + "')");
                }
            } else {
                throw new Error("length is not a valid number (item '" + (formattedSpecItem.name || "unnamed") + "')");
            }

            //ensure offest is something (check other permissable property names for "offset"  e.g. index & start)
            if(formattedSpecItem.offset == null || formattedSpecItem.offset == undefined){
                formattedSpecItem.offset == item.index;
                if(formattedSpecItem.offset == null)
                    formattedSpecItem.offset == item.start || 0;
            }
            formattedSpecItem.offset = formattedSpecItem.offset || 0;
            if(isNumber(formattedSpecItem.offset)){
                formattedSpecItem.offset = parseInt(formattedSpecItem.offset)
            } else {
                throw new Error("offset is not a number (item '" + (formattedSpecItem.name || "unnamed") + "')");
            }
            
            //ensure offsetbit is something
            if(formattedSpecItem.offsetbit == null || formattedSpecItem.offsetbit == undefined){
                formattedSpecItem.offsetbit = 0;
            }
            if(isNumber(formattedSpecItem.offsetbit)){
                formattedSpecItem.offsetbit = parseInt(formattedSpecItem.offsetbit);
            } else {
                throw new Error("offsetbit is not a number (item '" + (formattedSpecItem.name || "unnamed") + "')");
            }

            return formattedSpecItem;
        }

        /**
         * Check the provided specification is valid & set any defaults. Throws an error if the specification is invalid.
         * @param {object | string} specification
         * @returns correctly formated and validate specification object
         */
        function parseSpecification(specification){
            if(typeof specification == "string"){
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
            _spec.options.singleResult = specification.options.singleResult === false ? false : true;
            _spec.options.setTopic = specification.options.setTopic === false ? false : true;
            
            //validate resultType     
            if(!RESULTYPEOPTS.includes(_spec.options.resultType)){
                throw new Error("resultType property is invalid");
            }   

            //validate byteSwap     
            if(Array.isArray(_spec.options.byteSwap)){
                let allFound = _spec.options.byteSwap.every( ai => SWAPOPTS.includes(ai) );
                if(!allFound){
                    throw new Error("byteSwap property contains unsupported option"); 
                }
            }

            //dont parse .items if user just wants a buffer
            if(_spec.options.resultType !== "buffer"){
                //validate items
                if(specification.items == null || Array.isArray(specification.items) == false || specification.items.length < 1){
                    throw new Error("items property is not an array of objects") 
                }
                let itemNum = 0;
                _spec.items = specification.items.map(function(item) {
                    itemNum++;
                    return parseSpecificationItem(item, itemNum);
                });
            }

            return _spec;
        }

        /**
         * helper function to dynamically set a nexted property by name
         * @param {*} obj - the object in which to set a properties value
         * @param {string} path - the path to the property e.g. payload.value
         * @param {*} val - the value to set in obj.path
         */
        function setObjectProperty(obj, path, val){ 
            const keys = path.split('.');
            const lastKey = keys.pop();
            const lastObj = keys.reduce((obj, key) => 
                obj[key] = obj[key] || {}, 
                obj); 
            lastObj[lastKey] = val;
        };


        /**
         * parser function reads the provided `specification` (json or JS object) and converts the items in the `data` to the type specified in each element of `specification.items`
         *
         * @param {Buffer|integer[]} data - The data to parse. Must be either an array of `integer` or a `Buffer`
         * @param {object} specification - an object with `{options:{byteSwap: boolean}}` and `{items[ {name: string, offset: number, length: number, type: string} ]}` 
         * @returns result object containing . `objectResults:{}`, `arrayResults[]`, `values[]`
         */
        function parser(data, validatedSpec, msg) {
            
            let result = {
                objectResults : {},
                arrayResults : [],
                values : [],
                specification: validatedSpec
            }

            var buf;
            let isArray = Array.isArray(data);
            let isBuffer = Buffer.isBuffer(data);
            if(typeof data == "string"){
                data = new Buffer.from(data);
                isBuffer = true;
            }
            if(!isArray && !isBuffer){
                throw new Error(`data is not an array or a buffer`);  
            }
            
            //get buffer
            if(isBuffer){
                buf = data;
            }
            
            //convert int16 array to buffer for easy access to data
            if(isArray){
                buf = new Buffer.alloc(data.length*2);
                let pos = 0;
                var arrayLength = data.length;
                for (var i = 0; i < arrayLength; i++) {
                    let lb = (data[i] & 0x00ff);
                    let hb = ((data[i] & 0xff00) >> 8);
                    buf.writeUInt8(hb,pos++);
                    buf.writeUInt8(lb,pos++);
                }
            }
            

            //byte swap the data if requested
            //byteSwap can be boolean (i.e. swap16) 
            //or 
            //an array of directives e.g. ["swap64", "swap", "swap32"] - they will be executed in order
            if(validatedSpec.options.byteSwap){
                if(Array.isArray(validatedSpec.options.byteSwap)){
                    let swaps = validatedSpec.options.byteSwap;
                    for (let index = 0; index < swaps.length; index++) {
                        let sw = swaps[index];
                        if(sw && typeof sw == "string" && sw.length > 0){
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
            function byteToBits(val) {
                var bits = [];
                for (let index = 0; index < 8; index++) {
                    const bit = getBit(val,index);
                    bits.push(bit);
                }
               
                return {
                    bits : bits,
                    bit0 : bits[0],
                    bit1 : bits[1],
                    bit2 : bits[2],
                    bit3 : bits[3],
                    bit4 : bits[4],
                    bit5 : bits[5],
                    bit6 : bits[6],
                    bit7 : bits[7],
                }
            }
            function wordToBits(val) {
                var bits = [];
                for (let index = 0; index < 16; index++) {
                    const bit = getBit(val,index);
                    bits.push(bit);
                }
                return {
                    bits : bits,
                    bit0 : bits[0],
                    bit1 : bits[1],
                    bit2 : bits[2],
                    bit3 : bits[3],
                    bit4 : bits[4],
                    bit5 : bits[5],
                    bit6 : bits[6],
                    bit7 : bits[7],
                    bit8 : bits[8],
                    bit9 : bits[9],
                    bit10 : bits[10],
                    bit11 : bits[11],
                    bit12 : bits[12],
                    bit13 : bits[13],
                    bit14 : bits[14],
                    bit15 : bits[15],                    
                }
            }

            //helper function to convert to bcd equivelant
            var bcd2number = function(num, bytesize = 4) {
                let loByte = (num & 0x00ff);
                let hiByte = (num >> 8) & 0x00ff;
                let n = 0;
                n += (loByte & 0x0F) * 1;
                if(bytesize < 2) return n;
                n += ((loByte>>4) & 0x0F) * 10;
                if(bytesize < 3) return n;
                n += (hiByte & 0x0F) * 100;
                if(bytesize < 4) return n;
                n += ((hiByte>>4) & 0x0F) * 1000;
                return n;
            }

            //helper function to return 1 or more correctly formatted values from the buffer
            function itemReader(item, buffer, bufferFunction, dataSize) {
                item.value = dataGetter(buffer,item.offset,item.length,bufferFunction,dataSize);
                result.objectResults[item.name] = item;
                result.arrayResults.push(item);
                result.values.push(item.value);
            }
            //helper function to return 1 or more correctly formatted values from the buffer
            function dataGetter(buffer, startByte, dataCount, bufferFunction, dataSize) {
                let index = 0; 
                let value;
                if(dataCount > 1){
                    value = [];
                }
                var fn = buffer[bufferFunction].bind(buffer);
                for(index = 0; index < dataCount; index++){
                    let bufPos = startByte + (index*dataSize);
                    let val = fn(bufPos);//call specified function on the buffer
                    if(dataCount > 1){
                        value.push( val );
                    } else {
                        value = val
                    }               
                }

                return value;
                            
            }


            result.buffer = buf;
            if(validatedSpec.resultType === "buffer"){
                return result;
            }
            
            var itemCount = validatedSpec.items.length;

            for (var itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                let item = validatedSpec.items[itemIndex];
                let type = item.type;
                let offset = item.startByte || item.offset || 0;
                let length = item.length || item.bytes || 1;
                switch (type.toLowerCase()) {
                    case 'int':
                    case 'int8':
                        //result[spec] = buf.readInt8(offset);
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
                        itemReader(item, buf, "readBigInt64LE", 8);
                        break;

                    case 'bigint64':
                    case 'bigint64be':
                        itemReader(item, buf, "readBigInt64BE", 8);
                        break;

                    case 'biguint64le':
                        itemReader(item, buf, "readBigUInt64LE", 8);
                        break;
                    case 'biguint64':
                    case 'biguint64be':
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
                    case 'utf8':
                    case "utf16le":
                    case "ucs2":
                    case "latin1":
                    case "binary":
                        item.value = buf.toString(type, offset, offset+length);
                        result.objectResults[item.name] = item;
                        result.arrayResults.push(item);
                        result.values.push(item.value);
                        break;
                    case "bool":
                    case "boolean":
                        {
                            let bcount = Math.floor(((item.offsetbit + length) / 8)) + (((item.offsetbit + length) % 8) > 0 ? 1 : 0)
                            let data = dataGetter(buf, item.offset, bcount, "readUInt8", 1 )
                            let bitData = []

                            if(Array.isArray(data) == false){
                                data = [data]
                            } 
                            for (let index = 0; index < data.length; index++) {
                                const thisByte = data[index];
                                let bits = byteToBits(thisByte);
                                bitData.push(...bits.bits.map(e => e ? true : false));
                            }
                            if(length == 1){
                                item.value = bitData[item.offsetbit];
                            } else {
                                item.value = bitData.slice(item.offsetbit, item.offsetbit + length)
                            }
                            result.objectResults[item.name] = item;
                            result.arrayResults.push(item);
                            result.values.push(item.value);
                        }
                        break;                        
                    case "8bit":
                        {
                            let data = dataGetter(buf, item.offset, item.length, "readUInt8", 1 )
                            let bitData = [];
                            if(Array.isArray(data) === false){
                                data = [data]
                            } 
                            for (let index = 0; index < data.length; index++) {
                                const thisByte = data[index];
                                let bits = byteToBits(thisByte);
                                bitData.push(bits);
                            }
                            item.value = bitData;
                            result.objectResults[item.name] = item;
                            result.arrayResults.push(item);
                            result.values.push(item.value);
                        }
                        break;
                    case "16bit":
                    case "16bitle":
                    case "16bitbe":
                        {
                            let fn = type == "16bitle" ? "readUInt16LE": "readUInt16BE";
                            let data = dataGetter(buf, item.offset, item.length, fn, 2 )
                            let bitData = [];
                            if(Array.isArray(data) == false){
                                data = [data];
                            } 
                            for (let index = 0; index < data.length; index++) {
                                const thisByte = data[index];
                                let bits = wordToBits(thisByte);
                                bitData.push(bits);
                            }
                            item.value = bitData;
                            result.objectResults[item.name] = item;
                            result.arrayResults.push(item);
                            result.values.push(item.value);
                        }
                        break;        
                    case "bcd":
                    case "bcdle":
                    case "bcdbe":
                        {
                            let fn = type == "bcdle" ? "readUInt16LE": "readUInt16BE";
                            let data = dataGetter(buf, item.offset, item.length, fn, 2 )
                            if(item.length > 1){
                                dataBCD = data.map(bcd2number);
                            } else {
                                dataBCD = bcd2number(data)
                            }
                            item.value = dataBCD;
                            result.objectResults[item.name] = item;
                            result.arrayResults.push(item);
                            result.values.push(item.value);
                        }
                        break;        
                    default:
                        let errmsg = `type '${item.type}' is not a recognised parse specification`;
                        console.warn(errmsg);
                        throw new Error(errmsg);  
                        break;
                }
                if(validatedSpec.options.singleResult === false){
                    let m = { topic: msg.topic, specification : validatedSpec };
                    if(validatedSpec.options.setTopic) m.topic = item.name;
                    switch (validatedSpec.options.resultType) {
                        case "array"://not sure about this one!
                        case "value":
                            setObjectProperty(m, validatedSpec.options.msgProperty, item.value)
                            break;
                        case "object":
                            setObjectProperty(m, validatedSpec.options.msgProperty, item)
                            break;
                    } 
                    node.send(m);
                }
            }
            return result;
        }


        node.on('input', function(msg) {
            node.status({});//clear status
            var data;
            RED.util.evaluateNodeProperty(node.data,node.dataType,node,msg,(err,value) => {
                if (err) {
                    node.error("Unable to evaluate data",msg);
                    node.status({fill:"red",shape:"ring",text:"Unable to evaluate data"});
                    return;//halt flow!
                } else {
                    data = value;
                }
            }); 
            var specification;
            RED.util.evaluateNodeProperty(node.specification,node.specificationType,node,msg,(err,value) => {
                if (err) {
                    node.error("Unable to evaluate specification",msg);
                    node.status({fill:"red",shape:"ring",text:"Unable to evaluate specification"});
                    return;//halt flow!
                } else {
                    specification = value;
                }
            }); 

            let validatedSpec;
            try {
                validatedSpec = parseSpecification(specification)
            } catch (error) {
                node.error(error,msg);
                node.status({fill:"red",shape:"dot",text:error.message});
                return;//halt flow
            }

            msg.originalPayload = msg.payload;//store original Payload incase user still wants it
            try {
                
                let results = parser(data,validatedSpec,msg);
                if(validatedSpec.options.singleResult !== false){
                    msg.specification = results.specification;
                    msg.values = results.values;
                    msg.objectResults = results.objectResults;
                    msg.arrayResults = results.arrayResults;
                    msg.buffer = results.buffer;

                    switch (validatedSpec.options.resultType) {
                        case "buffer":
                            setObjectProperty(msg, validatedSpec.options.msgProperty, msg.buffer)
                            break;
                        case "value":
                            setObjectProperty(msg, validatedSpec.options.msgProperty, msg.values)
                            break;
                        case "object":
                            setObjectProperty(msg, validatedSpec.options.msgProperty, msg.objectResults)
                            break;
                        case "array":
                            setObjectProperty(msg, validatedSpec.options.msgProperty, msg.arrayResults)
                            break;
                    } 
                    node.send(msg);
                }

            } catch (error) {
                node.error(error,msg);
                node.status({fill:"red",shape:"dot",text:"Error parsing data"});
                return;//halt flow
            }


        });
    }
    RED.nodes.registerType("buffer-parser",bufferParserNode);
}