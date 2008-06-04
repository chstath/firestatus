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

	getAuthToken: function() {
		var params = [];
	    params.push('method=facebook.auth.createToken');
	    params.push('api_key=' + this.apiKey);
	    params.push('v=1.0');
	    params.push('format=JSON');
	    params.push('sig=' + this.generateSig(params, this.defaultSecret));
	    var req = new XMLHttpRequest();
	    req.open("GET", "http://api.facebook.com/restserver.php?"+params.join('&'), false); //All calls are synchronous because when asynchronous I got some strange exceptions. We need to change that
		req.send(null);
		dump(req.responseText + "\n");
	    var authToken = eval(req.responseText);//req.responseXML.getElementsByTagName("auth_createToken_response")[0].textContent;
		return authToken;
	},
	
	getSession: function(refresh) {
		if (window.opener == undefined)
			var firestatus = window.firestatus;
		else
			var firestatus = window.opener.firestatus;
		if (firestatus.prefs.prefHasUserValue("fbSessionKey") && 
			firestatus.prefs.prefHasUserValue("fbSecret")) {
			var session_key = firestatus.prefs.getCharPref("fbSessionKey");
			var secret = firestatus.prefs.getCharPref("fbSecret");
			dump(session_key + "\n");
			dump(secret + "\n");
			dump(refresh + "\n");
		}
		if (!refresh && session_key != undefined && secret != undefined) {
			dump("Using existing key...\n");
			return {session_key:session_key, secret:secret};
		}
		var authToken = this.getAuthToken();
		if (authToken != undefined) {
			//After getting the auth token we MUST send the user to the login page. If he is
			//already logged on to facebook all is well. If he is not the rest of the process will fail. We need to fix this by somehow waiting for the
			//user to successfuly login (how do we know that?)
			window.open("http://www.facebook.com/login.php?api_key=53cc37e556054cec6af3b1a672ea5849&v=1.0&popup=&auth_token=" + authToken, "", "chrome, centerscreen,width=646,height=520,modal=yes,dialog=yes,close=yes");
			var params = [];
	    	params.push('method=facebook.auth.getSession');
	    	params.push('api_key=' + this.apiKey);
	    	params.push('v=1.0');
			params.push('auth_token='+authToken);
		    params.push('format=JSON');
	    	params.push('sig=' + this.generateSig(params, this.defaultSecret));
	    	var req = new XMLHttpRequest();
			req.open("GET", "https://api.facebook.com/restserver.php?" + params.join('&'), false);//All calls are synchronous because when asynchronous I got some strange exceptions. We need to change that
			req.send(null);
			dump(req.responseText + "\n");
			var session = eval( "(" + req.responseText + ")");
			dump(session.session_key + "\n");
			firestatus.prefs.setCharPref("fbSessionKey", session.session_key);
			firestatus.prefs.setCharPref("fbSecret", session.secret);
			return session;
		}
	},
	
	updateStatus: function(sessionKey, secret, status) {
		var params = [];
	    params.push('method=users.setStatus');
	    params.push('api_key=' + this.apiKey);
	    params.push('v=1.0');
		params.push('session_key=' + sessionKey);
		params.push('call_id=' + new Date().getTime());
	    params.push('format=JSON');
		params.push('status=' + status);
	    params.push('sig=' + this.generateSig(params, secret));
	    var req = new XMLHttpRequest();
		req.open("GET", "http://api.facebook.com/restserver.php?"+params.join('&'), false);//All calls are synchronous because when asynchronous I got some strange exceptions. We need to change that
		req.send(null);
		dump("Updating status\n");
		dump(req.responseText + "\n");
		var result = eval("(" + req.responseText + ")");
		if (result.error_code == undefined) {
			dump("Status has been updated ... probably\n");
			return "";
		}
		else {
			return result.error_code;
		}
	},

	getNotifications: function(sessionKey, secret) {
		var params = [];
	    params.push('method=notifications.get');
	    params.push('api_key=' + this.apiKey);
		params.push('session_key=' + sessionKey);
		params.push('call_id=' + new Date().getTime());
	    params.push('v=1.0');
	    params.push('format=JSON');
		params.push('status=' + status);
	    params.push('sig=' + this.generateSig(params, secret));
	    var req = new XMLHttpRequest();
		req.open("GET", "http://api.facebook.com/restserver.php?"+params.join('&'), false);//All calls are synchronous because when asynchronous I got some strange exceptions. We need to change that
		req.send(null);
		dump(req.responseText + "\n");
		var result = eval("(" + req.responseText + ")");
		if (result.error_code == undefined) {
			return {messages: result.messages.unread,
					pokes: result.pokes.unread,
					shares: result.shares.unread
					};
		}
		else {
			return result.error_code;
		}
	}
}
