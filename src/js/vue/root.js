window.onload = function() {
    var vm = new Vue({
        el: '#main',
        data: {
            totalNumOfGamesStartingOffset: 14000,
            totalNumOfGames: 0,
            randomCategories: [],
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
                    Fetches a group of 20 games at a random offset with all their categories embedded and stores them
                    in randomCategories
                */
                var req = new XMLHttpRequest();

                var url = 'https://www.speedrun.com/api/v1/games?offset=' + this.getRandomNumber(this.totalNumOfGames) + '&embed=categories.game';

                req.open(
                    'GET',
                    url,
                    true
                );

                req.onload = function() {
                    var randomGamesGroup = JSON.parse(this.responseText).data;

                    // For each game, add each category individually to randomGameCategories
                    for(var i = 0; i < randomGamesGroup.length; i++) {
                        for(var j = 0; j < randomGamesGroup[i].categories.data.length; j++) {
                            vm.randomCategories.push(randomGamesGroup[i].categories.data[j]);
                        }
                    }

                    vm.checkCategoriesForSuitability(5);
                }

                req.send();
            },
            getRandomNumber: function(max) {
                // Generates a random number between 0 and max, inclusive.
                return Math.floor(Math.random() * (max + 1));
            },
            checkCategoriesForSuitability: function(numOfCategories) {
                // Checks a number of random categories for whether or not they are suitable to show the user.

                // Start by generating a set of unique, random numbers between 0 and the length of randomCategories
               var randomIndices = [];

                while(randomIndices.length < numOfCategories) {
                    var r = this.getRandomNumber(this.randomCategories.length);
                    
                    if(randomIndices.indexOf(r) === -1) {
                        randomIndices.push(r);
                    }
                }

                // For each random category, fetch the category's top run and check for viewing criteria
                for(var i = 0; i < randomIndices.length; i++) {
                    var req = new XMLHttpRequest();

                    var url = 'https://www.speedrun.com/api/v1/categories/' + this.randomCategories[randomIndices[i]].id + '/records?top=1';

                    req.open(
                        'GET',
                        url,
                        true
                    );

                    req.onload = function() {
                        console.log(JSON.parse(this.responseText));
                    }

                    req.send();
                }
            }
        },
        created: function() {
            this.getTotalNumOfGames();
        }
    });
}