var facebookClient = {
    firestatus: window.firestatus,
    uid: null,

    checkOAuth: function() {
        if (!this.firestatus.prefs.prefHasUserValue("fbToken")) {
            openDialog("chrome://firestatus/content/fbOAuth.xul","fbOAuth","modal,width=600,height=500,scrollbars=1,toolbar=0,location=0,minimizable=0,chrome,centerscreen");
            this.checkOAuth();
        } else {
            var req = new XMLHttpRequest();
            req.open("GET", "https://graph.facebook.com/me?access_token=11871218332|"+this.firestatus.prefs.getCharPref("fbToken"),false);
            req.send(null);
            if (req.status != 200) {
                this.firestatus.prefs.clearUserPref("fbToken");
                this.checkOAuth();
            } else {
                this.uid = JSON.parse(req.responseText).id;
            }
        }
    },

    prePostStatus: function(status, url) {
        var params = "&message="+encodeURIComponent(status);
        if (url) {
            params += "&link="+encodeURIComponent(url)+"&picture=http%3A//img194.imageshack.us/img194/9322/nonea.gif";
        }
        this.postStatus(params);
    },

    postStatus: function(params) {
        if (!this.firestatus.prefs.prefHasUserValue("fbToken")) {
            this.checkOAuth();
            this.postMessage(params);
        } else {
            var req = new XMLHttpRequest();
            var params = "access_token=11871218332|"+this.firestatus.prefs.getCharPref("fbToken")+params;
            req.open("POST", "https://graph.facebook.com/me/feed", true);
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            req.setRequestHeader("Content-length", params.length);
            req.setRequestHeader("Connection", "close");
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status != 200) {
                        alert("Error: "+JSON.parse(req.responseText).error.message);
                    }
                }
            };
            req.send(params);
        }
    },

    getNotifications: function() {
        if (!this.firestatus.prefs.prefHasUserValue("fbToken") || this.uid == null) {
            this.checkOAuth();
            this.getNotifications();
        } else {
            var queries = {};
            queries.notifications = "select notification_id, title_text, href, updated_time from notification " +
                "where recipient_id=" + this.uid + " and is_unread=1 and is_hidden=0 and updated_time>" + firestatus.queue.lastFacebookTimestamp;
            queries.user_stream = "select post_id, updated_time, message, permalink, attribution, actor_id, attachment from stream where updated_time>" + firestatus.queue.lastFacebookTimestamp + " and is_hidden=0 and source_id in (SELECT target_id FROM connection WHERE is_following=1 and source_id=" + this.uid + ")";
            queries.users = "select id, name, pic from profile where id in (select actor_id from #user_stream)";
            var queriesStr = encodeURIComponent(JSON.stringify(queries));
            var req = new XMLHttpRequest();
            req.open("GET", "https://api.facebook.com/method/fql.multiquery?access_token=11871218332|"+this.firestatus.prefs.getCharPref("fbToken")+"&queries="+queriesStr+"&format=JSON");
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        var response = JSON.parse(req.responseText);
                        if (!response.error_code) {
                            facebookClient.showNotifications(response);
                        } else {
                            alert("Error: "+response.error_msg);
                        }
                    } else {
                        alert("Error: "+req.status+", "+JSON.parse(req.responseText).error_msg);
                    }
                };
            };
            req.send(null);
        };

    },

    showNotifications: function(response) {
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
    }
}
