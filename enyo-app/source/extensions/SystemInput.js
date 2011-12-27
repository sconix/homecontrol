enyo.kind({
	name: "SystemInput",
	kind: enyo.Control,
	layoutKind: "VFlexLayout",

	_event: null,
	_button: 0,

	_timeout: null,

	_keyboard: false,
	_function: false,
	_waiting: false,

	_shift: false,
	_buttons: null,
	_modifiers: null,

	events: {
		onUpdate: ""
	},

	published: {
		title: "",
		module: "",
		address: ""
	},

	components: [
		{name: "keysPopup", kind: "Popup", style: "max-width: 500px;", onclick: "handlePopupClose", onClose: "handlePopupClose", components: [
			{layoutKind: "HFlexLayout", components: [
		    	{content: "1..0, Q, W", flex: 1, style: "text-align: left;font-size: 16px;"},
		    	{content: "F1..F10, F11, F12", flex: 1, style: "text-align: right;font-size: 16px;"}
		   ]},
			{layoutKind: "HFlexLayout", components: [
		    	{content: "B, J, N , M", flex: 1, style: "text-align: left;font-size: 16px;"},
		    	{content: "Arrow Keys", flex: 1, style: "text-align: right;font-size: 16px;"}
		   ]},
			{layoutKind: "HFlexLayout", components: [
		    	{content: "Y", flex: 1, style: "text-align: left;font-size: 16px;"},
		    	{content: "Home", flex: 1, style: "text-align: right;font-size: 16px;"}
		   ]},
			{layoutKind: "HFlexLayout", components: [
		    	{content: "H", flex: 1, style: "text-align: left;font-size: 16px;"},
		    	{content: "End", flex: 1, style: "text-align: right;font-size: 16px;"}
		   ]},
			{layoutKind: "HFlexLayout", components: [
		    	{content: "I", flex: 1, style: "text-align: left;font-size: 16px;"},
		    	{content: "Page Up", flex: 1, style: "text-align: right;font-size: 16px;"}
		   ]},
			{layoutKind: "HFlexLayout", components: [
		    	{content: "K", flex: 1, style: "text-align: left;font-size: 16px;"},
		    	{content: "Page Down", flex: 1, style: "text-align: right;font-size: 16px;"}
		   ]},
			{layoutKind: "HFlexLayout", components: [
		    	{content: "U", flex: 1, style: "text-align: left;font-size: 16px;"},
		    	{content: "Ins", flex: 1, style: "text-align: right;font-size: 16px;"}
		   ]},
			{layoutKind: "HFlexLayout", components: [
		    	{content: "Backspace", flex: 1, style: "text-align: left;font-size: 16px;"},
		    	{content: "Del", flex: 1, style: "text-align: right;font-size: 16px;"}
		   ]},
			{layoutKind: "HFlexLayout", components: [
		    	{content: "Enter", flex: 1, style: "text-align: left;font-size: 16px;"},
		    	{content: "Esc", flex: 1, style: "text-align: right;font-size: 16px;"}
		   ]},
			{layoutKind: "HFlexLayout", components: [
		    	{content: "Space", flex: 1, style: "text-align: left;font-size: 16px;"},
		    	{content: "Tab", flex: 1, style: "text-align: right;font-size: 16px;"}
		   ]}
		]},

		{kind: "PageHeader", layoutKind: "HFlexLayout", components: [
			{name: "normalHeader", layoutKind: "HFlexLayout", flex: 1, components: [
				{kind: "Spacer", flex: 1},
				{name: "title", content: "Computer Input", style: "margin-top: 0px;font-weight: bold;"},
				{kind: "Spacer", flex: 1}
			]}
		]},
		{layoutKind: "VFlexLayout", flex: 1, components: [
			{kind: "Scroller", autoVertical: true, autoHorizontal: false, horizontal: false, flex: 1, components: [
				{layoutKind: "VFlexLayout", flex: 1, components: [
					{name: "keyboardDivider", kind: "Divider", caption: "Keyboard"},
					{name: "keyboardControl", layoutKind: "VFlexLayout", className: "divider-content", components: [
						{layoutKind: "HFlexLayout", className: "divider-container", components: [
							{name: "keyboardInput", kind: "ToolInput", alwaysLooksFocused: true, flex: 1, 
								inputClassName: "keyboard-input", autoCapitalize: "lowercase", autoWordComplete: false, 
								style: "margin: 0px 0px 0px 0px;", onfocus: "showKbdButtons", 
								onblur: "hideKbdButtons", onkeydown: "handleKeyDown", onkeyup: "handleKeyUp"}, 
							{name: "functionKey", caption: "FN", kind: "Button", className: "enyo-button-dark", 
								style: "margin: 0px 0px 0px 10px;", onclick: "handleFunctionKey"}
						]}
					]},
					{name :"mouseDivider", kind: "Divider", caption: "Mouse"},
					{name :"mouseControl", layoutKind: "VFlexLayout", flex: 1, className: "divider-content", components: [
						{layoutKind: "VFlexLayout", flex: 1, className: "divider-container", components: [
							{layoutKind: "VFlexLayout", flex: 1, className: "control-pad-mouse", 
								onmousedown: "resetMouseEvent", onmouseup: "resetMouseButton", 
								onmousemove: "handleMouseMove"},
						]}
					]}
				]}
			]}
		]},
		{kind: "Toolbar", className: "enyo-toolbar-light", components: [
			{name: "mouseLeft", caption: " ", kind: "Button", flex: 1, className: "enyo-button-dark", 
				style: "margin-left: 15px;", onmousedown: "handleMouseDown", onmouseup: "handleMouseUp"},
			{name: "mouseMiddle", caption: " ", kind: "Button", flex: 1, className: "enyo-button-dark", 
				onmousedown: "handleMouseDown", onmouseup: "handleMouseUp"},
			{name: "mouseRight", caption: " ", kind: "Button", flex: 1, className: "enyo-button-dark", 
				style: "margin-right: 15px;", onmousedown: "handleMouseDown", onmouseup: "handleMouseUp"},
			{name: "kbdLeft", caption: "Ctrl", kind: "Button", flex: 1, className: "enyo-button-dark", 
				style: "margin-left: 15px;", onmousedown: "cancelKbdBlur", onmouseup: "handleButtonState"},
			{name: "kbdMiddle", caption: "Super", kind: "Button", flex: 2, className: "enyo-button-dark", 
				onmousedown: "cancelKbdBlur", onmouseup: "handleButtonState"},
			{name: "kbdRight", caption: "Alt", kind: "Button", flex: 1, className: "enyo-button-dark", 
				style: "margin-right: 15px;", onmousedown: "cancelKbdBlur", onmouseup: "handleButtonState"}
		]},

		{name: "serverRequest", kind: "WebService", timeout: 3000, onFailure: "handleServerError"}
	],

	rendered: function() {
		this.inherited(arguments);

		this.$.kbdLeft.hide();
		this.$.kbdMiddle.hide();
		this.$.kbdRight.hide();

		this.updateStatus();
	},

	selected: function(visible) {
		this.$.title.setContent(this.title);

		if(visible == true) {
			this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/status", 
				onSuccess: "handleDeviceStatus"});
		} else if(visible == null) {
			if(this._timeout)
				clearTimeout(this._timeout);

			this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/status?refresh=true", 
				onSuccess: "handleDeviceStatus"});
		}
	},

	updateStatus: function() {
		this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/status", 
			onSuccess: "handleDeviceStatus"});

		if(this._timeout)
			clearTimeout(this._timeout);

		this._timeout = setTimeout(this.updateStatus.bind(this, true), 5000);
	},

	handleFunctionKey: function() {
		if(!this._function) {
			this.$.functionKey.setDown(true);

			this._function = true;

			this.$.keysPopup.openAtCenter();

			this.$.keyboardInput.forceFocus();
		} else {
			this.$.functionKey.setDown(false);

			this._function = false;
		}
	},

	showKbdButtons: function() {
		if(!this._modifiers)
			return;

		this.$.mouseLeft.hide();
		this.$.mouseMiddle.hide();
		this.$.mouseRight.hide();

		this.$.kbdLeft.show();
		this.$.kbdMiddle.show();
		this.$.kbdRight.show();

		if(this._modifiers.left.state)
			this.$.kbdLeft.setDown(true);

		if(this._modifiers.middle.state)
			this.$.kbdMiddle.setDown(true);

		if(this._modifiers.right.state)
			this.$.kbdRight.setDown(true);
	},

	hideKbdButtons: function() {
		if(!this._buttons)
			return;

		this.$.kbdLeft.hide();
		this.$.kbdMiddle.hide();
		this.$.kbdRight.hide();

		this.$.mouseLeft.show();
		this.$.mouseMiddle.show();
		this.$.mouseRight.show();
	},

	cancelKbdBlur: function(inSender, inEvent) {
		enyo.stopEvent(inEvent);
	},

	handlePopupClose: function() {
		if(this._function)
			this.$.functionKey.setDown(true);

		this.$.keysPopup.close();

		this.$.keyboardInput.forceFocus();
	},

	handleButtonState: function(inSender, inEvent) {
		enyo.stopEvent(inEvent);

		var action = "";

		if(inSender.name == "kbdLeft")
			var btn = "left";
		else if(inSender.name == "kbdMiddle")
			var btn = "middle";
		else if(inSender.name == "kbdRight")
			var btn = "right";

		if(this._modifiers[btn].state == 0) {
			action = "?down=" + this._modifiers[btn].keys[this._modifiers[btn].state + 1].id;

			this._modifiers[btn].state = 1;
		} else if(this._modifiers[btn].state < (this._modifiers[btn].keys.length - 1)) {
			action = "?up=" + this._modifiers[btn].keys[this._modifiers[btn].state].id +
				"&down=" + this._modifiers[btn].keys[this._modifiers[btn].state + 1].id;

			this._modifiers[btn].state++;
		} else if(this._modifiers[btn].state == (this._modifiers[btn].keys.length - 1)) {
			action = "?up=" + this._modifiers[btn].keys[this._modifiers[btn].state].id;

			this._modifiers[btn].state = 0;
		}

		inSender.setCaption(this._modifiers[btn].keys[this._modifiers[btn].state].label);

		if(this._modifiers[btn].state)
			inSender.setDown(true);
		else
			inSender.setDown(false);

		this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/keyboard" + action, 
			onSuccess: "handleDeviceStatus"});
	},

	handleKeyUp: function(inSender, inEvent) {
		enyo.stopEvent(inEvent);

		var keys = {
			"1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "0": "0", 
			"q": "q", "w": "w", "e": "e", "r": "r", "t": "t", "y": "y", "u": "u", "i": "i", "o": "o", "p": "p", "å": "å", 
			"a": "a", "s": "s",  "d": "d", "f": "f", "g": "g", "h": "h", "j": "j",  "k": "k", "l": "l", "ö": "ö", "ä": "ä", 
			"z": "z", "x": "x", "c": "c", "v": "v", "b": "b", "n": "n", "m": "m", 
			"Q": "q", "W": "w", "E": "e", "R": "r", "T": "t", "Y": "y", "U": "u", "I": "i", "O": "o", "P": "p", "Å": "å", 
			"A": "a", "S": "s",  "D": "d", "F": "f", "G": "g", "H": "h", "J": "j",  "K": "k", "L": "l", "Ö": "ö", "Ä": "ä", 
			"Z": "z", "X": "x", "C": "c", "V": "v", "B": "b", "N": "n", "M": "m", 
			"/": "slash", "+": "plus", "(": "parenleft", ")": "parenright", "%": "percent", "\"": "quotedbl", "=": "equal", 
			"&": "ampersand", "-": "minus", "$": "dollar", "!": "exclam", ":": "colon", "'": "apostrophe", "*": "asterisk", 
			"#": "numbersign", "?": "question", ";": "semicolon", "_": "underscore", ",": "comma", ".": "period", "at": "at", 
			"Space": "space", "Backspace": "BackSpace", "Enter": "Return"
		};

		var fnKeys = {
			"1": "F1", "2": "F2", "3": "F3", "4": "F4", "F5": "5", "6": "F6", "7": "F7", "8": "F8", "9": "F9", "0": "F10", 
			"e": "F1", "r": "F2", "t": "F3", "d": "F4", "f": "F5", "g": "F6", "x": "F7", "c": "F8", "v": "F9", "@": "F10", 
			"E": "F1", "R": "F2", "T": "F3", "D": "F4", "F": "F5", "G": "F6", "X": "F7", "C": "F8", "V": "F9", 
			"q": "F11", "Q": "F11", "w": "F12", "W": "F12", "b": "Left", "B": "Left", "j": "Up", "J": "Up", "n": "Down", 
			"N": "Down", "m": "Right", "M": "Right", "y": "Home", "Y": "Home", "h": "End", "H": "End", "u": "Insert", 
			"U": "Insert", "i": "Page_Up", "I": "Page_Up", "k": "Page_Down", "K": "Page_Down", "Space": "Tab", 
			"Backspace": "Delete", "Enter": "Escape"
		};

		if(inEvent.keyCode == 8)
			var key = "Backspace";
		else if(inEvent.keyCode == 13)
			var key = "Enter";
		else if(inEvent.keyCode == 32)
			var key = "Space";
		else if(inEvent.keyCode == 48)
			var key = "@";
		else if(inEvent.keyCode == 49)
			var key = "!";
		else if(inEvent.keyCode == 52)
			var key = "$";
		else if(inEvent.keyCode == 53)
			var key = "%";
//		else if(inEvent.keyCode == 66)
//			var key = "#";
//		else if(inEvent.keyCode == 90)
//			var key = "*";
		else if(inEvent.keyCode == 222)
			var key = "\"";
		else
			var key = String.fromCharCode(inEvent.keyCode);

		if(((!this._function) && (keys[key])) || ((this._function) && (fnKeys[key]))) {
			if(!this._function) {
				if((this._shift) || (inEvent.keyCode == 8) || (inEvent.keyCode == 13) || (inEvent.keyCode == 32))
					this.$.keyboardInput.setValue(key);
				else
					this.$.keyboardInput.setValue(key.toLowerCase());

				this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/keyboard?key=" + keys[key], 
					onSuccess: "handleDeviceStatus"});
			} else {
				this.$.keyboardInput.setValue(fnKeys[key].replace("_", " "));

				this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/keyboard?key=" + fnKeys[key], 
					onSuccess: "handleDeviceStatus"});
			}
		} else if(inEvent.keyCode == 16) {
			this._shift = false;

			this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/keyboard?up=Shift_L", 
				onSuccess: "handleDeviceStatus"});
		} else if(inEvent.keyCode != 129)
			this.$.keyboardInput.setValue("<Unknown Key>");
	},

	handleKeyDown: function(inSender, inEvent) {
		enyo.stopEvent(inEvent);

		if(inEvent.keyCode == 16) {
			var key = "Shift";

			this._shift = true;

			this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/keyboard?down=Shift_L", 
				onSuccess: "handleDeviceStatus"});
		}
	},

	resetMouseEvent: function(inSender, inEvent) {
		this._event = inEvent;
	},

	resetMouseButton: function(inSender, inEvent) {
		if(this._button != 0) {
			this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/mouse?up=" + this._button, 
				onSuccess: "handleDeviceStatus"});
		}
	},

	handleMouseMove: function(inSender, inEvent) {
		var x = inEvent.screenX - this._event.screenX;

		var y = inEvent.screenY - this._event.screenY;

		this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/mouse?move=" + x + "," + y, 
			onSuccess: "handleDeviceStatus"});

		this._event = inEvent;
	},

	handleMouseDown: function(inSender, inEvent) {
		if(inSender.name == "mouseLeft")
			this._button = 1;
		else if(inSender.name == "mouseMiddle")
			this._button = 2;
		else if(inSender.name == "mouseRight")
			this._button = 3;

		this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/mouse?down=" + this._button, 
			onSuccess: "handleDeviceStatus"});
	},

	handleMouseUp: function(inSender, inEvent) {
		if(inSender.name == "mouseLeft")
			var button = 1;
		else if(inSender.name == "mouseMiddle")
			var button = 2;
		else if(inSender.name == "mouseRight")
			var button = 3;

		this.$.serverRequest.call({}, {url: "http://" + this.address + "/" + this.module + "/mouse?up=" + button, 
			onSuccess: "handleDeviceStatus"});
	},

	handleDeviceStatus: function(inSender, inResponse) {
		enyo.error("DEBUG - " + enyo.json.stringify(inResponse));

		if(inResponse) {
			this.doUpdate("online");

			if(inResponse.modifiers) {
				this._modifiers = inResponse.modifiers;

				this.$.kbdLeft.setCaption(this._modifiers.left.keys[this._modifiers.left.state].label);

				if(this._modifiers.left.state)
					this.$.kbdLeft.setDown(true);
				else
					this.$.kbdLeft.setDown(false);

				this.$.kbdMiddle.setCaption(this._modifiers.middle.keys[this._modifiers.middle.state].label);

				if(this._modifiers.middle.state)
					this.$.kbdMiddle.setDown(true);
				else
					this.$.kbdMiddle.setDown(false);

				this.$.kbdRight.setCaption(this._modifiers.right.keys[this._modifiers.right.state].label);

				if(this._modifiers.right.state)
					this.$.kbdRight.setDown(true);
				else
					this.$.kbdRight.setDown(false);
			} else {
				this.$.keyboardDivider.hide();
				this.$.keyboardControl.hide();
			}

			if(inResponse.buttons) {
				this._buttons = inResponse.buttons;
			} else {
				this.$.mouseDivider.hide();
				this.$.mouseControl.hide();

				this.$.mouseLeft.hide();
				this.$.mouseMiddle.hide();
				this.$.mouseRight.hide();

				this.$.kbdLeft.show();
				this.$.kbdMiddle.show();
				this.$.kbdRight.show();
			}
		} else
			this.doUpdate("offline");
	},

	handleServerError: function(inSender, inResponse) {
		enyo.error("DEBUG - " + enyo.json.stringify(inResponse));

		this.doUpdate("offline");
	}
});

