window.onload = function() {
    var vm = new Vue({
        el: '#main',
        data: {
            totalNumOfGamesStartingOffset: 14000,
            totalNumOfGames: 0,
            randomCategories: [],
            categoriesToCheck: [],
            viewableCategories: []
        },
        methods: {
            getTotalNumOfGames: function() {
                /*
                    Fetch the total number of games on speedrun.com

                    This function starts by taking a starting offset and querying speedrun.com for 1,000 games at a time.
                    If 1,000 games are found, the offset is increased by 1,000 and this function is run again. If less than 1,000 games
                    are found, the number of games found is added to the starting offset and this is the total number of games.
                */
               var req = new XMLHttpRequest();

               req.open(
               'GET',
               'https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset=' + this.totalNumOfGamesStartingOffset,
               true
               );

               req.onload = function() {
                   var gamesPastOffset = JSON.parse(this.responseText).data.length;

                   if(gamesPastOffset === 1000) {
                       vm.totalNumOfGamesStartingOffset += 1000;
                       vm.getTotalGames();
                   } else {
                       vm.totalNumOfGames = vm.totalNumOfGamesStartingOffset + gamesPastOffset;
                       vm.getRandomGroupOfGames();
                   }
               }

               req.send();
            },
            getRandomGroupOfGames: function() {
                /*
                    Fetches a group of 20 games at a random offset with all their categories embedded, then break the set up
                    into individual categories.
                */
                var req = new XMLHttpRequest();

                var url = 'https://www.speedrun.com/api/v1/games?offset=' + this.getRandomNumber(this.totalNumOfGames) + '&embed=categories.game';

                req.open(
                    'GET',
                    url,
                    true
                );

                req.onload = function() {
                    var parsedResponse = JSON.parse(this.responseText).data;
                    var fullCategorySet = [];

                    // For each game, add each category individually to randomGameCategories
                    for(var i = 0; i < parsedResponse.length; i++) {
                        for(var j = 0; j < parsedResponse[i].categories.data.length; j++) {
                            fullCategorySet.push(parsedResponse[i].categories.data[j]);
                        }
                    }

                    vm.getRandomSetOfCategories(fullCategorySet);
                }

                req.send();
            },
            getRandomNumber: function(max) {
                // Generates a random number between 0 and max, inclusive.
                return Math.floor(Math.random() * (max + 1));
            },
            getRandomSetOfCategories: function(setOfCategories, numOfCategories = 10) {
                console.log(setOfCategories);
                // Start by removing any categories with the type of 'per-level' as these are individual level leaderboards.
                for(var i = 0; i < setOfCategories.length; i++) {
                    if(setOfCategories[i].type === 'per-level') {
                        setOfCategories.splice(i, 1);
                    }
                }

                console.log(setOfCategories);

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
                console.log(randomSetOfCategories);
                this.getRecordFromCategoryID(randomSetOfCategories);
            },
            getRecordFromCategoryID: function(categoryArr) {
                var categories = [];

                // If the argument passed into this function is not an array, make it an array with the parameter object as the only element
                if(!Array.isArray(categoryArr)) {
                    categories.push(categoryArr);
                } else {
                    categories = categoryArr;
                }

                //  Fetches a category's world record run given a category object for each element in categories
                for(var i = 0; i < categories.length; i++) {
                    var req = new XMLHttpRequest();
    
                    var url = 'https://www.speedrun.com/api/v1/categories/' + categories[i].id + '/records?top=1';
    
                    req.open(
                        'GET',
                        url,
                        true
                    );
    
                    req.onload = function(i) {
                        // Append the record run(s) to the respective category object
                        // console.log(JSON.parse(this.responseText).data);
                        // console.log(categories[i]);
                    }
    
                    req.send();
                }
            },
            checkCategoryViewingSuitability: function(categoryObj) {
                /*
                    Checks a category to see whether or not it is suitable to show to the user. Categories with no runs, IL categories,
                    categories with no video proof hosted on either Twitch or YouTube are not suitable. All others that fall within these
                    parameters are okay to show the user.
                */
            }
        },
        created: function() {
            this.getTotalNumOfGames();
        }
    });
}