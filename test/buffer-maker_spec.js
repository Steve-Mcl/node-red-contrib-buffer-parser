var should = require("should");
var helper = require("node-red-node-test-helper");
var bufferMaker = require("../buffer-maker.js");

const getTestFlow = (nodeName, resultPayloadPropName) => {
    resultPayloadPropName = resultPayloadPropName ? resultPayloadPropName : "payload";
    return [
        { id: 'helperNode', type: 'helper' },
        { 
            "id": "testNode", "type": "buffer-maker", "name": nodeName, "msgProperty": resultPayloadPropName, "specification": "spec", "specificationType": "ui",
                "items": [
                    { "name": "item1", "type": "byte", "length": 1, "dataType": "num", "data": "1" },
                    { "name": "item2", "type": "int8", "length": 1, "dataType": "num", "data": "-2" },
                    { "name": "item3", "type": "uint8", "length": 1, "dataType": "num", "data": "3" },
                    { "name": "item4", "type": "int16le", "length": 1, "dataType": "num", "data": "-4" },
                    { "name": "item5", "type": "int16be", "length": 1, "dataType": "num", "data": "-5" },
                    { "name": "item6", "type": "uint16le", "length": 1, "dataType": "num", "data": "6" },
                    { "name": "item7", "type": "uint16le", "length": 1, "dataType": "num", "data": "7" },
                    { "name": "item8", "type": "int32le", "length": 1, "dataType": "num", "data": "-8" },
                    { "name": "item9", "type": "int32be", "length": 1, "dataType": "num", "data": "-9" },
                    { "name": "item10", "type": "uint32le", "length": 1, "dataType": "num", "data": "10" },
                    { "name": "item11", "type": "uint32be", "length": 1, "dataType": "num", "data": "11" },
                    { "name": "item12", "type": "bigint64le", "length": 1, "dataType": "num", "data": "-120000000000" },
                    { "name": "item13", "type": "bigint64be", "length": 1, "dataType": "num", "data": "-130000000000" },
                    { "name": "item14", "type": "biguint64le", "length": 1, "dataType": "num", "data": "14000000000" },
                    { "name": "item15", "type": "biguint64be", "length": 1, "dataType": "num", "data": "15000000000" },
                    { "name": "item16", "type": "floatle", "length": 1, "dataType": "num", "data": "16.161616" },
                    { "name": "item17", "type": "floatbe", "length": 1, "dataType": "num", "data": "17.171717" },
                    { "name": "item18", "type": "doublele", "length": 1, "dataType": "num", "data": "18.1818e-18" },
                    { "name": "item19", "type": "doublebe", "length": 1, "dataType": "num", "data": "19.1919e-19" },
                    { "name": "item20", "type": "8bit", "length": 1, "dataType": "jsonata", "data": "[[1,0,1,0,0,1,1,0]]" },
                    { "name": "item21", "type": "16bitle", "length": 1, "dataType": "jsonata", "data": "[[1,0,1,0,0,1,1,0,1,0,1,0,0,1,1,0]]" },
                    { "name": "item22", "type": "16bitbe", "length": 1, "dataType": "jsonata", "data": "[[1,0,1,0,0,1,1,0,1,0,1,0,0,1,1,0]]" },
                    { "name": "item23", "type": "bcdle", "length": 1, "dataType": "num", "data": "2323" },
                    { "name": "item24", "type": "bcdbe", "length": 1, "dataType": "num", "data": "2424" },
                    { "name": "item25", "type": "string", "length": 2, "dataType": "str", "data": "25" },
                    { "name": "item26", "type": "hex", "length": 4, "dataType": "str", "data": "2626" },
                    { "name": "item27", "type": "buffer", "length": 24, "dataType": "bin", "data": "[50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55]" },
                    { "name": "item28", "type": "buffer", "length": -1, "dataType": "bin", "data": "[50,55,50,55]" }
                ], 
                "swap1": "", "swap2": "", "swap3": "", "swap1Type": "swap", "swap2Type": "swap", "swap3Type": "swap", "msgPropertyType": "str", 
                "wires": [["helperNode"]] 
        }
    ];
};

helper.init(require.resolve('node-red'));

describe('buffer-maker Node', function(){
    "use strict";

    beforeEach(done => { helper.startServer(done); });

    afterEach(done => { helper.unload().then(() => helper.stopServer(done)); });

    it('should be loaded', done => {
        // const flow = [{ id: 'testNode', type: 'buffer-maker', name: 'DEMO buffer-maker' }];
        const flow = [{"id":"testNode","type":"buffer-maker","name":"DEMO buffer-maker","specification":"spec","specificationType":"ui","items":[{"name":"item1","type":"byte","length":1,"dataType":"num","data":"1"},{"name":"item2","type":"int8","length":1,"dataType":"num","data":"-2"},{"name":"item3","type":"uint8","length":1,"dataType":"num","data":"3"},{"name":"item4","type":"int16le","length":1,"dataType":"num","data":"-4"},{"name":"item5","type":"uint16le","length":1,"dataType":"num","data":"5"},{"name":"item6","type":"uint16le","length":1,"dataType":"num","data":"6"}],"swap1":"","swap2":"","swap3":"","swap1Type":"swap","swap2Type":"swap","swap3Type":"swap","msgProperty":"payload","msgPropertyType":"str"}]
        helper.load(bufferMaker, flow, () => {
            try {
                const n = helper.getNode('testNode');
                n.should.have.property('name', 'DEMO buffer-maker');
                done();  
            } catch (error) {
                done(error);
            }
            
        });
    });

    it('should generate output messages when data is received', done => {
        //this flow is a buffer maker configured with every possible conversion & some fixed values. Expect output to be a buffer of [1,254,3,252,255,5,0,6,0]
        const resultProp = "my.custom.payload";
        const testNodeName = "buffer-maker-node-name";
        const flow = getTestFlow(testNodeName,resultProp);
        helper.load(bufferMaker, flow, function() {
            try {
                const helperNode = helper.getNode("helperNode");
                const testNode = helper.getNode("testNode");
                should(helperNode).not.be.null();
                should(testNode).not.be.null();
                testNode.should.have.property('name', testNodeName);      
                helperNode.on("input", function (msg) {
                    try {
                        msg.should.have.propertyByPath(...resultProp.split("."));
                        /** @type {should.Assertion} */ var rp = msg.should.have.propertyByPath(...resultProp.split(".")).obj;//get the nested property
                        rp.should.be.an.Object()
                        rp.should.instanceOf(Buffer);
                        var expectedPayload = Buffer.from([1,254,3,252,255,255,251,6,0,7,0,248,255,255,255,255,255,255,247,10,0,0,0,0,0,0,11,0,80,113,15,228,255,255,255,255,255,255,225,187,101,108,0,0,12,119,66,3,0,0,0,0,0,0,3,126,17,214,0,253,74,129,65,65,137,95,173,159,29,121,247,81,246,116,60,60,65,179,143,43,255,224,32,101,101,101,101,101,35,35,36,36,50,53,38,38,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55,50,55]).toString("hex");
                        rp.toString("hex").should.equal(expectedPayload);
                        done();
                    } catch (error) {
                        done(error);
                    }
                });
                testNode.receive({ i1: 1111, i2: 2222 }); //fire input of testNode
            } catch (error) {
                done(error);
            }
            
        });
    });
});
