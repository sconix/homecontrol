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

var osType = null;

var currentStatus = null;

// Go around OS X having no mute for input

var storedInputVolume = 0; 

var applescript = null;

var exec = require('child_process').exec;

exports.setup = function(cb, os) {
	if(os == "darwin") {
		var child = exec("osascript -e 'help'", function(error, stdout, stderr) {
			if(!error) {
				osType = "darwin";
			
				applescript = require("applescript");

				currentStatus = new SystemSoundStatus(true, true);
			
				cb("sound", "Mac OS X", "System Sound");
			}
		});				
	} else if(os == "linux") {
		var child = exec("pactl --help", function(error, stdout, stderr) {
			if(!error) {
				osType = "linux";
							
				currentStatus = new SystemSoundStatus(true, true);
							
				cb("sound", "PulseAudio", "System Sound");
			}
		});
	}
};

exports.execute = function(cb, url, addr) {
	console.log("Executing sound command: " + url.command);

	if(osType == "darwin") {
		var script_string = "";
		
		if(url.command == "input") {
			if(url.arguments("mute") == "true")
				var script_string = 'set volume input volume 0\n';
			else if(url.arguments("volume"))
				var script_string = 'set volume input volume ' + url.arguments("volume") + '\n';
			else
				var script_string = 'set volume input volume ' + storedInputVolume + '\n';
		} else if(url.command == "output") {
			var script_string = 'set volume';
			
			if(url.arguments("volume"))
				script_string = 'set volume output volume ' + url.arguments("volume");
			
			if(url.arguments("mute") == "true")
				script_string += ' with output muted\n';
			else
				script_string += ' without output muted\n';
		}
		
		script_string += 'get volume settings\n';
		
		applescript.execString(script_string, function(error, result) {
			if(error) {
				if(debug)
					console.log("Error: " + error);
			
				cb("sound", "error", currentStatus);
			
				return;
			}
			
			currentStatus.input.mute = false;
			
			currentStatus.input.volume = result[1].split(":")[1];
			
			if(currentStatus.input.volume != 0) {
				storedInputVolume = currentStatus.input.volume;
			} else {
				currentStatus.input.mute = true;
				
				currentStatus.input.volume = storedInputVolume;
			}
			
			currentStatus.output.mute = (result[3].split(":")[1] == "true");
			
			currentStatus.output.volume = result[0].split(":")[1];
			
			if(currentStatus.output.mute)
				cb("sound", "muted", currentStatus);
			else
				cb("sound", "online", currentStatus);

			return;
		});
	} else if(osType == "linux") {
		var execute_string = "";
		
		if(url.command == "input") {
			if(url.arguments("mute"))
				execute_string += __dirname + '/../../data/bin/pulseaudio-control.sh input mute ' + 
					url.arguments("mute") + ';';
			
			if(url.arguments("volume"))
				execute_string += __dirname + '/../../data/bin/pulseaudio-control.sh input volume ' + 
					url.arguments("volume") + ';';
		} else if(url.command == "output") {
			if(url.arguments("mute"))
				execute_string += __dirname + '/../../data/bin/pulseaudio-control.sh output mute ' + 
					url.arguments("mute") + ';';
			
			if(url.arguments("volume"))
				execute_string += __dirname + '/../../data/bin/pulseaudio-control.sh output volume ' + 
					url.arguments("volume") + ';';
		}

		execute_string += __dirname + '/../../data/bin/pulseaudio-control.sh status';
		
		var child = exec(execute_string, function(error, stdout, stderr) {
			if(error) {
				if(debug)
					console.log("Error: " + error);
				
				cb("sound", "error", currentStatus);
			
				return;
			}

			var status = stdout.replace("\n", "").split(",");			

			currentStatus.input.mute = (status[1] == "true");
			currentStatus.input.volume = parseInt(status[0]);
			
			currentStatus.output.mute = (status[3] == "true");
			currentStatus.output.volume = parseInt(status[2]);
			
			if(currentStatus.output.mute)
				cb("sound", "muted", currentStatus);
			else
				cb("sound", "online", currentStatus);
			
			return;
		});		
	}	
};

