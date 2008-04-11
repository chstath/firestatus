/*
 * Copyright (c) 2008 Dionysios Synodinos
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

var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"]
	.getService(Components.interfaces.nsIPasswordManager);	


	
function sendStatusUpdate() {
	var statusText = document.getElementById('statusText').value;
	alert('message was: '+statusText);
	
	if (firestatus.twitterEnabled) {
		sendStatusUpdateTwitter();
	}
	/*if (document.getElementById("selectedConsumerLinkedIn").checked) {
		sendStatusUpdateTwitter();
	}
	if (document.getElementById("selectedConsumerFacebook").checked) {
		sendStatusUpdateFacebook();
	}*/
	sendStatusUpdateLinkedIn();
	sendStatusUpdateFacebook();
	//sendStatusUpdateFriendFeed();
}

function sendStatusUpdateTwitter() {
	var statusText = document.getElementById('statusText').value;
	alert("Sending to Twitter");
	var status = encodeURIComponent(status);
	req = new XMLHttpRequest ();   
	//req.onreadystatechange = getTwitterResponse; 
	req.open("POST","http://twitter.com:80/statuses/update.xml?status="+statusText, true);
	var auth = firestatus.twitterUsername+":"+firestatus.twitterPassword;
	req.setRequestHeader("Authorization", "Basic "+btoa(auth));
	req.send(null); 
	
}

function sendStatusUpdateLinkedIn() {
	alert("Sending to LinkedIn");
	return true
}

function sendStatusUpdateFacebook() {
	alert("Sending to Facebook");
	return true
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