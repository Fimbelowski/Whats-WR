window.onload=function(){var e=new Vue({el:"#main",data:{totalNumOfGamesStartingOffset:14e3,totalNumOfGames:0,displayedRun:null,backupRuns:[],targetNumOfBackups:3,ytRegEx:/(?:(?:youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+)/i,twitchRegEx:/(?:twitch\.tv\/(?:\w{3,15}\/v\/)|(?:videos\/))(\d+)/i},methods:{getTotalNumOfGames:function(){new Promise((e,t)=>{const a=new XMLHttpRequest;var n="https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset="+this.totalNumOfGamesStartingOffset;a.open("GET",n),a.onload=(()=>e(JSON.parse(a.responseText).data)),a.onerror=(()=>t(a.statusText)),a.send()}).then(t=>{t.length<1e3?(e.totalNumOfGames=e.totalNumOfGamesStartingOffset+t.length,e.checkForHash()):(e.totalNumOfGamesStartingOffset+=1e3,e.getTotalNumOfGames())})},checkForHash:function(){window.location.hash||e.getRandomGroupOfGames()},getRandomGroupOfGames:function(){new Promise((e,t)=>{const a=new XMLHttpRequest;var n="https://www.speedrun.com/api/v1/games?offset="+this.getRandomNumber(this.totalNumOfGames)+"&embed=categories.game";a.open("GET",n),a.onload=(()=>e(JSON.parse(a.responseText).data)),a.onerror=(()=>t(a.statusText)),a.send()}).then(t=>{e.extractCategories(t)})},extractCategories:function(t){var a=[].concat.apply([],t.map(e=>e.categories.data));0===(a=a.filter(e=>"per-game"===e.type)).length?e.getRandomGroupOfGames():e.getRandomSetOfCategories(a)},getRandomSetOfCategories:function(t,a=10){var n=[],o=[];for(t.length<a&&(a=t.length);n.length<a;){var r=this.getRandomNumber(t.length-1);-1===n.indexOf(r)&&n.push(r)}n.forEach(e=>{o.push(t[e])}),e.getRecordsFromCategoryArray(o)},getRecordsFromCategoryArray:function(t){var a=[];t.forEach(t=>a.push(e.getRecordFromCategoryObj(t))),Promise.all(a).then(()=>{0===(t=t.filter(e=>e.wr)).length?e.getRandomGroupOfGames():e.parseVideoInfo(t)})},getRecordFromCategoryObj:function(e){var t=new Promise((t,a)=>{const n=new XMLHttpRequest;var o="https://www.speedrun.com/api/v1/categories/"+e.id+"/records?top=1";n.open("GET",o),n.onload=(()=>t(JSON.parse(n.responseText).data[0])),n.onerror=(()=>a(n.statusText)),n.send()});return t.then(t=>{e.wr=t.runs.length>0&&t.runs[0].run.videos?t.runs[0].run:null}),t},parseVideoInfo:function(t){t.forEach(t=>t.videoHost=e.ytRegEx.test(t.wr.videos.links[0].uri)?"youtube":!!e.twitchRegEx.test(t.wr.videos.links[0].uri)&&"twitch"),0===(t=t.filter(e=>e.videoHost)).length?e.getRandomGroupOfGames():(t.forEach(t=>t.videoID="youtube"===t.videoHost?e.ytRegEx.exec(t.wr.videos.links[0].uri)[1]:e.twitchRegEx.exec(t.wr.videos.links[0].uri)[1]),e.cleanCategoryObject(t[e.getRandomNumber(t.length-1)]))},cleanCategoryObject:function(t){var a={};a.gameID=t.game.data.id,a.gameTitle=t.game.data.names.international?t.game.data.names.international:t.game.data.names.japanese,a.categoryID=t.id,a.categoryName=t.name,t.wr.times.primary_t===t.wr.times.ingame_t?(a.timingMethod="IGT",a.runTime=e.formatRuntime(t.wr.times.ingame_t)):t.wr.times.primary_t===t.wr.times.realtime_t?(a.timingMethod="RTA",a.runTime=e.formatRuntime(t.wr.times.realtime_t)):(a.timingMethod="RTA (No Loads)",a.runTime=e.formatRuntime(t.wr.times.realtime_noloads_t)),a.players=t.wr.players,e.getAllPlayersInfo(a)},formatRuntime:function(e){var t=Math.floor(e/3600),a=Math.floor((e-3600*t)/60),n=e-3600*t-60*a;return t<10&&(t="0"+t),a<10&&(a="0"+a),n%1!=0&&(n=n.toFixed(3)),n<10&&(n="0"+n),t+":"+a+":"+n},getAllPlayersInfo:function(t){var a=[];t.players.forEach(t=>a.push("guest"!==t.rel?e.getPlayerInfo(t):t)),Promise.all(a).then(()=>{null===e.displayedRun?e.displayedRun=t:e.backupRuns.push(t),e.backupRuns.length<e.targetNumOfBackups&&e.getRandomGroupOfGames()})},getPlayerInfo:function(e){var t=new Promise((t,a)=>{const n=new XMLHttpRequest;var o=e.uri;n.open("GET",o),n.onload=(()=>t(JSON.parse(n.responseText).data)),n.onerror=(()=>a(n.statusText)),n.send()});return t.then(t=>{e.name=t.names.japanese?t.names.japanese:t.names.international,e.src=t.weblink,e.twitch=t.twitch?t.twitch.uri:null,e.twitter=t.twitter?t.twitter.uri:null,e.youtube=t.youtube?t.youtube.uri:null}),t},getRandomNumber:function(e){return Math.floor(Math.random()*(e+1))}},created:function(){this.getTotalNumOfGames()}})};