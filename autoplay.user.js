// ==UserScript==
// @name Ye Olde Megajump
// @namespace https://github.com/YeOldeWH/MonsterMinigameWormholeWarp
// @description A script that runs the Steam Monster Minigame for you.  Now with megajump.  Brought to you by the Ye Olde Wormhole Schemers and DannyDaemonic
// @version 5.0.1.3
// @match *://steamcommunity.com/minigame/towerattack*
// @match *://steamcommunity.com//minigame/towerattack*
// @grant       GM_xmlhttpRequest
// @updateURL https://raw.githubusercontent.com/KateGray/MonsterMinigameWormholeWarp/master/autoPlay.user.js
// @downloadURL https://raw.githubusercontent.com/KateGray/MonsterMinigameWormholeWarp/master/autoPlay.user.js
// ==/UserScript==

(function(x) {

// Options
var bitch_version = false;
var update_json_url = 'https://raw.githubusercontent.com/KateGray/MonsterMinigameWormholeWarp/master/version.json';
var script_url = 'https://raw.githubusercontent.com/KateGray/MonsterMinigameWormholeWarp/master/autoPlay.noUpdate.user.js';

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
            if (version_data.Version != bitch_version) {
                if (bitch_version === false) {
                    // First time reading the JSON
                    bitch_version = version_data.Version;
                    
                    // Check again in 5 minutes
                    x.setTimeout (do_check, 5 * 60 * 1000);
                } else {
                    x.location.reload(true);
                }
            } else {
                // Check again in 3 minutes
                x.setTimeout (do_check, 3 * 60 * 1000);
            }
        }
    });
        
}

do_check ();
}(window));
