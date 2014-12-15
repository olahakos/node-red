/**
 * Copyright 2013, 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

//Simple node to introduce a pause into a flow
module.exports = function(RED) {
    "use strict";

    function BufferNode(n) {
        RED.nodes.createNode(this,n);

        this.send = n.send;
        this.size = n.size;
        this.shift = n.shift;
        this.multiple = n.multiple;

        this.data = null;
        this.pos = 0;

        var _ = require ('underscore');
        var util = require ('util');
        
        var that = this;

        var sendData = function ()
        {
            if (that.data)
            {
                that.send (that.data);
                that.data = null;
                that.pos = 0;
            }
            else
            {
                that.info ('')
            }
        };

        var addToArray = function (msg)
        {
            console.log (that.pos+" / "+that.size);
            if (!that.data) that.data = {};
            for (var id in msg)
            {
                if (!that.data[id]) that.data[id] = Array (that.size);
                that.data[id][that.pos] = msg[id];
                that.pos = that.pos + 1;
            }
        };

        this.on("input", function(msg) {
            if (this.send == "event" && msg.send)
            {
                if (that.data)
                {
                    that.send (that.data);
                    that.data = null;
                    that.pos = 0;
                }
                else
                {
                    that.warn ("data is null");
                }
            }
            else
            if (!msg.send)
            {
                if (that.size <= 1)
                {
                    if (that.multiple)
                    {
                        if (!that.data) that.data = msg;
                        else
                        for (var id in msg)
                        {
                            if (!that.data[id] || that.shift == "shift") that.data[id] = msg[id];
                        }
                    }
                    else
                    {
                        if (!that.data || that.shift == "shift") that.data = msg;    
                    }
                }
                else
                {
                    if (that.pos == that.size && that.shift == "shift")
                    {
                        for (var id in that.data)
                        {
                            that.data[id].shift ();
                        }
                        that.pos = that.pos - 1;
                    }
                    if (that.pos < that.size)
                    {
                        if (!that.data) that.data = {};
                        for (var id in msg)
                        {
                            if (_.isArray (that.data[id]) == false)
                            {
                                that.data[id] = Array (that.size);
                            }
                            that.data[id][that.pos] = msg[id];
                        }
                    }
                }
                if (that.pos == that.size && that.send == "full") sendData ();
                console.log (util.inspect (that.data));
            }
        });

        this.on("close", function() {
            
        });
    }
    RED.nodes.registerType("buffer",BufferNode);
}
