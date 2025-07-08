# Return YouTube Trending
- Replace Shorts tab with Trending.
- Enable Premium logo.
- Disables doodles.

![0001](https://github.com/user-attachments/assets/9502d734-2a7c-45f4-a218-66fbfaf6fd02)


# Install
|  |    App | Website |
|---|---|---|
| **PC** | - | **Chrome:** [Chrome Web Store](https://chromewebstore.google.com/detail/return-youtube-trending/apcbkpnopnnjaegbhnmcimmnlmmbolai)<br>**Firefox:** [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/return-youtube-trending/) |
| **iOS** | Install [uYouPlus](https://github.com/qnblackcat/uYouPlus) with [AltStore](https://altstore.io/).<br>(Or [YTReExplore](https://www.ios-repo-updates.com/repository/poomsmart/package/com.ps.ytreexplore/) from Sileo) | **Safari:** Install [Return YouTube Trending.js](https://raw.githubusercontent.com/Dr-Sauce/ReturnYouTubeTrending/refs/heads/main/Return%20YouTube%20Trending.js), [YouTube Premium.js](https://raw.githubusercontent.com/Dr-Sauce/ReturnYouTubeTrending/refs/heads/main/YouTube%20Premium.js) via [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)<br>**Orion Browser:** Unsupported |
| **Android** | Unsupported (YouTube ReVanced doesn't support changing Shorts with Trending tab) | **Quetta:** [Chrome Web Store](https://chromewebstore.google.com/detail/return-youtube-trending/apcbkpnopnnjaegbhnmcimmnlmmbolai)<br>**Firefox:** [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/return-youtube-trending/) |

# Logic
|  | `Return YouTube Trending.js` | `YouTube Premium.js` |
|---|---|---|
| **Description** | Replaces Shorts elements with Trending. | Replace YouTube logo with Premium. Unlike other scripts/extensions it replaces each YouTube SVG with Premium SVGs. |
| **Language** | All languages (The extension itself only supports English and Korean) |
| **Logic** | <details><summary>PC</summary>- **(If) Mini menu is shown:** <br>1. Wait for menu button to appear. (Identifys using ID)<br>2. Prevent main menu taking up space.<br>3. Disable animation.<br>4. Hide main menu, scrim.<br>5. Open menu.<br>6. Wait for Trending SVG. (Uses Href to identify element)<br>7. Replace Shorts ↔ Trending buttons in main menu.<br>8. Fetch Trending SVG, text, tooltip, URL.<br>9. Close menu.<br>10. Restore menu changes.<br>11. Replace Shorts(SVG, text, tooltip, URL) with Trending in mini menu. (Overwrites polymer with URL redirection, which makes the whole page reload) (Uses SVG to identify)<br><br>- **(If) Main menu is shown:** <br>1. Replace Shorts ↔ Trending in main guide<br>2. Fetch Trending SVG, text, tooltip, url (Uses Href to identify element)<br>3. Wait for user to close menu.<br>4. Replace Shorts(SVG, text, tooltip, URL) with Trending in mini menu. (Overwrites polymer with URL redirection, which makes the whole page reload) (Uses SVG to identify)</details><details><summary>Mobile</summary>- **(If) Menu exists:** <br>1. Hide menu, scrim.<br>2. Open menu.<br>3. Wait for Trending SVG. (Uses Href to identify element)<br>4. Fetch Trending SVG, text, URL.<br>5. Close menu.<br>6. Restore menu changes.<br>7. Cache Trending button data locally.<br>8. Replace Shorts tab with Trending. (Uses div to identify)<br><br>- **(If) Menu doesn't exist:** <br>1. Replace Shorts tab with Trending using cache data. (Uses div to identify)</details> | <details><summary>PC</summary>1. Hide doodle if valid (and enable YouTube logo, country code and update tooltip).<br>2. Replace each YouTube SVG with Premium SVG. (Also in menu)<br>3. Update tooltip. (YouTube Home → YouTube Premium Home) (Also in menu)</details><details><summary>Mobile</summary>0. (Doodle not tested on mobile)<br>1. Replace each YouTube SVG with Premium SVG. (Also in menu)</details> |





# Credits
**ChatGPT -** Developer, Icon designer

**Perplexity -** Developer, UI designer
