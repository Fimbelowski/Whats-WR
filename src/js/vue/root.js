window.onload = function() {
    var vm = new Vue({
        el: '#main',
        data: {
            totalNumOfGamesStartingOffset: 14000,
            totalNumOfGames: 0,
            ytRegEx: /youtube\.com\/watch\?v=(.+)|youtu\.be\/(.+)/i,
            twitchRegEx: /twitch\.tv\/\w{3,15}\/v\/(\d+)|twitch.tv\/videos\/(\d+)/i
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
                var categorySet = [].concat.apply([], groupOfGames.map(item => item.categories.data));
                vm.removePerLevelCategories(categorySet);
            },
            removePerLevelCategories: function(categorySet) {
                // Removes any categories from categorySet that are 'per-level' and calls getRandomSetOfCategories with the new array.
                var prunedCategorySet = categorySet.filter(category => category.type === 'per-game');
                vm.getRandomSetOfCategories(prunedCategorySet);
            },
            getRandomSetOfCategories: function(setOfCategories, numOfCategories = 10) {
                // Generate a set of unique, random numbers between 0 and the length of randomCategories minus 1
                var randomIndices = [];
                var randomSetOfCategories = [];

                while(randomIndices.length < numOfCategories) {
                    var r = this.getRandomNumber(setOfCategories.length - 1);
                    
                    if(randomIndices.indexOf(r) === -1) {
                        randomIndices.push(r);
                    }
                }

                // Pushes a category from randomCategories into categoriesToCheck at each index in randomIndices
                for(var i = 0; i < randomIndices.length; i++) {
                    randomSetOfCategories.push(setOfCategories[randomIndices[i]]);
                }
                vm.getRecordsFromCategoryArray(randomSetOfCategories);
            },
            getRecordsFromCategoryArray: function(arr) {
                // Create an empty array that will store all promise.
                var promises = [];

                // For each element in arr, create a new promise
                arr.forEach(item => promises.push(vm.getRecordFromCategoryObj(item)));

                // When all promises are resolved, iterate through arr and if each item has a WR run and the run is suitable for viewing,
                // get the run's video info. Otherwise, remove the category from arr. 

                Promise.all(promises).then(() => {
                    // Iterate through each item in arr and check to see that it has video proof and that its video proof is suitable for
                    // viewing.
                    console.log('Array Length: ' + arr.length);
                    console.log(arr);
                    arr.forEach(function(item) {
                        if(item.wr) {
                            console.log(item);
                            var uri = item.wr.videos.links[0].uri;
                            var host = vm.getVideoHost(uri);
                            var id = '';
                            if(host) {
                                console.log('Video URL: ' + uri);
                                console.log('Video Host: ' + host);
                                id = vm.getVideoID(uri, host);
                                console.log('Video ID: ' + id);
                            } else {
                                arr.splice(arr.indexOf(item), 1);
                            }
                        } else {
                            arr.splice(arr.indexOf(item), 1);
                        }
                    });
                    console.log('Array Length: ' + arr.length);
                    console.log(arr);
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
            getVideoHost: function(uri) {
                // Checks whether or not a record's video is usable. If the record has a video link and the link is hosted on a valid
                // YouTube or Twitch url then the name of the host is returned. Otherwise, false is returned.

                return (vm.ytRegEx.test(uri)) ? 'youtube'
                : (vm.twitchRegEx.test(uri)) ? 'twitch'
                : false;
            },
            getVideoID: function(uri, host) {
                // Returns the video ID of of videoURL based on videoHost
                id = (host === 'youtube') ? vm.ytRegEx.exec(uri) : vm.twitchRegEx.exec(uri);
                console.log('Full Match: ' + id);
                console.log('Last item: ' + id[id.length - 1]);

                return id;
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