enyo.kind({
	name: "Surveillance",
	kind: enyo.Control,
	layoutKind: "VFlexLayout",
	
	_config: {},

	_sensors: [],
	
	_selected: 0,
   
   _timeout: null,
    
    _shot: undefined,
    _timestamps: [],
    
    _sensitivity: 50,
    
    _dockMode: false,
    
    _state: "playing",

	events: {
		onUpdate: ""
	},
	
	published: {
		title: "",
		module: "",
		address: ""
	},
	
	components: [
		{kind: "ApplicationEvents", onWindowActivated: "windowActivate", onWindowDeactivated: "windowDeactivate"},	

		{name: "fullscreenPopup", kind: "Popup", lazy: false, layoutKind: "VFlexLayout",  
			style: "width: 100%; height: 100%;", components: [
			{kind: "Scroller", flex: 1, components: [
				{name: "fsImage", kind: "SizeableImage", autoSize: true, src: ""}
			]},
			{kind: "Button", caption: "Close", style: "margin: 10px auto 0px auto; width: 80px;", onclick: "closeFullscreen"}
		]},

		{kind: "PageHeader", layoutKind: "VFlexLayout", components: [
				{name: "title", content: "Surveillance", style: "margin-top: 0px;font-weight: bold;"},
		]},

		{layoutKind: "VFlexLayout", flex: 1, components: [
			{kind: "Scroller", autoVertical: true, autoHorizontal: false, horizontal: false, flex: 1, components: [
				{layoutKind: "VFlexLayout", flex: 1, components: [
					{name: "client", layoutKind: "VFlexLayout", flex: 1, components: [
						{name: "captureStatus", kind: "Divider", caption: "Offline", open: true},
						{name: "imageView", layoutKind: "VFlexLayout", style: "padding: 5px 15px;", components: [
							{layoutKind: "VFlexLayout", style: "max-width: 290px;margin: 5px auto 0px auto;", components: [
								{name: "imageObject", kind: "CustomCanvas", style: "display: none;"},
								{name: "clientImage", layoutKind: "HFlexLayout", components: [
									{name: "image", kind: "Image", autoSize: true, src: "", style: "max-width: 225px;"}
								]},
								{name: "clientText", style: "font-size: 14px;text-align: justify;", content: "No surveillance data available. " +
									"To get surveillance images you need to turn on surveillance on your TouchPad."},
								{name: "serverImage", layoutKind: "VFlexLayout", components: [
									{layoutKind: "HFlexLayout", components: [
										{name: "image1", kind: "Image", autoSize: true, src: "", style: "max-width: 140px;margin-right: 5px;"},
										{name: "image2", kind: "Image", autoSize: true, src: "", style: "max-width: 140px;margin-left: 5px;"}
									]},						
									{layoutKind: "HFlexLayout", components: [
										{content: "Difference:", flex: 1, style: "text-effect: bold;"},
										{name: "difference", content: "-"}
									]}
								]}
							]}
						]},
						{name: "videoView", layoutKind: "VFlexLayout", style: "padding: 5px 15px;", components: [
							{layoutKind: "VFlexLayout", style: "max-width: 290px;margin: 5px auto 0px auto;", components: [
								{name: "videoObject", kind: "Video", src: "",
									 showControls: false, width: "320px", height: "480px", style: "position: absolute; left: 64px; top: 84px;"}
							 ]}
						]}				
					]},

					{name: "server", layoutKind: "VFlexLayout", flex: 1, components: [
						{kind: "Divider", caption: "Alert Settings", open: true},
						{layoutKind: "VFlexLayout", style: "padding: 5px 15px;", components: [
							{layoutKind: "VFlexLayout", style: "max-width: 290px;margin: 5px auto 0px auto;", components: [
								{layoutKind: "HFlexLayout", pack: "center", components: [
									{content: "Alert Threshold:", flex: 1, style: "text-effect: bold;"},
									{kind: "ListSelector", value: 100, onChange: "itemChanged", items: [
										{caption: "High (1000)", value: 1000},
										{caption: "Medium (500)", value: 500},
										{caption: "Low (100)", value: 100},
									]},
								]},				
								{layoutKind: "HFlexLayout", components: [
									{kind: "ToolInput", hint: "Email address for alerts...", flex: 1, alwaysLooksFocused: true, onchange: "inputChange"}
								]}
							]}
						]},
						{kind: "Divider", caption: "Capture Settings", open: true},
						{layoutKind: "VFlexLayout", style: "padding: 5px 15px;", components: [
							{layoutKind: "VFlexLayout", style: "max-width: 290px;margin: 5px auto 0px auto;", components: [
								{layoutKind: "HFlexLayout", pack: "center", components: [
									{content: "Frequency:", flex: 1, style: "text-effect: bold;"},
									{kind: "ListSelector", value: 5, onChange: "itemChanged", items: [
										{caption: "High (5s)", value: 5},
										{caption: "Medium (15s)", value: 15},
										{caption: "Low (30s)", value: 30},
									]}
								]},
								{layoutKind: "HFlexLayout", pack: "center", components: [
									{content: "Sensitivity:", flex: 1, style: "text-effect: bold;"},
									{kind: "ListSelector", value: 50, onChange: "itemChanged", items: [
										{caption: "High (200)", value: 200},
										{caption: "Medium (100)", value: 100},
										{caption: "Low (50)", value: 50},
									]},
								]}
							]}
						]}
					]}
				]}
			]},
		        
			{kind: "Toolbar", pack: "center", className: "enyo-toolbar-light", components: [
		         /* For now, hide play/pause. It seems to interact poorly in Enyo. :( */
		         /*{name: "videoPlayPause", kind: "ToolButton", icon: "./images/ctl-pause.png", onclick: "controlVideo"},*/
		         {name: "videoFullscreen", kind: "ToolButton", icon: "./images/ctl-fullscreen.png", onclick: "controlVideo"},
			]}
		]},
        
      {name: "applicationManager", kind: "PalmService", service: "palm://com.palm.applicationManager", method: "open",
          onSuccess: "gotAccounts", onFailure: "handleServerError"
      },

//		{name: "mediaCapture", kind: "enyo.MediaCapture", onInitialized: "loadMediaCap", onLoaded: "mediaCapLoaded", 
//			onImageCaptureComplete: "imageCaptured", onError: "handleServerError"},
			
		{name : "uploadFile", kind : "PalmService", service : "palm://com.palm.downloadmanager/", method : "upload",
			onFailure : "handleServerError"},
			
		{name: "serverRequest", kind: "WebService", timeout: 3000, onSuccess: "handleStatus", onFailure: "handleServerError"}
	],
	
	rendered: function() {
		var device = enyo.fetchDeviceInfo().modelNameAscii.toLowerCase();

		this.$.clientText.hide();

		if(this.module == "cisco") {
			this.$.clientText.setContent("This controller will be enabled in next release...");
			
			this.$.server.hide();
			this.$.serverImage.hide();
			this.$.videoObject.hide();
			this.$.clientText.show();
/*
			this.$.imageView.hide();	
			
			this.$.server.hide();				
*/
		} else {
			this.$.videoObject.hide();

			if(device != "touchpad") {
				var date = new Date();

				this.$.server.hide();

				this.$.serverImage.hide();
			
				this.checkStatus();
			} else {
				this.$.clientText.setContent("This controller will be enabled in next release...");
			
				this.$.server.hide();
				this.$.serverImage.hide();
				this.$.clientText.show();
/*
				this.$.clientImage.hide();
			
				this.$.imageObject.rendered();
		
				this.img1 = new Image();
				this.img2 = new Image();

				this.img1.onload = null;
				this.img2.onload = function() {
					if(this.img1 != null) {
						var difference = this.compareImages();

						this.$.difference.setContent(difference);
					}
				}.bind(this);
*/				
			}
		}
	},
    
	selected: function(visible) {
		var device = enyo.fetchDeviceInfo().modelNameAscii.toLowerCase();

		if(visible == true) {
			this.$.title.setContent(this.title);

			if(this.module == "cisco") {
				this.pauseVideo();

				this.playVideo();
			} else {
				if(device == "touchpad") {
					return;
				
					this._shot = undefined;
			
					this.$.mediaCapture.initialize();			
				} else {
					this.checkStatus();
				}
			}			
		} else if(visible == false) {
			if(this.module == "cisco")
	        this.pauseVideo();
		} else if(visible == null) {
			if(this.module == "cisco")
	        this.pauseVideo();

			if(this._timeout)
				clearTimeout(this._timeout);			
		}
	},

	checkStatus: function() {
		var date = new Date();

		this.$.image.setSrc("http://" + this.address + "/surveillance/latest?timestamp=" + date.getTime());

		this.$.serverRequest.call({}, {url: "http://" + this.address + "/surveillance/status"});
		
		if(this._timeout)
			clearTimeout(this._timeout);

		this._timeout = setTimeout(this.checkStatus.bind(this), 5000);
	},

	handleStatus: function(inSender, inResponse) {
		enyo.error("DEBUG: " + enyo.json.stringify(inResponse));

		if(inResponse) {
			this.$.captureStatus.setCaption(enyo.cap(inResponse.state));
	
   	 	this.doUpdate(inResponse.state);
   	 	
   	 	if(inResponse.state == "idle") {
				this.$.clientText.show();
				this.$.clientImage.hide();				
			} else {
				this.$.clientText.hide();			
				this.$.clientImage.show();				
			}				
   	 } else {
			this.$.captureStatus.setCaption("Offline");
	
	    	this.doUpdate("offline");
  		}   	 
	},

	windowActivate: function(inSender, inEvent) {
		enyo.error("OOO1 " + enyo.windowParams.dockMode);
	},
	
	windowDeactivate: function(inSender, inEvent) {
		enyo.error("OOO2");
	},	

	closeFullscreen: function() {
		this.$.fullscreenPopup.close();
	},

	loadMediaCap: function(inSender, inResponse) {
		for (var format in inResponse){
		   if(format.search("video")==0){
				for(i = 0;  i < inResponse[format].supportedImageFormats.length; i++) {
					fmt = inResponse[format].supportedImageFormats[i];

					if (fmt.mimetype == "image/jpeg")
						break;
				}

				this.$.mediaCapture.load(inResponse[format].deviceUri, fmt);
				
				break;
			}
		}
	},
	
	mediaCapLoaded: function() {
		if(this._shot == undefined) {
			this._shot = 0;
			
			this.captureImage(0);
		}
	},

	imageCaptured: function() {
		this.$.captureStatus.setCaption("Offline");
	
    	this.doUpdate("offline");

		this.$.uploadFile.call({
			"fileName": "/media/internal/test-" + this._timestamps[this._shot] + ".jpg",
			"fileLabel":"file",
			"url": "http://" + this.address + "/uploads",
			"contentType": "image/jpg",
			"subscribe": true 
		});	

		if(!this._shot) {
			this._shot = 1;

			this.img1.src = "/media/internal/test-" + this._timestamps[1] + ".jpg";
			this.img2.src = "/media/internal/test-" + this._timestamps[0] + ".jpg";
	
			this.$.image1.setSrc("/media/internal/test-" + this._timestamps[1] + ".jpg");
			this.$.image2.setSrc("/media/internal/test-" + this._timestamps[0] + ".jpg");
				
			setTimeout(this.captureImage.bind(this, 1), 5000);
		} else {
			this._shot = 0;

			this.img1.src = "/media/internal/test-" + this._timestamps[0] + ".jpg";
			this.img2.src = "/media/internal/test-" + this._timestamps[1] + ".jpg";

			this.$.image1.setSrc("/media/internal/test-" + this._timestamps[0] + ".jpg");
			this.$.image2.setSrc("/media/internal/test-" + this._timestamps[1] + ".jpg");

			if(this._dockMode)
				setTimeout(this.capture.bind(this, 0), 5000);
		}
	},

	captureImage: function(image) {
		this.$.captureStatus.setCaption("Capturing");
		
    	this.doUpdate("capturing");
	
		this._timestamps[image] = (new Date()).getTime();
	
		this.$.mediaCapture.startImageCapture("/media/internal/test-" + this._timestamps[image] + ".jpg", 
			{orientation: 2,'quality': 100, 'flash': false, 'reviewDuration': 5, 'exifData': {}});
	},

	compareImages: function() {
	  var difference = 0;

	  var canvas = this.$.imageObject.getCanvas();
	  var context = this.$.imageObject.getContext();

	  var width = canvas.width / 2;
	  var height = canvas.height / 2;

	  context.drawImage(this.img1, 0, 0, width, height);
	  context.drawImage(this.img2, width, 0, width, height);

	  var imgData1 = context.getImageData(0, 0, width, height);
	  var imgData2 = context.getImageData(width, 0, width, height);

	  var imgDiffResult = context.getImageData(0, 0, width, height);
	  
	  for(var x = 0; x < imgData1.width; x++) {
	    for(var y = 0; y < imgData1.height; y++) {
	      var pos = x * 4 + y * 4 * imgData1.width;

			for(var rgba = 0; rgba < 3; rgba++) {
				if(Math.abs(imgData1.data[pos] - imgData2.data[pos]) < this._sensitivity)
					imgDiffResult.data[pos + rgba] = 0;
				else 
					imgDiffResult.data[pos + rgba] = 255;
			}
			
			imgDiffResult.data[pos + 3] = 255; // Alpha always 255
				
	      // count differing pixels
	      difference += Math.min(1, imgDiffResult.data[pos] + imgDiffResult.data[pos + 1] + imgDiffResult.data[pos + 2]);
	    }
	  }
	
	  context.putImageData(imgDiffResult, width / 2, height);
	
	  return difference;
	},
    
    playVideo: function() {
        switch (this.module) {
            case "cisco":
                this.$.videoObject.src = "rtsp://" + this.address + "/img/video.sav";
                break;
            default:
                break;
        }
        this.$.videoObject.srcChanged();
        
        this.$.videoObject.play();
    },

    pauseVideo: function() {
        this.$.videoObject.pause();
    },

    controlVideo: function(inSender, inEvent) {
        if(inSender.name == "videoPlayPause") {
			if(this._state == "paused") {
                this._state = "playing";
				this.$.videoPlayPause.setIcon("./images/ctl-pause.png");
                
                this.$.videoObject.play();
			} else {
                this._state = "paused";
				this.$.videoPlayPause.setIcon("./images/ctl-play.png");
                
                this.$.videoObject.pause();
			}
		} else if (inSender.name == "videoFullscreen") {
			if(this.module == "cisco") {
		     this.$.applicationManager.call({target: this.$.videoObject.src});
		    } else {
				if(this._shot == undefined)
					this.$.fsImage.setSrc("http://" + this.address + "/surveillance/latest");			
				else if(this._shot == 1)
						this.$.fsImage.setSrc("/media/internal/test-" + this._timestamps[0] + ".jpg");
					else if(this._shot == 0)
						this.$.fsImage.setSrc("/media/internal/test-" + this._timestamps[1] + ".jpg");
					
			    this.$.fullscreenPopup.openAtCenter();	
		    }
        }
    },
    
    handleServerError: function(inSender, inResponse) {
		enyo.error("DEBUG: " + enyo.json.stringify(inResponse));

    	this.doUpdate("offline");
    }
});

