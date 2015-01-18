/*
 * Copyright (c) 2014. Knowledge Media Institute - The Open University
 * Modified by: Wyliodrin
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * NodeRed node with support for interaction with BLEs
 *
 * @author <a href="mailto:carlos.pedrinaci@open.ac.uk">Carlos Pedrinaci</a> (KMi - The Open University)
 * based on the initial node by Charalampos Doukas http://blog.buildinginternetofthings.com/2013/10/12/using-node-red-to-scan-for-ble-devices/
 */

module.exports = function(RED) {

    var noble = null;
    var os = null;
    var dict = null;
    var _ = require ('underscore');

    if (RED.device)
    {
        noble = require('noble');
        os = require('os');
        dict = require ('dict');

        console.log('Unblocking BLE');
        function puts(error, stdout, stderr) { console.log(stdout) };
        if (process.env.wyliodrin_board == "edison")
        {
            var cps = require ('child_process');
            cps.exec("systemctl stop bluetooth; rfkill unblock bluetooth; hciconfig hci0 up", puts);
        }
    }
    
    // The main node definition - most things happen in here
    function NobleScan(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        // Store local copies of the node configuration (as defined in the .html)
        this.duplicates = n.duplicates;
        this.uuids = [];
        if (n.uuids != undefined && n.uuids !== "") {
            this.uuids = n.uuids.split(',');    //obtain array of uuids
        }

        if (RED.device)
        {

            var node = this;
            var machineId = os.hostname();

            noble.on('discover', function(peripheral) {
                var msg = { payload:{peripheralUuid:peripheral.uuid, localName: peripheral.advertisement.localName} };
                msg.peripheralUuid = peripheral.uuid;
                msg.localName = peripheral.advertisement.localName;
                msg.detectedAt = new Date().getTime();
                msg.detectedBy = machineId;
                msg.advertisement = peripheral.advertisement;
                msg.rssi = peripheral.rssi;
                msg.peripheral = peripheral;

                // Check the BLE follows iBeacon spec
                if (peripheral.manufacturerData) {
                    // http://www.theregister.co.uk/2013/11/29/feature_diy_apple_ibeacons/
                    if (peripheral.manufacturerData.length >= 25) {
                        var proxUuid = peripheral.manufacturerData.slice(4, 20).toString('hex');
                        var major = peripheral.manufacturerData.readUInt16BE(20);
                        var minor = peripheral.manufacturerData.readUInt16BE(22);
                        var measuredPower = peripheral.manufacturerData.readInt8(24);

                        var accuracy = Math.pow(12.0, 1.5 * ((rssi / measuredPower) - 1));
                        var proximity = null;

                        if (accuracy < 0) {
                            proximity = 'unknown';
                        } else if (accuracy < 0.5) {
                            proximity = 'immediate';
                        } else if (accuracy < 4.0) {
                            proximity = 'near';
                        } else {
                            proximity = 'far';
                        }

                        msg.manufacturerUuid = proxUuid;
                        msg.major = major;
                        msg.minor = minor;
                        msg.measuredPower = measuredPower;
                        msg.accuracy = accuracy;
                        msg.proximity = proximity;
                    }
                }

                // Generate output event
                node.send(msg);
            });

            // deal with state changes
            noble.on('stateChange', function(state) {
                if (state === 'poweredOn') {
                    noble.startScanning(node.uuids, node.duplicates);
                } else {
                    noble.stopScanning();
                }
            });

            // start initially
            if (noble.state === 'poweredOn') {
                noble.startScanning(node.uuids, node.duplicates);
            } else {
                this.warn("Unable to start BLE scan. Adapter state: " + noble.state);
            }
    
            this.on("close", function() {
                // Called when the node is shutdown - eg on redeploy.
                // Allows ports to be closed, connections dropped etc.
                // eg: this.client.disconnect();
                noble.stopScanning();
            });

            noble.on('scanStart', function() {
                node.log("Scanning for BLEs started. UUIDs: " + node.uuids + " - Duplicates allowed: " + node.duplicates);
            });

            noble.on('scanStop', function() {
                node.log("Scanning for BLEs stopped. ");
            });
        }
    }
    
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("scan ble",NobleScan);

    // The main node definition - most things happen in here
    function NobleRead(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        this.peripherals = dict ();

        this.addresses = n.addresses.split (', ');
        this.service = n.service;
        this.characteristic = n.characteristic;

        var that = this;

        var hasAddress = function (address)
        {
            if (that.addresses.length == 0) return true;
            else
            {
                for (var i=0; i<that.addresses.length; i++)
                {
                    if (that.addresses[i].toLowerCase() == address.toLowerCase()) return true;
                }
                return false;
            }
        };

        if (RED.device)
        {
    
            this.on ('input', function (msg)
            {
                if (msg.peripheral)
                {
                    console.log ('peripheraldevice');
                    console.log (msg.peripheral);
                    console.log (msg.peripheralUuid);
                    if (that.peripherals.get (msg.peripheralUuid) != msg.peripheral)
                    {
                        if (hasAddress (msg.peripheralUuid))
                        {
                            console.log ('adding peripheral device');
                            that.peripherals.set (msg.peripheralUuid, msg.peripheral);
                            console.log (that.peripherals);
                            console.log (that.peripherals.size);
                        }
                    }
                }
                if (msg.event)
                {
                    console.log ('periferal devices');
                    console.log (that.peripherals);
                    console.log (that.peripherals.size);
                    that.peripherals.forEach (function (peripheraldevice, address)
                    {
                        console.log (peripheraldevice);
                        peripheraldevice.connect (function (err)
                        {
                            if (err)
                            {
                                that.warn (err);
                            }
                            else
                            {
                                console.log ('connected '+address);
                                peripheraldevice.discoverSomeServicesAndCharacteristics([that.service], [that.characteristic], function (err, services, characteristics)
                                    {
                                        if (err)
                                        {
                                            that.warn (err);
                                        }
                                        else
                                        {
                                            console.log (services);
                                            console.log (characteristics);
                                            // read characteristic
                                            peripheraldevice.disconnect ();
                                        }
                                    });
                            }
                        });
                    });
                }
            });

            this.on("close", function() {
                // Called when the node is shutdown - eg on redeploy.
                // Allows ports to be closed, connections dropped etc.
                // eg: this.client.disconnect();
                if (peripheral) peripheral.disconnect ();
            });
        }
    }
    
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("read ble",NobleRead);

}