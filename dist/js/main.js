window.onload=function(){var t=new Vue({el:"#main",data:{totalNumOfGamesStartingOffset:14e3,totalNumOfGames:0,randomGamesCategories:[]},methods:{getTotalNumOfGames:function(){var e=new XMLHttpRequest;e.open("GET","https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset="+this.totalNumOfGamesStartingOffset,!0),e.onload=function(){var e=JSON.parse(this.responseText).data.length;1e3===e?(t.totalNumOfGamesStartingOffset+=1e3,t.getTotalGames()):(t.totalNumOfGames=t.totalNumOfGamesStartingOffset+e,t.getRandomGroupOfGames())},e.send()},getRandomGroupOfGames:function(){var e=new XMLHttpRequest;e.open("GET","https://www.speedrun.com/api/v1/games?_offset="+this.getRandomNumber(this.totalNumOfGames)+"&embed=categories.game",!0),e.onload=function(){for(var e=JSON.parse(this.responseText).data,a=0;a<e.length;a++)for(var o=0;o<e[a].categories.data.length;o++)t.randomGamesCategories.push(e[a].categories.data[o])},e.send()},getRandomNumber:function(t){return Math.floor(Math.random()*(t+1))}},created:function(){this.getTotalNumOfGames()}})};