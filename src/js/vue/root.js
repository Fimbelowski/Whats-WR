window.onload = function() {
    var vm = new Vue({
        el: '#main',
        data: {
            totalNumOfGamesStartingOffset: 14000,
            totalNumOfGames: 0,
            randomGamesCategories: []
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
                // Fetches a group of 20 games with all their categories embedded at a random offset and stores them in randomGamesCategories
                var req = new XMLHttpRequest();

                req.open(
                    'GET',
                    'https://www.speedrun.com/api/v1/games?_offset=' + this.getRandomNumber(this.totalNumOfGames) + '&embed=categories.game',
                    true
                );

                req.onload = function() {
                    var randomGamesGroup = JSON.parse(this.responseText).data;

                    // For each game, add each category individually to randomGameCategories
                    for(var i = 0; i < randomGamesGroup.length; i++) {
                        for(var j = 0; j < randomGamesGroup[i].categories.data.length; j++) {
                            vm.randomGamesCategories.push(randomGamesGroup[i].categories.data[j]);
                        }
                    }
                }

                req.send();
            },
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