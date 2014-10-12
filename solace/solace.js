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
	



	function SOLACEBrokerNode(n) {
		RED.nodes.createNode(this,n);
		this.broker = n.broker;
		this.port = n.port;
		this.clientid = n.clientid;
		var credentials = RED.nodes.getCredentials(n.id);
		if (credentials) {
			this.username = credentials.user;
			this.password = credentials.password;
			this.vpn = credentials.vpn;
		}
	}
	RED.nodes.registerType("solace-broker",SOLACEBrokerNode);

	var querystring = require('querystring');

	RED.httpAdmin.get('/solace-broker/:id',function(req,res) {
		var credentials = RED.nodes.getCredentials(req.params.id);
		if (credentials) {
			res.send(JSON.stringify({user:credentials.user,hasPassword:(credentials.password&&credentials.password!=""),vpn:credentials.vpn}));
		} else {
			res.send(JSON.stringify({}));
		}
	});

	RED.httpAdmin.delete('/solace-broker/:id',function(req,res) {
		RED.nodes.deleteCredentials(req.params.id);
		res.send(200);
	});

	RED.httpAdmin.post('/solace-broker/:id',function(req,res) {
		var body = "";
		req.on('data', function(chunk) {
			body+=chunk;
		});
		req.on('end', function(){
			var newCreds = querystring.parse(body);
			var credentials = RED.nodes.getCredentials(req.params.id)||{};
			if (newCreds.user == null || newCreds.user == "") {
				delete credentials.user;
			} else {
				credentials.user = newCreds.user;
			}
			if (newCreds.password == "") {
				delete credentials.password;
			} else {
				credentials.password = newCreds.password||credentials.password;
			}
			if (newCreds.vpn == null || newCreds.vpn == "") {
				delete credentials.vpn;
			} else {
				credentials.vpn = newCreds.vpn;
			}
			RED.nodes.addCredentials(req.params.id,credentials);
			res.send(200);
		});
	});


	function SOLACEInNode(n) {

		RED.nodes.createNode(this,n);
		this.topic = n.topic;
		this.broker = n.broker;
		this.brokerConfig = RED.nodes.getNode(this.broker);
		var node = this;

		if (this.brokerConfig) {

			node.status({fill:"red",shape:"ring",text:"disconnected"});


			
			//this.myURL = this.brokerConfig.broker + ":" + this.brokerConfig.port;
			this.client = solaceClient.get((this.brokerConfig.broker + ":" + this.brokerConfig.port) , node.brokerConfig.username, node.brokerConfig.password, node.brokerConfig.vpn, node.brokerConfig.clientid  );
			//console.log(this.client);
			console.log("Created subscriber object for connection: " + this.client.ref + " instance: " + this.client[("_instances")] );
			//console.log("Instance = " + this.client[("_instances")]);
			

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
			this.error("missing broker configuration");
		}
		
		
	}



	RED.nodes.registerType("solace in",SOLACEInNode);

	SOLACEInNode.prototype.close = function() {
		if (this.client) {
			this.client.disconnect();
		}
	};


	function SOLACEOutNode(n) {

		RED.nodes.createNode(this,n);
		this.topic = n.topic;
		this.broker = n.broker;
		this.msgtype = n.msgtype;
		this.brokerConfig = RED.nodes.getNode(this.broker);
		var node = this;
		


		if (this.brokerConfig ) {

			this.status({fill:"red",shape:"ring",text:"disconnected"});
			
			/*
			console.log("Broker: " + this.brokerConfig.broker);
			console.log("Port: " + this.brokerConfig.port);
			console.log("Username: " + node.brokerConfig.username);
			console.log("Password: " + node.brokerConfig.password);
			console.log("VPN: " + node.brokerConfig.vpn);
			console.log("ClientID: " + node.brokerConfig.clientid);
			*/


			this.client = solaceClient.get((this.brokerConfig.broker + ":" + this.brokerConfig.port) , node.brokerConfig.username, node.brokerConfig.password, node.brokerConfig.vpn, node.brokerConfig.clientid  );
			console.log("Created publisher object for connection: " + this.client.ref + " instance: " + this.client[("_instances")] );
			
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
				//console.log("Message to publish from injector: topic=" + msg.topic + " payload=" + msg.payload + " local topic: " + this.topic + " local message Type: " + this.msgtype );
				if (msg != null && msg.topic != "" && this.topic == "" ) {
					this.client.publish({payload: msg.payload, topic: msg.topic, msgtype: this.msgtype});
				}
				if (msg != null && this.topic != "" ) {
					
					this.client.publish({payload: msg.payload, topic: this.topic, msgtype: this.msgtype});
				}
				if(msg == null || (msg.topic == "" && this.topic == "")) {
					console.log("Request to send a NULL message or NULL topic on session: " + this.client.ref + " object instance: " + this.client[("_instances")]);
				}
			});

		} else {
			this.error("missing broker configuration");
		}


	}

	RED.nodes.registerType("solace out",SOLACEOutNode);

	SOLACEOutNode.prototype.close = function() {
		if (this.client) {
			this.client.disconnect();
		}
	};

}
