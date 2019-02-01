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
            getTotalNumOfGames: function() {
                /*
                    Fetch the total number of games on speedrun.com

                    This function starts by taking a starting offset and querying speedrun.com for 1,000 games at a time.
                    If 1,000 games are found, the offset is increased by 1,000 and this function is run again. If less than 1,000 games
                    are found, the number of games found is added to the starting offset and this is the total number of games.

                    Once the total number of games is found, runs can start being found.
                */
                var promise = new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        var url = 'https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset=' + this.totalNumOfGamesStartingOffset;
                        xhr.open('GET', url);
                        xhr.onload = () => resolve(JSON.parse(xhr.responseText).data);
                        xhr.onerror = () => reject(xhr.statusText);
                        xhr.send();
                });

                promise.then((response) => {
                        if(response.length < 1000) { // If less than 1,000 games are found...
                            vm.totalNumOfGames = vm.totalNumOfGamesStartingOffset + response.length;

                            // Begin finding random runs to show the user.
                            vm.findRuns();
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
            findRuns: function() {
                // Start the main code flow as many times as needed to fill both the displayedRun and backupRuns
                var target = vm.targetNumOfBackups;
                // If there is no displayedRun, increment target.
                if(!vm.displayedRun) { target++; }

                for(var i = 0; i < target; i++) {
                    vm.getRandomGroupOfGames();
                }
            },
            getRandomGroupOfGames: function() {
                /*
                    Fetches a group of 20 games at a random offset with all their categories embedded, then breaks the set up
                    into individual categories.
                */
                var promise = new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    var url = 'https://www.speedrun.com/api/v1/games?offset=' + this.getRandomNumber(this.totalNumOfGames - 19) + '&embed=categories.game';
                    xhr.open('GET', url);
                    xhr.onload = () => resolve(JSON.parse(xhr.responseText).data);
                    xhr.onerror = () => reject(xhr.statusText);
                    xhr.send();
                });

                promise.then((response) => {
                    vm.extractCategories(response);
                }).catch((error) => {
                    window.setTimeout(function() {
                        vm.getRandomGroupOfGames();
                    }, 1000);
                });
            },
            extractCategories: function(arr) {
                // Break out all categories into their own objects.
                var categorySet = [].concat.apply([], arr.map(item => item.categories.data));

                // Filter out all 'per-level' categories.
                categorySet = categorySet.filter(item => item.type === 'per-game');


                // If the resulting array is empty (no categories are suitable), restart the process by calling getRandomGroupOfGames.
                // Otherwise, call getRandomSetOfCategories and pass in the filtered category set.
                (!categorySet.length) ? vm.getRandomGroupOfGames() : vm.getRandomSetOfCategories(categorySet);
            },
            getRandomSetOfCategories: function(arr, numOfCategories = 10) {
                // Given an array, find and store a number of categories (default 10) into a new array.
                // All entries must be unique.

                // Generate a set of unique, random numbers between 0 and the length of randomCategories minus 1 inclusive.
                var randomIndices = [];
                var randomSetOfCategories = [];

                // If the length of arr is less than numOfCategories, set numOfCategories equal to the length of arr to avoid out of bounds errors.
                if(arr.length < numOfCategories) { numOfCategories = arr.length; }

                // While there are fewer random indices than numOfCategories, generate a random index.
                // If the index does not already exist, add it the randomIndices.
                while(randomIndices.length < numOfCategories) {
                    var r = this.getRandomNumber(arr.length - 1);
                    
                    if(randomIndices.indexOf(r) === -1) { randomIndices.push(r); }
                }

                // Pushes a category from randomCategories into categoriesToCheck at each index in randomIndices
                randomIndices.forEach(item => {
                    randomSetOfCategories.push(arr[item]);
                });

                // Get the world record for each category in randomSetOfCategories.
                vm.getRecordsFromCategoryArray(randomSetOfCategories);
            },
            getRecordsFromCategoryArray: function(arr) {
                // For each category in a given array, fetch that category's world record information from speedrun.com

                // Create an empty array that will store all promises.
                var promises = [];

                // For each element in arr, create a new promise.
                arr.forEach(item => promises.push(vm.getRecordFromCategoryObj(item)));

                // When all promises are resolved, filter out any categories within arr that do not have a valid WR.
                Promise.all(promises).then(() => {
                    // Filter out all categories that don't have a WR run.
                    arr = arr.filter(item => item.wr);

                    // If the resulting array is empty (no categories are suitable), restart process by calling getRandomGroupOfGames.
                    // Otherwise, pass the resulting array into parseVideoInfo
                    (!arr.length) ? vm.getRandomGroupOfGames() : vm.parseVideoInfo(arr);
                });
            },
            getRecordFromCategoryObj: function(categoryObj) {
                // Fetches the world record run for a given category and then appends the response to categoryObj. If the response has no runs,
                // or the response has a run that does not have video, null is appended instead.
                var promise = new Promise((resolve, reject) => {
                    const req = new XMLHttpRequest();
                    var url = 'https://www.speedrun.com/api/v1/categories/' + categoryObj.id + '/records?top=1';
                    req.open('GET', url);
                    req.onload = () => resolve(JSON.parse(req.responseText).data[0]);
                    req.onerror = () => reject(req.statusText);
                    req.send();
                });

                promise.then((response) => {
                    categoryObj.wr = (response.runs.length > 0 && response.runs[0].run.videos) ? response.runs[0].run : null;
                }).catch((error) => {
                    window.setTimeout(function() {
                        vm.getRecordFromCategoryObj(categoryObj);
                    }, 1000);
                });

                return promise;
            },
            parseVideoInfo: function(arr) {
                // Get the video host for each category in arr.
                arr.forEach(item => item.videoHost = (vm.ytRegEx.test(item.wr.videos.links[0].uri)) ? 'youtube'
                                                : (vm.twitchRegEx.test(item.wr.videos.links[0].uri)) ? 'twitch'
                                                : false);
                
                // Filter out all categories with an invalid video host.
                arr = arr.filter(item => item.videoHost);

                // At this point we know that all remaining categories are fit to show the user.
                // If the resulting array is empty (no categories are suitable), call getRandomGroupOfGames.
                // Otherwise, continue with the normal flow.
                if(arr.length === 0) {
                    vm.getRandomGroupOfGames();
                } else {
                    //We can now select one at random to show the user.
                    // Get a random category from the remaining categories and pass it into cleanCategoryObject.
                    vm.cleanCategoryObject(arr[vm.getRandomNumber(arr.length - 1)]);
                    vm.pageIsIdle = false;
                }
            },
            cleanCategoryObject: function(categoryObj) {
                var wrInfo = {};

                // Store the game, category, and run information
                wrInfo.gameID = categoryObj.game.data.id;
                wrInfo.gameTitle = (categoryObj.game.data.names.international) ? categoryObj.game.data.names.international : categoryObj.game.data.names.japanese;

                wrInfo.categoryID = categoryObj.id;
                wrInfo.categoryName = categoryObj.name;

                wrInfo.runID = categoryObj.wr.id;

                // Store the category timing method and runtime.
                if(categoryObj.wr.times.primary_t === categoryObj.wr.times.ingame_t) {
                    wrInfo.timingMethod = 'IGT';
                    wrInfo.runtime = categoryObj.wr.times.ingame_t;
                } else if(categoryObj.wr.times.primary_t === categoryObj.wr.times.realtime_t) {
                    wrInfo.timingMethod = 'RTA';
                    wrInfo.runtime = categoryObj.wr.times.realtime_t;
                } else {
                    wrInfo.timingMethod = 'RTA (No Loads)';
                    wrInfo.runtime = categoryObj.wr.times.realtime_noloads_t;
                }
                
                // Store a link to the leaderboard.
                wrInfo.src = categoryObj.weblink;

                // Store the wr run's video URL
                wrInfo.videoURL = categoryObj.wr.videos.links[0].uri;

                // Store the player(s) info.
                wrInfo.players = categoryObj.wr.players;
                vm.getAllPlayersInfo(wrInfo);
            },
            getAllPlayersInfo: function(wrObj) {
                // Create an empty array to store all promises.
                var promises = [];

                // For each element in arr, create a new promise.
                wrObj.players.forEach(item => promises.push((item.rel !== 'guest') ? vm.getPlayerInfo(item) : item));

                // When all promises are resolved then the run is ready to show to the user.
                Promise.all(promises).then(() => {
                    // If there is no displayedRun, set displayedRun equal to wrObj and update the location hash. Otherwise, push wrObj onto backupRuns.
                    if(vm.displayedRun === null) {
                        vm.displayedRun = wrObj;
                        window.location.hash = encodeURIComponent(vm.displayedRun.runID);
                        vm.getRandomGroupOfGames();
                    } else {
                        vm.backupRuns.push(wrObj);
                    }
                });
            },
            getPlayerInfo: function(playerObj) {
                // If the player has the role of guest, we can resolve the promise right away since there is no other information about them available to us.
                // Otherwise, we can proceed with making an API call to retrieve their information.
                var promise = new Promise((resolve, reject) => {
                    const req = new XMLHttpRequest();
                    var url = playerObj.uri;
                    req.open('GET', url);
                    req.onload = () => resolve(JSON.parse(req.responseText).data);
                    req.onerror = () => reject(req.statusText);
                    req.send();
                });

                promise.then((response) => {
                    // Append all relevant information to playerObj.
                    
                    // Append the player's name.
                    playerObj.name = (response.names.japanese) ? response.names.japanese : response.names.international;

                    // Append the player's social media links.
                    playerObj.src = (response.weblink) ? response.weblink : null;
                    playerObj.twitch = (response.twitch) ? response.twitch.uri : null;
                    playerObj.twitter = (response.twitter) ? response.twitter.uri : null;
                    playerObj.youtube = (response.youtube) ? response.youtube.uri : null;
                }).catch((error) => {
                    window.setTimeout(function() {
                        vm.getPlayerInfo(playerObj);
                    }, 1000);
                });

                return promise;
            },
            getNextRun: function() {
                // Remove the current run from the display object.
                vm.displayedRun = null;

                // If backupRuns contains any elements...
                if(vm.backupRuns.length > 0) {
                    // Move the first element from backupRuns into displayedRun and update the location hash.
                    vm.displayedRun = vm.backupRuns.shift();
                    window.location.hash = encodeURIComponent(vm.displayedRun.runID);

                    // Fetch another run.
                    vm.getRandomGroupOfGames();
                } else {
                    vm.startIdleTimeout(vm.idleTimeoutDuration);
                }
            },
            getRunFromHash: function() {
                // Queries speeddrun.com for a specific run based on a run ID located in the window's location hash.
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
                var wrInfo = {};

                // Store the game, category, and run information
                wrInfo.gameID = runObj.game.data.id;
                wrInfo.gameTitle = (runObj.game.data.names.international) ? runObj.game.data.names.international : runObj.game.data.names.japanese;

                wrInfo.categoryID = runObj.category.data.id;
                wrInfo.categoryName = runObj.category.data.name;

                wrInfo.runID = runObj.id;

                // Store the category timing method and runtime.
                if(runObj.times.primary_t === runObj.times.ingame_t) {
                    wrInfo.timingMethod = 'IGT';
                    wrInfo.runtime = runObj.times.ingame_t;
                } else if(runObj.times.primary_t === runObj.times.realtime_t) {
                    wrInfo.timingMethod = 'RTA';
                    wrInfo.runtime = runObj.times.realtime_t;
                } else {
                    wrInfo.timingMethod = 'RTA (No Loads)';
                    wrInfo.runtime = runObj.times.realtime_noloads_t;
                }

                // Store a link to the leaderboard.
                wrInfo.src = runObj.category.data.weblink;

                // Store the wr run's video URL
                wrInfo.videoURL = runObj.videos.links[0].uri;

                // Create an array to store the player(s) info.
                wrInfo.players = [];

                // Store the player info for each player
                runObj.players.data.forEach((item, i) => {
                    wrInfo.players.push({});

                    // Check to see if the player is a guest or not.
                    if(item.rel === 'guest') {
                        // Store the guest's name.
                        wrInfo.players[i].name = item.name;
                    } else {
                        // Get the player's name.
                        wrInfo.players[i].name = (item.names.japanese) ? item.names.japanese : item.names.international;

                        // Get the player's social media info.
                        wrInfo.players[i].src = (item.weblink) ? item.weblink : null;
                        wrInfo.players[i].twitch = (item.twitch) ? item.twitch.uri : null;
                        wrInfo.players[i].twitter = (item.twitter) ? item.twitter.uri : null;
                        wrInfo.players[i].youtube = (item.youtube) ? item.youtube.uri : null;
                    }
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
                setTimeout(function() {
                    if(!vm.displayedRun) { vm.pageIsIdle = true; }
                }, duration * 1000);
            }
        },
        created: function() {
            // First, check to see if a location hash exists. If one does, fetch the run from that hash. Otherwise, get the total number of games.
            (window.location.hash) ? this.getRunFromHash() : this.getTotalNumOfGames();
            this.startIdleTimeout(this.idleTimeoutDuration);
        }
    });
}