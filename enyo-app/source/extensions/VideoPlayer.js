//
// Status: state, *title, *fullscreen, *(volume & mute)
//

enyo.kind({
	name: "VideoPlayer",
	kind: enyo.Control,
	layoutKind: "VFlexLayout",

	_state: "stopped",

	_clicked: 0,
	_playing: 0,
	_volume: 0,

	_timer: null,
	_timeout: null,
	_opening: false,

	_list: null,

	_current: null,
	_library: null,
	_position: null,

	events: {
		onUpdate: ""
	},

	published: {
		title:"",
		module: "",
		address: ""
	},

	components: [
		{name: "currentPopup", kind: "PopupSelect", onSelect: "executeAction", items: [
			{value: "Play This Video"}
		]},

		{name: "libraryPopup", kind: "PopupSelect", onSelect: "executeAction", items: [
			{value: "Play This Video"}
		]},

		{kind: "PageHeader", layoutKind: "HFlexLayout", components: [
			{name: "normalHeader", layoutKind: "HFlexLayout", flex: 1, components: [
				{kind: "Spacer", flex: 1},
				{name: "title", content: "Video Player", style: "margin-top: 0px; font-weight: bold;"},
				{kind: "Spacer", flex: 1}
			]}
		]},
		{layoutKind: "VFlexLayout", flex: 1, components: [
			{kind: "Scroller", autoVertical: true, autoHorizontal: false, horizontal: false, flex: 1, components: [
				{layoutKind: "VFlexLayout", flex: 1, components: [
					{name: "videoStateInfo", kind: "Divider", caption: "Offline", className: "divider"},
					{name: "videoStatusInfo", kind: "DividerDrawer", caption: "Offline", className: "divider", open: true, components: [
						{layoutKind: "VFlexLayout", flex: 1, className: "divider-content", components: [
							{name: "videoCurrentVideo", content: "Not playing...", className: "current-info",
								style: "text-overflow: ellipsis;", onclick: "toggleProgress"},
							{name: "videoProgressBar", kind: "Slider", tapPosition: false, className: "control-progress",
								onChanging: "updateProgress", onChange: "controlVideo"}
						]}
					]},
					{name: "videoEmptyList", kind: "Spacer"},
					{name: "videoListDivider", kind: "DividerDrawer", caption: "Current Playlist", open: true, onOpenChanged: "toggleList"},
					{name: "videoListViews", layoutKind: "VFlexLayout", flex: 1, className: "divider-container-box", components: [
						{name: "videoListView", kind: "VirtualList", flex: 1, onSetupRow: "setupListItem", components: [
							{kind: "Item", tapHighlight: true, style: "margin: 0px;padding: 0px;", onclick: "selectAction", components: [
								{layoutKind: "VFlexLayout", flex: 1, className: "list-view-item", components: [
									{name: "listItemTitle", content: "", flex: 1, className: "list-view-title"}
								]}
							]}
						]}
					]},
					{name: "videoExtraControls", kind: "DividerDrawer", open: false, caption: "Controls", 
						onOpenChanged: "toggleControls", components: [
						{layoutKind: "VFlexLayout", flex: 1, className: "divider-content", components: [
							{layoutKind: "HFlexLayout", className: "divider-container", components: [
								{name: "videoToggleSize", kind: "Button", caption: "Fullscreen", flex: 1, 
									className: "control-key enyo-button-dark", onclick: "controlVideo"},
								{name: "videoToggleSeparator", kind: "Spacer", style: "max-width: 10px;"},
								{name: "videoToggleMute", kind: "Button", caption: "Mute", flex: 1, 
									className: "control-key enyo-button-dark", onclick: "controlVideo"}
							]},
							{name: "videoVolBtnControls", layoutKind: "VFlexLayout", components: [
								{layoutKind: "HFlexLayout", align: "center", className: "divider-container", components: [
									{content: "Volume:", flex: 1, style: "font-weight: bold; font-size: 18px;"},
									{layoutKind: "HFlexLayout", flex: 1, style: "padding-left: 10px", components: [
										{name: "videoVolumeDown", kind: "Button", caption: "-", flex: 1, 
											className: "control-key-half enyo-button-dark", onclick: "controlVideo"},
										{kind: "Spacer"},
										{name: "videoVolumeUp", kind: "Button", caption: "+", flex: 1, 
											className: "control-key-half enyo-button-dark", onclick: "controlVideo"}
									]}
								]}
							]},
							{name: "videoVolumeControls", layoutKind: "VFlexLayout", components: [
								{layoutKind: "HFlexLayout", align: "center", className: "divider-container", components: [
									{content: "Volume:", flex: 1, style: "font-weight: bold; font-size: 18px;"},
									{name: "videoMuteToggle", kind: "ToggleButton", onLabel: "50", offLabel: "Mute", 
										className: "control-mute", style: "width: 70px;", onChange: "controlVideo"}
								]},
								{layoutKind: "HFlexLayout", className: "divider-container", components: [
									{name: "videoVolumeSlider", kind: "Slider", tapPosition: false, flex: 1, 
										className: "control-volume", onChanging: "updateVolume", onChange: "controlVideo"}
								]}
							]}
						]}
					]}
				]}
			]}
		]},
		{kind: "Toolbar", pack: "center", className: "enyo-toolbar-light", components: [
			{kind: "Spacer"},
			{name: "videoSkipPrev", kind: "ToolButton", icon: "./images/ctl-prev.png", className: "control-first", 
				onclick: "controlVideo"},
			{kind: "Spacer"},
			{name: "videoSeekBwd", kind: "ToolButton", icon: "./images/ctl-bwd.png", className: "control-middle", 
				onclick: "controlVideo"},
			{kind: "Spacer"},
			{name: "videoPlayPause", kind: "ToolButton", icon: "./images/ctl-play.png", className: "control-middle", 
				onclick: "controlVideo"},
			{kind: "Spacer"},
			{name: "videoSeekFwd", kind: "ToolButton", icon: "./images/ctl-fwd.png", className: "control-middle", 
				onclick: "controlVideo"},
			{kind: "Spacer"},
			{name: "videoSkipNext", kind: "ToolButton", icon: "./images/ctl-next.png", className: "control-last", 
				onclick: "controlVideo"},
			{kind: "Spacer"},
		]},

		{name: "vlcRequest", kind: "WebService", timeout: 5000, handleAs: "text", onFailure: "unknownError"},

		{name: "serverRequest", kind: "WebService", timeout: 3000, onSuccess: "updateStatus", onFailure: "unknownError"}
	],

	rendered: function() {
		this.inherited(arguments);

		this.$.videoStateInfo.hide();
		this.$.videoVolBtnControls.hide();
		this.$.videoProgressBar.hide();
		this.$.videoEmptyList.hide();
		this.$.videoSkipPrev.hide();
		this.$.videoSkipNext.hide();
		this.$.videoToggleMute.hide();
		this.$.videoToggleSeparator.hide();

		this.$.videoToggleSize.setCaption("Toggle Fullscreen");

		this.checkStatus();
	},

	selected: function(visible) {
		this.$.title.setContent(this.title);

		if(visible == true) {
			if(this.module == "vlc")
				this.$.serverRequest.call({}, {url: "http://" + this.address + "/requests/status.xml"});
			else
				this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/start"});
		} else if(visible == null) {
			if(this._timeout)
				clearTimeout(this._timeout);

			if(this.module != "vlc")
				this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/close"});
		}
	},

	checkStatus: function() {
		if(this.module == "vlc")
			this.$.serverRequest.call({}, {url: "http://" + this.address + "/requests/status.xml"});
		else
			this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/status"});

		if(this._timeout)
			clearTimeout(this._timeout);

		this._timeout = setTimeout(this.checkStatus.bind(this, true), 5000);
	},

	selectAction: function(inSender, inEvent) {
		if(this.$.videoListDivider.open) {
			this._clicked = inEvent.rowIndex;

			this.$[this._list + "Popup"].openAtEvent(inEvent);
		}
	},

	executeAction: function(inSender, inSelected) {
		if(this.module == "vlc") {
			this.executeActionVLC(inSender, inSelected);
		}
	},

	updateList: function(inList) {
		this._list = inList;

		this.$.videoListDivider.setCaption(this["_" + this._list].name);

		this.$.videoListView.refresh();

		this.$.videoListView.punt();

		this.checkStatus();
	},

	updateVolume: function(inSender, inEvent) {
		this.$.videoMuteToggle.setOnLabel(this.$.videoVolumeSlider.getPosition());
	},

	updateProgress: function(inSender, inEvent) {
		if(this._timer)
			clearTimeout(this._timer);

		var p = this.$.videoProgressBar.getPosition();

		var dM = Math.floor(this._position.duration / 60);
		var dS = this._position.duration - (dM * 60);

		if(dS < 10) dS = "0" + dS;

		var eM = Math.floor((p * this._position.duration / 100) / 60);
		var eS = Math.floor((p * this._position.duration / 100)) - (eM * 60);

		if(eS < 10) eS = "0" + eS;

		this.$.videoStatusInfo.setCaption(eM + ":" + eS + " / " + dM + ":" + dS);
	},

	toggleProgress: function(inSender) {
		if(this.$.videoProgressBar.showing) {
			this.$.videoStatusInfo.setCaption(enyo.cap(this._state));

			this.$.videoProgressBar.hide();
			this.$.videoCurrentVideo.show();
		} else if((this._position) && ((this._state == "playing") || (this._state == "paused"))) {
			var dM = Math.floor(this._position.duration / 60);
			var dS = this._position.duration - (dM * 60);

			if(dS < 10) dS = "0" + dS;

			var eM = Math.floor(this._position.elapsed / 60);
			var eS = this._position.elapsed - (eM * 60);

			if(eS < 10) eS = "0" + eS;

			this.$.videoStatusInfo.setCaption(eM + ":" + eS + " / " + dM + ":" + dS);

			this.$.videoCurrentVideo.hide();
			this.$.videoProgressBar.show();

			if(this._timer)
				clearTimeout(this._timer);

			this._timer = setTimeout(this.toggleProgress.bind(this), 5000);
		}
	},

	toggleList: function(inSender) {
		if(this._opening) {
			this._opening = false;

			return;
		}

		if(!this.$.videoListDivider.open) {
			if((this._list == "current") && (this._library))
				this.updateList("library");
			else if(this._current)
				this.updateList("current");
		} else {
			this._opening = true;

			this.$.videoListDivider.setOpen(false);
		}
	},

	toggleControls: function(inSender) {
		if((!this.$.videoSkipPrev) || (!this.$.videoSkipNext))
			return;

		if(inSender.open == true) {
			if(this._current) {
				this.$.videoSkipPrev.show();
				this.$.videoSkipNext.show();
			}
		} else {
			this.$.videoSkipPrev.hide();
			this.$.videoSkipNext.hide();
		}
	},

	setupListItem: function(inSender, inIndex) {
		if((this._list) && (this["_" + this._list]) && (this["_" + this._list].items) && 
			(inIndex >= 0) && (inIndex < this["_" + this._list].items.length))
		{
			if(this["_" + this._list].items[inIndex].id == this._playing)
				this.$.listItemTitle.applyStyle("font-weight", "bold");
			else
				this.$.listItemTitle.applyStyle("font-weight", "normal");

			this.$.listItemTitle.setContent(this["_" + this._list].items[inIndex].name);

			return true;
		}
	},

	controlVideo: function(inSender, inEvent) {
		if(this.module == "vlc") {
			this.controlVideoVLC(inSender, inEvent);

			this.$.serverRequest.call({}, {url: "http://" + this.address + "/requests/status.xml"});
		} else {
			var action = "status";

			if(inSender.name == "videoPlayPause") {
				if(this._state == "running")
					action = "playback/state?action=toggle";
				else if(this._state == "playing")
					action = "playback/state?action=pause";
				else
					action = "playback/state?action=play";
			} else if(inSender.name == "videoSkipPrev")
				action = "playback/skip?action=prev";
			else if(inSender.name == "videoSkipNext")
				action = "playback/skip?action=next";
			else if(inSender.name == "videoSeekBwd")
				action = "playback/seek?action=bwd";
			else if(inSender.name == "videoSeekFwd")
				action = "playback/seek?action=fwd";
			else if(inSender.name == "videoToggleSize")
				action = "viewmode/fullscreen?action=toggle";
			else if(inSender.name == "videoToggleMute")
				action = "output/mute?state=toggle";
			else if(inSender.name == "videoMuteToggle") {
				if(!this.$.videoMuteToggle.getState())
					action = "output/mute?state=true";
				else
					action = "output/mute?state=false";
			} else if(inSender.name == "videoVolumeUp")
				action = "output/volume?action=up";
			else if(inSender.name == "videoVolumeDown")
				action = "output/volume?action=down";
			else if(inSender.name == "videoVolumeSlider")
				action = "output/volume?value=" + this.$.videoVolumeSlider.getPosition();
			else if(inSender.name == "videoProgressBar") {
				this.toggleProgress();

				var p = this.$.videoProgressBar.getPosition();

				var position = Math.floor(p * this._position.duration / 100);

				action = "playback/seek?position=" + position;
			}

			this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/" + action});
		}
	},

	updateStatus: function(inSender, inResponse) {
		enyo.error("DEBUG - " + enyo.json.stringify(inResponse));

		if(this.module == "vlc") {
			this.updateStatusVLC(inSender, inResponse);
		} else {
			if((inResponse) && (inResponse.state)) {
				this._state = inResponse.state;

				this.doUpdate(inResponse.state);

				this.$.videoStateInfo.setCaption(enyo.cap(inResponse.state));
				this.$.videoStatusInfo.setCaption(enyo.cap(inResponse.state));

				if(inResponse.state == "running") {
					this.$.videoPlayPause.setIcon("./images/ctl-playpause.png");
				} else if(inResponse.state == "playing") {
					this.$.videoPlayPause.setIcon("./images/ctl-pause.png");
				} else if(inResponse.state == "paused") {
					this.$.videoPlayPause.setIcon("./images/ctl-play.png");
				}

				if(inResponse.current != undefined) {
					this.$.videoStateInfo.hide();
					this.$.videoStatusInfo.show();

					if(inResponse.current.title)
						this.$.videoCurrentVideo.setContent(inResponse.current.title);
					else
						this.$.videoCurrentVideo.setContent("Unknown Video");

					if((this._state == "playing") || (this._state == "paused")) {
						this.$.videoCurrentVideo.applyStyle("text-overflow", "none");
						this.$.videoCurrentVideo.applyStyle("overflow-x", "-webkit-marquee");
					} else {
						this.$.videoCurrentVideo.applyStyle("text-overflow", "ellipsis");
						this.$.videoCurrentVideo.applyStyle("overflow-x", "none");

						this.$.videoCurrentVideo.setContent("Not playing...");
					}
				} else {
					this.$.videoStateInfo.show();
					this.$.videoStatusInfo.hide();
				}

				if(inResponse.position != undefined) {
					this._position = inResponse.position;

					var p = Math.floor(100 * this._position.elapsed / this._position.duration);

					this.$.videoProgressBar.setPosition(p);
				}

				if(inResponse.volume != undefined) {
					this.$.videoVolBtnControls.hide();
					this.$.videoVolumeControls.show();

					this.$.videoToggleMute.hide();
					this.$.videoToggleSeparator.hide();

					this.$.videoToggleSize.setCaption("Toggle Fullscreen");

					this.$.videoMuteToggle.setOnLabel(inResponse.volume);

					this.$.videoVolumeSlider.setPosition(inResponse.volume);

					if(inResponse.mute == true)
						this.$.videoMuteToggle.setState(false);
					else
						this.$.videoMuteToggle.setState(true);
				} else {
					this.$.videoVolBtnControls.show();
					this.$.videoVolumeControls.hide();

					this.$.videoToggleMute.show();
					this.$.videoToggleSeparator.show();

					this.$.videoToggleSize.setCaption("Fullscreen");
				}

				if(inResponse.fullscreen != undefined) {
					this.$.videoToggleSize.show();
				} else {
					this.$.videoToggleSize.hide();
					this.$.videoToggleSeparator.hide();
				}

				if(inResponse.views !== undefined) {
					this.$.videoEmptyList.hide();
					this.$.videoListDivider.show();
					this.$.videoListViews.show();
				} else {
					this.$.videoEmptyList.show();
					this.$.videoListDivider.hide();
					this.$.videoListViews.hide();
				}
			} else {
				this.doUpdate("offline");

				this.$.videoStateInfo.setCaption("Offline");
				this.$.videoStatusInfo.setCaption("Offline");
			}
		}
	},

	unknownError: function(inSender, inResponse) {
		enyo.error("DEBUG - " + enyo.json.stringify(inResponse));

		this.doUpdate("offline");

		this.$.videoStateInfo.setCaption("Offline");
		this.$.videoStatusInfo.setCaption("Offline");
	},

//
// Direct VLC support
//

	controlVideoVLC: function(inSender, inEvent) {
		var action = "status";

		if(inSender.name == "videoPlayPause") {
			action = "pl_pause";
		} else if(inSender.name == "videoSkipPrev") {
			action = "pl_previous";
		} else if(inSender.name == "videoSkipNext") {
			action = "pl_next";
		} else if(inSender.name == "videoSeekBwd") {
			action = "seek&val=-1M";
		} else if(inSender.name == "videoSeekFwd") {
			action = "seek&val=+1M";
		} else if(inSender.name == "videoToggleSize") {
			action = "fullscreen";
		} else if(inSender.name == "videoMuteToggle") {
			if(!this.$.videoMuteToggle.getState())
				action = "volume&val=0";
			else
				action = "volume&val=" + (this._volume * 256 / 100);
		} else if(inSender.name == "videoProgressBar") {
			this.toggleProgress();

			var p = this.$.videoProgressBar.getPosition();

			var position = Math.floor(p * this._position.duration / 100);

			action = "seek&val=" + position;
		} else if(inSender.name == "videoVolumeSlider") {
			action = "volume&val=" + (this.$.videoVolumeSlider.getPosition() * 256 / 100);
		}

		this.$.vlcRequest.call({}, {url: "http://" + this.address + "/requests/status.xml?command=" + action});
	},

	executeActionVLC: function(inSender, inSelected) {
		if(inSelected.getValue() == "Play This Video") {
			var id = this["_" + this._list].items[this._clicked].id;

			this.$.vlcRequest.call({}, {url: "http://" + this.address + "/requests/status.xml?command=pl_play&id=" + id});

			this._playing = id;

			this.$.videoListView.refresh();
		}
	},

	updateStatusVLC: function(inSender, inResponse) {
		var regexp = new RegExp("<state>([\\s\\S]*?)<\\/state>");

		var state = [];

		if(inResponse)
			state = regexp.exec(inResponse);

		if(state.length > 0) {
			this._state = state[1].replace("stop", "stopped");

			this.doUpdate(state[1].replace("stop", "stopped"));

			this.$.videoPlayPause.setIcon("./images/ctl-playpause.png");

			this.$.videoStatusInfo.setCaption(enyo.cap(state[1].replace("stop", "stopped")));

			if(state[1] != "stop") {
				var regexp = new RegExp('<title><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/title>');

				var info = regexp.exec(inResponse);

				if((info) && (info.length > 0)) {
					this.$.videoCurrentVideo.setContent(info[1]);

					this.$.videoCurrentVideo.applyStyle("text-overflow", "none");
					this.$.videoCurrentVideo.applyStyle("overflow-x", "-webkit-marquee");
				} else
					this.$.videoCurrentVideo.setContent("Unknown Video");
			} else {
				this.$.videoCurrentVideo.applyStyle("text-overflow", "ellipsis");
				this.$.videoCurrentVideo.applyStyle("overflow-x", "none");

				this.$.videoCurrentVideo.setContent("Not playing...");
			}

			var regexp = new RegExp("<volume>([\\s\\S]*?)<\\/volume>");

			var volume = regexp.exec(inResponse);

			if((volume.length < 2) || (volume[1] == 0)) {
				this.$.videoMuteToggle.setOnLabel("0");

				this.$.videoMuteToggle.setState(false);
				this.$.videoVolumeSlider.setPosition(0);
			} else {
				this._volume = Math.round(volume[1] / 256 * 100);

				this.$.videoMuteToggle.setOnLabel(this._volume);

				this.$.videoMuteToggle.setState(true);
				this.$.videoVolumeSlider.setPosition(this._volume);
			}

			var regexp = new RegExp("<length>([\\s\\S]*?)<\\/length>");

			var duration = regexp.exec(inResponse);

			if(duration.length == 2) {
				var regexp = new RegExp("<time>([\\s\\S]*?)<\\/time>");

				var elapsed = regexp.exec(inResponse);

				if(elapsed.length == 2) {
					this._position = {duration: duration[1], elapsed: elapsed[1]};

					var p = Math.floor(100 * this._position.elapsed / this._position.duration);

					this.$.videoProgressBar.setPosition(p);
				}
			}
		} else {
			this.doUpdate("offline");

			this.$.videoStatusInfo.setCaption("Offline");
		}

		this.$.vlcRequest.call({}, {url: "http://" + this.address + "/requests/playlist.xml", 
			onSuccess: "updatePlaylistsVLC"});
	},

	updatePlaylistsVLC: function(inSender, inResponse) {
//		enyo.error("DEBUG - " + inResponse);

		var xmlResults = new DOMParser().parseFromString(inResponse,"text/xml");

		var results = xmlResults.getElementsByTagName("node");

		this._playing = 0;

		for(var i = 0; i < results.length; i++) {
			if(results[i].attributes["name"].nodeValue == "Playlist") {
				this._current = {name: "Current Playlist", items: []};

				var leafs = results[i].getElementsByTagName("leaf");

				for(var j = 0; j < leafs.length; j++) {
					if((leafs[j].attributes["current"]) && 
						(leafs[j].attributes["current"].nodeValue == "current"))
					{
						this._playing = leafs[j].attributes["id"].nodeValue;
					}

					if((leafs[j].attributes["duration"]) && 
						(leafs[j].attributes["duration"].nodeValue > 0))
					{
						var videoId = leafs[j].attributes["id"].nodeValue;
						var videoName = leafs[j].attributes["name"].nodeValue || "Unknown";

						this._current.items.push({id: videoId, name: videoName});
					}
				}

				if(!this._list)
					this._list = "current";
			} else if(results[i].attributes["name"].nodeValue == "Media Library") {
				this._library = {name: "Media Library", items: []};

				var leafs = results[i].getElementsByTagName("leaf");

				for(var j = 0; j < leafs.length; j++) {
					if((leafs[j].attributes["current"]) && 
						(leafs[j].attributes["current"].nodeValue == "current"))
					{
						this._playing = leafs[j].attributes["id"].nodeValue;
					}

					if((leafs[j].attributes["duration"]) && 
						(leafs[j].attributes["duration"].nodeValue > 0))
					{
						var videoId = leafs[j].attributes["id"].nodeValue;
						var videoName = leafs[j].attributes["name"].nodeValue || "Unknown";

						this._library.items.push({id: videoId, name: videoName});
					}
				}

				if(!this._list)
					this._list = "library";
			}
		}

		if(this._list) {
			this.$.videoListDivider.setCaption(this["_" + this._list].name);

			this.$.videoListView.refresh();
		}

		if(!this.$.videoListDivider.open) {
			this._opening = true;

			this.$.videoListDivider.setOpen(true);
		}
	}
});

