/*
 * Copyright (c) 2008 Panagiotis Astithas
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * */

var firestatus = {
	cons: null,
	prefs: null,
	twitterEnabled: false,
	twitterUpdatesEnabled: false,
	twitterUsername: "",
	twitterPassword: "",
	twitterTimeoutId: 0,
	twitterTimeout: 300,
	lastTwitterId: 0,
	friendfeedEnabled: false,
	friendfeedUpdatesEnabled: false,
	friendfeedUsername: "",
	friendfeedPassword: "",
	friendfeedTimeoutId: 0,
	friendfeedTimeout: 300,
	lastFriendfeedId: 0,

	onLoad: function(){
		// Initialization code
		this.initialized = true;
		this.strings = document.getElementById("firestatus-strings");
		
	    this.cons = Components.classes["@mozilla.org/consoleservice;1"].
        			getService(Components.interfaces.nsIConsoleService);


		if ("@mozilla.org/passwordmanager;1" in Components.classes) {
		   // Password Manager exists so this is not Firefox 3 (could be Firefox 2, Netscape, SeaMonkey, etc).
		   // Password Manager code
		}
		else if ("@mozilla.org/login-manager;1" in Components.classes) {
		   // Login Manager exists so this is Firefox 3
		   // Login Manager code
		}
		
		// Register to receive notifications of preference changes
	    this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
	        .getService(Components.interfaces.nsIPrefService)
	        .getBranch("extensions.firestatus.");
	    this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
	    this.prefs.addObserver("", this, false);
	    
	    this.twitterEnabled = this.prefs.getBoolPref("twitterEnabled");
	    this.twitterUpdatesEnabled = this.prefs.getBoolPref("twitterUpdatesEnabled");
	    this.twitterUsername = this.prefs.getCharPref("twitterUsername");
	    this.twitterPassword = this.prefs.getCharPref("twitterPassword");
	    this.twitterTimeout = this.prefs.getIntPref("twitterTimeout");
	    this.lastTwitterId = this.prefs.getIntPref("lastTwitterId");
		
		if (this.twitterUpdatesEnabled) {
			this.twitterUpdates();
			this.twitterTimeoutId = window.setInterval(this.twitterUpdates, this.twitterTimeout*1000);
		}
		
	    this.friendfeedEnabled = this.prefs.getBoolPref("friendfeedEnabled");
	    this.friendfeedUpdatesEnabled = this.prefs.getBoolPref("friendfeedUpdatesEnabled");
	    this.friendfeedUsername = this.prefs.getCharPref("friendfeedUsername");
	    this.friendfeedPassword = this.prefs.getCharPref("friendfeedPassword");
	    this.friendfeedTimeout = this.prefs.getIntPref("friendfeedTimeout");
	    this.lastFriendfeedId = this.prefs.getIntPref("lastFriendfeedId");
		
		if (this.friendfeedUpdatesEnabled) {
			this.friendfeedUpdates();
			this.friendfeedTimeoutId = window.setInterval(this.friendfeedUpdates, this.friendfeedTimeout*1000);
		}
		
	    this.cons.logStringMessage("firestatus.lastFriendfeedId: "+firestatus.lastFriendfeedId);
	},
	
	onUnload: function() {
		this.prefs.removeObserver("", this);
	},
	
	observe: function(subject, topic, data) {
		if (topic != "nsPref:changed") {
			return;
		}
		
		switch(data) {
			case "twitterEnabled":
		    	this.twitterEnabled = this.prefs.getBoolPref("twitterEnabled");
		    	break;
			case "twitterUpdatesEnabled":
		    	this.twitterUpdatesEnabled = this.prefs.getBoolPref("twitterUpdatesEnabled");
				if (this.twitterUpdatesEnabled) {
					this.twitterUpdates();
			        this.twitterTimeoutId = window.setInterval(this.twitterUpdates, this.twitterTimeout*1000);
				} else
					this.cancelUpdates("twitter");
		    	break;
			case "twitterUsername":
		    	this.twitterUsername = this.prefs.getCharPref("twitterUsername");
		    	break;
			case "twitterPassword":
		    	this.twitterPassword = this.prefs.getCharPref("twitterPassword");
		    	break;
			case "twitterTimeout":
		    	this.twitterTimeout = this.prefs.getIntPref("twitterTimeout");
				if (this.twitterUpdatesEnabled) {
					this.cancelUpdates("twitter");
			        this.twitterTimeoutId = window.setInterval(this.twitterUpdates, this.twitterTimeout*1000);
				}
		    	break;
			case "friendfeedEnabled":
		    	this.friendfeedEnabled = this.prefs.getBoolPref("friendfeedEnabled");
		    	break;
			case "friendfeedUpdatesEnabled":
		    	this.friendfeedUpdatesEnabled = this.prefs.getBoolPref("friendfeedUpdatesEnabled");
				if (this.friendfeedUpdatesEnabled) {
					this.friendfeedUpdates();
			        this.friendfeedTimeoutId = window.setInterval(this.friendfeedUpdates, this.friendfeedTimeout*1000);
				} else
					this.cancelUpdates("friendfeed");
		    	break;
			case "friendfeedUsername":
		    	this.friendfeedUsername = this.prefs.getCharPref("friendfeedUsername");
		    	break;
			case "friendfeedPassword":
		    	this.friendfeedPassword = this.prefs.getCharPref("friendfeedPassword");
		    	break;
			case "friendfeedTimeout":
		    	this.friendfeedTimeout = this.prefs.getIntPref("friendfeedTimeout");
				if (this.friendfeedUpdatesEnabled) {
					this.cancelUpdates("friendfeed");
			        this.friendfeedTimeoutId = window.setInterval(this.friendfeedUpdates, this.friendfeedTimeout*1000);
				}
		    	break;
		}
	},
	
	cancelUpdates: function(service) {
		switch(service) {
			case "twitter":
				window.clearInterval(this.twitterTimeoutId);
				break;
			case "friendfeed":
				window.clearInterval(this.friendfeedTimeoutId);
				break;
		}
	},
  
	twitterUpdates: function() {
		var FRIENDS_URL = 'http://twitter.com/statuses/friends_timeline.json';
	    var req = new XMLHttpRequest();
	    req.open('GET', FRIENDS_URL, true);
	    req.onreadystatechange = function (aEvt) {
	      if (req.readyState == 4) {
	             if(req.status == 200) {
	                    var jsonString = req.responseText;
						var statuses = eval('(' + jsonString + ')');
						if (statuses.length == 0)
							return;
						// Sort the status updates, oldest first.
						statuses.sort(function(a, b) {
										return a.id - b.id;
									});
						for (var i = 0; i < statuses.length; i++) {
							var status = statuses[i];
							if (status.id <= firestatus.lastTwitterId)
								continue;
		                    try {
								if ("@mozilla.org/alerts-service;1" in Components.classes) {
									var alertService = Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
									if (alertService) {
										alertService.showAlertNotification(status.user.profile_image_url, status.user.name, status.text, false, "", null);
									}
									else {
										firestatus.cons.logStringMessage("alertsService failure: could not getService nsIAlertsService");
									}
								}
		                     } catch(e) {
		                            firestatus.cons.logStringMessage("alertsService failure: " + e);
		                     }
						}
						firestatus.lastTwitterId = status.id;
	             } else
	             	firestatus.cons.logStringMessage("Error loading page\n");
	      }
	    };
	    var auth = firestatus.twitterUsername+":"+firestatus.twitterPassword;
	    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	    req.send(null);
	},
	
	friendfeedUpdates: function() {
		var FRIENDS_URL = 'http://friendfeed.com/api/feed/home?num=1';
	    var req = new XMLHttpRequest();
	    req.open('GET', FRIENDS_URL, true);
	    req.onreadystatechange = function (aEvt) {
	      if (req.readyState == 4) {
	             if(req.status == 200) {
	                    var jsonString = req.responseText;
						var statuses = eval('(' + jsonString + ')').entries;
						if (statuses.length == 0)
							return;
						// Sort the status updates, oldest first.
						statuses.sort(function(a, b) {
										return a.id - b.id;
									});
						firestatus.cons.logStringMessage('lastFriendfeedId: '+firestatus.lastFriendfeedId);
						var status = statuses[0];
						if (status.id != firestatus.lastFriendfeedId) {
							dump('New FF update: '+status.id);
							// TODO: Fetch the page title for the link
							var text = status.title;
		                    try {
								if ("@mozilla.org/alerts-service;1" in Components.classes) {
									var alertService = Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
									if (alertService) {
										alertService.showAlertNotification(status.service.iconUrl, status.user.name, text, false, "", null);
									}
									else {
										firestatus.cons.logStringMessage("alertsService failure: could not getService nsIAlertsService");
									}
								}
		                     } catch(e) {
		                            firestatus.cons.logStringMessage("alertsService failure: " + e);
		                     }
							firestatus.lastFriendfeedId = status.id;
						}
	             } else
	             	firestatus.cons.logStringMessage("Error loading page\n");
	      }
	    };
	    var auth = firestatus.friendfeedUsername+":"+firestatus.friendfeedPassword;
	    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	    req.send(null);
	}

};
window.addEventListener("load", function(e) { firestatus.onLoad(e); }, false);
window.addEventListener("unload", function(e) { firestatus.onUnload(e); }, false);


