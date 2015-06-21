// ==UserScript==
// @name Ye Olde Megajump
// @namespace https://github.com/YeOldeWH/MonsterMinigameWormholeWarp
// @description A script that runs the Steam Monster Minigame for you.  Now with megajump.  Brought to you by the Ye Olde Wormhole Schemers and DannyDaemonic
// @version 7.0.1
// @match *://steamcommunity.com/minigame/towerattack*
// @match *://steamcommunity.com//minigame/towerattack*
// @grant none
// @updateURL https://raw.githubusercontent.com/YeOldeWH/MonsterMinigameWormholeWarp/master/autoplay.noUpdate.user.js
// @downloadURL https://raw.githubusercontent.com/YeOldeWH/MonsterMinigameWormholeWarp/master/autoplay.noUpdate.user.js
// ==/UserScript==

// IMPORTANT: Update the @version property above to a higher number such as 1.1 and 1.2 when you update the script! Otherwise, Tamper / Greasemonkey users will not update automatically.

(function(window) {
	"use strict";

// OPTIONS
var clickRate = 20;
var logLevel = 1; // 5 is the most verbose, 0 disables all log

var wormholeOn100 = 1;
var clicksOnBossLevel = 0;
var upgThreshold = 100;
var minAbilityUsePercent = 0.3;

var enableAutoClicker = true;

var enableAutoUpgradeHP = true;
var enableAutoUpgradeClick = true;
var enableAutoUpgradeDPS = false;
var enableAutoUpgradeElemental = true;
var enableAutoPurchase = true;
var enableAutoBadgePurchase = true;

var removeInterface = getPreferenceBoolean("removeInterface", true); // get rid of a bunch of pointless DOM
var removeParticles = getPreferenceBoolean("removeParticles", true);
var removeFlinching = getPreferenceBoolean("removeFlinching", true);
var removeCritText = getPreferenceBoolean("removeCritText", false);
var removeAllText = getPreferenceBoolean("removeAllText", false);
var enableFingering = getPreferenceBoolean("enableFingering", true);
var disableRenderer = getPreferenceBoolean("disableRenderer", true);
var enableTrollTrack = getPreferenceBoolean("enableTrollTrack", false);
var enableElementLock = getPreferenceBoolean("enableElementLock", true);
var enableAutoRefresh = getPreferenceBoolean("enableAutoRefresh", typeof GM_info !== "undefined");
var enableChen = getPreferenceBoolean("enableChen", false);

var autoRefreshMinutes = 15; // Lowering to 15 minutes
var autoRefreshMinutesRandomDelay = 5; // Lowering to 5 minutes
var autoRefreshSecondsCheckLoadedDelay = 30;

var predictTicks = 0;
var predictJumps = 0;
var predictLastWormholesUpdate = 0;

// Auto refresh handler delay
var autoRefreshDuringBossDelayTotal = 0; // Total delay already passed
var autoRefreshDuringBossDelay = 60000; // Delay during the boss (ms)
var autoRefreshDuringBossDelayStep = 2500; // Delay 'step' (until we try again)

// DO NOT MODIFY
var isPastFirstRun = false;
var isAlreadyRunning = false;
var refreshTimer = null;
var currentClickRate = enableAutoClicker ? clickRate : 0;
var lastLevel = 0;
var lastLevelTimeTaken = [{
							level: 0,
							levelsGained: 0,
							timeStarted: 0,
							timeTakenInSeconds: 0
						 }];
var approxYOWHClients = 0;
var skipsLastJump = 0;
var updateSkips = false;

var trt_oldCrit = function() {};
var trt_oldPush = function() {};
var trt_oldRender = function() {};
var ELEMENTS = {
	LockedElement: -1
};

var UPGRADES = {
	LIGHT_ARMOR: 0,
	AUTO_FIRE_CANNON: 1,
	ARMOR_PIERCING_ROUND: 2,
	DAMAGE_TO_FIRE_MONSTERS: 3,
	DAMAGE_TO_WATER_MONSTERS: 4,
	DAMAGE_TO_AIR_MONSTERS: 5,
	DAMAGE_TO_EARTH_MONSTERS: 6,
	LUCKY_SHOT: 7,
	HEAVY_ARMOR: 8,
	ADVANCED_TARGETING: 9,
	EXPLOSIVE_ROUNDS: 10,
	MEDICS: 11,
	MORALE_BOOSTER: 12,
	GOOD_LUCK_CHARMS: 13,
	METAL_DETECTOR: 14,
	DECREASE_COOLDOWNS: 15,
	TACTICAL_NUKE: 16,
	CLUSTER_BOMB: 17,
	NAPALM: 18,
	BOSS_LOOT: 19,
	ENERGY_SHIELDS: 20,
	FARMING_EQUIPMENT: 21,
	RAILGUN: 22,
	PERSONAL_TRAINING: 23,
	AFK_EQUIPMENT: 24,
	NEW_MOUSE_BUTTON: 25,
	CYBERNETIC_ENHANCEMENTS: 26,
	LEVEL_1_SENTRY_GUN: 27,
	TITANIUM_MOUSE_BUTTON: 28
};

var ABILITIES = {
	FIRE_WEAPON: 1,
	CHANGE_LANE: 2,
	RESPAWN: 3,
	CHANGE_TARGET: 4,
	MORALE_BOOSTER: 5,
	GOOD_LUCK_CHARMS: 6,
	MEDICS: 7,
	METAL_DETECTOR: 8,
	DECREASE_COOLDOWNS: 9,
	TACTICAL_NUKE: 10,
	CLUSTER_BOMB: 11,
	NAPALM: 12,
	RESURRECTION: 13,
	CRIPPLE_SPAWNER: 14,
	CRIPPLE_MONSTER: 15,
	MAX_ELEMENTAL_DAMAGE: 16,
	RAINING_GOLD: 17,
	CRIT: 18,
	PUMPED_UP: 19,
	THROW_MONEY_AT_SCREEN: 20,
	GOD_MODE: 21,
	TREASURE: 22,
	STEAL_HEALTH: 23,
	REFLECT_DAMAGE: 24,
	FEELING_LUCKY: 25,
	WORMHOLE: 26,
	LIKE_NEW: 27
};

var ENEMY_TYPE = {
	SPAWNER: 0,
	CREEP: 1,
	BOSS: 2,
	MINIBOSS: 3,
	TREASURE: 4
};

var BOSS_DISABLED_ABILITIES = [
	ABILITIES.MORALE_BOOSTER,
	ABILITIES.GOOD_LUCK_CHARMS,
	ABILITIES.TACTICAL_NUKE,
	ABILITIES.CLUSTER_BOMB,
	ABILITIES.NAPALM,
	ABILITIES.CRIT,
	ABILITIES.CRIPPLE_SPAWNER,
	ABILITIES.CRIPPLE_MONSTER,
	ABILITIES.MAX_ELEMENTAL_DAMAGE,
	ABILITIES.REFLECT_DAMAGE,
	ABILITIES.STEAL_HEALTH,
	ABILITIES.THROW_MONEY_AT_SCREEN
];

var CONTROL = {
	speedThreshold: 2000,
	rainingRounds: 100,
	disableGoldRainLevels: 500,
	rainingSafeRounds: 9
};

var GAME_STATUS = {
	LOBBY: 1,
	RUNNING: 2,
	OVER: 3
};

// Try to disable particles straight away,
// if not yet available, they will be disabled in firstRun
disableParticles();

// Define custom getters for document.hidden and the prefixed versions, so the game
// doesn't stop ticking in the background.
if (Object.defineProperty) {
	var props = ['hidden', 'webkitHidden', 'mozHidden', 'msHidden'];
	for (var i = 0; i < props.length; ++i) {
		Object.defineProperty(document, props[i], {value: false});
	}
}

if(!getPreferenceBoolean("alertShown", false)) {
	window.ShowAlertDialog(
		'Ye Olde Megajump',

		'<div style="color:#FF5252">This dialog will be shown just once, so please read through it.<br><br></div>' +
		'<h3 style="color:yellow">This script does not lag your game,<br>we are limiting it to 1 frame per second to lower CPU usage.</h3>' +
		'<p>We have multiple options to configure this script, and disabling FPS limiter is one of them.</p>' +
		'<p><a href="https://github.com/YeOldeWH/MonsterMinigameWormholeWarp" target="_blank">You can report issues on GitHub</a></p>' +
		'<p>Thanks and have fun!</p>'
	).done(function(strButton) {
		setPreference("alertShown", true);
	});
}

function getScene() {
	return window.g_Minigame.m_CurrentScene;
}

function firstRun() {
	advLog("Starting YOWH Script.", 1);

	trt_oldCrit = getScene().DoCritEffect;
	trt_oldPush = getScene().m_rgClickNumbers.push;
	trt_oldRender = window.g_Minigame.Render;

	if(enableElementLock) {
		lockElements();
	}

	if (enableAutoRefresh) {
		autoRefreshPage(autoRefreshMinutes);
	}	

	// disable particle effects - this drastically reduces the game's memory leak
	disableParticles();

	// disable enemy flinching animation when they get hit
	if(removeFlinching && window.CEnemy) {
		window.CEnemy.prototype.TakeDamage = function() {};
		window.CEnemySpawner.prototype.TakeDamage = function() {};
		window.CEnemyBoss.prototype.TakeDamage = function() {};
	}

	if(removeCritText) {
		toggleCritText();
	}

	if(removeAllText) {
		toggleAllText();
	}

	// style
	var styleNode = document.createElement('style');
	styleNode.type = 'text/css';
	var styleText = [
		// Page content
		".pagecontent {padding: 0}",
		// Align abilities to the left
		"#abilitiescontainer {text-align: left;}",
		// Activitylog and ability list
		"#activeinlanecontainer {padding-left: 10px;}",
		"#activeinlanecontainer:hover {height: auto; background-image: radial-gradient(circle farthest-corner at 32px 0px, rgba(0,124,182,0.1), #11111C); padding-bottom: 10px; position:absolute; z-index: 1;}",
		"#activeinlanecontainer:hover + #activitylog {margin-top: 88px;}",
		"#activitylog {margin-top: 20px}",
		// Option menu
		".game_options {height: auto;}",
		".game_options .toggle_sfx_btn {margin: 6px 7px 0px 2px; float: right;}",
		".game_options .toggle_music_btn {margin-right: 2px; float: right;}",
		".options_box {background-color: #000; width: 940px; padding: 12px; box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.6); color: #EDEDED; margin: 4px auto 0; overflow: auto; float: left;}",
		".options_box span.asterisk {color: #FF5252; font-size: 24px; line-height: 4px; vertical-align: bottom;}",
		".options_column {-moz-column-count: 2; -webkit-column-count: 2; column-count: 2; width: 50%; float: left;}",
		".options_column label {display: inline-block;}",
		".options_column input {float: left;}",
		".options_column input[type=number] {margin: 6px 5px 0 0; padding: 2px 0px 0px 4px;}",
		".options_column input[id=logLevelInput] {width: 25px;}",
		".options_column span.asterisk {line-height: 14px;}",
		// Element lock box
		".lock_elements_box {width: 165px; top: -76px; left: 303px; box-sizing: border-box; line-height: 1rem; padding: 7px 10px; position: absolute; color: #EDEDED;}",
		// Breadcrumbs
		".breadcrumbs {color: #bbb;}",
		".bc_span {text-shadow: 1px 1px 0px rgba( 0, 0, 0, 0.3 );}",
		".bc_room {color: #ACE191;}",
		".bc_level {color: #FFA07A;}",
		".bc_time {color: #9AC0FF;}",
		".bc_worms {color: #FFF79A;}",
		// Adjustments for hard to see areas on the new background
		"#upgradesscroll, #activityscroll {opacity: 0.75;}",
		".teamhealth {background: rgba( 240, 240, 255, 0.2 );}",
		"#upgrades .title_upgrates {color: #67C;}",
		// Always show ability count
		".abilitytemplate > a > .abilityitemquantity {visibility: visible; pointer-events: none;}",
		".tv_ui {background-image: url(http://i.imgur.com/vM1gTFY.gif);}",
		""
	];
	styleNode.textContent = styleText.join("");
	document.head.appendChild(styleNode);

	if( removeInterface ) {
		var node = document.getElementById("global_header");
		if (node && node.parentNode) {
			node.parentNode.removeChild( node );
		}
		node = document.getElementById("footer");
		if (node && node.parentNode) {
			node.parentNode.removeChild( node );
		}
		node = document.getElementById("footer_spacer");
		if (node && node.parentNode) {
			node.parentNode.removeChild( node );
		}
		document.body.style.backgroundPosition = "0 0";
	}

	originalUpdateLog = window.CUI.prototype.UpdateLog;

	// Set to match preferences
	toggleTrackTroll();

	// Add cool background
	window.$J('body.flat_page.game').css({
		'background-image': 'url(http://i.imgur.com/P8TB236.jpg)',
		'background-repeat': 'repeat',
	});

	// Add "players in game" label
	var titleActivity = document.querySelector( '.title_activity' );
	var playersInGame = document.createElement( 'span' );
	playersInGame.innerHTML = '<span id=\"players_in_game\">0/1500</span>&nbsp;Players in room<br>';
	titleActivity.insertBefore(playersInGame, titleActivity.firstChild);
	ELEMENTS.PlayersInGame = document.getElementById("players_in_game");

	enhanceTooltips();
	addIRC();
	addExtraUI();

	//Enable Pointer
	var value = enableFingering;

	window.CSceneGame.prototype.ClearNewPlayer = function(){};

	if(!getScene().m_spriteFinger) {
		window.WebStorage.SetLocal('mg_how2click', 0);
		getScene().CheckNewPlayer();
		window.WebStorage.SetLocal('mg_how2click', 1);
	}

	if(value) {
		getScene().m_containerParticles.addChild(getScene().m_spriteFinger);
	} else {
		getScene().m_containerParticles.removeChild(getScene().m_spriteFinger);
	}
	document.getElementById('newplayer').style.display = 'none';
	
	updateToggle("pointer", enableFingering);
	
	
	//Initial disable of renderer
	var ticker = window.PIXI.ticker.shared;

	if (!value) {
		ticker.autoStart = true;
		ticker.start();

		window.g_Minigame.Render = trt_oldRender;
		window.g_Minigame.Render();
	} else {
		ticker.autoStart = false;
		ticker.stop();

		window.g_Minigame.Render = function() {};
	}
	updateToggle("limitFPS", disableRenderer);
	
	isPastFirstRun = true;
	
	//try to autoBuy BP
	if(enableAutoBadgePurchase){
		var bpAutoBuyer = setInterval(function() {
			if(window.$J("#spend_badge_points_dialog").is(":visible")){
				clearInterval(bpAutoBuyer);
				useAutoBadgePurchase();
			}
		}, 100);
	}
}

function addExtraUI() {
	
	//Add settings div
	window.$J("#gamecontainer").append('<div id="settings"></div>');
	
	window.$J('#settings').css({
		"position": "absolute",
		"background": "url('https://raw.githubusercontent.com/ensingm2/SteamMonsterGameScript/master/img/settings.png')",
		"background-repeat": "no-repeat",
		"background-position": "0px 0px",
		"height": "300px",
		"width": "500px",
		"margin-top": "2px",
		"bottom": "-65px",
		"right": "10px",
		"padding-top": "15px",
		"padding-left": "12px"
	});

	//Bring the close button back
	window.$J('<div class="leave_game_btn">Close Game</div>').insertAfter("#settings");
	window.$J(".leave_game_btn").css({
		"width": "120px",
		"position": "absolute",
		"bottom": "90px",
		"z-index": "12",
		"left": "335px",
		"border": "5px solid grey",
		"border-radius": "5px",
		"background-color": "black",
		"height": "35px",
		"text-align": "center",
		"cursor": "pointer",
		"font-family": "'Press Start 2P', \"Lucida Console\", Consolas, Arial",
		"color": "white"
	});
	window.$J('.leave_game_btn').click(function() {
		window.location = 'http://steamcommunity.com/minigame/';
	});
	
	window.$J('<div class="leave_game_helper">You can safely close the game or leave this screen at any time—you will continue collecting gold and damaging monsters even while away from your computer. Check back occasionally to see how you\'re doing and use in-game gold to purchase upgrades.</div>').insertAfter("#settings");
	window.$J(".leave_game_helper").css({
		"left": "150px",
		"top": "initial",
		"bottom": "-20px",
		"z-index": "13"
	});
	
	window.$J("#settings").append('<div id="music_toggle" class="toggle"><span class="value disabled"></span><span class="title">Music: </span></div>');
	window.$J("#settings").append('<div id="sfx_toggle" class="toggle"><span class="value disabled"></span><span class="title">SFX: </span></div>');
	window.$J("#settings").append('<div id="interface_toggle" class="toggle"><span class="value disabled"></span><span class="title">Interface*:  </span></div>');
	window.$J("#settings").append('<div id="particle_toggle" class="toggle"><span class="value disabled"></span><span class="title">Particles*: </span></div>');
	window.$J("#settings").append('<div id="flinching_toggle" class="toggle"><span class="value disabled"></span><span class="title">Flinching*: </span></div>');
	window.$J("#settings").append('<div id="critText_toggle" class="toggle"><span class="value enabled"></span><span class="title">Crit Text: </span></div>');
	window.$J("#settings").append('<div id="allText_toggle" class="toggle"><span class="value enabled"></span><span class="title">All Text: </span></div>');
	window.$J("#settings").append('<div id="limitFPS_toggle" class="toggle"><span class="value enabled"></span><span class="title">Limit FPS: </span></div>');
	window.$J("#settings").append('<div id="pointer_toggle" class="toggle"><span class="value enabled"></span><span class="title">Targetting Pointer: </span></div>');
	window.$J("#settings").append('<div id="trollTracker_toggle" class="toggle"><span class="value disabled"></span><span class="title">Troll Tracking: </span></div>');
	window.$J("#settings").append('<div id="elementLock_toggle" class="toggle"><span class="value enabled"></span><span class="title">Element Locking: </span></div>');
	window.$J("#settings").append('<div id="chen_toggle" class="toggle"><span class="value disabled"></span><span class="title">Honk Honk? </span></div>');
	
	window.$J("#settings").append('<div><span class="toggle">Lock Level: <input type="number" id="logLevelInput" value="'+logLevel+'" min=0 max=5></input></span></div>');
	
	window.$J("#logLevelInput").change(function() {
		logLevel = window.$J('#logLevelInput').val();
	});
	
	//Prevent propagation back to container slider
	window.$J("#logLevelInput").click(function(event) {
		Event.stop(event);
	});
	
	window.$J("#settings").append('<div><span class="toggle" style="margin-left: 25px; color: red">* - Restart Required</span></div>');
	
	window.$J("#sfx_toggle").click(function(e) {
		e.stopPropagation();
		toggleSFX(true);
	});
	
	window.$J("#music_toggle").click(function(e) {
		e.stopPropagation();
		toggleMusic(true);
	});
	
	window.$J("#interface_toggle").click(function(e) {
		e.stopPropagation();
		toggleInterface(true);
	});

	window.$J("#particle_toggle").click(function(e) {
		e.stopPropagation();
		toggleParticles(true);
	});
	
	window.$J("#flinching_toggle").click(function(e) {
		e.stopPropagation();
		toggleFlinching(true);
	});
	
	window.$J("#critText_toggle").click(function(e) {
		e.stopPropagation();
		toggleCritText();
	});
	
	window.$J("#allText_toggle").click(function(e) {
		e.stopPropagation();
		toggleAllText();
	});
	
	window.$J("#limitFPS_toggle").click(function(e) {
		e.stopPropagation();
		toggleRenderer();
	});
	
	window.$J("#pointer_toggle").click(function(e) {
		e.stopPropagation();
		toggleFingering();
	});
	
	window.$J("#trollTracker_toggle").click(function(e) {
		e.stopPropagation();
		toggleTrackTroll();
	});
	
	window.$J("#elementLock_toggle").click(function(e) {
		e.stopPropagation();
		toggleElementLock();
	});
	
	window.$J("#chen_toggle").click(function(e) {
		e.stopPropagation();
		toggleChen();
	});
	
	// We force update the icon once to sync with active settings
	updateToggle("sfx", !window.WebStorage.GetLocal('minigame_mute'));
	updateToggle("music", !window.WebStorage.GetLocal('minigame_mutemusic'));
	updateToggle("interface", !removeInterface);
	updateToggle("particle", !removeParticles);
	updateToggle("flinching", !removeFlinching);

	// Slide the settings panel out on click
	window.$J("#settings").click(function() {
		var op = window.$J("#settings");
		op.animate({
			bottom: parseInt(op.css('bottom'), 10) == -65 ? -op.outerHeight() : -65
		});
	});

	//Statistics
	window.$J("#gamecontainer").append('<div id="statistics"></div>');
	window.$J('#statistics').css({
		"position": "absolute",
		"background": "url('https://raw.githubusercontent.com/ensingm2/SteamMonsterGameScript/master/img/stats.png')",
		"background-repeat": "no-repeat",
		"background-position": "0px 0px",
		"height": "250px",
		"width": "500px",
		"margin-top": "2px",
		"bottom": "-65px",
		"left": "10px",
		"padding-top": "15px",
		"padding-left": "25px"
	});

	//Add in stats
	window.$J("#statistics").append('<div id="stat_player_dpc" class="stat"><span class="title">Dmg Per Click: </span><span class="value">0</span></div>');
	window.$J("#statistics").append('<div id="stat_player_dps" class="stat"><span class="title">Dmg Per Second: </span><span class="value">0</span></div>');
	window.$J("#statistics").append('<div id="stat_player_crit" class="stat"><span class="title">Critical Chance: </span><span class="value">0</span></div>');
	window.$J("#statistics").append('<div id="stat_crit_mul" class="stat"><span class="title">Critical Dmg Multiplier: </span><span class="value">0</span></div>');
	window.$J("#statistics").append('<div id="stat_elemental_mul" class="stat"><span class="title">Elemental Multiplier: </span><span class="value">0</span></div>');
	window.$J("#statistics").append('<div id="stat_elemental_dpc" class="stat"><span class="title">Elemental DPC: </span><span class="value">0</span></div>');
	window.$J("#statistics").append('<div id="stat_elemental_dps" class="stat"><span class="title">Elemental DPS: </span><span class="value">0</span></div>');
	window.$J("#statistics").append('<div id="stat_boss_loot" class="stat"><span class="title">Boss Loot Chance: </span><span class="value">0</span></div>');

	window.$J("#footer_spacer").css({
		"height": "175px"
	});
	window.$J("canvas").css({
		"position": "relative",
		"z-index": "5"
	});
	window.$J("#uicontainer").css({
		"z-index": "6"
	});
	
	//Update stats
	setInterval(function() {
		function getElementalMul() {
			return Math.max(window.g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_multiplier_air, window.g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_multiplier_earth, window.g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_multiplier_fire, window.g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_multiplier_water);
		}
		window.$J("#statistics #stat_player_dpc .value").html(window.FormatNumberForDisplay(window.g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_per_click, 5));
		window.$J("#statistics #stat_player_dps .value").html(window.FormatNumberForDisplay(window.g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_per_click * clickRate, 5));
		window.$J("#statistics #stat_player_crit .value").html(window.FormatNumberForDisplay(Math.round(window.g_Minigame.m_CurrentScene.m_rgPlayerTechTree.crit_percentage * 100), 5) + "%");
		window.$J("#statistics #stat_crit_mul .value").html(window.FormatNumberForDisplay(window.g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_multiplier_crit, 5) + "x");
		window.$J("#statistics #stat_elemental_mul .value").html(window.FormatNumberForDisplay(getElementalMul()) + "x");
		window.$J("#statistics #stat_elemental_dpc .value").html(window.FormatNumberForDisplay(getElementalMul() * window.g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_per_click, 5));
		window.$J("#statistics #stat_elemental_dps .value").html(window.FormatNumberForDisplay(getElementalMul() * window.g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_per_click * clickRate, 5));
		window.$J("#statistics #stat_boss_loot .value").html(window.FormatNumberForDisplay(Math.round(window.g_Minigame.m_CurrentScene.m_rgPlayerTechTree.boss_loot_drop_percentage * 100, 5)) + "%");
	}, 1000);

	window.$J("#statistics").click(function() {
		var op = window.$J("#statistics");
		op.animate({
			bottom: parseInt(op.css('bottom'), 10) == -65 ? -op.outerHeight() : -65
		});
	});

	//Smack the TV Easter Egg
	window.$J('<div style="height: 52px; position: absolute; bottom: 85px; left: 828px; z-index: 12;" onclick="SmackTV();"><br><br><span style="font-size:10px; padding: 12px; color: gold;">Smack TV</span></div>').insertBefore('#row_bottom');

	//Remove unneeded options area 
	window.$J(".game_options").remove();

	//Hide the stupid "Leave game" tooltip
	window.$J('.leave_game_btn').mouseover(function() {
			window.$J('.leave_game_helper').show();
		})
		.mouseout(function() {
			window.$J('.leave_game_helper').hide();
		});
	window.$J('.leave_game_helper').hide(); 

	
	//Custom CSS
	var css = "";
	css += "#settings .toggle { position: relative; margin-top: 10px; width: 30%; height: 32px; z-index: 0; float: left; margin-left: 10px;} ";
	css += "#settings span.title { position: relative; top: 10px; float: right; right:15px; text-align:right; width: 80%;} ";
	css += "#settings span.value { position: relative; float: right; right:10px; display: inline-block; z-index:11; cursor: pointer;} ";
	css += "#settings span.value.enabled { background: url('https://raw.githubusercontent.com/ensingm2/SteamMonsterGameScript/master/img/icons.png'); background-repeat: no-repeat;background-position:0px 0px;width:30px;height:30px; } ";
	css += "#settings span.value.enabled:hover { background: url('https://raw.githubusercontent.com/ensingm2/SteamMonsterGameScript/master/img/icons.png'); background-repeat: no-repeat;background-position:-30px 0px;width:30px;height:30px; } ";
	css += "#settings span.value.disabled { background: url('https://raw.githubusercontent.com/ensingm2/SteamMonsterGameScript/master/img/icons.png'); background-repeat: no-repeat;background-position:0px -30px;width:30px;height:32px; } ";
	css += "#settings span.value.disabled:hover { background: url('https://raw.githubusercontent.com/ensingm2/SteamMonsterGameScript/master/img/icons.png'); background-repeat: no-repeat;background-position:-30px -30px;width:30px;height:32px; } ";

	css += "#statistics .stat { position: relative; margin-top: 5px; width: 40%; height: 32px; z-index: 0; margin-left: 25px; float:left;} ";
	css += "#statistics span.value { position: relative; float: right; margin-right: 30px; text-align: right; width: 100%;} ";
	css += "#statistics span.title { position: relative; width: 100%; font-weight: bold;} ";

	css += ".toggle_btn {background: #d6d6d6;-webkit-border-radius: 7; -moz-border-radius: 7; border-radius: 7px; color: #333; text-decoration: none; text-align: center;cursor: pointer;font-weight: bold;} ";
	css += ".toggle_btn:hover { background: #85c8f2; text-decoration: none; color: #fff;cursor: pointer;font-weight: bold;} ";
	css += "#activeinlanecontainer:hover {border-radius: 7px; border: 2px red;height:auto;background-color: black;padding-bottom:10px;position:absolute;z-index:1} #activeinlanecontainer:hover ~ #activitylog {margin-top:97px} #activitylog {margin-top: 29px} ";
	css += "#leaderboard_wrapper {overflow: hidden; height: 360px; width: 261px; position: relative; margin: 50px 0px 0px 5px; padding: 5px;} #activeinlanecontainer:hover ~ #leaderboard_wrapper {margin-top: 118px}";
	css += "#info_hp { position:relative; top:28px; text-align: center;}";
	css += "#irc_join {position: relative; width: 175px; height: 30px; top: -50px; left: 30px; cursor: pointer;}";
	css += ".arrow {font-weight: bold; background-color: #bebebe; width: 20px; color: #434340; border-radius: 7px; float: right; text-align: center; margin-top: -2px; margin-left: 10px; }";
	css += ".abilityDisabledIndicator {  z-index: 2; position: absolute; background: url('http://cdn.steamcommunity.com//economy/emoticon/:TryAgain:'); background-size: 36px 36px; background-repeat: no-repeat; width: 36px; height: 36px; }";
	css += ".abilityDisabledIndicator.hidden {  display: none; }";
	
	window.$J('head').append('<style>' + css + '</style>');
	
	// Put the page footer behind settings
	window.$J("#footer").css('z-index', -1);
	
	// 'Disabled' indicators for disabled abilities
	window.$J('.abilitytemplate').prepend('<div class="abilityDisabledIndicator hidden"></div>');
}

function toggleInterface() {
	removeInterface = !removeInterface;
	setPreference("removeInterface", removeInterface);
	updateToggle("interface", removeInterface);
}

function toggleParticles() {
	removeParticles = !removeParticles;
	setPreference("removeParticles", removeParticles);
	updateToggle("particle", removeParticles);
}

function toggleFlinching() {
	removeFlinching = !removeFlinching;
	setPreference("removeFlinching", removeFlinching);
	updateToggle("flinching", removeFlinching);
}

function updateToggle(id, enabled) {
	if (enabled) {
		window.$J("#" + id + "_toggle span.value").removeClass("disabled").addClass("enabled");
	} else {
		window.$J("#" + id + "_toggle span.value").removeClass("enabled").addClass("disabled");
	}
}

function toggleSFX() {
	window.WebStorage.SetLocal('minigame_mute', !window.WebStorage.GetLocal('minigame_mute'));
		
	updateToggle("sfx", !window.WebStorage.GetLocal('minigame_mute'));
}

function toggleMusic() {
	window.g_AudioManager.ToggleMusic();
	
	updateToggle("music", !window.WebStorage.GetLocal('minigame_mutemusic'));
}

// Valve's update
var originalUpdateLog = null;

// The trolltrack
var localUpdateLog = function( rgLaneLog ) {
	var abilities = this.m_Game.m_rgTuningData.abilities;
	var level = getGameLevel();

	if( !this.m_Game.m_rgPlayerTechTree ) {
		return;
	}

	var nHighestTime = 0;

	for( var i=rgLaneLog.length-1; i >= 0; i--) {
		var rgEntry = rgLaneLog[i];

		if( isNaN( rgEntry.time ) ) {
			rgEntry.time = this.m_nActionLogTime + 1;
		}

		if( rgEntry.time <= this.m_nActionLogTime ) {
			continue;
		}

		// If performance concerns arise move the level check out and swap switch for if.
		switch( rgEntry.type ) {
			case 'ability':
				if ( (level % 100 !== 0 && [26].indexOf(rgEntry.ability) > -1) || (level % 100 === 0 && [10, 11, 12, 15, 20].indexOf(rgEntry.ability) > -1) ) {
					var ele = this.m_eleUpdateLogTemplate.clone();
					window.$J(ele).data('abilityid', rgEntry.ability);
					window.$J('.name', ele).text(rgEntry.actor_name).attr("style", "color: red; font-weight: bold;");
					window.$J('.ability', ele).text(abilities[rgEntry.ability].name + " on level " + level);
					window.$J('img', ele).attr('src', window.g_rgIconMap['ability_' + rgEntry.ability].icon);

					window.$J(ele).v_tooltip({tooltipClass: 'ta_tooltip', location: 'top'});

					this.m_eleUpdateLogContainer[0].insertBefore(ele[0], this.m_eleUpdateLogContainer[0].firstChild);
				
					advLog(rgEntry.actor_name + " used " + getScene().m_rgTuningData.abilities[ rgEntry.ability ].name + " on level " + level, 1);
				}
				break;
			default:
				console.log("Unknown action log type: %s", rgEntry.type);
				console.log(rgEntry);
		}

		if(rgEntry.time > nHighestTime) {
			nHighestTime = rgEntry.time;
		}
	}

	if( nHighestTime > this.m_nActionLogTime ) {
		this.m_nActionLogTime = nHighestTime;
	}

	var e = this.m_eleUpdateLogContainer[0];
	while(e.children.length > 20 ) {
		e.children[e.children.length-1].remove();
	}
};

function disableParticles() {
	if (window.CSceneGame) {
		window.CSceneGame.prototype.DoScreenShake = function() {};

		if(removeParticles) {
			window.CSceneGame.prototype.SpawnEmitter = function(emitter) {
				emitter.emit = false;
				return emitter;
			};

			var particles = getScene().m_rgActiveParticles;

			if(particles) {
				if (particles[ 7 ]) {
					particles[ 7 ][0].emit = false;
					particles[ 7 ][1].emit = false;
				}

				if (particles[ 5 ]) {
					particles[ 5 ][0].emit = false;
				}

				if (particles[ 6 ]) {
					particles[ 6 ][0].emit = false;
					particles[ 6 ][1].emit = false;
				}

				if (particles[ 8 ]) {
					particles[ 8 ][0].emit = false;
					particles[ 8 ][1].emit = false;
					particles[ 8 ][2].emit = false;
				}

				if (particles[ 9 ]) {
					particles[ 9 ][0].emit = false;
					particles[ 9 ][1].emit = false;
				}
			}
		}
	}
}

function getEndDate() {
	var endDate = new Date();
	if (endDate.getUTCHours() >= 16) {
		endDate.setUTCDate(endDate.getUTCDate() + 1);
	}
	endDate.setUTCHours(16, 0, 0, 0);
	return endDate;
}

function getSecondsRemaining() {
	var now = new Date();
	var endDate = getEndDate();
	
	var diff = endDate.getTime() - now.getTime();

	return diff / 1000;
}

function updateLevelTimeTracker() {
	if (lastLevelTimeTaken[0].level !== getGameLevel()) {
		lastLevelTimeTaken.unshift({level: getGameLevel(),
									levelsGained: -1,
									timeStarted: getScene().m_rgGameData.timestamp,
									timeTakenInSeconds: -1});

		var previousLevel = lastLevelTimeTaken[1];

		previousLevel.levelsGained = getGameLevel() - previousLevel.level;
		previousLevel.timeTakenInSeconds = getScene().m_rgGameData.timestamp - previousLevel.timeStarted;
	}

	if (lastLevelTimeTaken.length > 10) {
		lastLevelTimeTaken.pop();
	}
}

function MainLoop() {
	var status = getScene().m_rgGameData.status;
	if(status != GAME_STATUS.RUNNING) {
		if(disableRenderer) {
			getScene().Tick();
		}

		return;
	}

	var level = getGameLevel();
	updateLevelTimeTracker();
	updateApproxYOWHClients();

	if (!isAlreadyRunning) {
		isAlreadyRunning = true;
		
		if( level !== lastLevel ) {
			// Clear any unsent abilities still in the queue when our level changes
			getScene().m_rgAbilityQueue.clear();
			
			// update skips if applicable
			if (updateSkips) {
				skipsLastJump = level - lastLevel;
				updateSkips = false;
			}
		}

		if (level % 100 === 0) {
			// On a WH level, jump everyone with wormholes to lane 0, unless there is a boss there, in which case jump to lane 1.
			var targetLane = 0;
			// Check lane 0, enemy 0 to see if it's a boss
			var enemyData = getScene().GetEnemy(0, 0).m_data;
			if(typeof enemyData !== "undefined"){
				var enemyType = enemyData.type;
				if(enemyType == ENEMY_TYPE.BOSS) {
					advLog('In lane 0, there is a boss, avoiding', 4);
					targetLane = 1;
					var enemyDataLaneOne = getScene().GetEnemy(1, 0).m_data;
					var enemyDataLaneTwo = getScene().GetEnemy(2, 0).m_data;
					if(typeof enemyDataLaneOne != "undefined" && typeof enemyDataLaneTwo == "undefined"){
						//Lane 1 has monsters. Lane 2 is empty. Switch to lane 2 instead.
						targetLane = 2;
					}	
				}
			}
			if( getScene().m_rgPlayerData.current_lane != targetLane ) {
				advLog('Moving player to wormhole lane ' + targetLane, 4);
				getScene().TryChangeLane(targetLane); // put everyone in the same lane
			}

			updateSkips = true;
		} else {
			goToLaneWithBestTarget(level);
		}
		
		// Clear any unsent abilities still in the queue when our level changes
		if( level !== lastLevel ) {
			getScene().m_rgAbilityQueue.clear();
		}

		attemptRespawn();

		if (level % 100 !== 0 && window.SteamDB_Wormhole_Timer) {
			window.clearInterval(window.SteamDB_Wormhole_Timer);
			window.SteamDB_Wormhole_Timer = false;
		}

		if(level % 100 === 0) {
			useAbilitiesAt100();
		} else {
			useAbilities(level);
		}

		updatePlayersInGame();

		if( level !== lastLevel ) {
			if (level % 100 === 0) {
				enableAbility(ABILITIES.WORMHOLE);
				enableAbility(ABILITIES.LIKE_NEW);
			} else {
				disableAbility(ABILITIES.WORMHOLE);
				disableAbility(ABILITIES.LIKE_NEW);
			}

			lastLevel = level;
			updateLevelInfoTitle(level);
			refreshPlayerData();
		}

		// only AutoUpgrade after we've spend all badge points
		if(getScene().m_rgPlayerTechTree) {
			if(getScene().m_rgPlayerTechTree.badge_points === 0) {
				useAutoUpgrade();
				useAutoPurchaseAbilities();
			}
		}

		var absoluteCurrentClickRate = 0;

		if(currentClickRate > 0) {
			var levelRainingMod = level % CONTROL.rainingRounds;

			absoluteCurrentClickRate = level > CONTROL.speedThreshold && (levelRainingMod === 0 || 3 >= (CONTROL.rainingRounds - levelRainingMod)) ? 0 : currentClickRate;

			// throttle back as we approach
			for(var i = 1; i <= 3; i++) {
				if(levelRainingMod > CONTROL.rainingRounds - i) {
					absoluteCurrentClickRate = Math.round(absoluteCurrentClickRate / 10);
				}
			}

			var levelsUntilBoss = (CONTROL.rainingRounds - (level % CONTROL.rainingRounds));

			if (levelsUntilBoss < 5 && Math.random < (0.9 / levelsUntilBoss)){
				absoluteCurrentClickRate = clicksOnBossLevel;
			}
			
			//If at the boss level, dont click at all
			if (level % CONTROL.rainingRounds === 0) {
				absoluteCurrentClickRate = clicksOnBossLevel;
			}

			
			getScene().m_nClicks += absoluteCurrentClickRate;
		}

		getScene().m_nLastTick = false;
		window.g_msTickRate = 1000;

		var damagePerClick = getScene().CalculateDamage(
			getScene().m_rgPlayerTechTree.damage_per_click,
			getScene().m_rgGameData.lanes[getScene().m_rgPlayerData.current_lane].element
		);

		advLog("Ticked. Current clicks per second: " + absoluteCurrentClickRate + ". Current damage per second: " + (damagePerClick * absoluteCurrentClickRate), 4);

		if(disableRenderer) {
			getScene().Tick();

			requestAnimationFrame(function() {
				window.g_Minigame.Renderer.render(getScene().m_Container);
			});
		}

		isAlreadyRunning = false;

		if( absoluteCurrentClickRate > 0) {
			var enemy = getScene().GetEnemy(
				getScene().m_rgPlayerData.current_lane,
				getScene().m_rgPlayerData.target);

			if (enemy) {
				displayText(
					enemy.m_Sprite.position.x - (enemy.m_nLane * 440),
					enemy.m_Sprite.position.y - 52,
					"-" + window.FormatNumberForDisplay((damagePerClick * absoluteCurrentClickRate), 5),
					"#aaf"
				);

				if( getScene().m_rgStoredCrits.length > 0 ) {
					var rgDamage = getScene().m_rgStoredCrits.reduce(function(a,b) {
						return a + b;
					});
					getScene().m_rgStoredCrits.length = 0;

					getScene().DoCritEffect( rgDamage, enemy.m_Sprite.position.x - (enemy.m_nLane * 440), enemy.m_Sprite.position.y + 17, 'Crit!' );
				}

				var goldPerClickPercentage = getScene().m_rgGameData.lanes[getScene().m_rgPlayerData.current_lane].active_player_ability_gold_per_click;
				if (goldPerClickPercentage > 0 && enemy.m_data.hp > 0) {
					var goldPerSecond = enemy.m_data.gold * goldPerClickPercentage * absoluteCurrentClickRate;

					getScene().ClientOverride('player_data', 'gold', getScene().m_rgPlayerData.gold + goldPerSecond);
					getScene().ApplyClientOverrides('player_data', true);

					advLog(
						"Raining gold ability is active in current lane. Percentage per click: " + goldPerClickPercentage
						+ "%. Approximately gold per second: " + goldPerSecond,
						4
					);
					displayText(
						enemy.m_Sprite.position.x - (enemy.m_nLane * 440),
						enemy.m_Sprite.position.y - 17,
						"+" + window.FormatNumberForDisplay(goldPerSecond, 5),
						"#e1b21e"
					);
				}
			}
		}
	}
}

// checks the amount of items that are still usable in the round
// THIS ASSUMES NO COOLDOWN, OR A CONSTANT SUPPLY OF LNs, AS IT IS A THEORETICAL MAX
function maxItemsStillUsable(abilityID, usagePct) {
	var maxItemUsePerSec = 1.75; // Estimated number of wormholes usable by client in a second
	
	return Math.floor(maxItemUsePerSec * usagePct * getSecondsRemaining());
}

function getBPBuyCount(abilityID, usagePct) {
	var badgePoints = getScene().m_rgPlayerTechTree.badge_points;
	
	return Math.min(
		parseInt(badgePoints / getScene().m_rgTuningData.abilities[ABILITIES.WORMHOLE].badge_points_cost),
		maxItemsStillUsable(abilityID, usagePct)
	);
}

function useAutoBadgePurchase() {
	if(!enableAutoBadgePurchase) { return; }
	
	//Alert
	window.ShowAlertDialog(
		'Automagic BP Purchaser',
		'<h3 style="color:#FF5252">Just chill for a sec. The script will autoBuy your BP bonuses for you.<br><br></h3>' +
		'<h3 style="color:yellow">You have ' + getScene().m_rgPlayerTechTree.badge_points + ' badgePoints to spend. This may take a little while, so hold tight. The more BP you have, the longer it will take.</h3>' +

		'<p style="color:yellow">(Note: This dialog will NOT autoclose. Any additional badgePoints remaining after a little while, feel free to distribute however you feel.)</p>'
	);
	
	var badgePoints = getScene().m_rgPlayerTechTree.badge_points;
	
	var abilityData = getScene().m_rgTuningData.abilities;
	var abilityPurchaseQueue = [];
	
	// id = ability
	// usagePct = percent of time this ability will be spammed.
	
	var abilityPriorityList = [
		{ id: ABILITIES.WORMHOLE,	usagePct: 0.2 },
		{ id: ABILITIES.LIKE_NEW,	usagePct:  0.2 },
		{ id: ABILITIES.CRIT,		usagePct: 1 },
		{ id: ABILITIES.TREASURE,	usagePct: 1 },
		{ id: ABILITIES.PUMPED_UP,	usagePct: 1 },
		{ id: ABILITIES.FEELING_LUCKY,	usagePct: 1 },
		{ id: ABILITIES.RESURRECTION,	usagePct: 1 },
		{ id: ABILITIES.GOD_MODE,	usagePct: 1 },
		{ id: ABILITIES.GOD_MODE,	usagePct: 1 },
		{ id: ABILITIES.MAX_ELEMENTAL_DAMAGE,	usagePct: 1 },
		{ id: ABILITIES.RAINING_GOLD,	usagePct: 1 },
		{ id: ABILITIES.STEAL_HEALTH,	usagePct: 1 },
		{ id: ABILITIES.CRIPPLE_SPAWNER,	usagePct: 1 }, 
		{ id: ABILITIES.REFLECT_DAMAGE,	usagePct: 1 },
		{ id: ABILITIES.CRIPPLE_MONSTER,	usagePct: 1 },
		{ id: ABILITIES.THROW_MONEY_AT_SCREEN,	usagePct: 1 },
	];
	
	// Attempt to automatically determine if a user should be a LN
	var maxUsableWormholes = maxItemsStillUsable(ABILITIES.WORMHOLE, 0.2); // Currently, this is 30240 WHs on Round start, and decreases over tim

	for (var i = 0; i < abilityPriorityList.length; i++) {
		var id = abilityPriorityList[i].id;
		var usagePct = abilityPriorityList[i].usagePct;
		
		var toBuyCount = getBPBuyCount(id, usagePct); 
		
		//Hard cap crit at 100
		if(id == ABILITIES.CRIT) {
			toBuyCount = Math.min(toBuyCount, 89); // Max of 89 crit items (puts you at 99.000000149011612% crit chance)
		}
		
		// Buy the item the specified number of times
		for(var j=0; j < toBuyCount; j++ ) {
			abilityPurchaseQueue.push(id);
		}
		
		// Decrement our badge points remaining
		badgePoints -= toBuyCount * abilityData[id].badge_points_cost;
		getScene().m_rgPlayerTechTree.badge_points = badgePoints;
	}
	
	//apply the purchase queue we just made
	getScene().m_rgPurchaseItemsQueue = getScene().m_rgPurchaseItemsQueue.concat(abilityPurchaseQueue);
	getScene().m_UI.UpdateSpendBadgePointsDialog();
	
	
	// Any remaining BP is useless, just spend it all on pumped up to deplete BP
	var dumpAbility = ABILITIES.PUMPED_UP;
	var dumpCost = abilityData[dumpAbility].badge_points_cost;
	//Loop this cause sometimes you don't actually spend everything
	while(getScene().m_rgPlayerTechTree.badge_points >  0) {
		badgePoints = getScene().m_rgPlayerTechTree.badge_points;
		for (badgePoints; badgePoints > 0;  badgePoints -= dumpCost) {
			abilityPurchaseQueue.push(ABILITIES.PUMPED_UP);
		}
		
		getScene().m_rgPlayerTechTree.badge_points = badgePoints;
		
		//apply the purchase queue we just made
		getScene().m_rgPurchaseItemsQueue = getScene().m_rgPurchaseItemsQueue.concat(abilityPurchaseQueue);
		getScene().m_UI.UpdateSpendBadgePointsDialog();
		
	}
	
	
	// Force Hide the BP store (after half a second, since if you do it too fast steam re-opens it)
	window.$J("#spend_badge_points_dialog").hide();
}

function isBossLevel(level) {
	return level % 100 === 0;
}


function updateApproxYOWHClients() {
	var APPROXIMATE_WH_PER_PERSON_PER_SECOND = 10;

	if (lastLevelTimeTaken.length < 2) {
		return;
	}

	var lastLevel = lastLevelTimeTaken[1].level;

	if (isBossLevel(lastLevel)) {
		var levelsJumped = getGameLevel() - lastLevel;
		var bossLevelTime = lastLevelTimeTaken[1].timeTakenInSeconds;

		var possiblyInaccurateCount = Math.round(levelsJumped / (bossLevelTime * APPROXIMATE_WH_PER_PERSON_PER_SECOND));

		if (possiblyInaccurateCount < 1500) {
			approxYOWHClients = possiblyInaccurateCount;
		} else {
			console.log("Inaccurate count of YOWH Clients: ",possiblyInaccurateCount,
						", levelsJumped: ", levelsJumped,
						", bossLevelTime: ", bossLevelTime,
						", lastLevelTimeTaken", lastLevelTimeTaken);
		}
	}
}

function levelsPerSec() {
	if (lastLevelTimeTaken.length < 2) {
		return 0;
	}

	var timeSpentOnBosses = 0;
	var levelsGainedFromBosses = 0;

	lastLevelTimeTaken.filter(function(levelInfo) {
		return isBossLevel(levelInfo.level);
	}).map(function(levelInfo) {
		timeSpentOnBosses += levelInfo.timeTakenInSeconds;
		levelsGainedFromBosses += levelInfo.levelsGained;
	});

	return Math.round(((getGameLevel() - lastLevelTimeTaken.slice(-1).pop().level - levelsGainedFromBosses)
			/ (getScene().m_rgGameData.timestamp - lastLevelTimeTaken.slice(-1).pop().timeStarted - timeSpentOnBosses)) * 1000 ) / 1000;
}


//at level 100 spam WH, Like New, and medics, based on your role
function useAbilitiesAt100() {

	if (getAbilityItemQuantity(ABILITIES.WORMHOLE) > 0 && !window.SteamDB_Wormhole_Timer) {
		advLog("At level % 100 = 0, forcing the use of wormholes nonstop", 2);
		window.SteamDB_Wormhole_Timer = window.setInterval(function(){
			if (getGameLevel() % 100 !== 0) {
				// We're not on a *00 level anymore, stop!!
				window.clearInterval(window.SteamDB_Wormhole_Timer);
				window.SteamDB_Wormhole_Timer = false;
				return;
			}
			if (bHaveItem(ABILITIES.WORMHOLE)) {
				triggerAbility(ABILITIES.WORMHOLE); //wormhole
			}
		}, 1000); //SLOW DOWN. 100ms trigger is causing server to ignore client, primary cause of client desync.
	}
	
	//This should equate to approximately 1.8 Like News per second
	//Spam them indicriminantley if you have a lot
	if (getAbilityItemQuantity(ABILITIES.LIKE_NEW) > 500) {
		advLog("At level % 100 = 0, forcing the use of a like new", 2);
		tryUsingAbility(ABILITIES.LIKE_NEW, false, true); //like new
	}
	// If you only have a few remaining, only use them occasionally
	else if (Math.random() <= 0.05) {
		tryUsingAbility(ABILITIES.LIKE_NEW, false, true);
	}
	
	//Use Medics
	if (hasAbility(ABILITIES.MEDICS)) {
		advLog("At level % 100 = 0, forcing the use of a medic", 2);
		tryUsingAbility(ABILITIES.MEDICS, false, true); //medics
	}
	
	
	if (hasAbility(ABILITIES.FEELING_LUCKY)) {
		advLog("At level % 100 = 0, forcing the use of a Feeling Lucky", 2);
		tryUsingAbility(ABILITIES.FEELING_LUCKY, false, true); //medics
	}
}

function useAutoPurchaseAbilities() {
	if(!enableAutoPurchase || autoupgrade_update_hilight) { return; }

	var elms = document.querySelectorAll(".container_purchase > div:not([class~='cantafford'])");

	if(elms.length === 0) { return; }

	var pData = getScene().m_rgPlayerData;

	[].forEach.call(elms, function(elm) {
		if(elm.style.display !== "") { return; }

		var idx = parseInt(elm.id.split('_')[1]);

		if(getScene().GetUpgradeCost(idx) < pData.gold) {
			getScene().TryUpgrade(elm.querySelector('.link'));
		}
	});
}

var autoupgrade_update_hilight = true;
var autoupgrade_hp_threshold = 0;

function useAutoUpgrade() {
	if(!enableAutoUpgradeDPS
		&& !enableAutoUpgradeClick
		&& !enableAutoUpgradeHP
		&& !enableAutoUpgradeElemental
		) {
		autoupgrade_update_hilight = false;
		return;
	}

	// fixes hiligh when we tick before elements are created
	if(!document.querySelector('.container_upgrades')
		|| !document.querySelector('.container_upgrades').hasChildNodes()
		) {
		return;
	}

	var upg_order = [
		UPGRADES.ARMOR_PIERCING_ROUND,
		UPGRADES.LIGHT_ARMOR,
		UPGRADES.AUTO_FIRE_CANNON,
		UPGRADES.LUCKY_SHOT,
	];
	if(enableAutoUpgradeElemental && ELEMENTS.LockedElement !== -1) { upg_order.push(ELEMENTS.LockedElement+3); }
	var upg_map = {};
	upg_order.forEach(function(i) { upg_map[i] = {}; });
	var pData = getScene().m_rgPlayerData;
	var pTree = getScene().m_rgPlayerTechTree;
	var cache = getScene().m_UI.m_rgElementCache;

	// calculate hp threshold based on mob dps
	var mob = getScene().m_rgEnemies[0];
	if(!!mob) {
		var threshold = mob.m_data.dps * 300 * 2.5;
		if(threshold > autoupgrade_hp_threshold) {
			autoupgrade_hp_threshold = threshold;
		}
	}

	var upg_enabled = [
		enableAutoUpgradeClick && getScene().m_rgGameData.level > upgThreshold,
		enableAutoUpgradeHP && pTree.max_hp < Math.max(100000, autoupgrade_hp_threshold),
		enableAutoUpgradeDPS && getScene().m_rgGameData.level > upgThreshold,
	];

	// loop over all upgrades and find the most cost effective ones
	getScene().m_rgTuningData.upgrades.forEach(function(upg, idx) {
		if(upg_map.hasOwnProperty(upg.type)) {

			var cost = getScene().GetUpgradeCost(idx) / parseFloat(upg.multiplier);

			if(!upg_map[upg.type].hasOwnProperty('idx') || upg_map[upg.type].cost_per_mult > cost) {
				if(upg.hasOwnProperty('required_upgrade') && getScene().GetUpgradeLevel(upg.required_upgrade) < upg.required_upgrade_level) { return; }

				upg_map[upg.type] = {
					'idx': idx,
					'cost_per_mult': cost,
				};
			}
		}
	});

	// do hilighting if needed
	if(autoupgrade_update_hilight) {
		autoupgrade_update_hilight = false;

		// clear all currently hilighted
		[].forEach.call(document.querySelectorAll('[id^="upgr_"] .info'),
				function(elm) { elm.style.color = ''; });

		// hilight targets
		[].forEach.call(document.querySelectorAll(Object.keys(upg_map).map(function(i) {
				if(i > UPGRADES.ARMOR_PIERCING_ROUND) {
					return "#nonexistant";
				} else {
					return "#upgr_" + upg_map[i].idx + " .info";
				}
			})
			.join(",")),
		function(elm) { elm.style.setProperty('color', '#E1B21E', 'important'); });
	}

	// do upgrading
	for(var i = 0; i < upg_order.length; i++ ) {
		if(!upg_enabled[i] || upg_order[i] > UPGRADES.ARMOR_PIERCING_ROUND) { continue; }

		// prioritize click upgrades over DPS ones, unless they are more cost effective
		if(upg_order[i] === UPGRADES.AUTO_FIRE_CANNON && enableAutoUpgradeClick) {
			if(upg_map[UPGRADES.AUTO_FIRE_CANNON].cost_per_mult > upg_map[UPGRADES.ARMOR_PIERCING_ROUND].cost_per_mult / 4) { continue; }
		}

		var tree = upg_map[upg_order[i]];

		// upgrade crit/elemental when necessary
		if(upg_order[i] === UPGRADES.ARMOR_PIERCING_ROUND) {
			if(upg_map[UPGRADES.LUCKY_SHOT].cost_per_mult < upg_map[UPGRADES.ARMOR_PIERCING_ROUND].cost_per_mult) {
				tree = upg_map[UPGRADES.LUCKY_SHOT];
			}
			else if(enableAutoUpgradeElemental
					&& upg_map.hasOwnProperty(ELEMENTS.LockedElement+3)
					&& upg_map[ELEMENTS.LockedElement+3].cost_per_mult < upg_map[UPGRADES.ARMOR_PIERCING_ROUND].cost_per_mult) {
				tree = upg_map[ELEMENTS.LockedElement+3];
			}
		}

		var key = 'upgr_' + tree.idx;

		if(getScene().GetUpgradeCost(tree.idx) < pData.gold && cache.hasOwnProperty(key)) {
			var elm = cache[key];
			// valve pls...
			getScene().TryUpgrade(!!elm.find ? elm.find('.link')[0] : elm.querySelector('.link'));
			autoupgrade_update_hilight = true;
		}
	}

}

function refreshPlayerData() {
	advLog("Refreshing player data", 2);

	window.g_Server.GetPlayerData(
		function(rgResult) {
			var instance = getScene();

			if( rgResult.response.player_data ) {
				instance.m_rgPlayerData = rgResult.response.player_data;
				instance.ApplyClientOverrides('player_data');
				instance.ApplyClientOverrides('ability');
				instance.ApplyClientOverrides('upgrades');
			}

			if( rgResult.response.tech_tree ) {
				instance.m_rgPlayerTechTree = rgResult.response.tech_tree;
				if( rgResult.response.tech_tree.upgrades ) {
					instance.m_rgPlayerUpgrades = window.V_ToArray( rgResult.response.tech_tree.upgrades );
				} else {
					instance.m_rgPlayerUpgrades = [];
				}
			}

			instance.OnReceiveUpdate();
		},
		function() {},
		true
	);
}

function makeNumber(name, desc, value, min, max, listener) {
	var label = document.createElement("label");
	var description = document.createTextNode(desc);
	var number = document.createElement("input");

	number.type = "number";
	number.name = name;
	number.value = value;
	number.min = min;
	number.max = max;
	number.onchange = listener;
	window[number.name] = number;

	label.appendChild(number);
	label.appendChild(description);
	label.appendChild(document.createElement("br"));
	return label;
}

function makeDropdown(name, desc, value, values, listener) {
	var label = document.createElement("label");
	var description = document.createTextNode(desc);
	var drop = document.createElement("select");

	for(var k in values) {
		var choice = document.createElement("option");
		choice.value = values[k];
		choice.textContent = k;
		if(values[k] == value) {
			choice.selected = true;
		}
		drop.appendChild(choice);
	}

	drop.name = name;
	drop.style.marginRight = "5px";
	drop.onchange = listener;

	label.appendChild(drop);
	label.appendChild(description);
	label.appendChild(document.createElement("br"));
	return label;
}

function toggleAutoClicker() {
	enableAutoClicker = !enableAutoClicker;

	if (enableAutoClicker) {
		currentClickRate = clickRate;
	} else {
		currentClickRate = 0;
	}
}

function toggleFingering() {
	enableFingering = !enableFingering;

	window.CSceneGame.prototype.ClearNewPlayer = function(){};

	if(!getScene().m_spriteFinger) {
		window.WebStorage.SetLocal('mg_how2click', 0);
		getScene().CheckNewPlayer();
		window.WebStorage.SetLocal('mg_how2click', 1);
	}

	if (enableFingering) {
		getScene().m_containerParticles.addChild(getScene().m_spriteFinger);
	} else {
		getScene().m_containerParticles.removeChild(getScene().m_spriteFinger);
	}
	document.getElementById('newplayer').style.display = 'none';
	
	updateToggle("pointer", enableFingering);
}

function toggleAutoRefresh() {
	enableAutoRefresh = !enableAutoRefresh;

	if(enableAutoRefresh) {
		autoRefreshPage(autoRefreshMinutes);
	} else {
		clearTimeout(refreshTimer);
	}
}

function toggleRenderer() {
	disableRenderer = !disableRenderer;

	var ticker = window.PIXI.ticker.shared;

	if (!disableRenderer) {
		ticker.autoStart = true;
		ticker.start();

		window.g_Minigame.Render = trt_oldRender;
		window.g_Minigame.Render();
	} else {
		ticker.autoStart = false;
		ticker.stop();

		window.g_Minigame.Render = function() {};
	}
	updateToggle("limitFPS", disableRenderer);
}

var oldTvBg = "";
function toggleChen(event) {
	enableChen = !enableChen;
	if (enableChen) {
		oldTvBg = window.$J('.tv_ui').css('background-image');
		window.$J('.tv_ui').css('background-image', 'url(//i.imgur.com/QNSzdlS.png)');
	} else {
		window.$J('.tv_ui').css('background-image', oldTvBg);
	}

	updateToggle("chen", enableChen);
}

function autoRefreshPage(autoRefreshMinutes){
	var timerValue = (autoRefreshMinutes + autoRefreshMinutesRandomDelay * Math.random()) * 60 * 1000;
	refreshTimer = setTimeout(function() {
		autoRefreshHandler();
	}, timerValue);
}

function autoRefreshHandler() {
	// Only skip on % 100 levels when it's been less than the maximum delay specified.

	// TODO: find out what autoRefreshFirstBossDelay is supposed to be defined to. (Var is undefined in script and game?)
	if(lastLevelTimeTaken[1].level % 100 === 0 && autoRefreshDuringBossDelayTotal < autoRefreshFirstBossDelay) {
		advLog('Not refreshing (boss level)', 5);
		autoRefreshDuringBossDelayTotal += autoRefreshFirstBossDelayStep;
		setTimeout(autoRefreshHandler, autoRefreshFirstBossDelayStep);
	} else {
		advLog('Refreshing (not a boss level)', 5);
		window.location.reload(true);
	}
}

function toggleElementLock() {
	enableElementLock = !enableElementLock;

	if(enableElementLock) {
		lockElements();
	} else {
		unlockElements();
	}
	
	updateToggle("elementLock", enableElementLock);
}

function toggleCritText() {
	removeCritText = !removeCritText;

	if (removeCritText) {
		// Replaces the entire crit display function.
		getScene().DoCritEffect = function() {};
	} else {
		getScene().DoCritEffect = trt_oldCrit;
	}
	
	updateToggle("critText", removeCritText);
}

function toggleAllText(event) {
	removeAllText = !removeAllText;

	if (removeAllText) {
		// Replaces the entire text function.
		getScene().m_rgClickNumbers.push = function(elem){
			elem.container.removeChild(elem);
		};
	} else {
		getScene().m_rgClickNumbers.push = trt_oldPush;
	}
	
	if(removeAllText) {
		window.CUI.prototype.UpdateLog = localUpdateLog;
	} else {
		window.CUI.prototype.UpdateLog = originalUpdateLog;
	}
	
	updateToggle("allText", removeAllText);
}

function toggleTrackTroll() {
	enableTrollTrack = !enableTrollTrack;
	
	updateToggle("trollTracker", enableTrollTrack);
}

function setPreference(key, value) {
	try {
		if(localStorage !== 'undefined') {
			localStorage.setItem('steamdb-minigame-wormholers/' + key, value);
		}
	} catch (e) {
		console.log(e); // silently ignore error
	}
}

function getPreference(key, defaultValue) {
	try {
		if(localStorage !== 'undefined') {
			var result = localStorage.getItem('steamdb-minigame-wormholers/' + key);
			return (result !== null ? result : defaultValue);
		}
	} catch (e) {
		console.log(e); // silently ignore error
		return defaultValue;
	}
}

function getPreferenceBoolean(key, defaultValue) {
	return (getPreference(key, defaultValue.toString()) == "true");
}

function unlockElements() {
	var fire = document.querySelector("a.link.element_upgrade_btn[data-type=\"3\"]");
	var water = document.querySelector("a.link.element_upgrade_btn[data-type=\"4\"]");
	var air = document.querySelector("a.link.element_upgrade_btn[data-type=\"5\"]");
	var earth = document.querySelector("a.link.element_upgrade_btn[data-type=\"6\"]");

	var elems = [fire, water, air, earth];

	for (var i=0; i < elems.length; i++) {
		elems[i].style.visibility = "visible";
	}
}

//I'm sorry of the way I name things. This function predicts jumps on a warp boss level, returns the value.
function estimateJumps() {
	var level = getGameLevel();
	var wormholesNow = 0;
	//Gather total wormholes active.
	for (var i = 0; i <= 2; i++) {
		if (typeof window.g_Minigame.m_CurrentScene.m_rgLaneData[i].abilities[26] !== 'undefined') {
			wormholesNow += window.g_Minigame.m_CurrentScene.m_rgLaneData[i].abilities[26];
		}
	}
	//During baws round fc
	if (level % CONTROL.rainingRounds === 0)
	{
		if (predictLastWormholesUpdate !== wormholesNow)
		{
			predictTicks++;
			predictJumps += wormholesNow;
			predictLastWormholesUpdate = wormholesNow;
		}
	}
	else
	{
		predictTicks = 0;
		predictJumps = 0;
		predictLastWormholesUpdate = 0;
		return 0;
	}
	return predictJumps / predictTicks * (getScene().m_rgGameData.timestamp - getScene().m_rgGameData.timestamp_level_start);
}

function lockElements() {
	var elementMultipliers = [
		getScene().m_rgPlayerTechTree.damage_multiplier_fire,
		getScene().m_rgPlayerTechTree.damage_multiplier_water,
		getScene().m_rgPlayerTechTree.damage_multiplier_air,
		getScene().m_rgPlayerTechTree.damage_multiplier_earth
	];

	var elem = (parseInt(window.g_steamID.slice(-3), 10) + parseInt(window.g_GameID, 10)) % 4;

	// If more than two elements are leveled to 3 or higher, do not enable lock
	var leveled = 0;
	var lastLeveled = -1;

	for (var i=0; i < elementMultipliers.length; i++){
		advLog("Element " + i + " is at level " + (elementMultipliers[i]-1)/1.5, 3);
		if ((elementMultipliers[i]-1)/1.5 >= 3) {
			leveled++;
			// Only used if there is only one so overwriting it doesn't matter
			lastLeveled = i;
		}
	}

	if (leveled >= 2) {
		advLog("More than 2 elementals leveled to 3 or above, not locking.", 1);
	} else if (leveled == 1) {
		advLog("Found existing lock on " + lastLeveled + ", locking to it.", 1);
		lockToElement(lastLeveled);
	} else {
		advLog("Locking to element " + elem + " as chosen by SteamID", 1);
		lockToElement(elem);
	}
}

function lockToElement(element) {
	var fire = document.querySelector("a.link.element_upgrade_btn[data-type=\"3\"]");
	var water = document.querySelector("a.link.element_upgrade_btn[data-type=\"4\"]");
	var air = document.querySelector("a.link.element_upgrade_btn[data-type=\"5\"]");
	var earth = document.querySelector("a.link.element_upgrade_btn[data-type=\"6\"]");

	var elems = [fire, water, air, earth];

	for (var i=0; i < elems.length; i++) {
		if (i === element) {
			continue;
		}
		elems[i].style.visibility = "hidden";
	}
	ELEMENTS.LockedElement = element;
}

function displayText(x, y, strText, color) {
	var text = new window.PIXI.Text(strText, {font: "35px 'Press Start 2P'", fill: color, stroke: '#000', strokeThickness: 2 });

	text.x = x;
	text.y = y;

	getScene().m_containerUI.addChild( text );
	text.container = getScene().m_containerUI;

	var e = new window.CEasingSinOut( text.y, -200, 1000 );
	e.parent = text;
	text.m_easeY = e;

	e = new window.CEasingSinOut( 2, -2, 1000 );
	e.parent = text;
	text.m_easeAlpha = e;

	getScene().m_rgClickNumbers.push(text);
}

function updatePlayersInGame() {
	var laneData = getScene().m_rgLaneData;
	var totalPlayers =
		laneData[ 0 ].players +
		laneData[ 1 ].players +
		laneData[ 2 ].players;
	ELEMENTS.PlayersInGame.textContent = totalPlayers + "/1500";
}

function fixActiveCapacityUI() {
	window.$J('.tv_ui').css('background-image', 'url(//i.imgur.com/9R0436k.gif)');
	window.$J('#activeinlanecontainer').css('height', '154px');
	window.$J('#activitycontainer').css('height', '270px');
	window.$J('#activityscroll').css('height', '270px');
}

function goToLaneWithBestTarget(level) {
	// We can overlook spawners if all spawners are 40% hp or higher and a creep is under 10% hp
	var spawnerOKThreshold = 0.4;
	var creepSnagThreshold = 0.1;

	var targetFound = false;
	var lowHP = 0;
	var lowLane = 0;
	var lowTarget = 0;
	var lowPercentageHP = 0;
	var preferredLane = -1;
	var preferredTarget = -1;

	// determine which lane and enemy is the optimal target
	var enemyTypePriority = [
		ENEMY_TYPE.TREASURE,
		ENEMY_TYPE.BOSS,
		ENEMY_TYPE.MINIBOSS,
		ENEMY_TYPE.SPAWNER,
		ENEMY_TYPE.CREEP
	];

	var i;
	var skippingSpawner = false;
	var skippedSpawnerLane = 0;
	var skippedSpawnerTarget = 0;
	var targetIsTreasure = false;
	var targetIsBoss = false;

	for (var k = 0; !targetFound && k < enemyTypePriority.length; k++) {
		targetIsTreasure = (enemyTypePriority[k] == ENEMY_TYPE.TREASURE);
		targetIsBoss = (enemyTypePriority[k] == ENEMY_TYPE.BOSS);

		var enemies = [];

		// gather all the enemies of the specified type.
		for (i = 0; i < 3; i++) {
			for (var j = 0; j < 4; j++) {
				var enemy = getScene().GetEnemy(i, j);
				if (enemy && enemy.m_data.type == enemyTypePriority[k]) {
					enemies[enemies.length] = enemy;
				}
			}
		}

		//Prefer lane with raining gold, unless current enemy target is a treasure or boss.
		if(!targetIsTreasure && !targetIsBoss) {
			var potential = 0;
			// Loop through lanes by elemental preference
			var sortedLanes = sortLanesByElementals();
			for(var notI = 0; notI < sortedLanes.length; notI++) {
				// Maximize compability with upstream
				i = sortedLanes[notI];
				// ignore if lane is empty
				if(getScene().m_rgGameData.lanes[i].dps === 0) {
					continue;
				}
				var stacks = 0;
				if(typeof getScene().m_rgLaneData[i].abilities[ABILITIES.RAINING_GOLD] != 'undefined') {
					stacks = getScene().m_rgLaneData[i].abilities[ABILITIES.RAINING_GOLD];
					advLog('[Gold rain] stacks: ' + stacks, 5);

					for(var m = 0; m < getScene().m_rgEnemies.length; m++){
						if(getScene().m_rgEnemies[m].m_nLane != i){
							continue;
						}
						advLog("[Gold rain] An enemy exists in raining gold lane: " + (i + 1), 5);
						var enemyGold = getScene().m_rgEnemies[m].m_data.gold;
						if(stacks * enemyGold > potential) {
							potential = stacks * enemyGold;
							preferredTarget = getScene().m_rgEnemies[m].m_nID;
							preferredLane = i;
						}
					}
					advLog("[Gold rain] preferredLane: " + preferredLane, 5);
					advLog("[Gold rain] preferredTarget: " + preferredTarget, 5);
				}
			}
		}

		// target the enemy of the specified type with the lowest hp
		var mostHPDone = 0;
		for (i = 0; i < enemies.length; i++) {
			if (enemies[i] && !enemies[i].m_bIsDestroyed) {
				// Only select enemy and lane if the preferedLane matches the potential enemy lane
				if(lowHP < 1 || enemies[i].m_flDisplayedHP < lowHP) {
					var element = getScene().m_rgGameData.lanes[enemies[i].m_nLane].element;

					var dmg = getScene().CalculateDamage(
						getScene().m_rgPlayerTechTree.dps,
						element
						);

					if(mostHPDone <= dmg) {
						mostHPDone = dmg;
					} else {
						continue;
					}

					targetFound = true;
					lowHP = enemies[i].m_flDisplayedHP;
					lowLane = enemies[i].m_nLane;
					lowTarget = enemies[i].m_nID;
				}
				var percentageHP = enemies[i].m_flDisplayedHP / enemies[i].m_data.max_hp;
				if (lowPercentageHP === 0 || percentageHP < lowPercentageHP) {
					lowPercentageHP = percentageHP;
				}
			}
		}

		if(preferredLane != -1 && preferredTarget != -1){
			lowLane = preferredLane;
			lowTarget = preferredTarget;
			advLog('Switching to a lane with best raining gold benefit', 2);
		}

		// If we just finished looking at spawners,
		// AND none of them were below our threshold,
		// remember them and look for low creeps (so don't quit now)
		// Don't skip spawner if lane has raining gold
		if ((enemyTypePriority[k] == ENEMY_TYPE.SPAWNER && lowPercentageHP > spawnerOKThreshold) && preferredLane == -1) {
			skippedSpawnerLane = lowLane;
			skippedSpawnerTarget = lowTarget;
			skippingSpawner = true;
			targetFound = false;
		}

		// If we skipped a spawner and just finished looking at creeps,
		// AND the lowest was above our snag threshold,
		// just go back to the spawner!
		if (skippingSpawner && enemyTypePriority[k] == ENEMY_TYPE.CREEP && lowPercentageHP > creepSnagThreshold ) {
			lowLane = skippedSpawnerLane;
			lowTarget = skippedSpawnerTarget;
		}
	}

	// go to the chosen lane
	if (targetFound) {
		if (getScene().m_nExpectedLane != lowLane) {
			advLog('Switching to lane' + lowLane, 3);
			getScene().TryChangeLane(lowLane);
		}

		// target the chosen enemy
		if (getScene().m_nTarget != lowTarget) {
			advLog('Switching targets', 3);
			getScene().TryChangeTarget(lowTarget);
		}
	}

	var levelRainingMod = level % CONTROL.rainingRounds;

	// Prevent attack abilities and items if up against a boss or treasure minion
	if (targetIsTreasure || (level < CONTROL.speedThreshold || levelRainingMod === 0 || CONTROL.rainingSafeRounds >= (CONTROL.rainingRounds - levelRainingMod))) {
		BOSS_DISABLED_ABILITIES.forEach(disableAbility);
	} else {
		BOSS_DISABLED_ABILITIES.forEach(enableAbility);
	}

	// Disable raining gold for the first levels
	if(level < CONTROL.rainingRounds) {
		disableAbility(ABILITIES.RAINING_GOLD);
	} else {
		enableAbility(ABILITIES.RAINING_GOLD);
	}
}

function hasMaxCriticalOnLane() {
	var goodLuckCharms = getActiveAbilityLaneCount(ABILITIES.GOOD_LUCK_CHARMS);
	var crit = getActiveAbilityLaneCount(ABILITIES.CRIT);
	var totalCritical = goodLuckCharms + crit;

	return totalCritical >= 99;
}

function useAbilities(level)
{

	var currentLane = getScene().m_nExpectedLane;

	var i = 0;
	var enemyCount = 0;
	var enemySpawnerExists = false;
	var enemySpawnerHealthPercent = false;
	var enemy = false;
	var enemyBossHealthPercent = 0;

	// Cripple Monster
	if(canUseAbility(ABILITIES.CRIPPLE_MONSTER)) {
		if (level > CONTROL.speedThreshold && level % CONTROL.rainingRounds !== 0 && level % 10 === 0) {
			enemy = getScene().GetEnemy(getScene().m_rgPlayerData.current_lane, getScene().m_rgPlayerData.target);
			if (enemy && enemy.m_data.type == ENEMY_TYPE.BOSS) {
				enemyBossHealthPercent = enemy.m_flDisplayedHP / enemy.m_data.max_hp;
				if (enemyBossHealthPercent>0.5){
					advLog("Cripple Monster available and used on boss", 2);
					triggerAbility(ABILITIES.CRIPPLE_MONSTER);
				}
			}
		}
	}

	// Medic & Pumped Up
	if (tryUsingAbility(ABILITIES.PUMPED_UP)){
		// Pumped Up is purchased, cooled down, and needed. Trigger it.
		advLog('Pumped up is always good.', 2);
	}
	else
	{
		// check if Medics is purchased and cooled down
		if (tryUsingAbility(ABILITIES.MEDICS)) {
			advLog('BadMedic is purchased, cooled down. Trigger it.', 2);
		}

		if(level > 5000 && tryUsingAbility(ABILITIES.REFLECT_DAMAGE)) {
			advLog('We have reflect damage, cooled down. Trigger it.', 2);
		}
		else if(level > 2500 && tryUsingAbility(ABILITIES.STEAL_HEALTH)) {
			advLog('We have steal health, cooled down. Trigger it.', 2);
		}
		else if (tryUsingAbility(ABILITIES.GOD_MODE)) {
			advLog('We have god mode, cooled down. Trigger it.', 2);
		}

	}

	var levelRainingMod = level % CONTROL.rainingRounds;

	if(levelRainingMod === 0) {
		//advLog('Trying to rain and enable click after a while...', 1);

		tryUsingAbility(ABILITIES.DECREASE_COOLDOWNS, true);
		tryUsingAbility(ABILITIES.RAINING_GOLD);
	}

	// Skip doing any damage x levels before upcoming wormhole round
	if(CONTROL.rainingSafeRounds >= (CONTROL.rainingRounds - levelRainingMod)) {
		tryUsingAbility(ABILITIES.RESURRECTION, true);

		return;
	}

	// Good Luck Charms / Crit
	if(!hasMaxCriticalOnLane())
	{
		//Only use crit if we aren't at cap, since people have reported it goes back to 0
		if(getScene().m_rgPlayerTechTree.crit_percentage <= 99) {
			if (tryUsingAbility(ABILITIES.CRIT)){
				// Crits is purchased, cooled down, and needed. Trigger it.
				advLog('Crit chance is always good.', 3);
			}
		}
	}
	if(!hasMaxCriticalOnLane())
	{
		// check if Good Luck Charms is purchased and cooled down
		if (tryUsingAbility(ABILITIES.GOOD_LUCK_CHARMS)) {
			advLog('Good Luck Charms is purchased, cooled down, and needed. Trigger it.', 2);
		}
	}

	// Cluster Bomb
	if (canUseAbility(ABILITIES.CLUSTER_BOMB)) {
	//Check lane has monsters to explode
		enemyCount = 0;
		enemySpawnerExists = false;
		//Count each slot in lane
		for (i = 0; i < 4; i++) {
			enemy = getScene().GetEnemy(currentLane, i);
			if (enemy) {
				enemyCount++;
				if (enemy.m_data.type === 0) {
					enemySpawnerExists = true;
				}
			}
		}
		//Bombs away if spawner and 2+ other monsters
		if (enemySpawnerExists && enemyCount >= 3) {
			if (!tryUsingAbility(ABILITIES.DECREASE_COOLDOWNS, true)) {
				triggerAbility(ABILITIES.CLUSTER_BOMB);
			}
		}
	}

	// Napalm
	if (canUseAbility(ABILITIES.NAPALM)) {
		//Check lane has monsters to burn
		enemyCount = 0;
		enemySpawnerExists = false;
		//Count each slot in lane
		for (i = 0; i < 4; i++) {
			enemy = getScene().GetEnemy(currentLane, i);
			if (enemy) {
				enemyCount++;
				if (enemy.m_data.type === 0) {
					enemySpawnerExists = true;
				}
			}
		}
		//Burn them all if spawner and 2+ other monsters
		if (enemySpawnerExists && enemyCount >= 3) {
			if (!tryUsingAbility(ABILITIES.DECREASE_COOLDOWNS, true)) {
				triggerAbility(ABILITIES.NAPALM);
			}
		}
	}

	// Morale Booster
	if (canUseAbility(ABILITIES.MORALE_BOOSTER)) {
		var numberOfWorthwhileEnemies = 0;
		for(i = 0; i < getScene().m_rgGameData.lanes[getScene().m_nExpectedLane].enemies.length; i++) {
			//Worthwhile enemy is when an enamy has a current hp value of at least 1,000,000
			if(getScene().m_rgGameData.lanes[getScene().m_nExpectedLane].enemies[i].hp > 1000000) {
				numberOfWorthwhileEnemies++;
			}
		}

		if(numberOfWorthwhileEnemies >= 2) {
			// Moral Booster is purchased, cooled down, and needed. Trigger it.
			advLog('Moral Booster is purchased, cooled down, and needed. Trigger it.', 2);
			triggerAbility(ABILITIES.MORALE_BOOSTER);
		}
	}

	// Tactical Nuke
	if(canUseAbility(ABILITIES.TACTICAL_NUKE) && (level % 100 !== 0) && (level % 100) <= 97) {
		enemy = getScene().GetEnemy(getScene().m_rgPlayerData.current_lane, getScene().m_rgPlayerData.target);
		// check whether current target is a boss
		if (enemy && enemy.m_data.type == ENEMY_TYPE.BOSS) {
			if (level >= CONTROL.speedThreshold) { // Start nuking bosses at level CONTROL.speedThreshold
				enemyBossHealthPercent = enemy.m_flDisplayedHP / enemy.m_data.max_hp;

				// Use Nuke on boss with >= 50% HP but only if Raining Gold is not active in the lane
				if (enemyBossHealthPercent >= 0.5 && getActiveAbilityLaneCount(ABILITIES.RAINING_GOLD) <= 0) {
					if (!tryUsingAbility(ABILITIES.DECREASE_COOLDOWNS, true)) {
						advLog("Tactical Nuke is purchased, cooled down, and needed. Nuke 'em.", 2);
						triggerAbility(ABILITIES.TACTICAL_NUKE);
					}
				}
			}
		}
		else {
			//Check that the lane has a spawner and record it's health percentage
			//Count each slot in lane
			for (i = 0; i < 4; i++) {
				enemy = getScene().GetEnemy(currentLane, i);
				if (enemy && enemy.m_data.type == ENEMY_TYPE.SPAWNER) {
					enemySpawnerHealthPercent = enemy.m_flDisplayedHP / enemy.m_data.max_hp;
					// If there is a spawner and it's health is between 60% and 30%, nuke it!
					if (enemySpawnerHealthPercent < 0.6 && enemySpawnerHealthPercent > 0.3) {
						if (!tryUsingAbility(ABILITIES.DECREASE_COOLDOWNS, true)) {
							advLog("Tactical Nuke is purchased, cooled down, and needed. Nuke 'em.", 2);
							triggerAbility(ABILITIES.TACTICAL_NUKE);
						}
					}
					break; // No reason to continue the loop after finding a spawner
				}
			}
		}
	}

	// Cripple Spawner
	if(canUseAbility(ABILITIES.CRIPPLE_SPAWNER)) {
		//Check that the lane has a spawner and record it's health percentage
		enemySpawnerExists = false;
		enemySpawnerHealthPercent = 0.0;
		//Count each slot in lane
		for (i = 0; i < 4; i++) {
			enemy = getScene().GetEnemy(currentLane, i);
			if (enemy) {
				if (enemy.m_data.type === 0) {
					enemySpawnerExists = true;
					enemySpawnerHealthPercent = enemy.m_flDisplayedHP / enemy.m_data.max_hp;
				}
			}
		}

		// If there is a spawner and it's health is above 95%, cripple it!
		if (enemySpawnerExists && enemySpawnerHealthPercent > 0.95) {
			advLog("Cripple Spawner available, and needed. Cripple 'em.", 2);
			triggerAbility(ABILITIES.CRIPPLE_SPAWNER);
		}
	}

	// Gold Rain
	if (canUseAbility(ABILITIES.RAINING_GOLD)) {
		// only use if the speed threshold has not been reached,
		// or it's a designated gold round after the threshold
		if (level > CONTROL.disableGoldRainLevels && (level < CONTROL.speedThreshold || level % CONTROL.rainingRounds === 0)) {
			enemy = getScene().GetEnemy(getScene().m_rgPlayerData.current_lane, getScene().m_rgPlayerData.target);
			// check if current target is a boss, otherwise its not worth using the gold rain
			if (enemy && enemy.m_data.type == ENEMY_TYPE.BOSS) {
				enemyBossHealthPercent = enemy.m_flDisplayedHP / enemy.m_data.max_hp;

				if (enemyBossHealthPercent >= 0.6 || level % CONTROL.rainingRounds === 0) { // We want sufficient time for the gold rain to be applicable
					// Gold Rain is purchased, cooled down, and needed. Trigger it.
					advLog('Gold rain is purchased and cooled down, Triggering it on boss', 2);
					triggerAbility(ABILITIES.RAINING_GOLD);
				}
			}
		}
	}

	// Metal Detector
	if(canUseAbility(ABILITIES.METAL_DETECTOR)) {

		enemy = getScene().GetEnemy(getScene().m_rgPlayerData.current_lane, getScene().m_rgPlayerData.target);
		// check if current target is a boss, otherwise we won't use metal detector
		if (enemy && enemy.m_data.type == ENEMY_TYPE.BOSS) {
			enemyBossHealthPercent = enemy.m_flDisplayedHP / enemy.m_data.max_hp;

			// we want to use metal detector at 25% hp, or even less
			if (enemyBossHealthPercent <= 0.25) { // We want sufficient time for the metal detector to be applicable
				// Metal Detector is purchased, cooled down, and needed. Trigger it.
				advLog('Metal Detector is purchased and cooled down, Triggering it on boss', 2);
				triggerAbility(ABILITIES.METAL_DETECTOR);
			}
		}
	}

	// Treasure
	if (canUseAbility(ABILITIES.TREASURE)) {

		// check if current level is higher than 50
		if (level > 50) {
			enemy = getScene().GetTargetedEnemy();
			// check if current target is a boss, otherwise we won't use metal detector
			if (enemy && enemy.type == ENEMY_TYPE.BOSS) {
				enemyBossHealthPercent = enemy.hp / enemy.max_hp;

				// we want to use Treasure at 25% hp, or even less
				if (enemyBossHealthPercent <= 0.25) { // We want sufficient time for the metal detector to be applicable
					// Treasure is purchased, cooled down, and needed. Trigger it.
					advLog('Treasure is purchased and cooled down, triggering it.', 2);
					triggerAbility(ABILITIES.TREASURE);
				}
			}
		}
		else {
			// Treasure is purchased, cooled down, and needed. Trigger it.
			advLog('Treasure is purchased and cooled down, triggering it.', 2);
			triggerAbility(ABILITIES.TREASURE);
		}
	}

	// Max Elemental
	if (tryUsingAbility(ABILITIES.MAX_ELEMENTAL_DAMAGE, true)) {
		// Max Elemental Damage is purchased, cooled down, and needed. Trigger it.
		advLog('Max Elemental Damage is purchased and cooled down, triggering it.', 2);
	}

	// Resurrect
	if(level % 10 === 9 && tryUsingAbility(ABILITIES.RESURRECTION)) {
		// Resurrect is purchased and we are using it.
		advLog('Triggered Resurrect.');
	}
}

function attemptRespawn() {
	if ((getScene().m_bIsDead) && ((getScene().m_rgPlayerData.time_died) + 5) < (getScene().m_nTime)) {
		window.RespawnPlayer();
	}
}

function bHaveItem(itemId) {
	var items = getScene().m_rgPlayerTechTree.ability_items;

	for(var i = 0; i < items.length; ++i) {
		if(items[i].ability == itemId) {
			return true;
		}
	}

	return false;
}

function canUseAbility(abilityId, forceAbility) {
	if(!getScene().bHaveAbility(abilityId) && !bHaveItem(abilityId)) {
		return false;
	}

	return getScene().GetCooldownForAbility(abilityId) <= 0 && (isAbilityEnabled(abilityId) || forceAbility);
}

function tryUsingAbility(itemId, checkInLane, forceAbility) {
	if (!canUseAbility(itemId, forceAbility)) {
		return false;
	}

	if (checkInLane && getActiveAbilityTimeout(itemId) >= getCurrentTime()) {
		return false;
	}

	var level = getGameLevel();
	var needs_to_be_blocked = false;
	var two_digit_level = level % 100;

	needs_to_be_blocked = (BOSS_DISABLED_ABILITIES.indexOf(itemId) != -1);

	// must not use any damaging ability on boss levels
	if (two_digit_level === 0 && needs_to_be_blocked) {
		return false;

	// Randomly Don't use this ability when we're getting close to the boss
	// This avoids overflow damage 
	} else if (two_digit_level > 50 && needs_to_be_blocked) {
		// Calculate current ability usage rate
		var nextTickLevel = Math.ceil(level + levelsPerSec());
		var nextWHLevel = Math.ceil(nextTickLevel / 100)*100;
		var abilityRate = Math.min( 1, Math.sqrt( nextWHLevel - nextTickLevel )/10 + minAbilityUsePercent );

		if( Math.random() < (1 - abilityRate) ) {
			advLog('Rate limited ability - not using');
			return false;
		}
	}
	
	triggerAbility(itemId);
	
	return true;
}

function triggerAbility(abilityId) {
	if (abilityId === ABILITIES.WORMHOLE) {
		// Fire this bad boy off immediately 
		window.g_Server.UseAbilities(window.$J.noop, window.$J.noop, {requested_abilities: [{ability: ABILITIES.WORMHOLE}]});
	} else {
		getScene().m_rgAbilityQueue.push({'ability': abilityId});
	}

	var nCooldownDuration = getScene().m_rgTuningData.abilities[abilityId].cooldown;
	getScene().ClientOverride('ability', abilityId, Math.floor(Date.now() / 1000) + nCooldownDuration);
	getScene().ApplyClientOverrides('ability', true);
}

function toggleAbility(abilityId, show) {

	var elem = window.$J("#ability_" + abilityId);

	// temporary
	if(elem && elem.length === 0) {
		elem = window.$J("#abilityitem_" + abilityId);
	}

	if (elem) {
		if(show) {
			elem.find(".abilityDisabledIndicator").addClass('hidden');
			elem.unbind('click');
			elem.click(function(e) { window.g_Minigame.CurrentScene().TryAbility(abilityId); return false; });
		}
		else {
			elem.find(".abilityDisabledIndicator").removeClass('hidden');
			elem.prop("onclick", null);
			elem.unbind('click');
			elem.click(function(e) { e.stopPropagation(); return false; });
		}
	}
}

function disableAbility(abilityId) {
	toggleAbility(abilityId, false);
}

function enableAbility(abilityId) {
	toggleAbility(abilityId, true);
}

function isAbilityEnabled(abilityId) {
	var elem = document.getElementById('ability_' + abilityId);

	// temporary
	if(!elem) {
		elem = document.getElementById('abilityitem_' + abilityId);
	}

	if (elem && elem.childElements() && elem.childElements().length >= 1) {
		return elem.childElements()[0].style.visibility !== "hidden";
	}
	return false;
}

function getActiveAbilityTimeout(ability) {
  var timeout = 0;
	var abilities = getScene().m_rgGameData.lanes[getScene().m_rgPlayerData.current_lane].active_player_abilities;
	var count = 0;
	for(var i = 0; i < abilities.length; i++) {
		if(abilities[i].ability == ability && abilities[i].timestamp_done > timeout) {
			timeout = abilities[i].timestamp_done;
		}
	}
	return timeout;
}

function getActiveAbilityLaneCount(ability) {
	var now = getCurrentTime();
	var abilities = getScene().m_rgGameData.lanes[getScene().m_rgPlayerData.current_lane].active_player_abilities;
	var count = 0;
	for(var i = 0; i < abilities.length; i++) {
		if(abilities[i].ability == ability && abilities[i].timestamp_done > now) {
			count++;
		}
	}
	return count;
}

function sortLanesByElementals() {
	var elementPriorities = [
	getScene().m_rgPlayerTechTree.damage_multiplier_fire,
	getScene().m_rgPlayerTechTree.damage_multiplier_water,
	getScene().m_rgPlayerTechTree.damage_multiplier_air,
	getScene().m_rgPlayerTechTree.damage_multiplier_earth
	];

	var lanes = getScene().m_rgGameData.lanes;
	var lanePointers = [];

	for (var i = 0; i < lanes.length; i++) {
		lanePointers[i] = i;
	}

	lanePointers.sort(function(a, b) {
		return elementPriorities[lanes[b].element - 1] - elementPriorities[lanes[a].element - 1];
	});

	advLog("Lane IDs  : " + lanePointers[0] + " " + lanePointers[1] + " " + lanePointers[2], 4);
	advLog("Elements  : " + lanes[lanePointers[0]].element + " " + lanes[lanePointers[1]].element + " " + lanes[lanePointers[2]].element, 4);

	return lanePointers;
}

function getCurrentTime() {
	return getScene().m_rgGameData.timestamp;
}

function advLog(msg, lvl) {
	if (lvl <= logLevel) {
		console.log(msg);
	}
}

if(window.SteamDB_Minigame_Timer) {
	window.clearInterval(window.SteamDB_Minigame_Timer);
}

window.SteamDB_Minigame_Timer = window.setInterval(function(){
	if (window.g_Minigame
		&& getScene().m_bRunning
		&& getScene().m_rgPlayerTechTree
		&& getScene().m_rgGameData) {
		window.clearInterval(window.SteamDB_Minigame_Timer);
	firstRun();
	window.SteamDB_Minigame_Timer = window.setInterval(MainLoop, 1000);
}
}, 1000);

// reload page if game isn't fully loaded, regardless of autoRefresh setting
window.setTimeout(function() {
	// m_rgGameData is 'undefined' if stuck at 97/97 or below
	if (!window.g_Minigame
		|| !window.g_Minigame.m_CurrentScene
		|| !window.g_Minigame.m_CurrentScene.m_rgGameData) {
		window.location.reload(true);
}
}, autoRefreshSecondsCheckLoadedDelay * 1000);

appendBreadcrumbsTitleInfo();

function enhanceTooltips() {
	var trt_oldTooltip = window.fnTooltipUpgradeDesc;

	window.fnTooltipUpgradeDesc = function(context){
		var $context = window.$J(context);
		var desc = $context.data('desc');
		var strOut = desc;
		var multiplier = parseFloat( $context.data('multiplier') );
		switch( $context.data('upgrade_type') ) {
			case 2: // Type for click damage. All tiers.
			strOut = trt_oldTooltip(context);
			var currentCritMultiplier = getScene().m_rgPlayerTechTree.damage_multiplier_crit;
			var currentCrit = getScene().m_rgPlayerTechTree.damage_per_click * currentCritMultiplier;
			var newCrit = getScene().m_rgTuningData.player.damage_per_click * (getScene().m_rgPlayerTechTree.damage_per_click_multiplier + multiplier) * currentCritMultiplier;
			strOut += '<br><br>Crit Click: ' + window.FormatNumberForDisplay( currentCrit ) + ' => ' + window.FormatNumberForDisplay( newCrit );
			break;
			case 7: // Lucky Shot's type.
			var currentMultiplier = getScene().m_rgPlayerTechTree.damage_multiplier_crit;
			var newMultiplier = currentMultiplier + multiplier;
			var dps = getScene().m_rgPlayerTechTree.dps;
			var clickDamage = getScene().m_rgPlayerTechTree.damage_per_click;

			strOut += '<br><br>You can have multiple crits in a second. The server combines them into one.';

			strOut += '<br><br>Crit Percentage: ' + (getScene().m_rgPlayerTechTree.crit_percentage * 100).toFixed(1) + '%';

			strOut += '<br><br>Critical Damage Multiplier:';
			strOut += '<br>Current: ' + ( currentMultiplier ) + 'x';
			strOut += '<br>Next Level: ' + ( newMultiplier ) + 'x';

			strOut += '<br><br>Damage with one crit:';
			strOut += '<br>DPS: ' + window.FormatNumberForDisplay( currentMultiplier * dps ) + ' => ' + window.FormatNumberForDisplay( newMultiplier * dps );
			strOut += '<br>Click: ' + window.FormatNumberForDisplay( currentMultiplier * clickDamage ) + ' => ' + window.FormatNumberForDisplay( newMultiplier * clickDamage );
			strOut += '<br><br>Base Increased By: ' + window.FormatNumberForDisplay(multiplier) + 'x';
			break;
			case 9: // Boss Loot Drop's type
			var bossLootChance = getScene().m_rgPlayerTechTree.boss_loot_drop_percentage * 100;

			strOut += '<br><br>Boss Loot Drop Rate:';
			strOut += '<br>Current: ' + bossLootChance.toFixed(0) + '%';
			strOut += '<br>Next Level: ' + (bossLootChance + multiplier * 100).toFixed(0) + '%';
			strOut += '<br><br>Base Increased By: ' + window.FormatNumberForDisplay(multiplier * 100) + '%';
			break;
			default:
			return trt_oldTooltip(context);
		}

		return strOut;
	};

	var trt_oldElemTooltip = window.fnTooltipUpgradeElementDesc;
	window.fnTooltipUpgradeElementDesc = function (context) {
		var strOut = trt_oldElemTooltip(context);

		var $context = window.$J(context);
		//var upgrades = getScene().m_rgTuningData.upgrades.slice(0);
		// Element Upgrade index 3 to 6
		var idx = $context.data('type');
		// Is the current tooltip for the recommended element?
		var isRecommendedElement = (ELEMENTS.LockedElement == idx - 3);

		if (isRecommendedElement){
			strOut += "<br><br>This is your recommended element. Please upgrade this.";

			if (window.enableElementLock){
				strOut += "<br><br>Other elements are LOCKED to prevent accidentally upgrading.";
			}

		} else if (-1 != ELEMENTS.LockedElement) {
			strOut += "<br><br>This is NOT your recommended element. DO NOT upgrade this.";
		}

		return strOut;
	};
}

function getGameLevel() {
	return getScene().m_rgGameData.level + 1;
}

function countdown(time) {
	var hours = 0;
	var minutes = 0;
	for (var i = 0; i < 24; i++) {
		if (time >= 3600) {
			time = time - 3600;
			hours = hours + 1;
		}
	}
	for (var j = 0; j < 60; j++) {
		if (time >= 60) {
			time = time - 60;
			minutes = minutes + 1;
		}
	}
	return {hours : hours, minutes : minutes};
}

function expectedLevel(level) {
	var time = Math.floor(getScene().m_nTime) % 86400;
	time = time - 16*3600;
	if (time < 0) {
		time = time + 86400;
	}

	var remaining_time = 86400 - time;
	var passed_time = getCurrentTime() - getScene().m_rgGameData.timestamp_game_start;
	var expected_level = Math.floor(((level/passed_time)*remaining_time)+level);
	var likely_level = Math.floor((expected_level - level)/Math.log(3))+ level;

	return {expected_level : expected_level, likely_level : likely_level, remaining_time : remaining_time};
}

function appendBreadcrumbsTitleInfo() {
	var breadcrumbs = document.querySelector('.breadcrumbs');

	if(!breadcrumbs) {
		return;
	}

	var element = document.createElement('span');
	element.textContent = ' > ';
	breadcrumbs.appendChild(element);

	element = document.createElement('span');
	element.className = "bc_span bc_room";
	element.textContent = 'Room ' + window.g_GameID;
	breadcrumbs.appendChild(element);

	element = document.createElement('span');
	element.textContent = ' > ';
	breadcrumbs.appendChild(element);

	element = document.createElement('span');
	element.className = "bc_span bc_level";
	element.textContent = 'Level: 0';
	breadcrumbs.appendChild(element);
	ELEMENTS.ExpectedLevel = element;

	element = document.createElement('span');
	element.textContent = ' > ';
	breadcrumbs.appendChild(element);

	element = document.createElement('span');
	element.className = "bc_span bc_time";
	element.textContent = 'Remaining Time: 0 hours, 0 minutes';
	breadcrumbs.appendChild(element);
	ELEMENTS.RemainingTime = element;
	
	element = document.createElement('span');
	element.textContent = ' > ';
	breadcrumbs.appendChild(element);

	element = document.createElement('span');
	element.className = "bc_span bc_worms";
	element.textContent = 'Wormhole Activity: 0';
	breadcrumbs.appendChild(element);
	ELEMENTS.WormholesJumped = element;
	
	if (typeof GM_info != 'undefined') {
		element = document.createElement('span');
		element.style.cssFloat = 'right';
		element.style.color = '#D4E157';
		element.style.textShadow = '1px 1px 0px rgba( 0, 0, 0, 0.3 )';
		element.innerHTML = '<a target="_blank"  href="' + GM_info.script.namespace + '">' + GM_info.script.name + ' v' + GM_info.script.version + '</a>';
		breadcrumbs.appendChild(element);
	}
}

// TODO: Comment this code even though nobody is looking. It literally looks like "trash".

function subLong(x, y) {
    var addLong = function(x, y) {
        var s = '';
        if (y.length > x.length) {
            s = x;
            x = y;
            y = s;
        }
        s = (parseInt(x.slice(-9),10) + parseInt(y.slice(-9),10)).toString();
        x = x.slice(0,-9); 
        y = y.slice(0,-9);
        if (s.length > 9) {
            if (x === '') {
            	return s;
            }
            x = addLong(x, '1');
            s = s.slice(1);
        } else if (x.length) { while (s.length < 9) { s = '0' + s; } }
        if (y === '') {
        	return x + s;
        }
        return addLong(x, y) + s; 
    };
	
    var s;
    s = (parseInt('1'+x.slice(-9),10) - parseInt(y.slice(-9),10)).toString(); 
    x = x.slice(0,-9);
    y = y.slice(0,-9);
    if (s.length === 10 || x === '') {
        s = s.slice(1);
    } else { 
        if (y.length) { y = addLong(y, '1'); } 
        else { y = '1';}
        if (x.length) { while (s.length < 9) { s = '0' + s; }}
    }
    if (y === '') { 
        s = (x + s).replace(/^0+/,'');
        return s;
    }
    return subLong(x, y) + s;
}

function getAccountId(id) {
    return parseInt(subLong(''+id, '76561197960265728'));
}

function getUserName() {
	if (window.g_Minigame.m_CurrentScene.m_rgPlayerNameCache) {
		return window.g_Minigame.m_CurrentScene.m_rgPlayerNameCache[getAccountId(window.g_steamID)];
	}
	return "Unknown";
}

function addIRC() {
	//Add in IRC link
	window.$J("#info_block").append('<div id="irc_join">Join IRC channel</div>');
	
	window.$J("#irc_join").css({
		"width": "232px",
		"line-height": "30px",
		"height": "30px",
		"position": "relative",
		"top": "-50px",
		"left": "0px",
		"margin": "auto",
		"text-align": "center",
		"z-index": "12",
		"cursor": "pointer",
		"border-radius": "5px",
		"border": "2px solid white"
	});
	
	window.$J("#irc_join").click(function(e) {
		e.stopPropagation();
		window.open('https://webchat.quakenet.org/?nick=' + getUserName() + '&channels=YeOldeWH','_blank'); // Cant seem to find a local storing in js of the players username, so lets just take it from the dropdown
	});
}

function updateLevelInfoTitle(level)
{
	var exp_lvl = expectedLevel(level);
	var rem_time = countdown(exp_lvl.remaining_time);

	ELEMENTS.ExpectedLevel.textContent = 'Level: ' + level + ', Levels/second: ' + levelsPerSec() + ', YOWHers: ' + (approxYOWHClients > 0 ? approxYOWHClients : '??');
	ELEMENTS.RemainingTime.textContent = 'Remaining Time: ' + rem_time.hours + ' hours, ' + rem_time.minutes + ' minutes';
	ELEMENTS.WormholesJumped.textContent = 'Wormhole Activity: ' + (skipsLastJump.toLocaleString ? skipsLastJump.toLocaleString() : skipsLastJump);
}

function abilityCooldown(abilityID) {
	return window.g_Minigame.CurrentScene().GetCooldownForAbility(abilityID);
}

function abilityIsUnlocked(abilityID) {
	if (abilityID <= ABILITIES.NAPALM) {
		return ((1 << abilityID) & window.g_Minigame.CurrentScene().m_rgPlayerTechTree.unlocked_abilities_bitfield) > 0;
	}
	else {
		return getAbilityItemQuantity(abilityID) > 0;
	}
}

// thanks to /u/mouseasw for the base code: https://github.com/mouseas/steamSummerMinigame/blob/master/autoPlay.js
function hasAbility(abilityID) {
	// each bit in unlocked_abilities_bitfield corresponds to an ability.
	// the above condition checks if the ability's bit is set or cleared. I.e. it checks if
	// the player has purchased the specified ability.
	return abilityIsUnlocked(abilityID) && abilityCooldown(abilityID) <= 0;
}

function getAbilityItemQuantity(abilityID) {
	for (var i = 0; i < window.g_Minigame.CurrentScene().m_rgPlayerTechTree.ability_items.length; ++i) {
		var abilityItem = window.g_Minigame.CurrentScene().m_rgPlayerTechTree.ability_items[i];

		if (abilityItem.ability == abilityID) {
			return abilityItem.quantity;
		}
	}

	return 0;
}

}(window));
