/**
 * @author dsin
 */

const fsPrefs = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefService)
	.QueryInterface(Components.interfaces.nsIPrefBranch);
	
var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"]
	.getService(Components.interfaces.nsIPasswordManager);	


	
function sendStatusUpdate() {
	var statusText = document.getElementById('statusText').value;
	alert('message was: '+statusText);
	
	/*if (document.getElementById("selectedConsumerTwitter").checked) {
		sendStatusUpdateTwitter();
	}
	if (document.getElementById("selectedConsumerLinkedIn").checked) {
		sendStatusUpdateTwitter();
	}
	if (document.getElementById("selectedConsumerFacebook").checked) {
		sendStatusUpdateFacebook();
	}*/
	sendStatusUpdateTwitter();
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
	req.open("POST","http://"+"firestatus"+":"+"kwlaraki"+"@twitter.com:80/statuses/update.xml?status="+statusText, true);
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