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
                    Fetches a group of 20 games at a random offset with all their categories embedded
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
                // Start by generating a set of unique, random numbers between 0 and the length of randomCategories minus 1
                var randomIndices = [];
                var randomSetOfCategories = [];

                while(randomIndices.length < numOfCategories) {
                    var r = this.getRandomNumber(setOfCategories.length - 1);
                    
                    if(randomIndices.indexOf(r) === -1) {
                        randomIndices.push(r);
                    }
                }

                /*
                    Pushes a category from randomCategories into categoriesToCheck at each index in randomIndices, then grabs the record
                    run for each category in categoriesToCheck
                */
                for(var i = 0; i < randomIndices.length; i++) {
                    randomSetOfCategories.push(setOfCategories[randomIndices[i]]);
                    // this.getRecordFromCategoryID(this.categoriesToCheck[i]);
                }

                console.log(randomSetOfCategories);
            },
            getRecordFromCategoryID: function(categoryObj) {
                //  Fetches a category's world recorn run given a category object
                var index = this.categoriesToCheck.indexOf(categoryObj);

                var req = new XMLHttpRequest();

                var url = 'https://www.speedrun.com/api/v1/categories/' + categoryObj.id + '/records?top=1';

                req.open(
                    'GET',
                    url,
                    true
                );

                req.onload = function() {
                    // Append the record run(s) to the respective category object
                    vm.categoriesToCheck[index].records = JSON.parse(this.responseText).data
                }

                req.send();
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