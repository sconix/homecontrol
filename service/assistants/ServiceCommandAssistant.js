/**
 * DiscoverAssistant
 *
 * Arguments:
 *  * timeout - Timeout in milliseconds
 *
 */
var DiscoverAssistant = function(future)
{
    
};

DiscoverAssistant.prototype.run = function(future, subscription)
{
    var args = this.controller.args;
    var results = new Array();
    
    this.errorHandle = function(err) {
        var stack = new Error().stack;
        console.log("Uncaught Exception: " + err + " Stack: " + stack);
    };
    process.on("uncaughtException", this.errorHandle);
    
    var callback = function(error, info) {
            var subFuture = subscription.get();
            if (error !== null) {
                console.log("Error in discovery");
                subFuture.result = {
                    returnValue: true,
                    devices: results,
                    errorObj: error
                };
            } else {
                console.log("Discovered a device");
                results.push(info);
                subFuture.result = {
                    returnValue: true,
                    devices: results
                };
            }
        };
    future.result = { returnValue: true, devices: null };

    console.log("Starting discovery process");
    upnp.searchRenderer(args.timeout, callback);
};


/**
 * CommandAssistant
 *
 * Arguments:
 *  * command - command to execute
 *  * port - Remote port
 *  * host - Remote host
 *  * path - Remote path
 *  * userAgent - User agent to identify as
 *
 */
var CommandAssistant = function(future)
{
    
};

CommandAssistant.prototype.run = function(future, subscription)
{
    var args = this.controller.args;

    this.errorHandle = function(err) {
        var stack = new Error().stack;
        console.log("Uncaught Exception: " + err + " Stack: " + stack);
    };
    process.on("uncaughtException", this.errorHandle);

    var callback = function(error, info) {
            var f = subscription.get();
            if (error !== null) {
                f.result = {returnValue: false};
            } else {
                f.result = {returnValue: true};
            }
        };
    
    future.result = {subscribed: true, returnValue: true};
    
    console.log("Conecting to device: " + args.host + ":" + args.port + args.path);
    var renderer = new upnp.MediaRenderer(args.port, args.host, args.path, args.userAgent);
    
    switch (args.command) {
        case "play":
            renderer.playTrack(callback);
            break;
        case "pause":
            renderer.pauseTrack(callback);
            break;
        case "stop":
            renderer.stopTrack(callback);
            break;
        case "nextTrack":
            renderer.nextTrack(callback);
            break;
        case "previousTrack":
            renderer.previousTrack(callback);
            break;
        case "setMute":
            renderer.setMute(1, callback);
            break;
        case "setUnMute":
            renderer.setMute(0, callback);
            break;
        case "getTrackPos":
        case "setTrackPos":
        case "getVolume":
        case "setVolume":
        default:
            subscription.get().result = { returnValue: false, errorCode: "EBADCOMMAND", errorText: "Invalid Command" };
            break;
    }
};