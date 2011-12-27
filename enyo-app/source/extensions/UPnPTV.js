enyo.kind({
	name: "UPnPTV",
	kind: "UPnPController",
	layoutKind: "VFlexLayout",

	_state: "paused",
	
	_volume: 0,

	_selected: 0,
	
	_favorites: [],
	
	events: {
		onUpdate: ""
	},
	
	published: {
		title: "",
		module: "",
		address: ""
	},
	
	components: [
		{name: "actionPopup", kind: "PopupSelect", onSelect: "executeAction", items: [
			{value: "Play Now"}, {value: "Add to Queue"}
		]},
	
		{kind: "PageHeader", layoutKind: "HFlexLayout", components: [
			{name: "normalHeader", layoutKind: "HFlexLayout", flex: 1, components: [
				{kind: "Spacer", flex: 1},
				{name: "title", content: "Music Player", style: "margin-top: 0px;font-weight: bold;"},
				{kind: "Spacer", flex: 1},
				{name: "search", kind: "ToolButton", style: "margin: -13px -10px;", icon: "./images/button-search.png"}			
			]}
		]}, 
		{layoutKind: "VFlexLayout", flex: 1, components: [
			{name: "musicStatus", kind: "DividerDrawer", caption: "Stopped", open: true, components: [
				{layoutKind: "VFlexLayout", flex: 1, style: "padding: 5px 15px;", components: [
					{layoutKind: "HFlexLayout", align: "center", style: "max-width: 290px;margin: -5px auto 0px auto;", components: [
						{name: "currentSong", content: "Not playing...", flex: 1, style: "font-weight: bold;font-size: 18px;"}
/*						{content: "--:--", className: "enyo-label", style: "color: gray;font-size: 12px;"}*/
					]}
				]}
			]},
			{name: "listDivider", kind: "DividerDrawer", open: true, caption: "Favorites", style: "margin-top: -5px;", onOpenChanged: "toggleList"},
			{layoutKind: "VFlexLayout", flex: 1, style: "margin: 0px -2px 0px 10px;border-style: groove;", components: [
				{name: "favorites", kind: "VirtualList", flex: 1, onSetupRow: "setupFavorite", components: [
					{kind: "Item", tapHighlight: true, style: "margin: 0px;padding: 0px;", onclick: "selectAction", components: [
						{layoutKind: "HFlexLayout", flex: 1, align: "center", style: "margin: 0px;padding: 0px;", components: [
							{name: "favoriteName", content: "", flex: 1, style: "margin: 8px 5px;font-size: 14px;"},
							{name: "favoriteType", content: "", className: "enyo-label", style: "color: gray;font-size: 10px;margin: 0px 15px;"}
						]}
					]}
				]}
			]},
			{kind: "DividerDrawer", open: false, caption: "Controls", components: [
				{layoutKind: "VFlexLayout", flex: 1, style: "padding: 5px 15px;", components: [
					{name: "repeatShuffle", layoutKind: "HFlexLayout", pack: "center",  style: "max-width: 290px;margin: 0px auto 15px auto;", components: [
						{name: "musicRepeat", kind: "ToggleButton", onLabel: "Repeat", offLabel: "Repeat", className: "control-repeat", style: "width: 70px;", onChange: "controlMusic"},
						{kind: "Spacer"},
						{name: "musicShuffle", kind: "ToggleButton", onLabel: "Shuffle", offLabel: "Shuffle", className: "control-random", style: "width: 70px;", onChange: "controlMusic"}
					]},
					{layoutKind: "HFlexLayout", style: "max-width: 290px;margin: 0px auto 5px auto;", align: "center", components: [
						{content: "Volume:", flex: 1, style: "font-weight: bold;font-size: 18px;"},
						{name: "muteToggle", kind: "ToggleButton", onLabel: "50", offLabel: "Mute", className: "control-mute", style: "width: 70px;", onChange: "toggleMute"}
					]},
					{layoutKind: "HFlexLayout", style: "max-width: 290px;margin: auto auto;", components: [					
						{name: "volumeSlider", kind: "Slider", onChanging: "updateVolume", onChange: "changeVolume", tapPosition: false, flex: 1, style: "margin: -6px 0px -6px 0px;"}
					]}
				]}
			]}
		]},
		{kind: "Toolbar", pack: "center", className: "enyo-toolbar-light", components: [
			{kind: "Spacer"},
			{name: "musicPrevSong", kind: "ToolButton", icon: "./images/ctl-prev.png", onclick: "controlMusic"},
			{kind: "Spacer"},
			{name: "musicPlayPause", kind: "ToolButton", icon: "./images/ctl-play.png", onclick: "controlMusic"},
			{kind: "Spacer"},
			{name: "musicNextSong", kind: "ToolButton", icon: "./images/ctl-next.png", onclick: "controlMusic"},
			{kind: "Spacer"}
		]},
		
		{name: "serverRequest", kind: "WebService", onFailure: "handleServerError"}		
	],

	rendered: function() {
		this.inherited(arguments);
	},

	selected: function() {
		this.$.title.setContent(this.title);
	},
	
	toggleList: function(inSender) {
		this.$.listDivider.open();
	},
	
	setupFavorite: function(inSender, inIndex) {

	},
	
	selectAction: function(inSender, inEvent) {
		this._selected = inEvent.rowIndex;

		this.$.actionPopup.openAtEvent(inEvent);
	},

	executeAction: function(inSender, inSelected) {
	
	},
	
	controlMusic: function(inSender, inEvent) {
		var action = "status";

		if(inSender.name == "musicPlayPause") {
			if(this._state == "playing")
				action = "pause";
			else
				action = "play";
		} else if(inSender.name == "musicNextSong")
			action = "next";
		else if(inSender.name == "musicPrevSong")
			action = "prev";
		else if(inSender.name == "musicRepeat")
			action = "repeat?state=" + this.$.musicRepeat.getState();
		else if(inSender.name == "musicShuffle")
			action = "random?state=" + this.$.musicShuffle.getState();
	},
	
	toggleMute: function(inSender, inEvent) {
		if(this.$.muteToggle.getState()) {
						
		} else {
			
		}
	},
	
	changeVolume: function(inSender, inEvent) {
			
	},
	
	updateVolume: function(inSender, inEvent) {
		this.$.muteToggle.setOnLabel(this.$.volumeSlider.getPosition());
	},
		
	handleMusicStatus: function(inSender, inResponse) {
		enyo.error("DEBUG: " + enyo.json.stringify(inResponse));
	
		if(inResponse) {
			this._state = inResponse.status;

			if(inResponse.status == "paused") {
				this.doUpdate("Paused");
				this._state = "paused";
			
				this.$.musicStatus.setCaption("Paused");
			
				this.$.currentSong.setContent("Playing paused...");
				this.$.musicPlayPause.setIcon("./images/ctl-play.png");
			} else if(inResponse.status == "playing") {
				this.doUpdate("Playing");
				this._state = "playing";

				this.$.musicStatus.setCaption("Playing");

				if(inResponse.artist)
					this.$.currentSong.setContent(unescape(inResponse.artist) + " - " + unescape(inResponse.title));
				else
					this.$.currentSong.setContent(unescape(inResponse.title));
				
				this.$.musicPlayPause.setIcon("./images/ctl-pause.png");
			} else if(inResponse.status == "stopped") {
				this.doUpdate("Stopped");
				this._state = "stopped";
				
				this.$.musicStatus.setCaption("Stopped");
				
				this.$.currentSong.setContent("Not playing...");
			}

			if(inResponse.repeat)
				this.$.musicRepeat.setState(inResponse.repeat);

			if(inResponse.random)
				this.$.musicShuffle.setState(inResponse.random);

			if(inResponse.favorites) {
				this._favorites = inResponse.favorites;
				
				this.$.favorites.refresh();
			}
			
			if((inResponse.mute == undefined) && (inResponse.volume == "0")) {
				this.$.muteToggle.setOnLabel("0");

				this.$.muteToggle.setState(false);
				this.$.volumeSlider.setPosition(0);
			} else {
				this._volume = inResponse.volume;
			
				this.$.muteToggle.setOnLabel(inResponse.volume);

				if(inResponse.mute != "true")
					this.$.muteToggle.setState(true);
				else
					this.$.muteToggle.setState(false);
				
				this.$.volumeSlider.setPosition(this._volume);
			}
		} else
			this.doUpdate("offline");
	}
});

