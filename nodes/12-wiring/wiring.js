
"use strict";

module.exports = function(RED) {
	var wyliodrin = null;
	if (RED.device)
	{
        if (process.env.wyliodrin_board == "raspberrypi")
        {
            process.env.GROVE_PI = 300;   
        }
		wyliodrin = require ('wyliodrin');   
	}

    if (!RED.wyliodrin) RED.wyliodrin = {};

    if (!RED.wyliodrin.pinModes) RED.wyliodrin.pinModes = [];

    function digitalWrite(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.on('input', function(msg) {
            var pin = config.pin;
            if (config.pin.length == 0) pin = msg.topic;
            if (RED.wyliodrin.pinModes[pin] !== wyliodrin.OUTPUT)
            {
                wyliodrin.pinMode (parseInt(pin), wyliodrin.OUTPUT);    
            }
        	wyliodrin.digitalWrite (parseInt(pin), parseInt (msg.payload));
            node.send(null);
        });
    }
    RED.nodes.registerType("digitalwrite",digitalWrite);

    function digitalRead(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        // if (this.interval == "on_input")
        // {
        //     this.inputs = 1;
        // }
        // else
        // {
        //     this.inputs = 0;
        // }
        this.on('input', function(msg) {
            var pin = config.pin;
            if (config.pin.length == 0) pin = msg.topic;
            if (RED.wyliodrin.pinModes[pin] !== wyliodrin.INPUT)
            {
                wyliodrin.pinMode (parseInt(pin), wyliodrin.INPUT);    
            }
            node.send({topic: pin, payload: wyliodrin.digitalRead (parseInt(pin))});
        });
    }
    RED.nodes.registerType("digitalread",digitalRead);

    function shiftOut(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.on('input', function(msg) {
            var pin = config.pin;
            var clock = config.clock;
            var msblsb = config.msblsb;
            if (config.pin.length == 0) pin = msg.topic;
            if (config.clock.length == 0) clock = msg.clock;
            if (RED.wyliodrin.pinModes[pin] !== wyliodrin.OUTPUT)
            {
                wyliodrin.pinMode (parseInt(pin), wyliodrin.OUTPUT);    
            }
            if (RED.wyliodrin.pinModes[clock] !== wyliodrin.OUTPUT)
            {
                wyliodrin.pinMode (parseInt(clock), wyliodrin.OUTPUT);    
            }
            wyliodrin.shiftOut (parseInt(pin), parseInt(clock), parseInt(msblsb), parseInt (msg.payload));
            node.send(null);
        });
    }
    RED.nodes.registerType("shift out",shiftOut);

    function shiftIn(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        // if (this.interval == "on_input")
        // {
        //     this.inputs = 1;
        // }
        // else
        // {
        //     this.inputs = 0;
        // }
        this.on('input', function(msg) {
            var pin = config.pin;
            var clock = config.clock;
            var msblsb = config.msblsb;
            if (config.pin.length == 0) pin = msg.topic;
            if (config.clock.length == 0) clock = msg.clock;
            if (RED.wyliodrin.pinModes[pin] !== wyliodrin.INPUT)
            {
                wyliodrin.pinMode (parseInt(pin), wyliodrin.INPUT);    
            }
            if (RED.wyliodrin.pinModes[clock] !== wyliodrin.OUTPUT)
            {
                wyliodrin.pinMode (parseInt(clock), wyliodrin.OUTPUT);    
            }
            node.send({topic: pin, clock: clock, payload: wyliodrin.shiftOut (parseInt(pin), parseInt(clock), parseInt(msblsb))});
        });
    }
    RED.nodes.registerType("shift in",shiftIn);

    function analogWrite(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.on('input', function(msg) {
            // if (RED.wyliodrin.pinModes[config.pin] !== wyliodrin.OUTPUT)
            // {
            //     wyliodrin.pinMode (parseInt(config.pin), wyliodrin.OUTPUT);    
            // }
            var pin = config.pin;
            if (config.pin.length == 0) pin = msg.topic;
            wyliodrin.analogWrite (parseInt(pin), parseInt (msg.payload));
            node.send(null);
        });
    }
    RED.nodes.registerType("analogwrite",analogWrite);

    function analogRead(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        // if (this.interval == "on_input")
        // {
        //     this.inputs = 1;
        // }
        // else
        // {
        //     this.inputs = 0;
        // }
        this.on('input', function(msg) {
            var pin = config.pin;
            if (config.pin.length == 0) pin = msg.topic;
            node.send({topic: pin, payload: wyliodrin.analogRead (parseInt(pin))});
        });
    }
    RED.nodes.registerType("analogread",analogRead);
    
    function sendSignal(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.on('input', function(msg) {
            if (msg.topic)
            {
               wyliodrin.sendSignal (msg.topic, config.signal, parseFloat (msg.payload)); 
            }
            else
            {
        	   wyliodrin.sendSignal (config.signal, parseFloat (msg.payload));
            }
            node.send(null);
        });
    }
    RED.nodes.registerType("sendsignal",sendSignal);
}

