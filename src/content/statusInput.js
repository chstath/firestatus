/*
 * Copyright (c) 2008 Dionysios Synodinos
 * Copyright (c) 2008 Christos V. Stathis
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
var statusInput = {
	firestatus : window.opener.firestatus,
	
	onLoad: function(event) {
		if (this.firestatus.twitterEnabled) {
			if (this.firestatus.prefs.prefHasUserValue("lastTwitterChecked")) {
				document.getElementById("selectedConsumerTwitter").checked = this.firestatus.prefs.getBoolPref("lastTwitterChecked");
			}
			else {
				document.getElementById("selectedConsumerTwitter").checked = true;
				this.firestatus.prefs.setBoolPref("lastTwitterChecked", true);
			}
		}
		else {
			document.getElementById("selectedConsumerTwitter").disabled = true;
			document.getElementById("selectedConsumerTwitter").checked = false;
			this.firestatus.prefs.setBoolPref("lastTwitterChecked", false);
		}
		if (this.firestatus.prefs.prefHasUserValue("lastFacebookChecked")) {
			document.getElementById("selectedConsumerFacebook").checked = this.firestatus.prefs.getBoolPref("lastFacebookChecked");
		}
		else {
			document.getElementById("selectedConsumerFacebook").checked = true;
			this.firestatus.prefs.setBoolPref("lastFacebookChecked", true);
		}
		var urlText = document.getElementById("statusTextUrl");
		urlText.value = window.opener.document.getElementById("urlbar").value;
		urlText.select();
	},
	
	onUnload: function() {
		this.firestatus.prefs.setBoolPref("lastTwitterChecked", document.getElementById("selectedConsumerTwitter").checked);
		this.firestatus.prefs.setBoolPref("lastFacebookChecked", document.getElementById("selectedConsumerFacebook").checked);
	},
	
	sendStatusUpdate: function() {
		var statusText = document.getElementById('statusText').value;
		if (this.firestatus.twitterEnabled && document.getElementById("selectedConsumerTwitter").checked) {
			this.sendStatusUpdateTwitter();
		}
	//	sendStatusUpdateLinkedIn();
		if (document.getElementById("selectedConsumerFacebook").checked) {
			this.sendStatusUpdateFacebook();
		}
		//sendStatusUpdateFriendFeed();
	},

	sendStatusUpdateTwitter: function () {
		var statusText = document.getElementById('statusText').value +" "+ getShrinkedUrl();
	    var status = encodeURIComponent(statusText);
	    var req = new XMLHttpRequest ();   
	    req.open("POST","http://twitter.com:80/statuses/update.json?status="+status, true);
	    req.onreadystatechange = function () {
	//		firestatus.cons.logStringMessage("twitter readyState: "+req.readyState);
	//		firestatus.cons.logStringMessage("twitter status: "+req.status);
	//		firestatus.cons.logStringMessage("Twitter response: "+req.responseText);
			if (req.readyState == 4) {
			     switch(req.status) {
				 	case 200:
					 	this.firestatus.cons.logStringMessage("Twitter update sent.");
						break;
					case 400:
						this.firestatus.cons.logStringMessage("Bad Request");
						break;
					case 401:
						this.firestatus.cons.logStringMessage("Not Authorized");
						break;
					case 403:
						this.firestatus.cons.logStringMessage("Forbidden");
						break;
					case 404:
						this.firestatus.cons.logStringMessage("Not Found");
						break;
					case 500:
						this.firestatus.cons.logStringMessage("Internal Server Error");
						break;
					case 502:
						this.firestatus.cons.logStringMessage("Bad Gateway");
						break;
					case 503:
						this.firestatus.cons.logStringMessage("Service Unavailable");
						break;
					default:
						this.firestatus.cons.logStringMessage("Unknown twitter status: "+req.status);
						this.firestatus.cons.logStringMessage("Twitter response: "+req.responseText);
				 }
			}
		};
	    var auth = this.firestatus.twitterUsername+":"+this.firestatus.twitterPassword;
	    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	    req.send(null); 
	},

	sendStatusUpdateLinkedIn: function (){
		return true;
	},


	sendStatusUpdateFacebook: function (){
		dump("\n@@@@@@@@@@@@@@@@@@@@@Starting facebook update\n")
		var statusText = document.getElementById('statusText').value +" "+ document.getElementById('statusTextUrl').value;
	//	var status = encodeURIComponent(statusText); //Somehow the status update fails if the status is encoded
	
		var Cc = Components.classes;
		var Ci = Components.interfaces;
		// Load facebook code...
		Cc['@mozilla.org/moz/jssubscript-loader;1']
	   		.getService(Ci.mozIJSSubScriptLoader)
	   		.loadSubScript('chrome://firestatus/content/facebookClient.js'); //Is there any other way to gain access to the facebookClient object ??
		var session = facebookClient.getSession(); //The session can be stored for subsequent calls to facebook api
		dump(session.session_key + "\n");
		dump(session.error_code + "\n");
		if (session.error_code == undefined) {
			this.sendFacebook(session, statusText);
		}
		else alert("Facebook status will not be updated");
	},

	sendFacebook: function (session, statusText) {
		var code = facebookClient.updateStatus(session.session_key, session.secret, statusText);
		if (code == 250) {
			window.open("http://www.facebook.com/authorize.php?api_key=" + facebookClient.apiKey + "&v=1.0&ext_perm=status_update&popup=", "", "chrome, centerscreen,width=646,height=520,modal=yes,dialog=yes,close=yes");
			this.sendFacebook(session, statusText);
		}
		else if (code == 102) {
			session = facebookClient.getSession(true);
			this.sendFacebook(session, statusText);
		}
		else if (code != "")
			alert("Facebook status will not be updated");
	},

	sendStatusUpdateFriendFeed: function () {
		/* var statusText = document.getElementById('statusText').value;
		var status = encodeURIComponent(status);
		req = new XMLHttpRequest ();   
		//req.onreadystatechange = getTwitterResponse; 
		req.open("POST","http://friendfeed.com//api/share?title="+statusText+"&nickname=firestatus&remotekey=rared739windy", true);
		req.send(null); */
	},

	getShrinkedUrl: function () {
		var tinyurl = "http://tinyurl.com/api-create.php?url="+encodeURI(document.getElementById('statusTextUrl').value);
	    var req = new XMLHttpRequest();
		req.open('GET', tinyurl, false); 
		req.send(null);
		if(req.status == 200) {
			return req.responseText;
		} else {
			return '';
		}
	}
}

window.addEventListener("load", function(e) { statusInput.onLoad(e); }, false);
window.addEventListener("unload", function(e) { statusInput.onUnload(e); }, false);