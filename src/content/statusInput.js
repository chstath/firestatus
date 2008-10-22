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
		document.getElementById("statusText").focus();
	},
	
	onUnload: function() {
		firestatus.prefs.setBoolPref("lastTwitterChecked", document.getElementById("selectedConsumerTwitter").checked);
		firestatus.prefs.setBoolPref("lastFriendfeedChecked", document.getElementById("selectedConsumerFriendfeed").checked);
		firestatus.prefs.setBoolPref("lastFacebookChecked", document.getElementById("selectedConsumerFacebook").checked);
	},
	
	sendStatusUpdate: function() {
		var statusText = document.getElementById('statusText').value;
		var url = document.getElementById("sendUrl").checked ? document.getElementById("urlbar").value : "";
		var sendTwitter = firestatus.twitterEnabled && document.getElementById("selectedConsumerTwitter").checked;
		var sendFriendfeed = firestatus.friendfeedEnabled && document.getElementById("selectedConsumerFriendfeed").checked;
		var sendFacebook = firestatus.facebookEnabled && document.getElementById("selectedConsumerFacebook").checked;
		if (url && document.getElementById("shortenUrl").checked)
			firestatus.getShrinkedUrl(encodeURI(url), statusText, sendTwitter, sendFriendfeed, sendFacebook);
		else {
			if (sendTwitter) {
				firestatus.sendStatusUpdateTwitter(statusText, url);
			}
			if (sendFriendfeed) {
				firestatus.sendStatusUpdateFriendfeed(statusText, url);
			}
			if (sendFacebook) {
//				firestatus.sendStatusUpdateFacebook(statusText, url);
				firestatus.sendStatusUpdateMyspace(statusText, url);
			}
		}
		firestatus.hide();
	},

	updateCharCount: function(event) {
		var statusText = document.getElementById('statusText').value;
		document.getElementById('charcount').value = statusText.length;
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
	}
};

window.addEventListener("load", function(e) { statusInput.onLoad(e); }, false);
window.addEventListener("unload", function(e) { statusInput.onUnload(e); }, false);