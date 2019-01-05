window.onload = function() {
    var vm = new Vue({
        el: '#main',
        data: {
            totalNumOfGamesStartingOffset: 14000,
            totalNumOfGames: 0,
            ytRegEx: /(?:(?:youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+)/i,
            twitchRegEx: /(?:twitch\.tv\/(?:\w{3,15}\/v\/)|(?:videos\/))(\d+)/i
        },
        methods: {
            getTotalNumOfGames: function() {
                /*
                    Fetch the total number of games on speedrun.com

                    This function starts by taking a starting offset and querying speedrun.com for 1,000 games at a time.
                    If 1,000 games are found, the offset is increased by 1,000 and this function is run again. If less than 1,000 games
                    are found, the number of games found is added to the starting offset and this is the total number of games.
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
                    if(response.length < 1000) {
                        vm.totalNumOfGames = vm.totalNumOfGamesStartingOffset + response.length;
                        vm.checkForHash();
                    } else {
                        vm.totalNumOfGamesStartingOffset += 1000;
                        vm.getTotalNumOfGames();
                    }
               });
            },
            checkForHash: function() {
                // Check if the URL contains a location hash. If so, load a ran from that fragment. If not, load from a fresh start.
                if(window.location.hash) {
                    // Load from fragment
                } else {
                    // Load fresh
                    vm.getRandomGroupOfGames();
                }
            },
            getRandomGroupOfGames: function() {
                /*
                    Fetches a group of 20 games at a random offset with all their categories embedded, then break the set up
                    into individual categories.
                */
                var promise = new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    var url = 'https://www.speedrun.com/api/v1/games?offset=' + this.getRandomNumber(this.totalNumOfGames) + '&embed=categories.game';
                    xhr.open('GET', url);
                    xhr.onload = () => resolve(JSON.parse(xhr.responseText).data);
                    xhr.onerror = () => reject(xhr.statusText);
                    xhr.send();
                });

                promise.then((response) => {
                    vm.extractCategoriesFromGroupOfGames(response);
                });
            },
            extractCategoriesFromGroupOfGames: function(groupOfGames) {
                // Break out all categories into their own objects.
                var categorySet = [].concat.apply([], groupOfGames.map(item => item.categories.data));

                // Filter out all 'per-level' categories.
                categorySet = categorySet.filter(item => item.type === 'per-game');

                // Pass the filtered category set into getRandomSetOfCategories.
                vm.getRandomSetOfCategories(categorySet);
            },
            getRandomSetOfCategories: function(arr, numOfCategories = 10) {
                // Generate a set of unique, random numbers between 0 and the length of randomCategories minus 1
                var randomIndices = [];
                var randomSetOfCategories = [];

                while(randomIndices.length < numOfCategories) {
                    var r = this.getRandomNumber(arr.length - 1);
                    
                    if(randomIndices.indexOf(r) === -1) { randomIndices.push(r); }
                }

                // Pushes a category from randomCategories into categoriesToCheck at each index in randomIndices
                randomIndices.forEach(item => {
                    randomSetOfCategories.push(arr[item]);
                });

                vm.getRecordsFromCategoryArray(randomSetOfCategories);
            },
            getRecordsFromCategoryArray: function(arr) {
                // Create an empty array that will store all promises.
                var promises = [];

                // For each element in arr, create a new promise
                arr.forEach(item => promises.push(vm.getRecordFromCategoryObj(item)));

                // When all promises are resolved, filter out any categories within arr that do not have a valid WR.

                Promise.all(promises).then(() => {
                    // Filter out all categories that don't have a WR run.
                    arr = arr.filter(item => item.wr);

                    // Pass the resulting array into parseVideoInfo
                    vm.parseVideoInfo(arr);
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

                // Get the video ID for each category in arr
                arr.forEach(item => item.videoID = (item.videoHost === 'youtube') ? vm.ytRegEx.exec(item.wr.videos.links[0].uri)[1]
                                                                                : vm.twitchRegEx.exec(item.wr.videos.links[0].uri)[1]);
                
                // At this point we know that all remaining categories are fit to show the user. We can now select one at random to show the user.
                // Get a random category from the remaining categories and pass it into cleanCategoryObject.
                vm.cleanCategoryObject(arr[vm.getRandomNumber(arr.length - 1)]);
            },
            cleanCategoryObject: function(categoryObj) {
                var wrInfo = {};

                // Set the game and category information
                wrInfo.gameID = categoryObj.game.data.id;
                wrInfo.gameTitle = (categoryObj.game.data.names.international) ? categoryObj.game.data.names.international : categoryObj.game.data.names.japanese;

                wrInfo.categoryID = categoryObj.id;
                wrInfo.categoryName = categoryObj.name;

                // Set the category timing method and runtime
                if(categoryObj.wr.times.primary_t === categoryObj.wr.times.ingame_t) {
                    wrInfo.timingMethod = 'IGT';
                    wrInfo.runTime = vm.formatRuntime(categoryObj.wr.times.ingame_t);
                } else if(categoryObj.wr.times.primary_t === categoryObj.wr.times.realtime_t) {
                    wrInfo.timingMethod = 'RTA';
                    wrInfo.runTime = vm.formatRuntime(categoryObj.wr.times.realtime_t);
                } else {
                    wrInfo.timingMethod = 'RTA (No Loads)';
                    wrInfo.runTime = vm.formatRuntime(categoryObj.wr.times.realtime_noloads_t);
                }

                // Set the player(s) info
                wrInfo.players = categoryObj.wr.players;
                vm.getAllPlayersInfo(wrInfo);
            },
            formatRuntime: function(runtime) {
                var hours = Math.floor(runtime / 3600);
                var minutes = Math.floor((runtime - (hours * 3600)) / 60);
                var seconds = runtime - (hours * 3600) - (minutes * 60);

                if(hours < 10) { hours = '0' + hours; }
                if(minutes < 10) { minutes = '0' + minutes; }
                if(seconds < 10) { seconds = '0' + seconds; }

                return hours + ':' + minutes + ':' + seconds;
            },
            getAllPlayersInfo: function(wrObj) {
                // Create an empty array to store all promises.
                var promises = [];

                // For each element in arr, create a new promise.
                wrObj.players.forEach(item => promises.push((item.rel !== 'guest') ? vm.getPlayerInfo(item) : item));

                // When all promises are resolved then the run is ready to show to the user.
                Promise.all(promises).then(() => {
                    console.log(wrObj);
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
                    playerObj.src = response.weblink;
                    playerObj.twitch = (response.twitch) ? response.twitch.uri : null;
                    playerObj.twitter = (response.twitter) ? response.twitter.uri : null;
                    playerObj.youtube = (response.youtube) ? response.youtube.uri : null;
                });

                return promise;
            },
            // Utility Methods
            getRandomNumber: function(max) {
                // Generates a random number between 0 and max, inclusive.
                return Math.floor(Math.random() * (max + 1));
            }
        },
        created: function() {
            this.getTotalNumOfGames();
        }
    });
}