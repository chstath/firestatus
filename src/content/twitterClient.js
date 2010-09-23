///* -*- mode: JavaScript; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*- */
///* ex: set tabstop=4 expandtab: */
///*
// * Copyright (c) 2010 Christos V. Stathis
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

var twitterClient = {};
twitterClient.oauthConsumerSecret = "turcwMkuexdTBpSZ29euwDzfW82yOMajKcsMQM5fAo";
twitterClient.oauthConsumerKey = "mcwWJJqeAIcRdQuz9vgXBA";
twitterClient.version = "1.0";
twitterClient.signatureMethod = "HMAC-SHA1";
twitterClient.oauthToken = "";
twitterClient.oauthTokenSecret = "";

twitterClient.getOauthHeader = function(httpMethod, url, parameters) {
    var message = {
        method: httpMethod,
        action: url,
        parameters: parameters
    };
    var accessor = { 
        consumerSecret: twitterClient.oauthConsumerSecret,
        tokenSecret: twitterClient.oauthTokenSecret
    };
    message.parameters.push(["oauth_consumer_key", twitterClient.oauthConsumerKey]);
    message.parameters.push(["oauth_signature_method", twitterClient.signatureMethod]);
    message.parameters.push(["oauth_version", twitterClient.version]);
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    return OAuth.getAuthorizationHeader("", message.parameters);
};

twitterClient.requestAccessToken = function(requestToken, pin, doNext, nextParams) {
    var httpMethod = "POST";
    var accessTokenUrl = "https://api.twitter.com/oauth/access_token";    
    var parameters = [];
    parameters.push(["oauth_token", requestToken]);
    parameters.push(["oauth_verifier", pin]);
    var oauthHeader = twitterClient.getOauthHeader(httpMethod, accessTokenUrl, parameters);
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
                    var user_id = tokens[2].substring(tokens[2].indexOf('=') + 1);
                    var screen_name = tokens[3].substring(tokens[3].indexOf('=') + 1);
                    twitterClient.oauthToken = oauth_token;
                    twitterClient.oauthTokenSecret = oauth_token_secret;
                    firestatus.prefs.setCharPref("twitter_oauth_token", oauth_token);
                    firestatus.prefs.setCharPref("twitter_oauth_token_secret", oauth_token_secret);
                    firestatus.prefs.setCharPref("twitter_user_id", user_id);
                    firestatus.prefs.setCharPref("twitter_screen_name", screen_name);
                    if (nextParams)
                        doNext(nextParams[0]);
                    else
                        doNext();
                    break;
                default:
                    alert("Failed to request access token from twitter. Reponse was " + req.status);
            }
        }
    }
    req.send(null);
};

twitterClient.authenticate = function (doNext, nextParams) {
    twitterClient.oauthToken = "";
    twitterClient.oauthTokenSecret = ""; //Must be cleared
    var httpMethod = "POST";
    var requestTokenUrl = "https://api.twitter.com/oauth/request_token";
    var authorizationUrl = "https://api.twitter.com/oauth/authorize";
    var callback = "oob";
    var parameters = [];
    parameters.push(["oauth_callback", callback]);
    
    var oauthHeader = twitterClient.getOauthHeader(httpMethod, requestTokenUrl, parameters);
     
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
                    twitterClient.oauthTokenSecret = tokens[1].substring(tokens[1].indexOf('=') + 1);
                    window.open(authorizationUrl + "?oauth_token=" + oauth_token, "", "centerscreen,width=646,height=520,modal=yes,close=yes,chrome");
                    var pin = prompt("Enter PIN from twitter:");
                    twitterClient.requestAccessToken(oauth_token, pin, doNext, nextParams);
                    break;
                default:
                    alert("Failed to authenticate with twitter. Reponse was " + req.status);
            }
        }
    }
    req.send(null);            
};

twitterClient.loadOauthPrefs = function() {
    if (firestatus.prefs.prefHasUserValue("twitter_oauth_token") &&
            firestatus.prefs.prefHasUserValue("twitter_oauth_token_secret")) {
        twitterClient.oauthToken = firestatus.prefs.getCharPref("twitter_oauth_token");
        twitterClient.oauthTokenSecret = firestatus.prefs.getCharPref("twitter_oauth_token_secret");
    }
    else {
        twitterClient.oauthToken = "";
        twitterClient.oauthTokenSecret = "";
    }
};

twitterClient.twitterUpdates = function() {
	if (firestatus.queue.processingQueue) return;

    var httpMethod = "GET";
    var homeUrl = "http://api.twitter.com/1/statuses/home_timeline.json?since_id=" + firestatus.queue.lastTwitterId;

    if (twitterClient.oauthToken == "" || twitterClient.oauthTokenSecret == "") {
        twitterClient.authenticate(twitterClient.twitterUpdates);
        return;
    }
        
    var parameters = [];
    parameters.push(["oauth_token", twitterClient.oauthToken]);
    
    var oauthHeader = twitterClient.getOauthHeader(httpMethod, homeUrl, parameters);
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
						  firestatus.cons.logStringMessage("Error decoding twitter update: " +
										   status.text);
						  text = status.text;
						}
						firestatus.queue.updateQueue.push({id: status.id,
								image: status.user.profile_image_url,
								title: status.user.name,
								text: status.text,
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
                twitterClient.authenticate(twitterClient.twitterUpdates);
			 } 	
			 else
             	firestatus.cons.logStringMessage("Error getting Twitter updates. " +
											 "req.status="+req.status);
      }   
    };
    req.send(null);
};

twitterClient.sendStatusUpdateTwitter = function (statusText) {
    if (twitterClient.oauthToken == "" || twitterClient.oauthTokenSecret == "") {
        twitterClient.authenticate(twitterClient.sendStatusUpdateTwitter, [statusText]);
        return;
    }

    var status = statusText;

    var httpMethod = 'POST';
	var postUrl = 'http://api.twitter.com/1/statuses/update.json';

    var parameters = [];
    parameters.push(["oauth_token", twitterClient.oauthToken]);
    parameters.push(["status", status]);
    
    var oauthHeader = twitterClient.getOauthHeader(httpMethod, postUrl, parameters);

	var req = new XMLHttpRequest ();   
	req.open("POST", postUrl, true);
    req.setRequestHeader("Authorization", oauthHeader);
    req.onreadystatechange = function () {
	    if (req.readyState == 4) {
		    switch(req.status) {
			    case 200:
				    firestatus.cons.logStringMessage("Twitter update sent.");
					break;
				case 400:
					firestatus.cons.logStringMessage("Twitter response: Bad Request");
					break;
				case 401:
					firestatus.cons.logStringMessage("Twitter response: Not Authorized");
                    twitterClient.authenticate(twitterClient.sendStatusUpdateTwitter, [statusText, url]);
					return;
				case 403:
					firestatus.cons.logStringMessage("Twitter response: Forbidden");
					break;
				case 404:
					firestatus.cons.logStringMessage("Twitter response: Not Found");
					break;
				case 500:
					firestatus.cons.logStringMessage("Twitter response: Internal Server Error");
					break;
				case 502:
					firestatus.cons.logStringMessage("Twitter response: Bad Gateway");
					break;
				case 503:
					firestatus.cons.logStringMessage("Twitter response: Service Unavailable");
					break;
				default:
					firestatus.cons.logStringMessage("Unknown Twitter status: "+req.status);
					firestatus.cons.logStringMessage("Twitter response: "+req.responseText);
			}
			if (req.status != 200)
			    alert("Failed to update twitter. Response was " + req.status + ": " + req.responseText);
		}
	};
	status = "status=" + encodeURIComponent(status);
	req.setRequestHeader("Content-length", status.length);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
	req.send(status); 
};

