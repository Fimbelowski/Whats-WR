window.onload=function(){var e=new Vue({el:"#main",data:{totalNumOfGamesStartingOffset:14e3,totalNumOfGames:0,ytRegEx:/(?:(?:youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+)/i,twitchRegEx:/(?:twitch\.tv\/(?:\w{3,15}\/v\/)|(?:videos\/))(\d+)/i},methods:{getTotalNumOfGames:function(){new Promise((e,t)=>{const a=new XMLHttpRequest;var o="https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset="+this.totalNumOfGamesStartingOffset;a.open("GET",o),a.onload=(()=>e(JSON.parse(a.responseText).data)),a.onerror=(()=>t(a.statusText)),a.send()}).then(t=>{t.length<1e3?(e.totalNumOfGames=e.totalNumOfGamesStartingOffset+t.length,e.checkForHash()):(e.totalNumOfGamesStartingOffset+=1e3,e.getTotalNumOfGames())})},checkForHash:function(){window.location.hash||e.getRandomGroupOfGames()},getRandomGroupOfGames:function(){new Promise((e,t)=>{const a=new XMLHttpRequest;var o="https://www.speedrun.com/api/v1/games?offset="+this.getRandomNumber(this.totalNumOfGames)+"&embed=categories.game";a.open("GET",o),a.onload=(()=>e(JSON.parse(a.responseText).data)),a.onerror=(()=>t(a.statusText)),a.send()}).then(t=>{e.extractCategories(t)})},extractCategories:function(t){var a=[].concat.apply([],t.map(e=>e.categories.data));a=a.filter(e=>"per-game"===e.type),e.getRandomSetOfCategories(a)},getRandomSetOfCategories:function(t,a=10){for(var o=[],r=[];o.length<a;){var n=this.getRandomNumber(t.length-1);-1===o.indexOf(n)&&o.push(n)}o.forEach(e=>{r.push(t[e])}),e.getRecordsFromCategoryArray(r)},getRecordsFromCategoryArray:function(t){var a=[];t.forEach(t=>a.push(e.getRecordFromCategoryObj(t))),Promise.all(a).then(()=>{t=t.filter(e=>e.wr),e.parseVideoInfo(t)})},getRecordFromCategoryObj:function(e){var t=new Promise((t,a)=>{const o=new XMLHttpRequest;var r="https://www.speedrun.com/api/v1/categories/"+e.id+"/records?top=1";o.open("GET",r),o.onload=(()=>t(JSON.parse(o.responseText).data[0])),o.onerror=(()=>a(o.statusText)),o.send()});return t.then(t=>{e.wr=t.runs.length>0&&t.runs[0].run.videos?t.runs[0].run:null}),t},parseVideoInfo:function(t){t.forEach(t=>t.videoHost=e.ytRegEx.test(t.wr.videos.links[0].uri)?"youtube":!!e.twitchRegEx.test(t.wr.videos.links[0].uri)&&"twitch"),(t=t.filter(e=>e.videoHost)).forEach(t=>t.videoID="youtube"===t.videoHost?e.ytRegEx.exec(t.wr.videos.links[0].uri)[1]:e.twitchRegEx.exec(t.wr.videos.links[0].uri)[1]),e.cleanCategoryObject(t[e.getRandomNumber(t.length-1)])},cleanCategoryObject:function(t){var a={};a.gameID=t.game.data.id,a.gameTitle=t.game.data.names.international?t.game.data.names.international:t.game.data.names.japanese,a.categoryID=t.id,a.categoryName=t.name,t.wr.times.primary_t===t.wr.times.ingame_t?(a.timingMethod="IGT",a.runTime=e.formatRuntime(t.wr.times.ingame_t)):t.wr.times.primary_t===t.wr.times.realtime_t?(a.timingMethod="RTA",a.runTime=e.formatRuntime(t.wr.times.realtime_t)):(a.timingMethod="RTA (No Loads)",a.runTime=e.formatRuntime(t.wr.times.realtime_noloads_t)),a.players=t.wr.players,e.getAllPlayersInfo(a)},formatRuntime:function(e){var t=Math.floor(e/3600),a=Math.floor((e-3600*t)/60),o=e-3600*t-60*a;return t<10&&(t="0"+t),a<10&&(a="0"+a),o<10&&(o="0"+o),t+":"+a+":"+o},getAllPlayersInfo:function(t){var a=[];t.players.forEach(t=>a.push("guest"!==t.rel?e.getPlayerInfo(t):t)),Promise.all(a).then(()=>{console.log(t)})},getPlayerInfo:function(e){var t=new Promise((t,a)=>{const o=new XMLHttpRequest;var r=e.uri;o.open("GET",r),o.onload=(()=>t(JSON.parse(o.responseText).data)),o.onerror=(()=>a(o.statusText)),o.send()});return t.then(t=>{e.name=t.names.japanese?t.names.japanese:t.names.international,e.src=t.weblink,e.twitch=t.twitch?t.twitch.uri:null,e.twitter=t.twitter?t.twitter.uri:null,e.youtube=t.youtube?t.youtube.uri:null}),t},getRandomNumber:function(e){return Math.floor(Math.random()*(e+1))}},created:function(){this.getTotalNumOfGames()}})};