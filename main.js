var gamesListOffset = 13000;
var totalNumberOfGames;
var randomGameSet;
var randomGameCategories;

var callsStarted = 0;
var callsFinished = 0;

var vm;

var worldRecordObj = {
  gameID: null,
  gameTitle: null,
  categoryID: null,
  categoryName: null,
  primaryTimingMethod: null,
  runTime: null,
  date: null,
  videoType: null,
  videoID: null,
  players: [],
  weblink: null
};

/*
speedrun.com's API doesn't have anything to simply get the total number of games,
so instead I make an API call to get 1,000 games with a large offset to find the end of results.
I then add the number of results made with a large offset to the offset to find the total number of games.
*/
function getTotalNumberOfGames() {
  callsStarted++;

  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset=' + gamesListOffset, true)

  xhr.onload = function() {
    var response = JSON.parse(this.responseText);

    /*
    If the size of the response is equal to 1,000 then we need to run this function again in order
    to ensure that we are finding the total number of games accurately.

    If not then we have the total number and we can proceed.
    */
    if(response.pagination.size === 1000) {
      gamesListOffset += 1000;
      getTotalNumberOfGames();
    } else {
      totalNumberOfGames = gamesListOffset + response.pagination.size;
    }

    /*
    Now that we have the total number of games we are ready to start
    finding random games. From here we will check to see if the page has
    a fragment identifier. If so, instead of finding a random game we will
    query SRcom to find the information for that category. If not, we will
    find a random game and record.
    */
    if(window.location.hash) {
      // Query SRcom for a specific category
      decodeURIHash(window.location.hash)
      getRecordFromFragment(worldRecordObj.categoryID, worldRecordObj.gameID, worldRecordObj.gameTitle);
    } else {
      // Find a random game
      findRandomGameSet();
    }

    callsFinished++;
  }

  xhr.send(null);
}

// This function is the starting point for finding a random game and category.
function findRandomGameSet() {
  /*
  Generate a random number between 0 and the total number of games less 19.
  -20 since that is the smallest number of games we can query SRcom for, and +1
  to make the random number inclusive at its upper bounds.

  Querying for many games also allows us to select a new game in the event that
  the one we initially select isn't fit for viewing, saving us an API call.
  */
  var randomOffset = Math.floor((Math.random() * (totalNumberOfGames - 19)));

  // Query SRcom to find 20 games at the offset generated.
  callsStarted++;
  var xhr = new XMLHttpRequest();

  xhr.open('GET', 'https://www.speedrun.com/api/v1/games?offset=' + randomOffset, true);
  xhr.onload = function() {
    randomGameSet = JSON.parse(this.responseText).data;
    getRandomGameFromSet();

    callsFinished++;
  }

  xhr.send(null);
}

/*
At this point we need to pick a random game from within randomGameSet and lookup
it's information. We will generate a random index within the range of randomGameSet,
store the chosen game's ID and Title (to save API calls later) and remove the entry
from the randomGameSet array.

We remove the entry from the array so that if the game isn't suitable we can easily
choose a different game without needing to find the index of the original game.
*/
function getRandomGameFromSet() {
  var randomIndex = Math.floor((Math.random() * randomGameSet.length));
  var randomGame = randomGameSet[randomIndex];

  worldRecordObj.gameID = randomGame.id;
  worldRecordObj.gameTitle = (randomGame.names.international) ? randomGame.names.international : randomGame.names.japanese;

  randomGameSet.splice(randomIndex, 1);

  getRandomGameRecords(worldRecordObj.gameID);
}

/*
Now that we've gotten a random game we can grab the various world records for that
game and see if they are suitable for viewing. The API call we make within this function
will only retrieve the top 1 place, only full-game runs (excludes ILs), include misc.
categories and will not retrieve empty categories. This will significantly reduce the amount
of filtering we will have to do to find a suitable run after the API call is made.

After we make the API call we will choose a category at random and check to see if it is
suitable for viewing. A category should have video proof that is hosted on either Twitch
or YouTube.

This random selection process will be similar to that which we randomly selected a game in
the previous step. We will select a category, store it, and then remove it from the results
array. If the category fits our critera then we have found a run to display. At that point
we can make API calls to fetch the data we need for display, store the relevant data,
clear the other stored categories, and clear the other stored games to save on space.
*/
function getRandomGameRecords(gameID) {
  //Begin by querying SRcom for the game's records using the gameID we've stored.
  callsStarted++;
  var xhr = new XMLHttpRequest();

  xhr.open('GET', 'https://www.speedrun.com/api/v1/games/' + gameID + '/records?top=1&scope=full-game&skip-empty=true', true);
  xhr.onload = function() {
    randomGameCategories = JSON.parse(this.responseText).data;

    getRandomCategoryFromSet();

    callsFinished++;
  }

  xhr.send(null);
}


function getRandomCategoryFromSet() {
  // If there are no more categories in the set, select a different game
  if(!randomGameCategories.length) {
    getRandomGameFromSet();
  } else {
    // Generate a random number between 0 and the length of randomGameCategories
    var randomIndex = Math.floor((Math.random() * randomGameCategories.length));

    // Store the element at the index we just generated
    var randomCategoryRecord = randomGameCategories[randomIndex].runs[0].run;

    // Remove the selected element from the original set
    randomGameCategories.splice(randomIndex, 1);

    /*
    Use RegExp to ensure that the video proof for the run is hosted on either YouTube or Twitch.
    If the proof URL is not valid (or there is no video proof) a new record will be chosen.
    */
    if(/\/v(?:ideos)?\/([^&]+)|(?:v=|\.be\/)([^&]+)/.test(randomCategoryRecord.videos.links[0].uri)) {
      /*
      At this point the run can be deemed worthy to show to the user. Any relevant data should be
      added to worldRecordObj and subsequent API calls can be made in order to fetch the rest of the
      necessary data.

      After the API calls are initiated we can clear the other categories and games since we have our result.
      */
      saveRecordInfo(randomCategoryRecord);

      randomGameSet = [];
      randomGameCategories = [];

      /*
      At this point additional API calls need to be made in order to gather the few pieces of
      information that we still need. This includes the category name, the platform name, and the
      weblink to the category's leaderboards on SRcom.

      Since these are the last API calls we need to make to gather all of the information we need
      we will perform a check at the end of each of these two calls to see when all calls have been finished.
      At that point we will know that we have everything we need and there are no more lingering API calls
      and that we can update the run data to the user's screen.
      */
      getCategoryInfo(worldRecordObj.categoryID);

      for(var i = 0; i < worldRecordObj.players.length; i++) {
        getPlayerInfo(worldRecordObj.players[i].uri, i);
      }
    } else {
      /*
      At this point we can be sure that this run isn't suitable. Here we will choose a different category
      from the stored set (if there are any). If there are no more records from the selected game, a new
      game will be selected and the process will begin anew.
      */
      getRandomCategoryFromSet();
    }
  }
}

/*
This function will take a category ID and will make an API call to SRcom to get information
about the category. That information will then be stored inside worldRecordObj.
*/
function getCategoryInfo(categoryID) {
  callsStarted++;
  var xhr = new XMLHttpRequest();

  xhr.open('GET', 'https://www.speedrun.com/api/v1/categories/' + categoryID, true);
  xhr.onload = function() {
    categoryInfo = JSON.parse(this.responseText).data;

    // Store the necessary information inside worldRecordObj
    worldRecordObj.categoryName = categoryInfo.name;
    worldRecordObj.weblink = categoryInfo.weblink;

    callsFinished++;

    if(callsStarted === callsFinished) {
      vm.updateInfo();
    }
  }

  xhr.send(null);
}

/*
This function will take a platform ID and will make an API call to SRcom to get the platform's
name, which will then be stored inside worldRecordObj.

This function is currently not in use.
*/
function getPlatformName(platformID) {
  callsStarted++;
  var xhr = new XMLHttpRequest();

  xhr.open('GET', 'https://www.speedrun.com/api/v1/platforms/' + platformID, true);
  xhr.onload = function() {
    platformInfo = JSON.parse(this.responseText).data;

    // Store the platform's name inside worldRecordObj
    worldRecordObj.platformName = platformInfo.name;
    callsFinished++;
  }

  xhr.send(null);
}

/*
This function will take a playerURI and the player object's index within worldRecordObj and
will make an API call to SRcom to retrieve relevant information about the player,
which will then be stored inside worldRecordObj.
*/
function getPlayerInfo(playerURI, playerObjIndex) {
  callsStarted++;
  var xhr = new XMLHttpRequest();

  xhr.open('GET', playerURI, true);
  xhr.onload = function() {
    playerInfo = JSON.parse(this.responseText).data;

    worldRecordObj.players[playerObjIndex].weblink = (playerInfo.weblink) ? playerInfo.weblink: null;
    worldRecordObj.players[playerObjIndex].name = (playerInfo.weblink) ? worldRecordObj.players[playerObjIndex].weblink.match(/([^/]*)$/)[0] : playerInfo.name;
    worldRecordObj.players[playerObjIndex].twitch = (playerInfo.twitch) ? playerInfo.twitch.uri : null;
    worldRecordObj.players[playerObjIndex].youtube = (playerInfo.youtube) ? playerInfo.youtube.uri : null;
    worldRecordObj.players[playerObjIndex].twitter = (playerInfo.twitter) ? playerInfo.twitter.uri : null;

    callsFinished++;

    if(callsStarted === callsFinished) {
      vm.updateInfo();
    }
  }

  xhr.send(null);
}

/*
This function clears all information from worldRecordObj so that a new game can be retrieved with no
data lingering from previous calls.
*/
function clearWRObj() {
  worldRecordObj.gameID = null;
  worldRecordObj.gameTitle = null;
  worldRecordObj.categoryID = null;
  worldRecordObj.categoryName = null;
  worldRecordObj.primaryTimingMethod = null;
  worldRecordObj.runTime = null;
  worldRecordObj.date = null;
  worldRecordObj.videoType = null;
  worldRecordObj.videoID = null;
  worldRecordObj.players = [];
  worldRecordObj.weblink = null;
}

/*
This function takes a categoryID and a gameTitle and retrieves that category's WR information.
This can be used when loading the page with a resultant URL from a previous visit or when debugging.
*/
function getRecordFromFragment(categoryID, gameID, gameTitle) {
  clearWRObj();

  worldRecordObj.gameTitle = gameTitle;
  worldRecordObj.gameID = gameID;

  getRecordInfoFromCategoryID(categoryID);
  getCategoryInfoFromCategoryID(categoryID);
}

/*
This function takes a categoryID and retrieves information about that category's record run. When the
call is finished the relevant information will be saved in worldRecordObj.
*/
function getRecordInfoFromCategoryID(categoryID) {
  var xhr = new XMLHttpRequest();

  xhr.open('GET', 'https://www.speedrun.com/api/v1/categories/' + categoryID + '/records?top=1', true);
  xhr.onload = function() {
    saveRecordInfo(JSON.parse(this.responseText).data[0].runs[0].run);

    // Retrieve the players' info
    for(var i = 0; i < worldRecordObj.players.length; i++) {
      getPlayerInfo(worldRecordObj.players[i].uri, i);
    }
  }

  xhr.send(null);
}

//This function takes a categoryID and retrieves the category's name and it's weblink.
function getCategoryInfoFromCategoryID(categoryID) {
  var xhr = new XMLHttpRequest();

  xhr.open('GET', 'https://www.speedrun.com/api/v1/categories/' + categoryID, true);
  xhr.onload = function() {
    var response = JSON.parse(this.responseText).data;

    worldRecordObj.categoryName = response.name;
    worldRecordObj.weblink = response.weblink;
  }

  xhr.send(null);
}

/*
This function takes an API response in the form of a record run and saves all of it's relevant information
within worldRecordObj.
*/
function saveRecordInfo(record) {
  worldRecordObj.categoryID = record.category;
  worldRecordObj.date = record.date;

  worldRecordObj.runTime = record.times.primary;
  if(worldRecordObj.runTime === record.times.ingame) {
    worldRecordObj.primaryTimingMethod = "IGT";
  } else if (worldRecordObj.runTime === record.times.realtime) {
    worldRecordObj.primaryTimingMethod = "RTA";
  } else {
    worldRecordObj.primaryTimingMethod = "RTA (No Loads)";
  }

  for(var i = 0; i < record.players.length; i++) {
    worldRecordObj.players[i] = record.players[i];
  }

  if(record.videos.links[0].uri.includes('twitch.tv')) {
    worldRecordObj.videoType = 'twitch';
    // Capture the video ID using RegExp
    worldRecordObj.videoID = /\/v(?:ideos)?\/([^&]+)/.exec(record.videos.links[0].uri)[1];
  } else {
    worldRecordObj.videoType = 'youtube';
    // Capture the video ID using RegExp
    worldRecordObj.videoID = /(?:v=|\.be\/)([^&]+)/.exec(record.videos.links[0].uri)[1];
  }
}

/*
This function will accept a URI Hash and will decode it and split it into three seperate array elements.
These elements will then be used to load a record run.
*/
function decodeURIHash(hash) {
  hash = decodeURI(hash).slice(1);
  hash = hash.split(',');

  worldRecordObj.categoryID = hash[0];
  worldRecordObj.gameID = hash[1];
  worldRecordObj.gameTitle = hash[2];
}

window.onload = function() {
  clearWRObj();

  vm = new Vue({
    el: '#v-app',
    data: {
      gameTitle: null,
      categoryName: null,
      runTime: null,
      primaryTimingMethod: null,
      weblink: null,
      players: [],
      videoType: null,
      embedSRC: null,
      buttonDisabled: true
    },
    methods: {
      updateInfo: function() {
        this.gameTitle = worldRecordObj.gameTitle + ' - ';
        this.categoryName = worldRecordObj.categoryName;
        this.runTime = 'in ' + this.formatRunTime(worldRecordObj.runTime);
        this.primaryTimingMethod = '(' + worldRecordObj.primaryTimingMethod + ')';
        this.weblink = worldRecordObj.weblink;
        this.players = worldRecordObj.players;
        this.videoType = worldRecordObj.videoType
        this.embedSRC = this.generateEmbedSRC(this.videoType, worldRecordObj.videoID);
        this.buttonDisabled = false;

        this.updateURLFragments();
      },
      formatRunTime: function(runTime) {
        /*
        The time we get back from our API calls to SRcom will look something like PT12H34M56.789S.
        Because of this we need to reformat it ourselves. First, we strip off the "PT" at the beginning
        (this denotes that this is the time of the run in the primary timing method).
        */
        runTime = runTime.slice(2);

        /*
        It is possible that a time in minutes will produce an array with only 1 element. This
        can happen when a time is X minutes and 00 seconds. When this happens a placeholder 0 will be added
        at the back of the string so that formatting can be preserved.
        */
        if(runTime.includes('M') && !runTime.includes('S')) {
          runTime += '0S'
        }

        /*
        Next we create a Regular Expression that captures any digit or "." as many times as needed. Since
        each time denomination is separated by a letter this will give us as many matches as time denominations
        there are. These matches are then stored in order. ie "PT1H20M16S" will be stored as ["1", "20", "16"].
        This will allow us to conveniently reformat the times simply by seeing how long the resulting array is.
        */
        runTime = runTime.match(/[\d\.]+/g);

        /*
        If either the minutes or seconds value is <10 we will need to append a "0" to the front of
        the value to avoid awkward formatting.
        */
        for(var i = 0; i < runTime.length; i++) {
          if(runTime.length === 3 && i === 0) {}
          else {
            if(runTime[i] < 10) {
              runTime[i] = '0' + runTime[i];
            }
          }
        }

        /*
        The only intervention we need to make here is if the run time is only in seconds. In this case
        we want to append a 0 to the beginning of the array.

        After that we will simply join the array back into a string with ":" between each element, giving
        us a neatly formatted time.
        */
        if(runTime.length === 1) {
          runTime.unshift(0);
        }

        runTime = runTime.join(':');

        return runTime;
      },
      generateEmbedSRC: function(videoType, videoID) {
        if(videoType === 'youtube') {
          return 'https://www.youtube.com/embed/' + videoID;
        } else {
          return 'http://player.twitch.tv/?video=' + videoID;
        }
      },
      fetchNewRecord: function() {
        this.buttonDisabled = true;
        findRandomGameSet();
      },
      updateURLFragments: function() {
        var newHash = [worldRecordObj.categoryID, worldRecordObj.gameID, worldRecordObj.gameTitle];
        newHash = newHash.join(',');
        newHash = encodeURI(newHash);

        location.hash = newHash;
      }
    }
  });
}

getTotalNumberOfGames();
