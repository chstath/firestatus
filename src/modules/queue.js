/* -*- mode: JavaScript; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*- */
/* ex: set tabstop=4 expandtab: */
/*
 * Copyright (c) 2009 Panagiotis Astithas
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

var EXPORTED_SYMBOLS = ["queue"]

var queue = {
    // A FIFO queue that contains pending notifications.
    updateQueue: [],
    lastTwitterId: 0,
    lastTwitterTimestamp: "0",
    lastFriendfeedId: 0,
    lastDeliciousTimestamp: "0",
    lastIdenticaId: 0,
    lastIdenticaTimestamp: "0",
    processingQueue: false,
    paused: false,
	formatted: false,

    displayNotification: function() {
        if (queue.paused) return;
		if (!queue.formatted) return;
        var update = queue.updateQueue.shift();
        var cons = Components.classes["@mozilla.org/consoleservice;1"]
			.getService(Components.interfaces.nsIConsoleService);
        if (update)
            try {
                if ("@mozilla.org/alerts-service;1" in Components.classes) {
                    var alertService = Components.classes["@mozilla.org/alerts-service;1"]
                        .getService(Components.interfaces.nsIAlertsService);
                    if (alertService) {
                        alertService.showAlertNotification(update.image, update.title, update.text,
                                                           true, update.link, queue.notificationHandler);
						//var win = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                        //       .getService(Components.interfaces.nsIWindowMediator)
						//	   .getMostRecentWindow("navigator:browser");
						// Properly format the notification.
						queue.window.setTimeout(queue.formatNotification, 0);
						//cons.logStringMessage("formatNotification, 0 on window:"+win.document.title+", parent:"+win.parent.document.title);
                    }
                    else {
                        cons.logStringMessage("alertsService failure: " +
                                                "could not getService nsIAlertsService");
                    }
                }
            } catch(e) {
                cons.logStringMessage("alertsService failure: " + e);
	        }
        else
            queue.processingQueue = false;
    },

	formatNotification: function() {
		// Search for the alert window.
		//var formatted = false;
		var winEnum = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator).getXULWindowEnumerator(null);
		var win = null;
		while (winEnum.hasMoreElements())
			try {
				win = winEnum.getNext()
					.QueryInterface(Components.interfaces.nsIXULWindow).docShell
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIDOMWindow);
				if (win.location == 'chrome://global/content/alerts/alert.xul') {
					var orgLabel = win.document.getElementById('alertTextLabel');
					// Insert newlines every 40 characters.
					var multiline = queue.splitLine(orgLabel.value, 40);
					// Split the text with newlines into separate strings.
					var txt = multiline.split("\n");
					// Set the original label to the first line.
					orgLabel.value = txt[0];
					// Add subsequent lines.
					for (var i = 1 ; i < txt.length ; i++) {
						var label = orgLabel.cloneNode(true);
						label.value = txt[i];
						orgLabel.parentNode.appendChild(label);
					}
					// Update alert size and position.
					win.onAlertLoad();
					queue.formatted = true;
					break;
				}
			} catch(e) {} //important: hide exceptions

		//var w = Components.classes["@mozilla.org/appshell/window-mediator;1"]
		//	.getService(Components.interfaces.nsIWindowMediator)
		//	.getMostRecentWindow("navigator:browser");

		if (!queue.formatted) {
			var cons = Components.classes["@mozilla.org/consoleservice;1"]
				.getService(Components.interfaces.nsIConsoleService);
			cons.logStringMessage("Formatting failed!");
			queue.window.setTimeout(queue.formatNotification, 100);
			//cons.logStringMessage("formatNotification, 100 on window:"+w.document.title+", parent:"+w.parent.document.title);
		}
	},

    notificationHandler: {
        observe: function(subject, topic, data) {
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                               .getService(Components.interfaces.nsIWindowMediator);
            var browser = wm.getMostRecentWindow("navigator:browser").getBrowser();

            if (topic == 'alertclickcallback' && data != null)
                browser.selectedTab = browser.addTab(data);
            else if (topic == 'alertfinished') {
				//var win = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                //   .getService(Components.interfaces.nsIWindowMediator)
				//	.getMostRecentWindow("navigator:browser");
				queue.window.setTimeout(queue.displayNotification, 500);
				//cons.logStringMessage("displayNotification, 500 on window:"+win.document.title+", parent:"+win.parent.document.title);
            }
        }
    },
	
	// Line Splitter Function
	// copyright Stephen Chapman, 19th April 2006
	// you may copy this code but please keep the copyright notice as well
	// Taken from: http://javascript.about.com/library/blspline.htm
	splitLine: function(st, n) {
		var b = '';
		var s = st;
		while (s.length > n) {
			var c = s.substring(0, n);
			var d = c.lastIndexOf(' ');
			var e = c.lastIndexOf('\n');
			if (e != -1) d = e;
			if (d == -1) d = n;
			b += c.substring(0, d) + '\n';
			s = s.substring(d+1);
		}
		return b+s;
	}

};

