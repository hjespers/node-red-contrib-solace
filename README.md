node-red-contrib-solace
========================

Node-Red (http://nodered.org) nodes for communicating with a Solace Systems message router (see http://www.solacesystems.com).

#Install

If you haven't already done so, install node-red and change cd to the node-red root directory

    npm install node-red
    cd node_modules/node-red

Run the following command in the root directory of your node-red install

    npm install node-red-contrib-solace

Edit your settings.js (also in the node-red root directory) and add the following Solace configuration parameters anywhere after module.exports = {

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

Drag either solace node to the canvas and click to configure a solace broker connection.

Publish and subscribe just as you would with the mqtt node.




#Usage

You will need access to a Solace Systems message router (URL, Login, Password, and Message VPN).


# Authors

Hans Jespersen -  https://github.com/hjespers and Heinz Schaffner 

#Feedback and Support

For more information, feedback, or community support email demos@solacesystems.com
