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
	prefs: null,
	twitterEnabled: false,
	twitterUsername: "",
	twitterPassword: "",
	
	onLoad: function(){
		// Initialization code
		this.initialized = true;
		this.strings = document.getElementById("firestatus-strings");

		// Register to receive notifications of preference changes
	    this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
	        .getService(Components.interfaces.nsIPrefService)
	        .getBranch("extensions.firestatus.");
	    this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
	    this.prefs.addObserver("", this, false);
	    
	    this.twitterEnabled = this.prefs.getBoolPref("twitterEnabled");
	    this.twitterUsername = this.prefs.getCharPref("twitterUsername");
	    this.twitterPassword = this.prefs.getCharPref("twitterPassword");
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
			case "twitterUsername":
		    	this.twitterUsername = this.prefs.getCharPref("twitterUsername");
		    	break;
			case "twitterPassword":
		    	this.twitterPassword = this.prefs.getCharPref("twitterPassword");
		    	break;
		}
	}
};
window.addEventListener("load", function(e) { firestatus.onLoad(e); }, false);
window.addEventListener("unload", function(e) { firestatus.onUnload(e); }, false);


