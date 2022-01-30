var should = require("should");
var helper = require("node-red-node-test-helper");
var bufferParser = require("../buffer-parser.js");

const getTestFlow = (nodeName, resultPayloadPropName) => {
    resultPayloadPropName = resultPayloadPropName ? resultPayloadPropName : "payload";
    return [
        { id: 'helperNode1', type: 'helper' },
        { id: 'helperNode2', type: 'helper' },
        { id: 'helperNode3', type: 'helper' },
        { id: 'helperNode4', type: 'helper' },
        { id: 'helperNode5', type: 'helper' },
        {"id":"testNode","type":"buffer-parser","name":nodeName,"msgProperty":resultPayloadPropName,"data":"payload","dataType":"msg","specification":"spec","specificationType":"ui","items":[{"type":"int16be","name":"item1","offset":0,"length":1,"offsetbit":0,"scale":"1","mask":""},{"type":"int32be","name":"item2","offset":2,"length":1,"offsetbit":0,"scale":"1","mask":""},{"type":"bigint64be","name":"item3","offset":6,"length":1,"offsetbit":0,"scale":"1","mask":""},{"type":"hex","name":"item4","offset":14,"length":10,"offsetbit":0,"scale":"1","mask":""},{"type":"string","name":"item5","offset":24,"length":10,"offsetbit":0,"scale":"1","mask":""}],"swap1":"","swap2":"","swap3":"","swap1Type":"swap","swap2Type":"swap","swap3Type":"swap","msgPropertyType":"str","resultType":"value","resultTypeType":"output","multipleResult":true,"fanOutMultipleResult":true,"setTopic":true,"outputs":5,"wires":[["helperNode1"],["helperNode2"],["helperNode3"],["helperNode4"],["helperNode5"]]}
    ];
};

helper.init(require.resolve('node-red'));

describe('buffer-parser Node', function(){
    "use strict";

    beforeEach(done => { helper.startServer(done); });

    afterEach(done => { helper.unload().then(() => helper.stopServer(done)); });

    it('should be loaded', done => {
        // const flow = [{ id: 'testNode', type: 'buffer-parser', name: 'test--buffer-parser' }];
        const flow = [{"id":"testNode","type":"buffer-parser","name":"test--buffer-parser","specification":"spec","specificationType":"ui","items":[{"name":"item1","type":"byte","length":1,"dataType":"num","data":"1"},{"name":"item2","type":"int8","length":1,"dataType":"num","data":"-2"},{"name":"item3","type":"uint8","length":1,"dataType":"num","data":"3"},{"name":"item4","type":"int16le","length":1,"dataType":"num","data":"-4"},{"name":"item5","type":"uint16le","length":1,"dataType":"num","data":"5"},{"name":"item6","type":"uint16le","length":1,"dataType":"num","data":"6"}],"swap1":"","swap2":"","swap3":"","swap1Type":"swap","swap2Type":"swap","swap3Type":"swap","msgProperty":"payload","msgPropertyType":"str"}]
        helper.load(bufferParser, flow, () => {
            try {
                const testNode = helper.getNode('testNode');
                testNode.should.have.property('name', 'test--buffer-parser');
                done();  
            } catch (error) {
                done(error);
            }
            
        });
    });

    it('should make BigInt values with and without mask', done => {
        const flow = [{ id: 'helperNode1', type: 'helper' }, {"id":"testNode","type":"buffer-parser","name":"test--buffer-parser","data":"payload","dataType":"msg","specification":"spec","specificationType":"ui","items":[{"type":"bigint64be","name":"MASK_00000001FFFFFFFF","offset":0,"length":1,"offsetbit":0,"scale":"1","mask":"0x00000001FFFFFFFF"},{"type":"bigint64be","name":"MASK_000001FFFFFFFFFF","offset":0,"length":1,"offsetbit":0,"scale":"1","mask":"0x000001FFFFFFFFFF"},{"type":"bigint64be","name":"MASK_0001FFFFFFFFFFFF","offset":0,"length":1,"offsetbit":0,"scale":"1","mask":"0x0001FFFFFFFFFFFF"},{"type":"bigint64be","name":"MASK_000FFFFFFFFFFFFF","offset":0,"length":1,"offsetbit":0,"scale":"1","mask":"0x000FFFFFFFFFFFFF"},{"type":"bigint64be","name":"NO_MASK","offset":0,"length":1,"offsetbit":0,"scale":"1","mask":""}],"swap1":"","swap2":"","swap3":"","swap1Type":"swap","swap2Type":"swap","swap3Type":"swap","msgProperty":"payload","msgPropertyType":"str","resultType":"keyvalue","resultTypeType":"return","multipleResult":false,"fanOutMultipleResult":false,"setTopic":true,"outputs":1,"wires":[["helperNode1"]]}]
        helper.load(bufferParser, flow, () => {
            try {
                const testNode = helper.getNode('testNode');
                const helperNode1 = helper.getNode("helperNode1");

                helperNode1.on("input", function (msg) { 
                    try {
                        msg.should.have.property("payload");
                        msg.payload.should.have.property("MASK_00000001FFFFFFFF");
                        msg.payload.should.have.property("MASK_000001FFFFFFFFFF");
                        msg.payload.should.have.property("MASK_0001FFFFFFFFFFFF");
                        msg.payload.should.have.property("MASK_000FFFFFFFFFFFFF");
                        msg.payload.should.have.property("NO_MASK");
                        msg.payload.MASK_00000001FFFFFFFF.should.eql(8589934591n);
                        msg.payload.MASK_000001FFFFFFFFFF.should.eql(2199023255551n);
                        msg.payload.MASK_0001FFFFFFFFFFFF.should.eql(562949953421311n);
                        msg.payload.MASK_000FFFFFFFFFFFFF.should.eql(4503599627370495n);
                        msg.payload.NO_MASK.should.eql(4503599627370495n);
                        done();
                    } catch(err) {
                        done(err);
                    }               
                });
                testNode.should.have.property('name', 'test--buffer-parser');
                testNode.receive({ payload: Buffer.from([0,15,255,255,255,255,255,255]) }); //fire input of testNode with a buffer of 0x000FFFFFFFFFFFFF (4503599627370495)
            } catch (error) {
                done(error);
            }
            
        });
    });
    
    it('should generate 5 values (fan out test)', done => {
        
        const resultProp = "my.custom.payload";
        const testNodeName = "buffer-parser-node-name";
        const flow = getTestFlow(testNodeName,resultProp);
        this.timeout(2000); //timeout with an error if done() isn't called within one second

        helper.load(bufferParser, flow, function() {
            try {
                var helperNode1 = helper.getNode("helperNode1");
                var helperNode2 = helper.getNode("helperNode2");
                var helperNode3 = helper.getNode("helperNode3");
                var helperNode4 = helper.getNode("helperNode4");
                var helperNode5 = helper.getNode("helperNode5");
                var testNode = helper.getNode("testNode");

                should(helperNode1).not.be.null();
                should(helperNode2).not.be.null();
                should(helperNode3).not.be.null();
                should(helperNode4).not.be.null();
                should(helperNode5).not.be.null();
                should(testNode).not.be.null();
                testNode.should.have.property('name', testNodeName);

                var results = {};
                setTimeout(function () {

                    var doTest = function(msg, expectedType, expectedValue) {
                        var path = resultProp.split(".");
                        msg.should.have.propertyByPath(...path);
                        /** @type {should.Assertion} */ var rp = msg.should.have.propertyByPath(...path).obj;//get the nested property
                        should(rp).be.of.type(expectedType);
                        should(rp).eql(expectedValue);
                    }

                    try {
                        results.should.have.properties(["resultMsg1","resultMsg2","resultMsg3","resultMsg4","resultMsg5"])
                        doTest(results.resultMsg1, "number", 24930);
                        doTest(results.resultMsg2, "number", 1667523942);
                        doTest(results.resultMsg3, "bigint", 7451321489274203502n);
                        doTest(results.resultMsg4, "string", "6f707172737475767778");
                        doTest(results.resultMsg5, "string", "yzABCDEFGH");
                        done();
                        return;
                    } catch (error) {
                        done(error);
                    }
                }, 1000); 

                helperNode1.on("input", function (msg) { results.resultMsg1 = msg; });
                helperNode2.on("input", function (msg) { results.resultMsg2 = msg; });
                helperNode3.on("input", function (msg) { results.resultMsg3 = msg; });
                helperNode4.on("input", function (msg) { results.resultMsg4 = msg; });
                helperNode5.on("input", function (msg) { results.resultMsg5 = msg; });
                testNode.receive({ payload: Buffer.from([97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90]) }); //fire input of testNode
            } catch (error) {
                done(error);
            }
        });        
    });

    //TODO: Test the following...
    /*
    * all functions
    * all output types
    * byte swaps
    * scaling operators
    * dynamic spec
    */
});
