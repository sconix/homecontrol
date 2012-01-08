enyo.kind({
	name: "Startup",
	kind: enyo.VFlexBox,
	flex: 1,
	className: "basic-back",
	
	events: {
		onDone: ""
	},
	
	components: [
		{name: "startupView", layoutKind: "VFlexLayout", flex: 1, components: [
			{name: "startupHeader", kind: "CustomPageHeader", taglines: [{weight: 100, text: "Welcome to Home Controller!"}]},

			{layoutKind: "VFlexLayout", flex: 1, align: "left", style: "padding-right: 10px; font-size: 14px;", components: [
				{name: "startupScroller", kind: "Scroller", height: "613px", components: [
					{name: "instructions", content: "<br><center><b>Here is some basic information for new users:</b></center><ul>" +
						"<li>Some of the controllers can control devices directly, some need a server side application</li>" +
						"<li>It is recommended to update the server side application when ever you update this application</li>" +
						"<li>Refer to the wiki on how to configure the required device/server side for the controllers</li>" +
						"</ul><br>"},

					{kind: "Divider", caption: "0.8.4"},
					{content: "<ul><li>Fixed bug concerning the UI rotation on TouchPad</li></ul>"},

					{kind: "Divider", caption: "0.8.3"},
					{content: "<ul><li>Several user interface fixes / changes for TouchPad</li>" +
						"<li>Fixed other than Home Control servers not beeing saved bug</li>" +
						"<li>Added support for Windows volume control (server side)</li></ul>"},

					{kind: "Divider", caption: "0.8.2"},
					{content: "<ul><li>Fixed bug that caused spinner to stop too early</li></ul>"},

					{kind: "Divider", caption: "0.8.1"},
					{content: "<ul><li>Fixed small bug in manual adding of servers</li></ul>"},

					{kind: "Divider", caption: "0.8.0"},
					{content: "<ul><li>First public release of Home Control</li>" +
						"<li>Fixed the scroller in media center user interface</li>" +
						"<li>Added informative popups/spinner for server scanning</li>" +
						"<li>Added keyboard controller for OS X (mouse coming later)</li></ul>"},

					{kind: "Divider", caption: "0.7.9"},
					{content: "<ul><li>Fixed mute toggling in MPD controller</li>" +
						"<li>Added progress bar support for QuickTime Player</li>" +
						"<li>Added request timeouts to get rid of false statuses</li>" +
						"<li>Fixed path for pulseaudio control script</li></ul>"},

					{kind: "Divider", caption: "0.7.8"},
					{content: "<ul><li>Added better controls for Totem</li>" +
						"<li>Added playlist and media library views for VLC</li>" +
						"<li>Lots of small bug fixes and code cleanups</li></ul>"},

					{kind: "Divider", caption: "0.7.7"},
					{content: "<ul><li>Fixed few bugs on both client and server</li></ul>"},

					{kind: "Divider", caption: "0.7.6"},
					{content: "<ul><li>Couple bug fixes for music players</li>" + 
						"<li>Added possibility to turn controllers on/off</li>" +
						"<li>Fixed multi word search for MPD music player</li>" +
						"<li>New controls / servers configuration logic</li></ul>"},

					{kind: "Divider", caption: "0.7.5"},
					{content: "<ul><li>Lots of bug fixes for music players</li>" + 
						"<li>Added progress bar for music players</li></ul>"},

					{kind: "Divider", caption: "0.7.4"},
					{content: "<ul><li>Added support for Banshee music player</li></ul>"},

					{kind: "Divider", caption: "0.7.3"},
					{content: "<ul><li>Added seek fwd/bwd support for MPD and iTunes</li>" +
						"<li>Fine tuned the music player user interface</li></ul>"},

					{kind: "Divider", caption: "0.7.2"},
					{content: "<ul><li>Added showing of current song in play queue</li>" +
						"<li>Added queue / playlists / search features for iTunes</li></ul>"},

					{kind: "Divider", caption: "0.7.1"},
					{content: "<ul><li>Added queue / playlists / search features for MPD</li></ul>"},

					{kind: "Divider", caption: "0.7.0"},
					{content: "<ul><li>Added support for controlling QuickTime on OS X</li>" +
						"<li>Added experimental support for touchpad surveillance</li>" +
						"<li>Added experimental support for controlling mouse on OS X</li>" +
						"<li>Added support for controlling front row application on OS X</li>" + 
						"<li>Added support for controlling system volume on Linux / OS X</li></ul>"},

					{kind: "Divider", caption: "0.6.0"},
					{content: "<ul><li>Added support for controlling VLC media player</li>" +
						"<li>Added surveillance extension with support for Cisco IP camera</li>" +
						"<li>Added support for controlling iTunes on a OS X operating system</li>" +
						"<li>Added support for controlling mouse and keyboard on Linux</li></ul>"},

					{kind: "Divider", caption: "0.5.2"},
					{content: "<ul><li>Small changes / fixes for the user interface</li></ul>"},

					{kind: "Divider", caption: "0.5.1"},
					{content: "<ul><li>Fixed the application and package ID to be correct</li></ul>"},
					
					{kind: "Divider", caption: "0.5.0"},
					{content: "<ul><li>First beta release with basic controlling support</li></ul>"},
				]}
			]},
		
			{kind: "Toolbar", pack: "center", className: "enyo-toolbar-light", components: [
				{kind: "Button", caption: "Ok, I've read this. Let's continue ...", onclick: "handleDoneReading"}
			]}
		]}
	],

	adjustInterface: function(inSize) {
		this.$.startupScroller.applyStyle("height", (inSize.h - 87) + "px");
	},
	
	hideWelcomeText: function() {
		this.$.instructions.hide();

		this.$.startupHeader.setTagLine("Have you already <a href=\"https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=7A4RPR9ZX3TYS&lc=FI&item_name=For%20Home%20Control&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted\">donated</a>?");
	},
	
	handleDoneReading: function(inSender, inEvent) {
		this.doDone();
	}
});

