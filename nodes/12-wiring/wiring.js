
"use strict";

module.exports = function(RED) {
	var wyliodrin = null;
    var http = null;
    var https = null;
    var url = null;
	if (RED.device)
	{
        if (process.env.wyliodrin_board == "raspberrypi")
        {
            process.env.GROVE_PI = 300;   
        }
		wyliodrin = require ('wyliodrin');   
        http = require ('http');
        https = require ('https');
        url = require ('url');
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
               wyliodrin.sendSignalAndFlag (msg.topic, config.signal, parseFloat (msg.payload)); 
            }
            else
            {
        	   wyliodrin.sendSignal (config.signal, parseFloat (msg.payload));
            }
            if (config.address && config.dashboarduuid)
            {
                var address = url.parse (config.address);
                var string = JSON.stringify ({
                    timestamp:(new Date()).getTime() / 1000,
                    value: parseFloat (msg.payload),
                    name: config.signal
                    dashboarduuid: config.dashboarduuid,
                });
                var r = http;
                if (address.protocol == 'https') r = https;
                var headers = {
                  'Content-Type': 'application/json',
                  'Content-Length': string.length,
                  'Connection':'close'
                };

                var options = {
                  host: address.hostname,
                  port: address.port,
                  path: '/signal/add_signal_value',
                  method: 'POST',
                  headers: headers
                };

                // Setup the request.  The options parameter is
                // the object we defined above.
                var req = http.request(options, function(res) {
                  res.setEncoding('utf-8');

                  var responseString = '';

                  res.on('data', function(data) {
                    responseString += data;
                  });

                  res.on('end', function() {
                    var resultObject = JSON.parse(responseString);
                  });
                });

                req.on('error', function(e) {
                  // TODO: handle error.
                  console.log (e);
                });

                req.write(string);
                req.end();
            }



            node.send(null);
        });
    }
    RED.nodes.registerType("sendsignal",sendSignal);
}

