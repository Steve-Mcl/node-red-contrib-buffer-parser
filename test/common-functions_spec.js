var should = require("should");
const commonFunctions = require('.././common-functions.js');

describe('common-functions.js', function(){
    var stop = false;
    it('should be loaded', done => {
        function shouldHaveFunction(obj, fName) {
            obj.should.have.property(fName).which.is.a.Function(); 
        }
        try {
            commonFunctions.should.be.type("object");
            commonFunctions.should.have.property("SWAPOPTS").which.is.instanceOf(Array);
            commonFunctions.should.have.property("TYPEOPTS").which.is.instanceOf(Array);

            shouldHaveFunction(commonFunctions, "bcd2number");//additional tests TO DO
            shouldHaveFunction(commonFunctions, "number2bcd");//additional tests TO DO
            shouldHaveFunction(commonFunctions, "byteToBits");
            shouldHaveFunction(commonFunctions, "wordToBits");
            shouldHaveFunction(commonFunctions, "bitsToByte");
            shouldHaveFunction(commonFunctions, "bitsToWord");
            shouldHaveFunction(commonFunctions, "getBit");//additional tests TO DO
            shouldHaveFunction(commonFunctions, "setBit");//additional tests TO DO
            shouldHaveFunction(commonFunctions, "clearBit");//additional tests TO DO
            shouldHaveFunction(commonFunctions, "updateBit");//additional tests TO DO
            shouldHaveFunction(commonFunctions, "isNumber");
            shouldHaveFunction(commonFunctions, "setObjectProperty");
            shouldHaveFunction(commonFunctions, "getObjectProperty");

            var parent = {};
            var grandchildNamePath = "child.child.name";
            var grandchildName = "dum dum";

            describe('#setObjectProperty()', () => {
                it('should set object property by path', done => {
                    try {
                        commonFunctions.setObjectProperty(parent, "child.child.name", grandchildName);
                        parent.should.have.propertyByPath(...grandchildNamePath.split(".")).which.eqls(grandchildName);
                        done();
                    } catch (error) {
                        done(error);
                    }
                })  
            })    
            
            describe('#getObjectProperty()', () => {
                it('should get object property by path', done => {
                    try {
                        var name = commonFunctions.getObjectProperty(parent, grandchildNamePath) || "";
                        name.should.eql(grandchildName);
                        done();      
                    } catch (error) {
                        done(error);
                    }
                })                 
            })
        
            describe('#isNumber()', () => {
                it('should test numbers', done => {
                    try {
                        commonFunctions.isNumber("123").should.eql(true);
                        commonFunctions.isNumber("0x123").should.eql(true);
                        commonFunctions.isNumber("0b1001").should.eql(true);
                        commonFunctions.isNumber("0o1234567").should.eql(true);
                        commonFunctions.isNumber("0o12345678").should.eql(false);
                        commonFunctions.isNumber("efg").should.eql(false);
                        commonFunctions.isNumber(null).should.eql(false);
                        done();
                    } catch (error) {
                        done(error);
                    }
                })                
            })       
        
            describe('#byteToBits() #bitsToByte()', () => {
                it('should convert byte to bits and back to byte', done => {
                    try {
                        var x96 = commonFunctions.byteToBits(0x96); 
                        x96.bits.should.eql([0, 1, 1, 0, 1, 0, 0, 1]); //bit 0 ~ 7
                        commonFunctions.bitsToByte(x96.bits).should.eql(0x96); 
                        done();
                    } catch (error) {
                        done(error);
                    }
                })                
            })       
        
            describe('#wordToBits() #bitsToWord()', () => {
                it('should convert word to bits and back to word', done => {
                    try {
                        var xf708 = commonFunctions.wordToBits(0xf708); //
                        xf708.bits.should.eql([0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1]); //bit 0 ~ 15
                        commonFunctions.bitsToWord(xf708.bits).should.eql(0xf708);
                        done();
                    } catch (error) {
                        done(error);
                    }
                })                
            }) 

            done(); //success :)
        } catch (error) {
            stop = true;
            done(error);
        }
    });
    
    
});
