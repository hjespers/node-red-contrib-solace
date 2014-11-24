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
 *  solaceConnectionPool.js
 *
 */
var util = require("util");
var settings = require(process.env.NODE_RED_HOME+"/red/red").settings;
// load the correct client libraries based on the configured debug level
if(settings.solaceLogLevel > 2 ) {
	var solacePool = require("solclientjs").debug;
} else {
	var solacePool = require("solclientjs");
}

var connections = {};

function createMap(payload) {
	var map = new solacePool.SDTMapContainer(); 
	
	try {
		var k = Object.keys(payload);
		k.forEach(function(k){
			if( typeof payload[k] == "string"){
				map.addField(k ,solacePool.SDTFieldType.STRING ,payload[k]);
			}
			if( typeof payload[k] == "number"){
				map.addField(k ,solacePool.SDTFieldType.FLOATTYPE ,payload[k]);
			}
			if( typeof payload[k] == "boolean"){
				map.addField(k ,solacePool.SDTFieldType.BOOL ,payload[k]);
			}
			if( typeof payload[k] == "object"){
				map.addField(k ,solacePool.SDTFieldType.UNKNOWN ,payload[k]);
			}
			if(settings.solaceLogLevel > 2 ) {
				util.log("[solace] key: " + k + " value: " + payload[k]);
			}
		});
	} catch(err) {
		util.log("[solace] caught error creating Map: " + err);
		return null;
	}
	return map;
}

function createStream(payload) {
	var stream = new solacePool.SDTStreamContainer(); 

	try {
		var k = Object.keys(payload);
		if(k != null) {
			k.forEach(function(k){
				if( typeof payload[k] == "string"){
					stream.addField(solacePool.SDTFieldType.STRING ,payload[k]);
				}
				if( typeof payload[k] == "number"){
					stream.addField(solacePool.SDTFieldType.FLOATTYPE ,payload[k]);
				}
				if( typeof payload[k] == "boolean"){
					stream.addField(solacePool.SDTFieldType.BOOL ,payload[k]);
				}
				if( typeof payload[k] == "object"){
					stream.addField(solacePool.SDTFieldType.UNKNOWN ,payload[k]);
				}
				if(settings.solaceLogLevel > 2 ) {
					util.log("[solace] stream key: " + k + " value: " + payload[k]);
				}
			});
		} else { // input values are in an array
			while( payload.hasNext) {
				var item = payload.getNext();
				if( typeof item == "string"){
					stream.addField(solacePool.SDTFieldType.STRING , item);
				}
				if( typeof item == "number"){
					stream.addField(solacePool.SDTFieldType.FLOATTYPE ,item);
				}
				if( typeof item == "boolean"){
					stream.addField(solacePool.SDTFieldType.BOOL , item);
				}
				if( typeof item == "object"){
					stream.addField(solacePool.SDTFieldType.UNKNOWN , item);
				}
				if(settings.solaceLogLevel > 2 ) {
					util.log("[solace] stream value: " + item);
				}
			}
		}
	} catch(err) {
		util.log("[solace] caught error creating Map: " + err);
		return null;
	}
	return stream;
}


function checkTopic(subTopic, destTopic) {
	//return true if subscribe to everything
    if (subTopic == ">") {
        return true;
    }
    if(subTopic == destTopic) {
    	//console.log("full topic matches, return true");
    	return true;
    }
    
    var p_subTopic = subTopic.split("/");
    var p_destTopic = destTopic.split("/");
    
    if(p_subTopic.length > p_destTopic.length) {
    	//console("Subscriber topic has more fields than destination, so returned false");
    	return false;
    }
    
    var matches = true;
    var p_length = p_destTopic.length;
    var s_length = p_subTopic.length;
    var i = 0;
    var indexLoc = 0;

    
    do {
    	//console.log("testing fields, loop: " + i);
    	indexLoc = 0;
    	matches = false;
    	if( i == s_length) { // more fields in dest topic with no > in the sub topic before this field
    		//console.log("more fields in dest topic with no > in the sub topic before this field, returned false")
    		return false;
    	}
    	if (p_destTopic[i] == p_subTopic[i]) {

    		matches = true;
    		//console.log("Dest and Sub match first test");

    	}else if(p_subTopic[i] == ">") {
    		//console.log("Dest and Sub match >");
    		matches = true;
    		break;
    	}
    	else if (p_subTopic[i].indexOf("*") != -1) {
    		indexLoc = p_subTopic[i].indexOf("*");
    		//console.log("Appears to be a substring topic with \* at " +  indexLoc );
    		//console.log("checking if " + p_destTopic[i].substring(0,indexLoc) + " matches " + p_subTopic[i].substring(0,indexLoc));
    		if(indexLoc == 0) {
    			//console.log("whole field is \*");
    			matches = true;
    		} 
    		if(p_destTopic[i].substring(0,indexLoc) == p_subTopic[i].substring(0,indexLoc) ) {

    			//console.log("substrings match");
    			matches = true;
    		}
    	} else if(p_subTopic[i].indexOf("*") == -1) {
    		//console.log("No \* match in field");
    		break;
    	}
    	if(i++ == p_length - 1 ) {
    		//console.log("done checking subfields, returning: " + matches);
    		break;
    	}
    } while (matches);
    
    //console.log("returning: " + matches);
    return matches;
    	
  
}


module.exports = {

	get: function(myurl, username, password, vpn, clientid ) {
		var id = "[" + (username || "") + ":" + (password || "") + "][" + (clientid || "") + "][" + (vpn || "") + "]@" + myurl;
		//var ref = "[user:" + (username || "") +  "][clientID:" + (clientid || "") + "][vpn:" + (vpn || "") + "]@" + myurl;
		

		if(settings.solaceLogLevel > 2 ) {
			 util.log("[solace] From \"settings.js\" the value of solaceReconnectTime: " + settings.solaceReconnectTime);
			 util.log("[solace] From \"settings.js\" the value of solaceReconnectTries: " + settings.solaceReconnectTries);
			 util.log("[solace] From \"settings.js\" the value of generateSequenceNumber: " + settings.generateSequenceNumber);
			 util.log("[solace] From \"settings.js\" the value of includeSenderId: " + settings.includeSenderId);
			 util.log("[solace] From \"settings.js\" the value of generateSendTimestamps: " + settings.generateSendTimestamps);
			 util.log("[solace] From \"settings.js\" the value of generateReceiveTimestamps: " + settings.generateReceiveTimestamps);
			 util.log("[solace] From \"settings.js\" the value of subscriberLocalPriority: " + settings.subscriberLocalPriority);
			 util.log("[solace] From \"settings.js\" the value of subscriberNetworkPriority: " + settings.subscriberNetworkPriority);
			 util.log("[solace] From \"settings.js\" the value of noLocal: " + settings.noLocal);
		}
		
		if (!connections[id]) {
			connections[id] = function() {
				var ref = "[user:" + (username || "") +  "][clientID:" + (clientid || "") + "][vpn:" + (vpn || "") + "]@" + myurl;
				var subscriptions = [];
				var publications = [];
				var registerStatus = [];
				var deployed = true;
				var callback;
				retryCount = settings.solaceReconnectTries || 0;
				var solaceLogLevel=settings.solaceLogLevel;

				
				var mySessionProperties = new solacePool.SessionProperties();
				mySessionProperties.reapplySubscriptions = true;
				mySessionProperties.IgnoreDuplicateSubscriptionError = true;
				mySessionProperties.userName = username;
				mySessionProperties.password = password;
				mySessionProperties.vpnName = vpn;
				mySessionProperties.url = myurl;

				if( clientid != null) {
					mySessionProperties.clientName = clientid;
				}
				
				if(settings.generateSequenceNumber != null ) {
					mySessionProperties.generateSequenceNumber  = settings.generateSequenceNumber;
				}
				
				if(settings.includeSenderId != null ) {
					mySessionProperties.includeSenderId = settings.includeSenderId;
				}
				if(settings.generateSendTimestamps != null ) {
					mySessionProperties.generateSendTimestamps = settings.generateSendTimestamps;
				}
				if(settings.generateReceiveTimestamps != null ) {
					mySessionProperties.generateReceiveTimestamps = settings.generateReceiveTimestamps;
				}
			
				if(settings.subscriberLocalPriority != null ) {
					mySessionProperties.subscriberLocalPriority = settings.subscriberLocalPriority;
				}
				
				if(settings.subscriberNetworkPriority != null ) {
					mySessionProperties.subscriberLocalPriority = settings.subscriberNetworkPriority;
				}
				
				if(settings.noLocal != null ) {
					mySessionProperties.noLocal = settings.noLocal;
				}
				
				
				// This is the main callback Method
				var messageCallback = new solacePool.MessageRxCBInfo(function(session, message) {

					var destination = message.getDestination().getName();
					
					if(settings.solaceLogLevel > 2 ) {
						util.log("[solace] Message Type: " + message.getType());
						util.log("[solace] Text message type: " + solacePool.MessageType.TEXT);
						util.log("[solace] BINARY message type: " + solacePool.MessageType.BINARY);
						util.log("[solace] MAP message type: " + solacePool.MessageType.MAP);
						util.log("[solace] STREAM message type: " + solacePool.MessageType.STREAM);
						util.log("[solace] User Data: " + message.getUserData());
					}
					
					for (var s in subscriptions) {
						if( checkTopic(subscriptions[s].topic, destination)) {
							//subscriptions[s].callback(destination, "Binary:" + message.getBinaryAttachment() + "ASCII:" + message.getXmlContent(), "UNKNOWN");
							
							if(message.getType() === solacePool.MessageType.TEXT) {
								subscriptions[s].callback(destination, message.getSdtContainer().getValue(), message.getUserData() || message.getXmlMetadata() || "TEXT");
								//subscriptions[s].callback(destination, message.getSdtContainer().getValue(), message.getUserData());
							} else
							//Check if the message was sent as XML content
							if(message.getType() === solacePool.MessageType.BINARY && (message.getXmlContent() != null || message.getUserData() == "XML" || message.getUserData() == "TEXT" || message.getXmlMetadata() == "TEXT" || message.getXmlMetadata() == "XML" ) ) {
								subscriptions[s].callback(destination, message.getXmlContent(), message.getUserData() || message.getXmlMetadata() || "TEXT");
							} else
							if(message.getType() === solacePool.MessageType.BINARY && message.getUserData() == "BINARY") {
								subscriptions[s].callback(destination, message.getBinaryAttachment(), message.getUserData() || "BINARY");
							} else
							if(message.getType() === solacePool.MessageType.BINARY && message.getUserData() == null && message.getXmlMetadata() == null && message.getXmlContent() == null) {
								subscriptions[s].callback(destination, message.getBinaryAttachment(), "BINARY");
							} else
							
							if(message.getType() === solacePool.MessageType.BINARY && message.getUserData() == null && message.getBinaryAttachment() == null && message.getXmlContent() == null) {
								subscriptions[s].callback(destination, message.getXmlContent(), "BINARY");
							}
							
							if(message.getType() === solacePool.MessageType.MAP) {
								var tempMsg = {};
								var map = message.getSdtContainer().getValue();
								var allKeys = map.getKeys();
								for (var i = 0; i < allKeys.length; i++) {
									var stdField = map.getField(allKeys[i]);
									if(settings.solaceLogLevel > 2 ) {
										util.log("[solace] map message key: " + allKeys[i] + " value: " + stdField.getValue());
									}
									tempMsg[allKeys[i]] = stdField.getValue();
								}
								subscriptions[s].callback(destination, tempMsg, message.getUserData() || "MAP" );
							}
							if(message.getType() === solacePool.MessageType.STREAM ) {
								var tempMsg = [];
								var count = 0;
								var stream = message.getSdtContainer().getValue();
								while(stream.hasNext()) {
									tempMsg[count] = stream.getNext().getValue();
									if(settings.solaceLogLevel > 2 ) {
										util.log("[solace] stream value: " + tempMsg[count]);
									}
									count++;
								}
								subscriptions[s].callback(destination, tempMsg, message.getUserData() || "STREAM" );
							}
						}
					}
				}, this);

				var eventCallback = new solacePool.SessionEventCBInfo(function(session, event) {
					
					if(settings.solaceLogLevel > 2 ) {
						util.log('[solace] received session event: ' + event.toString());
					}

					if (event.sessionEventCode === solacePool.SessionEventCode.UP_NOTICE) {
						retryCount = settings.solaceReconnectTries || 0;
						
						util.log('[solace] session connected: ' + ref);
						
						for (var r in registerStatus) {
							registerStatus[r].statusCallback("connected");

						}
						
						for (var s in subscriptions) {
							var topic = subscriptions[s].topic;
							var callback = subscriptions[s].callback;
							var corrID = subscriptions[s].corrID;
							var subTopic = solacePool.SolclientFactory.createTopic(topic);
							var requestConfirmation = true;
							try {
								mySession.subscribe(subTopic, requestConfirmation, corrID);
							} catch(e){
								util.log('[solace] error subscribing to topic (' + subTopic + '): ' + e);
							}
						}
						
						//publish cached messages that we are not also subscribing to
						for (var p in publications) {
							for( s in subscriptions) {
								if(!(checkTopic(subscriptions[s].topic, publications[p].topic))) {
									var topic = publications[p].topic;
									var payload = publications[p].payload;
									var msgtype = publications[p].msgtype;
									var pubTopic = solacePool.SolclientFactory.createTopic(topic);
									var message = solacePool.SolclientFactory.createMessage();

									message.setDestination(pubTopic);
									if (msgtype == "TEXT" || msgtype == "XML") {
										message.setXmlMetadata(msgtype);
										message.setUserData(msgtype);
										if ( typeof(payload) !== 'string') {
											//console.log('publishing non-string payload, stringifying first...');
											message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.STRING, JSON.stringify(payload)));
										} else {
											message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.STRING, payload));
										}
									}
									if (msgtype == "BINARY") {
										message.setUserData(msgtype);
										if ( typeof(payload) !== 'string') {
											util.log("[solace] error creating BINARY payload, data not formatted as a string (i.e. octet-stream)");
										} else {
											message.setBinaryAttachment(payload);
										}
									}
									if (msgtype == "MAP") {
										message.setUserData(msgtype);
										var map = createMap(payload);
										message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.MAP, map));
									}
									if (msgtype == "STREAM") {
										message.setUserData(msgtype);
										var stream = createStream(payload);
										message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.STREAM, stream));
									}
									// now send message to solace
									try {
										mySession.send(message);
									} catch (e) {
										util.log('[solace] error sending message: ' + e);
									}
								}
							}
						}
					}
					
					if (event.sessionEventCode === solacePool.SessionEventCode.DISCONNECTED || event.sessionEventCode === solacePool.SessionEventCode.DOWN_ERROR) {
						
						if(settings.solaceLogLevel > 2 ) {
							util.log('[solace] session disconnect event received: ' + event.toString());
						} else {
							util.log('[solace] session disconnect event received');
						}

						for (var r in registerStatus) {
							registerStatus[r].statusCallback("disconnected");

						}
						
						if((retryCount > 0 && deployed) || (settings.solaceReconnectTries == 0 && deployed))
						{
							if(settings.solaceReconnectTries == 0){
								util.log("[solace] retry attempts left = " + "infinite" + " for session: " + ref);
							} else {
								util.log("[solace] retry attempts left = " + retryCount + " for session: " + ref);
							}
	                        setTimeout(function() {
	                            try {
									mySession.connect();
	                            } catch (e) {
	                            	util.log('[solace] error connecting session: ' + e);
	                            }
	                            retryCount = retryCount - 1;
	                        }, settings.solaceReconnectTime||5000);	                      
						}
					}
					
					if (event.sessionEventCode === solacePool.SessionEventCode.SUBSCRIPTION_OK) {
						//publish messages that were cached while waiting for the connection that we are also subscribing to, but only after the subscription is again established
						for (var p in publications) {
							if(checkTopic(event.correlationKey, publications[p].topic)) {
								var topic = publications[p].topic;
								var payload = publications[p].payload;
								var msgtype = publications[p].msgtype;
								var pubTopic = solacePool.SolclientFactory.createTopic(topic);
								var message = solacePool.SolclientFactory.createMessage();
								
								message.setDestination(pubTopic);
								if (msgtype == "TEXT" || msgtype == "XML") {
									message.setXmlMetadata(msgtype);
									message.setUserData(msgtype);
									message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.STRING, payload));
									if ( typeof(payload) !== 'string') {
										message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.STRING, JSON.stringify(payload)));
									} else {
										message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.STRING, payload));
									}
								}
								if (msgtype == "BINARY") {
									message.setUserData(msgtype);
									if ( typeof(payload) !== 'string') {
										util.log("[solace] error creating BINARY payload, data not formatted as a string (i.e. octet-stream)");
									} else {
										message.setBinaryAttachment(payload);
									}
								}
								if (msgtype == "MAP") {
									message.setUserData(msgtype);
									var map = createMap(payload);
									message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.MAP, map));
								}
								if (msgtype == "STREAM") {
									message.setUserData(msgtype);
									var stream = createStream(payload);
									message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.STREAM, stream));
								}
								try {
									mySession.send(message);
								} catch (e) {
									util.log('[solace] error sending message: ' + e);
								}
							}
						}	
					}
				}, this);

				try {
					var mySession = solacePool.SolclientFactory.createSession(mySessionProperties, messageCallback,eventCallback);
				} catch(e) {
					util.log('[solace] error creating session: ' + e);
				}
				

				var obj = {
					_instances: 0,

					publish: function(msg) {
						try {
							if (mySession.getSessionState() ==  solacePool.SessionState.CONNECTED) {
								var sendtopic = solacePool.SolclientFactory.createTopic(msg.topic);
								var message = solacePool.SolclientFactory.createMessage();
								message.setDestination(sendtopic);
								if (msg.msgtype == "TEXT" || msg.msgtype == "XML") {
									message.setXmlMetadata(msg.msgtype);
									message.setUserData(msg.msgtype);
									if ( typeof(msg.payload) !== 'string') {
										//console.log('publishing non-string payload, stringifying first...');
										message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.STRING, JSON.stringify(msg.payload)));
									} else {
										message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.STRING, msg.payload));
									}
									mySession.send(message);
								}
								if (msg.msgtype == "BINARY") {
									message.setUserData(msg.msgtype);
									if ( typeof(msg.payload) !== 'string') {
										util.log("[solace] error creating BINARY payload, data not formatted as a string (i.e. octet-stream)");
									} else {
										message.setBinaryAttachment(msg.payload);
									}
									mySession.send(message);
								}
								if (msg.msgtype == "MAP") {
									
									message.setUserData(msg.msgtype);
									
									var map = createMap(msg.payload);
									
									if(map != null) {
										message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.MAP, map));
										mySession.send(message);
									} else {
										util.log("[solace] error creating MAP payload, did you provide a strucured object payload?");
									}
								}
								if (msg.msgtype == "STREAM") {

									message.setUserData(msg.msgtype);
									var stream = createStream(msg.payload);

									if ( stream != null) {
										message.setSdtContainer(solacePool.SDTField.create(solacePool.SDTFieldType.STREAM, stream));
										mySession.send(message);
									} else {
										util.log("[solace] error creating STREAM payload, did you provide a strucured object or array payload?");
									}
								}

							} else {
								publications.push({topic: msg.topic, payload: msg.payload, msgtype: msg.msgtype});
							}
							//console.log("Publishing on topic: " + msg.topic);
						} catch(e) {
							util.log('[solace] publish error: ' + e);
						}
					},

					connect: function () {
						try{
							if( mySession.getSessionState() != solacePool.SessionState.CONNECTED && mySession.getSessionState() != solacePool.SessionState.CONNECTING) {
								if (settings.solaceLogLevel != null) {
									var factoryProps = new solacePool.SolclientFactoryProperties();
									factoryProps.logLevel = settings.solaceLogLevel;
									solacePool.SolclientFactory.init(factoryProps);
									//console.log("Solace Log Level = " +solacePool.SolclientFactory.getLogLevel());
									mySession.connect();
								} else {
									mySession.connect();
								}
							}
						} catch(e) {
							util.log('[solace] connect error: ' + e);
						}
					},

					subscribe: function (topic, callback) {

						subscriptions.push({topic: topic, callback: callback, corrID: topic});
						//subscriptions.push({topic: topic, callback: callback});
						//console.log("Pushed topic: " + topic);

						if( mySession.getSessionState() == solacePool.SessionState.CONNECTED ) {
							try {
								var subTopic = solacePool.SolclientFactory.createTopic(topic);
								var requestConfirmation = true;

								mySession.subscribe(subTopic, requestConfirmation, topic);
							} catch(e) {
								util.log('[solace] subscribe error: ' + e);
							}
						}
						
					},

					disconnect: function() {
						this._instances -= 1;
						//console.log("Instances: " + this._instances);
						if (this._instances == 0) {
							//mySession.disconnect();
							mySession.dispose();
							delete connections[id];
							//Need to check if the session was kill because of deploy or the reconnect logic starts and screws up and throws Red exception
							deployed = false;
							util.log("[solace] session disconnected");
						}
					},
					
					registerStatus: function(statusCallback) {
						registerStatus.push({statusCallback: statusCallback});
					},
					
					ref: ref
				};
				return obj;
			}();

		}
		connections[id]._instances +=1;
		return connections[id];
	}

}

