/* -*- mode: JavaScript; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*- */
/* ex: set tabstop=4 expandtab: */
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
    firestatus: window.firestatus,
    
    generateSig: function(params, secret) {
        var Cc = Components.classes;
        var Ci = Components.interfaces;
        // Load MD5 code...
        Cc['@mozilla.org/moz/jssubscript-loader;1']
            .getService(Ci.mozIJSSubScriptLoader)
        .loadSubScript('chrome://firestatus/content/md5.js', firestatus);
        var str = '';
        params.sort();
        for (var i = 0; i < params.length; i++) {
            str += params[i];
        }
        str += secret;
        return firestatus.hex_md5(str);
    },

    getNewSessionAndUpdate: function(status, url) {
        var params = [];
        params.push('method=facebook.auth.createToken');
        params.push('api_key=' + this.apiKey);
        params.push('v=1.0');
        params.push('format=JSON');
        params.push('sig=' + this.generateSig(params, this.defaultSecret));
        var req = new XMLHttpRequest();
        req.open("GET", "http://api.facebook.com/restserver.php?"+params.join('&'), true);
        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                dump(req.responseText + "\n");
                dump(req.status + "\n");
                 switch(req.status) {
                    case 200:
                        firestatus.cons.logStringMessage("Response from getAuthToken: "  + req.responseText);
                        var Ci = Components.interfaces;
                        var Cc = Components.classes;
                        var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
                        var jsonString = "{\"authToken\":" + req.responseText + "}";
                        var authToken = nativeJSON.decode(jsonString).authToken;
                        firestatus.cons.logStringMessage("authToken retrieved: " + authToken);
                        if (authToken != undefined) {
                            //After getting the auth token we MUST send the user to the login page. If he is
                            //already logged on to facebook all is well. If he is not the rest of the process will fail. We need to fix this by somehow waiting for the
                            //user to successfuly login (how do we know that?)
                            window.open("http://www.facebook.com/login.php?api_key=53cc37e556054cec6af3b1a672ea5849&v=1.0&popup=&auth_token=" + authToken, "", "centerscreen,width=646,height=520,modal=yes,close=yes");
                            var params2 = [];
                            params2.push('method=facebook.auth.getSession');
                            params2.push('api_key=' + facebookClient.apiKey);
                            params2.push('v=1.0');
                            params2.push('auth_token='+authToken);
                            params2.push('format=JSON');
                            params2.push('sig=' + facebookClient.generateSig(params2, facebookClient.defaultSecret));
                            var req2 = new XMLHttpRequest();
                            req2.open("GET", "https://api.facebook.com/restserver.php?" + params2.join('&'), true);
                            req2.onreadystatechange = function () {
                                if (req2.readyState == 4) {
                                    dump(req2.responseText + "\n");
                                    dump(req2.status + "\n");
                                     switch(req2.status) {
                                        case 200:
                                            firestatus.cons.logStringMessage("Response from getSession: " + req2.responseText);
                                            var Ci = Components.interfaces;
                                            var Cc = Components.classes;
                                            var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
                                            var jsonString = req2.responseText;
                                            var session = nativeJSON.decode(jsonString);
                                            firestatus.cons.logStringMessage("Session key: " + session.session_key);
                                            facebookClient.firestatus.prefs.setCharPref("fbSessionKey", session.session_key);
                                            facebookClient.firestatus.prefs.setCharPref("fbSecret", session.secret);
                                            facebookClient.firestatus.prefs.setCharPref("fbUid", session.uid);
                                            if (url)
                                                facebookClient.finallySendLink(session, status, url);
                                            else
                                                facebookClient.finallyUpdateStatus(session, status);
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
                                            firestatus.cons.logStringMessage("Unknown facebook code: "+req2.status);
                                            firestatus.cons.logStringMessage("Facebook response: "+req2.responseText);
                                     }
                                }
                            };
                            req2.send(null);
                        }
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
                        firestatus.cons.logStringMessage("Unknown facebook code: "+req.status);
                        firestatus.cons.logStringMessage("Facebook response: "+req.responseText);
                 }
            }
        };
        req.send(null);
    },
    
    updateStatus: function(status, url) {
        if (this.firestatus.prefs.prefHasUserValue("fbSessionKey") && 
            this.firestatus.prefs.prefHasUserValue("fbSecret") &&
            this.firestatus.prefs.prefHasUserValue("fbUid")) {
            var session_key = this.firestatus.prefs.getCharPref("fbSessionKey");
            var secret = this.firestatus.prefs.getCharPref("fbSecret");
            var uid = this.firestatus.prefs.getCharPref("fbUid");
            firestatus.cons.logStringMessage("Session key exists: " + session_key);
            firestatus.cons.logStringMessage("Secret exists: " + secret);
            if (session_key != undefined && secret != undefined && uid != undefined) {
                firestatus.cons.logStringMessage("Using existing key...\n");
                var session = {session_key:session_key, secret:secret, uid:uid};
                if (url)
                    facebookClient.finallySendLink(session, status, url);
                else
                    facebookClient.finallyUpdateStatus(session, status);
                return;
            }
        }
        firestatus.cons.logStringMessage("Key does not exist.");
        facebookClient.getNewSessionAndUpdate(status, url);
    },

    /**
     * Code for UTF-8 encoding was found here
     * http://www.webtoolkit.info/javascript-utf8.html
     */
    convert2UTF8 : function(input) {
        var utftext = "";
        if (typeof input != "string")
            return input;
        for (var n = 0; n < input.length; n++) {
            var c = input.charCodeAt(n);
             
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    },

    finallyUpdateStatus : function(session, status) {
        var params = [];
        params.push('method=users.setStatus');
        params.push('api_key=' + this.apiKey);
        params.push('v=1.0');
        params.push('session_key=' + session.session_key);
        var callId = new Date().getTime();
        params.push('call_id=' + callId);
        params.push('format=JSON');
        params.push('status_includes_verb=1');
        //Use utb8 encoding for calculating the signature....
        var utf8Status = facebookClient.convert2UTF8(status);
        params.push('status=' + utf8Status);
        var sig = this.generateSig(params, session.secret);

        params = [];
        params.push('method=users.setStatus');
        params.push('api_key=' + this.apiKey);
        params.push('v=1.0');
        params.push('session_key=' + session.session_key);
        params.push('call_id=' + callId);
        params.push('format=JSON');
        params.push('status_includes_verb=1');
        //... but send the original status
        params.push('status=' + encodeURIComponent(status));
        params.push('sig=' + sig);
        facebookClient.sendUpdate(params, status);
    },
    
    finallySendLink : function(session, status, url) {
        var params = [];
        params.push('method=links.post');
        params.push('api_key=' + this.apiKey);
        params.push('v=1.0');
        params.push('session_key=' + session.session_key);
        var callId = new Date().getTime();
        params.push('call_id=' + callId);
        params.push('format=JSON');
        params.push('uid=' + session.uid);
        params.push('url=' + url);
        var utf8Status = facebookClient.convert2UTF8(status);
        params.push('comment=' + utf8Status);
        var sig = this.generateSig(params, session.secret);

        params = [];
        params.push('method=links.post');
        params.push('api_key=' + this.apiKey);
        params.push('v=1.0');
        params.push('session_key=' + session.session_key);
        params.push('call_id=' + callId);
        params.push('format=JSON');
        params.push('uid=' + session.uid);
        params.push('url=' + url);
        params.push('comment=' + encodeURIComponent(status));
        params.push('sig=' + sig);
        facebookClient.sendLink(params, status, url);
    },

    sendUpdate: function(params, status) {
        var req = new XMLHttpRequest();
        req.open("POST", "http://api.facebook.com/restserver.php", true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.setRequestHeader("Content-length", params.join('&').length);
        req.setRequestHeader("Connection", "close");
        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                dump(req.responseText + "\n");
                dump(req.status + "\n");
                 switch(req.status) {
                    case 200:
                        var Ci = Components.interfaces;
                        var Cc = Components.classes;
                        var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
                        var jsonString = req.responseText;
                        firestatus.cons.logStringMessage(jsonString);
                        if (jsonString == "true") {
                            firestatus.cons.logStringMessage("Facebook update sent.");
                        }
                        else {
                            var result = nativeJSON.decode(jsonString);
                            var code = result.error_code;
                            firestatus.cons.logStringMessage("Facebook returned code: " + code);
                            if (code == 250) {
                                firestatus.cons.logStringMessage("Requesting authorization...");
                                gBrowser.selectedTab = gBrowser.addTab("http://www.facebook.com/authorize.php?api_key=" + facebookClient.apiKey + "&v=1.0&ext_perm=status_update");
                                var newTabBrowser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
                                newTabBrowser.addEventListener("load", function () {
                                      if (newTabBrowser.contentDocument.body.innerHTML.indexOf("You may now close this window") !== -1) {
                                        gBrowser.removeCurrentTab();
                                        facebookClient.sendUpdate(params);
                                      }
                                      
                                }, true);
                            }
                            else if (code == 102 || code == 450 || code == 452) {
                                firestatus.cons.logStringMessage("Asking for new session key...");
                                facebookClient.getNewSessionAndUpdate(status);
                            }
                            else if (code != "") {
                                alert("Facebook status will not be updated (" + code + ")");
                            }
                        }
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
                        firestatus.cons.logStringMessage("Unknown facebook code: "+req.status);
                        firestatus.cons.logStringMessage("Facebook response: "+req.responseText);
                 }
			    if (req.status != 200)
			        alert("Failed to update facebook. Response was " + req.status + ": " + req.responseText);
            }
        };
        firestatus.cons.logStringMessage("Updating facebook status");
        req.send(params.join('&'));
    },
    
    sendLink: function(params, status, url) {
        var req = new XMLHttpRequest();
        req.open("POST", "http://api.facebook.com/restserver.php", true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.setRequestHeader("Content-length", params.join('&').length);
        req.setRequestHeader("Connection", "close");
        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                dump(req.responseText + "\n");
                dump(req.status + "\n");
                 switch(req.status) {
                    case 200:
                        var Ci = Components.interfaces;
                        var Cc = Components.classes;
                        var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
                        var jsonString = req.responseText;
                        if (jsonString.substr(0, 1) != "{")
                            jsonString = "{\"link_id\":" + jsonString + "}";
                        firestatus.cons.logStringMessage(jsonString);
                        var result = nativeJSON.decode(jsonString);
                        if (result.link_id) {
                            firestatus.cons.logStringMessage("Facebook update sent.");
                        }
                        else {
                            var code = result.error_code;
                            firestatus.cons.logStringMessage("Facebook returned code: " + code);
                            if (code == 282) {
                                firestatus.cons.logStringMessage("Requesting share_item extended permission...");
                                 gBrowser.selectedTab = gBrowser.addTab("http://www.facebook.com/authorize.php?api_key=" + facebookClient.apiKey + "&v=1.0&ext_perm=share_item");
                                var newTabBrowser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
                                newTabBrowser.addEventListener("load", function () {
                                      if (newTabBrowser.contentDocument.body.innerHTML.indexOf("You may now close this window") !== -1) {
                                        gBrowser.removeCurrentTab();
                                        facebookClient.sendLink(params, status, url);
                                      }
                                      
                                }, true);
                            }
                            else if (code == 102 || code == 450 || code == 452) {
                                firestatus.cons.logStringMessage("Asking for new session key...");
                                facebookClient.getNewSessionAndUpdate(status, url);
                            }
                            else if (code != "") {
                                alert("Facebook status will not be updated (" + code + ")");
                            }
                        }
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
                        firestatus.cons.logStringMessage("Unknown facebook code: "+req.status);
                        firestatus.cons.logStringMessage("Facebook response: "+req.responseText);
                 }
			    if (req.status != 200)
			        alert("Failed to update facebook. Response was " + req.status + ": " + req.responseText);
            }
        };
        firestatus.cons.logStringMessage("Updating facebook status");
        req.send(params.join('&'));
    },

    getNotifications: function() {
        if (this.firestatus.prefs.prefHasUserValue("fbSessionKey") && 
                this.firestatus.prefs.prefHasUserValue("fbSecret") &&
                this.firestatus.prefs.prefHasUserValue("fbUid")) {
                var session_key = this.firestatus.prefs.getCharPref("fbSessionKey");
                var secret = this.firestatus.prefs.getCharPref("fbSecret");
                var uid = this.firestatus.prefs.getCharPref("fbUid");
                firestatus.cons.logStringMessage("Session key exists: " + session_key);
                firestatus.cons.logStringMessage("Secret exists: " + secret);
                if (session_key != undefined && secret != undefined) {
                    firestatus.cons.logStringMessage("Using existing key...\n");
                    var session = {session_key:session_key, secret:secret, uid:uid};
                    facebookClient.finallyGetNotifications(session);
                    return;
                }
            }
            firestatus.cons.logStringMessage("Key does not exist.");
            facebookClient.getNewSessionAndNotifications();
    },  
    
    getNewSessionAndNotifications: function() {
        var params = [];
        params.push('method=facebook.auth.createToken');
        params.push('api_key=' + this.apiKey);
        params.push('v=1.0');
        params.push('format=JSON');
        params.push('sig=' + this.generateSig(params, this.defaultSecret));
        var req = new XMLHttpRequest();
        req.open("GET", "http://api.facebook.com/restserver.php?"+params.join('&'), true);
        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                dump(req.responseText + "\n");
                dump(req.status + "\n");
                 switch(req.status) {
                    case 200:
                        firestatus.cons.logStringMessage("Response from getAuthToken: "  + req.responseText);
                        var Ci = Components.interfaces;
                        var Cc = Components.classes;
                        var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
                        var jsonString = "{\"authToken\":" + req.responseText + "}";
                        var authToken = nativeJSON.decode(jsonString).authToken;
                        firestatus.cons.logStringMessage("authToken retrieved: " + authToken);
                        if (authToken != undefined) {
                            //After getting the auth token we MUST send the user to the login page. If he is
                            //already logged on to facebook all is well. If he is not the rest of the process will fail. We need to fix this by somehow waiting for the
                            //user to successfuly login (how do we know that?)
                            window.open("http://www.facebook.com/login.php?api_key=53cc37e556054cec6af3b1a672ea5849&v=1.0&popup=&auth_token=" + authToken, "", "centerscreen,width=646,height=520,modal=yes,close=yes");
                            var params2 = [];
                            params2.push('method=facebook.auth.getSession');
                            params2.push('api_key=' + facebookClient.apiKey);
                            params2.push('v=1.0');
                            params2.push('auth_token='+authToken);
                            params2.push('format=JSON');
                            params2.push('sig=' + facebookClient.generateSig(params2, facebookClient.defaultSecret));
                            var req2 = new XMLHttpRequest();
                            req2.open("GET", "https://api.facebook.com/restserver.php?" + params2.join('&'), true);
                            req2.onreadystatechange = function () {
                                if (req2.readyState == 4) {
                                    dump(req2.responseText + "\n");
                                    dump(req2.status + "\n");
                                     switch(req2.status) {
                                        case 200:
                                            firestatus.cons.logStringMessage("Response from getSession: " + req2.responseText);
                                            var Ci = Components.interfaces;
                                            var Cc = Components.classes;
                                            var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
                                            var jsonString = req2.responseText;
                                            var session = nativeJSON.decode(jsonString);
                                            firestatus.cons.logStringMessage("Session key: " + session.session_key);
                                            facebookClient.firestatus.prefs.setCharPref("fbSessionKey", session.session_key);
                                            facebookClient.firestatus.prefs.setCharPref("fbSecret", session.secret);
                                            facebookClient.firestatus.prefs.setCharPref("fbUid", session.uid);
                                            facebookClient.finallyGetNotifications(session);
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
                                            firestatus.cons.logStringMessage("Unknown facebook code: "+req2.status);
                                            firestatus.cons.logStringMessage("Facebook response: "+req2.responseText);
                                     }
                                }
                            };
                            req2.send(null);
                        }
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
                        firestatus.cons.logStringMessage("Unknown facebook code: "+req.status);
                        firestatus.cons.logStringMessage("Facebook response: "+req.responseText);
                 }
            }
        };
        req.send(null);
    },

    finallyGetNotifications: function(session) {
        var params = [];
        params.push('method=fql.multiquery');
        params.push('api_key=' + this.apiKey);
        params.push('session_key=' + session.session_key);
        var callId = new Date().getTime();
        params.push('call_id=' + callId);
        var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
        var queries = {};
        queries.notifications = "select notification_id, title_text, href, updated_time from notification " + 
                                "where recipient_id=" + session.uid + 
                                " and is_unread=1 and is_hidden=0 and updated_time>" + firestatus.queue.lastFacebookTimestamp;
//        queries.stream = "select post_id, updated_time, message, permalink, message, attribution, actor_id from stream where viewer_id=" + session.uid + " and updated_time>" + firestatus.queue.lastFacebookTimestamp + " and is_hidden=0 and source_id in (SELECT target_id FROM connection WHERE source_id=" + session.uid + ")";    
        queries.user_stream = "select post_id, updated_time, message, permalink, attribution, actor_id, attachment from stream where updated_time>" + firestatus.queue.lastFacebookTimestamp + " and is_hidden=0 and source_id in (SELECT target_id FROM connection WHERE is_following=1 and source_id=" + session.uid + ")";    
//        queries.user_stream = "select post_id, updated_time, message, permalink, message, attribution, actor_id, attachment from stream where updated_time>0 and is_hidden=0 and source_id in (SELECT target_id FROM connection WHERE source_id=" + session.uid + ")";    
        queries.users = "select id, name, pic from profile where id in (select actor_id from #user_stream)";
        var queriesStr = nativeJSON.encode(queries);    
        params.push('queries=' + queriesStr);
        firestatus.cons.logStringMessage(nativeJSON.encode(queries));
        params.push('v=1.0');
        params.push('format=JSON');
        var sig = this.generateSig(params, session.secret);
        params = [];
        params.push('method=fql.multiquery');
        params.push('api_key=' + this.apiKey);
        params.push('session_key=' + session.session_key);
        params.push('call_id=' + callId);
        params.push('queries=' + encodeURIComponent(queriesStr));
        params.push('v=1.0');
        params.push('format=JSON');
        params.push('sig=' + sig);
        facebookClient.getNotifications1(params);
    },
    
    getNotifications1: function(params) {
        var req = new XMLHttpRequest();
        req.open("GET", "http://api.facebook.com/restserver.php?"+params.join('&'), true);
        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                dump(req.responseText + "\n");
                dump(req.status + "\n");
                 switch(req.status) {
                    case 200:
                        var Ci = Components.interfaces;
                        var Cc = Components.classes;
                        var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
                        var jsonString = req.responseText;
                        firestatus.cons.logStringMessage(jsonString);
                        var result = nativeJSON.decode(jsonString);
                        var code = result.error_code;
                        if (!code) {
                            var notifications = result[0].fql_result_set;
                            var stream = result[1].fql_result_set;
                            var users = result[2].fql_result_set;
                            var total = [];
                            if (notifications.length)
                              total = notifications.reverse();
                            if (stream.length)
                              total = total.concat(stream.reverse());
                            for (var i=0; i<total.length; i++) {
                                  var n = total[i];
                                  var title = "Facebook";
                                  var text = "";
                                  var image = "chrome://firestatus/skin/facebook.png";
                                  if (n.attachment && n.attachment.media && n.attachment.media[0]) {
                                     var media = n.attachment.media[0];
                                     image = media.src;
                                     if (n.attachment.name)
                                        text = n.attachment.name;
                                  }
                                  if (n.actor_id) {
                                    for (var u=0; u<users.length; u++) {
                                      if (users[u].id==n.actor_id) {
                                          title = users[u].name;
                                          image = users[u].pic;
                                          break;
                                      }
                                    }
                                  }
                                  if (n.title_text && n.title_text != text)
                                    text += " " + n.title_text;
                                  else if (n.message && n.message != text)
                                    text += " " + n.message;
                                  if (text == "" && n.attachment)
                                    text += n.attachment.href;
                                  if (n.attribution)
                                    text += " (by " + n.attribution + ")";
                                  firestatus.queue.updateQueue.push({id: n.notification_id ? n.notification_id : n.post_id,
                                                                      timestamp: n.updated_time,
                                                                      title: title,
                                                                      image: image,
                                                                      text: text,
                                                                      link: n.href ? n.href : n.permalink
                                                                     });
                      						firestatus.queue.lastFacebookTimestamp = n.updated_time;
                      						firestatus.prefs.setCharPref("lastFacebookTimestamp", n.updated_time);
                            }
                            if (!firestatus.queue.processingQueue) {
                                firestatus.queue.processingQueue = true;
                                firestatus.queue.displayNotification();
                            }
                        }
                        else {
                            firestatus.cons.logStringMessage("Facebook returned code: " + code);
                            if (code == 250) {
                                firestatus.cons.logStringMessage("Requesting authorization...");
                                gBrowser.selectedTab = gBrowser.addTab("http://www.facebook.com/authorize.php?api_key=" + facebookClient.apiKey + "&v=1.0&ext_perm=status_update");
                                var newTabBrowser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
                                newTabBrowser.addEventListener("load", function () {
                                      if (newTabBrowser.contentDocument.body.innerHTML.indexOf("You may now close this window") !== -1) {
                                        gBrowser.removeCurrentTab();
                                        facebookClient.getNotifications1(params);
                                      }
                                      
                                }, true);
                            }
                            else if (code == 102) {
                                firestatus.cons.logStringMessage("Asking for new session key...");
                                facebookClient.getNewSessionAndNotifications();
                            }
                            else if (code == 612) {
                                firestatus.cons.logStringMessage("Requesting authorization...");
                                gBrowser.selectedTab = gBrowser.addTab("http://www.facebook.com/authorize.php?api_key=" + facebookClient.apiKey + "&v=1.0&ext_perm=read_stream");
                                var newTabBrowser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
                                newTabBrowser.addEventListener("load", function () {
                                      if (newTabBrowser.contentDocument.body.innerHTML.indexOf("You may now close this window") !== -1) {
                                        gBrowser.removeCurrentTab();
                                        facebookClient.getNotifications1(params);
                                      }
                                      
                                }, true);
                            }
                        }
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
                        firestatus.cons.logStringMessage("Unknown facebook code: "+req.status);
                        firestatus.cons.logStringMessage("Facebook response: "+req.responseText);
                 }
            }
        };
        firestatus.cons.logStringMessage("Getting facebook notifications");
        req.send(null);
    },
    
    rssParser: {
    loadFeed: function(url) {
      var GetFeed = url;
      var req = new XMLHttpRequest();
      req.open("POST", escape(url), true);
      req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      req.onreadystatechange = function() {
        if (req.readyState == 4 && request.status == 200) {
          if (req.responseText) {
            processFeed(request.responseText, parseData);
          }
        }
      }
      req.send(null);
    },
    
    processFeed: function(response, callback) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(response, "text/xml");
      callback(doc.documentElement);
    },
    
    parseData: function(data) {
      var items = data.getElementsByTagName('item');
      var output = '<ul>';
      for (var i = 0; i < items.length; ++i) {
        var title = valueFromTagName(items[i], 'title');
        var link = valueFromTagName(items[i], 'link');
        output += '<li><strong><a href ="' + link + '">' + title + '</strong> ' + '</li>';
      }
      output += '</ul>';
      var RSSOutput = document.getElementById('RSSOutput');
      RSSOutput.innerHTML = output;
    },

    valueFromTagName: function(item, tagname) {
      var val = item.getElementsByTagName(tagname);
      return val[0].firstChild.nodeValue;
    }
  }
}
