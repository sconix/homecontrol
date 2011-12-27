//
// Status: state
//

enyo.kind({
	name: "MediaCenter",
	kind: enyo.Control,
	layoutKind: "VFlexLayout",

	_timeout: null,
	_keyboard: false,

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
				{name: "title", content: "Media Center", style: "margin-top: 0px;font-weight: bold;"},
				{kind: "Spacer", flex: 1},
				{name: "keyboard", kind: "ToolButton", className: "tool-button", icon: "./images/button-kbd.png", 
					onclick: "toggleKeyboard"}
			]},
			{name: "keyboardHeader", layoutKind: "HFlexLayout", flex: 1, components: [
				{name: "keyboardInput", kind: "ToolInput", alwaysLooksFocused: true, flex: 1, 
					inputClassName: "keyboard-input", autoCapitalize: "lowercase", autoWordComplete: false, 
					style: "margin: -5px 10px -5px 0px;", onkeypress: "handleKeypress"},
				{kind: "ToolButton", className: "tool-button", icon: "./images/button-kbd.png", onclick: "toggleKeyboard"}
			]}
		]},
		{layoutKind: "VFlexLayout", flex: 1, components: [
			{kind: "Scroller", autoVertical: true, autoHorizontal: false, horizontal: false, flex: 1, components: [
				{layoutKind: "VFlexLayout", flex: 1, components: [
					{name: "playbackStatus", kind: "DividerDrawer", open: false, caption: "Playback", className: "divider", 
						components: [
						{layoutKind: "VFlexLayout", pack: "center", flex: 1, className: "divider-content", components: [
							{layoutKind: "HFlexLayout", className: "divider-container", components: [
								{name: "controlPlayback", kind: "Slider", flex: 1, className: "control-progress", 
									onChanging: "updateSlider", onChange: "controlDevice", tapPosition: false},
							]}
						]}
					]},
					{name: "volumeStatus", kind: "DividerDrawer", caption: "Volume", open: false, components: [
						{layoutKind: "VFlexLayout", flex: 1, className: "divider-content", components: [
							{layoutKind: "HFlexLayout", className: "divider-container", components: [
								{name: "controlVolume", kind: "Slider", tapPosition: false, flex: 1, className: "control-volume", 
									style: "margin-top: -19px;", onChanging: "updateSlider", onChange: "controlDevice"},
							]}
						]}
					]},
					{layoutKind: "VFlexLayout", flex: 1, pack: "center", className: "divider-content", components: [
						{layoutKind: "HFlexLayout", className: "divider-container", components: [
							{name: "controlMute", kind: "ToolButton", className: "control-mute", icon: "./images/ctl-mute.png", 
								onclick: "controlDevice"},
							{layoutKind: "VFlexLayout", flex: 1, components: [
								{layoutKind: "VFlexLayout", pack: "center", className: "control-pad-box", components: [
									{name: "controlOk", kind: "ToolButton", className: "control-ok", icon: "./images/ctl-ok.png", 
										onclick: "controlDevice"},
									{name: "controlUp", kind: "ToolButton", className: "control-up", icon: "./images/ctl-up.png", 
										onclick: "controlDevice"},
									{name: "controlLeft", kind: "ToolButton", className: "control-left", icon: "./images/ctl-left.png", 
										onclick: "controlDevice"},
									{name: "controlRight", kind: "ToolButton", className: "control-right", icon: "./images/ctl-right.png", 
										onclick: "controlDevice"},
									{name: "controlDown", kind: "ToolButton", className: "control-down", icon: "./images/ctl-down.png", 
										onclick: "controlDevice"}
								]}
							]},
							{name: "controlBack", kind: "ToolButton", className: "control-back", icon: "./images/ctl-back.png", 
								onclick: "controlDevice"}
						]}
					]}
				]}
			]}
		]},
		{kind: "Toolbar", className: "enyo-toolbar-light", components: [
			{name: "controlPrev", kind: "ToolButton", icon: "./images/ctl-prev.png", className: "control-first", 
				onclick: "controlDevice"},
			{kind: "Spacer"},
			{name: "controlRwd", kind: "ToolButton", icon: "./images/ctl-bwd.png", className: "control-middle", 
				onclick: "controlDevice"},
			{kind: "Spacer"},
			{name: "controlPlayPause", kind: "ToolButton", icon: "./images/ctl-playpause.png", className: "control-middle", 
				onclick: "controlDevice"},
			{kind: "Spacer"},
			{name: "controlFwd", kind: "ToolButton", icon: "./images/ctl-fwd.png", className: "control-middle", 
				onclick: "controlDevice"},
			{kind: "Spacer"},
			{name: "controlNext", kind: "ToolButton", icon: "./images/ctl-next.png", className: "control-last", 
				onclick: "controlDevice"},
		]},

		{name: "serverRequest", kind: "WebService", timeout: 3000, onFailure: "unknownError"}
	],

	rendered: function() {
		this.inherited(arguments);

		this.$.keyboardHeader.hide();

		if((this.module != "boxee") && (this.module != "xbmc")) {
			this.$.keyboard.hide();
			this.$.playbackStatus.hide();
			this.$.volumeStatus.hide();
		}

		if(enyo.fetchDeviceInfo().modelNameAscii.toLowerCase() == "touchpad") {
			this.$.playbackStatus.toggleOpen();
			this.$.volumeStatus.toggleOpen();
		}

		this.checkStatus();
	},

	selected: function(visible) {
		this.$.title.setContent(this.title);

		if(visible == true) {
			if((this.module == "boxee") || (this.module == "xbmc")) {
				this.$.serverRequest.call({}, {url: "http://" + this.address + "/xbmcCmds/xbmcHttp?command=GetPercentage", 
					onSuccess: "updatePlayback"});
			} else {
				this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/start", 
					onSuccess: "updatePlayback"});
			}
		} else if(visible == null) {
			if(this._timeout)
				clearTimeout(this._timeout);
		}
	},

	checkStatus: function(poll) {
		if((this.module == "boxee") || (this.module == "xbmc")) {
			this.$.serverRequest.call({}, {url: "http://" + this.address + "/xbmcCmds/xbmcHttp?command=GetPercentage", 
				onSuccess: "updatePlayback"});
		} else {
			this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/status", 
				onSuccess: "updatePlayback"});
		}

		if(this._timeout)
			clearTimeout(this._timeout);

		this._timeout = setTimeout(this.checkStatus.bind(this, true), 5000);
	},

	updateSlider: function(inSender, inEvent) {
		if(inSender.name == "controlPlayback")
			this.$.playbackStatus.setCaption("Playback (" + this.$.controlPlayback.getPosition() + "%)");
		else if(inSender.name == "controlVolume")
			this.$.volumeStatus.setCaption("Volume (" + this.$.controlVolume.getPosition() + "%)");
	},

	toggleKeyboard: function() {
		if(this._keyboard) {
			this._keyboard = false;

			this.$.keyboardHeader.hide();
			this.$.normalHeader.show();
		} else {
			this._keyboard = true;

			this.$.normalHeader.hide();
			this.$.keyboardHeader.show();
			this.$.keyboardInput.forceFocus();
		}
	},

	handleKeypress: function(inSender, inEvent) {
		this.$.keyboardInput.setValue("");

		var action = "SendKey(" + (61696 + inEvent.keyCode) + ")";

		this.$.serverRequest.call({}, {url: "http://" + this.address + "/xbmcCmds/xbmcHttp?command=" + action, 
			onSuccess: "updateStatus"});
	},

	controlDevice: function(inSender, inEvent) {
		var action = "status";

		if((this.module == "boxee") || (this.module == "xbmc")) {
			if(inSender.name == "controlPlayPause")
				action = "Pause";
			else if(inSender.name == "controlNext")
				action = "PlayNext";
			else if(inSender.name == "controlPrev")
				action = "PlayPrev";
			else if(inSender.name == "controlFwd")
				action = "SeekPercentageRelative(2)";
			else if(inSender.name == "controlRwd")
				action = "SeekPercentageRelative(-2)";
			else if(inSender.name == "controlOk")
				action = "SendKey(61453)";
			else if(inSender.name == "controlLeft")
				action = "SendKey(272)";
			else if(inSender.name == "controlRight")
				action = "SendKey(273)";
			else if(inSender.name == "controlUp")
				action = "SendKey(270)";
			else if(inSender.name == "controlDown")
				action = "SendKey(271)";
			else if(inSender.name == "controlMute")
				action = "Mute";
			else if(inSender.name == "controlBack")
				action = "SendKey(275)";
			else if(inSender.name == "controlPlayback") {
				this.$.playbackStatus.setCaption("Playback");

				action = "SeekPercentage(" + this.$.controlPlayback.getPosition() + ")";
			} else if(inSender.name == "controlVolume") {
				this.$.volumeStatus.setCaption("Volume");

				action = "SetVolume(" + this.$.controlVolume.getPosition() + ")";
			}

			this.$.serverRequest.call({}, {url: "http://" + this.address + "/xbmcCmds/xbmcHttp?command=" + action, 
				onSuccess: "updateStatus"});
		} else {
			if(inSender.name == "controlPlayPause")
				action = "play-pause";
			else if(inSender.name == "controlNext")
				action = "next";
			else if(inSender.name == "controlPrev")
				action = "prev";
			else if(inSender.name == "controlFwd")
				action = "seek?action=fwd";
			else if(inSender.name == "controlRwd")
				action = "seek?action=bwd";
			else if(inSender.name == "controlOk")
				action = "select";
			else if(inSender.name == "controlLeft")
				action = "left";
			else if(inSender.name == "controlRight")
				action = "right";
			else if(inSender.name == "controlUp")
				action = "up";
			else if(inSender.name == "controlDown")
				action = "down";
			else if(inSender.name == "controlMute")
				action = "mute";
			else if(inSender.name == "controlBack")
				action = "back";

			this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/" + action, 
				onSuccess: "updateStatus"});
		}
	},

	updateStatus: function(inSender, inResponse) {
		enyo.error("DEBUG: " + enyo.json.stringify(inResponse));

		if(inResponse)
			this.doUpdate("online");
		else
			this.doUpdate("offline");
	},

	updateVolume: function(inSender, inResponse) {
		if(inResponse) {
			var position = inResponse.replace(/<.*?>/g, '');

			if(position != "Error")
				this.$.controlVolume.setPosition(position);
		}
	},

	updatePlayback: function(inSender, inResponse) {
		if((inResponse) && ((inResponse.state) || 
			(this.module == "boxee") || (this.module == "xbmc")))
		{
			this.doUpdate("online");

			if((this.module == "boxee") || (this.module == "xbmc")) {
				this.$.serverRequest.call({}, {url: "http://" + this.address + "/xbmcCmds/xbmcHttp?command=GetVolume", 
					onSuccess: "updateVolume"});

				var position = inResponse.replace(/<.*?>/g, '');

				if(position != "Error")
					this.$.controlPayback.setPosition(position);
			}
		} else {
			this.doUpdate("offline");
		}
	},

	unknownError: function(inSender, inResponse) {
		enyo.error("DEBUG - " + enyo.json.stringify(inResponse));

		this.doUpdate("offline");
	}
});

