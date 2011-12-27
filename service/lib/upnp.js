var url     = require("url");
var http    = require("http");
var dgram   = require("dgram");
var sys     = require("sys");
var events  = require("events");

// SSDP
const SSDP_PORT = 1900;
const BROADCAST_ADDR = "239.255.255.250";
const SSDP_MSEARCH   = "M-SEARCH * HTTP/1.1\r\nHost:"+BROADCAST_ADDR+":"+SSDP_PORT+"\r\nST:%st\r\nMan:\"ssdp:discover\"\r\nMX:3\r\n\r\n";
const SSDP_ALIVE = 'ssdp:alive';
const SSDP_BYEBYE = 'ssdp:byebye';
const SSDP_UPDATE = 'ssdp:update';
const SSDP_ALL = 'ssdp:all';

// Map SSDP notification sub type to emitted events 
const UPNP_NTS_EVENTS = {
  'ssdp:alive': 'DeviceAvailable',
  'ssdp:byebye': 'DeviceUnavailable',
  'ssdp:update': 'DeviceUpdate'
};

var debug;
/*if (process.env.NODE_DEBUG && /upnp/.test(process.env.NODE_DEBUG)) {
  debug = function(x) { console.error('UPNP: %s', x); };

} else {
  debug = function() { };
}*/
debug = function(x) { console.log("UPNP: %s", x); };

function openPalmFirewall(port, callback) {
    var Foundations = IMPORTS.foundations;
    var Future = Foundations.Control.Future;
    var PalmCall = Foundations.Comms.PalmCall;

    var f = PalmCall.call("palm://com.palm.firewall", "control",
       {"subscribe": true, "rules":[{"protocol":"UDP","destinationPort":port}]});
    
    f.then(function(future) {
        callback(future.results);
    });
}

function ControlPoint() {
  events.EventEmitter.call(this);
  this.server = dgram.createSocket('udp4');
  //this.server.addMembership(BROADCAST_ADDR);
  this.server.setBroadcast(true);
  this.server.setTTL(5);
  var self = this;
  this.server.on('message', function(msg, rinfo) {self.onRequestMessage(msg, rinfo);});
  this.server.bind(SSDP_PORT);
  
  this.interval = 10;
}
sys.inherits(ControlPoint, events.EventEmitter);
exports.ControlPoint = ControlPoint;

/**
 * Message handler for HTTPU request.
 */
ControlPoint.prototype.onRequestMessage = function(msg, rinfo) {
  /*var message = msg.toString();
  var method = message.match(/SSDP(.+?)* HTTP\/1.1/i)[1].trim();
  var location = message.match(/location:(.+?)\r\n/i)[1].trim();
  var nts = message.match(/nts:(.+?)\r\n/i)[1].trim();
  var nt = message.match(/nt:(.+?)\r\n/i)[1].trim();
  var usn = message.match(/usn:(.+?)\r\n/i)[1].trim();
  
  var headers = {
    "nt": nt,
    "nts": nts,
    "usn": usn,
    "location": location
  };
  
  switch (method) {
      case 'NOTIFY':
        debug('NOTIFY ' + nts + ' NT=' + nt + ' USN=' + usn);
        var event = UPNP_NTS_EVENTS[nts];
        if (event) {
          this.emit(event, headers);
        }
        break;
    };*/
};

/**
 * Message handler for HTTPU response.
 */
ControlPoint.prototype.onResponseMessage = function(msg, rinfo){
  var message = msg.toString();
  debug("MESSAGE: " + message);
  
  if (message.toLowerCase().indexOf("location:") !== -1) {
      var location = message.match(/location:(.+?)\r\n/i)[1].trim();

      var headers = {
        "location": location
      };
      
      debug("Location at: " + location);
      //debug('RESPONSE ST=' + res.headers.st + ' USN=' + res.headers.usn);
      this.emit('DeviceFound', headers);
  }
}

/**
 * Send an SSDP search request.
 * 
 * Listen for the <code>DeviceFound</code> event to catch found devices or services.
 * 
 * @param String st
 *  The search target for the request (optional, defaults to "ssdp:all"). 
 */
ControlPoint.prototype.search = function(st) {
  if (typeof st !== 'string') {
    st = SSDP_ALL;
  }
  debug("Discovering for " + st);
  var message = new Buffer(SSDP_MSEARCH.replace('%st', st), "ascii");
  var client = dgram.createSocket("udp4");
  client.bind(); // So that we get a port so we can listen before sending
  // Set a server to listen for responses
  var server = dgram.createSocket('udp4');
  var self = this;
  server.on('message', function(msg, rinfo) {self.onResponseMessage(msg, rinfo);});
  server.bind(client.address().port);

  var continueProc = function() {

      self.sl = setInterval(function() {
          self.interval--;
          debug("Timeout! Trying again");
          
          client.send(message, 0, message.length, SSDP_PORT, BROADCAST_ADDR);
          
          if (self.interval <= 0) {
            debug("Clearing interval");
            clearInterval(self.sl);
            self.interval = 10;
            
            client.close();
            server.close();
          }
        }, 1000);
  };

  client.send(message, 0, message.length, SSDP_PORT, "127.0.0.1");
  var port = client.address().port;
  openPalmFirewall(port, continueProc);

  // Broadcast request
  //this.server.send(message, 0, message.length, SSDP_PORT, BROADCAST_ADDR);
  //debug('REQUEST SEARCH ' + st);
  //client.close();

  // MX is set to 3, wait for 1 additional sec. before closing the server
  /*setTimeout(function(){
    server.close();
  }, 4000);*/
}

/**
 * Terminates this ControlPoint.
 */
ControlPoint.prototype.close = function() {
  this.server.close();
  http.parsers.free(this.requestParser);
  http.parsers.free(this.responseParser);
}

/* TODO Move these stuff to a separated module/project */

//some const strings - dont change
const GW_ST    = "urn:schemas-upnp-org:device:InternetGatewayDevice:1";
const WANIP = "urn:schemas-upnp-org:service:WANIPConnection:1";
const OK    = "HTTP/1.1 200 OK";
const SOAP_ENV_PRE = "<?xml version=\"1.0\"?>\n<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\"><s:Body>";
const SOAP_ENV_POST = "</s:Body></s:Envelope>";

function searchGateway(timeout, callback) {
  var clients = {};
  var t;
  
  if (timeout) {
    t = setTimeout(function() {
      callback(new Error("searchGateway() timed out"));
    }, timeout);
  }
  
  var cp = new ControlPoint();
  cp.on('DeviceFound', function(headers) {
    var l = url.parse(headers.location);
    l.port = l.port || (l.protocol == "https:" ? 443 : 80);
    // Early return if this location is already processed 
    if (clients[l.href]) return;

    // Retrieve device/service description
    var client = clients[l.href] = http.createClient(l.port, l.hostname);
    var request = client.request("GET", l.pathname, {
      "Host": l.hostname
    });
    request.addListener('response', function (response) {
      if (response.statusCode !== 200) {
        callback(new Error("Unexpected response status code: " + response.statusCode));
      }
      var resbuf = "";
      response.setEncoding("utf8");
      response.addListener('data', function (chunk) { resbuf += chunk;});
      response.addListener("end", function() {
        resbuf = resbuf.substr(resbuf.indexOf(WANIP) + WANIP.length);
        var ipurl = resbuf.match(/<controlURL>(.+?)<\/controlURL>/i)[1].trim()
        clearTimeout(t);
        var controlUrl = url.parse(ipurl);
        controlUrl.__proto__ = l;
        console.log(controlUrl);
        callback(null, new Gateway(controlUrl.port, controlUrl.hostname, controlUrl.pathname));
      });
    });
    request.end();
  });
  
  cp.search(GW_ST);
}
exports.searchGateway = searchGateway;

function Gateway(port, host, path) {
  this.port = port;
  this.host = host;
  this.path = path;
}

// Retrieves the values of the current connection type and allowable connection types.
Gateway.prototype.GetConnectionTypeInfo = function(callback) {
  this._getSOAPResponse(
    "<u:GetConnectionTypeInfo xmlns:u=\"" + WANIP + "\">\
    </u:GetConnectionTypeInfo>",
    "GetConnectionTypeInfo",
    function(err, response) {
      if (err) return callback(err);
      var rtn = {};
      try {
        rtn['NewConnectionType'] = this._getArgFromXml(response.body, "NewConnectionType", true);
        rtn['NewPossibleConnectionTypes'] = this._getArgFromXml(response.body, "NewPossibleConnectionTypes", true);
      } catch(e) {
        return callback(e);
      }
      callback.apply(null, this._objToArgs(rtn));
    }
  );
}

Gateway.prototype.GetExternalIPAddress = function(callback) {
  this._getSOAPResponse(
    "<u:GetExternalIPAddress xmlns:u=\"" + WANIP + "\">\
    </u:GetExternalIPAddress>",
    "GetExternalIPAddress",
    function(err, response) {
      if (err) return callback(err);
      var rtn = {};
      try {
        rtn['NewExternalIPAddress'] = this._getArgFromXml(response.body, "NewExternalIPAddress", true);
      } catch(e) {
        return callback(e);
      }
      callback.apply(null, this._objToArgs(rtn));
    }
  );
}

Gateway.prototype.AddPortMapping = function(protocol, extPort, intPort, host, description, callback) {
  this._getSOAPResponse(
    "<u:AddPortMapping \
    xmlns:u=\""+WANIP+"\">\
    <NewRemoteHost></NewRemoteHost>\
    <NewExternalPort>"+extPort+"</NewExternalPort>\
    <NewProtocol>"+protocol+"</NewProtocol>\
    <NewInternalPort>"+intPort+"</NewInternalPort>\
    <NewInternalClient>"+host+"</NewInternalClient>\
    <NewEnabled>1</NewEnabled>\
    <NewPortMappingDescription>"+description+"</NewPortMappingDescription>\
    <NewLeaseDuration>0</NewLeaseDuration>\
    </u:AddPortMapping>",
    "AddPortMapping",
    function(err, response) {
      if (err) return callback(err);
    }
  );
}

Gateway.prototype._getSOAPResponse = function(soap, func, callback) {
  var self = this;
  var s = new Buffer(SOAP_ENV_PRE+soap+SOAP_ENV_POST, "utf8");
  var client = http.createClient(this.port, this.host);
  var request = client.request("POST", this.path, {
    "Host"           : this.host + (this.port != 80 ? ":" + this.port : ""),
    "SOAPACTION"     : '"' + WANIP + '#' + func + '"',
    "Content-Type"   : "text/xml",
    "Content-Length" : s.length
  });
  request.addListener('error', function(error) {
    callback.call(self, error);
  });
  request.addListener('response', function(response) {
    if (response.statusCode === 402) {
      return callback.call(self, new Error("Invalid Args"));
    } else if (response.statusCode === 501) {
      return callback.call(self, new Error("Action Failed"));      
    }
    response.body = "";
    response.setEncoding("utf8");
    response.addListener('data', function(chunk) { response.body += chunk });
    response.addListener('end', function() {
      callback.call(self, null, response);
    });
  });
  request.end(s);
}

// Formats an Object of named arguments, and returns an Array of return
// values that can be used with "callback.apply()".
Gateway.prototype._objToArgs = function(obj) {
  var wrapper;
  var rtn = [null];
  for (var i in obj) {
    if (!wrapper) {
      wrapper = new (obj[i].constructor)(obj[i]);
      wrapper[i] = obj[i];
      rtn.push(wrapper);
    } else {
      wrapper[i] = obj[i];
      rtn.push(obj[i]);
    }
  }
  return rtn;
}

Gateway.prototype._getArgFromXml = function(xml, arg, required) {
  var match = xml.match(new RegExp("<"+arg+">(.+?)<\/"+arg+">"));
  if (match) {
    return match[1];
  } else if (required) {
    throw new Error("Invalid XML: Argument '"+arg+"' not given.");
  }
}

//some const strings - dont change
const RENDERER_ST = "urn:schemas-upnp-org:device:MediaRenderer:1";
const AVTRANSPORT = "urn:schemas-upnp-org:service:AVTransport:1";

function searchRenderer(timeout, callback) {
  var clients = {};
  var t;
  
  debug("Starting searchRenderer");
  
  if (timeout) {
    t = setTimeout(function() {
      callback({"text": "Timed out", "code": -1});
    }, timeout);
  }
  
  var cp = new ControlPoint();
  cp.on('DeviceFound', function(headers) {
    var l = url.parse(headers.location);
    debug("Found device at: " + headers.location);
    l.port = l.port || (l.protocol == "https:" ? 443 : 80);
    // Early return if this location is already processed 
    if (clients[l.href]) return;

    // Retrieve device/service description
    //var client = clients[l.href] = http.createClient(l.port, l.hostname);
    var client = http.createClient(l.port, l.hostname);
    var request = client.request("GET", l.pathname, {
      "Host": l.hostname
    });
    request.addListener('response', function (response) {
      if (response.statusCode !== 200) {
        debug("Got a bad response: " + response.statusCode);
        callback({ "text": "Unexpected response status code: " + response.statusCode,
                   "code": response.statusCode
                 });
      }
      var resbuf = "";
      response.setEncoding("utf8");
      response.addListener('data', function (chunk) { resbuf += chunk; debug("DATA " + chunk); });
      response.addListener("end", function() {
        //resbuf = resbuf.substr(resbuf.indexOf(WANIP) + WANIP.length);
        var ipurl = resbuf.match(/<controlURL>(.+?)<\/controlURL>/i)[1].trim();
        var friendlyName = resbuf.match(/<friendlyName>(.+?)<\/friendlyName>/i)[1].trim();
        //clearTimeout(t);
        var controlUrl = url.parse(ipurl);
        controlUrl.__proto__ = l;
        console.log("Control URL is: ", controlUrl.href);
        callback(null, {
                    "friendlyName": friendlyName,
                    "port": controlUrl.port,
                    "hostname": controlUrl.hostname,
                    "pathName": controlUrl.pathname
                 });
      });
    });
    request.end();
  });
  
  cp.search(AVTRANSPORT);
}
exports.searchRenderer = searchRenderer;

function MediaRenderer(port, host, path, userAgent) {
  this.port = port;
  this.host = host;
  this.path = path;
  this.userAgent = userAgent;
}
exports.MediaRenderer = MediaRenderer;

MediaRenderer.prototype.issueCommand = function(cmd, callback) {
  this._getSOAPResponse(
    "<u:" + cmd + " xmlns:u=\"" + AVTRANSPORT + "\"><InstanceID>0</InstanceID><Speed>1</Speed></u:" + cmd + ">",
    AVTRANSPORT,
    cmd,
    function(err, response) {
      if (err) return callback(err);
      var rtn = {};
      try {
        //rtn['NewExternalIPAddress'] = this._getArgFromXml(response.body, "NewExternalIPAddress", true);
      } catch(e) {
        return callback(e);
      }
      callback.apply(null, this._objToArgs(rtn));
    }
  );
}

MediaRenderer.prototype.playTrack = function(callback) {
    this.issueCommand("Play", callback);
}
MediaRenderer.prototype.pauseTrack = function(callback) {
    this.issueCommand("Pause", callback);
}
MediaRenderer.prototype.stopTrack = function(callback) {
    this.issueCommand("Stop", callback);
}
MediaRenderer.prototype.nextTrack = function(callback) {
    this.issueCommand("Next", callback);
}
MediaRenderer.prototype.previousTrack = function(callback) {
    this.issueCommand("Previous", callback);
}
MediaRenderer.prototype.setMute = function(mute, callback)
{
  cmd = "SetMute";
  this._getSOAPResponse(
    "<u:" + cmd + " xmlns:u=\"" + AVTRANSPORT + "\"><InstanceID>0</InstanceID><Channel>Master</Channel><DesiredMute>" +
        mute + "</DesiredMute></u:" + cmd + ">",
    AVTRANSPORT,
    cmd,
    function(err, response) {
      if (err) return callback(err);
      var rtn = {};
      try {
        //rtn['NewExternalIPAddress'] = this._getArgFromXml(response.body, "NewExternalIPAddress", true);
      } catch(e) {
        return callback(e);
      }
      callback.apply(null, this._objToArgs(rtn));
    }
  );    
};

MediaRenderer.prototype._getSOAPResponse = function(soap, service, func, callback) {
  var self = this;
  var s = new Buffer(SOAP_ENV_PRE+soap+SOAP_ENV_POST, "utf8");
  var client = http.createClient(this.port, this.host);
  var request = client.request("POST", this.path, {
    "Host"           : this.host + (this.port != 80 ? ":" + this.port : ""),
    "SOAPACTION"     : '"' + service + '#' + func + '"',
    "Content-Type"   : "text/xml",
    "Content-Length" : s.length,
    "User-Agent"     : this.userAgent
  });
  request.addListener('error', function(error) {
    callback.call(self, error);
  });
  request.addListener('response', function(response) {
    if (response.statusCode === 402) {
      return callback.call(self, {"text": "Invalid Args"});
    } else if (response.statusCode === 501) {
      return callback.call(self, {"text": "Action Failed"});      
    }
    response.body = "";
    response.setEncoding("utf8");
    response.addListener('data', function(chunk) { response.body += chunk; debug("Received data: " + chunk); });
    response.addListener('end', function() {
      callback.call(self, null, response);
    });
  });
  request.end(s);
}

// Formats an Object of named arguments, and returns an Array of return
// values that can be used with "callback.apply()".
MediaRenderer.prototype._objToArgs = function(obj) {
  var wrapper;
  var rtn = [null];
  for (var i in obj) {
    if (!wrapper) {
      wrapper = new (obj[i].constructor)(obj[i]);
      wrapper[i] = obj[i];
      rtn.push(wrapper);
    } else {
      wrapper[i] = obj[i];
      rtn.push(obj[i]);
    }
  }
  return rtn;
}

MediaRenderer.prototype._getArgFromXml = function(xml, arg, required) {
  var match = xml.match(new RegExp("<"+arg+">(.+?)<\/"+arg+">"));
  if (match) {
    return match[1];
  } else if (required) {
    throw new Error("Invalid XML: Argument '"+arg+"' not given.");
  }
}

