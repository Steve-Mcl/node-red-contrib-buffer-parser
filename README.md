node-red-contrib-buffer-parser
==============================

A dynamic <a href="http://nodered.org" target="_new">Node-RED</a> node to convert values in a buffer or integer array into the many different data type(s). Supports Big/Little Endian, BCD, byte swapping and much more.


Summary of functionality
------------------------
* Setup a specification and convert multiple parts of an array or buffer to...
  * int, int8, byte,
  * int16, int16le, int16be, uint16, uint16le, uint16be,
  * int32, int32le, int32be, uint32, uint32le, uint32be,
  * bigint64, bigint64be, bigint64le, biguint64, biguint64be, biguint64le,
  * float, floatle, floatbe, double, doublele, doublebe,
  * 8bit, 16bit, 16bitle, 16bitbe, bool,
  * bcd, bcdle, bcdbe,
  * string, ascii, utf8, utf16le, ucs2, latin1, binary 
* Specification is dynamic & can be sent in as a msg/flow/global property - permitting fully dynamic setup (e.g. via a dashboard)
* The specification format permits random access (e.g. no need for any skips when accessing only first and last elements)
* You can specify the same offset many times to convert the same piece of data several times
* The data can be byte swapped one or more times.  16, 32 or 64 bit swaps are possible. The byte swaps are done prior to any data conversions like LE or BE functions (sometimes it is necessary to do multiple swaps) 
* The output can be sent in any `msg` property.  e.g. you can send results out in `msg.my.nested.property`.  This has the advantage of leaving the original payload in tact.
* Input data can come from not only a msg property but also a flow or global property
* Input data can be a 16bit array (common plc data format) simplifying working with PLC type data arrays
* Output results can be multiple messages as ``topic` and `payload` 
  - ideal for taking PLC data and sending it directly to MQTT
* Output results can be a single msg style output
  * ideal for converting multiple different data elements into one object to pass on to perhaps a template node for preparing a SQL or HTML statement using {{mustache}} formatting


Install
-------

#### Pallet Manager...

The simplest method is to install via the pallet manager in node red. Simply search for **node-red-contrib-buffer-parser** then click install

#### Terminal... 

Run the following command in the root directory of your Node-RED install  (usually `~/.node-red` or `%userprofile%\.node-red`)

    npm install node-red-contrib-buffer-parser

Alternatively, install from a folder containing the source

    npm install c:/source/node-red-contrib-buffer-parser


Usage
-----

example flow...

``` json
[{"id":"5fcbd3ad.d5e95c","type":"buffer-parser","z":"c70ba4a4.e7fb58","name":"","data":"payload","dataType":"msg","specification":"{\"options\":{\"byteSwap\":[\"swap16\"],\"resultType\":\"value\",\"singleResult\":false,\"msgProperty\":\"payload\"},\"items\":[{\"name\":\"plc1/production/alphabet\",\"type\":\"string\",\"offset\":0,\"length\":26},{\"name\":\"plc1/production/status/count\",\"type\":\"int\",\"offset\":25},{\"name\":\"plc1/production/status/sequence\",\"type\":\"bcd\",\"offset\":4},{\"name\":\"plc1/machine/status/runner/temperature\",\"type\":\"int16le\",\"offset\":26},{\"name\":\"plc1/machine/status/runner/speed\",\"type\":\"int16be\",\"offset\":26},{\"name\":\"plc1/machine/status/running\",\"type\":\"bool\",\"offset\":0,\"offsetbit\":0},{\"name\":\"plc1/machine/status/warning\",\"type\":\"bool\",\"offset\":0,\"offsetbit\":1},{\"name\":\"plc1/machine/status/fault\",\"type\":\"bool\",\"offset\":0,\"offsetbit\":2}]}","specificationType":"json","x":930,"y":280,"wires":[["89fa46b4.411538"]]},{"id":"89fa46b4.411538","type":"debug","z":"c70ba4a4.e7fb58","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","x":1170,"y":280,"wires":[]},{"id":"8d39e2b6.82ff4","type":"buffer-parser","z":"c70ba4a4.e7fb58","name":"","data":"payload","dataType":"msg","specification":"{\"options\":{\"byteSwap\":[\"swap16\"],\"resultType\":\"object\",\"singleResult\":true,\"msgProperty\":\"data\"},\"items\":[{\"name\":\"alphabet\",\"type\":\"string\",\"offset\":0,\"length\":26},{\"name\":\"single byte pos 4\",\"type\":\"int\",\"offset\":4},{\"name\":\"bcd equiv\",\"type\":\"bcd\",\"offset\":4,\"length\":5},{\"name\":\"Array[6] of int16le\",\"type\":\"int16le\",\"offset\":26,\"length\":6},{\"name\":\"Array[6] of int16be\",\"type\":\"int16be\",\"offset\":26,\"length\":6},{\"name\":\"32 bools\",\"type\":\"bool\",\"offset\":0,\"length\":32},{\"name\":\"Array[4] of 16bits\",\"type\":\"16bit\",\"offset\":0,\"length\":4}]}","specificationType":"json","x":930,"y":360,"wires":[["4d7a1094.25f39"]]},{"id":"4d7a1094.25f39","type":"debug","z":"c70ba4a4.e7fb58","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"data","targetType":"msg","x":1160,"y":360,"wires":[]},{"id":"1f38bfbf.d7229","type":"inject","z":"c70ba4a4.e7fb58","name":"Fake PLC data 16bit Array","topic":"","payload":"[25185,25699,26213,26727,27241,27755,28013,28783,29297,29811,30325,30839,31353,256,512,768,1024,1280,1536,1792,2048,2304,2560,2816,3072,3597]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":710,"y":280,"wires":[["5fcbd3ad.d5e95c"]]},{"id":"73b18844.726b08","type":"inject","z":"c70ba4a4.e7fb58","name":"Fake PLC data 16bit Array","topic":"","payload":"[25185,25699,26213,26727,27241,27755,28013,28783,29297,29811,30325,30839,31353,256,512,768,1024,1280,1536,1792,2048,2304,2560,2816,3072,3597]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":710,"y":360,"wires":[["8d39e2b6.82ff4"]]},{"id":"6561ba14.6c15a4","type":"comment","z":"c70ba4a4.e7fb58","name":"take a array of 16bit values, byte reverse, split out several values and transmit individual messages with topic + payload","info":"","x":980,"y":240,"wires":[]},{"id":"f607b3c1.b90e1","type":"comment","z":"c70ba4a4.e7fb58","name":"take a array of 16bit values, byte reverse, split out several values and transmit one message with named objects in msg.data","info":"","x":1000,"y":320,"wires":[]}]
```



Dependencies
------------

none :smile: