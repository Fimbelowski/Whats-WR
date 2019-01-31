window.onload=function(){var e=new Vue({el:"#main",data:{totalNumOfGamesStartingOffset:15e3,totalNumOfGames:0,displayedRun:null,backupRuns:[],targetNumOfBackups:3,idleTimeoutDuration:15,pageIsIdle:!1,ytRegEx:/(?:(?:youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+)/i,twitchRegEx:/(?:twitch\.tv\/(?:\w{3,15}\/v\/)|(?:videos\/))(\d+)/i},computed:{wrInfo:function(){return{gameTitle:this.displayedRun.gameTitle,categoryName:this.displayedRun.categoryName,runtime:this.displayedRun.runtime,timingMethod:this.displayedRun.timingMethod,src:this.displayedRun.src,runID:this.displayedRun.runID}}},methods:{getTotalNumOfGames:function(){new Promise((e,t)=>{const a=new XMLHttpRequest;var o="https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset="+this.totalNumOfGamesStartingOffset;a.open("GET",o),a.onload=(()=>e(JSON.parse(a.responseText).data)),a.onerror=(()=>t(a.statusText)),a.send()}).then(t=>{t.length<1e3?(e.totalNumOfGames=e.totalNumOfGamesStartingOffset+t.length,window.location.hash?e.getRunFromHash():e.fillRemainingBackups()):(e.totalNumOfGamesStartingOffset+=1e3,e.getTotalNumOfGames())}).catch(t=>{window.setTimeout(function(){e.getTotalNumOfGames()},1e3)})},fillRemainingBackups:function(){for(var t=0;t<e.targetNumOfBackups-e.backupRuns.length;t++)e.getRandomGroupOfGames()},getRandomGroupOfGames:function(){new Promise((e,t)=>{const a=new XMLHttpRequest;var o="https://www.speedrun.com/api/v1/games?offset="+this.getRandomNumber(this.totalNumOfGames-19)+"&embed=categories.game";a.open("GET",o),a.onload=(()=>e(JSON.parse(a.responseText).data)),a.onerror=(()=>t(a.statusText)),a.send()}).then(t=>{e.extractCategories(t)}).catch(t=>{window.setTimeout(function(){e.getRandomGroupOfGames()},1e3)})},extractCategories:function(t){var a=[].concat.apply([],t.map(e=>e.categories.data));0===(a=a.filter(e=>"per-game"===e.type)).length?e.getRandomGroupOfGames():e.getRandomSetOfCategories(a)},getRandomSetOfCategories:function(t,a=10){var o=[],n=[];for(t.length<a&&(a=t.length);o.length<a;){var i=this.getRandomNumber(t.length-1);-1===o.indexOf(i)&&o.push(i)}o.forEach(e=>{n.push(t[e])}),e.getRecordsFromCategoryArray(n)},getRecordsFromCategoryArray:function(t){var a=[];t.forEach(t=>a.push(e.getRecordFromCategoryObj(t))),Promise.all(a).then(()=>{0===(t=t.filter(e=>e.wr)).length?e.getRandomGroupOfGames():e.parseVideoInfo(t)})},getRecordFromCategoryObj:function(t){var a=new Promise((e,a)=>{const o=new XMLHttpRequest;var n="https://www.speedrun.com/api/v1/categories/"+t.id+"/records?top=1";o.open("GET",n),o.onload=(()=>e(JSON.parse(o.responseText).data[0])),o.onerror=(()=>a(o.statusText)),o.send()});return a.then(e=>{t.wr=e.runs.length>0&&e.runs[0].run.videos?e.runs[0].run:null}).catch(a=>{window.setTimeout(function(){e.getRecordFromCategoryObj(t)},1e3)}),a},parseVideoInfo:function(t){t.forEach(t=>t.videoHost=e.ytRegEx.test(t.wr.videos.links[0].uri)?"youtube":!!e.twitchRegEx.test(t.wr.videos.links[0].uri)&&"twitch"),0===(t=t.filter(e=>e.videoHost)).length?e.getRandomGroupOfGames():(e.cleanCategoryObject(t[e.getRandomNumber(t.length-1)]),e.pageIsIdle=!1)},cleanCategoryObject:function(t){var a={};a.gameID=t.game.data.id,a.gameTitle=t.game.data.names.international?t.game.data.names.international:t.game.data.names.japanese,a.categoryID=t.id,a.categoryName=t.name,a.runID=t.wr.id,t.wr.times.primary_t===t.wr.times.ingame_t?(a.timingMethod="IGT",a.runtime=t.wr.times.ingame_t):t.wr.times.primary_t===t.wr.times.realtime_t?(a.timingMethod="RTA",a.runtime=t.wr.times.realtime_t):(a.timingMethod="RTA (No Loads)",a.runtime=t.wr.times.realtime_noloads_t),a.src=t.weblink,a.videoURL=t.wr.videos.links[0].uri,a.players=t.wr.players,e.getAllPlayersInfo(a)},getAllPlayersInfo:function(t){var a=[];t.players.forEach(t=>a.push("guest"!==t.rel?e.getPlayerInfo(t):t)),Promise.all(a).then(()=>{null===e.displayedRun?(e.displayedRun=t,window.location.hash=encodeURIComponent(e.displayedRun.runID),e.getRandomGroupOfGames()):e.backupRuns.push(t)})},getPlayerInfo:function(t){var a=new Promise((e,a)=>{const o=new XMLHttpRequest;var n=t.uri;o.open("GET",n),o.onload=(()=>e(JSON.parse(o.responseText).data)),o.onerror=(()=>a(o.statusText)),o.send()});return a.then(e=>{t.name=e.names.japanese?e.names.japanese:e.names.international,t.src=e.weblink?e.weblink:null,t.twitch=e.twitch?e.twitch.uri:null,t.twitter=e.twitter?e.twitter.uri:null,t.youtube=e.youtube?e.youtube.uri:null}).catch(a=>{window.setTimeout(function(){e.getPlayerInfo(t)},1e3)}),a},getNextRun:function(){e.displayedRun=null,e.backupRuns.length>0?(e.displayedRun=e.backupRuns.shift(),window.location.hash=encodeURIComponent(e.displayedRun.runID),e.getRandomGroupOfGames()):e.startIdleTimeout(e.idleTimeoutDuration)},getRunFromHash:function(){var t=decodeURIComponent(window.location.hash).slice(1),a=new Promise((e,a)=>{const o=new XMLHttpRequest;var n="https://www.speedrun.com/api/v1/runs/"+t+"?embed=game,category,players";o.open("GET",n),o.onload=(()=>e(JSON.parse(o.responseText).data)),o.onerror=(()=>a(o.statusText)),o.send()});return a.then(t=>{e.pageIsIdle=!1,e.parseRunFromHash(t)}).catch(t=>{window.setTimeout(function(){e.getRunFromHash()},1e3)}),a},parseRunFromHash:function(t){var a={};a.gameID=t.game.data.id,a.gameTitle=t.game.data.names.international?t.game.data.names.international:t.game.data.names.japanese,a.categoryID=t.category.data.id,a.categoryName=t.category.data.name,a.runID=t.id,t.times.primary_t===t.times.ingame_t?(a.timingMethod="IGT",a.runtime=t.times.ingame_t):t.times.primary_t===t.times.realtime_t?(a.timingMethod="RTA",a.runtime=t.times.realtime_t):(a.timingMethod="RTA (No Loads)",a.runtime=t.times.realtime_noloads_t),a.src=t.category.data.weblink,a.videoURL=t.videos.links[0].uri,a.players=[],t.players.data.forEach((e,t)=>{a.players.push({}),"guest"===e.rel?a.players[t].name=e.name:(a.players[t].name=e.names.japanese?e.names.japanese:e.names.international,a.players[t].src=e.weblink?e.weblink:null,a.players[t].twitch=e.twitch?e.twitch.uri:null,a.players[t].twitter=e.twitter?e.twitter.uri:null,a.players[t].youtube=e.youtube?e.youtube.uri:null)}),null===e.displayedRun?(e.displayedRun=a,window.location.hash=encodeURIComponent(e.displayedRun.runID)):e.backupRuns.push(a),e.fillRemainingBackups()},getRandomNumber:function(e){return Math.floor(Math.random()*(e+1))},startIdleTimeout:function(t){setTimeout(function(){e.displayedRun||(e.pageIsIdle=!0)},1e3*t)}},created:function(){this.getTotalNumOfGames(),this.startIdleTimeout(this.idleTimeoutDuration)}})},Vue.component("player-info-container",{props:["players"],computed:{playersHeader:function(){return 1===this.players.length?"Runner":"Runners"}},template:' <section class="player-info-container">                    <div class="player-info-container-header">                        <h3 class="player-text">{{ playersHeader }}</h3>                    </div>                    <player-info v-for="player in players" :player="player" :key="player.id"></player-info>                </section>'}),Vue.component("player-info",{props:["player"],computed:{hasSocial:function(){return this.player.twitch||this.player.youtube||this.player.twitter}},template:' <div class="player-info">                    <a v-if="player.src" :href="player.src"><h3 class="player-text">{{ player.name }}</h3></a>                    <h3 v-else class="player-text">{{ player.name }}</h3>                    <div v-if="hasSocial" class="player-social-container">                        <a v-if="player.twitch" :href="player.twitch"><img src="/dist/images/Glitch_White_RGB.png" class="player-social-icon"></a>                                                <a v-if="player.youtube" :href="player.youtube"><img src="/dist/images/yt_icon_mono_dark.png" class="player-social-icon"></a>                                                <a v-if="player.twitter" :href="player.twitter"><img src="/dist/images/Twitter_Logo_White.png" class="player-social-icon"></a>                    </div>                </div>'}),Vue.component("video-embed",{props:["video-url"],data:function(){return{ytRegEx:/(?:(?:youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+)/i,twitchRegEx:/(?:twitch\.tv\/(?:\w{3,15}\/v\/)|(?:videos\/))(\d+)/i}},computed:{videoHost:function(){return this.ytRegEx.test(this.videoUrl)?"youtube":"twitch"},videoID:function(){return"youtube"===this.videoHost?this.ytRegEx.exec(this.videoUrl)[1].replace(/&/,"?").replace(/t=/,"start="):this.twitchRegEx.exec(this.videoUrl)[1]},videoURL:function(){var e="";return"youtube"===this.videoHost?(e="https://www.youtube.com/embed/"+this.videoID,this.videoID.includes("?")?e+="&autoplay=1":e+="?autoplay=1"):e="https://player.twitch.tv/?video=v"+this.videoID,e}},template:' <section class="video-embed-container">                    <iframe v-if="videoHost === \'youtube\'" class="video-embed" :src="videoURL"                    frameborder="0"                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"                    allowfullscreen="true"></iframe>                                        <iframe v-else class="video-embed" :src="videoURL"                    frameborder="0"                    scrolling="no"                    allowfullscreen="true">                    </iframe>                </section>'}),Vue.component("wr-button",{props:["isButtonDisabled"],methods:{emitButtonClicked:function(){this.$emit("button-clicked")}},template:' <section class="wr-button-container">                    <button type="button" :disabled="isButtonDisabled" @click="emitButtonClicked" class="wr-button">                        <h1 class="wr-button-text">What\'s WR?</h1>                    </button>                </section>'}),Vue.component("wr-info",{props:["wr-info"],data:function(){return{urlToCopy:!1,showTooltip:!1,tooltipClicked:!1}},computed:{formattedRuntime:function(){var e=this.wrInfo.runtime,t=Math.floor(e/3600),a=Math.floor((e-3600*t)/60),o=e-3600*t-60*a;return t<10&&(t="0"+t),a<10&&(a="0"+a),o%1!=0&&(o=o.toFixed(3)),o<10&&(o="0"+o),t+":"+a+":"+o},windowLocationHref:function(){return window.location.hostname+":"+window.location.port+"/#"+this.wrInfo.runID},tooltipMessage:function(){return this.tooltipClicked?"URL Copied!":"Click here to copy the current run to your clipboard!"},tooltipContainerStyleObj:function(){return{width:this.tooltipClicked?"80px":"320px",marginLeft:this.tooltipClicked?"-40px":"-160px"}}},methods:{copyURLToClipboard:function(){this.urlToCopy=!0,this.$refs.urlTextArea.select(),document.execCommand("copy"),this.urlToCopy=!1}},template:'<section class="wr-info-container">                    <h2 class="wr-info-text"><a :href="wrInfo.src">{{ wrInfo.gameTitle }} - {{ wrInfo.categoryName }}</a> in {{  formattedRuntime }} ({{ wrInfo.timingMethod }})</h2>                    <div class="tooltip" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false; tooltipClicked = false" @click="tooltipClicked = true">                        <img class="copy-url-button" src="dist/images/link.png" @click="copyURLToClipboard">                        <div class="tooltip-container" :style="tooltipContainerStyleObj" v-if="showTooltip">                            <p>{{ tooltipMessage }}</p>                        </div>                    </div>                    <textarea ref="urlTextArea" class="url-text-area">{{ windowLocationHref }}</textarea>                </section>'});