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
        this.drop = n.drop;
        this.multiple = n.multiple;

        this.data = null;
        this.pos = 0;

        var _ = require ('underscore');
        
        var that = this;

        this.on("input", function(msg) {
            if (this.send == "event" && msg.send)
            {
                if (that.data)
                {
                    that.send (that.data);
                    that.data = null;
                    that.pos = 0;
                }
            }
            else
            if (!msg.send)
            {
                if (that.size == 1)
                {
                    if (that.multiple)
                    {
                        if (!that.data) that.data = msg;
                        else
                        for (var id in msg)
                        {
                            that.data[id] = msg[id];
                        }
                    }
                    else
                    {
                        that.data = msg;    
                    }
                }
                else
                {
                    if (that.pos == that.size)
                    {
                        for (var id in that.data)
                        {
                            that.data[id].splice (0, 1);
                        }       
                    }
                    if (!that.data) that.data = {};
                    for (var id in msg)
                    {
                        if (_.isArray (data[id]) == false)
                        {
                            data[id] = Array (that.size);
                        }
                        data[id][that.pos] = msg[id];
                    }
                }
                if (that.pos == that.size && that.send == "full")
                {
                    that.send (that.data);
                    that.data = null;
                    that.pos = 0;
                }
            }
        });

        this.on("close", function() {
            
        });
    }
    RED.nodes.registerType("buffer",BufferNode);
}
