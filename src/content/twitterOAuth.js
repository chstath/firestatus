if (typeof oAuthTwitterListener == "undefined") {
    var oAuthTwitterListener = {
        QueryInterface: function(aIID) {
            if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
               aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
               aIID.equals(Components.interfaces.nsISupports))
             return this;
            throw Components.results.NS_NOINTERFACE;
        },
    
        onLocationChange: function(aProgress, aRequest, aURI) {
            dump("url=" + aURI.spec + '\n');
            var patt=/http:\/\/localhost\/sign-in-with-twitter\/\?oauth_token=(.*)&oauth_verifier=(.*)/;
            var grupo = patt.exec(aURI.spec);
                dump("grupo=" +  grupo + "\n");
            if (grupo != null) {
                window.arguments[0].retVal = grupo[2];
                aProgress.removeProgressListener(this);
                aProgress.DOMWindow.close();
            }
        },

        oAuthProcess: function() {
            const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
            var browser = document.createElementNS(XUL_NS, "browser");
            browser.setAttribute("src", window.arguments[0].url +"?oauth_token=" + window.arguments[0].oauth_token);
            browser.setAttribute("type", "content-primary");
            browser.setAttribute("flex", "1");        
            browser.setAttribute("disablehistory", "true");                        
            document.getElementsByTagName("window")[0].appendChild(browser);
            browser.addProgressListener(oAuthTwitterListener, Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);
        },        
        
        onStateChange: function(a, b, c, d) {},
        onProgressChange: function(a, b, c, d, e, f) {},
        onStatusChange: function(a, b, c, d) {},
        onSecurityChange: function(a, b, c) {}    
    };
}
