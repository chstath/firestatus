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
	firestatus: window.opener.firestatus,
	
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
		if (this.firestatus.friendfeedEnabled) {
			if (this.firestatus.prefs.prefHasUserValue("lastFriendfeedChecked")) {
				document.getElementById("selectedConsumerFriendfeed").checked = this.firestatus.prefs.getBoolPref("lastFriendfeedChecked");
			}
			else {
				document.getElementById("selectedConsumerFriendfeed").checked = true;
				this.firestatus.prefs.setBoolPref("lastFriendfeedChecked", true);
			}
		}
		else {
			document.getElementById("selectedConsumerFriendfeed").disabled = true;
			document.getElementById("selectedConsumerFriendfeed").checked = false;
			this.firestatus.prefs.setBoolPref("lastFriendfeedChecked", false);
		}
		if (this.firestatus.facebookEnabled) {
			if (this.firestatus.prefs.prefHasUserValue("lastFacebookChecked")) {
				document.getElementById("selectedConsumerFacebook").checked = this.firestatus.prefs.getBoolPref("lastFacebookChecked");
			}
			else {
				document.getElementById("selectedConsumerFacebook").checked = true;
				this.firestatus.prefs.setBoolPref("lastFacebookChecked", true);
			}
		}
		else {
			document.getElementById("selectedConsumerFacebook").disabled = true;
			document.getElementById("selectedConsumerFacebook").checked = false;
			this.firestatus.prefs.setBoolPref("lastFacebookChecked", false);
		}
	},
	
	onUnload: function() {
		this.firestatus.prefs.setBoolPref("lastTwitterChecked", document.getElementById("selectedConsumerTwitter").checked);
		this.firestatus.prefs.setBoolPref("lastFriendfeedChecked", document.getElementById("selectedConsumerFriendfeed").checked);
		this.firestatus.prefs.setBoolPref("lastFacebookChecked", document.getElementById("selectedConsumerFacebook").checked);
	},
	
	sendStatusUpdate: function() {
		var statusText = document.getElementById('statusText').value;
		var url = document.getElementById("sendUrl").checked ? window.opener.document.getElementById("urlbar").value : "";
		if (url && document.getElementById("shortenUrl").checked)
			url = this.firestatus.getShrinkedUrl(encodeURI(url));
		if (this.firestatus.twitterEnabled && document.getElementById("selectedConsumerTwitter").checked) {
			this.firestatus.sendStatusUpdateTwitter(statusText, url);
		}
		if (this.firestatus.friendfeedEnabled && document.getElementById("selectedConsumerFriendfeed").checked) {
			this.firestatus.sendStatusUpdateFriendfeed(statusText, url);
		}
		if (document.getElementById("selectedConsumerFacebook").checked) {
			this.sendStatusUpdateFacebook(statusText, url);
		}
	},

	sendStatusUpdateFacebook: function(statusText, url) {
		this.firestatus.cons.logStringMessage("Starting facebook update...")
		if (url)
			statusText += " " + url;
	//	var status = encodeURIComponent(statusText); //Somehow the status update fails if the status is encoded
	
		this.firestatus.facebookClient.updateStatus(statusText);
	},
	
	updateCharCount: function() {
		var statusText = document.getElementById('statusText').value;
		document.getElementById('charcount').value = statusText.length;
	},
	
	toggleSendUrl: function() {
		document.getElementById("shortenUrl").disabled = document.getElementById("sendUrl").checked;
	}
};

window.addEventListener("load", function(e) { statusInput.onLoad(e); }, false);
window.addEventListener("unload", function(e) { statusInput.onUnload(e); }, false);