
"use strict";

module.exports = function(RED) {
	var redis = null;
    var subscribe = null;
    var publish = null;
	if (RED.device)
	{
		redis = require ('redis');
	}

    function sendMessage(config) {
        RED.nodes.createNode(this,config);
        this.name = config.name;
        this.label = config.label;
        this.boardid = config.boardid;
        var node = this;
        this.on('input', function(msg) {
            if (!publish)
            {
                publish = redis.createClient ();
            }
            if (this.boardid && this.boardid.trim().length == 0) this.boardid = msg.boardid;
            var ids = this.boardid.split (',');
            for (var boardid in ids)
            {
                console.log ('sending: '+JSON.stringify ({id: boardid, data:msg.payload}));
                publish.publish ('communication_server:'+msg.label, JSON.stringify ({id: boardid, data:msg.payload}));
            }
        });
    }
    RED.nodes.registerType("send",sendMessage);

    function receiveMessage(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.label = config.label;
        this.subscribe = redis.createClient ();
        // if (this.interval == "on_input")
        // {
        //     this.inputs = 1;
        // }
        // else
        // {
        //     this.inputs = 0;
        // }

        this.subscribe.psubscribe ('communication_client:'+this.label);
        this.subscribe.on ('pmessage', function (pattern, channel, strmessage)
        {
            var message = JSON.parse (strmessage);
            var msg = 
            {
                label: channel.substring ('communication_client'.length),
                sender: message.from,
                payload: message.data
            };
            this.send (msg);
        });
    }
    RED.nodes.registerType("receive",receiveMessage);
}

