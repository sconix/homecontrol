/*
 
	Node.js Winamp client library for the Winamp plugin which is available at:
		http://code.google.com/p/remotecontrol-for-winamp/

*/

/*

SIMPLIFIED BSD LICENSE

Copyright 2011 Mikito Takada. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list 
of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this 
list of conditions and the following disclaimer in the documentation and/or other 
materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY MIKITO TAKADA "AS IS" AND ANY EXPRESS OR IMPLIED 
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF 
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO 
EVENT SHALL MIKITO TAKADA OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, 
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT 
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, 
OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those 
of the authors and should not be interpreted as representing official policies, 
either expressed or implied, of Mikito Takada.

Not that I have any official policies.

*/

/*

This library is heavily based on the initial work done by Mikito Takada,
I (Janne Julkunen) have only cleaned up the code and extended it.

*/

var debug = false;

var net = require('net');

var EventEmitter = require('events').EventEmitter;

module.exports = WA = function (ip, port) {
	var self = this;
	// mode for reading up the sync
	this.mode = 'wait-sync';
	// step in the sync process
	this.step = 0;
	// playlist length
	this.playlist_expected_length = 0;  
	this.playlist_data = [];
	
	this.c = net.createConnection(port || 50000, ip || "localhost");

	this.c.addListener('connect', function() {
		self.emit('connect');
	});

	this.c.addListener('error', function() {
		self.emit('error');
	});

	this.c.addListener('end', function() {
		self.emit('end');	
	});
	
	// simple string buffer
	var str = "";
	var counter = 0;

	this.c.addListener('data', function(data) {
		counter++;

		if(debug)
			console.log(counter + "Received: " + data.length);

		str += data;

		if(str.length > 65536)
			str = str.substr((str.length - 65536));

		if(str.length == 0)
			return;

		var pos = str.indexOf("\n");

		while (pos >= 0) {
			// read the command
			var cmd = str.slice(0, pos);
			
			// remove command & \n from the buffer
			str = str.substr(pos + 1);

			if(self.mode == 'wait-sync') {
				var skip = synchronize.call(self, cmd);
			} else {
				var skip = receive.call(self, cmd);
			}	

			if(skip > 0)
				str = str.substr(skip);

			pos = str.indexOf("\n");
		}
	});   
}

// extend EventEmitter
WA.prototype = new EventEmitter();

function synchronize(cmd) {
   if(this.step == 0) {
      // first returned item is the number of tracks in the playlist
      this.playlist_expected_length = cmd;
      this.step++;  
   } else if(this.step == 1) {            
      // then comes the playlist (item count should match the number of tracks)
      this.playlist_data.push(cmd);
      if(this.playlist_data.length == this.playlist_expected_length) {
         this.step++;
         this.emit('playlist', this.playlist_data);
      }
   } else if(this.step == 2) {
      // then comes the repeat status (1 / 0)
	  console.log("ASASD");
      this.emit('repeat', (cmd == '1'));
      this.step++;
   } else if(this.step == 3) {
      // then comes the shuffle status (1 / 0)
      this.emit('shuffle', (cmd == '1'));
      this.step++;
   } else if(this.step == 4) {
      // then comes the volume (0 - 255?)
      this.emit('volume', cmd);
      this.step++;
   } else if(this.step == 4) {
      // then the queue list count
      this.step++;
      if(cmd == '0') {
         this.step++;         
      }
   } else if(this.step == 5) {
      // then the queue list elements (skipped ??)
      this.step++;
   } else if(this.step == 6) {
      // then the sample rate
      this.emit('samplerate', cmd);
      this.step++;
   } else if(this.step == 7) {
      // then the bit rate
      this.emit('bitrate', cmd);
      this.step++;
   } else if(this.step == 8) {
      // then the length (in seconds!)
      this.emit('length', cmd);
      this.step++;
   } else if(this.step == 9) {
      // then the playlist position
      this.emit('position', cmd);
      this.step++;
   } else if(this.step == 10) {
      // then the title
      this.emit('title', cmd);
      this.step++;
   } else if(this.step == 11) {
      // then the playback status
      this.emit('playback', cmd);
      this.step++;
   } else if(this.step == 12) {      
      // then the cover (bitmap) -- is it enabled?
      if(cmd == '0') {
         // no cover, all done
         this.step = 14;
         this.mode = 'receive';
      } else {
         this.step++;
      }
   } else if(this.step == 13) {      
      // cover length
      var cover_length = parseInt(cmd.substring(12), 10);
//      console.log("COVER length "+cover_length);
      this.step++;
      this.mode = 'receive';
      // cover bitmap must be skipped
      return cover_length;
   }   
//   if(this.step < 14) {
//      console.log(cmd);      
//   }
   
   return 0;
}

function receive(cmd) { 
   var commands = [
      // isplaying_ (0 not playing / 1 playing  / 3 paused)
      { msg: 'isplaying_', emit: 'playback', hasParam: true },
      // playlistPosition_ (number)
      { msg: 'playlistPosition_', emit: 'position', hasParam: true },
      // samplerate_ (number)
      { msg: 'samplerate_', emit: 'samplerate', hasParam: true },
      // bitrate_ (number)
      { msg: 'bitrate_', emit: 'bitrate', hasParam: true },
      // length_ (number ???)
      { msg: 'length_', emit: 'length', hasParam: true },
      // title_ (string)
      { msg: 'title_', emit: 'title', hasParam: true },
      // stop (nothing else) = stopped
      { msg: 'stop', emit: 'stop', hasParam: false },
      // pause
      { msg: 'pause', emit: 'pause', hasParam: false },
      // shuffle_ (0 / 1) 
      { msg: 'shuffle_', emit: 'shuffle', hasParam: true },
      // repeat_ (0 / 1)
      { msg: 'repeat_', emit: 'repeat', hasParam: true },
      // volume_ (0 - 255)
      { msg: 'volume_', emit: 'volume', hasParam: true },
      // progress_ (number)
      { msg: 'progress_', emit: 'progress', hasParam: true },
      // queue_next
      { msg: 'queue_next', emit: 'queue_next', hasParam: false },
   ];
   for(var i = 0; i < commands.length; i++) {
      if(cmd.substr(0, commands[i].msg.length) == commands[i].msg) { 
         if(commands[i].hasParam) {
            this.emit(commands[i].emit, cmd.substr(commands[i].msg.length));            
         } else {
            this.emit(commands[i].emit);                        
         }
      }
   }   
   if(cmd.substr(0, 'coverLength_0'.length) == 'coverLength_0') {
      // do nothing
   } else if(cmd.substr(0, 'coverLength_'.length) == 'coverLength_') {      
      // coverLength_
        // length
        // cover
      return cmd.substr('coverLength_'.length);
   }
   return 0;
}

WA.prototype.write = function (text) {
	if(this.c)
		this.c.write(text);
};

WA.prototype.end = function() {
	this.c.end();
}

//
// Playlist control functions
//

WA.prototype.previous = function () {
   this.write('previous');
}
WA.prototype.play = function () {
   this.write('play');
}

WA.prototype.pause = function () {
   this.write('pause');
}

WA.prototype.stop = function () {
   this.write('stop');
}

WA.prototype.next = function() {
   this.write('next');
}

WA.prototype.shuffle = function () {
   this.write('shuffle');
}

WA.prototype.repeat = function () {
   this.write('repeat');
}

WA.prototype.playlist = function (position) {
   this.write('playlistitem_'+position);
}

WA.prototype.progress = function (milliseconds) {
   this.write('progress_'+milliseconds);
}

WA.prototype.volume = function (volume) {
   if(volume > 255) {
      volume = 255;
   } else if(volume < 0) {
      volume = 0;
   } 
   this.write('volume_'+volume);   
}

WA.prototype.mute = function () {
  this.write('mute');
}

