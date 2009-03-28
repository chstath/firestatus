/* -*- mode: JavaScript; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*- */
/* ex: set tabstop=4 expandtab: */
/*
 * Copyright (c) 2008 Panagiotis Astithas, Christos V. Stathis
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
 */

Components.utils.import("resource://firestatus/queue.js");

var firestatus = {
	TWITTER_URL: 'http://twitter.com',
	TWITTER_URL_S: 'https://twitter.com',
	FRIENDFEED_URL: 'http://friendfeed.com',
	FACEBOOK_URL: 'http://facebook.com',
	DELICIOUS_URL_S: 'https://api.del.icio.us',
	IDENTICA_URL: 'http://identi.ca',
	cons: null,
	prefs: null,
	twitterEnabled: false,
	twitterUpdatesEnabled: false,
	twitterUsername: "",
	twitterPassword: "",
	twitterTimeoutId: 0,
	twitterTimeout: 5,
	friendfeedEnabled: false,
	friendfeedUpdatesEnabled: false,
	friendfeedUsername: "",
	friendfeedPassword: "",
	friendfeedTimeoutId: 0,
	friendfeedTimeout: 4,
	facebookEnabled: false,
	facebookUpdatesEnabled: false,
	facebookTimeout: 6,
	facebookTimeoutId: 0,
	shortURLService: 0, //tinyUrl
	deliciousEnabled: false,
	deliciousShared: true,
	deliciousUpdatesEnabled: false,
	deliciousUsername: "",
	deliciousPassword: "",
	deliciousTimeoutId: 0,
	deliciousTimeout: 5,
	identicaEnabled: false,
	identicaUpdatesEnabled: false,
	identicaUsername: "",
	identicaPassword: "",
	identicaTimeoutId: 0,
	identicaTimeout: 7,
	// An initial queue for ordering FF updates before putting them in updateQueue.
	ffInitialQueue: [],
	statusInputWindow: null,
	initialTimeoutId: 0,

	onLoad: function(){
		// Initialization code
		this.initialized = true;
		this.strings = document.getElementById("firestatus-strings");
		
	    this.cons = Components.classes["@mozilla.org/consoleservice;1"].
        			getService(Components.interfaces.nsIConsoleService);


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
	    queue.lastTwitterId = this.prefs.getIntPref("lastTwitterId");
	    queue.lastTwitterTimestamp = this.prefs.getCharPref("lastTwitterTimestamp");
		
		if (this.twitterUpdatesEnabled || this.twitterEnabled) {
			// If no Twitter credentials are set, try the login manager.
			if (!this.twitterUsername || !this.twitterPassword) {
				try {
					// Get Login Manager 
					var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
					
					// Find users for the given parameters
					var logins = loginManager.findLogins({}, this.TWITTER_URL_S, this.TWITTER_URL_S, null);
					
					// Pick the first entry from the returned array of nsILoginInfo objects.
					if (logins.length > 0) {
						this.cons.logStringMessage("Using the password manager stored credentials for Twitter.");
						this.twitterUsername = logins[0].username;
						this.twitterPassword = logins[0].password;
					}
				} 
				catch (ex) {
					this.cons.logStringMessage("Error while loading the Login Manager: " + ex);
				}
			}
		}
		
	    this.friendfeedEnabled = this.prefs.getBoolPref("friendfeedEnabled");
	    this.friendfeedUpdatesEnabled = this.prefs.getBoolPref("friendfeedUpdatesEnabled");
	    this.friendfeedUsername = this.prefs.getCharPref("friendfeedUsername");
	    this.friendfeedPassword = this.prefs.getCharPref("friendfeedPassword");
	    this.friendfeedTimeout = this.prefs.getIntPref("friendfeedTimeout");
	    queue.lastFriendfeedId = this.prefs.getCharPref("lastFriendfeedId");
		
		this.facebookClient = facebookClient;
	    this.facebookEnabled = this.prefs.getBoolPref("facebookEnabled");
	    this.facebookUpdatesEnabled = this.prefs.getBoolPref("facebookUpdatesEnabled");
	    this.facebookTimeout = this.prefs.getIntPref("facebookTimeout");
		
		this.shortURLService = this.prefs.getCharPref("shortURLService");
		this.cons.logStringMessage("Short URL service selected: " + this.shortURLService);

	    this.deliciousEnabled = this.prefs.getBoolPref("deliciousEnabled");
	    this.deliciousShared = this.prefs.getBoolPref("deliciousShared");
	    this.deliciousUpdatesEnabled = this.prefs.getBoolPref("deliciousUpdatesEnabled");
	    this.deliciousUsername = this.prefs.getCharPref("deliciousUsername");
	    this.deliciousPassword = this.prefs.getCharPref("deliciousPassword");
	    this.deliciousTimeout = this.prefs.getIntPref("deliciousTimeout");
	    if (this.deliciousEnabled && window.document.getElementById("selectedConsumerDelicious").checked)
	    	window.document.getElementById("deliciousTags").hidden = false;
	    else
	    	window.document.getElementById("deliciousTags").hidden = true;
	    queue.lastDeliciousTimestamp = this.prefs.getCharPref("lastDeliciousTimestamp");
		
		if (this.deliciousUpdatesEnabled || this.deliciousEnabled) {
			// If no delicious credentials are set, try the login manager.
			if (!this.deliciousUsername || !this.deliciousPassword) {
				try {
					// Get Login Manager 
					var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
					
					// Find users for the given parameters
					var logins = loginManager.findLogins({}, this.DELICIOUS_URL_S, this.DELICIOUS_URL_S, null);
					
					// Pick the first entry from the returned array of nsILoginInfo objects.
					if (logins.length > 0) {
						this.cons.logStringMessage("Using the password manager stored credentials for delicious.");
						this.deliciousUsername = logins[0].username;
						this.deliciousPassword = logins[0].password;
					}
				} 
				catch (ex) {
					this.cons.logStringMessage("Error while loading the Login Manager: " + ex);
				}
			}
		}

	    this.identicaEnabled = this.prefs.getBoolPref("identicaEnabled");
	    this.identicaUpdatesEnabled = this.prefs.getBoolPref("identicaUpdatesEnabled");
	    this.identicaUsername = this.prefs.getCharPref("identicaUsername");
	    this.identicaPassword = this.prefs.getCharPref("identicaPassword");
	    this.identicaTimeout = this.prefs.getIntPref("identicaTimeout");
	    queue.lastIdenticaId = this.prefs.getIntPref("lastIdenticaId");
	    queue.lastIdenticaTimestamp = this.prefs.getCharPref("lastIdenticaTimestamp");
		
		if (this.identicaUpdatesEnabled || this.identicaEnabled) {
			// If no Identi.ca credentials are set, try the login manager.
			if (!this.identicaUsername || !this.identicaPassword) {
				try {
					// Get Login Manager 
					var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
					
					// Find users for the given parameters
					var logins = loginManager.findLogins({}, this.IDENTICA_URL, this.IDENTICA_URL, null);
					
					// Pick the first entry from the returned array of nsILoginInfo objects.
					if (logins.length > 0) {
						this.cons.logStringMessage("Using the password manager stored credentials for Identi.ca.");
						this.identicaUsername = logins[0].username;
						this.identicaPassword = logins[0].password;
					}
				} 
				catch (ex) {
					this.cons.logStringMessage("Error while loading the Login Manager: " + ex);
				}
			}
		}
		
		this.initialTimeoutId = window.setTimeout(this.resume, 7*1000);
	},
	
	onUnload: function() {
		this.prefs.removeObserver("", this);
	},
	
	onClick: function(event) {
		if (event.button == 0 && !event.ctrlKey) {
			if (window.document.getElementById('firestatusContainer').getAttribute("collapsed") === "true")
				firestatus.show();
			else
				firestatus.hide();
		} else if (event.button == 2 || event.ctrlKey) {
			var panel = window.document.getElementById('firestatus-panel');
			var popup = window.document.getElementById('firestatus-popup');
			popup.openPopup(panel, 'after_start', 12, 4, true, false);
		}
	},
	
	show: function() {
		var fsContainer = window.document.getElementById('firestatusContainer');
		fsContainer.setAttribute("collapsed", 'false');
		var textField = window.document.getElementById('statusText');
		var title = document.title;
		title = title.substr(0, title.lastIndexOf('-')-1);
		if (textField.value == "")
			textField.value = title;
		textField.select();
	},
	
	hide: function() {
		var fsContainer = window.document.getElementById('firestatusContainer');
		fsContainer.setAttribute("collapsed", 'true');
	},
	
	clear: function() {
		queue.updateQueue.length = 0;
	},

	pause: function() {
		queue.paused = !queue.paused;
		if (queue.paused)
		  firestatus.suspend();
		else
		  firestatus.resume();
	},

	suspend: function() {
		// Clear the initial timeout only the first time we are called.
		window.clearTimeout(firestatus.initialTimeoutId);
		return (firestatus.suspend = function() {
                firestatus.cancelUpdates('twitter');
                firestatus.cancelUpdates('friendfeed');
                firestatus.cancelUpdates('facebook');
                firestatus.cancelUpdates('delicious');
                firestatus.cancelUpdates('identica');
                queue.processingQueue = true;
                // Change the icon and menu label in every open browser window.
                var strbundle = document.getElementById("firestatus-strings");
                var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                    .getService(Components.interfaces.nsIWindowMediator);
                var enumerator = wm.getEnumerator("navigator:browser");
                while(enumerator.hasMoreElements()) {
                    var win = enumerator.getNext();
                    win.document.getElementById('firestatus-icon').src = 'chrome://firestatus/skin/fs-icon-bw-16.png';
                    win.document.getElementById('firestatus-pause').label = strbundle.getString("extensions.firestatus.resume");
                }
        })();
        
    },

	resume: function() {
        // Change the icon and menu label in every open browser window.
        var strbundle = document.getElementById("firestatus-strings");
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator);
        var enumerator = wm.getEnumerator("navigator:browser");
        while(enumerator.hasMoreElements()) {
            var win = enumerator.getNext();
            win.document.getElementById('firestatus-icon').src = 'chrome://firestatus/skin/fs-icon-16.png';
            win.document.getElementById('firestatus-pause').label = strbundle.getString("extensions.firestatus.pause");
        }
		queue.processingQueue = false;
        if (firestatus.twitterUpdatesEnabled) {
		  firestatus.twitterUpdates();
		  firestatus.twitterTimeoutId = window.setInterval(firestatus.twitterUpdates, firestatus.twitterTimeout*60*1000);
		}
		if (firestatus.friendfeedUpdatesEnabled) {
		  firestatus.friendfeedUpdates();
		  firestatus.friendfeedTimeoutId = window.setInterval(firestatus.friendfeedUpdates, firestatus.friendfeedTimeout*60*1000);
		}
		if (firestatus.facebookUpdatesEnabled) {
		  firestatus.facebookUpdates();
		  firestatus.facebookTimeoutId = window.setInterval(firestatus.facebookUpdates, firestatus.facebookTimeout*60*1000);
		}
        if (firestatus.deliciousUpdatesEnabled) {
  		  firestatus.deliciousUpdates();
  		  firestatus.deliciousTimeoutId = window.setInterval(firestatus.deliciousUpdates, firestatus.deliciousTimeout*60*1000);
  		}
        if (firestatus.identicaUpdatesEnabled) {
		  firestatus.identicaUpdates();
		  firestatus.identicaTimeoutId = window.setInterval(firestatus.identicaUpdates, firestatus.identicaTimeout*60*1000);
		}
   },

	observe: function(subject, topic, data) {
		if (topic != "nsPref:changed") {
			return;
		}
		
		switch(data) {
			case "twitterEnabled":
		    	this.twitterEnabled = this.prefs.getBoolPref("twitterEnabled");
		    	if (this.twitterEnabled) {
					window.document.getElementById("selectedConsumerTwitter").disabled = false;
					if (this.prefs.prefHasUserValue("lastTwitterChecked")) {
						window.document.getElementById("selectedConsumerTwitter").checked = this.prefs.getBoolPref("lastTwitterChecked");
					}
					else {
						window.document.getElementById("selectedConsumerTwitter").checked = true;
						this.prefs.setBoolPref("lastTwitterChecked", true);
					}
		    	}
		    	else {
					window.document.getElementById("selectedConsumerTwitter").disabled = true;
					window.document.getElementById("selectedConsumerTwitter").checked = false;
					firestatus.prefs.setBoolPref("lastTwitterChecked", false);
		    	}	
		    	break;
			case "twitterUpdatesEnabled":
		    	this.twitterUpdatesEnabled = this.prefs.getBoolPref("twitterUpdatesEnabled");
				if (this.twitterUpdatesEnabled) {
					this.twitterUpdates();
			        this.twitterTimeoutId = window.setInterval(this.twitterUpdates,
															   this.twitterTimeout*60*1000);
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
			        this.twitterTimeoutId = window.setInterval(this.twitterUpdates,
															   this.twitterTimeout*60*1000);
				}
		    	break;
			case "friendfeedEnabled":
		    	this.friendfeedEnabled = this.prefs.getBoolPref("friendfeedEnabled");
		    	if (this.friendfeedEnabled) {
					window.document.getElementById("selectedConsumerFriendfeed").disabled = false;
					if (this.prefs.prefHasUserValue("lastFriendfeedChecked")) {
						window.document.getElementById("selectedConsumerFriendfeed").checked = this.prefs.getBoolPref("lastFriendfeedChecked");
					}
					else {
						window.document.getElementById("selectedConsumerFriendfeed").checked = true;
						this.prefs.setBoolPref("lastFriendfeedChecked", true);
					}
		    	}
		    	else {
					window.document.getElementById("selectedConsumerFriendfeed").disabled = true;
					window.document.getElementById("selectedConsumerFriendfeed").checked = false;
					firestatus.prefs.setBoolPref("lastFriendfeedChecked", false);
		    	}	
		    	break;
			case "friendfeedUpdatesEnabled":
		    	this.friendfeedUpdatesEnabled = this.prefs.getBoolPref("friendfeedUpdatesEnabled");
				if (this.friendfeedUpdatesEnabled) {
					this.friendfeedUpdates();
			        this.friendfeedTimeoutId = window.setInterval(this.friendfeedUpdates,
																  this.friendfeedTimeout*60*1000);
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
			        this.friendfeedTimeoutId = window.setInterval(this.friendfeedUpdates,
																  this.friendfeedTimeout*60*1000);
				}
		    	break;
			case "facebookEnabled":
		    	this.facebookEnabled = this.prefs.getBoolPref("facebookEnabled");
		    	if (this.facebookEnabled) {
					window.document.getElementById("selectedConsumerFacebook").disabled = false;
					if (this.prefs.prefHasUserValue("lastFacebookChecked")) {
						window.document.getElementById("selectedConsumerFacebook").checked = this.prefs.getBoolPref("lastFacebookChecked");
					}
					else {
						window.document.getElementById("selectedConsumerFacebook").checked = true;
						this.prefs.setBoolPref("lastFacebookChecked", true);
					}
		    	}
		    	else {
					window.document.getElementById("selectedConsumerFacebook").disabled = true;
					window.document.getElementById("selectedConsumerFacebook").checked = false;
					firestatus.prefs.setBoolPref("lastFacebookChecked", false);
		    	}	
		    	break;
		    case "facebookUpdatesEnabled":
		    	this.facebookUpdatesEnabled = this.prefs.getBoolPref("facebookUpdatesEnabled");
				if (this.facebookUpdatesEnabled) {
					this.facebookUpdates();
			        this.facebookTimeoutId = window.setInterval(this.facebookUpdates,
																  this.facebookTimeout*60*1000);
				} else
					this.cancelUpdates("facebook");
		    	break;
			case "deliciousEnabled":
		    	this.deliciousEnabled = this.prefs.getBoolPref("deliciousEnabled");
		    	if (this.deliciousEnabled) {
					window.document.getElementById("selectedConsumerDelicious").disabled = false;
					if (this.prefs.prefHasUserValue("lastDeliciousChecked")) {
						window.document.getElementById("selectedConsumerDelicious").checked = this.prefs.getBoolPref("lastDeliciousChecked");
					}
					else {
						window.document.getElementById("selectedConsumerDelicious").checked = true;
						this.prefs.setBoolPref("lastDeliciousChecked", true);
					}
					if (window.document.getElementById("selectedConsumerDelicious").checked)
						window.document.getElementById("deliciousTags").hidden = false;
					else
						window.document.getElementById("deliciousTags").hidden = true;
		    	}
		    	else {
					window.document.getElementById("selectedConsumerDelicious").disabled = true;
					window.document.getElementById("selectedConsumerDelicious").checked = false;
					firestatus.prefs.setBoolPref("lastDeliciousChecked", false);
					window.document.getElementById("deliciousTags").hidden = true;
		    	}	
		    	break;
			case "deliciousShared":
				this.deliciousShared = this.prefs.getBoolPref("deliciousShared");
				break;
			case "deliciousUpdatesEnabled":
		    	this.deliciousUpdatesEnabled = this.prefs.getBoolPref("deliciousUpdatesEnabled");
				if (this.deliciousUpdatesEnabled) {
					this.deliciousUpdates();
			        this.deliciousTimeoutId = window.setInterval(this.deliciousUpdates,
															   this.deliciousTimeout*60*1000);
				} else
					this.cancelUpdates("delicious");
		    	break;
			case "deliciousUsername":
		    	this.deliciousUsername = this.prefs.getCharPref("deliciousUsername");
		    	break;
			case "deliciousPassword":
		    	this.deliciousPassword = this.prefs.getCharPref("deliciousPassword");
		    	break;
			case "deliciousTimeout":
		    	this.deliciousTimeout = this.prefs.getIntPref("deliciousTimeout");
				if (this.deliciousUpdatesEnabled) {
					this.cancelUpdates("delicious");
			        this.deliciousTimeoutId = window.setInterval(this.deliciousUpdates,
															   this.deliciousTimeout*60*1000);
				}
		    	break;
		    case "shortURLService":
		    	this.shortURLService = this.prefs.getCharPref("shortURLService");
				this.cons.logStringMessage("Short URL service selected: " + this.shortURLService);
		    	break;
			case "identicaEnabled":
		    	this.identicaEnabled = this.prefs.getBoolPref("identicaEnabled");
		    	if (this.identicaEnabled) {
					window.document.getElementById("selectedConsumerIdentica").disabled = false;
					if (this.prefs.prefHasUserValue("lastIdenticaChecked")) {
						window.document.getElementById("selectedConsumerIdentica").checked = this.prefs.getBoolPref("lastIdenticaChecked");
					}
					else {
						window.document.getElementById("selectedConsumerIdentica").checked = true;
						this.prefs.setBoolPref("lastIdenticaChecked", true);
					}
		    	}
		    	else {
					window.document.getElementById("selectedConsumerIdentica").disabled = true;
					window.document.getElementById("selectedConsumerIdentica").checked = false;
					firestatus.prefs.setBoolPref("lastIdenticaChecked", false);
		    	}	
		    	break;
			case "identicaUpdatesEnabled":
		    	this.identicaUpdatesEnabled = this.prefs.getBoolPref("identicaUpdatesEnabled");
				if (this.identicaUpdatesEnabled) {
					this.identicaUpdates();
			        this.identicaTimeoutId = window.setInterval(this.identicaUpdates,
															   this.identicaTimeout*60*1000);
				} else
					this.cancelUpdates("identica");
		    	break;
			case "identicaUsername":
		    	this.identicaUsername = this.prefs.getCharPref("identicaUsername");
		    	break;
			case "identicaPassword":
		    	this.identicaPassword = this.prefs.getCharPref("identicaPassword");
		    	break;
			case "identicaTimeout":
		    	this.identicaTimeout = this.prefs.getIntPref("identicaTimeout");
				if (this.identicaUpdatesEnabled) {
					this.cancelUpdates("identica");
			        this.identicaTimeoutId = window.setInterval(this.identicaUpdates,
															   this.identicaTimeout*60*1000);
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
			case "facebook":
				window.clearInterval(this.facebookTimeoutId);
				break;
			case "delicious":
				window.clearInterval(this.deliciousTimeoutId);
				break;
			case "identica":
				window.clearInterval(this.identicaTimeoutId);
				break;
		}
	},
  
	twitterUpdates: function() {
		if (queue.processingQueue) return;
		var milliseconds = new Number(queue.lastTwitterTimestamp);
		var FRIENDS_URL = firestatus.TWITTER_URL + '/statuses/friends_timeline.json?since=' +
						encodeURIComponent(new Date(milliseconds).toUTCString());
	    var req = new XMLHttpRequest();
	    req.open('GET', FRIENDS_URL, true);
	    req.onreadystatechange = function (aEvt) {
	      if (req.readyState == 4) {
	             if(req.status == 200) {
		            	var Ci = Components.interfaces;
		            	var Cc = Components.classes;
		            	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
	                    var jsonString = req.responseText;
						var statuses = nativeJSON.decode(jsonString);
						if (statuses.length == 0)
							return;
						// Sort the status updates, oldest first.
						statuses.sort(function(a, b) {
										return a.id - b.id;
									});
						for (var i = 0; i < statuses.length; i++) {
							var status = statuses[i];
							var t = Date.parse(status.created_at);
							if (status.id <= queue.lastTwitterId)
								continue;
							var text = "";
							try {
							  text = decodeURI(status.text);
							} catch (error) {
							  firestatus.cons.logStringMessage("Error decoding twitter update: " +
											   status.text);
							  text = status.text;
							}
							queue.updateQueue.push({id: status.id,
									timestamp: t,
									image: status.user.profile_image_url,
									title: status.user.name,
									text: status.text,
									link: firestatus.TWITTER_URL + '/' + status.user.screen_name +
                                            '/status/' + status.id});
						}
						queue.lastTwitterId = status.id;
						queue.lastTwitterTimestamp = t;
						firestatus.prefs.setIntPref("lastTwitterId", status.id);
						firestatus.prefs.setCharPref("lastTwitterTimestamp", t);
						if (!queue.processingQueue) {
							queue.processingQueue = true;
							queue.displayNotification();
						}
	             } else if(req.status == 304)
				 	return;
				 else
	             	firestatus.cons.logStringMessage("Error loading Twitter page. " +
													 "req.status="+req.status);
	      }
	    };
	    var auth = firestatus.twitterUsername+":"+firestatus.twitterPassword;
	    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	    req.send(null);
	},
	
	friendfeedUpdates: function() {
		if (queue.processingQueue) return;
		var FRIENDS_URL = firestatus.FRIENDFEED_URL + '/api/feed/home';
	    var req = new XMLHttpRequest();
	    req.open('GET', FRIENDS_URL, true);
	    req.onreadystatechange = function (aEvt) {
	      if (req.readyState == 4) {
	             if(req.status == 200) {
		            	var Ci = Components.interfaces;
		            	var Cc = Components.classes;
		            	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
	                    var jsonString = req.responseText;
						var statuses = nativeJSON.decode(jsonString).entries;
						// Sort the status updates, newest first.
						statuses.sort(function(a, b) {
										return a.updated > b.updated? -1: a.updated < b.updated? 1: 0;
									});
						for (var i = 0; i < statuses.length; i++) {
							var status = statuses[i];
							if (status.id == queue.lastFriendfeedId) break;
							if (status.hidden) break;
							var t = status.updated; // TODO: parse the RFC 3339 string
                            var title = status.room? status.room.name: status.user.name;
                            var nickname = status.room? 'rooms/' + status.room.nickname: status.user.nickname;
							firestatus.ffInitialQueue.push({
								id: status.id,
								timestamp: t,
                                image: firestatus.FRIENDFEED_URL + '/' + nickname +
                                        '/picture?size=large',
								title: title,
								text: status.title,
								link: status.link || firestatus.FRIENDFEED_URL
							});
						}
						queue.updateQueue = queue.updateQueue.concat(
												firestatus.ffInitialQueue.reverse());
						firestatus.ffInitialQueue = [];
						queue.lastFriendfeedId = statuses[0].id;
						firestatus.prefs.setCharPref("lastFriendfeedId", statuses[0].id);
						if (!queue.processingQueue) {
							queue.processingQueue = true;
							queue.displayNotification();
						}
	             } else
	             	firestatus.cons.logStringMessage("Error loading FF page. req.status="+req.status);
	      }
	    };
	    var auth = firestatus.friendfeedUsername+":"+firestatus.friendfeedPassword;
	    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	    req.send(null);
	},
	
	facebookUpdates: function() {
		if (queue.processingQueue) return;
		facebookClient.getNotifications();
	},

	deliciousUpdates: function() {
		if (queue.processingQueue) return;
		var FEED_URL = 'http://feeds.delicious.com/v2/json/network/' + firestatus.deliciousUsername;
	    var req = new XMLHttpRequest();
	    req.open('GET', FEED_URL, true);
	    req.onreadystatechange = function (aEvt) {
	      if (req.readyState == 4) {
	             if(req.status == 200) {
		            	var Ci = Components.interfaces;
		            	var Cc = Components.classes;
		            	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
	                    var jsonString = req.responseText;
	                    firestatus.cons.logStringMessage(req.responseText);
						var statuses = nativeJSON.decode(jsonString);
						if (statuses.length == 0)
							return;
						statuses.reverse();
						for (var i = 0; i < statuses.length; i++) {
							var status = statuses[i];
							var t = status.dt;
							if (t <= queue.lastDeliciousTimestamp)
								continue;
							var text = "";
							try {
							  text = decodeURI(status.d);
							} catch (error) {
							  firestatus.cons.logStringMessage("Error decoding delicious update: " +
											   status.d);
							  text = status.d;
							}
							queue.updateQueue.push({
									image: "chrome://firestatus/skin/delicious.png",
									timestamp: t,
									text: status.d,
									link: status.u
							});
						}
						queue.lastDeliciousTimestamp = t;
						firestatus.prefs.setCharPref("lastDeliciousTimestamp", t);
						if (!queue.processingQueue) {
							queue.processingQueue = true;
							queue.displayNotification();
						}
	             } else
	             	firestatus.cons.logStringMessage("Error loading delicious feed. req.status=" + req.status);
	      }
	    };
	    req.send(null);
	},

	identicaUpdates: function() {
		if (queue.processingQueue) return;
		var milliseconds = new Number(queue.lastIdenticaTimestamp);
		var FRIENDS_URL = firestatus.IDENTICA_URL + '/api/statuses/friends_timeline.json?since=' +
						encodeURIComponent(new Date(milliseconds).toUTCString());
	    var req = new XMLHttpRequest();
	    req.open('GET', FRIENDS_URL, true);
	    req.onreadystatechange = function (aEvt) {
	      if (req.readyState == 4) {
	             if(req.status == 200) {
		            	var Ci = Components.interfaces;
		            	var Cc = Components.classes;
		            	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
	                    var jsonString = req.responseText;
						var statuses = nativeJSON.decode(jsonString);
						if (statuses.length == 0)
							return;
						// Sort the status updates, oldest first.
						statuses.sort(function(a, b) {
										return a.id - b.id;
									});
						for (var i = 0; i < statuses.length; i++) {
							var status = statuses[i];
							var t = Date.parse(status.created_at);
							if (status.id <= queue.lastIdenticaId)
								continue;
							var text = "";
							try {
							  text = decodeURI(status.text);
							} catch (error) {
							  firestatus.cons.logStringMessage("Error decoding Identi.ca update: " +
											   status.text);
							  text = status.text;
							}
							queue.updateQueue.push({id: status.id,
									timestamp: t,
									image: status.user.profile_image_url,
									title: status.user.name,
									text: status.text,
									link: firestatus.IDENTICA_URL + '/notice/' + status.id});
						}
						queue.lastIdenticaId = status.id;
						queue.lastIdenticaTimestamp = t;
						firestatus.prefs.setIntPref("lastIdenticaId", status.id);
						firestatus.prefs.setCharPref("lastIdenticaTimestamp", t);
						if (!queue.processingQueue) {
							queue.processingQueue = true;
							queue.displayNotification();
						}
	             } else if(req.status == 304)
				 	return;
				 else
	             	firestatus.cons.logStringMessage("Error loading Identi.ca page. " +
													 "req.status="+req.status);
	      }
	    };
	    var auth = firestatus.identicaUsername+":"+firestatus.identicaPassword;
	    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	    req.send(null);
	},
	
	getShrinkedUrl: function (url, statusText, deliciousTags, sendTwitter, sendFriendfeed, sendFacebook, sendDelicious, sendIdentica) {
		firestatus.cons.logStringMessage("Shortening url ...");
		var tinyurl = null;
		if (this.shortURLService == "tinyUrl")
			tinyurl = "http://tinyurl.com/api-create.php?url=" + url;
		else
			tinyurl = "http://urlborg.com/api/77577-9314/url/create_or_reuse.json/" + url;
	    var req = new XMLHttpRequest();
		req.open('GET', tinyurl, true); 
	    req.onreadystatechange = function () {
			if (req.readyState == 4) {
			     switch(req.status) {
				 	case 200:
				 		if (firestatus.shortURLService != "tinyUrl") {
			            	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
		                    var jsonString = req.responseText;
							url = nativeJSON.decode(jsonString).s_url;
				 		}
				 		else {
				 			url = req.responseText;
				 		}
                    firestatus.actuallySendUpdate(statusText, url, deliciousTags, sendTwitter, sendFriendfeed, sendFacebook, sendDelicious, sendIdentica);
						break;
					case 400:
						firestatus.cons.logStringMessage("Bad Request");
						break;
					case 401:
						firestatus.cons.logStringMessage("Not Authorized");
						break;
					case 403:
						firestatus.cons.logStringMessage("Forbidden");
						break;
					case 404:
						firestatus.cons.logStringMessage("Not Found");
						break;
					case 500:
						firestatus.cons.logStringMessage("Internal Server Error");
						break;
					case 502:
						firestatus.cons.logStringMessage("Bad Gateway");
						break;
					case 503:
						firestatus.cons.logStringMessage("Service Unavailable");
						break;
					default:
						firestatus.cons.logStringMessage("Unknown tinyurl code: "+req.status);
						firestatus.cons.logStringMessage("Tinyurl response: "+req.responseText);
			     }
			}
	    };
		req.send(null);
	},
	
	actuallySendUpdate: function(statusText, url, deliciousTags, sendTwitter, sendFriendfeed, sendFacebook, sendDelicious, sendIdentica) {
		if (sendTwitter) {
			firestatus.sendStatusUpdateTwitter(statusText, url);
		}
		if (sendFriendfeed) {
			firestatus.sendStatusUpdateFriendfeed(statusText, url);
		}
		if (sendFacebook) {
			firestatus.sendStatusUpdateFacebook(statusText, url);
		}
		if (sendDelicious) {
			var title = document.title;
			title = title.substr(0, title.lastIndexOf('-')-1);
			firestatus.sendStatusUpdateDelicious(statusText, deliciousTags, document.getElementById("urlbar").value, title);
		}
		if (sendIdentica) {
			firestatus.sendStatusUpdateIdentica(statusText, url);
		}
	},

	sendStatusUpdateFacebook: function(statusText, url) {
		firestatus.cons.logStringMessage("Starting facebook update...")
		if (url)
			statusText += " " + url;
	//	var status = encodeURIComponent(statusText); //Somehow the status update fails if the status is encoded
	
		firestatus.facebookClient.updateStatus(statusText);
	},

	sendStatusUpdateTwitter: function (statusText, url) {
	    var params = "source=firestatus";
	    if (url)
	      statusText += " " + url;
	    var status = encodeURIComponent(statusText);
	    params += "&status="+status;
	    var req = new XMLHttpRequest ();   
	    var POST_URL = firestatus.TWITTER_URL + '/statuses/update.json';
	    req.open("POST", POST_URL, true);
	    req.onreadystatechange = function () {
			if (req.readyState == 4) {
			     switch(req.status) {
				 	case 200:
					 	firestatus.cons.logStringMessage("Twitter update sent.");
						document.getElementById('statusText').value = '';
						break;
					case 400:
						firestatus.cons.logStringMessage("Twitter response: Bad Request");
						break;
					case 401:
						firestatus.cons.logStringMessage("Twitter response: Not Authorized");
						break;
					case 403:
						firestatus.cons.logStringMessage("Twitter response: Forbidden");
						break;
					case 404:
						firestatus.cons.logStringMessage("Twitter response: Not Found");
						break;
					case 500:
						firestatus.cons.logStringMessage("Twitter response: Internal Server Error");
						break;
					case 502:
						firestatus.cons.logStringMessage("Twitter response: Bad Gateway");
						break;
					case 503:
						firestatus.cons.logStringMessage("Twitter response: Service Unavailable");
						break;
					default:
						firestatus.cons.logStringMessage("Unknown Twitter status: "+req.status);
						firestatus.cons.logStringMessage("Twitter response: "+req.responseText);
				 }
			}
		};
	    var auth = firestatus.twitterUsername + ":" + firestatus.twitterPassword;
	    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	    req.setRequestHeader("Content-length", params.length);
	    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
	    req.send(params); 
	},

	sendStatusUpdateFriendfeed: function(statusText, url) {
	    var status = encodeURIComponent(statusText);
	    var params = "title="+status;
	    if (url)
	      params += "&link=" + url;
	    var req = new XMLHttpRequest();   
	    var POST_URL = firestatus.FRIENDFEED_URL + '/api/share';
	    req.open("POST", POST_URL, true);
	    req.onreadystatechange = function () {
			if (req.readyState == 4) {
			     switch(req.status) {
				 	case 200:
					 	firestatus.cons.logStringMessage("FriendFeed update sent.");
						document.getElementById('statusText').value = '';
						break;
					case 400:
						firestatus.cons.logStringMessage("FriendFeed response: Bad Request");
						break;
					case 401:
						firestatus.cons.logStringMessage("FriendFeed response: Not Authorized");
						break;
					case 403:
						firestatus.cons.logStringMessage("FriendFeed response: Forbidden");
						break;
					case 404:
						firestatus.cons.logStringMessage("FriendFeed response: Not Found");
						break;
					case 500:
						firestatus.cons.logStringMessage("FriendFeed response: Internal Server Error");
						break;
					case 502:
						firestatus.cons.logStringMessage("FriendFeed response: Bad Gateway");
						break;
					case 503:
						firestatus.cons.logStringMessage("FriendFeed response: Service Unavailable");
						break;
					default:
						firestatus.cons.logStringMessage("Unknown FriendFeed status: "+req.status);
						firestatus.cons.logStringMessage("FriendFeed response: "+req.responseText);
				 }
			}
		};
	    var auth = firestatus.friendfeedUsername + ":" + firestatus.friendfeedPassword;
	    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	    req.setRequestHeader("Content-length", params.length);
	    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
	    req.send(params); 
	},

	showTagsBox: function () {
		if (!document.getElementById("selectedConsumerDelicious").disabled) {
			if (document.getElementById("selectedConsumerDelicious").checked)
				document.getElementById("deliciousTags").hidden = true;
			else
				document.getElementById("deliciousTags").hidden = false;
		}
	},
	
	sendStatusUpdateDelicious: function (statusText, deliciousTags, url, title) {
	    var status = encodeURIComponent(statusText);
	    deliciousTags = encodeURIComponent(deliciousTags);
	    title = encodeURIComponent(title);
	    var shared = firestatus.prefs.getBoolPref("deliciousShared");
	    var req = new XMLHttpRequest ();
	    var params = "url=" + url + "&description=" + title + "&extended=" + status + "&tags=" + deliciousTags + "&shared=" + (shared ? "yes" : "no");
	    req.open("POST", firestatus.DELICIOUS_URL_S + "/v1/posts/add", true);
	    req.onreadystatechange = function () {
			if (req.readyState == 4) {
			     switch(req.status) {
				 	case 200:
					 	firestatus.cons.logStringMessage("Del.icio.us bookmark saved.");
						document.getElementById('statusText').value = '';
						document.getElementById('deliciousTags').value = '';
						break;
					case 400:
						firestatus.cons.logStringMessage("Bad Request");
						break;
					case 401:
						firestatus.cons.logStringMessage("Not Authorized");
						break;
					case 403:
						firestatus.cons.logStringMessage("Forbidden");
						break;
					case 404:
						firestatus.cons.logStringMessage("Not Found");
						break;
					case 500:
						firestatus.cons.logStringMessage("Internal Server Error");
						break;
					case 502:
						firestatus.cons.logStringMessage("Bad Gateway");
						break;
					case 503:
						firestatus.cons.logStringMessage("Service Unavailable");
						break;
					default:
						firestatus.cons.logStringMessage("Unknown del.icio.us status: "+req.status);
						firestatus.cons.logStringMessage("del.icio.us response: "+req.responseText);
				 }
			}
		};
	    var auth = firestatus.deliciousUsername + ":" + firestatus.deliciousPassword;
	    firestatus.cons.logStringMessage(auth);
	    req.setRequestHeader("Authorization", "Basic " + btoa(auth));
	    req.setRequestHeader("Content-length", params.length);
	    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
	    req.send(params); 
	},

	sendStatusUpdateIdentica: function (statusText, url) {
	    var params = "source=firestatus";
	    if (url)
	      statusText += " " + url;
	    var status = encodeURIComponent(statusText);
	    params += "&status="+status;
	    var req = new XMLHttpRequest ();   
	    var POST_URL = firestatus.IDENTICA_URL + '/api/statuses/update.json';
	    req.open("POST", POST_URL, true);
	    req.onreadystatechange = function () {
			if (req.readyState == 4) {
			     switch(req.status) {
				 	case 200:
					 	firestatus.cons.logStringMessage("Identi.ca update sent.");
						document.getElementById('statusText').value = '';
						break;
					case 400:
						firestatus.cons.logStringMessage("Identica response: Bad Request");
						break;
					case 401:
						firestatus.cons.logStringMessage("Identi.ca response: Not Authorized");
						break;
					case 403:
						firestatus.cons.logStringMessage("Identi.ca response: Forbidden");
						break;
					case 404:
						firestatus.cons.logStringMessage("Identi.ca response: Not Found");
						break;
					case 500:
						firestatus.cons.logStringMessage("Identi.ca response: Internal Server Error");
						break;
					case 502:
						firestatus.cons.logStringMessage("Identi.ca response: Bad Gateway");
						break;
					case 503:
						firestatus.cons.logStringMessage("Identi.ca response: Service Unavailable");
						break;
					default:
						firestatus.cons.logStringMessage("Unknown Identi.ca status: "+req.status);
						firestatus.cons.logStringMessage("Identi.ca response: "+req.responseText);
				 }
			}
		};
	    var auth = firestatus.identicaUsername + ":" + firestatus.identicaPassword;
	    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	    req.setRequestHeader("Content-length", params.length);
	    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
	    req.send(params); 
	}
};	

window.addEventListener("load", function(e) { firestatus.onLoad(e); }, false);
window.addEventListener("unload", function(e) { firestatus.onUnload(e); }, false);
