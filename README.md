node-red-contrib-buffer-parser
==============================

A dynamic <a href="http://nodered.org" target="_new">Node-RED</a> node to convert values in a buffer or integer array into the many different data type(s). Supports Big/Little Endian, BCD, byteswapping and much more.


Summary of functionality
------------------------
* Setup a specification and convert data to...
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
  - ideal for taking PLC data and seding it directly to MQTT
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
[{"id":"7123f626.1adce8","type":"data-parser","z":"23406c97.6c35b4","name":"no swap","data":"[97,98,99,100,101,102,103,104,105,106,107,108,109,109,111,112,113,114,115,116,117,118,119,120,121,122,0,1,0,2,0,3,0,4,0,5,0,6,0,7,0,8,0,9,0,10,0,11,0,12]","dataType":"bin","specification":"{\"options\":{\"byteSwap\":false},\"items\":[{\"name\":\"myInt\",\"type\":\"int\",\"offset\":4},{\"name\":\"myInt16Array_LE\",\"type\":\"int16le\",\"offset\":26,\"length\":6},{\"name\":\"myInt16Array_BE\",\"type\":\"int16be\",\"offset\":26,\"length\":6},{\"name\":\"uint32s\",\"type\":\"uint32\",\"offset\":0,\"length\":4},{\"name\":\"floats\",\"type\":\"float\",\"offset\":0,\"length\":4},{\"name\":\"doubles\",\"type\":\"double\",\"offset\":0,\"length\":2},{\"name\":\"myString\",\"type\":\"string\",\"offset\":0,\"length\":5},{\"name\":\"fullString\",\"type\":\"string\",\"offset\":0,\"length\":26}]}","specificationType":"json","x":400,"y":320,"wires":[["322f557.fabc9aa"]],"icon":"font-awesome/fa-cogs"},{"id":"d97fb8a3.64fe68","type":"inject","z":"23406c97.6c35b4","name":"just a trigger","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":130,"y":320,"wires":[["7123f626.1adce8"]]},{"id":"322f557.fabc9aa","type":"debug","z":"23406c97.6c35b4","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":770,"y":320,"wires":[]},{"id":"be610ea2.f82a8","type":"data-parser","z":"23406c97.6c35b4","name":"byte swap","data":"[97,98,99,100,101,102,103,104,105,106,107,108,109,109,111,112,113,114,115,116,117,118,119,120,121,122,0,1,0,2,0,3,0,4,0,5,0,6,0,7,0,8,0,9,0,10,0,11,0,12]","dataType":"bin","specification":"{\"options\":{\"byteSwap\":true},\"items\":[{\"name\":\"myInt\",\"type\":\"int\",\"offset\":4},{\"name\":\"myInt16Array_LE\",\"type\":\"int16le\",\"offset\":26,\"length\":6},{\"name\":\"myInt16Array_BE\",\"type\":\"int16be\",\"offset\":26,\"length\":6},{\"name\":\"uint32s\",\"type\":\"uint32\",\"offset\":0,\"length\":4},{\"name\":\"floats\",\"type\":\"float\",\"offset\":0,\"length\":4},{\"name\":\"doubles\",\"type\":\"double\",\"offset\":0,\"length\":2},{\"name\":\"myString\",\"type\":\"string\",\"offset\":0,\"length\":5},{\"name\":\"fullString\",\"type\":\"string\",\"offset\":0,\"length\":26}]}","specificationType":"json","x":400,"y":380,"wires":[["d9e79dcd.936c4"]]},{"id":"d9e79dcd.936c4","type":"debug","z":"23406c97.6c35b4","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":770,"y":380,"wires":[]},{"id":"7530b240.16fe8c","type":"inject","z":"23406c97.6c35b4","name":"just a trigger","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":130,"y":380,"wires":[["be610ea2.f82a8"]]},{"id":"e008660f.ab1fd8","type":"data-parser","z":"23406c97.6c35b4","name":"","data":"payload","dataType":"msg","specification":"{\"options\":{\"byteSwap\":true},\"items\":[{\"name\":\"myInt\",\"type\":\"int\",\"offset\":4},{\"name\":\"uint32s\",\"type\":\"uint32\",\"offset\":0,\"length\":4},{\"name\":\"floats\",\"type\":\"float\",\"offset\":0,\"length\":4},{\"name\":\"doubles\",\"type\":\"double\",\"offset\":0,\"length\":2},{\"name\":\"myString\",\"type\":\"string\",\"offset\":0,\"length\":5}]}","specificationType":"json","x":630,"y":120,"wires":[["20b244b5.7b23cc"]]},{"id":"20b244b5.7b23cc","type":"debug","z":"23406c97.6c35b4","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":790,"y":120,"wires":[]},{"id":"246db95a.5a8136","type":"comment","z":"23406c97.6c35b4","name":"Pass data in as a Buffer (bytes)","info":"","x":170,"y":80,"wires":[]},{"id":"af5287b5.d15198","type":"inject","z":"23406c97.6c35b4","name":"Pass data in as buffer","topic":"","payload":"[97,98,99,100,101,102,103,104,105,106,107,108,109,109,111,112,113,114,115,116,117,118,119,120,121,122]","payloadType":"bin","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":160,"y":120,"wires":[["e008660f.ab1fd8"]]},{"id":"5373bf6e.7bf09","type":"function","z":"23406c97.6c35b4","name":"abcdefghijklmnopqrstuvwxyz","func":"msg.payload = [0x6162, 0x6364, 0x6566, 0x6768, 0x696A, 0x6B6C, 0x6D6D, 0x6F70, 0x7172, 0x7374, 0x7576, 0x7778, 0x797A]\nreturn msg;","outputs":1,"noerr":0,"x":380,"y":220,"wires":[["e008660f.ab1fd8"]]},{"id":"d0bc0f36.38007","type":"comment","z":"23406c97.6c35b4","name":"Pass data in as array of int (simulate passing values from PLC) ","info":"","x":281,"y":178,"wires":[]},{"id":"6ed04c3e.789c84","type":"comment","z":"23406c97.6c35b4","name":"Byte swap and extract as per the JSON specification","info":"","x":750,"y":80,"wires":[]},{"id":"ccbdafd9.9e6e8","type":"comment","z":"23406c97.6c35b4","name":"Test data and spec entered into node directly","info":"","x":510,"y":280,"wires":[]},{"id":"ce88c305.29fba","type":"comment","z":"23406c97.6c35b4","name":"Inspect the full object for varying output formats","info":"","x":900,"y":280,"wires":[]},{"id":"b9f3ffad.1b41f","type":"inject","z":"23406c97.6c35b4","name":"just a trigger","topic":"","payload":"true","payloadType":"bool","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":130,"y":220,"wires":[["5373bf6e.7bf09"]]}]
```



Dependancies
------------

none