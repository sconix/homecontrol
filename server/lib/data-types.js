//

var crypto = require('crypto');

//
// MUSIC PLAYER API:
//

/*
  start?refresh=true/false
  close?refresh=true/false
  status?refresh=true/false
  output/mute?state=true/false
  output/volume?level=0-100
  library/search?filter=text
  library/select?id=songitem
  playback/state?action=play/pause
  playback/skip?action=prev/next
  playback/seek?action=fwd/bwd
  playback/seek?position=(seconds)
  playback/select?id=songitem
- playmode/consume?state=true/false
- playmode/single?state=true/false
  playmode/repeat?state=true/false
  playmode/repeat?state=true/false
  playlists/list?id=playlist/*
  playlists/select?id=playlist
  playqueue/list?action=info/clear
  playqueue/append?id=songitem
  playqueue/remove?id=songitem
  playqueue/select?id=songitem
*/

//
// MUSIC PLAYER STATUS OBJECT
//

exports.musicPlayerStatus = MusicPlayerStatus = function(outputCtl, 
	playmodeCtl, currentInfo, positionInfo, librarySearch, listViews)
{
	// Hold on statuses per client so that we can minimize the data

	this.previousStatuses = {};

	// Public data

	if(outputCtl) {
		this.mute = true;
		this.volume = 0;
	}

	if(playmodeCtl) {
		this.random = false;
		this.repeat = false;
	}

	if(currentInfo)
		this.current = {};

	if(positionInfo)
		this.position = {};

	if(librarySearch)
		this.search = {"name": "Search Results", "items": []};

	if(listViews) {
		this.views = {};

		for(var i = 0; i < listViews.length; i++) {
			if(listViews[i] == "current")
				this.views[listViews[i]] = {"name": "Current Playlist", "items": []};
			else if(listViews[i] == "selected")
				this.views[listViews[i]] = {"name": "Selected Playlist", "items": []};
			else if(listViews[i] == "libraries")
				this.views[listViews[i]] = {"name": "Music Libraries", "items": []};
			else if(listViews[i] == "playlists")
				this.views[listViews[i]] = {"name": "All Playlists", "items": []};
			else if(listViews[i] == "playqueue")
				this.views[listViews[i]] = {"name": "Play Queue", "items": []};
		}
	}

	// Public functions

	this.reset = function(address) {
		if(this.previousStatuses[address])
			delete this.previousStatuses[address];
	};

	this.getStatus = function(address, state) {
		var status = {"state": state};
		
		if((this.mute != undefined) && (this.volume != undefined)) {
			status.mute = this.mute;
			status.volume = this.volume;
		}

		if((this.random != undefined) && (this.repeat != undefined)) {
			status.random = this.random;
			status.repeat = this.repeat;
		}

		if(!this.previousStatuses[address])
			this.previousStatuses[address] = {};
		
		if(this.views) {
			status.views = {};

			var data = JSON.stringify(this.views);
			
			var viewsHash = crypto.createHash("md5").update(data).digest("hex");

			if(this.previousStatuses[address].views != viewsHash)
				status.views = this.views;

			this.previousStatuses[address].views = viewsHash;
		}
		
		if(this.search) {
			status.search = {};

			var data = JSON.stringify(this.search);

			var searchHash = crypto.createHash("md5").update(data).digest("hex");

			if(this.previousStatuses[address].search != searchHash)
				status.search = this.search;

			this.previousStatuses[address].search = searchHash;
		}
		
		if(this.current)
			status.current = this.current;

		if(this.position)
			status.position = this.position;

		return status;
	}
};

//
// VIDEO PLAYER API:
//

/*
  start?refresh=true/false
  close?refresh=true/false
  status?refresh=true/false
  output/mute?state=true/false
  output/volume?level=0-100
  output/volume?action=up/down
  playback/state?action=play/pause/toggle
  playback/skip?action=prev/next
  playback/seek?action=fwd/bwd
  viewmode/fullscreen?state=toggle

  library/search?filter=text
  library/select?id=songitem
  playback/select?id=songitem
  playlists/list?id=playlist/*
  playlists/select?id=playlist
  playqueue/list?action=info/clear
  playqueue/append?id=songitem
  playqueue/remove?id=songitem
  playqueue/select?id=songitem
*/

//
// VIDEO PLAYER STATUS OBJECT
//

exports.videoPlayerStatus = VideoPlayerStatus = function(outputCtl, 
	viewmodeCtl, currentInfo, positionInfo, librarySearch, listViews)
{
	// Hold on statuses per client so that we can minimize the data

	this.previousStatuses = {};

	// Public data

	if(outputCtl) {
		this.mute = true;
		this.volume = 0;
	}

	if(viewmodeCtl)
		this.fullscreen = false;

	if(currentInfo)
		this.current = {};

	if(positionInfo)
		this.position = {};

	if(librarySearch)
		this.search = {"name": "Search Results", "items": []};

	if(listViews) {
		this.views = {};

		for(var i = 0; i < listViews.length; i++) {
			if(listViews[i] == "current")
				this.views[listViews[i]] = {"name": "Current Playlist", "items": []};
			else if(listViews[i] == "library")
				this.views[listViews[i]] = {"name": "Media Library", "items": []};
		}
	}

	// Public functions

	this.reset = function(address) {
		if(this.previousStatuses[address])
			delete this.previousStatuses[address];
	};

	this.getStatus = function(address, state) {
		var status = {"state": state};
		
		if((this.mute != undefined) && (this.volume != undefined)) {
			status.mute = this.mute;
			status.volume = this.volume;
		}

		if(this.fullscreen != undefined)
			status.fullscreen = this.fullscreen;

		if(!this.previousStatuses[address])
			this.previousStatuses[address] = {};
		
		if(this.views) {
			status.views = {};

			var data = JSON.stringify(this.views);
			
			var viewsHash = crypto.createHash("md5").update(data).digest("hex");

			if(this.previousStatuses[address].views != viewsHash)
				status.views = this.views;

			this.previousStatuses[address].views = viewsHash;
		}
		
		if(this.search) {
			status.search = {};

			var data = JSON.stringify(this.search);

			var searchHash = crypto.createHash("md5").update(data).digest("hex");

			if(this.previousStatuses[address].search != searchHash)
				status.search = this.search;

			this.previousStatuses[address].search = searchHash;
		}
		
		if(this.current)
			status.current = this.current;

		if(this.position)
			status.position = this.position;

		return status;
	}
};

//
// MEDIA CENTER API
//

//
// MEDIA CENTER STATUS OBJECT
//

exports.mediaCenterStatus = MediaCenterStatus = function() {
	// Public data

	// Public functions

	this.getStatus = function(address, state) {
		var status = {"state": state};

		return status;
	}
};

//
// SYSTEM 1-WIRE API
//

/*
	status
*/

//
// SYSTEM 1-WIRE STATUS OBJECT
//

exports.systemSoundStatus = System1WireStatus = function(useSensors) {
	// Public data

	if(useSensors)
		this.sensors = [];

	// Public functions

	this.getStatus = function(address, state) {
		var status = {"state": state};
		
		if(this.sensors != undefined)
			status.sensors = this.sensors;

		return status;
	}
};

//
// SYSTEM INPUT API
//

/*
	status
*/

//
// SYSTEM INPUT STATUS OBJECT
//

exports.systemInputStatus = SystemInputStatus = function(os) {
	// Public data

	this.os = os || "linux";
	
	this.kbdShift = 0;
	
	this.kbdLeft = 0;
	this.kbdMiddle = 0;
	this.kbdRight = 0;

	this.mouseLeft = 0;
	this.mouseMiddle = 0;
	this.mouseRight = 0;

	// Public functions

	this.reset = function(address) {
		this.kbdLeft = 0;
		this.kbdMiddle = 0;
		this.kbdRight = 0;
	},

	this.update = function(state, key) {
		if(this.os == "darwin") {
			if(state == "down") {
				if(key == "Shift_L")
					this.kbdShift = 1;
				else if(key == "Control")
					this.kbdLeft = 1;
				else if(key == "Option")
					this.kbdMiddle = 1;				
				else if(key == "Command")
					this.kbdRight = 1;
				else if(key == "MouseBtn1")
					this.mouseLeft = 1;
				else if(key == "MouseBtn2")
					this.mouseMiddle = 1;
				else if(key == "MouseBtn3")
					this.mouseRight = 1;
			} else if (state == "up") {
				if(key == "Shift_L")
					this.kbdShift = 0;
				else if(key == "Control")
					this.kbdLeft = 0;
				else if(key == "Option")
					this.kbdMiddle = 0;				
				else if(key == "Command")
					this.kbdRight = 0;
				else if(key == "MouseBtn1")
					this.mouseLeft = 0;
				else if(key == "MouseBtn2")
					this.mouseMiddle = 0;
				else if(key == "MouseBtn3")
					this.mouseRight = 0;									
			}
		} else if(this.os == "linux") {
			if(state == "down") {
				if(key == "Shift_L")
					this.kbdShift = 1;
				else if(key == "Control_L")
					this.kbdLeft = 1;
				else if(key == "Control_R")
					this.kbdLeft = 2;					
				else if(key == "Super_L")
					this.kbdMiddle = 1;				
				else if(key == "Multi_key")
					this.kbdMiddle = 2;				
				else if(key == "Alt_L")
					this.kbdRight = 1;				
				else if(key == "ISO_Level3_Shift")																				
					this.kbdRight = 2;				
				else if(key == "MouseBtn1")
					this.mouseLeft = 1;
				else if(key == "MouseBtn2")
					this.mouseMiddle = 1;
				else if(key == "MouseBtn3")
					this.mouseRight = 1;
			} else if (state == "up") {
				if(key == "Shift_L")
					this.kbdShift = 0;
				else if((key == "Control_L") && (this.kbdLeft == 1))
					this.kbdLeft = 0;
				else if((key == "Control_R") && (this.kbdLeft == 2))
					this.kbdLeft = 0;					
				else if((key == "Super_L") && (this.kbdMiddle == 1))
					this.kbdMiddle = 0;				
				else if((key == "Multi_key") && (this.kbdMiddle == 2))
					this.kbdMiddle = 0;				
				else if((key == "Alt_L") && (this.kbdRight == 1))
					this.kbdRight = 0;				
				else if((key == "ISO_Level3_Shift")	&& (this.kbdRight == 2))															
					this.kbdRight = 0;		
				else if((key == "MouseBtn1") && (this.mouseLeft == 1))
					this.mouseLeft = 0;
				else if((key == "MouseBtn2") && (this.mouseMiddle == 1))
					this.mouseMiddle = 0;
				else if((key == "MouseBtn3") && (this.mouseRight == 1))
					this.mouseRight = 0;	
			}
		}
	},

	this.getStatus = function(address, state) {
		var status = {"state": state};

		if(this.os == "darwin") {
			status.modifiers = {
				left: {state: this.kbdLeft, keys: [
					{id: "Control", label: "Ctrl"}, 
					{id: "Control", label: "Ctrl"}]},
				middle: {state: this.kbdMiddle, keys: [
					{id: "Option", label: "Option"},
					{id: "Option", label: "Option"}]},
				right: {state: this.kbdRight, keys: [
					{id: "Command", label: "Cmd"},
					{id: "Command", label: "Cmd"}]}};
		} else if(this.os == "linux") {
			status.buttons = {
				left: this.mouseLeft,
				middle: this.mouseMiddle,
				right: this.mouseRight};

			status.modifiers = {
				left: {state: this.kbdLeft, keys: [
					{id: "Control", label: "Ctrl"}, 
					{id: "Control_L", label: "CtrlL"},
					{id: "Control_R", label: "CtrlR"}]},
				middle: {state: this.kbdMiddle, keys: [
					{id: "Super", label: "Super"},
					{id: "Super_L", label: "SuperL"},
					{id: "Multi_key", label: "SuperR"}]},
				right: {state: this.kbdRight, keys: [
					{id: "Alt", label: "Alt"},
					{id: "Alt_L", label: "AltL"}, 
					{id: "ISO_Level3_Shift", label: "AltGr"}]}};
		}

		return status;
	}
};

//
// SYSTEM SOUND API
//

/*
	status
	input?mute=true/false
	input?volume=value
	output?mute=true/false	
	output?volume=value
*/

//
// SYSTEM SOUND STATUS OBJECT
//

exports.systemSoundStatus = SystemSoundStatus = function(inputCtl, outputCtl) {
	// Public data

	if(inputCtl)
		this.input = {mute: true, volume: 0};

	if(outputCtl)
		this.output = {mute: true, volume: 0};

	// Public functions

	this.getStatus = function(address, state) {
		var status = {"state": state};
		
		if(this.input != undefined)
			status.input = this.input;

		if(this.output != undefined)
			status.output = this.output;

		return status;
	}
};

//
// SYSTEM SURVEILLANCE API
//

/*
	status
	latest
	update?file=<file>
*/

//
// SYSTEM SURVEILLANCE STATUS OBJECT
//

exports.systemSurveillanceStatus = SystemSurveillanceStatus = function() {
	// Public data

	this.file = null;

	// Public functions

	this.getFile = function(address) {
		return "./data/upload/" + this.file;
	},

	this.getStatus = function(address, state) {
		var status = {"state": state};

		return status;
	}
};

