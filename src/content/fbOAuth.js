function oAuthProcess() {
    const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var browser = document.createElementNS(XUL_NS, "browser");
    browser.setAttribute("src", "https://www.facebook.com/dialog/oauth?client_id=11871218332&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=read_stream,publish_stream,offline_access&response_type=token");
    browser.setAttribute("type", "content");
    browser.setAttribute("flex", "1");        
    browser.setAttribute("disablehistory", "true");                        
    document.getElementsByTagName("window")[0].appendChild(browser);
    browser.addProgressListener(oAuthFBListener, Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);
};        

var oAuthFBListener = {
    QueryInterface: function(aIID) {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
           aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
           aIID.equals(Components.interfaces.nsISupports))
         return this;
        throw Components.results.NS_NOINTERFACE;
    },

    onLocationChange: function(aProgress, aRequest, aURI) {
        var patt=/https:\/\/www.facebook.com\/connect\/login_success.html#access_token=11871218332\|([\d\w\|-]+)&expires_in=0/;
        var grupo = patt.exec(decodeURIComponent(aURI.spec));
        if (grupo != null) { 
            var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService)
                .getBranch("extensions.firestatus.");
            prefs.setCharPref("facebook_oauth_token", grupo[1]);
            aProgress.removeProgressListener(this);
            aProgress.DOMWindow.close();
        }
    },
    
    onStateChange: function(a, b, c, d) {},
    onProgressChange: function(a, b, c, d, e, f) {},
    onStatusChange: function(a, b, c, d) {},
    onSecurityChange: function(a, b, c) {}    
};
