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

// TODO: when selecting track / playlist should refresh play queue info and not just empty it out...
//			maybe also when skipping tracks if consume is on...
//			i.e. server should make sure that all changed statuses are in the 
//			status info which is send as a response

var debug = false;

var currentStatus = null;

var mpd = null;

var exec = require('child_process').exec;

exports.setup = function(cb, os) {
	if(os == "linux") {
		var child = exec("mpd --help", function(error, stdout, stderr) {
			if(!error) {
				require("mpd");

				mpd = new MPD();

				mpd.addListener("error", function (error) {
					if(debug)
					  console.log("Got mpd error: " + error.toString());    
				});

	 			currentStatus = new MusicPlayerStatus(true, true, true, true, true, 
					["playlists", "playqueue", "selected"]);

				cb("mpd", "MPD", "Music Player");
			}
		});
	}
};

exports.execute = function(cb, url, addr) {
	console.log("Executing mpd command: " + url.command);

	mpd.connect(function (error) {
		if(error) {
			cb("mpd", "closed", currentStatus);
			
			return;
		}
		
		var command = "", args = [];

		switch(url.command) {
			case "start":
			case "close":
			case "status":
				if(url.arguments("refresh"))
					command = "playlistinfo";
				break;

			case "output/mute":
				command = "setvol";

				if(url.arguments("state") == "true")
					args.push(0);
				else
					args.push(currentStatus.volume);
				break;

			case "output/volume":
				command = "setvol";
				args.push(url.arguments("level"));
				break;

			case "library/search":
				command = "search";

				var words = url.arguments("filter").split(" ");
				
				for(var i = 0; i < words.length; i++) {
					args.push("any");
					args.push(words[i]);
				}
				
//				args.push("any");
//				args = args.concat(url.arguments("filter").split(" "));
//				console.log("AAA " + args.length);
//				args.push(url.arguments("filter"));
				break;

			case "library/select":
				command = "addid";
				args.push('"' + url.arguments("id") + '"');
				break;

			case "playback/state":
				command = url.arguments("action");
				break;

			case "playback/skip":
				if(url.arguments("action") == "prev")
					command = "previous";
				else if(url.arguments("action") == "next")
					command = "next";
				break;

			case "playback/seek":
				command = "status";
				break;

			case "playmode/random":
				command = "random";

				if(url.arguments("state") == "true")
					args.push(1);
				else
					args.push(0);
				break;

			case "playmode/repeat":
				command = "repeat";

				if(url.arguments("state") == "true")
					args.push(1);
				else
					args.push(0);
				break;

			case "playlists/list":
				if(url.arguments("id") == "*")
					command = "listplaylists";
				else {
					command = "listplaylistinfo";
					args.push(url.arguments("id"));
				}
				break;

			case "playlists/select":
				command = "clear";
				break;

			case "playqueue/list":
				if(url.arguments("action") == "info")
					command = "playlistinfo";
				else if(url.arguments("action") == "clear")
					command = "clear";
				break;

			case "playqueue/append":
				command = "add";
				args.push(url.arguments("id"));
				break;

			case "playqueue/remove":
				command = "deleteid";
				args.push(url.arguments("id"));
				break;

			case "playqueue/select":
				command = "playid";
				args.push(url.arguments("id"));
				break;

			default:
				return;
		}

		mpd.cmd(command, args, function (error, result) {
			if((error) && (command != "")) {
				cb("mpd", "error", currentStatus);
				
				return;
			}
			
			switch(url.command) {
				case "library/select":
					command = "playid";
					args = [result.id];
					break;

				case "playlists/select":
					currentStatus.views.playqueue.items = [];

					command = "load";
					args = [url.arguments("id")];
					break;

				case "library/search":
					command = ""; args = [];

					currentStatus.search.items = [];

					for(var i = 0; i < result.length; i++) {
						currentStatus.search.items.push({
							artist: result[i].artist,
							title: result[i].title,
							album: result[i].album,
							id: result[i].file});
					}
					break;

				case "playlists/list":
					if(url.arguments("id") == "*") {
						command = ""; args = [];

						currentStatus.views.playlists.items = [];
			
						for(var i = 0; i < result.length; i++) {
							currentStatus.views.playlists.items.push({
								name: result[i].playlist,
								type: "User Created",
								id: result[i].playlist });
						}
					} else {
						command = ""; args = [];

						currentStatus.views.selected.name = url.arguments("id");
						currentStatus.views.selected.items = [];

						for(var i = 0; i < result.length; i++) {
							currentStatus.views.selected.items.push({
								artist: result[i].artist,
								title: result[i].title,
								album: result[i].album,
								id: result[i].id});
						}
					}				
					break;

				case "playback/seek":
					var time = result.time.split(":");
					
					command = "seekid";
					args = [result.songid];
					
					if(url.arguments("action") == "bwd")
						args.push(parseInt(time[0]) - 10);
					else if(url.arguments("action") == "fwd")
						args.push(parseInt(time[0]) + 10);
					else if(!isNaN(parseInt(url.arguments("position"))))
						args.push(parseInt(url.arguments("position")));
					break;

				case "start":
				case "close":
				case "status":
				case "playqueue/list":
					command = ""; args = [];

					if(result) {
						currentStatus.views.playqueue.items = [];

						for(var i = 0; i < result.length; i++) {
							currentStatus.views.playqueue.items.push({
								artist: result[i].artist,
								title: result[i].title,
								album: result[i].album,
								id: result[i].id});
						}
					}
					break;

				default:
					command = ""; args = [];
					break;
			}
		
			mpd.cmd(command, args, function (error, result) {
				if((error) && (command != "")) {
					cb("mpd", "error", currentStatus);

					return;
				}

				mpd.cmd("status", [], function (error, status) {
					if(error) {
						cb("mpd", "error", currentStatus);

						return;
					}

					var state = "stopped";

					if(status.state == "play")
						state = "playing";
					else if(status.state == "pause")
						state = "paused";

					// Go around having no mute / unmute (0 = mute)
				
					if(url.command != "playback/state") {
						if(status.volume > 0) {
							currentStatus.mute = false;
							currentStatus.volume = status.volume;
						} else if(state == "playing") {
							currentStatus.mute = true;
						}
					}

					if(status.repeat == 1)
						currentStatus.repeat = true;
					else
						currentStatus.repeat = false;
			
					if(status.random == 1)
						currentStatus.random = true;
					else
						currentStatus.random = false;

					if(status.time) {
						var position = status.time.split(":");

						currentStatus.position.elapsed = position[0];

						currentStatus.position.duration = position[1];
					} else {
						currentStatus.position.elapsed = 0;

						currentStatus.position.duration = 0;
					}
					
					mpd.cmd("currentsong", [], function (error, current) {
						if(error) {
							cb("mpd", "error", currentStatus);

							return;
						}

						currentStatus.current.id = current.id;

						currentStatus.current.artist = current.artist;

						currentStatus.current.album = current.album;
				
						currentStatus.current.title = current.name || current.title;

						cb("mpd", state, currentStatus);
				
						mpd.disconnect();
						
						return;
					});
				});
			});
		});
	});
};

