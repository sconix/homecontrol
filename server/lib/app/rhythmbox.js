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

var exec = require('child_process').exec;

exports.setup = function(cb, os) {
	if(os == "linux") {
		var child = exec("rhythmbox-client --help", function(error, stdout, stderr) {				
			if(!error) {
				currentStatus = new MusicPlayerStatus(true, false, true, false, false, null);

				cb("rhythmbox", "Rhythmbox", "Music Player");
			}
		});
	}
};

exports.execute = function(cb, url, addr) {
	console.log("Executing rhythmbox command: " + url.command);

	if(url.command != "close")
		var execute_string = "pgrep rhythmbox";
	else
		var execute_string = "rhythmbox-client --quit";

	var child = exec(execute_string, function(error, stdout, stderr) {
		if((stdout.length > 0) || (url.command == "start")) {
			var execute_string = "";
		
			switch(url.command) {
				case "output/mute":
					if(url.arguments("state") == "true") {
						var execute_string = "rhythmbox-client --no-start --mute;";
					} else {
						// Go around a bug in rhythmbox-client by setting volume
			
						var execute_string = "rhythmbox-client --no-start --unmute; rhythmbox-client --set-volume " + 
							(currentStatus.volume / 100) + ";";
					}
					break;

				case "output/volume":
					var execute_string = "rhythmbox-client --no-start --unmute; rhythmbox-client --set-volume " + 
						(url.arguments("level") / 100) + ";";
					break;

				case "playback/state":
					var execute_string = "rhythmbox-client --no-start --" + url.arguments("action") + ";";
					break;

				case "playback/skip":
					if(url.arguments("action") == "prev")
						var execute_string = "rhythmbox-client --no-start --previous;";
					else if(url.arguments("action") == "next")
						var execute_string = "rhythmbox-client --no-start --next;";
					break;

				case "playback/seek":
					break;

				default:
					break;
			}

			execute_string += "rhythmbox-client --no-start --print-volume;";
		
			execute_string += "rhythmbox-client --no-start --print-playing-format='%ta;%at;%tt;%td;%te'";
		
			var child = exec(execute_string, function(error, stdout, stderr) {
				if(error) {
					cb("rhythmbox", "error", currentStatus);
					
					return;
				}

				var output = stdout.split("\n");

				if(output.length == 0) {
					cb("rhythmbox", "closed", currentStatus);
					
					return;
				}

				if(output[0].slice(0, 17) == "Playback is muted") {
					currentStatus.mute = true;
				
					currentStatus.volume = Math.round(output[1].slice(19, 27) * 100);
				
					var status = output[2].split(";");
				} else {
					currentStatus.mute = false;
				
					currentStatus.volume = Math.round(output[0].slice(19, 27) * 100);
				
					var status = output[1].split(";");
				}
			
				if(status[0].slice(0, 11) == "Not playing") {
					cb("rhythmbox", "stopped", currentStatus);
				} else {
					currentStatus.current.artist = escape(status[0]);
					currentStatus.current.album = escape(status[1]);
					currentStatus.current.title = escape(status[2]);

					var execute_string = "dbus-send --print-reply --dest=org.gnome.Rhythmbox /org/gnome/Rhythmbox/Player org.gnome.Rhythmbox.Player.getPlaying";

					var child = exec(execute_string, function(error, stdout, stderr) {
						var playing = stdout.replace(/\n/g, "").split(" ");

						if((error) || (!playing) || (playing.length < 10)) {
							if(url.arguments("action") == "play")
								cb("rhythmbox", "playing", currentStatus);
							else
								cb("rhythmbox", "paused", currentStatus);
						
							return;
						}

						if(playing[9] == "true")
							cb("rhythmbox", "playing", currentStatus);						
						else
							cb("rhythmbox", "paused", currentStatus);
					});
				}
				
				return;
			});
		} else {
			cb("rhythmbox", "closed", currentStatus);
			
			return;
		}
	});
};

