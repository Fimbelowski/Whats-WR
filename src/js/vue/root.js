window.onload = function() {
    var vm = new Vue({
        el: '#main',
        data: {
            totalNumOfGamesStartingOffset: 15000,
            totalNumOfGames: 0,
            displayedRun: null,
            backupRuns: [],
            targetNumOfBackups: 3,
            idleTimeoutDuration: 15,
            pageIsIdle: false,
            ytRegEx: /(?:(?:youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+)/i,
            twitchRegEx: /(?:twitch\.tv\/(?:\w{3,15}\/v\/)|(?:videos\/))(\d+)/i
        },
        computed: {
            wrInfo: function() {
                if(!vm.displayedRun) {
                    return null;
                } else {
                    return {
                        category: this.displayedRun.category,
                        game: this.displayedRun.game,
                        times: this.displayedRun.times
                    }
                }
            }
        },
        methods: {
            makeAsyncCall: function(url) {
                return new Promise(function(resolve, reject) {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', url);
                    xhr.onload = () => { resolve(JSON.parse(xhr.responseText).data); }
                    xhr.onerror = () => {
                        reject({
                            status: xhr.status,
                            statusText: xhr.statusText
                        });
                    }

                    xhr.send();
                });
            },
            getTotalNumOfGames: function() {
                /*
                    Fetch the total number of games on speedrun.com

                    This function starts by taking a starting offset and querying speedrun.com for 1,000 games at a time.
                    If 1,000 games are found, the offset is increased by 1,000 and this function is run again. If less than 1,000 games
                    are found, the number of games found is added to the starting offset and this is the total number of games.

                    Once the total number of games is found, runs can start being found.
                */
                var url = 'https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset=' + this.totalNumOfGamesStartingOffset;

                this.makeAsyncCall(url)
                .then((response) => {
                    if(response.length < 1000) { // If less than 1,000 games are found...
                        vm.totalNumOfGames = vm.totalNumOfGamesStartingOffset + response.length;

                        // Begin finding random runs to show the user.
                        vm.getNewRun();
                    } else {
                        // Add 1,000 to the starting offset and run this function again.
                        vm.totalNumOfGamesStartingOffset += 1000;
                        vm.getTotalNumOfGames();
                    }
                }).catch((error) => {
                    window.setTimeout(function() {
                        vm.getTotalNumOfGames();
                    }, 1000);
                });
            },
            getNewRun: function() {
                // Create an empty array to hold results throughout the main code flow.
                var masterArray = [];
                // Create a variable to hold the eventual result.
                var result = null;

                // Start by getting a random group of games.
                vm.getRandomGroupOfGames()
                .then((response) => {
                    // Set masterArray
                    masterArray = response;
                    // Break the categories out into their own objects with the game information stored inside.
                    masterArray = vm.extractCategories(masterArray);
                    // Filter out all 'per-level' categories.
                    masterArray = masterArray.filter((category) => category.type === 'per-game');
                    // Get a random set of categories.
                    masterArray = vm.getRandomSetOfCategories(masterArray);
                    // Fetch the world records for every category within masterArray.
                    return vm.getRecordsFromCategoryArray(masterArray);
                }).then((response) => {
                    // Append all records within response to their respective categories within masterArray.
                    // If the record has no runs or the runs have no video, append null instead.
                    masterArray.forEach((category, i) => {
                        var record = response[i][0];
                        category.run = (record.runs.length && record.runs[0].run.videos) ? record.runs[0].run : null;
                    });

                    // Filter out all categories with an unsuitable (null) records.
                    masterArray = masterArray.filter((category) => category.run);

                    // Filter out all categories with videos NOT hosted on Twitch or YouTube.
                    masterArray = masterArray.filter((category) => {
                        var videoURL = category.run.videos.links[0].uri;
                        return vm.twitchRegEx.test(videoURL) || vm.ytRegEx.test(videoURL);
                    });

                    // At this point all remaining categories can be deemed suitable to use.
                    // Pick one remaining category at random and store it in result.
                    result = masterArray[vm.getRandomNumber(masterArray.length - 1)];

                    // Fetch information about the player(s).
                    return vm.getAllPlayersInfo(result);
                }).then((response) => {
                    // Append information about the player onto the original player object.
                    result.run.players.forEach((player, i) => {
                        result.run.players[i] = response[i];
                    });

                    console.log(result);

                    // Restructure the result to mimic the result of fetching a specific run with game, category, and players embedded.
                    // Set the root of the object equal to the run object itself.
                    var newObj = result.run;
                    // Embed the game.
                    newObj.game = result.game;
                    // Embed the category.
                    newObj.category = { name: result.name };

                    // If no displayedRun exists, move newObj into displayedRun. Otherwise, move newObj into backupRuns.
                    if(!vm.displayedRun) {
                        // Move newObj into displayedRun.
                        vm.setDisplayedRun(newObj);
                    } else { vm.backupRuns.push(newObj); }
                }).catch(() => {
                    // Restart the main code flow
                    // vm.getNewRun();
                });
            },
            getRandomGroupOfGames: function() {
                // Fetches a group of 20 games at a random offset with all their categories embedded.
                var url = 'https://www.speedrun.com/api/v1/games?offset=' + this.getRandomNumber(this.totalNumOfGames - 19) + '&embed=categories';

                return vm.makeAsyncCall(url);
            },
            extractCategories: function(arrayOfGames) {
                var newArr = [];

                // Break out all categories into their own objects.
                arrayOfGames.forEach((game) => { // For each game in arrayOfGames...
                    game.categories.data.forEach((category) => { // For each category within a game...
                        var newItem = category;
                        newItem.game = {};
                        newItem.game.id = game.id;
                        newItem.game.names = game.names;

                        newArr.push(newItem);
                    });
                });

                return newArr;
            },
            getRandomSetOfCategories: function(arrayOfCategories, numOfCategories = 10) {
                // Given an array, find and store a number of categories (default 10) into a new array.
                // All entries must be unique.

                // Generate a set of unique, random numbers between 0 and the length of randomCategories minus 1 inclusive.
                var randomIndices = [];
                var newArr = [];

                // If the length of arr is less than numOfCategories, set numOfCategories equal to the length of arr to avoid out of bounds errors.
                if(arrayOfCategories.length < numOfCategories) { numOfCategories = arrayOfCategories.length; }

                // While there are fewer random indices than numOfCategories, generate a random index.
                // If the index does not already exist, add it the randomIndices.
                while(randomIndices.length < numOfCategories) {
                    var r = this.getRandomNumber(arrayOfCategories.length - 1);
                    
                    if(randomIndices.indexOf(r) === -1) { randomIndices.push(r); }
                }

                // Pushes a category from randomCategories into categoriesToCheck at each index in randomIndices
                randomIndices.forEach(item => {
                    newArr.push(arrayOfCategories[item]);
                });

                return newArr;
            },
            getRecordsFromCategoryArray: function(arrayOfCategories) {
                // For each category in a given array, fetch that category's world record information from speedrun.com

                // Create an empty array that will store all promises.
                var promises = [];

                // For each element in arr, create a new promise.
                arrayOfCategories.forEach((category) => {
                    var url = 'https://www.speedrun.com/api/v1/categories/' + category.id + '/records?top=1';
                    
                    promises.push(vm.makeAsyncCall(url));
                });

                return Promise.all(promises);
            },
            setDisplayedRun: function(newRunObj) {
                // Reset displayedRun entirely.
                vm.displayedRun = null;

                // Move the new run into displayedRun.
                vm.displayedRun = newRunObj;

                // Update the location hash
                window.location.hash = encodeURIComponent(vm.displayedRun.id);
            },
            checkVideoHost: function(categoryObj) {
                // For each item in arr, first check to see that the video is hosted on either Twitch or Youtube using regexp.
                // Filter out all runs that do not have a valid video host.

                // Get the video host for each category in arr.
                categoryObj.videoHost = (vm.ytRegEx.test(categoryObj.wr.videos.links[0].uri)) ? 'youtube'
                                        : (vm.twitchRegEx.test(categoryObj.wr.videos.links[0].uri)) ? 'twitch'
                                        : null;
            },
            cleanCategoryObject: function(categoryObj) {
                // Given a category object, trim down its contents into only data relevant to usage within the site.
                // Relevant data: game ID, game title, category ID, category title, run ID, timing method, runtime, weblink, video URL, players.
                var wrInfo = {};

                // Store the game ID and title.
                wrInfo.gameID = categoryObj.game.data.id;
                wrInfo.gameTitle = (categoryObj.game.data.names.international) ? categoryObj.game.data.names.international : categoryObj.game.data.names.japanese;

                // Store the category ID and name.
                wrInfo.categoryID = categoryObj.id;
                wrInfo.categoryName = categoryObj.name;

                // Store the run ID.
                wrInfo.runID = categoryObj.wr.id;

                // Store the category timing method and runtime.
                vm.parseTimingInfo(wrInfo, categoryObj.wr);
                
                // Store the leaderboard's URL.
                wrInfo.src = categoryObj.weblink;

                // Store the video URL.
                wrInfo.videoURL = categoryObj.wr.videos.links[0].uri;

                // Store the player(s) info.
                wrInfo.players = categoryObj.wr.players;

                // Fetch information about the player(s).
                vm.getAllPlayersInfo(wrInfo);
            },
            parseTimingInfo: function(wrInfoObj, runObj) {
                // Takes a WR Info Object and a Run Object and parses information about the run's primary timing method and runtime and stores them within the WR Info Object.
                if(runObj.times.primary_t === runObj.times.ingame_t) {
                    wrInfoObj.timingMethod = 'IGT';
                    wrInfoObj.runtime = runObj.times.ingame_t;
                } else if(runObj.times.primary_t === runObj.times.realtime_t) {
                    wrInfoObj.timingMethod = 'RTA';
                    wrInfoObj.runtime = runObj.times.realtime_t;
                } else {
                    wrInfoObj.timingMethod = 'RTA (No Loads)';
                    wrInfoObj.runtime = runObj.times.realtime_noloads_t;
                }
            },
            getAllPlayersInfo: function(categoryObj) {
                // For each player, query speedrun.com to obtain information about them.

                // Create an empty array to store all promises.
                var promises = [];

                // For each player, create a new promise.
                categoryObj.run.players.forEach((player) => {
                    if(player.rel === 'guest') {
                        promises.push(Promise.resolve(player));
                    } else {
                        promises.push(vm.makeAsyncCall(player.uri));
                    }
                });

                return Promise.all(promises);
            },
            parsePlayerInfo: function(playerObj, playerInfo) {
                // Takes a Player Object and a Player Info Object and stores relevant information from the Player Info Object within the Player Object.
                
                // If the player is a guest, store their name.
                // Otherwise, store either their Japanese or International name.
                playerObj.name = (playerInfo.rel === 'guest') ? playerInfo.name
                                                            : (playerInfo.names.japanese) ? playerInfo.names.japanese : playerInfo.names.international;

                // Append the player's social media links.
                playerObj.src = (playerInfo.weblink) ? playerInfo.weblink : null;
                playerObj.twitch = (playerInfo.twitch) ? playerInfo.twitch.uri : null;
                playerObj.twitter = (playerInfo.twitter) ? playerInfo.twitter.uri : null;
                playerObj.youtube = (playerInfo.youtube) ? playerInfo.youtube.uri : null;
            },
            getNextRun: function() {
                // Remove the current run from displayedRun.
                // If there are any runs within backupRuns, move the first run into displayedRun and start the main code loop again to replace it.
                // Otherwise, call startIdleTimeout(). 

                // Remove the current run from the display object.
                vm.displayedRun = null;

                // If backupRuns contains any runs...
                if(vm.backupRuns.length) {
                    // Move the first element from backupRuns into displayedRun and update the location hash.
                    vm.displayedRun = vm.backupRuns.shift();
                    window.location.hash = encodeURIComponent(vm.displayedRun.runID);

                    // Restart the main code loop.
                    vm.getRandomGroupOfGames();
                } else {
                    // Start the idle timeout.
                    vm.startIdleTimeout(vm.idleTimeoutDuration);
                }
            },
            getRunFromHash: function() {
                // Queries speedrun.com for a specific run based on a run ID located in the window's location hash.
                // Once the run is returned, execute vm.getTotalNumOfGames in order to kick off the normal code flow.
                
                var runID = decodeURIComponent(window.location.hash).slice(1);
                
                var promise = new Promise((resolve, reject) => {
                    const req = new XMLHttpRequest();
                    var url = 'https://www.speedrun.com/api/v1/runs/' + runID + '?embed=game,category,players';
                    req.open('GET', url);
                    req.onload = () => resolve(JSON.parse(req.responseText).data);
                    req.onerror = () => reject(req.statusText);
                    req.send();
                });

                promise.then((response) => {
                    vm.pageIsIdle = false;
                    vm.parseRunFromHash(response);
                }).catch((error) => {
                    window.setTimeout(function() {
                        vm.getRunFromHash();
                    }, 1000);
                });

                return promise;
            },
            parseRunFromHash: function(runObj) {
                // Takes the response from getRunFromHash() and stores the relevant info.

                var wrInfo = {};

                // Store the game, category, and run information
                wrInfo.gameID = runObj.game.data.id;
                wrInfo.gameTitle = (runObj.game.data.names.international) ? runObj.game.data.names.international : runObj.game.data.names.japanese;

                wrInfo.categoryID = runObj.category.data.id;
                wrInfo.categoryName = runObj.category.data.name;

                wrInfo.runID = runObj.id;

                // Store the category timing method and runtime.
                vm.parseTimingInfo(wrInfo, runObj);

                // Store a link to the leaderboard.
                wrInfo.src = runObj.category.data.weblink;

                // Store the wr run's video URL
                wrInfo.videoURL = runObj.videos.links[0].uri;

                // Create an array to store the player(s) info.
                wrInfo.players = [];

                // Store the player info for each player
                runObj.players.data.forEach((item, i) => {
                    // Create a new player object and push it onto wrInfo.players.
                    wrInfo.players.push({});

                    // Parse information about the player and store it within the newly created Player Object.
                    vm.parsePlayerInfo(wrInfo.players[i], item);
                });

                // Move the run from the hash into displayedRun.
                vm.displayedRun = wrInfo;

                // Kick off the main code flow.
                vm.getTotalNumOfGames();
            },
            // Utility Methods
            getRandomNumber: function(max) {
                // Generates a random number between 0 and max, inclusive.
                return Math.floor(Math.random() * (max + 1));
            },
            startIdleTimeout: function(duration) {
                // Starts a timer to determine if the page is idle or not (no displayed game for an extended period of time).
                // If there is still no displayed run at the end of the timeout, pageIsIdle is set to true.
                setTimeout(function() {
                    if(!vm.displayedRun) { vm.pageIsIdle = true; }
                }, duration * 1000);
            }
        },
        created: function() {
            // First, check to see if a location hash exists. If one does, fetch the run from that hash. Otherwise, get the total number of games.
            (window.location.hash) ? this.getRunFromHash() : this.getTotalNumOfGames();
            // Start an initial idle timeout check.
            this.startIdleTimeout(this.idleTimeoutDuration);
        }
    });
}