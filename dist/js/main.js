window.onload=function(){var e=new Vue({el:"#main",data:{totalNumOfGamesStartingOffset:14e3,totalNumOfGames:0,displayedRun:null,backupRuns:[],targetNumOfBackups:3,ytRegEx:/(?:(?:youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+)/i,twitchRegEx:/(?:twitch\.tv\/(?:\w{3,15}\/v\/)|(?:videos\/))(\d+)/i},computed:{isButtonDisabled:function(){return!this.displayedRun},wrInfo:function(){return{gameTitle:this.displayedRun.gameTitle,categoryName:this.displayedRun.categoryName,runtime:this.displayedRun.runtime,timingMethod:this.displayedRun.timingMethod,src:this.displayedRun.src,runID:this.displayedRun.runID}}},methods:{getTotalNumOfGames:function(){new Promise((e,t)=>{const a=new XMLHttpRequest;var n="https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset="+this.totalNumOfGamesStartingOffset;a.open("GET",n),a.onload=(()=>e(JSON.parse(a.responseText).data)),a.onerror=(()=>t(a.statusText)),a.send()}).then(t=>{t.length<1e3?e.totalNumOfGames=e.totalNumOfGamesStartingOffset+t.length:(e.totalNumOfGamesStartingOffset+=1e3,e.getTotalNumOfGames())})},getRandomGroupOfGames:function(){new Promise((e,t)=>{const a=new XMLHttpRequest;var n="https://www.speedrun.com/api/v1/games?offset="+this.getRandomNumber(this.totalNumOfGames-19)+"&embed=categories.game";a.open("GET",n),a.onload=(()=>e(JSON.parse(a.responseText).data)),a.onerror=(()=>t(a.statusText)),a.send()}).then(t=>{e.extractCategories(t)})},extractCategories:function(t){var a=[].concat.apply([],t.map(e=>e.categories.data));0===(a=a.filter(e=>"per-game"===e.type)).length?e.getRandomGroupOfGames():e.getRandomSetOfCategories(a)},getRandomSetOfCategories:function(t,a=10){var n=[],o=[];for(t.length<a&&(a=t.length);n.length<a;){var r=this.getRandomNumber(t.length-1);-1===n.indexOf(r)&&n.push(r)}n.forEach(e=>{o.push(t[e])}),e.getRecordsFromCategoryArray(o)},getRecordsFromCategoryArray:function(t){var a=[];t.forEach(t=>a.push(e.getRecordFromCategoryObj(t))),Promise.all(a).then(()=>{0===(t=t.filter(e=>e.wr)).length?e.getRandomGroupOfGames():e.parseVideoInfo(t)})},getRecordFromCategoryObj:function(e){var t=new Promise((t,a)=>{const n=new XMLHttpRequest;var o="https://www.speedrun.com/api/v1/categories/"+e.id+"/records?top=1";n.open("GET",o),n.onload=(()=>t(JSON.parse(n.responseText).data[0])),n.onerror=(()=>a(n.statusText)),n.send()});return t.then(t=>{e.wr=t.runs.length>0&&t.runs[0].run.videos?t.runs[0].run:null}),t},parseVideoInfo:function(t){t.forEach(t=>t.videoHost=e.ytRegEx.test(t.wr.videos.links[0].uri)?"youtube":!!e.twitchRegEx.test(t.wr.videos.links[0].uri)&&"twitch"),0===(t=t.filter(e=>e.videoHost)).length?e.getRandomGroupOfGames():e.cleanCategoryObject(t[e.getRandomNumber(t.length-1)])},cleanCategoryObject:function(t){var a={};a.gameID=t.game.data.id,a.gameTitle=t.game.data.names.international?t.game.data.names.international:t.game.data.names.japanese,a.categoryID=t.id,a.categoryName=t.name,a.runID=t.wr.id,t.wr.times.primary_t===t.wr.times.ingame_t?(a.timingMethod="IGT",a.runtime=t.wr.times.ingame_t):t.wr.times.primary_t===t.wr.times.realtime_t?(a.timingMethod="RTA",a.runtime=t.wr.times.realtime_t):(a.timingMethod="RTA (No Loads)",a.runtime=t.wr.times.realtime_noloads_t),a.src=t.weblink,a.videoURL=t.wr.videos.links[0].uri,a.players=t.wr.players,e.getAllPlayersInfo(a)},getAllPlayersInfo:function(t){var a=[];t.players.forEach(t=>a.push("guest"!==t.rel?e.getPlayerInfo(t):t)),Promise.all(a).then(()=>{null===e.displayedRun?(e.displayedRun=t,window.location.hash=encodeURIComponent(e.displayedRun.runID)):e.backupRuns.push(t),e.backupRuns.length<e.targetNumOfBackups&&e.getRandomGroupOfGames()})},getPlayerInfo:function(e){var t=new Promise((t,a)=>{const n=new XMLHttpRequest;var o=e.uri;n.open("GET",o),n.onload=(()=>t(JSON.parse(n.responseText).data)),n.onerror=(()=>a(n.statusText)),n.send()});return t.then(t=>{e.name=t.names.japanese?t.names.japanese:t.names.international,e.src=t.weblink?t.weblink:null,e.twitch=t.twitch?t.twitch.uri:null,e.twitter=t.twitter?t.twitter.uri:null,e.youtube=t.youtube?t.youtube.uri:null}),t},getNextRun:function(){e.displayedRun=null,e.backupRuns.length>0&&(e.displayedRun=e.backupRuns.shift(),window.location.hash=encodeURIComponent(e.displayedRun.runID),e.backupRuns.length===e.targetNumOfBackups-1&&e.getRandomGroupOfGames())},getRunFromHash:function(){var t=decodeURIComponent(window.location.hash).slice(1),a=new Promise((e,a)=>{const n=new XMLHttpRequest;var o="https://www.speedrun.com/api/v1/runs/"+t+"?embed=game,category,players";n.open("GET",o),n.onload=(()=>e(JSON.parse(n.responseText).data)),n.onerror=(()=>a(n.statusText)),n.send()});return a.then(t=>{e.parseRunFromHash(t)}),a},parseRunFromHash:function(t){var a={};a.gameID=t.game.data.id,a.gameTitle=t.game.data.names.international?t.game.data.names.international:t.game.data.names.japanese,a.categoryID=t.category.data.id,a.categoryName=t.category.data.name,a.runID=t.id,t.times.primary_t===t.times.ingame_t?(a.timingMethod="IGT",a.runtime=t.times.ingame_t):t.times.primary_t===t.times.realtime_t?(a.timingMethod="RTA",a.runtime=t.times.realtime_t):(a.timingMethod="RTA (No Loads)",a.runtime=t.times.realtime_noloads_t),a.src=t.category.data.weblink,a.videoURL=t.videos.links[0].uri,a.players=[],t.players.data.forEach((e,t)=>{a.players.push({}),a.players[t].name=e.names.japanese?e.names.japanese:e.names.international,a.players[t].src=e.weblink?e.weblink:null,a.players[t].twitch=e.twitch?e.twitch.uri:null,a.players[t].twitter=e.twitter?e.twitter.uri:null,a.players[t].youtube=e.youtube?e.youtube.uri:null}),null===e.displayedRun?(e.displayedRun=a,window.location.hash=encodeURIComponent(e.displayedRun.runID)):e.backupRuns.push(a),e.backupRuns.length<e.targetNumOfBackups&&e.getRandomGroupOfGames()},getRandomNumber:function(e){return Math.floor(Math.random()*(e+1))}},created:function(){this.getTotalNumOfGames()},mounted:function(){window.location.hash&&this.getRunFromHash()}})},Vue.component("player-info",{props:["player"],template:' <div>                    <a v-if="player.src" :href="player.src"><h3>{{ player.name }}</h3></a>                    <h3 v-else>{{ player.name }}</h3>                                        <a v-if="player.twitch" :href="player.twitch"><p>Twitch</p></a>                    <p v-else>No Twitch</p>                                        <a v-if="player.youtube" :href="player.youtube"><p>YouTube</p></a>                    <p v-else>No YouTube</p>                                        <a v-if="player.twitter" :href="player.twitter"><p>Twitter</p></a>                    <p v-else>No Twitter</p>                </div>'}),Vue.component("players-info",{props:["players"],template:' <section class="l-players-info">                    <player-info v-for="player in players" :player="player" :key="player.id"></player-info>                </section>'}),Vue.component("video-embed",{props:["video-url"],data:function(){return{ytRegEx:/(?:(?:youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+)/i,twitchRegEx:/(?:twitch\.tv\/(?:\w{3,15}\/v\/)|(?:videos\/))(\d+)/i}},computed:{videoHost:function(){return this.ytRegEx.test(this.videoUrl)?"youtube":"twitch"},videoID:function(){return"youtube"===this.videoHost?this.ytRegEx.exec(this.videoUrl)[1].replace(/&/,"?").replace(/t=/,"start="):this.twitchRegEx.exec(this.videoUrl)[1]},videoURL:function(){var e="";return"youtube"===this.videoHost?(e="https://www.youtube.com/embed/"+this.videoID,this.videoID.includes("?")?e+="&autoplay=1":e+="?autoplay=1"):e="https://player.twitch.tv/?video=v"+this.videoID,e}},template:'<section class="video-embed">                    <iframe v-if="videoHost === \'youtube\'" :src="videoURL"                    frameborder="0"                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"                    allowfullscreen="true"></iframe>                                        <iframe v-else :src="videoURL"                    frameborder="0"                    scrolling="no"                    allowfullscreen="true">                    </iframe>                </section>'}),Vue.component("wr-button",{props:["isButtonDisabled"],methods:{emitButtonClicked:function(){this.$emit("button-clicked")}},template:' <section class="l-wr-button">                    <button type="button" :disabled="isButtonDisabled" @click="emitButtonClicked">                        <p>Get WR</p>                    </button>                </section>'}),Vue.component("wr-info",{props:["wr-info"],data:function(){return{urlToCopy:!1}},computed:{formattedRuntime:function(){var e=this.wrInfo.runtime,t=Math.floor(e/3600),a=Math.floor((e-3600*t)/60),n=e-3600*t-60*a;return t<10&&(t="0"+t),a<10&&(a="0"+a),n%1!=0&&(n=n.toFixed(3)),n<10&&(n="0"+n),t+":"+a+":"+n},windowLocationHref:function(){return window.location.hostname+":"+window.location.port+"/#"+this.wrInfo.runID}},methods:{copyURLToClipboard:function(){this.urlToCopy=!0,this.$refs.urlTextArea.select(),document.execCommand("copy"),this.urlToCopy=!1}},template:'<section class="wr-info">                    <h2><a :href="wrInfo.src">{{ wrInfo.gameTitle }} - {{ wrInfo.categoryName }}</a> in {{  formattedRuntime }} ({{ wrInfo.timingMethod }})</h2>                    <button type="button" @click="copyURLToClipboard">Copy URL</button>                    <textarea ref="urlTextArea" style="height: 0">{{ windowLocationHref }}</textarea>                </section>'});