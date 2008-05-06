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
    var status = encodeURIComponent(statusText);
    var req = new XMLHttpRequest ();   
    req.open("POST","http://twitter.com:80/statuses/update.json?status="+status, true);
    req.onreadystatechange = function () {
		firestatus.cons.logStringMessage("twitter readyState: "+req.readyState);
		firestatus.cons.logStringMessage("twitter status: "+req.status);
		firestatus.cons.logStringMessage("Twitter response: "+req.responseText);
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
    var auth = firestatus.twitterUsername+":"+firestatus.twitterPassword;
    req.setRequestHeader("Authorization", "Basic "+btoa(auth));
    req.send(null); 
}

function sendStatusUpdateLinkedIn(){
	return true;
}


function sendStatusUpdateFacebook(){
	dump("\n@@@@@@@@@@@@@@@@@@@@@Starting facebook update;")
	var statusText = document.getElementById('statusText').value +" "+ document.getElementById('statusTextUrl').value;
//	var status = encodeURIComponent(statusText); //Somehow the status update fails if the status is encoded

	var Cc = Components.classes;
	var Ci = Components.interfaces;
	// Load facebook code...
	Cc['@mozilla.org/moz/jssubscript-loader;1']
   		.getService(Ci.mozIJSSubScriptLoader)
   		.loadSubScript('chrome://firestatus/content/facebookClient.js'); //Is there any other way to gain access to the facebookClient object ??
	var session = facebookClient.getSession(); //The session can be stored for subsequent calls to facebook api
	if (session.errorCode != undefined) {
	
		var authToken = facebookClient.getAuthToken();
		//After getting the auth token we MUST send the user to the login page. If he is
		//already logged on to facebook all is well. If he is not the rest of the process will fail. We need to fix this by somehow waiting for the
		//user to successfuly login (how do we know that?)
		window.open("http://www.facebook.com/login.php?api_key=53cc37e556054cec6af3b1a672ea5849&v=1.0&auth_token=" + authToken, "", "chrome, centerscreen,width=646,height=520,modal=yes,dialog=yes,close=yes");
		session = facebookClient.getSession(authToken); //The session can be stored for subsequent calls to facebook api
	}
	if (session.errorCode == undefined) {
		var code = facebookClient.updateStatus(session.sessionKey, session.secret, statusText);
		if (code == 250) {
			window.open("http://www.facebook.com/authorize.php?api_key=" + facebookClient.apiKey + "&v=1.0&ext_perm=status_update", "", "chrome, centerscreen,width=646,height=520,modal=yes,dialog=yes,close=yes");
			code = facebookClient.updateStatus(session.sessionKey, session.secret, statusText);
			if (code != undefined)
				alert("Facebook status will not be updated");
		}
	}
	else alert("Facebook status will not be updated");
}


function sendStatusUpdateFriendFeed() {
	/* var statusText = document.getElementById('statusText').value;
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

