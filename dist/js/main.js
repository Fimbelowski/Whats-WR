window.onload=function(){var e=new Vue({el:"#main",data:{totalNumOfGamesStartingOffset:14e3,totalNumOfGames:0,randomCategories:[],categoriesToCheck:[],viewableCategories:[]},methods:{getTotalNumOfGames:function(){var t=new XMLHttpRequest;t.open("GET","https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset="+this.totalNumOfGamesStartingOffset,!0),t.onload=function(){var t=JSON.parse(this.responseText).data.length;1e3===t?(e.totalNumOfGamesStartingOffset+=1e3,e.getTotalGames()):(e.totalNumOfGames=e.totalNumOfGamesStartingOffset+t,e.getRandomGroupOfGames())},t.send()},getRandomGroupOfGames:function(){var t=new XMLHttpRequest,a="https://www.speedrun.com/api/v1/games?offset="+this.getRandomNumber(this.totalNumOfGames)+"&embed=categories.game";t.open("GET",a,!0),t.onload=function(){for(var t=JSON.parse(this.responseText).data,a=[],o=0;o<t.length;o++)for(var n=0;n<t[o].categories.data.length;n++)a.push(t[o].categories.data[n]);e.getRandomSetOfCategories(a)},t.send()},getRandomNumber:function(e){return Math.floor(Math.random()*(e+1))},getRandomSetOfCategories:function(e,t=10){for(var a=0;a<e.length;a++)"per-level"===e[a].type&&e.splice(a,1);for(var o=[],n=[];o.length<t;){var r=this.getRandomNumber(e.length-1);-1===o.indexOf(r)&&o.push(r)}for(a=0;a<o.length;a++)n.push(e[o[a]]);this.getRecordFromCategoryID(n)},getRecordFromCategoryObj:function(t){var a=new XMLHttpRequest,o="https://www.speedrun.com/api/v1/categories/"+t.id+"/records?top=1";a.open("GET",o,!0),a.onload=function(){var a=JSON.parse(this.responseText).data;t.records=!!e.isRecordSuitableForViewing(a)&&a},a.send()},getRecordsFromCategoryArray:function(e){for(var t=[],a=0;a<e.length;a++)t.push(new Promise(function(e,t){}))},isRecordSuitableForViewing:function(e){}},created:function(){this.getTotalNumOfGames()}})};