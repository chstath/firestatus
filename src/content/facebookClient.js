/*
 * Copyright (c) 2008 Christos V. Stathis
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

var facebookClient = {
	defaultSecret: "f0abf7dde17155ff587728121607813f",
	apiKey: "53cc37e556054cec6af3b1a672ea5849",
	firestatus: window.firestatus,
	
	generateSig: function(params, secret) {
		var Cc = Components.classes;
		var Ci = Components.interfaces;
		// Load MD5 code...
		Cc['@mozilla.org/moz/jssubscript-loader;1']
    		.getService(Ci.mozIJSSubScriptLoader)
    		.loadSubScript('chrome://firestatus/content/md5.js');
        var str = '';
        params.sort();
        for (var i = 0; i < params.length; i++) {
            str += params[i];
        }
        str += secret;
        return hex_md5(str);
	},

	getNewSessionAndUpdate: function(status) {
		var params = [];
	    params.push('method=facebook.auth.createToken');
	    params.push('api_key=' + this.apiKey);
	    params.push('v=1.0');
	    params.push('format=JSON');
	    params.push('sig=' + this.generateSig(params, this.defaultSecret));
	    var req = new XMLHttpRequest();
	    req.open("GET", "http://api.facebook.com/restserver.php?"+params.join('&'), true);
	    req.onreadystatechange = function () {
			if (req.readyState == 4) {
				dump(req.responseText + "\n");
				dump(req.status + "\n");
			     switch(req.status) {
				 	case 200:
						firestatus.cons.logStringMessage("Response from getAuthToken: "  + req.responseText);
				    	var Ci = Components.interfaces;
				    	var Cc = Components.classes;
				    	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
				        var jsonString = "(" + req.responseText + ")";
//						var authToken = nativeJSON.decode(jsonString);
						var authToken = eval("(" + req.responseText + ")");
						firestatus.cons.logStringMessage("authToken retrieved: " + authToken);
						if (authToken != undefined) {
							//After getting the auth token we MUST send the user to the login page. If he is
							//already logged on to facebook all is well. If he is not the rest of the process will fail. We need to fix this by somehow waiting for the
							//user to successfuly login (how do we know that?)
							window.open("http://www.facebook.com/login.php?api_key=53cc37e556054cec6af3b1a672ea5849&v=1.0&popup=&auth_token=" + authToken, "", "chrome, centerscreen,width=646,height=520,modal=yes,dialog=yes,close=yes");
							var params2 = [];
					    	params2.push('method=facebook.auth.getSession');
					    	params2.push('api_key=' + facebookClient.apiKey);
					    	params2.push('v=1.0');
							params2.push('auth_token='+authToken);
						    params2.push('format=JSON');
					    	params2.push('sig=' + facebookClient.generateSig(params2, facebookClient.defaultSecret));
					    	var req2 = new XMLHttpRequest();
							req2.open("GET", "https://api.facebook.com/restserver.php?" + params2.join('&'), true);
						    req2.onreadystatechange = function () {
								if (req2.readyState == 4) {
									dump(req2.responseText + "\n");
									dump(req2.status + "\n");
								     switch(req2.status) {
									 	case 200:
											firestatus.cons.logStringMessage("Response from getSession: " + req2.responseText);
									    	var Ci = Components.interfaces;
									    	var Cc = Components.classes;
									    	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
									        var jsonString = req2.responseText;
											var session = nativeJSON.decode(jsonString);
											firestatus.cons.logStringMessage("Session key: " + session.session_key);
											facebookClient.firestatus.prefs.setCharPref("fbSessionKey", session.session_key);
											facebookClient.firestatus.prefs.setCharPref("fbSecret", session.secret);
											facebookClient.finallyUpdateStatus(session, status);
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
											firestatus.cons.logStringMessage("Unknown facebook code: "+req2.status);
											firestatus.cons.logStringMessage("Facebook response: "+req2.responseText);
								     }
								}
						    };
							req2.send(null);
						}
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
						firestatus.cons.logStringMessage("Unknown facebook code: "+req.status);
						firestatus.cons.logStringMessage("Facebook response: "+req.responseText);
				 }
			}
		};
		req.send(null);
	},
	
	getStoredSession: function() {
		if (this.firestatus.prefs.prefHasUserValue("fbSessionKey") && 
			this.firestatus.prefs.prefHasUserValue("fbSecret")) {
			var session_key = this.firestatus.prefs.getCharPref("fbSessionKey");
			var secret = this.firestatus.prefs.getCharPref("fbSecret");
			firestatus.cons.logStringMessage("Session key exists: " + session_key);
			firestatus.cons.logStringMessage("Secret exists: " + secret);
			return {session_key:session_key, secret:secret};
		}
	},
	
	updateStatus: function(status) {
		if (this.firestatus.prefs.prefHasUserValue("fbSessionKey") && 
			this.firestatus.prefs.prefHasUserValue("fbSecret")) {
			var session_key = this.firestatus.prefs.getCharPref("fbSessionKey");
			var secret = this.firestatus.prefs.getCharPref("fbSecret");
			firestatus.cons.logStringMessage("Session key exists: " + session_key);
			firestatus.cons.logStringMessage("Secret exists: " + secret);
			if (session_key != undefined && secret != undefined) {
				firestatus.cons.logStringMessage("Using existing key...\n");
				var session = {session_key:session_key, secret:secret};
				facebookClient.finallyUpdateStatus(session, status);
				return;
			}
		}
		firestatus.cons.logStringMessage("Key does not exist.");
		facebookClient.getNewSessionAndUpdate(status);
	},

	finallyUpdateStatus : function(session, status) {
		var params = [];
	    params.push('method=users.setStatus');
	    params.push('api_key=' + this.apiKey);
	    params.push('v=1.0');
		params.push('session_key=' + session.session_key);
		params.push('call_id=' + new Date().getTime());
	    params.push('format=JSON');
	    params.push('status_includes_verb=1');
		params.push('status=' + status);
	    params.push('sig=' + this.generateSig(params, session.secret));
	    facebookClient.sendUpdate(params, status);
	},
	
	sendUpdate: function(params, status) {
	    var req = new XMLHttpRequest();
		req.open("GET", "http://api.facebook.com/restserver.php?"+params.join('&'), true);
	    req.onreadystatechange = function () {
			if (req.readyState == 4) {
				dump(req.responseText + "\n");
				dump(req.status + "\n");
			     switch(req.status) {
				 	case 200:
				    	var Ci = Components.interfaces;
				    	var Cc = Components.classes;
				    	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
				        var jsonString = req.responseText;
						//var result = nativeJSON.decode(jsonString);
						var result = eval("(" + jsonString + ")");
						var code = result.error_code;
						if (code == undefined) {
					 		firestatus.cons.logStringMessage("Facebook update sent.");
						}
						else {
							firestatus.cons.logStringMessage("Facebook returned code: " + code);
							if (code == 250) {
								firestatus.cons.logStringMessage("Requesting authorization...");
								window.open("http://www.facebook.com/authorize.php?api_key=" + facebookClient.apiKey + "&v=1.0&ext_perm=status_update&popup=", "", "chrome, centerscreen,width=646,height=520,modal=yes,dialog=yes,close=yes");
								facebookClient.sendUpdate(params);
							}
							else if (code == 102) {
								firestatus.cons.logStringMessage("Asking for new session key...");
								facebookClient.getNewSessionAndUpdate(status);
							}
							else if (code != "") {
								alert("Facebook status will not be updated");
							}
						}
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
						firestatus.cons.logStringMessage("Unknown facebook code: "+req.status);
						firestatus.cons.logStringMessage("Facebook response: "+req.responseText);
				 }
			}
		};
		firestatus.cons.logStringMessage("Updating facebook status");
		req.send(null);
	},
	
	getNotifications: function() {
		if (this.firestatus.prefs.prefHasUserValue("fbSessionKey") && 
				this.firestatus.prefs.prefHasUserValue("fbSecret")) {
				var session_key = this.firestatus.prefs.getCharPref("fbSessionKey");
				var secret = this.firestatus.prefs.getCharPref("fbSecret");
				firestatus.cons.logStringMessage("Session key exists: " + session_key);
				firestatus.cons.logStringMessage("Secret exists: " + secret);
				if (session_key != undefined && secret != undefined) {
					firestatus.cons.logStringMessage("Using existing key...\n");
					var session = {session_key:session_key, secret:secret};
					facebookClient.finallyGetNotifications(session);
					return;
				}
			}
			firestatus.cons.logStringMessage("Key does not exist.");
			facebookClient.getNewSessionAndNotifications();
	},	
	
	getNewSessionAndNotifications: function() {
		var params = [];
	    params.push('method=facebook.auth.createToken');
	    params.push('api_key=' + this.apiKey);
	    params.push('v=1.0');
	    params.push('format=JSON');
	    params.push('sig=' + this.generateSig(params, this.defaultSecret));
	    var req = new XMLHttpRequest();
	    req.open("GET", "http://api.facebook.com/restserver.php?"+params.join('&'), true);
	    req.onreadystatechange = function () {
			if (req.readyState == 4) {
				dump(req.responseText + "\n");
				dump(req.status + "\n");
			     switch(req.status) {
				 	case 200:
						firestatus.cons.logStringMessage("Response from getAuthToken: "  + req.responseText);
				    	var Ci = Components.interfaces;
				    	var Cc = Components.classes;
				    	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
				        var jsonString = "(" + req.responseText + ")";
//						var authToken = nativeJSON.decode(jsonString);
						var authToken = eval("(" + req.responseText + ")");
						firestatus.cons.logStringMessage("authToken retrieved: " + authToken);
						if (authToken != undefined) {
							//After getting the auth token we MUST send the user to the login page. If he is
							//already logged on to facebook all is well. If he is not the rest of the process will fail. We need to fix this by somehow waiting for the
							//user to successfuly login (how do we know that?)
							window.open("http://www.facebook.com/login.php?api_key=53cc37e556054cec6af3b1a672ea5849&v=1.0&popup=&auth_token=" + authToken, "", "chrome, centerscreen,width=646,height=520,modal=yes,dialog=yes,close=yes");
							var params2 = [];
					    	params2.push('method=facebook.auth.getSession');
					    	params2.push('api_key=' + facebookClient.apiKey);
					    	params2.push('v=1.0');
							params2.push('auth_token='+authToken);
						    params2.push('format=JSON');
					    	params2.push('sig=' + facebookClient.generateSig(params2, facebookClient.defaultSecret));
					    	var req2 = new XMLHttpRequest();
							req2.open("GET", "https://api.facebook.com/restserver.php?" + params2.join('&'), true);
						    req2.onreadystatechange = function () {
								if (req2.readyState == 4) {
									dump(req2.responseText + "\n");
									dump(req2.status + "\n");
								     switch(req2.status) {
									 	case 200:
											firestatus.cons.logStringMessage("Response from getSession: " + req2.responseText);
									    	var Ci = Components.interfaces;
									    	var Cc = Components.classes;
									    	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
									        var jsonString = req2.responseText;
											var session = nativeJSON.decode(jsonString);
											firestatus.cons.logStringMessage("Session key: " + session.session_key);
											facebookClient.firestatus.prefs.setCharPref("fbSessionKey", session.session_key);
											facebookClient.firestatus.prefs.setCharPref("fbSecret", session.secret);
											facebookClient.finallyGetNotifications(session);
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
											firestatus.cons.logStringMessage("Unknown facebook code: "+req2.status);
											firestatus.cons.logStringMessage("Facebook response: "+req2.responseText);
								     }
								}
						    };
							req2.send(null);
						}
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
						firestatus.cons.logStringMessage("Unknown facebook code: "+req.status);
						firestatus.cons.logStringMessage("Facebook response: "+req.responseText);
				 }
			}
		};
		req.send(null);
	},

	finallyGetNotifications: function(session) {
		var params = [];
	    params.push('method=notifications.get');
	    params.push('api_key=' + this.apiKey);
		params.push('session_key=' + session.session_key);
		params.push('call_id=' + new Date().getTime());
	    params.push('v=1.0');
	    params.push('format=JSON');
	    params.push('sig=' + this.generateSig(params, session.secret));
	    facebookClient.getNotifications1(params);
	},
	
	getNotifications1: function(params) {
	    var req = new XMLHttpRequest();
		req.open("GET", "http://api.facebook.com/restserver.php?"+params.join('&'), true);
	    req.onreadystatechange = function () {
			if (req.readyState == 4) {
				dump(req.responseText + "\n");
				dump(req.status + "\n");
			     switch(req.status) {
				 	case 200:
				    	var Ci = Components.interfaces;
				    	var Cc = Components.classes;
				    	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
				        var jsonString = req.responseText;
						var result = nativeJSON.decode(jsonString);
						var code = result.error_code;
						if (code == undefined) {
							var notifications = {messages: result.messages.unread,
								pokes: result.pokes.unread,
								shares: result.shares.unread
								};
							if (notifications.messages > 0 || 
									notifications.pokes > 0 ||
									notifications.shares > 0)
										firestatus.updateQueue.push({title: "Facebook",
																	 image: "chrome://firestatus/skin/facebook.png",
																	 text: "Messages: " + notifications.messages + " Pokes: " + notifications.pokes + " Shares: " + notifications.shares,
																	 link: firestatus.FACEBOOK_URL
																	 });
								firestatus.cons.logStringMessage("pending notifications:"+firestatus.updateQueue.length);
								if (!firestatus.processingQueue) {
									firestatus.processingQueue = true;
									firestatus.displayNotification();
								}
						}
						else {
							firestatus.cons.logStringMessage("Facebook returned code: " + code);
							if (code == 250) {
								firestatus.cons.logStringMessage("Requesting authorization...");
								window.open("http://www.facebook.com/authorize.php?api_key=" + facebookClient.apiKey + "&v=1.0&ext_perm=status_update&popup=", "", "chrome, centerscreen,width=646,height=520,modal=yes,dialog=yes,close=yes");
								facebookClient.getNotifications1(params);
							}
							else if (code == 102) {
								firestatus.cons.logStringMessage("Asking for new session key...");
								facebookClient.getNewSessionAndNotifications();
							}
							else if (code != "") {
								alert("Facebook status will not be updated");
							}
						}
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
						firestatus.cons.logStringMessage("Unknown facebook code: "+req.status);
						firestatus.cons.logStringMessage("Facebook response: "+req.responseText);
				 }
			}
		};
		firestatus.cons.logStringMessage("Getting facebook notifications");
		req.send(null);
	}
}
