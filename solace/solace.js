/**
 *  Copyright 2014 Solace Systems, Inc. All rights reserved.
 *
 *  http://www.solacesystems.com
 *
 *  This source is distributed under the terms and conditions
 *  of any contract or contracts between Solace and you or
 *  your company. If there are no contracts in place use of
 *  this source is not authorized. No support is provided and
 *  no distribution, sharing with others or re-use of this
 *  source is authorized unless specifically stated in the
 *  contracts referred to above.
 *
 *  solace.js
 *
 */

module.exports = function(RED) {
	"use strict";
	var solaceClient = require("./lib/solaceConnectionPool");
	var util = require("util");

	// get the global settings so we can check log level for solace	
	var settings = require(process.env.NODE_RED_HOME+"/red/red").settings;

	function SOLACEBrokerNode(n) {
		RED.nodes.createNode(this,n);
		this.broker = n.broker;
		this.port = n.port;
		this.clientid = n.clientid;
		//var credentials = RED.nodes.getCredentials(n.id);
		if (this.credentials) {
			this.username = this.credentials.username;
			this.password = this.credentials.password;
			this.vpn = this.credentials.vpn;
		}
	}
	RED.nodes.registerType("solace-broker",SOLACEBrokerNode,{
        credentials: {
            username: { type:"text" },
            password: { type: "password" },
            vpn: { type: "text" }
        }
    });

	function SOLACEInNode(n) {
		RED.nodes.createNode(this,n);
		this.topic = n.topic;
		this.broker = n.broker;
		this.brokerConfig = RED.nodes.getNode(this.broker);
		var node = this;
		if (this.brokerConfig) {
			node.status({fill:"red",shape:"ring",text:"disconnected"});
			this.client = solaceClient.get((this.brokerConfig.broker + ":" + this.brokerConfig.port) , node.brokerConfig.username, node.brokerConfig.password, node.brokerConfig.vpn, node.brokerConfig.clientid  );
			if(settings.solaceLogLevel > 2 ) {
				util.log("[solace] created subscriber object for connection: " + this.client.ref + " instance: " + this.client[("_instances")] );
			}			
			this.client.registerStatus(function(status) {
				if(status == "connected") {
					node.status({fill:"green",shape:"dot",text:"connected"});
				}
				if(status == "disconnected") {
					node.status({fill:"red",shape:"ring",text:"disconnected"});
				}
			});
			this.client.connect() ;
			this.client.subscribe(this.topic, function(topic, payload, msgtype) {
				node.send({topic: topic, payload: payload, msgtype: msgtype});
				}
			);
		} else {
			this.error("[solace] missing broker configuration");
		}	
        this.on('close', function() {
            if (this.client) {
                this.client.disconnect();
            }
        });
	}
	RED.nodes.registerType("solace in",SOLACEInNode);

	function SOLACEOutNode(n) {
		RED.nodes.createNode(this,n);
		this.topic = n.topic;
		this.broker = n.broker;
		this.msgtype = n.msgtype;
		this.brokerConfig = RED.nodes.getNode(this.broker);
		var node = this;
		
		if (this.brokerConfig ) {
			this.status({fill:"red",shape:"ring",text:"disconnected"});
			this.client = solaceClient.get((this.brokerConfig.broker + ":" + this.brokerConfig.port) , node.brokerConfig.username, node.brokerConfig.password, node.brokerConfig.vpn, node.brokerConfig.clientid  );
			if(settings.solaceLogLevel > 2 ) {
				util.log("[solace] created publisher object for connection: " + this.client.ref + " instance: " + this.client[("_instances")] );
			}
			this.client.registerStatus(function(status) {
				if(status == "connected") {
					node.status({fill:"green",shape:"dot",text:"connected"});
				}
				if(status == "disconnected") {
					node.status({fill:"red",shape:"ring",text:"disconnected"});
				}
			});			
			this.client.connect();			
			this.on("input",function(msg) {
				if (msg != null && msg.topic != "" && this.topic == "" ) {
					this.client.publish({payload: msg.payload, topic: msg.topic, msgtype: this.msgtype});
				}
				if (msg != null && this.topic != "" ) {
					
					this.client.publish({payload: msg.payload, topic: this.topic, msgtype: this.msgtype});
				}
				if(msg == null || (msg.topic == "" && this.topic == "")) {
					util.log("[solace] request to send a NULL message or NULL topic on session: " + this.client.ref + " object instance: " + this.client[("_instances")]);
				}
			});
		} else {
			this.error("[solace] missing broker configuration");
		}
		this.on('close', function() {
            if (this.client) {
                this.client.disconnect();
            }
        });
	}
	RED.nodes.registerType("solace out",SOLACEOutNode);

};
