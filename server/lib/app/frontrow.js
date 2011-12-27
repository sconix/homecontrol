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

* Neither the name of the Enlightened Linux Solutions nor the names of its 
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

var currentStatus = null;

var applescript = null;

var exec = require('child_process').exec;

exports.setup = function(cb, os) {
	if(os == "darwin") {
		var child = exec("osascript -e 'help'", function(error, stdout, stderr) {
			if(!error) {
				applescript = require("applescript");
				
				currentStatus = new MediaCenterStatus();
				
				cb("frontrow", "Front Row", "Media Center");
			}
		});
	}
};

exports.execute = function(cb, url, addr) {
	console.log("Executing frontrow command: " + url.command);
	
	var script_string = "";
	
	if(url.command == "start") {
		script_string = 'tell application "System Events" to key code 53 using command down\n';	
	} else if(url.command == "close") {
		script_string = 'tell application "System Events" to key code 53 using {command down, option down}\n';	
	} else if(url.command == "left") {
		script_string = 'tell application "System Events" to keystroke (ASCII character 28)\n';
	} else if(url.command == "right") {
		script_string = 'tell application "System Events" to keystroke (ASCII character 29)\n';
	} else if(url.command == "up") {
		script_string = 'tell application "System Events" to keystroke (ASCII character 30)\n';
	} else if(url.command == "down") {
		script_string = 'tell application "System Events" to keystroke (ASCII character 31)\n';
	} else if(url.command == "select") {
		script_string = 'tell application "System Events" to keystroke (ASCII character 32)\n';
	} else if(url.command == "back") {
		script_string = 'tell application "System Events" to key code 53\n';
	} else if(url.command == "play-pause") {
		script_string = 'tell application "System Events" to keystroke (ASCII character 32)\n';
	} else if(url.command == "seek") {
		if(url.arguments("action") == "bwd")
			script_string = 'tell application "System Events" to keystroke (ASCII character 28)\n';
		else if(url.arguments("action") == "fwd")
			script_string = 'tell application "System Events" to keystroke (ASCII character 29)\n';
	} else if(url.command == "prev") {
		script_string = 'tell application "System Events" to keystroke (ASCII character 28) using command down\n';
	} else if(url.command == "next") {
		script_string = 'tell application "System Events" to keystroke (ASCII character 29) using command down\n';
	} else if(url.command == "mute") {
	} else if(url.command == "volume") {
	}
	
	applescript.execString(script_string, function(error, info) {
		if(error) {
			cb("frontrow", "error", currentStatus);
			
			return;
		}
		
		cb("frontrow", "online", currentStatus);

		return;
	});
};

