import Vue from './vendors/vue';
import App from './components/App.vue';

new Vue({
    el: '#app',
    render: h => h(App)
});

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
                        times: this.displayedRun.times,
                        run: { id: this.displayedRun.id }
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
                        vm.getNewRuns();
                    } else {
                        // Add 1,000 to the starting offset and run this function again.
                        vm.totalNumOfGamesStartingOffset += 1000;
                        vm.getTotalNumOfGames();
                    }
                });
            },
            getNewRuns: function() {
                var target = vm.targetNumOfBackups;
                if(!vm.displayedRun) { target++; }
                for(var i = 0; i < target; i++) {
                    vm.getNewRun();
                }
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

                    // Restructure the result to mimic the result of fetching a specific run with game, category, and players embedded.
                    // Set the root of the object equal to the run object itself.
                    var newObj = result.run;
                    // Embed the game.
                    newObj.game = { data: result.game };
                    // Embed the category.
                    newObj.category = {
                        data: {
                            name: result.name,
                            weblink: result.weblink
                        }
                    };

                    // Embed the players
                    newObj.players = { data: result.run.players };

                    // If no displayedRun exists, move newObj into displayedRun. Otherwise, move newObj into backupRuns.
                    if(!vm.displayedRun) {
                        // Move newObj into displayedRun.
                        vm.setDisplayedRun(newObj);
                    } else { vm.backupRuns.push(newObj); }
                }).catch(() => {
                    // Restart the main code flow
                    vm.getNewRun();
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
                // If null is passed in instead of a newRunObj...
                if(!newRunObj) {
                    // Reset the displayedRun.
                    vm.displayedRun = null;

                    // Start the idle timeout.
                    vm.startIdleTimeout(vm.idleTimeoutDuration);
                } else {
                    // If the page was idle before, reset it.
                    this.pageIsIdle = false;

                    // Move the new run into displayedRun.
                    vm.displayedRun = newRunObj;

                    // Update the location hash
                    window.location.hash = encodeURIComponent(vm.displayedRun.id);
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
            getNextRun: function() {
                // If backupRuns contains any runs...
                if(vm.backupRuns.length) {
                    // Set the displayedRun to be the first run in backupRuns.
                    vm.setDisplayedRun(vm.backupRuns.shift());

                    // Find another game to replace the game moved into displayedRun.
                    vm.getNewRun();
                } else {
                    // Reset the displayedRun.
                    vm.setDisplayedRun(null);

                    // Start the idle timeout.
                    vm.startIdleTimeout(vm.idleTimeoutDuration);
                }
            },
            getRunFromHash: function() {
                // Queries speedrun.com for a specific run based on a run ID located in the window's location hash.
                // Once the run is returned, execute vm.getTotalNumOfGames in order to kick off the normal code flow.
                
                var runID = decodeURIComponent(window.location.hash).slice(1);
                var url = 'https://www.speedrun.com/api/v1/runs/' + runID + '?embed=game,category,players';

                this.makeAsyncCall(url)
                .then((response) => {
                    vm.setDisplayedRun(response);
                    vm.getTotalNumOfGames();
                });
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