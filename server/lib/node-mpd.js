/*
 
	Node.js MPD client library for the Music Player Daemon.

*/

/*

MIT LICENSED

Copyright (c) 2011 Orlando Vazquez

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

/*

This library is heavily based on the initial work done by Orlando Vazquez,
I (Janne Julkunen) have only cleaned up the code and extended it.

*/

var debug = false;

var sys = require('sys');
var fs = require('fs');
var net = require('net');
var events = require('events');

var inspect = sys.inspect;

exports.MPD = MPD = function(host, port) {
	var self = this;

	this.host = host || 'localhost';
	this.port = port || 6600;

	this.carry = '';
	this.data = '';
	this.linesBuffer = [];

	this.initializeCommands();
}

sys.inherits(MPD, events.EventEmitter);

MPD.prototype.connect = function(callback) {
	var helloRE = new RegExp('^OK MPD\\s+(.*)');

	var self = this;
	
	this.cmdQueue = [];

	// Handler for the hello message
	this.cmdQueue.push(function (error, result) {
		var m = helloRE.exec(result[0].trim());

		if(!m) {
			self.emit("error", "Got invalid hello msg from mpd: " + result);
		} else if(debug) {
			console.log("MPD Server running version: " + m[1]);
		}
	});

	this.conn = net.createConnection(this.port, this.host);
	
	this.conn.addListener('connect', function() {
		self.addListeners();

		callback();
	});
}

MPD.prototype.disconnect = function() {
	this.conn.end();    
};

MPD.prototype.initializeCommands = function() {
	var kvRE = RegExp('^([^:]+): (.*)');

	var self = this;

	this._fetch_nothing = function(lines, callback) {
		callback(null);
	};

	this._fetch_songs = function(lines, callback) {
		var songs = [];
		var kv, m, line;

		lines.pop();

		for(var i in lines) {
			line = lines[i].trim();
			m = kvRE.exec(line);

			if(m) {
				if(m[1] == "file")
					songs.push({});
				
				if(songs[songs.length - 1])
					songs[songs.length - 1][m[1].toLowerCase()] = m[2];
			} else {
				return callback(new Error("Invalid key/value string " + inspect(line)));
			}
		}

		callback(null, songs);
	};

	this._fetch_playlists = function(lines, callback) {
		var playlists = [];
		var item = {};
		var kv, m, line;

		lines.pop();

		for(var i in lines) {
			line = lines[i].trim();
			m = kvRE.exec(line);

			if(m) {
				item[m[1].toLowerCase()] = m[2];
			} else {
				return callback(new Error("Invalid key/value string " + inspect(line)));
			}
		
			if(m[1] == "Last-Modified") {
				playlists.push(item);
				item = {};
			}
		}

		callback(null, playlists);
	};

	this._fetch_object = function(lines, callback) {
		var item = {};
		var kv, m, line;

		lines.pop();

		for(var i in lines) {
			line = lines[i].trim();
			m = kvRE.exec(line);

			if(m) {
				item[m[1].toLowerCase()] = m[2];
			} else {
				return callback(new Error("Invalid key/value string " + inspect(line)));
			}
		}

		callback(null, item);
	};

  this._commands = {
//	Status Commands
//		"clearerror":       this._fetch_nothing,
		"currentsong":      this._fetch_object,
//		"idle":             this._fetch_list,
//		"noidle":           null,
		"status":           this._fetch_object,
//		"stats":            this._fetch_object,
//	Playback Option Commands
//		"consume":          this._fetch_nothing,
//		"crossfade":        this._fetch_nothing,
		"random":           this._fetch_nothing,
		"repeat":           this._fetch_nothing,
		"setvol":           this._fetch_nothing,
//		"single":           this._fetch_nothing,
//		"volume":           this._fetch_nothing,
//	Playback Control Commands
		"next":             this._fetch_nothing,
		"pause":            this._fetch_nothing,
		"play":             this._fetch_nothing,
		"playid":           this._fetch_nothing,
		"previous":         this._fetch_nothing,
//		"seek":             this._fetch_nothing,
		"seekid":           this._fetch_nothing,
//		"stop":             this._fetch_nothing,
//	Playlist Commands
		"add":              this._fetch_nothing,
		"addid":            this._fetch_object,
		"clear":            this._fetch_nothing,
//		"delete":           this._fetch_nothing,
		"deleteid":         this._fetch_nothing,
//		"move":             this._fetch_nothing,
//		"moveid":           this._fetch_nothing,
//		"playlist":         this._fetch_playlist,
//		"playlistfind":     this._fetch_songs,
//		"playlistid":       this._fetch_songs,
		"playlistinfo":     this._fetch_songs,
//		"playlistsearch":   this._fetch_songs,
//		"plchanges":        this._fetch_songs,
//		"plchangesposid":   this._fetch_changes,
//		"shuffle":          this._fetch_nothing,
//		"swap":             this._fetch_nothing,
//		"swapid":           this._fetch_nothing,
//	Stored Playlist Commands
//		"listplaylist":     this._fetch_list,
		"listplaylistinfo": this._fetch_songs,
		"listplaylists":    this._fetch_playlists,
		"load":             this._fetch_nothing,
//		"playlistadd":      this._fetch_nothing,
//		"playlistclear":    this._fetch_nothing,
//		"playlistdelete":   this._fetch_nothing,
//		"playlistmove":     this._fetch_nothing,
//		"rename":           this._fetch_nothing,
//		"rm":               this._fetch_nothing,
//		"save":             this._fetch_nothing,
//	Database Commands
//		"count":            this._fetch_object,
//		"find":             this._fetch_songs,
//		"list":             this._fetch_list,
//		"listall":          this._fetch_database,
//		"listallinfo":      this._fetch_database,
//		"lsinfo":           this._fetch_database,
		"search":           this._fetch_songs,
//		"update":           this._fetch_item,
//	Connection Commands
//		"close":            null,
//		"kill":             null,
//		"password":         this._fetch_nothing,
//		"ping":             this._fetch_nothing,
//	Audio Output Commands
//		"disableoutput":    this._fetch_nothing,
//		"enableoutput":     this._fetch_nothing,
//		"outputs":          this._fetch_outputs,
//	Reflection Commands
//		"commands":         this._fetch_list,
//		"notcommands":      this._fetch_list,
//		"tagtypes":         this._fetch_list,
//		"urlhandlers":      this._fetch_list,
	};
}

MPD.prototype.addListeners = function() {
	var okRE = new RegExp('^OK\s?');
	var ackRE = new RegExp('^ACK\s?');

	var self = this;

	this.conn.addListener('error', function(exception) {
		self.emit("error", exception);
	});

	this.conn.addListener('data', function(data) {
		var result, callback;

		// Split the buffer on newlines and if we find the last item isn't an
		// empty string, then that means that we got a data packet that ended in
		// the middle of a line. We'll "carry" that until the next `data` event.
		
		var lines = (self.carry + data).split("\n");
		
		self.carry = '';
		
		var lline = lines[lines.length-1];

		if(lline !== '')
			self.carry = lline;
		
		lines.pop();

		self.linesBuffer.splice.apply(self.linesBuffer,
			[self.linesBuffer.length, lines.length].concat(lines));

		// Walk accross the lines array and run a callback each time we find an
		// `OK` or `ACK`.

		var i = 0, il = self.linesBuffer.length;

		while(i < il) {
			if((self.linesBuffer[i].match(okRE)) || (self.linesBuffer[i].match(ackRE))) {
				// Lean on the behaviour of Array.prototype.splice which modifies the
				// original array and returns the added/subtracted items. This gives
				// us all the lines up to the OK message to use for the callback, and
				// removes those lines from the line buffer.

				result = self.linesBuffer.splice(0, i+1);

				if(debug)
					console.log("Command result: " + result);

				i = 0;

				il = self.linesBuffer.length;

				var callback = self.cmdQueue.shift();

				if(callback)
					callback(null, result);
			} else {
				i++;
			}
		}
	});
}

MPD.prototype.cmd = function (command, args, callback) {
	var self = this;

	var request = command;

	if(!callback)
		callback = args;
	else
		request += " " + args.toString().replace(/,/g, " ");

	if(command.length > 0) {
		if(debug)
			console.log("Running command: " + request);

		this.cmdQueue.push(function(error, result) {
			if(error)
				return callback(error);

			if(debug)
				console.log("Finished command: " + request);

			var func = self._commands[command];

			func(result, callback);
		});

		this.conn.write(request + "\n");
	} else 
		callback("No command given!");
}

