/* -*- mode: JavaScript; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*- */
/* ex: set tabstop=4 expandtab: */
/*
 * Copyright (c) 2011 simon@simonbcn.net, Christos V. Stathis
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

var facebookClient = {};
facebookClient.appKey = "11871218332";
facebookClient.firestatus = window.firestatus;
facebookClient.oauthToken = "";
facebookClient.uid = null;
    
facebookClient.loadOauthPrefs = function() {
    if (firestatus.prefs.prefHasUserValue("facebook_oauth_token") &&
        firestatus.prefs.prefHasUserValue("facebook_uid")) {
        facebookClient.oauthToken = firestatus.prefs.getCharPref("facebook_oauth_token");
        facebookClient.uid = firestatus.prefs.getCharPref("facebook_uid");
    }
    else {
        facebookClient.oauthToken = "";
        facebookClient.uid = "";
    }
};

facebookClient.authenticate = function (doNext, doNextParams) {      
    window.open("chrome://firestatus/content/fbOAuth.xul", "Facebook Authentication", "modal,width=600,height=500,scrollbars=1,toolbar=0,location=0,minimizable=0,chrome,centerscreen");
    if (facebookClient.firestatus.prefs.prefHasUserValue("facebook_oauth_token"))
        facebookClient.oauthToken = facebookClient.firestatus.prefs.getCharPref("facebook_oauth_token");
    else
        facebookClient.oauthToken = "";
    
    var req = new XMLHttpRequest();
    req.open("GET", "https://graph.facebook.com/me?access_token=" + facebookClient.appKey + "|" + facebookClient.oauthToken, true);
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            if (req.status != 200) {
                facebookClient.oauthToken = "";
                facebookClient.uid = "";
                alert("Error: " +  req.status + ": " + req.statusText + ": " + JSON.parse(req.responseText).error.message);
            } else {
                facebookClient.uid = JSON.parse(req.responseText).id;
                facebookClient.firestatus.prefs.setCharPref("facebook_uid", facebookClient.uid);
                if (doNext)
                    if (doNextParams)
                        doNext(doNextParams[0], doNextParams[1]);
                    else
                        doNext();
            }
        }
    };
    req.send(null);
};

facebookClient.sendStatus = function(status, url) {
    if (facebookClient.oauthToken == "") {
        facebookClient.authenticate(facebookClient.sendStatus, [status, url]);
        return;
    }

    var params = "access_token=" + facebookClient.appKey + "|" + facebookClient.oauthToken + "&message=" + encodeURIComponent(status);
    if (url) {   
        params += "&link=" +  encodeURIComponent(url);
    }
    var req = new XMLHttpRequest();
    req.open("POST", "https://graph.facebook.com/me/feed");
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.setRequestHeader("Content-length", params.length);
    req.setRequestHeader("Connection", "close");
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            if (req.status == 400 || req.status == 403) {
                facebookClient.authenticate(facebookClient.sendStatus, [status, url]);
                return;
            }
            if (req.status != 200) {
                alert("Error: " +  req.status + ": " + req.statusText + ": " + JSON.parse(req.responseText).error.message);  
            }
        }
    }; 
    req.send(params);        
};
    
facebookClient.getNotifications = function() {
    if (facebookClient.oauthToken == "") {
        facebookClient.authenticate(facebookClient.getNotifications);
        return;
    }
    
    var queries = {};
    queries.notifications = "select notification_id, title_text, href, updated_time from notification " + 
        "where recipient_id=" + this.uid + " and is_unread=1 and is_hidden=0 and updated_time>" + firestatus.queue.lastFacebookTimestamp;
    queries.user_stream = "select post_id, updated_time, message, permalink, attribution, actor_id, attachment from stream where updated_time>" + firestatus.queue.lastFacebookTimestamp + " and is_hidden=0 and source_id in (SELECT target_id FROM connection WHERE is_following=1 and source_id=" + this.uid + ")";    
    queries.users = "select id, name, pic from profile where id in (select actor_id from #user_stream)";            
    var queriesStr = encodeURIComponent(JSON.stringify(queries));    
    var req = new XMLHttpRequest();
    req.open("GET", "https://api.facebook.com/method/fql.multiquery?access_token=" + facebookClient.appKey + "|" + facebookClient.oauthToken + "&queries=" + queriesStr + "&format=JSON");
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            if (req.status == 200) {
                var response = JSON.parse(req.responseText);
                if (!response.error_code) {
                    facebookClient.showNotifications(response);
                } else {
                    alert("Error: " + response.error_msg);    
                }
            } else {
                alert("Error: " + req.status + ", " + JSON.parse(req.responseText).error_msg);                      
            }
        };
    };
    req.send(null);            
};
    
facebookClient.showNotifications = function(response) {
    var notifications = response[0].fql_result_set;
    var stream = response[1].fql_result_set;
    var users = response[2].fql_result_set;
    var total = [];
    if (notifications.length) {
        total = notifications.reverse();        
    }
    if (stream.length) {
        total = total.concat(stream.reverse());        
    }
    for (var i=0; i<total.length; i++) {
        var n = total[i];
        var title = "Facebook";
        var text = "";
        var image = "chrome://firestatus/skin/facebook.png";
        if (n.attachment && n.attachment.media && n.attachment.media[0]) {
            var media = n.attachment.media[0];
            image = media.src;
            if (n.attachment.name) {
                text = n.attachment.name;             
            }
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
        if (n.title_text && n.title_text != text) {
            text += " " + n.title_text;            
        }
        else if (n.message && n.message != text) {
            text += " " + n.message;            
        }
        if (text == "" && n.attachment) {
            text += n.attachment.href;            
        }
        if (n.attribution) {
            text += " (" + n.attribution + ")";            
        }
        firestatus.queue.updateQueue.push({id: n.notification_id ? n.notification_id : n.post_id,
                                          timestamp: n.updated_time,
                                          title: title,
                                          image: image,
                                          text: text.length > 140 ? text.substring(0, 140) : text,
                                          link: n.href ? n.href : n.permalink
                                         });
        firestatus.queue.lastFacebookTimestamp = n.updated_time;
        firestatus.prefs.setCharPref("lastFacebookTimestamp", n.updated_time);
    }
    if (!firestatus.queue.processingQueue) {
        firestatus.queue.processingQueue = true;
        firestatus.queue.displayNotification();
    }
};
