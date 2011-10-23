if (typeof oAuthFBListener == "undefined") {
    var oAuthFBListener = {
        QueryInterface: function(aIID) {
            if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
               aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
               aIID.equals(Components.interfaces.nsISupports))
             return this;
            throw Components.results.NS_NOINTERFACE;
        },
    
        onLocationChange: function(aProgress, aRequest, aURI) {
            var patt=/https:\/\/www.facebook.com\/connect\/login_success.html#access_token=([\d\w\|-]+)&expires_in=0/;
            var grupo = patt.exec(decodeURIComponent(aURI.spec));
            if (grupo != null) {
                var passwordManager = Components.classes["@mozilla.org/login-manager;1"].  
                    getService(Components.interfaces.nsILoginManager);
                var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",  
                                         Components.interfaces.nsILoginInfo, "init");  
                var logins = passwordManager.findLogins({}, "chrome://firestatus", null, "facebook_oauth_token");
                for (var i = 0; i < logins.length; i++) {  
                    if (logins[i].username == "firestatus") {
                        passwordManager.removeLogin(logins[i]);
                    }
                }
                var logins = passwordManager.findLogins({}, "chrome://firestatus", null, "facebook_uid");
                for (var i = 0; i < logins.length; i++) {  
                    if (logins[i].username == "firestatus") {  
                        passwordManager.removeLogin(logins[i]);
                    }  
                } 
                var loginInfo = new nsLoginInfo("chrome://firestatus", null, "facebook_oauth_token", "firestatus", grupo[1],  
                            "", "");
                passwordManager.addLogin(loginInfo);
                aProgress.removeProgressListener(this);
                aProgress.DOMWindow.close();
            }
        },

        oAuthProcess: function() {
            const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
            var browser = document.createElementNS(XUL_NS, "browser");
            browser.setAttribute("src", "https://www.facebook.com/dialog/oauth?client_id=11871218332&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=read_stream,publish_stream,offline_access&response_type=token");
            browser.setAttribute("type", "content");
            browser.setAttribute("flex", "1");        
            browser.setAttribute("disablehistory", "true");                        
            document.getElementsByTagName("window")[0].appendChild(browser);
            browser.addProgressListener(oAuthFBListener, Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);
        },        
        
        onStateChange: function(a, b, c, d) {},
        onProgressChange: function(a, b, c, d, e, f) {},
        onStatusChange: function(a, b, c, d) {},
        onSecurityChange: function(a, b, c) {}    
    };
}
