// ==UserScript==
// @name Ye Olde Megajump (Auto-updating)
// @namespace https://github.com/YeOldeWH/MonsterMinigameWormholeWarp
// @description A script that runs the Steam Monster Minigame for you.  Now with megajump.  Brought to you by the Ye Olde Wormhole Schemers and DannyDaemonic
// @version 5.0.1.13
// @match *://steamcommunity.com/minigame/towerattack*
// @match *://steamcommunity.com//minigame/towerattack*
// @grant       GM_xmlhttpRequest
// @updateURL https://raw.githubusercontent.com/YeOldeWH/MonsterMinigameWormholeWarp/master/autoPlay.user.js
// @downloadURL https://raw.githubusercontent.com/YeOldeWH/MonsterMinigameWormholeWarp/master/autoPlay.user.js
// ==/UserScript==

(function(x) {

// Options
var old_version = false;
var update_json_url = 'https://raw.githubusercontent.com/YeOldeWH/MonsterMinigameWormholeWarp/master/version.json';
var script_url = 'https://raw.githubusercontent.com/YeOldeWH/MonsterMinigameWormholeWarp/master/autoplay.noUpdate.user.js';
var loader_version = '5.0.1.13';

// Load the actual script
GM_xmlhttpRequest ({
    method: "GET",
    url: script_url + "?" + new Date().getTime(),
    onload: function(response) {
        var scriptElement = document.createElement( "script" );
        scriptElement.type = "text/javascript";
        scriptElement.innerHTML = response.responseText;
        document.body.appendChild (scriptElement);
    }
});        

function do_check () {
    GM_xmlhttpRequest ({
        method: "GET",
        url: update_json_url + "?" + new Date().getTime(),
        onload: function(response) {
            var version_data = JSON.parse(response.responseText);
            
            if (version_data.Version != old_version) {
                if (old_version === false) {
                    // First time reading the JSON
                    old_version = version_data.Version;

                    // Display the version
                    var versionDiv = document.createElement ("div");
                    versionDiv.innerHTML = '<div style="' +
                      'color: white; position: fixed; right: 1em; ' +
                      'border: 1px solid white; padding: 2px; background: black;' + 
                      'bottom: 1em; z-index: 9999;">Loader: ' + loader_version + ' Script: ' + old_version + '</div>';
                    document.body.appendChild (versionDiv);

                    // Check again in 15 minutes
                    x.setTimeout (do_check, 15 * 60 * 1000);
                } else {
                    x.location.reload(true);
                }
            } else {
                // Check again in 5 minutes
                x.setTimeout (do_check, 5 * 60 * 1000);
            }
        }
    });
        
}

do_check ();
}(window));
