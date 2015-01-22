node-red-contrib-solace
========================

Node-Red (http://nodered.org) nodes for communicating with a Solace Systems message router (see http://www.solacesystems.com).

#Install

If you haven't already done so, install node-red

    $ git clone git@github.com:node-red/node-red.git

Install the pre-requisite modules. From the top-level directory of Node-RED, run:

    $ npm install

Then you can install the Solace node-red module 

    $ npm install node-red-contrib-solace

Edit your settings.js (also in the node-red top level directory) and add the following Solace configuration parameters anywhere after module.exports = {

    // Retry time in milliseconds for Solace connections
    solaceReconnectTries: 0,
    solaceReconnectTime:  15000,

    // Solace parameters
    solaceLogLevel: 2,   //FATAL=0, ERROR=1, WARN=2, INFO=3, DEBUG=4, TRACE=5
    generateSequenceNumber: false,
    includeSenderId: false,
    generateSendTimestamps: false,
    generateReceiveTimestamps: false,
    subscriberLocalPriority: 1,
    subscriberNetworkPriority: 1,
    noLocal: false,

Start node-red as normal

    node red -v

Point your browser to http://localhost:1880

You should see orange solace input and output nodes in the pallet on the left side of the screen.
<ul>
    <li>input <img src="https://github.com/hjespers/node-red-contrib-solace/blob/master/images/solace_input_node.png"></li>
    <li>output <img src="https://github.com/hjespers/node-red-contrib-solace/blob/master/images/solace_output_node.png"></li>
</ul>


Drag either solace node to the canvas and double click to configure the topic, broker, and message type

<img src="https://github.com/hjespers/node-red-contrib-solace/blob/master/images/edit_solace_node.png">


Click on the pencil icon to the right of the broker selection box to configure a solace broker connection if one does not already exist.

<img src="https://github.com/hjespers/node-red-contrib-solace/blob/master/images/edit_solace_broker_config.png">

Publish and subscribe just as you would with the mqtt node with some small differences namely:
<ul>
    <li>the leading "/" of a topic name is implicit and not required</li>
    <li>the solace wildcard characters are "*" and ">" rather than MQTT wildcards "+" and "#" (respectively)</li>
    <li>the solace web streaming transport works over http(s)
</ul>

A sample flow with wildcard subscriptions is provided in the flows subdirectory

<img src="https://github.com/hjespers/node-red-contrib-solace/blob/master/flows/sample_solace_pubsub_flow.png">

#Usage

You will need access to a Solace Systems message router, which acts as a multi-protocol message broker.

#Test Sandbox

You can try it live on the Solace Systems public message router available at:

    URL: http://69.20.234.126:8134
    Username: demouser
    Password: password
    VPN: demo

# Authors

Hans Jespersen -  https://github.com/hjespers and Heinz Schaffner 

#Feedback and Support

For more information, feedback, or community support email demosupport@solacesystems.com
