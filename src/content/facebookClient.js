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
	session: {sessionKey: "", uid: "", secret: ""},
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
	    params.push('sig=' + this.generateSig(params, this.defaultSecret));
	    var req = new XMLHttpRequest();
	    req.open('POST', "http://api.facebook.com/restserver.php?"+params.join('&'), false); //All calls are synchronous because when asynchronous I got some strange exceptions. We need to change that
		req.send(null);
		dump(req.responseText);
	    var authToken = req.responseXML.getElementsByTagName("auth_createToken_response")[0].textContent;
		return authToken;
	},
	
	getSession: function(authToken) {
		if (this.session.sessionKey != "")
			return this.session;
		var params = [];
	    params.push('method=facebook.auth.getSession');
	    params.push('api_key=' + this.apiKey);
	    params.push('v=1.0');
		params.push('auth_token='+authToken);
	    params.push('sig=' + this.generateSig(params, this.defaultSecret));
	    var req = new XMLHttpRequest();
		req.open('POST', "https://api.facebook.com/restserver.php?" + params.join('&'), false);//All calls are synchronous because when asynchronous I got some strange exceptions. We need to change that
		req.send(null);
		dump(req.responseText);
		session_key = req.responseXML.getElementsByTagName("session_key")[0];
		if (session_key == undefined)
			return {errorCode: req.responseXML.getElementsByTagName("error_code")[0].textContent};
		var sessionKey = session_key.textContent;
		var uid = req.responseXML.getElementsByTagName("uid")[0].textContent;
		var secret = req.responseXML.getElementsByTagName("secret")[0].textContent;
		this.session = {sessionKey: sessionKey, uid: uid, secret: secret};
		return this.session;
	},
	
	updateStatus: function(sessionKey, secret, status) {
		var params = [];
	    params.push('method=users.setStatus');
	    params.push('api_key=' + this.apiKey);
	    params.push('v=1.0');
		params.push('session_key=' + sessionKey);
		params.push('call_id=' + new Date().getTime());
		params.push('status=' + status);
	    params.push('sig=' + this.generateSig(params, secret));
	    var req = new XMLHttpRequest();
		req.open('POST', "http://api.facebook.com/restserver.php?"+params.join('&'), false);//All calls are synchronous because when asynchronous I got some strange exceptions. We need to change that
		req.send(null);
		dump("Updating status");
		dump(req.responseText);
		var error_code = req.responseXML.getElementsByTagName("error_code")[0];
		if (error_code == undefined)
			dump("Status has been updated ... probably");
		else {
			return error_code.textContent
		}
	}
}
