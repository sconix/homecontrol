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

var currentStatus = null; 

var applescript = null;

var exec = require('child_process').exec;

exports.setup = function(cb, os) {
	if(os == "darwin") {
		var child = exec("osascript -e 'help'", function(error, stdout, stderr) {
			if(!error) {
				applescript = require("applescript");			
			
				currentStatus = new VideoPlayerStatus(true, true, true, true, false, null);		
					
				cb("quicktime", "QuickTime", "Video Player");
			}
		});
	}
};

exports.execute = function(cb, url, addr) {
	console.log("Executing quicktime command: " + url.command);

	var script_string = "";

	switch(url.command) {
		case "output/mute":
			var script_string = 'tell application "QuickTime Player" to set muted of document frontmost to ' + 
				url.arguments("state") + '\n';
			break;

		case "output/volume":
			var script_string = 'tell application "QuickTime Player" to set audio volume of document frontmost to ' + 
				(url.arguments("value") / 100) + "\n";
			break;
		
		case "playback/state":
			if(url.arguments("action") == "play")	
				var script_string = 'tell application "QuickTime Player" to play document frontmost\n';
			else if(url.arguments("action") == "pause")	
				var script_string = 'tell application "QuickTime Player" to pause document frontmost\n';
			break;

		case "playback/skip":
			break;

		case "playback/seek":
			if(url.arguments("action") == "fwd")
				script_string = 'tell application "QuickTime Player" to step forward document frontmost\n';
			else if(url.arguments("action") == "bwd")
				script_string = 'tell application "QuickTime Player" to step backward document frontmost\n';
			else if(!isNaN(parseInt(url.arguments("position"))))
				script_string = 'tell application "QuickTime Player" to set current time of document frontmost to ' +
					parseInt(url.arguments("position")) + '\n';			
			break;

		case "viewmode/fullscreen":
			if(url.arguments("action") == "toggle") {
				script_string = 'tell application "QuickTime Player"\n';
		
				script_string += 'if presenting of document frontmost is true\n';
		
				script_string += 'set present of document frontmost to false\nelse\n';
		
				script_string += 'set present of document frontmost to true\nend if\nend tell\n';
			}
			break;
	
		default:
			break;
	}

	script_string += 'tell application "QuickTime Player" to get ' +
		'{playing, name, presenting, audio volume, muted, current time, duration} of document frontmost';

	applescript.execString(script_string, function(error, result) {
		if(error) {
			cb("quicktime", "stopped", currentStatus);
			
			return;
		}
		
		var state = "paused";
		
		if(result[0] == "true")
			state = "playing";
		
		currentStatus.current.title = result[1];

		currentStatus.mute = (result[4] == "true");
		currentStatus.volume = Math.round(result[3] * 100);

		currentStatus.position.elapsed = result[5];
		currentStatus.position.duration = result[6];
		
		currentStatus.fullscreen = (result[2] == "true");

		cb("quicktime", state, currentStatus);

		return;
	});
};

