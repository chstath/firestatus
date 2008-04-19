/*
 * Copyright (c) 2008 Dionysios Synodinos, Christos V. Stathis
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

var firestatus = window.opener.firestatus;

	
function sendStatusUpdate() {
	var statusText = document.getElementById('statusText').value;
	if (firestatus.twitterEnabled && document.getElementById("selectedConsumerTwitter").checked) {
		sendStatusUpdateTwitter();
	}
	/*if (document.getElementById("selectedConsumerLinkedIn").checked) {
		sendStatusUpdateTwitter();
	}
	if (document.getElementById("selectedConsumerFacebook").checked) {
		sendStatusUpdateFacebook();
	}*/
//	sendStatusUpdateLinkedIn();
	if (document.getElementById("selectedConsumerFacebook").checked) {
		sendStatusUpdateFacebook();
	}
	//sendStatusUpdateFriendFeed();
}

function sendStatusUpdateTwitter() {
	var statusText = document.getElementById('statusText').value +" "+ getShrinkedUrl();
    alert("Sending to Twitter");
    var status = encodeURIComponent(statusText);
    var req = new XMLHttpRequest ();   
    //req.onreadystatechange = getTwitterResponse; 
    req.open("POST","http://twitter.com:80/statuses/update.xml?status="+status, true);
    var auth = firestatus.twitterUsername+":"+firestatus.twitterPassword;
    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
    req.send(null); 
}

function sendStatusUpdateLinkedIn(){
	alert("Sending to LinkedIn");
	return true;
}


function sendStatusUpdateFacebook(){
	dump("\n@@@@@@@@@@@@@@@@@@@@@Starting facebook update;")
	var statusText = document.getElementById('statusText').value +" "+ document.getElementById('statusTextUrl').value;
	alert("Sending to Facebook");
//	var status = encodeURIComponent(statusText); //Somehow the status update fails if the status is encoded

	var Cc = Components.classes;
	var Ci = Components.interfaces;
	// Load facebook code...
	Cc['@mozilla.org/moz/jssubscript-loader;1']
   		.getService(Ci.mozIJSSubScriptLoader)
   		.loadSubScript('chrome://firestatus/content/facebookClient.js'); //Is there any other way to gain access to the facebookClient object ??
	var authToken = facebookClient.getAuthToken();
	//After getting the auth token we MUST send the user to the login page. If he is
	//already logged on to facebook all is well. If he is not the rest of the process will fail. We need to fix this by somehow waiting for the
	//user to successfuly login (how do we know that?)
	window.opener.open("http://www.facebook.com/login.php?api_key=53cc37e556054cec6af3b1a672ea5849&v=1.0&auth_token=" + authToken);
	var session = facebookClient.getSession(authToken); //The session can be stored for subsequent calls to facebook api
	if (session.errorCode == undefined) {
		var code = facebookClient.updateStatus(session.sessionKey, session.secret, statusText);
		if (code == 250)
			window.opener.open("http://www.facebook.com/authorize.php?api_key="+ facebookClient.apiKey + "&v=1.0&ext_perm=status_update");
	}
}


function sendStatusUpdateFriendFeed() {
	/* var statusText = document.getElementById('statusText').value;
	alert("Sending to FriendFeed");
	var status = encodeURIComponent(status);
	req = new XMLHttpRequest ();   
	//req.onreadystatechange = getTwitterResponse; 
	req.open("POST","http://friendfeed.com//api/share?title="+statusText+"&nickname=firestatus&remotekey=rared739windy", true);
	req.send(null); */
}

function getShrinkedUrl() {
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
