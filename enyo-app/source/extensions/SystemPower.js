//
// Status: 
//

enyo.kind({
	name: "SystemPower",
	kind: enyo.Control,
	layoutKind: "VFlexLayout",

	_timeout: null,

	_display: null,
	_shutdown: null,

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
				{name: "title", content: "System Power", style: "margin-top: 0px; font-weight: bold;"},
				{kind: "Spacer", flex: 1}
			]}
		]},
		{layoutKind: "VFlexLayout", flex: 1, components: [
			{kind: "Scroller", autoVertical: true, autoHorizontal: false, horizontal: false, flex: 1, components: [
				{layoutKind: "VFlexLayout", flex: 1, components: [
					{kind: "Spacer", flex: 1},
					{name: "displayDivider", kind: "Divider", caption: "Display"},
					{name: "displayControls", layoutKind: "VFlexLayout", className: "divider-content", components: [
						{layoutKind: "HFlexLayout", className: "divider-container", align: "center", components: [
							{content: "Lock Screen:", flex: 1, style: "font-weight: bold;font-size: 18px;"},
							{name: "lockScreenToggle", kind: "ToggleButton", onLabel: "Yes", offLabel: "No", 
								className: "control-mute", style: "width: 70px;"},
						]},
						{layoutKind: "HFlexLayout", className: "divider-container", style: "padding-top: 10px;", components: [
							{name: "displayStateButton", kind: "Button", caption: "Turn Off Display", flex: 1, 
									className: "control-key enyo-button-dark", onclick: "controlPower"},
						]}
					]},
					{kind: "Spacer", flex: 1},
					{name: "computerDivider", kind: "Divider", caption: "Computer"},
					{name: "computerControls", layoutKind: "VFlexLayout", className: "divider-content", components: [
						{layoutKind: "HFlexLayout", className: "divider-container", align: "center", components: [
							{content: "Wait Timer:", flex: 1, style: "font-weight: bold;font-size: 18px;"},
							{name: "timerHourPicker", kind: "IntegerPicker", label: "H", min: 0, max: 24},
							{name: "timerMinsPicker", kind: "IntegerPicker", label: "M", min: 0, max: 60}
						]},
						{layoutKind: "HFlexLayout", className: "divider-container", style: "padding-top: 10px;", components: [
							{name: "shutdownStateButton", kind: "Button", caption: "Shutdown Computer", flex: 1, 
									className: "control-key enyo-button-dark", onclick: "controlPower"}
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

	controlPower: function(inSender, inEvent) {
		var action = "status";

		if(inSender.name == "displayStateButton") {
			if(this._display == "on") {
				if(this.$.lockScreenToggle.getState())
					action="display?state=lock";
				else
					action="display?state=off";				
			} else if(this._display == "off") {
				action="display?state=on";			
			}
		}
		else if(inSender.name == "shutdownStateButton") {
			var timeout = (this.$.timerHourPicker.getvalue() * 60 * 60) + (this.$.timerMinsPicker.getValue() * 60);

			if(this._shutdown == "idle") {
				if(timeout == 0)
					action="shutdown?timer=now";
				else
					action="shutdown?timer=" + timeout;
			} else {
				action="shutdown?timer=cancel";
			}
		}

		this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/" + action});
	},

	updateStatus: function(inSender, inResponse) {
		enyo.error("DEBUG - " + enyo.json.stringify(inResponse));

		if((inResponse) && (inResponse.state)) {
			this.doUpdate(inResponse.state);

			if(inResponse.screen != true)
				this.$.lockScreenToggle.setDisabled(true);

			if(inResponse.display != undefined) {
				this._display = inResponse.display;

				if(inResponse.display == "on")
					this.$.displayStateButton.setCaption("Turn Off Display");
				else if(inResponse.display == "off")
					this.$.displayStateButton.setCaption("Turn On Display");
			} else {
				this.$.displayDivider.hide();
				this.$.displayControls.hide();
			}

			if(inResponse.shutdown != undefined) {
				if(inResponse.shutdown == "idle") {
					if(this._shutdown != "idle") {
						this.$.timerHourPicker.setValue(0);
						this.$.timerMinsPicker.setValue(0);
					}
				
					this.$.shutdownStateButton.setCaption("Shutdown Computer");
				} else {
					var hours = Math.floor(inResponse.shutdown / 60 / 60);
					var mins = (inResponse.shutdown - (hours * 60 * 60)) / 60;
				
					this.$.timerHourPicker.setValue(hours);
					this.$.timerMinsPicker.setValue(mins);
				
					this.$.shutdownStateButton.setCaption("Cancel Shutdown");
				}

				this._shutdown = inResponse.shutdown;
			} else {
				this.$.computerDivider.hide();
				this.$.computerControls.hide();
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

