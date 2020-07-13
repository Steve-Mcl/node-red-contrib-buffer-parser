node-red-contrib-buffer-parser
==============================

![node](/images/node.png) 

## About

A dynamic <a href="http://nodered.org" target="_new">Node-RED</a> node to convert values in a buffer or integer array into the many different data type(s). Supports Big/Little Endian, BCD, byte swapping and much more.


## A picture is worth a thousand words - here is 2000
![example1](/images/example1.png) 

![example1](/images/ui.png) 



## Summary of functionality

* Setup a specification and convert multiple parts of an array or buffer to...
  * int, int8, byte,
  * int16, int16le, int16be, uint16, uint16le, uint16be,
  * int32, int32le, int32be, uint32, uint32le, uint32be,
  * bigint64, bigint64be, bigint64le, biguint64, biguint64be, biguint64le,
  * float, floatle, floatbe, double, doublele, doublebe,
  * 8bit, 16bit, 16bitle, 16bitbe, bool,
  * bcd, bcdle, bcdbe,
  * string, ascii, utf8, utf16le, ucs2, latin1, binary 
* Specification is either configured by the built in UI or can be dynamicaly set by a msg/flow/global property - permitting fully dynamic setup (e.g. via a dashboard)
* The specification format permits random access (e.g. no need for any skips when accessing only first and last elements)
* You can specify the same offset many times to convert the same piece of data several times
* The data can be byte swapped one or more times.  16, 32 or 64 bit swaps are possible. The byte swaps are done prior to any data conversions like LE or BE functions (sometimes it is necessary to do multiple swaps) 
* The output can be sent in any `msg` property.  e.g. you can send results out in `msg.my.nested.property`.  This has the advantage of leaving the original payload in tact.
* Input data can come from any msg property (not limited to `msg.payload`)
* Input data can be a 16bit array (common plc data format) simplifying working with PLC type data arrays
* Output results can be multiple messages as `topic` and `payload` 
  * ideal for taking PLC data and sending it directly to MQTT
* Output results can be a single msg style output
  * ideal for converting multiple different data elements into one object to pass on to perhaps a template node for preparing a SQL or HTML statement using {{mustache}} formatting
  * additionally, output results can be 1 of 4 styles...
    * "value" : the parsed values are sent in an array 
    * "object" : the parsed values are sent as named objects with the value set `.value` and other contextual properties included (like the item specification)
    * "array" : the parsed values are sent as objects in an array, with each object containing a `.value` property and other contextual properties included (like the item specification)
    * "buffer" : this mode simply returns a buffer (no item processing)
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
