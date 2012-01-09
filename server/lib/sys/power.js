/*

BSD LICENSED

Copyright (c) 2011, Janne Julkunen
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this 
list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, 
this list of conditions and the following disclaimer in the documentation 
and/or other materials provided with the distribution.

*Neither the name of the Enlightened Linux Solutions nor the names of its 
contributors may be used to endorse or promote products derived from this 
software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
OF THE POSSIBILITY OF SUCH DAMAGE.

*/

var debug = false;

var timer = null;

var osType = null;

var displayCtl = true;
var screenLock = true;
var shutdownCtl = true;

var currentStatus = null;

var applescript = null;

var exec = require('child_process').exec;

var update = function() {
	currentStatus.shutdown = currentStatus.shutdown - 60;

	if(currentStatus.shutdown <= 0) {
		var execute_string = 'gnome-session-quit --power-off;';

		var child = exec(execute_string);
	} else {
		timer = setTimeout(update, 60000);
	}
};

exports.setup = function(cb, os) {
	if(os == "linux") {
		var child = exec("gnome-session-quit --help", function(error, stdout, stderr) {
			if(error)
				shutdownCtl = false;

			var child = exec("gnome-screensaver-command --help", function(error, stdout, stderr) {
				if(error)
					screenLock = false;

				var child = exec("xset", function(error, stdout, stderr) {
					if(error)
						displayCtl = false;

					if((displayCtl) || (shutdownCtl)) {
						osType = "linux";
							
						currentStatus = new SystemPowerStatus(shutdownCtl, displayCtl, screenLock);
							
						cb("power", "Gnome", "System Power");
					}
				});
			});
		});
	}
};

exports.execute = function(cb, url, addr) {
	console.log("Executing power command: " + url.command);

	if(osType == "linux") {
		var execute_string = "";
		
		if((url.command == "display") && (displayCtl)) {
			if(url.arguments("state") == "on") {
				execute_string = "xset dpms force on;";
			} else if(url.arguments("state") == "off") {
				execute_string = "xset dpms force off;";
			} else if(url.arguments("state") == "lock") {
				execute_string = "gnome-screensaver-command -l;";
			}
		} else if((url.command == "shutdown") && (shutdownCtl)) {
			if(!isNaN(url.arguments("timer"))) {
				console.log("Shutdown requested after: " + url.arguments("timer"));

				currentStatus.shutdown = url.arguments("timer") - 60;

				timer = setTimeout(update, 60000);
			} else if(url.arguments("timer") == "cancel") {
				console.log("Shutdown request canceled");

				currentStatus.shutdown = "idle";

				clearTimeout(timer);
			} else {
				execute_string = 'gnome-session-quit --power-off;';
			}
		}

		if(displayCtl) {
			execute_string += "xset -q";
		} else {
			cb("power", "online", currentStatus);
	
			return;
		}

		var child = exec(execute_string, function(error, stdout, stderr) {
			if(error) {
				if(debug)
					console.log("Error: " + error);
				
				cb("power", "error", currentStatus);
			
				return;
			}

			if(stdout.indexOf("Monitor is Off") != -1)
				currentStatus.display = "off";
			else
				currentStatus.display = "on";

			cb("power", "online", currentStatus);
			
			return;
		});		
	}	
};

