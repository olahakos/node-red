/**
 * Copyright 2013 IBM Corp.
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

module.exports = function(RED) {
    "use strict";

    var express = null;
    var app = null;
    var jinja = null;

    if (RED.device)
    {
        express = require ('express');
    }

    function WebListenNode(n) {
        RED.nodes.createNode(this,n);
        this.name = n.name;
        this.port = n.port;
        this.route = n.route;
        this.method = n.method;
        if (!app)
        {
            app = express ();
            app.use (require ('morgan')("dev"));
            bodyparser=require ('body-parser');
            app.use (bodyparser.json());
            app.use (bodyparser.urlencoded({ extended:true }));
            app.use ('static', express.static(__dirname+'/static'));
            app.listen (5000);
        }
        
        if (this.method == 'GET')
        {
            app.get (this.route, function (req, res, next)
            {
                msg = {
                    payload: req.query,
                    req: req,
                    res: res,
                    next: next
                };
                this.send (msg);
            });
        }
        else
        if (this.method == 'POST')
        {
            app.post (this.route, function (req, res, next)
            {
                msg = {
                    payload: req.body,
                    req: req,
                    res: res,
                    next: next
                };
                this.send (msg);
            });
        }
        else
        if (this.method == 'PUT')
        {
            app.post (this.route, function (req, res, next)
            {
                msg = {
                    payload: req.body,
                    req: req,
                    res: res,
                    next: next
                };
                this.send (msg);
            });
        }

    }

    RED.nodes.registerType("web_listen",WebListenNode);

    function WebResponseNode(n) {
        RED.nodes.createNode(this,n);

        this.on ('input', function (msg)
        {
            var error = 200;
            if (msg.error) error = msg.error;
            msg.res.send (error, msg.payload);
        });

        RED.nodes.registerType("web_response",WebResponseNode);
    }

    function WebResponseTemplateNode(n) {
        RED.nodes.createNode(this,n);
        this.template = n.template;
        if (!jinja)
        {
            jinja = require ('jinja');   
        }
        this.on ('input', function (msg)
        {
            msg.res.send (jinja.compileFile (__dirname+'/templates/'+this.template).render (msg.payload));
        });

        RED.nodes.registerType("web_template",WebResponseTemplateNode);
    }
}
