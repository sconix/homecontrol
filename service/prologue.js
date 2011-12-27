var Foundations = IMPORTS.foundations;
var DB = Foundations.Data.DB;
var Future = Foundations.Control.Future;
var PalmCall = Foundations.Comms.PalmCall;
var AjaxCall = Foundations.Comms.AjaxCall;

if (typeof require === "undefined") {
   require = IMPORTS.require;
};

var path = "/media/cryptofs/apps/usr/palm/services/org.webosinternals.homecontrol.service/";
var upnp = require(path + "lib/upnp");

