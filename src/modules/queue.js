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
    lastFacebookTimestamp: "0",
    processingQueue: false,
    paused: false,

    displayNotification: function() {
        if (queue.paused) return;
        var update = queue.updateQueue.shift();
        var cons = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
        if (update)
            try {
                if ("@mozilla.org/alerts-service;1" in Components.classes) {
                    var alertService = Components.classes["@mozilla.org/alerts-service;1"]
                        .getService(Components.interfaces.nsIAlertsService);
                    if (alertService) {
                        alertService.showAlertNotification(update.image, update.title, update.text,
                                                           true, update.link, queue.notificationHandler);
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

    notificationHandler: {
        observe: function(subject, topic, data) {
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                               .getService(Components.interfaces.nsIWindowMediator);
            var browser = wm.getMostRecentWindow("navigator:browser").getBrowser();

            if (topic == 'alertclickcallback' && data != null)
                browser.selectedTab = browser.addTab(data);
            else if (topic == 'alertfinished')
                queue.displayNotification();
        }
    }

};

