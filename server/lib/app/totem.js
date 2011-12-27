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

// Go around Totem not having mute functionality

var storedPlaybackVolume = 0; 

var exec = require('child_process').exec;

exports.setup = function(cb, os) {
	if(os == "linux") {
		var child = exec("totem --help", function(error, stdout, stderr) {
			if(!error) {
				currentStatus = new VideoPlayerStatus(true, true, true, false, false, null);		

				cb("totem", "Totem", "Video Player");
			}
		});
	}
};

exports.execute = function(cb, url, addr) {
	console.log("Executing totem command: " + url.command);

	if(url.command == "start")
		var execute_string = "totem;";
	else if(url.command != "close")
		var execute_string = "pgrep totem";
	else
		var execute_string = "totem --quit";
	
	var child = exec(execute_string, function(error, stdout, stderr) {
		if((stdout.length > 0) || (url.command == "start")) {
			var execute_string = "";

			switch(url.command) {
				case "output/mute":
					execute_string = "totem --mute;";
					break;

				case "output/volume":
					if(url.arguments("value") != undefined) {
						execute_string = "dbus-send --print-reply --dest=org.mpris.Totem /Player org.freedesktop.MediaPlayer.VolumeSet int32:" + 
							url.arguments("value") + ";";
					} else if(url.arguments("action") != undefined) {
						execute_string = "totem --volume-" + url.arguments("action") + ";";
					}
					break;
				
				case "playback/state":
					if(url.arguments("action") == "play")	
						execute_string = "totem --play;";
					else if(url.arguments("action") == "pause")	
						execute_string = "totem --pause;";
					else if(url.arguments("action") == "toggle")	
						execute_string = "totem --play-pause;";
					break;

				case "playback/skip":
					if(url.arguments("action") == "prev")
						execute_string = "totem --previous;";
					else if(url.arguments("action") == "next")
						execute_string = "totem --next;";
					break;

				case "playback/seek":
					execute_string = "totem --seek-" + url.arguments("action") + ";";
					break;

				case "viewmode/fullscreen":
					if(url.arguments("action") == "toggle")				
						execute_string = "totem --fullscreen;";
					break;
			
				default:
					break;
			}

			var child = exec(execute_string, function(error, stdout, stderr) {
				if(error) {
					currentStatus.sendStatus(req, res, "error");
					
					return;
				}
				
				var execute_string = "dbus-send --print-reply --dest=org.mpris.Totem /Player org.freedesktop.MediaPlayer.GetStatus;" +
					"dbus-send --print-reply --dest=org.mpris.Totem /Player org.freedesktop.MediaPlayer.VolumeGet;" +
					"dbus-send --print-reply --dest=org.mpris.Totem /TrackList org.freedesktop.MediaPlayer.GetCurrentTrack";

				var child = exec(execute_string, function(error, stdout, stderr) {
					var status = stdout.replace(/\n/g, " ").split(" ");
				
					if(debug)
						console.log("Output: " + stdout);
				
					if((error) || (!status) || (status.length < 70)) {
						// If no dbus-send or it fails then we have limited information...
					
						delete currentStatus.mute;
						delete currentStatus.volume;
						delete currentStatus.current;						
					
						cb("totem", "running", currentStatus);
				
						return;
					}

					// If plugin was turned on make sure we are good to continue...
				
					if(currentStatus.mute == undefined)
						currentStatus.mute = false;
					
					if(currentStatus.volume == undefined)
						currentStatus.volume = 0;
					
					if(currentStatus.current == undefined)
						 currentStatus.current = {};

					if(status[57] == 0) {
						currentStatus.mute = true;
					} else if(status[57] > 0) {
						storedPlaybackVolume = status[57];

						currentStatus.mute = false;
						currentStatus.volume = status[57];
					} else {
						currentStatus.mute = true;					
						currentStatus.volume = 0;
					}
					
					var track = status[68];

					if(track == -1) {
						if(status[18] == 0)
							cb("totem", "playing", currentStatus);
						else if(status[18] == 1)
							cb("totem", "paused", currentStatus);
						else 
							cb("totem", "stopped", currentStatus);
					} else {
						var execute_string = "dbus-send --print-reply --dest=org.mpris.Totem /TrackList org.freedesktop.MediaPlayer.GetMetadata int32:" + track;

						var child = exec(execute_string, function(error, stdout, stderr) {
							var current = stdout.replace(/\n/g, " ").split(" ");
				
							if(debug)
								console.log("Output: " + stdout);
				
							if(error) {
								cb("totem", "error", currentStatus);							

								return;
							}
						
							if((current) && (current.length == 66))
								currentStatus.current.title = current[53].replace(/"/g, "");
							else
								currentStatus.current.title = undefined;

							if(status[18] == 0)
								cb("totem", "playing", currentStatus);							
							else if(status[18] == 1)
								cb("totem", "paused", currentStatus);
							else 
								cb("totem", "stopped", currentStatus);
						});
					}
					
					return;
				});
			});
		} else {
			cb("totem", "closed", currentStatus);
			
			return;
		}
	});
};

