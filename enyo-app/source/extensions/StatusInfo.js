//
// Status: state, *sensors
//

enyo.kind({
	name: "StatusInfo",
	kind: enyo.Control,
	layoutKind: "VFlexLayout",

	_config: {},
	_sensors: [],

	_selected: 0,
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
		{name: "actionPopup", kind: "PopupSelect", onSelect: "executeAction", items: [
			{value: "Rename Sensor"}
		]},

		{name: "renamePopup", kind: "Popup", lazy: false, showKeyboardWhenOpening: true, 
			style: "width: 80%;max-width: 500px;", components: [
			{content: "Rename Sensor", flex: 1, style: "text-align: center;margin-bottom: 3px;"},
			{name: "newSensorName", kind: "Input", hint: "Name for the sensor...", autoCapitalize: "title", 
				alwaysLooksFocused: true, autocorrect: false, spellcheck: false, onclick: "showKeyboard"},
			{layoutKind: "HFlexLayout", components: [
				{kind: "Button", flex: 1, caption: "Cancel", onclick: "cancelRename"},
				{kind: "Button", flex: 1, caption: "OK", className: "enyo-button-affirmative", onclick: "handleRename"}
			]}
		]},

		{kind: "PageHeader", layoutKind: "VFlexLayout", components: [
			{name: "title", content: "Status Info", style: "margin-top: 0px;font-weight: bold;"}
		]},
		{layoutKind: "VFlexLayout", flex: 1, components: [
			{kind: "Scroller", autoVertical: true, autoHorizontal: false, horizontal: false, flex: 1, components: [
				{layoutKind: "VFlexLayout", flex: 1, components: [
					{kind: "Divider", caption: "Temperatures"},
					{name: "temperatures", kind: "VirtualRepeater", onSetupRow: "setupSensor", components: [
						{layoutKind: "VFlexLayout", flex: 1, className: "divider-content", components: [
							{layoutKind: "HFlexLayout", className: "divider-container", onclick: "selectAction", components: [
								{name: "sensorName", content: "", flex: 1, style: "text-transform: capitalize;"},
								{name: "sensorTemp", content: ""}
							]},
							{layoutKind: "HFlexLayout", className: "divider-container", components: [
								{content: "Min:", flex: 1, className: "enyo-label", style: "color: gray;"},
								{name: "sensorMin", content: "", className: "enyo-label", style: "color: gray;"},
								{kind: "Spacer"},
								{content: "Max:", flex: 1, className: "enyo-label", style: "color: gray;"},
								{name: "sensorMax", content: "", className: "enyo-label", style: "color: gray;"}
							]}
						]}
					]}
				]}
			]}
		]},
		{kind: "Toolbar", pack: "center", className: "enyo-toolbar-light", components: []},

		{name: "serverRequest", kind: "WebService", timeout: 3000, onSuccess: "handleTemperatures", onFailure: "handleServerError"}
	],

	rendered: function() {
		if((localStorage) && (localStorage["sensors"])) {
			this._config = enyo.json.parse(localStorage["sensors"]);
		}

		this.updateStatus();
	},

	selected: function(visible) {
		this.$.title.setContent(this.title);

		if(visible == true) {
			this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/status"});
		} else if(visible == null) {
			if(this._timeout)
				clearTimeout(this._timeout);
		}
	},

	updateStatus: function() {
		this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/status"});

		if(this._timeout)
			clearTimeout(this._timeout);

		this._timeout = setTimeout(this.updateStatus.bind(this, true), 30000);
	},

	showKeyboard: function() {
		enyo.keyboard.show();
	},

	setupSensor: function(inSender, inIndex) {
		if((inIndex >= 0) && (inIndex < this._sensors.length)) {
			var sensorName = "Sensor " + inIndex;

			if(this._config[this._sensors[inIndex].sensor])
				sensorName = this._config[this._sensors[inIndex].sensor].name;

			this.$.sensorName.setContent(sensorName);

			this.$.sensorTemp.setContent(this._sensors[inIndex].current + "°C");
			this.$.sensorMin.setContent(this._sensors[inIndex].lowest + "°C");
			this.$.sensorMax.setContent(this._sensors[inIndex].highest + "°C");

			return true;
		}
	},

	selectAction: function(inSender, inEvent) {
		this._selected = inEvent.rowIndex;

		this.$.actionPopup.openAtEvent(inEvent);
	},

	executeAction: function(inSender, inSelected) {
		if(inSelected.getValue() == "Rename Sensor") {
			this.$.newSensorName.setValue("");

			this.$.renamePopup.openAtCenter();
		}
	},

	cancelRename: function() {
		this.$.renamePopup.close();

		enyo.keyboard.hide();

		enyo.keyboard.setManualMode(false);
	},

	handleRename: function() {
		this.$.renamePopup.close();

		enyo.keyboard.hide();

		enyo.keyboard.setManualMode(false);

		if(this._config[this._sensors[this._selected].sensor])
			this._config[this._sensors[this._selected].sensor].name = this.$.newSensorName.getValue();
		else
			this._config[this._sensors[this._selected].sensor] = {name: this.$.newSensorName.getValue()};

		this.$.temperatures.render();

		localStorage["sensors"] = enyo.json.stringify(this._config);
	},

	handleTemperatures: function(inSender, inResponse) {
		enyo.error("DEBUG - " + enyo.json.stringify(inResponse));

		this._sensors = [];

		if((inResponse) && (inResponse.state)) {
			this.doUpdate(inResponse.state);

			if((inResponse.sensors) && (inResponse.sensors.length > 0))
				this._sensors = inResponse.sensors;
		} else {
			this.doUpdate("offline");
		}

		this.$.temperatures.render();
	},

	handleServerError: function(inSender, inResponse) {
		enyo.error("DEBUG - " + enyo.json.stringify(inResponse));

		this._sensors = [];

		this.doUpdate("offline");
	}
});

