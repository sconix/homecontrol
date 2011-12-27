//
// Status: state, *input {volume, mute}, *output {volume, mute}
//

enyo.kind({
	name: "SystemSound",
	kind: enyo.Control,
	layoutKind: "VFlexLayout",

	_timeout: null,

	events: {
		onUpdate: ""
	},

	published: {
		title: "",
		module: "",
		address: ""
	},

	components: [
		{kind: "PageHeader", layoutKind: "HFlexLayout", components: [
			{name: "normalHeader", layoutKind: "HFlexLayout", flex: 1, components: [
				{kind: "Spacer", flex: 1},
				{name: "title", content: "System Sound", style: "margin-top: 0px; font-weight: bold;"},
				{kind: "Spacer", flex: 1}
			]}
		]},
		{layoutKind: "VFlexLayout", flex: 1, components: [
			{kind: "Scroller", autoVertical: true, autoHorizontal: false, horizontal: false, flex: 1, components: [
				{layoutKind: "VFlexLayout", flex: 1, components: [
					{kind: "Spacer", flex: 1},
					{name: "inputDivider", kind: "Divider", caption: "Input"},
					{name: "inputControls", layoutKind: "VFlexLayout", className: "divider-content", components: [
						{layoutKind: "HFlexLayout", className: "divider-container", align: "center", components: [
							{content: "Volume:", flex: 1, style: "font-weight: bold;font-size: 18px;"},
							{name: "inputMuteToggle", kind: "ToggleButton", onLabel: "50", offLabel: "Mute", 
								className: "control-mute", style: "width: 70px;", onChange: "controlSound"}
						]},
						{layoutKind: "HFlexLayout", className: "divider-container", components: [
							{name: "inputVolumeSlider", kind: "Slider", tapPosition: false, flex: 1, 
								className: "control-volume", onChanging: "updateInput", onChange: "controlSound"}
						]}
					]},
					{kind: "Spacer", flex: 1},
					{name: "outputDivider", kind: "Divider", caption: "Output"},
					{name: "outputControls", layoutKind: "VFlexLayout", className: "divider-content", components: [
						{layoutKind: "HFlexLayout", className: "divider-container", align: "center", components: [
							{content: "Volume:", flex: 1, style: "font-weight: bold;font-size: 18px;"},
							{name: "outputMuteToggle", kind: "ToggleButton", onLabel: "50", offLabel: "Mute", 
								className: "control-mute", style: "width: 70px;", onChange: "controlSound"}
						]},
						{layoutKind: "HFlexLayout", className: "divider-container", components: [
							{name: "outputVolumeSlider", kind: "Slider", tapPosition: false, flex: 1, 
								className: "control-volume", onChanging: "updateOutput", onChange: "controlSound"}
						]}
					]},
					{kind: "Spacer", flex: 1}
				]}
			]}
		]},
		{kind: "Toolbar", pack: "center", className: "enyo-toolbar-light", components: [
		]},

		{name: "serverRequest", kind: "WebService", timeout: 3000, onSuccess: "updateStatus", onFailure: "unknownError"}
	],

	rendered: function() {
		this.inherited(arguments);

		this.checkStatus();
	},

	selected: function(visible) {
		this.$.title.setContent(this.title);

		if(visible == true) {
			this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/status"});
		} else if(visible == null) {
			if(this._timeout)
				clearTimeout(this._timeout);
		}
	},

	checkStatus: function() {
		this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/status"});

		if(this._timeout)
			clearTimeout(this._timeout);

		this._timeout = setTimeout(this.checkStatus.bind(this, true), 5000);
	},

	updateInput: function(inSender, inEvent) {
		this.$.inputMuteToggle.setOnLabel(this.$.inputVolumeSlider.getPosition());
	},

	updateOutput: function(inSender, inEvent) {
		this.$.outputMuteToggle.setOnLabel(this.$.outputVolumeSlider.getPosition());
	},

	controlSound: function(inSender, inEvent) {
		var action = "status";

		if((inSender.name == "inputMuteToggle") || 
			(inSender.name == "inputVolumeSlider"))
		{
			action = "input?";

			if(inSender.name == "inputMuteToggle")
				action += "mute=" + !this.$.inputMuteToggle.getState();
			else if(inSender.name == "inputVolumeSlider")
				action += "volume=" + this.$.inputVolumeSlider.getPosition();
		}
		else if((inSender.name == "outputMuteToggle") || 
			(inSender.name == "outputVolumeSlider"))
		{
			action = "output?";

			if(inSender.name == "outputMuteToggle")
				action += "mute=" + !this.$.outputMuteToggle.getState();
			else if(inSender.name == "outputVolumeSlider")
				action += "volume=" + this.$.outputVolumeSlider.getPosition();
		}

		this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/" + action});
	},

	updateStatus: function(inSender, inResponse) {
		enyo.error("DEBUG - " + enyo.json.stringify(inResponse));

		if((inResponse) && (inResponse.state)) {
			this.doUpdate(inResponse.state);

			if(inResponse.input != undefined) {
				this.$.inputMuteToggle.setOnLabel(inResponse.input.volume);

				this.$.inputVolumeSlider.setPosition(inResponse.input.volume);

				if(inResponse.input.mute == true)
					this.$.inputMuteToggle.setState(false);
				else
					this.$.inputMuteToggle.setState(true);
			} else {
				this.$.inputDivider.hide();
				this.$.inputControls.hide();
			}

			if(inResponse.output != undefined) {
				this.$.outputMuteToggle.setOnLabel(inResponse.output.volume);

				this.$.outputVolumeSlider.setPosition(inResponse.output.volume);

				if(inResponse.output.mute == true)
					this.$.outputMuteToggle.setState(false);
				else
					this.$.outputMuteToggle.setState(true);
			} else {
				this.$.outputDivider.hide();
				this.$.outputControls.hide();
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

