node-red-contrib-solace
========================

Node-Red (http://nodered.org) nodes for communicating with a Solace Systems message router (see http://www.solacesystems.com).

#Install

Run the following command in the root directory of your Node-RED install

    npm install node-red-contrib-solace

Edit your settings.js and add the following

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

#Usage

You will need access to a Solace Systems message router (URL, Login, Password, and Message VPN).


# Authors

Hans Jespersen -  https://github.com/hjespers and Heinz Schaffner 

#Feedback and Support

For more information, feedback, or community support email demos@solacesystems.com
