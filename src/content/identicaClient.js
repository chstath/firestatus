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

var identicaClient = {};
identicaClient.oauthConsumerSecret = "cd11856d30b263eae8cc0e479557e7b8";
identicaClient.oauthConsumerKey = "7c13bcf2637b20bcb9462913841cbbaa";
identicaClient.version = "1.0";
identicaClient.signatureMethod = "HMAC-SHA1";
identicaClient.oauthToken = "";
identicaClient.oauthTokenSecret = "";

identicaClient.getOauthHeader = function(httpMethod, url, parameters) {
    var message = {
        method: httpMethod,
        action: url,
        parameters: parameters
    };
    var accessor = {
        consumerSecret: identicaClient.oauthConsumerSecret,
        tokenSecret: identicaClient.oauthTokenSecret
    };
    message.parameters.push(["oauth_consumer_key", identicaClient.oauthConsumerKey]);
    message.parameters.push(["oauth_signature_method", identicaClient.signatureMethod]);
    message.parameters.push(["oauth_version", identicaClient.version]);
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    return OAuth.getAuthorizationHeader("", message.parameters);
};

identicaClient.requestAccessToken = function(requestToken, pin, doNext, nextParams) {
    var httpMethod = "POST";
    var accessTokenUrl = "https://identi.ca/api/oauth/access_token";
    var parameters = [];
    parameters.push(["oauth_token", requestToken]);
    parameters.push(["oauth_verifier", pin]);
    var oauthHeader = identicaClient.getOauthHeader(httpMethod, accessTokenUrl, parameters);
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
                    identicaClient.oauthToken = oauth_token;
                    identicaClient.oauthTokenSecret = oauth_token_secret;
                    firestatus.prefs.setCharPref("identica_oauth_token", oauth_token);
                    firestatus.prefs.setCharPref("identica_oauth_token_secret", oauth_token_secret);
                    if (nextParams)
                        doNext(nextParams[0]);
                    else
                        doNext();
                    break;
                default:
                    alert("Failed to request access token from identica. Reponse was " + req.status);
            }
        }
    }
    req.send(null);
};

identicaClient.authenticate = function (doNext, nextParams) {
    identicaClient.oauthToken = "";
    identicaClient.oauthTokenSecret = ""; //Must be cleared
    var httpMethod = "POST";
    var requestTokenUrl = "https://identi.ca/api/oauth/request_token";
    var authorizationUrl = "https://identi.ca/api/oauth/authorize";
    var callback = "oob";
    var parameters = [];
    parameters.push(["oauth_callback", callback]);

    var oauthHeader = identicaClient.getOauthHeader(httpMethod, requestTokenUrl, parameters);

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
                    identicaClient.oauthTokenSecret = tokens[1].substring(tokens[1].indexOf('=') + 1);
                    window.open(authorizationUrl + "?oauth_token=" + oauth_token, "", "centerscreen,width=646,height=520,modal=yes,close=yes,chrome");
                    var pin = prompt("Enter PIN from Identi.ca:");
                    identicaClient.requestAccessToken(oauth_token, pin, doNext, nextParams);
                    break;
                default:
                    alert("Failed to authenticate with Identica. Reponse was " + req.status);
            }
        }
    }
    req.send(null);
};

identicaClient.loadOauthPrefs = function() {
    if (firestatus.prefs.prefHasUserValue("identica_oauth_token") &&
            firestatus.prefs.prefHasUserValue("identica_oauth_token_secret")) {
        identicaClient.oauthToken = firestatus.prefs.getCharPref("identica_oauth_token");
        identicaClient.oauthTokenSecret = firestatus.prefs.getCharPref("identica_oauth_token_secret");
    }
    else {
        identicaClient.oauthToken = "";
        identicaClient.oauthTokenSecret = "";
    }
};

identicaClient.identicaUpdates = function() {
	if (firestatus.queue.processingQueue) return;
	var milliseconds = new Number(firestatus.queue.lastIdenticaTimestamp);
	var FRIENDS_URL = firestatus.IDENTICA_URL + '/api/statuses/friends_timeline.json?since=' +
				encodeURIComponent(new Date(milliseconds).toUTCString());

    var httpMethod = "GET";
    var homeUrl = "http://identi.ca/api/statuses/friends_timeline.json?since=" + encodeURIComponent(new Date(milliseconds).toUTCString());

    if (identicaClient.oauthToken == "" || identicaClient.oauthTokenSecret == "") {
        identicaClient.authenticate(identicaClient.identicaUpdates);
        return;
    }

    var parameters = [];
    parameters.push(["oauth_token", identicaClient.oauthToken]);

    var oauthHeader = identicaClient.getOauthHeader(httpMethod, homeUrl, parameters);
    var req = new XMLHttpRequest();
    req.open('GET', homeUrl, true);
    req.setRequestHeader("Authorization", oauthHeader);
    req.onreadystatechange = function () {
      if (req.readyState == 4) {
             if(req.status == 200) {
	            	var Ci = Components.interfaces;
	            	var Cc = Components.classes;
                    var jsonString = req.responseText;
					var statuses = JSON.parse(jsonString);
					if (statuses.length == 0)
						return;
					// Sort the status updates, oldest first.
					statuses.sort(function(a, b) {
									return a.id - b.id;
								});
					for (var i = 0; i < statuses.length; i++) {
						var status = statuses[i];
						var t = Date.parse(status.created_at);
						if (status.id <= firestatus.queue.lastidenticaId)
							continue;
						var text = "";
						try {
						  text = decodeURI(status.text);
						} catch (error) {
						  firestatus.cons.logStringMessage("Error decoding identica update: " +
										   status.text);
						  text = status.text;
						}
						firestatus.queue.updateQueue.push({id: status.id,
								image: status.user.profile_image_url,
								title: status.user.name,
								text: status.text.length > 140 ? status.text.substring(0, 140) : status.text,
								link: firestatus.identica_URL + '/' + status.user.screen_name +
                                        '/status/' + status.id});
					}
					firestatus.queue.lastidenticaId = status.id;
					firestatus.prefs.setIntPref("lastIdenticaId", status.id);
					if (!firestatus.queue.processingQueue) {
						firestatus.queue.processingQueue = true;
						firestatus.queue.displayNotification();
					}
             } else if(req.status == 304)
			 	return;
			 else if (req.status == 401) { //oauth_token expired
                identicaClient.authenticate(identicaClient.identicaUpdates);
			 }
			 else
             	firestatus.cons.logStringMessage("Error getting identica updates. " +
											 "req.status="+req.status);
      }
    };
    req.send(null);
};

identicaClient.sendStatusUpdateIdentica = function (statusText) {
    if (identicaClient.oauthToken == "" || identicaClient.oauthTokenSecret == "") {
        identicaClient.authenticate(identicaClient.sendStatusUpdateIdentica, [statusText]);
        return;
    }

    var status = statusText;

    var httpMethod = 'POST';
	var postUrl = 'https://identi.ca/api/statuses/update.json';;

    var parameters = [];
    parameters.push(["oauth_token", identicaClient.oauthToken]);
    parameters.push(["status", status]);

    var oauthHeader = identicaClient.getOauthHeader(httpMethod, postUrl, parameters);

	var req = new XMLHttpRequest ();
	req.open("POST", postUrl, true);
    req.setRequestHeader("Authorization", oauthHeader);
    req.onreadystatechange = function () {
	    if (req.readyState == 4) {
		    switch(req.status) {
			    case 200:
				    firestatus.cons.logStringMessage("Identica update sent.");
					break;
				case 400:
					firestatus.cons.logStringMessage("Identica response: Bad Request");
					break;
				case 401:
					firestatus.cons.logStringMessage("Identica response: Not Authorized");
                    identicaClient.authenticate(identicaClient.sendStatusUpdateidentica, [statusText, url]);
					return;
				case 403:
					firestatus.cons.logStringMessage("Identica response: Forbidden");
					break;
				case 404:
					firestatus.cons.logStringMessage("Identica response: Not Found");
					break;
				case 500:
					firestatus.cons.logStringMessage("Identica response: Internal Server Error");
					break;
				case 502:
					firestatus.cons.logStringMessage("Identica response: Bad Gateway");
					break;
				case 503:
					firestatus.cons.logStringMessage("Identica response: Service Unavailable");
					break;
				default:
					firestatus.cons.logStringMessage("Unknown Identica status: " + req.status);
					firestatus.cons.logStringMessage("Identica response: " + req.responseText);
			}
			if (req.status != 200)
			    alert("Failed to update identica. Response was " + req.status + ": " + req.responseText);
		}
	};
	status = "status=" + encodeURIComponent(status);
	req.setRequestHeader("Content-length", status.length);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
	req.send(status);
};
