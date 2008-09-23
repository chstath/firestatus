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
	TWITTER_URL: 'http://twitter.com',
	TWITTER_URL_S: 'https://twitter.com',
	FRIENDFEED_URL: 'http://friendfeed.com',
	FACEBOOK_URL: 'http://facebook.com',
	cons: null,
	prefs: null,
	twitterEnabled: false,
	twitterUpdatesEnabled: false,
	twitterUsername: "",
	twitterPassword: "",
	twitterTimeoutId: 0,
	twitterTimeout: 5,
	lastTwitterId: 0,
	lastTwitterTimestamp: "0",
	friendfeedEnabled: false,
	friendfeedUpdatesEnabled: false,
	friendfeedUsername: "",
	friendfeedPassword: "",
	friendfeedTimeoutId: 0,
	friendfeedTimeout: 4,
	lastFriendfeedId: 0,
	facebookEnabled: false,
	facebookUpdatesEnabled: false,
	facebookTimeout: 6,
	facebookTimeoutId: 0,
	// A FIFO queue that contains pending notifications.
	updateQueue: [],
	// An initial queue for ordering FF updates before putting them in updateQueue.
	ffInitialQueue: [],
	processingQueue: false,

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
	    this.lastTwitterId = this.prefs.getIntPref("lastTwitterId");
	    this.lastTwitterTimestamp = this.prefs.getCharPref("lastTwitterTimestamp");
		
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
			
			this.twitterUpdates();
			this.twitterTimeoutId = window.setInterval(this.twitterUpdates,
													   this.twitterTimeout*60*1000);
		}
		
	    this.friendfeedEnabled = this.prefs.getBoolPref("friendfeedEnabled");
	    this.friendfeedUpdatesEnabled = this.prefs.getBoolPref("friendfeedUpdatesEnabled");
	    this.friendfeedUsername = this.prefs.getCharPref("friendfeedUsername");
	    this.friendfeedPassword = this.prefs.getCharPref("friendfeedPassword");
	    this.friendfeedTimeout = this.prefs.getIntPref("friendfeedTimeout");
	    this.lastFriendfeedId = this.prefs.getCharPref("lastFriendfeedId");
		
		if (this.friendfeedUpdatesEnabled) {
			this.friendfeedUpdates();
			this.friendfeedTimeoutId = window.setInterval(this.friendfeedUpdates,
														  this.friendfeedTimeout*60*1000);
		}
		
		this.facebookClient = facebookClient;
	    this.facebookEnabled = this.prefs.getBoolPref("facebookEnabled");
	    this.facebookUpdatesEnabled = this.prefs.getBoolPref("facebookUpdatesEnabled");
	    this.facebookTimeout = this.prefs.getIntPref("facebookTimeout");
		if (this.facebookUpdatesEnabled) {
			this.facebookUpdates();
			this.facebookTimeoutId = window.setInterval(this.facebookUpdates, this.facebookTimeout*60*1000);
		}
	},
	
	onUnload: function() {
		this.prefs.removeObserver("", this);
	},
	
	onClick: function(event) {
		if (event.button == 0 && !event.ctrlKey) {
			firestatus.showStatusInput();
		} else if (event.button == 2 || event.ctrlKey) {
			var panel = window.document.getElementById('firestatus-panel');
			var popup = window.document.getElementById('firestatus-popup');
			popup.openPopup(panel, 'after_start', 12, 4, true, false);
		}
	},
	
	showStatusInput: function() {
		var left = window.screenX;
		var top = window.screenY + window.outerHeight - 75;
		var windowFeatures = 'screenX=' + left + ',screenY=' + top + ',titlebar=no';
		window.openDialog('chrome://firestatus/content/statusInput.xul', 'statusInput', windowFeatures);
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
		}
	},
  
	twitterUpdates: function() {
		if (firestatus.processingQueue) return;
		var milliseconds = new Number(firestatus.lastTwitterTimestamp);
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
							if (status.id <= firestatus.lastTwitterId)
								continue;
							firestatus.updateQueue.push({id: status.id,
														 timestamp: t,
														 image: status.user.profile_image_url,
														 title: status.user.name,
														 text: status.text,
														 link: firestatus.TWITTER_URL});
						}
						firestatus.lastTwitterId = status.id;
						firestatus.cons.logStringMessage("t:"+t);
						firestatus.lastTwitterTimestamp = t;
						firestatus.prefs.setIntPref("lastTwitterId", status.id);
						firestatus.prefs.setCharPref("lastTwitterTimestamp", t);
						if (!firestatus.processingQueue) {
							firestatus.processingQueue = true;
							firestatus.displayNotification();
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
		if (firestatus.processingQueue) return;
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
						firestatus.cons.logStringMessage('lastFriendfeedId: ' +
													firestatus.lastFriendfeedId);
						for (var i = 0; i < statuses.length; i++) {
							var status = statuses[i];
							firestatus.cons.logStringMessage('New FF update: ' + status.id +
															 ' text: ' + status.title);
							if (status.id == firestatus.lastFriendfeedId) break;
							var t = status.updated; // TODO: parse the RFC 3339 string
							firestatus.cons.logStringMessage("FF t:"+t);
							firestatus.ffInitialQueue.push({
								id: status.id,
								timestamp: t,
								image: status.service.iconUrl,
								title: status.user.name,
								text: status.title,
								link: status.link || firestatus.FRIENDFEED_URL
							});
						}
						firestatus.updateQueue = firestatus.updateQueue.concat(
												firestatus.ffInitialQueue.reverse());
						firestatus.ffInitialQueue = [];
						firestatus.lastFriendfeedId = statuses[0].id;
						firestatus.prefs.setCharPref("lastFriendfeedId", statuses[0].id);
						if (!firestatus.processingQueue) {
							firestatus.processingQueue = true;
							firestatus.displayNotification();
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
		facebookClient.getNotifications();
	},

	displayNotification: function() {
		firestatus.cons.logStringMessage("pending notifications:"+firestatus.updateQueue.length);
		var update = firestatus.updateQueue.shift();
		if (update)
	        try {
				if ("@mozilla.org/alerts-service;1" in Components.classes) {
					var alertService = Components.classes["@mozilla.org/alerts-service;1"]
										.getService(Components.interfaces.nsIAlertsService);
					if (alertService) {
						alertService.showAlertNotification(update.image, update.title, update.text,
												 true, update.link, firestatus.notificationHandler);
					}
					else {
						firestatus.cons.logStringMessage("alertsService failure: " +
														"could not getService nsIAlertsService");
					}
				}
	        } catch(e) {
	                firestatus.cons.logStringMessage("alertsService failure: " + e);
	        }
		else
			firestatus.processingQueue = false;
	},
	
	notificationHandler: {
		observe: function(subject, topic, data) {
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
			var browser = wm.getMostRecentWindow("navigator:browser").getBrowser();

			if (topic == 'alertclickcallback' && data != null)
				browser.selectedTab = browser.addTab(data);
			else if (topic == 'alertfinished')
				firestatus.displayNotification();
		}
	},
	
	getShrinkedUrl: function (url) {
		var tinyurl = "http://tinyurl.com/api-create.php?url=" + url;
	    var req = new XMLHttpRequest();
		req.open('GET', tinyurl, false); 
		req.send(null);
		if (req.status == 200) {
			return req.responseText;
		} else {
			return '';
		}
	},
	
	sendStatusUpdateTwitter: function (statusText, url) {
		if (url)
			statusText += " " + url;
	    var status = encodeURIComponent(statusText);
	    var req = new XMLHttpRequest ();   
	    req.open("POST","http://twitter.com/statuses/update.json?source=firestatus&status="+status, true);
	    req.onreadystatechange = function () {
			if (req.readyState == 4) {
			     switch(req.status) {
				 	case 200:
					 	firestatus.cons.logStringMessage("Twitter update sent.");
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
						firestatus.cons.logStringMessage("Unknown twitter status: "+req.status);
						firestatus.cons.logStringMessage("Twitter response: "+req.responseText);
				 }
			}
		};
	    var auth = firestatus.twitterUsername + ":" + firestatus.twitterPassword;
	    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	    req.send(null); 
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
						firestatus.cons.logStringMessage("Unknown friendfeed status: "+req.status);
						firestatus.cons.logStringMessage("FriendFeed response: "+req.responseText);
				 }
			}
		};
	    var auth = firestatus.friendfeedUsername + ":" + firestatus.friendfeedPassword;
	    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	    req.setRequestHeader("Content-length", params.length);
	    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
	    req.send(params); 
	}

};

window.addEventListener("load", function(e) { firestatus.onLoad(e); }, false);
window.addEventListener("unload", function(e) { firestatus.onUnload(e); }, false);


