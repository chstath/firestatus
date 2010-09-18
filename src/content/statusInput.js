/* -*- mode: JavaScript; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*- */
/* ex: set tabstop=4 expandtab: */
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
	onLoad: function(event) {
		if (firestatus.twitterEnabled) {
			document.getElementById("selectedConsumerTwitter").disabled = false;
			if (firestatus.prefs.prefHasUserValue("lastTwitterChecked")) {
				document.getElementById("selectedConsumerTwitter").checked = firestatus.prefs.getBoolPref("lastTwitterChecked");
			}
			else {
				document.getElementById("selectedConsumerTwitter").checked = true;
				firestatus.prefs.setBoolPref("lastTwitterChecked", true);
			}
		}
		else {
			document.getElementById("selectedConsumerTwitter").disabled = true;
			document.getElementById("selectedConsumerTwitter").checked = false;
			firestatus.prefs.setBoolPref("lastTwitterChecked", false);
		}
		if (firestatus.friendfeedEnabled) {
			document.getElementById("selectedConsumerFriendfeed").disabled = false;
			if (firestatus.prefs.prefHasUserValue("lastFriendfeedChecked")) {
				document.getElementById("selectedConsumerFriendfeed").checked = firestatus.prefs.getBoolPref("lastFriendfeedChecked");
			}
			else {
				document.getElementById("selectedConsumerFriendfeed").checked = true;
				firestatus.prefs.setBoolPref("lastFriendfeedChecked", true);
			}
		}
		else {
			document.getElementById("selectedConsumerFriendfeed").disabled = true;
			document.getElementById("selectedConsumerFriendfeed").checked = false;
			firestatus.prefs.setBoolPref("lastFriendfeedChecked", false);
		}
		if (firestatus.facebookEnabled) {
			document.getElementById("selectedConsumerFacebook").disabled = false;
			if (firestatus.prefs.prefHasUserValue("lastFacebookChecked")) {
				document.getElementById("selectedConsumerFacebook").checked = firestatus.prefs.getBoolPref("lastFacebookChecked");
			}
			else {
				document.getElementById("selectedConsumerFacebook").checked = true;
				firestatus.prefs.setBoolPref("lastFacebookChecked", true);
			}
		}
		else {
			document.getElementById("selectedConsumerFacebook").disabled = true;
			document.getElementById("selectedConsumerFacebook").checked = false;
			firestatus.prefs.setBoolPref("lastFacebookChecked", false);
		}
		if (firestatus.deliciousEnabled) {
			document.getElementById("selectedConsumerDelicious").disabled = false;
			if (firestatus.prefs.prefHasUserValue("lastDeliciousChecked")) {
				document.getElementById("selectedConsumerDelicious").checked = firestatus.prefs.getBoolPref("lastDeliciousChecked");
			}
			else {
				document.getElementById("selectedConsumerDelicious").checked = true;
				firestatus.prefs.setBoolPref("lastDeliciousChecked", true);
			}
			if (document.getElementById("selectedConsumerDelicious").checked)
				document.getElementById("deliciousTags").hidden = false;
			else
				document.getElementById("deliciousTags").hidden = true;
		}
		else {
			document.getElementById("selectedConsumerDelicious").disabled = true;
			document.getElementById("selectedConsumerDelicious").checked = false;
			firestatus.prefs.setBoolPref("lastDeliciousChecked", false);
			document.getElementById("deliciousTags").hidden = true;
		}
		if (firestatus.identicaEnabled) {
			document.getElementById("selectedConsumerIdentica").disabled = false;
			if (firestatus.prefs.prefHasUserValue("lastIdenticaChecked")) {
				document.getElementById("selectedConsumerIdentica").checked = firestatus.prefs.getBoolPref("lastIdenticaChecked");
			}
			else {
				document.getElementById("selectedConsumerIdentica").checked = true;
				firestatus.prefs.setBoolPref("lastIdenticaChecked", true);
			}
		}
		else {
			document.getElementById("selectedConsumerIdentica").disabled = true;
			document.getElementById("selectedConsumerIdentica").checked = false;
			firestatus.prefs.setBoolPref("lastIdenticaChecked", false);
		}
		document.getElementById("statusText").focus();
	},
	
	onUnload: function() {
		firestatus.prefs.setBoolPref("lastTwitterChecked", document.getElementById("selectedConsumerTwitter").checked);
		firestatus.prefs.setBoolPref("lastFriendfeedChecked", document.getElementById("selectedConsumerFriendfeed").checked);
		firestatus.prefs.setBoolPref("lastFacebookChecked", document.getElementById("selectedConsumerFacebook").checked);
		firestatus.prefs.setBoolPref("lastDeliciousChecked", document.getElementById("selectedConsumerDelicious").checked);
		firestatus.prefs.setBoolPref("lastIdenticaChecked", document.getElementById("selectedConsumerIdentica").checked);
	},
	
	sendStatusUpdate: function() {
		var statusText = document.getElementById('statusText').value;
		var deliciousTags = document.getElementById('deliciousTags').value;
		var url = document.getElementById("sendUrl").checked ? document.getElementById("urlbar").value : "";
		var sendTwitter = firestatus.twitterEnabled && document.getElementById("selectedConsumerTwitter").checked;
		var sendFriendfeed = firestatus.friendfeedEnabled && document.getElementById("selectedConsumerFriendfeed").checked;
		var sendFacebook = firestatus.facebookEnabled && document.getElementById("selectedConsumerFacebook").checked;
		var sendDelicious = firestatus.deliciousEnabled && document.getElementById("selectedConsumerDelicious").checked;
		var sendIdentica = firestatus.identicaEnabled && document.getElementById("selectedConsumerIdentica").checked;
		firestatus.actuallySendUpdate(statusText, url, deliciousTags, sendTwitter, sendFriendfeed, sendFacebook, sendDelicious, sendIdentica);
		firestatus.hide();
	},
	
	updateCharCount: function(event) {
		var statusText = document.getElementById('statusText').value;
		document.getElementById('charcount').value = statusText.length;
		if (event)
		    switch (event.keyCode) {
			    case 27:
				    firestatus.hide();
				    break;
			    case 13:
				    statusInput.sendStatusUpdate();
				    break;
		    }
	},
	
	toggleSendUrl: function() {
		document.getElementById("shortenUrl").disabled = document.getElementById("sendUrl").checked;
        var statusText = document.getElementById('statusText').value;
	   	if (document.getElementById("sendUrl").checked)
		    document.getElementById('statusText').value = statusText.replace(firestatus.url, "").trim();
		else {		
		    firestatus.url = document.getElementById("urlbar").value;
		    document.getElementById('statusText').value = statusText.trim() + " " + firestatus.url;
		}
	}
};

window.addEventListener("load", function(e) { statusInput.onLoad(e); }, false);
window.addEventListener("unload", function(e) { statusInput.onUnload(e); }, false);
