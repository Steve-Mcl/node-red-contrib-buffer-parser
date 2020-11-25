node-red-contrib-buffer-parser
==============================


<img src='data:image/png;base64,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'/>


## About

A pair of <a href="http://nodered.org" target="_new">Node-RED</a> nodes to convert values to and from buffer/array. Supports Big/Little Endian, BCD, byte swapping and much more.

## A picture is worth a thousand words

### Convert array of integers into individual topic/payload messages - ideal for sending to MQTT
![example1](/images/example1.png) 

### Convert a buffer into key/value items - ideal for sending to dashboard or database
![example3](/images/example3.png) 
![example3b](/images/example3b.png) 

### Fan out
![example3](/images/fanned.png) 

### Scaling final values
![example3](/images/scaling.png) 


## buffer-maker - Summary of functionality **(New in V3.0)**
* Set-up a specification and convert multiple values into a buffer from...
  * int, int8, byte, uint, uint8,
  * int16, int16le, int16be, uint16, uint16le, uint16be,
  * int32, int32le, int32be, uint32, uint32le, uint32be,
  * bigint64, bigint64be, bigint64le, biguint64, biguint64be, biguint64le,
  * float, floatle, floatbe, double, doublele, doublebe,
  * 8bit, 16bit, 16bitle, 16bitbe, bool,
  * bcd, bcdle, bcdbe,
  * string, hex, ascii, utf8, utf16le, ucs2, latin1, binary, buffer 
* Specification is either configured by the built in UI or can be set by a msg/flow/global 
* Input data for each item to include in the final buffer can come from just about anywhere, making it very flexible...
  * a constant (e.g. a number, a string, a boolean, a JSON array)
  * a `msg` property (e.g from `msg.payload.myInteger`)
  * a `flow` property (e.g from `flow.myInteger`)
  * a `global` property (e.g from `global.myInteger`)
* The final built buffer can be byte swapped one or more times. 16, 32 or 64 bit swaps are possible. The byte swaps are performed the data conversions like LE or BE functions (sometimes it is necessary to do multiple swaps) 
* The final buffer can be output to any `msg` property (defaults to `msg.payload`)
* Built in help

## buffer-parser - Summary of functionality

* Set-up a specification and convert multiple parts of an array or buffer to...
  * int, int8, byte, uint, uint8,
  * int16, int16le, int16be, uint16, uint16le, uint16be,
  * int32, int32le, int32be, uint32, uint32le, uint32be,
  * bigint64, bigint64be, bigint64le, biguint64, biguint64be, biguint64le,
  * float, floatle, floatbe, double, doublele, doublebe,
  * 8bit, 16bit, 16bitle, 16bitbe, bool,
  * bcd, bcdle, bcdbe,
  * string, hex, ascii, utf8, utf16le, ucs2, latin1, binary, buffer 
* Specification is either configured by the built in UI or can be set by a msg/flow/global property - permitting fully dynamic setup (e.g. via a dashboard)
* The specification format permits random access (e.g. no need for any skips when accessing only first and last elements)
* You can specify the same offset many times to convert the same piece of data several times
* The data can be byte swapped one or more times.  16, 32 or 64 bit swaps are possible. The byte swaps are done prior to any data conversions like LE or BE functions (sometimes it is necessary to do multiple swaps) 
* The output can be sent in any `msg` property.  e.g. you can send results out in `msg.my.nested.property`.  This has the advantage of leaving the original payload in tact.
* Input data can come from any msg property (not limited to `msg.payload`)
* Input data can be a 16bit array (common plc data format) simplifying working with PLC type data arrays
* Input data can be a hex string e.g. `1FE2D7FFBE`
* Output results can be multiple messages as `topic` and `payload` 
  * ideal for taking PLC data and sending it directly to MQTT
* Output results can be multiple messages fanned out so that each item in the specification is sent out of its own output **(New in V3.1)**
* Output results can be a single msg style output
  * ideal for converting multiple different data elements into one object to pass on to perhaps a template node for preparing a SQL or HTML statement using {{mustache}} formatting
  * additionally, output results can be 1 of 4 styles...
    * "value" : the parsed values are sent in an array 
    * "keyvalue" : the parsed values are sent in an object as key/value pairs. Use a fat arrow `=>` in the name to create object.properties e.g. `motor1=>power` will end up in `msg.payload.motor1.power`.'
    * "object" : the parsed values are sent as named objects with the value set `.value` and other contextual properties included (like the item specification).  Use a fat arrow `=>` in the name to create object.properties e.g. `motor1=>power` will end up in `msg.payload.motor1.power`.'
    * "array" : the parsed values are sent as objects in an array, with each object containing a `.value` property and other contextual properties included (like the item specification)
    * "buffer" : this mode simply returns a buffer (no item processing)
* Final values can be masked (e.g. a MASK of `0x7FFF` could be used to remove the MSB or `0b1000000000000001` to keep only MSB and LSB)
  * Binary and Octal masks only available in **V3.1** onwards
* Final values can be have a Scale value or a simple Scale Equation  **(New in V3.1)** applied...
  * e.g. Entering a Scale value of `0.01` would turn `9710` into `97.1` 
  * e.g. Entering a Scale value of `10` would turn `4.2` into `42` 
  * e.g. Entering a Scale Equation of `>> 4` would bit shift the value `0x0070` to `0x0007`
  * e.g. Entering a Scale Equation of `+ 42` would add an offset of 42 to the final value **(New in V3.1)**
  * Supported Scaling Equations are...
    * `<<` e.g. `<<2` would left shift the parsed value 2 places
    * `>>` e.g. `>>2` would right shift the parsed value 2 places
    * `>>>` e.g. `>>>2` would zero-fill right shift the parsed value 2 places (returns a 32bit unsigned value)
    * `+` e.g. `+10` would add 10 to the parsed value 
    * `-` e.g. `-10` would deduct 10 from the parsed value 
    * `/` e.g. `/10` would divide the parsed value by 10
    * `*` e.g. `*10` would multiply the parsed value by 10
    * `**` e.g. `**2` would raise the parsed value to the power of 2
    * `^` e.g. `^0xf0` would XOR the parsed value with 0xf0
    * `==` e.g. `==10` would result in `true` if the parsed value was equal to 10
    * `!=` e.g. `!=10` would result in `false` if the parsed value was equal to 10
    * `!!` e.g. `!!` would result in `true` if the parsed value was `1` (same as `!!1 == true`) 
    * `>` e.g. `>10` would result in `true` if the parsed value was greater than 10
    * `<` e.g. `<10` would result in `true` if the parsed value was less than 10
  * NOTE: the scale/equation is applied AFTER the mask
* Final values can be have a scale applied (e.g. a scale of `0.01` would turn `9710` into `97.1` or a scale of 10 would turn `50` into `500`) 
  * NOTE: the scale is applied AFTER the mask
* Built in help

  ![help](/images/help.png) 


## Examples

### Example 1 - array of data to MQTT (multiple topics / payloads)

Screen shot - the flow

![example1a](/images/example1a.png) 

Screen shot - the output

![example1b](/images/example1b.png) 


Flow...
```
[{"id":"1194a28a.49d0ad","type":"buffer-parser","z":"c70ba4a4.e7fb58","name":"","data":"payload","dataType":"msg","specification":"{\"options\":{\"byteSwap\":[\"swap16\"],\"resultType\":\"value\",\"singleResult\":false,\"msgProperty\":\"payload\"},\"items\":[{\"name\":\"plc1/production/alphabet\",\"type\":\"string\",\"offset\":0,\"length\":26},{\"name\":\"plc1/production/status/count\",\"type\":\"int\",\"offset\":25},{\"name\":\"plc1/production/status/sequence\",\"type\":\"bcd\",\"offset\":4},{\"name\":\"plc1/machine/status/runner/temperature\",\"type\":\"int16le\",\"offset\":26},{\"name\":\"plc1/machine/status/runner/speed\",\"type\":\"int16be\",\"offset\":26},{\"name\":\"plc1/machine/status/running\",\"type\":\"bool\",\"offset\":0,\"offsetbit\":0},{\"name\":\"plc1/machine/status/warning\",\"type\":\"bool\",\"offset\":0,\"offsetbit\":1},{\"name\":\"plc1/machine/status/fault\",\"type\":\"bool\",\"offset\":0,\"offsetbit\":2}]}","specificationType":"json","x":1110,"y":480,"wires":[["858b1ecf.77b58"]]},{"id":"858b1ecf.77b58","type":"debug","z":"c70ba4a4.e7fb58","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":1350,"y":480,"wires":[]},{"id":"c22cd2e8.52649","type":"inject","z":"c70ba4a4.e7fb58","name":"Fake PLC data 16bit Array","topic":"","payload":"[25185,25699,26213,26727,27241,27755,28013,28783,29297,29811,30325,30839,31353,256,512,768,1024,1280,1536,1792,2048,2304,2560,2816,3072,3597]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":890,"y":480,"wires":[["1194a28a.49d0ad"]]},{"id":"970db39d.106a6","type":"comment","z":"c70ba4a4.e7fb58","name":"take a array of 16bit values, byte reverse, split out several values and transmit individual messages with topic + payload","info":"","x":1160,"y":440,"wires":[]}]
```


### Example 2 - array of data to an named objects

Screen shot - the flow

![example2a](/images/example2a.png) 

Screen shot - the output

![example2b](/images/example2b.png) 


Flow...
```
[{"id":"1523dd03.6332f3","type":"buffer-parser","z":"c70ba4a4.e7fb58","name":"","data":"payload","dataType":"msg","specification":"{\"options\":{\"byteSwap\":[\"swap16\"],\"resultType\":\"object\",\"singleResult\":true,\"msgProperty\":\"data\"},\"items\":[{\"name\":\"alphabet\",\"type\":\"string\",\"offset\":0,\"length\":26},{\"name\":\"single byte pos 4\",\"type\":\"int\",\"offset\":4},{\"name\":\"bcd equiv\",\"type\":\"bcd\",\"offset\":4,\"length\":5},{\"name\":\"Array[6] of int16le\",\"type\":\"int16le\",\"offset\":26,\"length\":6},{\"name\":\"Array[6] of int16be\",\"type\":\"int16be\",\"offset\":26,\"length\":6},{\"name\":\"32 bools\",\"type\":\"bool\",\"offset\":0,\"length\":32},{\"name\":\"Array[4] of 16bits\",\"type\":\"16bit\",\"offset\":0,\"length\":4}]}","specificationType":"json","x":1110,"y":560,"wires":[["a3051c67.b82ad"]]},{"id":"a3051c67.b82ad","type":"debug","z":"c70ba4a4.e7fb58","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"data","targetType":"msg","x":1340,"y":560,"wires":[]},{"id":"9b72f1f5.1aacc","type":"inject","z":"c70ba4a4.e7fb58","name":"Fake PLC data 16bit Array","topic":"","payload":"[25185,25699,26213,26727,27241,27755,28013,28783,29297,29811,30325,30839,31353,256,512,768,1024,1280,1536,1792,2048,2304,2560,2816,3072,3597]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":890,"y":560,"wires":[["1523dd03.6332f3"]]},{"id":"a9a2dd4c.118f9","type":"comment","z":"c70ba4a4.e7fb58","name":"take a array of 16bit values, byte reverse, split out several values and transmit one message with named objects in msg.data","info":"","x":1180,"y":520,"wires":[]}]
```




## Install

### Pallet Manager...

The simplest method is to install via the pallet manager in node red. Simply search for **node-red-contrib-buffer-parser** then click install

### Terminal... 

Run the following command in the root directory of your Node-RED install  (usually `~/.node-red` or `%userprofile%\.node-red`)

    npm install node-red-contrib-buffer-parser

Or, install direct from github

    npm install steve-mcl/node-red-contrib-buffer-parser

Or clone to a local folder and install using NPM

    git clone https://github.com/Steve-Mcl/node-red-contrib-buffer-parser.git
    npm install c:/source/node-red-contrib-buffer-parser

## Dependencies


none :smile:
