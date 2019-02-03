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
                return {
                    gameTitle: this.displayedRun.gameTitle,
                    categoryName: this.displayedRun.categoryName,
                    runtime: this.displayedRun.runtime,
                    timingMethod: this.displayedRun.timingMethod,
                    src: this.displayedRun.src,
                    runID: this.displayedRun.runID
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
                // Start by getting a random group of games.
                vm.getRandomGroupOfGames()
                .then((arr) => {
                    // Break the categories out into their own objects with the game information stored inside.
                    arr = vm.extractCategories(arr);
                    // Filter out all 'per-level' categories.
                    arr = arr.filter((category) => category.type === 'per-game');
                    // Get a random set of categories.
                    arr = vm.getRandomSetOfCategories(arr);
                    // Fetch the world records for every category within arr.
                    vm.getRecordsFromCategoryArray(arr)
                    .then((records) => {
                        // Append all records to their respective categories
                        arr.forEach((category, i) => {
                            category.wr = records[i][0];
                        });
                        // Filter out all categories whose records have no runs or whose runs have no video.
                        arr = arr.filter((category) => category.wr.runs.length && category.wr.runs[0].run.videos);
                        console.log(arr);
                    });
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
                        newItem.gameID = game.id;
                        newItem.gameTitle = (game.names.japanese) ? game.names.japanese + ' (' + game.names.international + ')' : game.names.international;

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
            checkVideoHosts: function(arr) {
                // For each item in arr, first check to see that the video is hosted on either Twitch or Youtube using regexp.
                // Filter out all runs that do not have a valid video host.

                // Get the video host for each category in arr.
                arr.forEach(item => item.videoHost = (vm.ytRegEx.test(item.wr.videos.links[0].uri)) ? 'youtube'
                                                : (vm.twitchRegEx.test(item.wr.videos.links[0].uri)) ? 'twitch'
                                                : null);
                
                // Filter out all categories with an invalid video host.
                arr = arr.filter(item => item.videoHost);

                // At this point we know that all remaining categories are fit to show the user.

                // If the resulting array is empty (no categories are suitable), restart the process by calling getRandomGroupOfGames.
                // Otherwise, get a random category from the remaining categories and pass it into cleanCategoryObject.
                (!arr.length) ? vm.getRandomGroupOfGames() : vm.cleanCategoryObject(arr[vm.getRandomNumber(arr.length - 1)]);
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
            getAllPlayersInfo: function(wrObj) {
                // For each player, query speedrun.com to obtain information about them.

                // Create an empty array to store all promises.
                var promises = [];

                // For each player, create a new promise.
                wrObj.players.forEach(item => promises.push(vm.getPlayerInfo(item))); 

                // When all promises are resolved then the run is ready to show to the user.
                Promise.all(promises).then(() => {
                    // If there is no displayedRun, set displayedRun equal to wrObj, update the location hash, and set pageIsIdle to false.
                    // Otherwise, push wrObj onto backupRuns.
                    if(vm.displayedRun === null) {
                        vm.displayedRun = wrObj;
                        window.location.hash = encodeURIComponent(vm.displayedRun.runID);
                        vm.pageIsIdle = false;
                    } else {
                        vm.backupRuns.push(wrObj);
                    }
                });
            },
            getPlayerInfo: function(playerObj) {
                // If the player has the role of guest, we can resolve the promise immediately since there is no other information about them available to us.
                // Otherwise, we can proceed with making an API call to retrieve their information.
                var url = playerObj.uri;

                vm.makeAsyncCall(url)
                .then((response) => {
                    vm.parsePlayerInfo(playerObj, response);
                }).catch((error) => {
                    window.setTimeout(function() {
                        vm.getPlayerInfo(playerObj);
                    }, 1000);
                });

                // var promise = new Promise((resolve, reject) => {
                //     // If the player is a guest, resolve the promise immediately.
                //     // Otherwise, continue the call normally.
                //     if(playerObj.rel === 'guest') {
                //         resolve(playerObj);
                //     } else {
                //         const req = new XMLHttpRequest();
                //         var url = playerObj.uri;
                //         req.open('GET', url);
                //         req.onload = () => resolve(JSON.parse(req.responseText).data);
                //         req.onerror = () => reject(req.statusText);
                //         req.send();
                //     }
                // });

                // promise.then((response) => {
                //     vm.parsePlayerInfo(playerObj, response);
                // })
                // .catch((error) => {
                //     window.setTimeout(function() {
                //         vm.getPlayerInfo(playerObj);
                //     }, 1000);
                // });

                // return promise;
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