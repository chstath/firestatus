///* -*- mode: JavaScript; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*- */
///* ex: set tabstop=4 expandtab: */
///*
// * Copyright (c) 2011 Christos V. Stathis
// *
// * Permission to use, copy, modify, and distribute this software for any
// * purpose with or without fee is hereby granted, provided that the above
// * copyright notice and this permission notice appear in all copies.
// *
// * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
// * */

var deliciousClient = {};
deliciousClient.oauthConsumerSecret = "8514e3cf72bfe372139a899f92b9f058606d6014";
deliciousClient.oauthConsumerKey = "dj0yJmk9SmphdVZLVlh2aUVIJmQ9WVdrOVMwZE9RVmx4TkdNbWNHbzlPVFExT0RNMk56WXkmcz1jb25zdW1lcnNlY3JldCZ4PTMy";
deliciousClient.version = "1.0";
deliciousClient.signatureMethod = "HMAC-SHA1";
deliciousClient.oauthToken = "";
deliciousClient.oauthTokenSecret = "";

deliciousClient.getOauthHeader = function(httpMethod, url, parameters) {
    var message = {
        method: httpMethod,
        action: url,
        parameters: parameters
    };
    var accessor = { 
        consumerSecret: deliciousClient.oauthConsumerSecret,
        tokenSecret: deliciousClient.oauthTokenSecret
    };
    message.parameters.push(["oauth_consumer_key", deliciousClient.oauthConsumerKey]);
    message.parameters.push(["oauth_signature_method", deliciousClient.signatureMethod]);
    message.parameters.push(["oauth_version", deliciousClient.version]);
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    return OAuth.getAuthorizationHeader("", message.parameters);
};

deliciousClient.requestAccessToken = function(requestToken, pin, doNext, nextParams) {
    var httpMethod = "POST";
    var accessTokenUrl = "https://api.login.yahoo.com/oauth/v2/get_token";    
    var parameters = [];
    parameters.push(["oauth_token", requestToken]);
    parameters.push(["oauth_verifier", pin]);
    var oauthHeader = deliciousClient.getOauthHeader(httpMethod, accessTokenUrl, parameters);
    var req = new XMLHttpRequest();
    req.open(httpMethod, accessTokenUrl, true);
    req.setRequestHeader("Authorization", oauthHeader);
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            var response = req.responseText;
            firestatus.cons.logStringMessage(response);
            switch(req.status) {
                case 200:
                    var tokens = response.split('&');
                    var oauth_token = tokens[0].substring(tokens[0].indexOf('=') + 1);
                    var oauth_token_secret = tokens[1].substring(tokens[1].indexOf('=') + 1);
                    var oauth_session_handle = tokens[3].substring(tokens[2].indexOf('=') + 1);
                    deliciousClient.oauthToken = oauth_token;
                    deliciousClient.oauthTokenSecret = oauth_token_secret;
					deliciousClient.oauthSessionHandle = oauth_session_handle;
                    firestatus.prefs.setCharPref("delicious_oauth_token", oauth_token);
                    firestatus.prefs.setCharPref("delicious_oauth_token_secret", oauth_token_secret);
                    firestatus.prefs.setCharPref("delicious_oauth_session_handle", oauth_session_handle);
                    if (nextParams)
                        doNext(nextParams[0], nextParams[1], nextParams[2], nextParams[3]);
                    else
                        doNext();
                    break;
                default:
                    alert("Failed to request access token from delicious. Reponse was " + req.status);
            }
        }
    }
    req.send(null);
};

deliciousClient.authenticate = function (doNext, nextParams) {
    deliciousClient.oauthToken = "";
    deliciousClient.oauthTokenSecret = ""; //Must be cleared
    var httpMethod = "POST";
    var requestTokenUrl = "https://api.login.yahoo.com/oauth/v2/get_request_token";
    var callback = "oob";
    var parameters = [];
    parameters.push(["oauth_callback", callback]);
    
    var oauthHeader = deliciousClient.getOauthHeader(httpMethod, requestTokenUrl, parameters);
     
    var req = new XMLHttpRequest();
    req.open(httpMethod, requestTokenUrl, true);
    req.setRequestHeader("Authorization", oauthHeader);
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            var response = req.responseText;
            firestatus.cons.logStringMessage(response);
             switch(req.status) {
                case 200:
                    var tokens = response.split('&');
                    var oauth_token = tokens[0].substring(tokens[0].indexOf('=') + 1);
                    deliciousClient.oauthTokenSecret = tokens[1].substring(tokens[1].indexOf('=') + 1);
					var authorizationUrl = unescape(tokens[3].substring(tokens[3].indexOf('=') + 1));
                    window.open(authorizationUrl, "", "centerscreen,modal=yes,close=yes");
                    var pin = prompt("Enter PIN from delicious:");
                    deliciousClient.requestAccessToken(oauth_token, pin, doNext, nextParams);
                    break;
                default:
                    alert("Failed to authenticate with delicious. Reponse was " + req.status);
            }
        }
    }
    req.send(null);            
};

deliciousClient.loadOauthPrefs = function() {
    if (firestatus.prefs.prefHasUserValue("delicious_oauth_token") &&
            firestatus.prefs.prefHasUserValue("delicious_oauth_token_secret")) {
        deliciousClient.oauthToken = firestatus.prefs.getCharPref("delicious_oauth_token");
        deliciousClient.oauthTokenSecret = firestatus.prefs.getCharPref("delicious_oauth_token_secret");
    }
    else {
        deliciousClient.oauthToken = "";
        deliciousClient.oauthTokenSecret = "";
    }
};

deliciousClient.deliciousUpdates = function() {
	if (firestatus.queue.processingQueue) return;

    var httpMethod = "GET";
    var homeUrl = "https://api.twitter.com/1/statuses/home_timeline.json?since_id=" + firestatus.queue.lastTwitterId;

    if (deliciousClient.oauthToken == "" || deliciousClient.oauthTokenSecret == "") {
        deliciousClient.authenticate(deliciousClient.deliciousUpdates);
        return;
    }
        
    var parameters = [];
    parameters.push(["oauth_token", deliciousClient.oauthToken]);
    
    var oauthHeader = deliciousClient.getOauthHeader(httpMethod, homeUrl, parameters);
    var req = new XMLHttpRequest();
    req.open('GET', homeUrl, true);
    req.setRequestHeader("Authorization", oauthHeader);
    req.onreadystatechange = function () {
      if (req.readyState == 4) {
             if(req.status == 200) {
	            	var Ci = Components.interfaces;
	            	var Cc = Components.classes;
	            	var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
                    var jsonString = req.responseText;
					var statuses = nativeJSON.decode(jsonString);
					if (statuses.length == 0)
						return;
					// Sort the status updates, oldest first.
					statuses.sort(function(a, b) {
									return a.id - b.id;
								});
					for (var i = 0; i < statuses.length; i++) {
						var status = statuses[i];
						var t = Date.parse(status.created_at);
						if (status.id <= firestatus.queue.lastTwitterId)
							continue;
						var text = "";
						try {
						  text = decodeURI(status.text);
						} catch (error) {
						  firestatus.cons.logStringMessage("Error decoding delicious update: " +
										   status.text);
						  text = status.text;
						}
						firestatus.queue.updateQueue.push({id: status.id,
								image: status.user.profile_image_url,
								title: status.user.name,
								text: status.text.length > 140 ? status.text.substring(0, 140) : status.text,
								link: firestatus.TWITTER_URL + '/' + status.user.screen_name +
                                        '/status/' + status.id});
					}
					firestatus.queue.lastTwitterId = status.id;
					firestatus.prefs.setIntPref("lastTwitterId", status.id);
					if (!firestatus.queue.processingQueue) {
						firestatus.queue.processingQueue = true;
						firestatus.queue.displayNotification();
					}
             } else if(req.status == 304)
			 	return;
			 else if (req.status == 401) { //oauth_token expired
                deliciousClient.authenticate(deliciousClient.deliciousUpdates);
			 } 	
			 else
             	firestatus.cons.logStringMessage("Error getting delicious updates. " +
											 "req.status="+req.status);
      }   
    };
    req.send(null);
};

deliciousClient.sendStatusUpdateDelicious = function (statusText, deliciousTags, url, title) {
    if (deliciousClient.oauthToken == "" || deliciousClient.oauthTokenSecret == "") {
        deliciousClient.authenticate(deliciousClient.sendStatusUpdateDelicious, [statusText, deliciousTags, url, title]);
        return;
    }

	var shared = firestatus.prefs.getBoolPref("deliciousShared");
	url = encodeURI(url);
	title = encodeURI(title);
	statusText = encodeURI(statusText);
	deliciousTags = encodeURI(deliciousTags);
    var params = "url=" + url + "&description=" + title + "&extended=" + statusText + "&tags=" + deliciousTags + "&shared=" + (shared ? "yes" : "no");

    var httpMethod = 'POST';
	var postUrl = 'http://api.del.icio.us/v2/posts/add';

    var parameters = [];
    parameters.push(["oauth_token", deliciousClient.oauthToken]);
    parameters.push(["url", url]);
    parameters.push(["description", title]);
    parameters.push(["extended", statusText]);
    parameters.push(["tags", deliciousTags]);
    parameters.push(["shared", shared ? "yes" : "no"]);
    
    var oauthHeader = deliciousClient.getOauthHeader(httpMethod, postUrl, parameters);

	var req = new XMLHttpRequest ();   
	req.open("POST", postUrl, true);
    req.setRequestHeader("Authorization", oauthHeader);
    req.onreadystatechange = function () {
	    if (req.readyState == 4) {
		    switch(req.status) {
			    case 200:
				    firestatus.cons.logStringMessage("delicious update sent.");
					break;
				case 401:
					firestatus.cons.logStringMessage("delicious response: Not Authorized");
                    deliciousClient.authenticate(deliciousClient.sendStatusUpdateDelicious, [statusText, deliciousTags, url, title]);
					return;
				default:
					firestatus.cons.logStringMessage("Unknown delicious status: "+req.status);
					firestatus.cons.logStringMessage("delicious response: "+req.responseText);
			}
			if (req.status != 200)
			    alert("Failed to update delicious. Response was " + req.status + ": " + req.responseText);
		}
	};
	req.setRequestHeader("Content-length", params.length);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
	req.send(params); 
};
