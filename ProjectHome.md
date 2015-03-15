![http://lh3.ggpht.com/_q3QgEWaLY0Q/SS8aSvJFA9I/AAAAAAAAAmY/X8Argbu6nBg/s800/firestatus.png](http://lh3.ggpht.com/_q3QgEWaLY0Q/SS8aSvJFA9I/AAAAAAAAAmY/X8Argbu6nBg/s800/firestatus.png)
<a href='http://www.makeuseof.com/pages/best-firefox-addons' title='Best Firefox Addons'><img src='http://makeuseof.com/images/logo/reviewed.png' alt='Best Firefox Addons'>

<h1>What is FireStatus?</h1>
FireStatus is a Firefox extension that aims to be a swiss army knife for dealing with various social networks, right from your browser, without visiting any particular website. Facebook, Twitter, FriendFeed, Delicious and Identi.ca are currently supported, but more are in the pipeline. For starters, it allows you to simultaneously update your status to all or some of these services, so that all your friends see it, no matter what they are using. The notion of a status that is occasionally updated is familiar to Twitter, Identi.ca and Facebook users, since the text field that asks 'What are you doing?' is prominent in their user pages. FriendFeed does not have the notion of a status, but its users can post short (or long) messages, just like Twitter's. FriendFeed also allows posting links to web pages, accompanied with a short description, something that many Twitter and Facebook users have been doing by constructing status updates that start with the description text and are followed by an appended link, usually shortened. Delicious does not have a status but you can use FireStatus to quickly save a bookmark for the page you are currently viewing along with some tags and a short description.<br>
<br>
FireStatus can ease the task of posting these messages or status updates, by being always available, instead of needing to have the service pages open and without a large memory footprint, like other similar applications, since it takes advantage of the fact that most people nowadays always have one browser open.<br>
<br>
<h1>Usage</h1>

<img src='http://lh6.ggpht.com/_zFF22LLF49M/Sf9W7zDn-fI/AAAAAAAAAWU/otizW4B1GQY/s800/post.png' />

Clicking on the FireStatus icon, pops up a small toolbar window just above the status bar and below the window document. It is similar to the Firefox findbar that pops up when one searches for text in a page, albeit slightly larger. That was a deliberate design decision that aimed to imitate the success in the usability of the findbar. Lots of little details like this one have been carefully thought out and occasionally debated at length among the team and our beta testers:<br>
<br>
<ul><li>Enabling the spell checker in the status message field, for catching those typos when hastily typing a message.<br>
</li><li>Having the URL inclusion unchecked by default, while the shortening checked, since most posts do not include URLs (and it might be embarrassing if done inadvertently), but those that do usually want them short.<br>
</li><li>Adding a character counter to help guard against the maximum message length imposed by some services (e.g. Twitter).<br>
</li><li>Tightly placing the available services in a way that allows for an unambiguous selection.<br>
</li><li>Using the Escape and Enter keys as shortcuts for canceling and sending the update respectively.<br>
</li><li>Showing the second text line for entering tags only when the delicious checkbox is selected.</li></ul>

As one reviewer in addons.mozilla.org so eloquently put it, "the simplicity & minimal design are the key components here".<br>
<br>
Posting is not the whole story, though. These services provide continuous streams of updates from friends that we need to monitor. Sifting through the updates in every service, while very useful, becomes tedious after a while. It is like making a mental note to check your e-mail every once in a while for new messages. It's one way to do it for sure, but mail notifiers have been around for ages and provide more of a "live" experience.<br>
<br>
<img src='http://lh3.ggpht.com/_zFF22LLF49M/SP-j8XiKFVI/AAAAAAAAARM/eySMRGw4TWo/s800/twitter-screenshot.png' />

FireStatus imitates their success in making e-mail conversations "alive", for conversations in the social network space. Every time a new incoming update is received, a notification popup appears, so you can continue using whatever application you were using, but being instantly aware of the news. Twitter notifications contain the name and the picture of the message author as well as the message sent. Low-priority or uninteresting messages can be just glanced at and then automatically dismissed, while important ones can be clicked on, so that the message can be viewed in the browser. FriendFeed notifications can be of various flavors, since FriendFeed aggregates updates from a large variety of online services.<br>
<br>
<img src='http://lh6.ggpht.com/pastith/SP-kAhegr1I/AAAAAAAAARU/JFWSK4bvRTI/s800/ff-screenshot.png' />

Therefore FriendFeed updates display the service icon along with the author's name for quick identification of the type of update. Clicking on an interesting update opens a browser window to the link contained in the message. Facebook notifications currently contain new message counts, pokes and shares, but work for getting more data is underway.<br>
<br>
Although the notifications appear instantaneous, as with e-mail notifications there is a polling process involved underneath. The polling frequency for each service can be separately tuned in the preferences window. The preference window can be opened by right-clicking on the FireStatus icon and selecting the appropriate option in the popup menu. Along with the time intervals between polling for updates, one can enable posting and/or receiving updates for the various services, as well as the authentication credentials where appropriate. For Facebook the user logs in in a Facebook-supplied browser window that pops up, similar to regular Facebook use. No credentials need to be stored separately by FireStatus. For FriendFeed the username and remote key have to be stored locally in the extension preferences. The remote key is not the same as the user password, but is provided by FriendFeed specifically for use by third-party applications, like this one. It can be found by clicking on the link displayed in the explanatory note. Twitter and Identi.ca can work either way. If a username and password are entered in the preference window, they will be stored locally in the extension preferences and used for subsequent authentication. If, on the other hand, the fields are blank, FireStatus will consult the browser's Password Manager for any stored Twitter credentials. This will probably cause the master password dialog to pop up once, but the credentials will remain stored only in the Password Manager. For delicious there is one more checkbox named "Shared bookmarks" and if checked then the bookmark saved will be public meaning that it will be publicly visible on del.icio.us and on your friendfeed stream if you have added del.icio.us to your friendfeed.<br>
<br>
<img src='http://lh6.ggpht.com/_zFF22LLF49M/Sf9W8ET-W_I/AAAAAAAAAWc/VoGTaxr-oO4/s800/prefs.png' />

<wiki:gadget url="http://www.ohloh.net/p/19456/widgets/project_basic_stats.xml" height="220" border="1"/>