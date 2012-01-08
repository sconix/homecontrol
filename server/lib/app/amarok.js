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
		var child = exec("amarok --help", function(error, stdout, stderr) {				
			if(!error) {
				currentStatus = new MusicPlayerStatus(true, false, true, false, false, null);

				cb("amarok", "Amarok", "Music Player");
			}
		});
	}
};

exports.execute = function(cb, url, addr) {
	console.log("Executing amarok command: " + url.command);

	if(url.command != "close")
		var execute_string = "pgrep amarok";
	else
		var execute_string = "pkill amarok";

	if(url.command == "start")
		currentStatus.mute = false;

	var child = exec(execute_string, function(error, stdout, stderr) {
		if((stdout.length > 0) || (url.command == "start")) {
			if(url.command == "start")
				var execute_string = "amarok >/dev/null 2>&1 & sleep 3;";
			else
				var execute_string = "";

			switch(url.command) {
				case "output/mute":
					var execute_string = "dbus-send --dest=org.kde.amarok /Player org.freedesktop.MediaPlayer.Mute;";
					
					currentStatus.mute = !currentStatus.mute;
					break;

				case "output/volume":
					var execute_string = "dbus-send --dest=org.kde.amarok /Player org.freedesktop.MediaPlayer.VolumeSet int32:" + 
						url.arguments("level") + ";";

					currentStatus.mute = false;
					break;

				case "playback/state":
					var execute_string = "amarok --" + url.arguments("action") + ";sleep 1;";
					break;

				case "playback/skip":
					if(url.arguments("action") == "prev")
						var execute_string = "amarok --previous;sleep 1;";
					else if(url.arguments("action") == "next")
						var execute_string = "amarok --next;sleep 1;";
					break;

				case "playback/seek":
					break;

				default:
					break;
			}

			execute_string += "dbus-send --print-reply --dest=org.kde.amarok /Player org.freedesktop.MediaPlayer.GetStatus;";

			execute_string += "dbus-send --print-reply --dest=org.kde.amarok /Player org.freedesktop.MediaPlayer.VolumeGet;";

			execute_string += "dbus-send --print-reply --dest=org.kde.amarok /Player org.freedesktop.MediaPlayer.GetMetadata;";

			var child = exec(execute_string, function(error, stdout, stderr) {
				if(error) {
					cb("amarok", "error", currentStatus);
					
					return;
				}

				var output = stdout.replace(/\n/g, " ").replace(/\s{2,}/g, " ").split(" ");
console.log("AAA " + output.toString());
				if((output.length < 24) || (output[9] == 2)) {
					cb("amarok", "stopped", currentStatus);

					return;
				}

				var state = "playing";

				if(output[9] == 1)
					state = "paused";

				currentStatus.volume = output[24];

				var albumIdx = output.indexOf('"album"') + 3;
				var artistIdx = output.indexOf('"artist"') + 3;
				var titleIdx = output.indexOf('"album"') + 3;

				if(albumIdx != -1)
					currentStatus.current.album = output[albumIdx].replace(/"/g, "");

				if(artistIdx != -1)
					currentStatus.current.artist = output[artistIdx].replace(/"/g, "");

				if(titleIdx != -1)
					currentStatus.current.title = output[titleIdx].replace(/"/g, "");

				cb("amarok",state, currentStatus);

				return;
			});
		} else {
			cb("amarok", "closed", currentStatus);
			
			return;
		}
	});
};

