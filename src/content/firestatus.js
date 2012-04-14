/* -*- mode: JavaScript; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*- */
/* ex: set tabstop=4 expandtab: */
/*
 * Copyright (c) 2008 Panagiotis Astithas, Christos V. Stathis
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
 */
if (typeof firestatus == "undefined") {
    var firestatus = {
        TWITTER_URL: 'http://twitter.com',
        TWITTER_URL_S: 'https://twitter.com',
        FRIENDFEED_URL: 'http://friendfeed.com',
        FACEBOOK_URL: 'http://facebook.com',
        DELICIOUS_URL_S: 'https://api.del.icio.us',
        IDENTICA_URL: 'http://identi.ca',
        cons: null,
        prefs: null,
        twitterUpdatesEnabled: false,
        twitterTimeoutId: 0,
        twitterTimeout: 5,
        friendfeedUpdatesEnabled: false,
        friendfeedTimeoutId: 0,
        friendfeedTimeout: 4,
        facebookUpdatesEnabled: false,
        facebookTimeout: 6,
        facebookTimeoutId: 0,
        shortURLService: 0, //tinyUrl
        deliciousShared: true,
        deliciousUpdatesEnabled: false,
        deliciousUsername: "",
        DELICIOUS_REALM: "del.icio.us API",
        DELICIOUS_HOST: "https://api.del.icio.us",
        deliciousTimeoutId: 0,
        deliciousTimeout: 5,
        identicaUpdatesEnabled: false,
        identicaUsername: "",
        IDENTICA_HOST: "http://identi.ca",
        IDENTICA_REALM: "Identi.ca API",
        identicaTimeoutId: 0,
        identicaTimeout: 7,
        // An initial queue for ordering FF updates before putting them in updateQueue.
        ffInitialQueue: [],
        initialTimeoutId: 0,
        initialized: false,
    
        onLoad: function(event) {
            var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]  
                           .getService(Components.interfaces.mozIJSSubScriptLoader);
            loader.loadSubScript("chrome://firestatus/content/oauth.js", firestatus);
            loader.loadSubScript("chrome://firestatus/content/facebookClient.js", firestatus);
            loader.loadSubScript("chrome://firestatus/content/twitterClient.js", firestatus);
            loader.loadSubScript("chrome://firestatus/content/identicaClient.js", firestatus);
            loader.loadSubScript("chrome://firestatus/content/sha1.js", firestatus);
            // Initialization code
            this.initialized = true;
            this.strings = document.getElementById("firestatus-strings");
    
            this.cons = Components.classes["@mozilla.org/consoleservice;1"].
                        getService(Components.interfaces.nsIConsoleService);
    
            // Register to receive notifications of preference changes
            this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService)
                .getBranch("extensions.firestatus.");
            this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
            this.prefs.addObserver("", this, false);
    
            this.twitterUpdatesEnabled = this.prefs.getBoolPref("twitterUpdatesEnabled");
            firestatus.twitterClient.loadOauthPrefs();
            this.twitterTimeout = this.prefs.getIntPref("twitterTimeout");
            this.queue.lastTwitterId = this.prefs.getCharPref("lastTwitterIdStr");
    
            this.friendfeedUpdatesEnabled = this.prefs.getBoolPref("friendfeedUpdatesEnabled");
            this.friendfeedTimeout = this.prefs.getIntPref("friendfeedTimeout");
            this.queue.lastFriendfeedId = this.prefs.getCharPref("lastFriendfeedId");
    
            this.facebookUpdatesEnabled = this.prefs.getBoolPref("facebookUpdatesEnabled");
            this.facebookClient.loadOauthPrefs();
            this.facebookTimeout = this.prefs.getIntPref("facebookTimeout");
            this.queue.lastFacebookTimestamp = this.prefs.getCharPref("lastFacebookTimestamp");
    
            this.shortURLService = this.prefs.getCharPref("shortURLService");
    
            this.deliciousShared = this.prefs.getBoolPref("deliciousShared");
            this.deliciousUpdatesEnabled = this.prefs.getBoolPref("deliciousUpdatesEnabled");
            this.deliciousUsername = this.prefs.getCharPref("deliciousUsername");
            this.deliciousTimeout = this.prefs.getIntPref("deliciousTimeout");
            if (window.document.getElementById("firestatus-selectedConsumerDelicious").checked)
                window.document.getElementById("firestatus-deliciousTags").hidden = false;
            else
                window.document.getElementById("firestatus-deliciousTags").hidden = true;
            this.queue.lastDeliciousTimestamp = this.prefs.getCharPref("lastDeliciousTimestamp");
    
            this.identicaUpdatesEnabled = this.prefs.getBoolPref("identicaUpdatesEnabled");
            firestatus.identicaClient.loadOauthPrefs();
            this.identicaTimeout = this.prefs.getIntPref("identicaTimeout");
            this.queue.lastIdenticaId = this.prefs.getIntPref("lastIdenticaId");
            this.queue.lastIdenticaTimestamp = this.prefs.getCharPref("lastIdenticaTimestamp");
    
            window.document.addEventListener('resize', function () {
                window.document.getElementById('firestatus-statusText').width = window.innerWidth * 0.9 - 350;
                window.document.getElementById('firestatus-deliciousTags').width = window.innerWidth * 0.9 - 350;
            }, false);
            firestatus.statusInput.onLoad(event);
            this.initialTimeoutId = window.setTimeout(this.resume, 1*1000);
        },
    
        onUnload: function(event) {
            this.prefs.removeObserver("", this);
            firestatus.statusInput.onUnload(event);
        },
    
        onClick: function(event) {
            if (event.button == 0 && !event.ctrlKey) {
                if (window.document.getElementById('firestatusContainer').getAttribute("collapsed") === "true")
                    firestatus.show();
                else
                    firestatus.hide();
            } else if (event.button == 2 || event.ctrlKey) {
                var panel = window.document.getElementById('firestatus-panel');
                var popup = window.document.getElementById('firestatus-popup');
                popup.openPopup(panel, 'after_start', 12, 4, true, false);
            }
        },
    
        show: function() {
            var fsContainer = window.document.getElementById('firestatusContainer');
            fsContainer.setAttribute("collapsed", 'false');
            var textField = window.document.getElementById('firestatus-statusText');
            var title = document.title;
            title = title.substr(0, title.lastIndexOf('-')-1).trim();
            firestatus.url = window.top.getBrowser().selectedBrowser.contentWindow.location.href;
            firestatus.shortUrl = null;
            if (document.getElementById("firestatus-sendUrl").checked) {
                if (document.getElementById("firestatus-shortenUrl").checked) {
                    firestatus.getShortUrl(firestatus.url, function () {
                        textField.value = title.trim() + " " + firestatus.shortUrl;
                        firestatus.statusInput.updateCharCount();
                        textField.select();
                    });
                }
                else {
                    textField.value = (title.trim() + " " + firestatus.url).trim();
                    firestatus.statusInput.updateCharCount();
                }
            }
            else {
    
                    textField.value = title.trim();
                    firestatus.statusInput.updateCharCount();
            }
    
            textField.select();
        },
    
        hide: function() {
            var fsContainer = window.document.getElementById('firestatusContainer');
            fsContainer.setAttribute("collapsed", 'true');
            firestatus.url = null;
            firestatus.shortUrl = null;
            window.document.getElementById('firestatus-statusText').value = "";
        },
    
        clear: function() {
            firestatus.queue.updateQueue.length = 0;
        },
    
        pause: function() {
            firestatus.queue.paused = !firestatus.queue.paused;
            if (firestatus.queue.paused)
              firestatus.suspend();
            else
              firestatus.resume();
        },
    
        suspend: function() {
            // Clear the initial timeout only the first time we are called.
            window.clearTimeout(firestatus.initialTimeoutId);
            return (firestatus.suspend = function() {
                    firestatus.cancelUpdates('twitter');
                    firestatus.cancelUpdates('friendfeed');
                    firestatus.cancelUpdates('facebook');
                    firestatus.cancelUpdates('delicious');
                    firestatus.cancelUpdates('identica');
                    firestatus.queue.processingQueue = true;
                    // Change the icon and menu label in every open browser window.
                    var strbundle = document.getElementById("firestatus-strings");
                    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Components.interfaces.nsIWindowMediator);
                    var enumerator = wm.getEnumerator("navigator:browser");
                    while(enumerator.hasMoreElements()) {
                        var win = enumerator.getNext();
                        win.document.getElementById('firestatus-icon').src = 'chrome://firestatus/skin/fs-icon-bw-16.png';
                        win.document.getElementById('firestatus-pause').label = strbundle.getString("extensions.firestatus.resume");
                    }
            })();
    
        },
    
        resume: function() {
            // Change the icon and menu label in every open browser window.
            var strbundle = document.getElementById("firestatus-strings");
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator);
            var enumerator = wm.getEnumerator("navigator:browser");
            while(enumerator.hasMoreElements()) {
                var win = enumerator.getNext();
                win.document.getElementById('firestatus-icon').src = 'chrome://firestatus/skin/fs-icon-16.png';
                win.document.getElementById('firestatus-pause').label = strbundle.getString("extensions.firestatus.pause");
            }
            firestatus.queue.processingQueue = false;
            if (firestatus.twitterUpdatesEnabled) {
              firestatus.twitterClient.twitterUpdates();
              firestatus.twitterTimeoutId = window.setInterval(firestatus.twitterClient.twitterUpdates, firestatus.twitterTimeout*60*1000);
            }
            if (firestatus.friendfeedUpdatesEnabled) {
              firestatus.friendfeedUpdates();
              firestatus.friendfeedTimeoutId = window.setInterval(firestatus.friendfeedUpdates, firestatus.friendfeedTimeout*60*1000);
            }
            if (firestatus.facebookUpdatesEnabled) {
              firestatus.facebookUpdates();
              firestatus.facebookTimeoutId = window.setInterval(firestatus.facebookUpdates, firestatus.facebookTimeout*60*1000);
            }
            if (firestatus.deliciousUpdatesEnabled) {
              firestatus.deliciousUpdates();
              firestatus.deliciousTimeoutId = window.setInterval(firestatus.deliciousUpdates, firestatus.deliciousTimeout*60*1000);
            }
            if (firestatus.identicaUpdatesEnabled) {
              firestatus.identicaClient.identicaUpdates();
              firestatus.identicaTimeoutId = window.setInterval(firestatus.identicaClient.identicaUpdates, firestatus.identicaTimeout*60*1000);
            }
       },
    
        observe: function(subject, topic, data) {
            if (topic != "nsPref:changed") {
                return;
            }
    
            switch(data) {
                case "twitterUpdatesEnabled":
                    this.twitterUpdatesEnabled = this.prefs.getBoolPref("twitterUpdatesEnabled");
                    if (this.twitterUpdatesEnabled) {
                        firestatus.twitterClient.twitterUpdates();
                        this.twitterTimeoutId = window.setInterval(firestatus.twitterClient.twitterUpdates,
                                                                   this.twitterTimeout*60*1000);
                    } else
                        this.cancelUpdates("twitter");
                    break;
                case "twitterTimeout":
                    this.twitterTimeout = this.prefs.getIntPref("twitterTimeout");
                    if (this.twitterUpdatesEnabled) {
                        this.cancelUpdates("twitter");
                        this.twitterTimeoutId = window.setInterval(firestatus.twitterClient.twitterUpdates,
                                                                   this.twitterTimeout*60*1000);
                    }
                    break;
                case "friendfeedUpdatesEnabled":
                    this.friendfeedUpdatesEnabled = this.prefs.getBoolPref("friendfeedUpdatesEnabled");
                    if (this.friendfeedUpdatesEnabled) {
                        this.friendfeedUpdates();
                        this.friendfeedTimeoutId = window.setInterval(this.friendfeedUpdates,
                                                                      this.friendfeedTimeout*60*1000);
                    } else
                        this.cancelUpdates("friendfeed");
                    break;
                case "friendfeedTimeout":
                    this.friendfeedTimeout = this.prefs.getIntPref("friendfeedTimeout");
                    if (this.friendfeedUpdatesEnabled) {
                        this.cancelUpdates("friendfeed");
                        this.friendfeedTimeoutId = window.setInterval(this.friendfeedUpdates,
                                                                      this.friendfeedTimeout*60*1000);
                    }
                    break;
                case "facebookUpdatesEnabled":
                    this.facebookUpdatesEnabled = this.prefs.getBoolPref("facebookUpdatesEnabled");
                    if (this.facebookUpdatesEnabled) {
                        this.facebookUpdates();
                        this.facebookTimeoutId = window.setInterval(this.facebookUpdates,
                                                                      this.facebookTimeout*60*1000);
                    } else
                        this.cancelUpdates("facebook");
                    break;
                case "deliciousShared":
                    this.deliciousShared = this.prefs.getBoolPref("deliciousShared");
                    break;
                case "deliciousUpdatesEnabled":
                    this.deliciousUpdatesEnabled = this.prefs.getBoolPref("deliciousUpdatesEnabled");
                    if (this.deliciousUpdatesEnabled) {
                        this.deliciousUpdates();
                        this.deliciousTimeoutId = window.setInterval(this.deliciousUpdates,
                                                                   this.deliciousTimeout*60*1000);
                    } else
                        this.cancelUpdates("delicious");
                    break;
                case "deliciousUsername":
                    this.deliciousUsername = this.prefs.getCharPref("deliciousUsername");
                    break;
                case "deliciousTimeout":
                    this.deliciousTimeout = this.prefs.getIntPref("deliciousTimeout");
                    if (this.deliciousUpdatesEnabled) {
                        this.cancelUpdates("delicious");
                        this.deliciousTimeoutId = window.setInterval(this.deliciousUpdates,
                                                                   this.deliciousTimeout*60*1000);
                    }
                    break;
                case "shortURLService":
                    this.shortURLService = this.prefs.getCharPref("shortURLService");
                    break;
                case "identicaUpdatesEnabled":
                    this.identicaUpdatesEnabled = this.prefs.getBoolPref("identicaUpdatesEnabled");
                    if (this.identicaUpdatesEnabled) {
                        firestatus.identicaClient.identicaUpdates();
                        this.identicaTimeoutId = window.setInterval(firestatus.identicaClient.identicaUpdates,
                                                                   this.identicaTimeout*60*1000);
                    } else
                        this.cancelUpdates("identica");
                    break;
                case "identicaUsername":
                    this.identicaUsername = this.prefs.getCharPref("identicaUsername");
                    break;
                case "identicaTimeout":
                    this.identicaTimeout = this.prefs.getIntPref("identicaTimeout");
                    if (this.identicaUpdatesEnabled) {
                        this.cancelUpdates("identica");
                        this.identicaTimeoutId = window.setInterval(firestatus.identicaClient.identicaUpdates,
                                                                   this.identicaTimeout*60*1000);
                    }
                    break;
            }
        },
    
        cancelUpdates: function(service) {
            switch(service) {
                case "twitter":
                    window.clearInterval(this.twitterTimeoutId);
                    break;
                case "friendfeed":
                    window.clearInterval(this.friendfeedTimeoutId);
                    break;
                case "facebook":
                    window.clearInterval(this.facebookTimeoutId);
                    break;
                case "delicious":
                    window.clearInterval(this.deliciousTimeoutId);
                    break;
                case "identica":
                    window.clearInterval(this.identicaTimeoutId);
                    break;
            }
        },
        
        loadFriendfeedCredentials: function() {
            firestatus.friendfeedUsername = "";
            firestatus.friendfeedRemoteKey = "";
            var passwordManager = Components.classes["@mozilla.org/login-manager;1"].  
                                getService(Components.interfaces.nsILoginManager);
            var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",  
                                    Components.interfaces.nsILoginInfo, "init");  
            var logins = passwordManager.findLogins({}, "http://friendfeed.com", null, "FriendFeed API");
            if (logins) {
                firestatus.friendfeedUsername = logins[0].username;
                firestatus.friendfeedRemoteKey = logins[0].password;
            }
        },

        friendfeedUpdates: function() {
            if (firestatus.queue.processingQueue) return;
            if (!firestatus.friendfeedUsername || !firestatus.friendfeedRemoteKey) {
                firestatus.loadFriendfeedCredentials();
            }
            var FRIENDS_URL = firestatus.FRIENDFEED_URL + '/api/feed/home';
            var req = new XMLHttpRequest();
            req.open('GET', FRIENDS_URL, true);
            req.onreadystatechange = function (aEvt) {
              if (req.readyState == 4) {
                    if(req.status == 200) {
                            var Ci = Components.interfaces;
                            var Cc = Components.classes;
                            var jsonString = req.responseText;
                            var statuses = JSON.parse(jsonString).entries;
                            // Sort the status updates, newest first.
                            statuses.sort(function(a, b) {
                                            return a.updated > b.updated? -1: a.updated < b.updated? 1: 0;
                                        });
                            for (var i = 0; i < statuses.length; i++) {
                                var status = statuses[i];
                                if (status.id == firestatus.queue.lastFriendfeedId) break;
                                if (status.hidden) break;
                                var t = status.updated; // TODO: parse the RFC 3339 string
                                var title = status.room? status.room.name: status.user.name;
                                var nickname = status.room? 'rooms/' + status.room.nickname: status.user.nickname;
                                firestatus.ffInitialQueue.push({
                                    id: status.id,
                                    timestamp: t,
                                    image: firestatus.FRIENDFEED_URL + '/' + nickname +
                                            '/picture?size=medium',
                                    title: title,
                                    text: status.title.length > 140 ? status.title.substring(0, 140) : status.title,
                                    link: status.link || firestatus.FRIENDFEED_URL
                                });
                            }
                            firestatus.queue.updateQueue = firestatus.queue.updateQueue.concat(
                                                    firestatus.ffInitialQueue.reverse());
                            firestatus.ffInitialQueue = [];
                            firestatus.queue.lastFriendfeedId = statuses[0].id;
                            firestatus.prefs.setCharPref("lastFriendfeedId", statuses[0].id);
                            if (!firestatus.queue.processingQueue) {
                                firestatus.queue.processingQueue = true;
                                firestatus.queue.displayNotification();
                            }
                    } else
                        firestatus.cons.logStringMessage("Error loading FF page. req.status=" + req.status);
              }
            };
            var auth = firestatus.friendfeedUsername + ":" + firestatus.friendfeedRemoteKey;
		    req.setRequestHeader("Authorization", "Basic " + btoa(auth));
            req.send(null);
        },
    
        facebookUpdates: function() {
            if (firestatus.queue.processingQueue) return;
            this.facebookClient.getNotifications();
        },
    
        deliciousUpdates: function() {
            if (firestatus.queue.processingQueue) return;
            var FEED_URL = 'http://feeds.delicious.com/v2/json/network/' + firestatus.deliciousUsername;
            var req = new XMLHttpRequest();
            req.open('GET', FEED_URL, true);
            req.onreadystatechange = function (aEvt) {
              if (req.readyState == 4) {
                     if(req.status == 200) {
                            var Ci = Components.interfaces;
                            var Cc = Components.classes;
                            var jsonString = req.responseText;
                            var statuses = JSON.parse(jsonString);
                            if (statuses.length == 0)
                                return;
                            statuses.reverse();
                            for (var i = 0; i < statuses.length; i++) {
                                var status = statuses[i];
                                var t = status.dt;
                                if (t <= firestatus.queue.lastDeliciousTimestamp)
                                    continue;
                                var text = "";
                                try {
                                  text = decodeURI(status.d);
                                } catch (error) {
                                  firestatus.cons.logStringMessage("Error decoding delicious update: " +
                                                   status.d);
                                  text = status.d;
                                }
                                firestatus.queue.updateQueue.push({
                                        image: "chrome://firestatus/skin/delicious.png",
                                        timestamp: t,
                                        text: status.d.length>140 ? status.d.substring(0, 140) : status.d,
                                        link: status.u
                                });
                            }
                            firestatus.queue.lastDeliciousTimestamp = t;
                            firestatus.prefs.setCharPref("lastDeliciousTimestamp", t);
                            if (!firestatus.queue.processingQueue) {
                                firestatus.queue.processingQueue = true;
                                firestatus.queue.displayNotification();
                            }
                     } else
                        firestatus.cons.logStringMessage("Error loading delicious feed. req.status=" + req.status);
              }
            };
            req.send(null);
        },
    
        identicaUpdates: function() {
            if (firestatus.queue.processingQueue) return;
            var milliseconds = new Number(firestatus.queue.lastIdenticaTimestamp);
            var FRIENDS_URL = firestatus.IDENTICA_URL + '/api/statuses/friends_timeline.json?since=' +
                            encodeURIComponent(new Date(milliseconds).toUTCString());
            var req = new XMLHttpRequest();
            req.open('GET', FRIENDS_URL, true);
            req.onreadystatechange = function (aEvt) {
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
                                if (status.id <= firestatus.queue.lastIdenticaId)
                                    continue;
                                var text = "";
                                try {
                                  text = decodeURI(status.text);
                                } catch (error) {
                                  firestatus.cons.logStringMessage("Error decoding Identi.ca update: " +
                                                   status.text);
                                  text = status.text;
                                }
                                firestatus.queue.updateQueue.push({id: status.id,
                                        timestamp: t,
                                        image: status.user.profile_image_url,
                                        title: status.user.name,
                                        text: status.text.length > 140 ? status.text.substring(0, 140) : status.text,
                                        link: firestatus.IDENTICA_URL + '/notice/' + status.id});
                            }
                            firestatus.queue.lastIdenticaId = status.id;
                            firestatus.queue.lastIdenticaTimestamp = t;
                            firestatus.prefs.setIntPref("lastIdenticaId", status.id);
                            firestatus.prefs.setCharPref("lastIdenticaTimestamp", t);
                            if (!firestatus.queue.processingQueue) {
                                firestatus.queue.processingQueue = true;
                                firestatus.queue.displayNotification();
                            }
                     } else if(req.status == 304)
                        return;
                     else
                        firestatus.cons.logStringMessage("Error loading Identi.ca page. " +
                                                         "req.status="+req.status);
              }
            };
            var identicaPassword = firestatus.loadPassword(firestatus.deliciousUsername, firestatus.IDENTICA_HOST, firestatus.IDENTICA_REALM);
            var auth = firestatus.identicaUsername + (identicaPassword ? (":" + identicaPassword) : "");
            req.setRequestHeader("Authorization", "Basic "+btoa(auth));
            req.send(null);
        },
    
        getGoogleShortUrl: function (url, callback) {
            var req = new XMLHttpRequest();
            req.open('POST','https://www.googleapis.com/urlshortener/v1/url');
            var params = '{"longUrl": "'+url+'"}';
            req.setRequestHeader("Content-type","application/json");
            req.setRequestHeader("Content-length", params.length);
            req.setRequestHeader("Connection", "close");
    
            req.onreadystatechange = function() {				
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        firestatus.shortUrl = JSON.parse(req.responseText).id;
                    } else {
                        firestatus.cons.logStringMessage("Goo.gl returned error message: " + req.status + " " + req.statusText);
                    };
                    callback();				
                };
            };
            req.send(params);		
        },
        
        getTinyShortUrl: function (url, callback) {
            var req = new XMLHttpRequest();
            req.open('GET', 'http://tinyurl.com/api-create.php?url='+encodeURIComponent(url));
            
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        firestatus.shortUrl = req.responseText;			    
                    } else {
                        firestatus.cons.logStringMessage("Tinyurl returned error message: " + req.status + " " + req.statusText);
                    };
                    callback();
                };
            };
            req.send(null);
        },
        
        getUrlBorgShortUrl: function (url, callback) {
            var req = new XMLHttpRequest();
            req.open('GET', 'http://urlborg.com/api/77577-9314/url/create_or_reuse.json/'+url);
            
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        firestatus.shortUrl = JSON.parse(req.responseText).s_url;
                    } else {
                        firestatus.cons.logStringMessage("Tinyurl returned error message: " + req.status + " " + req.statusText);
                    };
                    callback();
                };
            };
            req.send(null);
        },
        
        getBitlyShortUrl: function (url, callback) {
            var passwordManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
            var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",  
                                     Components.interfaces.nsILoginInfo, "init");  
            var logins = passwordManager.findLogins({}, "chrome://firestatus", null, "bitly_api");
            if (logins.length > 0) {
                var bitlyUsername = logins[0].username;
                var bitlyKey = logins[0].password;
            }
            else {
                bitlyUsername = prompt("Enter your bit.ly username (You will be asked only once)");
                bitlyKey = prompt("Enter your bit.ly API key (You will be asked only once)");
                var loginInfo = new nsLoginInfo("chrome://firestatus", null, "bitly_api", bitlyUsername, bitlyKey, 
                              "", "");
                passwordManager.addLogin(loginInfo);
            }

            var req = new XMLHttpRequest();
            req.open('GET', 'http://api.bitly.com/v3/shorten?login=' + bitlyUsername + '&apiKey=' + bitlyKey + '&longUrl=' + encodeURIComponent(url) + '&format=json');
            
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        var resp = JSON.parse(req.responseText);
                        if (resp.status_code == 500 && (resp.status_txt == 'INVALID_APIKEY' ||
                                                        resp.status_txt == 'INVALID_LOGIN')) {
                            for (var i=0; i<logins.length; i++)
                                passwordManager.removeLogin(logins[i]);
                            firestatus.getBitlyShortUrl(url, callback);
                            return;
                        }
                        else
                            firestatus.shortUrl = resp.data.url;
                    } else {
                        firestatus.cons.logStringMessage("Bit.ly returned error message: " + JSON.parse(req.responseText).status_txt);
                    };
                    callback();
                };
            };
            req.send(null);
        },
        
        getShortUrl: function (url, callback) {
            this.shortUrl = "";
            switch(this.shortURLService) {
                case "google":
                    this.getGoogleShortUrl(url, callback);
                    break;
                case "tinyUrl":
                    this.getTinyShortUrl(url, callback);
                    break;
                case "urlborg":
                    this.getUrlBorgShortUrl(url, callback);
                    break;
                case "bitly":
                    this.getBitlyShortUrl(url, callback);
                    break;
            }
        },
    
        actuallySendUpdate: function(statusText, deliciousTags, sendTwitter, sendFriendfeed, sendFacebook, sendDelicious, sendIdentica) {
            if (sendTwitter) {
                firestatus.twitterClient.sendStatusUpdateTwitter(statusText);
            }
            if (sendFriendfeed) {
                firestatus.sendStatusUpdateFriendfeed(statusText);
            }
            if (sendFacebook) {
                firestatus.sendStatusUpdateFacebook(statusText, document.getElementById("firestatus-sendUrl").checked ? firestatus.url : null);
            }
            if (sendDelicious) {
                var title = document.title;
                title = title.substr(0, title.lastIndexOf('-') - 1);
                firestatus.sendStatusUpdateDelicious(firestatus.statusInput.clearUrlFromStatus(statusText, document.getElementById("firestatus-shortenUrl").checked), deliciousTags, firestatus.url, title);
            }
            if (sendIdentica) {
                firestatus.identicaClient.sendStatusUpdateIdentica(statusText);
            }
        },
    
        sendStatusUpdateFacebook: function(statusText, url) {
            var title = document.title;
            title = title.substr(0, title.lastIndexOf('-')-1).trim();
            var st = firestatus.statusInput.clearUrlFromStatus(statusText, document.getElementById("firestatus-shortenUrl").checked);
            if ((title == st) && url)
                st = "";
            firestatus.facebookClient.sendStatus(st, url);
        },
    
    
        sendStatusUpdateFriendfeed: function(statusText) {
            var status = encodeURIComponent(statusText);
            var params = "title="+status;
            var req = new XMLHttpRequest();
            var POST_URL = firestatus.FRIENDFEED_URL + '/api/share';
            req.open("POST", POST_URL, true);
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status != 200)
                        alert("Failed to update friendfeed. Response was " + req.status + ": " + req.responseText);
                }
            };
            req.setRequestHeader("Content-length", params.length);
            req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
            req.send(params);
        },
    
        showTagsBox: function () {
            if (!document.getElementById("firestatus-selectedConsumerDelicious").disabled) {
                if (document.getElementById("firestatus-selectedConsumerDelicious").checked)
                    document.getElementById("firestatus-deliciousTags").hidden = true;
                else
                    document.getElementById("firestatus-deliciousTags").hidden = false;
            }
        },
    
        loadPassword: function (username, hostname, realm) {
            var passwordManager = Components.classes["@mozilla.org/login-manager;1"].
                                    getService(Components.interfaces.nsILoginManager);
    
            var logins = passwordManager.findLogins({}, hostname, '', realm);
            for (var i = 0; i < logins.length; i++) {
                if (logins[i].username == username) {
                    return logins[i].password;
                }
            }
        },
    
        sendStatusUpdateDelicious: function (statusText, deliciousTags, url, title) {
            var status = encodeURIComponent(statusText);
            deliciousTags = encodeURIComponent(deliciousTags);
            title = encodeURIComponent(title);
            var shared = firestatus.prefs.getBoolPref("deliciousShared");
            var req = new XMLHttpRequest ();
            var params = "url=" + url + "&description=" + title + "&extended=" + status + "&tags=" + deliciousTags + "&shared=" + (shared ? "yes" : "no");
            req.open("POST", firestatus.DELICIOUS_URL_S + "/v1/posts/add", true);
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status != 200)
                        alert("Failed to update del.icio.us. Response was " + req.status + ": " + req.responseText);
                }
            };
            var deliciousPassword = firestatus.loadPassword(firestatus.deliciousUsername, firestatus.DELICIOUS_HOST, firestatus.DELICIOUS_REALM);
            var auth = firestatus.deliciousUsername + (deliciousPassword ? (":" + deliciousPassword) : "");
            req.setRequestHeader("Authorization", "Basic " + btoa(auth));
            req.setRequestHeader("Content-length", params.length);
            req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
            req.send(params);
        },
        
        aboutInit: function() {
            setTimeout(function () {
                Components.utils.import("resource://gre/modules/AddonManager.jsm");
                AddonManager.getAddonByID("firestatus@astithas.com", function(addon) {
                    var version = document.getElementsByClassName("version")[0];
                    version.attributes["value"].nodeValue = addon.version;
                });
            }, 0);
            sizeToContent();
        },
        
        statusInput: {
            onLoad: function(event) {
                if (firestatus.prefs.prefHasUserValue("lastTwitterChecked")) {
                    document.getElementById("firestatus-selectedConsumerTwitter").checked = firestatus.prefs.getBoolPref("lastTwitterChecked");
                }
                else {
                    document.getElementById("firestatus-selectedConsumerTwitter").checked = true;
                    firestatus.prefs.setBoolPref("lastTwitterChecked", true);
                }
                if (firestatus.prefs.prefHasUserValue("lastFriendfeedChecked")) {
                    document.getElementById("firestatus-selectedConsumerFriendfeed").checked = firestatus.prefs.getBoolPref("lastFriendfeedChecked");
                }
                else {
                    document.getElementById("firestatus-selectedConsumerFriendfeed").checked = true;
                    firestatus.prefs.setBoolPref("lastFriendfeedChecked", true);
                }
                document.getElementById("firestatus-selectedConsumerFacebook").disabled = false;
                if (firestatus.prefs.prefHasUserValue("lastFacebookChecked")) {
                    document.getElementById("firestatus-selectedConsumerFacebook").checked = firestatus.prefs.getBoolPref("lastFacebookChecked");
                }
                else {
                    document.getElementById("firestatus-selectedConsumerFacebook").checked = true;
                    firestatus.prefs.setBoolPref("lastFacebookChecked", true);
                }
                if (firestatus.prefs.prefHasUserValue("lastDeliciousChecked")) {
                    document.getElementById("firestatus-selectedConsumerDelicious").checked = firestatus.prefs.getBoolPref("lastDeliciousChecked");
                }
                else {
                    document.getElementById("firestatus-selectedConsumerDelicious").checked = true;
                    firestatus.prefs.setBoolPref("lastDeliciousChecked", true);
                }
                if (document.getElementById("firestatus-selectedConsumerDelicious").checked)
                    document.getElementById("firestatus-deliciousTags").hidden = false;
                else
                    document.getElementById("firestatus-deliciousTags").hidden = true;
                if (firestatus.prefs.prefHasUserValue("lastIdenticaChecked")) {
                    document.getElementById("firestatus-selectedConsumerIdentica").checked = firestatus.prefs.getBoolPref("lastIdenticaChecked");
                }
                else {
                    document.getElementById("firestatus-selectedConsumerIdentica").checked = true;
                    firestatus.prefs.setBoolPref("lastIdenticaChecked", true);
                }
                document.getElementById("firestatus-statusText").focus();
            },
            
            onUnload: function() {
                firestatus.prefs.setBoolPref("lastTwitterChecked", document.getElementById("firestatus-selectedConsumerTwitter").checked);
                firestatus.prefs.setBoolPref("lastFriendfeedChecked", document.getElementById("firestatus-selectedConsumerFriendfeed").checked);
                firestatus.prefs.setBoolPref("lastFacebookChecked", document.getElementById("firestatus-selectedConsumerFacebook").checked);
                firestatus.prefs.setBoolPref("lastDeliciousChecked", document.getElementById("firestatus-selectedConsumerDelicious").checked);
                firestatus.prefs.setBoolPref("lastIdenticaChecked", document.getElementById("firestatus-selectedConsumerIdentica").checked);
            },
        
            sendStatusUpdate: function() {
                var statusText = document.getElementById('firestatus-statusText').value;
                var deliciousTags = document.getElementById('firestatus-deliciousTags').value;
                var sendTwitter = document.getElementById("firestatus-selectedConsumerTwitter").checked;
                var sendFriendfeed = document.getElementById("firestatus-selectedConsumerFriendfeed").checked;
                var sendFacebook = document.getElementById("firestatus-selectedConsumerFacebook").checked;
                var sendDelicious = document.getElementById("firestatus-selectedConsumerDelicious").checked;
                var sendIdentica = document.getElementById("firestatus-selectedConsumerIdentica").checked;
                firestatus.actuallySendUpdate(statusText, deliciousTags, sendTwitter, sendFriendfeed, sendFacebook, sendDelicious, sendIdentica);
                firestatus.hide();
            },
            
            updateCharCount: function(event) {
                var statusText = document.getElementById('firestatus-statusText').value;
                document.getElementById('firestatus-charcount').value = statusText.length;
                if (event)
                    switch (event.keyCode) {
                        case 27:
                            firestatus.hide();
                            break;
                        case 13:
                            firestatus.statusInput.sendStatusUpdate();
                            break;
                    }
            },
            
            clearUrlFromStatus: function (status, shorted) {
                if (shorted)
                    return status.replace(firestatus.shortUrl, "").trim();
                return status.replace(firestatus.url, "").trim();
            },
            
            toggleSendUrl: function() {
                document.getElementById("firestatus-shortenUrl").disabled = document.getElementById("firestatus-sendUrl").checked;
                var statusText = document.getElementById('firestatus-statusText').value;
                if (document.getElementById("firestatus-sendUrl").checked) {
                    document.getElementById('firestatus-statusText').value = firestatus.statusInput.clearUrlFromStatus(statusText, document.getElementById("firestatus-shortenUrl").checked);
                    firestatus.statusInput.updateCharCount();
                }
                else {		
                    var mustShortenUrl = document.getElementById("firestatus-shortenUrl").checked;
                    if (!mustShortenUrl) {
                        document.getElementById('firestatus-statusText').value = statusText.trim() + " " + firestatus.url;
                        firestatus.statusInput.updateCharCount();
                    }
                    else {
                        var doAfterShort = function () {
                            document.getElementById('firestatus-statusText').value = statusText.trim() + " " + firestatus.shortUrl;
                            firestatus.statusInput.updateCharCount();
                        }
                        if (firestatus.shortUrl) {
                            doAfterShort();
                        }
                        else
                            firestatus.getShortUrl(firestatus.url, doAfterShort);
                    }
                }
            },
            
            toggleShortenUrl: function () {
                var mustShortenUrl = !document.getElementById("firestatus-shortenUrl").checked;
                var statusText = document.getElementById('firestatus-statusText').value;
                var temp = firestatus.statusInput.clearUrlFromStatus(statusText, !mustShortenUrl);
                if (!mustShortenUrl) {
                    document.getElementById('firestatus-statusText').value = temp + " " + firestatus.url;
                    firestatus.statusInput.updateCharCount();
                }
                else {
                    var doAfterShort = function () {
                        document.getElementById('firestatus-statusText').value = temp + " " + firestatus.shortUrl;
                        firestatus.statusInput.updateCharCount();
                    }
                    if (firestatus.shortUrl) {
                        doAfterShort();
                    }
                    else
                        firestatus.getShortUrl(firestatus.url, doAfterShort);
                }
            }
        }
    };

    Components.utils.import("resource://firestatus/queue.js", firestatus);
    
    window.addEventListener("load", function(e) { firestatus.onLoad(e); }, false);
    window.addEventListener("unload", function(e) { firestatus.onUnload(e); }, false);
}
