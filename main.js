var vm;

window.onload = function() {

  vm = new Vue({
    el: '#v-app',
    data: {
      gamesListOffset: 13000,
      totalNumberOfGames: null,
      randomGameSet: null,
      randomGameCategories: null,

      gameID: null,
      gameTitle: null,
      categoryID: null,
      categoryName: null,
      weblink: null,
      runTime: null,
      primaryTimingMethod: null,
      players: [],
      videoType: null,
      videoID: null,

      displayObj: {
        gameTitle: null,
        categoryName: null,
        weblink: null,
        runTime: null,
        primaryTimingMethod: null,
        players: [],
        videoType: null,
        videoID: null,
        embedSource: null
      },

      categoryInfoFlag: false,
      playerInfoFlags: [false, false, false, false],

      isButtonDisabled: true
    },
    methods: {
      fetchNewRecord: function() {
        this.disableButton();
        this.resetRecordData();
        this.getRandomGameSet();
      },
      getTotalNumberOfGames: function() {
        /*
        speedrun.com's API doesn't have anything to simply get the total number of games,
        so instead I make an API call to get 1;000 games with a large offset to find the end of results.
        I then add the number of results made with a large offset to the offset to find the total number of games.
        */

        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset=' + this.gamesListOffset, true)

        xhr.onload = function() {
          var response = JSON.parse(this.responseText);

          /*
          If the size of the response is equal to 1;000 then we need to run this function again in order
          to ensure that we are finding the total number of games accurately.

          If not then we have the total number and we can proceed.
          */
          if(response.pagination.size === 1000) {
            vm.gamesListOffset += 1000;
            vm.getTotalNumberOfGames();
          } else {
            vm.totalNumberOfGames = vm.gamesListOffset + response.pagination.size;
          }

          /*
          Now that we have the total number of games we are ready to start
          finding random games. From here we will check to see if the page has
          a fragment identifier. If so, instead of finding a random game we will
          query SRcom to find the information for that category. If not, we will
          find a random game and record.
          */
          vm.checkForURIHash();
        }

        xhr.send(null);
      },
      checkForURIHash: function() {
        if(window.location.hash) {
          // Parse the URI fragments
          this.parseURIFragments();
          // Query SRcom to get information on the given category
          this.getRecordFromFragments();
        } else {
          // Find a random game set
          this.getRandomGameSet();
        }
      },
      getRandomGameSet: function() {
        // This function is the starting point for finding a random game and category.

        /*
        Generate a random number between 0 and the total number of games less 19.
        -20 since that is the smallest number of games we can query SRcom for, and +1
        to make the random number inclusive at its upper bounds.

        Querying for many games also allows us to select a new game in the event that
        the one we initially select isn't fit for viewing, saving us an API call.
        */
        var randomOffset = Math.floor((Math.random() * (this.totalNumberOfGames - 19)));

        // Query SRcom to find 20 games at the offset generated.
        var xhr = new XMLHttpRequest();

        xhr.open('GET', 'https://www.speedrun.com/api/v1/games?offset=' + randomOffset, true);
        xhr.onload = function() {
          vm.randomGameSet = JSON.parse(this.responseText).data;
          vm.selectGameFromSet();
        }

        xhr.send(null);
      },
      selectGameFromSet() {
        /*
        At this point we need to pick a random game from within randomGameSet and lookup
        it's information. We will generate a random index within the range of randomGameSet,
        store the chosen game's ID and Title (to save API calls later) and remove the entry
        from the randomGameSet array.

        We remove the entry from the array so that if the game isn't suitable we can easily
        choose a different game without needing to find the index of the original game.
        */
        var randomIndex = Math.floor((Math.random() * this.randomGameSet.length));
        var randomGame = this.randomGameSet[randomIndex];

        this.gameID = randomGame.id;
        this.gameTitle = (randomGame.names.international) ? randomGame.names.international : randomGame.names.japanese;

        this.randomGameSet.splice(randomIndex, 1);

        this.getRecordsFromGameID(this.gameID);
      },
      getRecordsFromGameID: function(gameID) {
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

        //Begin by querying SRcom for the game's records using the gameID we've stored.
        var xhr = new XMLHttpRequest();

        xhr.open('GET', 'https://www.speedrun.com/api/v1/games/' + this.gameID + '/records?top=1&scope=full-game&skip-empty=true', true);
        xhr.onload = function() {
          vm.randomGameCategories = JSON.parse(this.responseText).data;

          vm.selectCategoryFromSet();
        }

        xhr.send(null);
      },
      selectCategoryFromSet: function() {
        // If there are no more categories in the set, select a different game
        if(!this.randomGameCategories.length) {
          this.selectGameFromSet();
        } else {
          // Generate a random number between 0 and the length of randomGameCategories
          var randomIndex = Math.floor((Math.random() * this.randomGameCategories.length));

          // Store the element at the index we just generated
          var randomCategoryRecord = this.randomGameCategories[randomIndex].runs[0].run;

          // Remove the selected element from the original set
          this.randomGameCategories.splice(randomIndex, 1);

          /*
          Use RegExp to ensure that the video proof for the run is hosted on either YouTube or Twitch.
          If the proof URL is not valid (or there is no video proof) a new record will be chosen.
          */
          if(randomCategoryRecord.videos && /\/v(?:ideos)?\/([^&]+)|(?:v=|\.be\/)([^&]+)/.test(randomCategoryRecord.videos.links[0].uri)) {
            /*
            At this point the run can be deemed worthy to show to the user. Any relevant data should be
            added to worldRecordObj and subsequent API calls can be made in order to fetch the rest of the
            necessary data.

            After the API calls are initiated we can clear the other categories and games since we have our result.
            */
            this.saveRecordInfo(randomCategoryRecord);

            this.randomGameSet = [];
            this.randomGameCategories = [];

            /*
            At this point additional API calls need to be made in order to gather the few pieces of
            information that we still need. This includes the category name, the platform name, and the
            weblink to the category's leaderboards on SRcom.

            Since these are the last API calls we need to make to gather all of the information we need
            we will perform a check at the end of each of these two calls to see when all calls have been finished.
            At that point we will know that we have everything we need and there are no more lingering API calls
            and that we can update the run data to the user's screen.
            */
            this.getCategoryInfoFromID(this.categoryID);

            for(var i = 0; i < this.players.length; i++) {
              this.getPlayerInfoFromURI(i);
            }

            // If there are less than 4 players, set the remaining playerInfoFlags to true
            for(var i = this.players.length; i < 4; i++) {
              this.playerInfoFlags[i] = true;
            }
          } else {
            /*
            At this point we can be sure that this run isn't suitable. Here we will choose a different category
            from the stored set (if there are any). If there are no more records from the selected game, a new
            game will be selected and the process will begin anew.
            */
            this.selectCategoryFromSet();
          }
        }
      },
      saveRecordInfo: function(record) {
        /*
        This function takes an API response in the form of a record run and saves all of it's relevant information
        within worldRecordObj.
        */
        this.categoryID = record.category;

        this.runTime = record.times.primary;

        if(this.runTime === record.times.ingame) {
          this.primaryTimingMethod = "IGT";
        } else if (this.runTime === record.times.realtime) {
          this.primaryTimingMethod = "RTA";
        } else {
          this.primaryTimingMethod = "RTA (No Loads)";
        }

        for(var i = 0; i < record.players.length; i++) {
          this.players[i] = record.players[i];
        }

        if(record.videos.links[0].uri.includes('twitch.tv')) {
          this.videoType = 'twitch';
          // Capture the video ID using RegExp
          this.videoID = /\/v(?:ideos)?\/([^&]+)/.exec(record.videos.links[0].uri)[1];
        } else {
          this.videoType = 'youtube';
          // Capture the video ID using RegExp
          this.videoID = /(?:v=|\.be\/)([^&]+)/.exec(record.videos.links[0].uri)[1];
        }
      },
      getCategoryInfoFromID: function(categoryID) {
        /*
        This function will take a category ID and will make an API call to SRcom to get information
        about the category. That information will then be stored inside worldRecordObj.
        */
        var xhr = new XMLHttpRequest();

        xhr.open('GET', 'https://www.speedrun.com/api/v1/categories/' + categoryID, true);
        xhr.onload = function() {
          var categoryInfo = JSON.parse(this.responseText).data;

          // Store the necessary information inside worldRecordObj
          vm.categoryName = categoryInfo.name;
          vm.weblink = categoryInfo.weblink;

          // Update display flags
          vm.categoryInfoFlag = true;

          if(vm.infoReadyToDisplay()) {
            // Update displayObj and URI hash
            vm.updateURIFragments();
            vm.populateDisplayObj();
            vm.enableButton();
          }
        }

        xhr.send(null);
      },
      getPlayerInfoFromURI: function(index) {
        /*
        This function will take the player object's index within the players array and
        will make an API call to SRcom to retrieve relevant information about the player,
        which will then be stored inside the player object.
        */

        // Initially set all values to null. In the event of a guest account
        this.players[index].weblink = null;
        this.players[index].twitch = null;
        this.players[index].youtube = null;
        this.players[index].twitter = null;

        // If player is an SRcom user, find more information.
        if(this.players[index].rel === 'user') {
          var xhr = new XMLHttpRequest();

          xhr.open('GET', this.players[index].uri, true);
          xhr.onload = function() {
            var playerInfo = JSON.parse(this.responseText).data;

            vm.players[index].weblink = playerInfo.weblink;
            vm.players[index].name = vm.players[index].weblink.match(/([^/]*)$/)[0];
            vm.players[index].twitch = (playerInfo.twitch) ? playerInfo.twitch.uri : null;
            vm.players[index].youtube = (playerInfo.youtube) ? playerInfo.youtube.uri : null;
            vm.players[index].twitter = (playerInfo.twitter) ? playerInfo.twitter.uri : null;

            // Update check flags
            vm.playerInfoFlags[index] = true;

            if(vm.infoReadyToDisplay()) {
              // Update displayObj and URI hash
              vm.updateURIFragments();
              vm.populateDisplayObj();
              vm.enableButton();
            }
          }

          xhr.send(null);
        } else { // Player is a guest
          this.playerInfoFlags[index] = true;

          if(this.infoReadyToDisplay()) {
            // Update displayObj
            this.populateDisplayObj();
            this.updateHistory();
            this.enableButton();
          }
        }
      },
      infoReadyToDisplay: function() {
        return this.categoryInfoFlag && this.playerInfoFlags[0] && this.playerInfoFlags[1] && this.playerInfoFlags[2] && this.playerInfoFlags[3];
      },
      populateDisplayObj: function() {
        this.resetDisplayObj();
        this.resetDisplayFlags();

        this.displayObj.gameTitle = this.gameTitle + ' - ';
        this.displayObj.categoryName = this.categoryName;
        this.displayObj.weblink = this.weblink;
        this.displayObj.runTime = this.formatRunTime(this.runTime);
        this.displayObj.primaryTimingMethod =  '(' + this.primaryTimingMethod + ')';
        this.displayObj.players = this.players;
        this.displayObj.videoType = this.videoType;
        this.displayObj.videoID = this.videoID;
        this.displayObj.embedSource = this.generateEmbedSource(this.videoType, this.videoID);
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

        return 'in ' + runTime;
      },
      generateEmbedSource: function(videoType, videoID) {
        if(videoType === 'youtube') {
          return 'https://www.youtube.com/embed/' + videoID;
        } else {
          return 'http://player.twitch.tv/?video=' + videoID;
        }
      },
      enableButton: function() {
        this.isButtonDisabled = false;
      },
      disableButton: function() {
        this.isButtonDisabled = true;
      },
      resetRecordData: function() {
        this.gameID = null;
        this.gameTitle = null;
        this.categoryID = null;
        this.categoryName = null;
        this.weblink = null;
        this.runTime = null;
        this.primaryTimingMethod = null;
        this.players = [];
        this.videoType = null;
        this.videoID = null;
      },
      resetDisplayObj: function() {
        this.displayObj.gameTitle = null,
        this.displayObj.categoryName = null,
        this.displayObj.weblink = null,
        this.displayObj.runTime = null,
        this.displayObj.primaryTimingMethod = null,
        this.displayObj.players = [],
        this.displayObj.videoType = null,
        this.displayObj.videoID = null,
        this.displayObj.embedSource = null
      },
      resetDisplayFlags: function() {
        this.categoryInfoFlag = false;
        this.playerInfoFlags = [false, false, false, false];
      },
      updateURIFragments: function() {
        var newHash = [this.categoryID, this.gameID, this.gameTitle];
        newHash = encodeURI(newHash.join(','));

        location.hash = newHash;
      },
      parseURIFragments: function() {
        /*
        This function will accept a URI Hash and will decode it and split it into three seperate array elements.
        These elements will then be used to load a record run.
        */
        hash = decodeURI(window.location.hash).slice(1).split(',');

        this.categoryID = hash[0];
        this.gameID = hash[1];
        this.gameTitle = hash[2];
      },
      getRecordFromFragments: function() {
        this.getRecordFromCategoryID(this.categoryID);
        this.getCategoryInfoFromCategoryID(this.categoryID);
      },
      getRecordFromCategoryID: function(categoryID) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', 'https://www.speedrun.com/api/v1/categories/' + categoryID + '/records?top=1', true);
        xhr.onload = function() {
          vm.saveRecordInfo(JSON.parse(this.responseText).data[0].runs[0].run);

          // Retrieve the players' info
          for(var i = 0; i < vm.players.length; i++) {
            vm.getPlayerInfoFromURI(i);
          }

          // If there are less than 4 players, set the remaining playerInfoFlags to true
          for(var i = vm.players.length; i < 4; i++) {
            vm.playerInfoFlags[i] = true;
          }

          if(vm.infoReadyToDisplay()) {
            // Update displayObj and URI hash
            vm.populateDisplayObj();
            vm.enableButton();
          }
        }

        xhr.send(null);
      },
      getCategoryInfoFromCategoryID: function(categoryID) {
        //This function takes a categoryID and retrieves the category's name and it's weblink.
        var xhr = new XMLHttpRequest();

        xhr.open('GET', 'https://www.speedrun.com/api/v1/categories/' + categoryID, true);
        xhr.onload = function() {
          var response = JSON.parse(this.responseText).data;

          vm.categoryName = response.name;
          vm.weblink = response.weblink;

          vm.categoryInfoFlag = true;

          if(vm.infoReadyToDisplay()) {
            // Update displayObj and URI hash
            vm.populateDisplayObj();
            vm.enableButton();
          }
        }

        xhr.send(null);
      }
    },
    mounted: function() {
      this.getTotalNumberOfGames();
      window.addEventListener('keyup', function(event) {
        if(event.which === 32) {
          vm.fetchNewRecord();
        }
      });
    }
  });
}
