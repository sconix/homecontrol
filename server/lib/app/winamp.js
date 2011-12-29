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

var debug = true;

var currentState = "stopped";

var currentStatus = null; 

var exec = require('child_process').exec;

var winamp = null;

var client = null;

exports.setup = function(cb, os) {
	if(os == "windows_nt") {
		// add exec test?!?
	
		winamp = require('../node-wa.js');

		currentStatus = new MusicPlayerStatus(true, true, true, false, false, null);

		connect('127.0.0.1', 50000);

		cb("winamp", "Winamp", "Music Player");
	}
};

exports.execute = function(cb, url, addr) {
	console.log("Executing winamp command: " + url.command);

	if(!client) {
		cb("winamp", "closed", currentStatus);
		
		return;
	}
	
	switch(url.command) {
		case "output/mute":
			client.mute();
			currentStatus.mute = !currentStatus.mute;
			break;

		case "output/volume":
			client.volume(Math.round(url.arguments("level") * 255 / 100));
			break;

		case "playback/state":
			if(url.arguments("action") == "play")
				client.play();
			else if(url.arguments("action") == "pause")
				client.pause();
			else if(url.arguments("action") == "stop")
				client.stop();
			break;

		case "playback/skip":
			if(url.arguments("action") == "prev")
				client.previous();
			else if(url.arguments("action") == "next")
				client.next();
			break;

		case "playback/seek":
			break;

		default:
			break;
	}

	setTimeout(respond.bind(this, cb), 500);
	
	return;
};

connect = function(ip, port) {
	client = new winamp('127.0.0.1', 50000);

	client.on('connect', function() {
		if(debug)
			console.log('Connected to winamp');
			
		currentState = "running";
	});

	client.on('error', function() {
		client = null;
		
		if(debug)
			console.log('Unable to connect to winamp');
		
		currentState = "closed";

		setTimeout(connect.bind(this, ip, port), 5000);
	});

	client.on('end', function() {
		client = null;
	
		if(debug)
			console.log('Disconnected from winamp');
			
		setTimeout(connect.bind(this, ip, port), 5000);
	});

	client.on('playlist', function(playlist) {
		if(debug)
			console.log('Received playlist of length: ' + playlist.length);
	});

	client.on('title', function (title) {
		if(debug)
			console.log("Title : " + title);

		currentStatus.current.title = title;
	});

	client.on('playback', function (playback) {
		if(debug)
			console.log("Playback : " + playback);

		if(playback == 0)
			currentState = "stopped";
		else if(playback == 1)
			currentState = "playing";			
		else if(playback == -1)
			currentState = "paused";				
	});

	client.on('stop', function () {
		if(debug)
			console.log("Playback stopped");

		currentState = "stopped";
	});

	client.on('pause', function () {
		if(debug)
			console.log("Playback paused");

		currentState = "paused";
	});

	client.on('repeat', function (repeat) {
		if(debug)
			console.log("Repeat state: " + repeat);

		currentStatus.repeat = repeat;
	});

	client.on('shuffle', function (shuffle) {
		if(debug)
			console.log("Repeat state: " + shuffle);

		currentStatus.random = shuffle;
	});

	client.on('volume', function (volume) {
		if(debug)
			console.log("Volume level: " + volume);

		currentStatus.volume = Math.round(100 * volume / 255);
	});

	client.on('length', function (length) {
		if(debug)
			console.log("Song length: " + length);

//		currentStatus.position.duration = length;
	});

	client.on('position', function (position) {
		if(debug)
			console.log("Song position: " + position);
	});

	client.on('progress', function (progress) {
		if(debug)
			console.log("Song progress: " + progress);

//		currentStatus.position.elapsed = progress;
	});
}

respond = function(cb) {
	cb("winamp", currentState, currentStatus);
}
