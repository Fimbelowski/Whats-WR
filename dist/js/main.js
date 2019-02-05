window.onload=function(){var e=new Vue({el:"#main",data:{totalNumOfGamesStartingOffset:15e3,totalNumOfGames:0,displayedRun:null,backupRuns:[],targetNumOfBackups:3,idleTimeoutDuration:15,pageIsIdle:!1,ytRegEx:/(?:(?:youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+)/i,twitchRegEx:/(?:twitch\.tv\/(?:\w{3,15}\/v\/)|(?:videos\/))(\d+)/i},computed:{wrInfo:function(){return e.displayedRun?{category:this.displayedRun.category,game:this.displayedRun.game,times:this.displayedRun.times}:null}},methods:{makeAsyncCall:function(e){return new Promise(function(t,a){const i=new XMLHttpRequest;i.open("GET",e),i.onload=(()=>{t(JSON.parse(i.responseText).data)}),i.onerror=(()=>{a({status:i.status,statusText:i.statusText})}),i.send()})},getTotalNumOfGames:function(){var t="https://www.speedrun.com/api/v1/games?_bulk=yes&max=1000&offset="+this.totalNumOfGamesStartingOffset;this.makeAsyncCall(t).then(t=>{t.length<1e3?(e.totalNumOfGames=e.totalNumOfGamesStartingOffset+t.length,e.getNewRun()):(e.totalNumOfGamesStartingOffset+=1e3,e.getTotalNumOfGames())}).catch(t=>{window.setTimeout(function(){e.getTotalNumOfGames()},1e3)})},getNewRun:function(){var t=[],a=null;e.getRandomGroupOfGames().then(a=>(t=a,t=(t=e.extractCategories(t)).filter(e=>"per-game"===e.type),t=e.getRandomSetOfCategories(t),e.getRecordsFromCategoryArray(t))).then(i=>(t.forEach((e,t)=>{var a=i[t][0];e.run=a.runs.length&&a.runs[0].run.videos?a.runs[0].run:null}),t=(t=t.filter(e=>e.run)).filter(t=>{var a=t.run.videos.links[0].uri;return e.twitchRegEx.test(a)||e.ytRegEx.test(a)}),a=t[e.getRandomNumber(t.length-1)],e.getAllPlayersInfo(a))).then(t=>{a.run.players.forEach((e,i)=>{a.run.players[i]=t[i]}),console.log(a);var i=a.run;i.game=a.game,i.category={name:a.name},e.displayedRun?e.backupRuns.push(i):e.setDisplayedRun(i)}).catch(()=>{})},getRandomGroupOfGames:function(){var t="https://www.speedrun.com/api/v1/games?offset="+this.getRandomNumber(this.totalNumOfGames-19)+"&embed=categories";return e.makeAsyncCall(t)},extractCategories:function(e){var t=[];return e.forEach(e=>{e.categories.data.forEach(a=>{var i=a;i.game={},i.game.id=e.id,i.game.names=e.names,t.push(i)})}),t},getRandomSetOfCategories:function(e,t=10){var a=[],i=[];for(e.length<t&&(t=e.length);a.length<t;){var n=this.getRandomNumber(e.length-1);-1===a.indexOf(n)&&a.push(n)}return a.forEach(t=>{i.push(e[t])}),i},getRecordsFromCategoryArray:function(t){var a=[];return t.forEach(t=>{var i="https://www.speedrun.com/api/v1/categories/"+t.id+"/records?top=1";a.push(e.makeAsyncCall(i))}),Promise.all(a)},setDisplayedRun:function(t){e.displayedRun=null,e.displayedRun=t,window.location.hash=encodeURIComponent(e.displayedRun.id)},checkVideoHost:function(t){t.videoHost=e.ytRegEx.test(t.wr.videos.links[0].uri)?"youtube":e.twitchRegEx.test(t.wr.videos.links[0].uri)?"twitch":null},cleanCategoryObject:function(t){var a={};a.gameID=t.game.data.id,a.gameTitle=t.game.data.names.international?t.game.data.names.international:t.game.data.names.japanese,a.categoryID=t.id,a.categoryName=t.name,a.runID=t.wr.id,e.parseTimingInfo(a,t.wr),a.src=t.weblink,a.videoURL=t.wr.videos.links[0].uri,a.players=t.wr.players,e.getAllPlayersInfo(a)},parseTimingInfo:function(e,t){t.times.primary_t===t.times.ingame_t?(e.timingMethod="IGT",e.runtime=t.times.ingame_t):t.times.primary_t===t.times.realtime_t?(e.timingMethod="RTA",e.runtime=t.times.realtime_t):(e.timingMethod="RTA (No Loads)",e.runtime=t.times.realtime_noloads_t)},getAllPlayersInfo:function(t){var a=[];return t.run.players.forEach(t=>{"guest"===t.rel?a.push(Promise.resolve(t)):a.push(e.makeAsyncCall(t.uri))}),Promise.all(a)},parsePlayerInfo:function(e,t){e.name="guest"===t.rel?t.name:t.names.japanese?t.names.japanese:t.names.international,e.src=t.weblink?t.weblink:null,e.twitch=t.twitch?t.twitch.uri:null,e.twitter=t.twitter?t.twitter.uri:null,e.youtube=t.youtube?t.youtube.uri:null},getNextRun:function(){e.displayedRun=null,e.backupRuns.length?(e.displayedRun=e.backupRuns.shift(),window.location.hash=encodeURIComponent(e.displayedRun.runID),e.getRandomGroupOfGames()):e.startIdleTimeout(e.idleTimeoutDuration)},getRunFromHash:function(){var t=decodeURIComponent(window.location.hash).slice(1),a=new Promise((e,a)=>{const i=new XMLHttpRequest;var n="https://www.speedrun.com/api/v1/runs/"+t+"?embed=game,category,players";i.open("GET",n),i.onload=(()=>e(JSON.parse(i.responseText).data)),i.onerror=(()=>a(i.statusText)),i.send()});return a.then(t=>{e.pageIsIdle=!1,e.parseRunFromHash(t)}).catch(t=>{window.setTimeout(function(){e.getRunFromHash()},1e3)}),a},parseRunFromHash:function(t){var a={};a.gameID=t.game.data.id,a.gameTitle=t.game.data.names.international?t.game.data.names.international:t.game.data.names.japanese,a.categoryID=t.category.data.id,a.categoryName=t.category.data.name,a.runID=t.id,e.parseTimingInfo(a,t),a.src=t.category.data.weblink,a.videoURL=t.videos.links[0].uri,a.players=[],t.players.data.forEach((t,i)=>{a.players.push({}),e.parsePlayerInfo(a.players[i],t)}),e.displayedRun=a,e.getTotalNumOfGames()},getRandomNumber:function(e){return Math.floor(Math.random()*(e+1))},startIdleTimeout:function(t){setTimeout(function(){e.displayedRun||(e.pageIsIdle=!0)},1e3*t)}},created:function(){window.location.hash?this.getRunFromHash():this.getTotalNumOfGames(),this.startIdleTimeout(this.idleTimeoutDuration)}})},Vue.component("player-info-container",{props:["players"],computed:{playersHeader:function(){return 1===this.players.length?"Runner":"Runners"}},template:' <section class="player-info-container">                    <div class="player-info-container-header">                        <h3 class="player-text">{{ playersHeader }}</h3>                    </div>                    <player-info v-for="player in players" :player="player" :key="player.id"></player-info>                </section>'}),Vue.component("player-info",{props:["player"],computed:{name:function(){return this.player.names.japanese&&this.player.names.international?this.player.names.japanese+" ("+this.player.names.international+")":this.player.names.japanese?this.player.names.japanese:this.player.names.international},hasSocial:function(){return!!(this.player.twitch||this.player.youtube||this.player.twitter)}},template:' <div class="player-info">                    <a v-if="player.weblink" :href="player.weblink"><h3 class="player-text">{{ name }}</h3></a>                    <h3 v-else class="player-text">{{ name }}</h3>                    <div v-if="hasSocial" class="player-social-container">                        <a v-if="player.twitch" :href="player.twitch.uri"><img src="/dist/images/Glitch_White_RGB.png" class="player-social-icon"></a>                                                <a v-if="player.youtube" :href="player.youtube.uri"><img src="/dist/images/yt_icon_mono_dark.png" class="player-social-icon"></a>                                                <a v-if="player.twitter" :href="player.twitter.uri"><img src="/dist/images/Twitter_Logo_White.png" class="player-social-icon"></a>                    </div>                </div>'}),Vue.component("video-embed",{props:["videos"],data:function(){return{ytRegEx:/(?:(?:youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+)/i,twitchRegEx:/(?:twitch\.tv\/(?:\w{3,15}\/v\/)|(?:videos\/))(\d+)/i}},computed:{videoHost:function(){return this.ytRegEx.test(this.videos.links[0].uri)?"youtube":"twitch"},videoID:function(){return"youtube"===this.videoHost?this.ytRegEx.exec(this.videos.links[0].uri)[1].replace(/&/,"?").replace(/t=/,"start="):this.twitchRegEx.exec(this.videos.links[0].uri)[1]},videoURL:function(){var e="";return"youtube"===this.videoHost?(e="https://www.youtube.com/embed/"+this.videoID,this.videoID.includes("?")?e+="&autoplay=1":e+="?autoplay=1"):e="https://player.twitch.tv/?video=v"+this.videoID,e}},template:' <section class="video-embed-container">                    <iframe v-if="videoHost === \'youtube\'" class="video-embed" :src="videoURL"                    frameborder="0"                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"                    allowfullscreen="true"></iframe>                                        <iframe v-else class="video-embed" :src="videoURL"                    frameborder="0"                    scrolling="no"                    allowfullscreen="true">                    </iframe>                </section>'}),Vue.component("wr-button",{methods:{emitButtonClicked:function(){this.$emit("button-clicked")}},template:' <section class="wr-button-container">                    <button type="button" @click="emitButtonClicked" class="wr-button">                        <h1 class="wr-button-text">What\'s WR?</h1>                    </button>                </section>'}),Vue.component("wr-info",{props:["wr-info"],data:function(){return{urlToCopy:!1,showTooltip:!1,tooltipClicked:!1}},computed:{gameTitle:function(){return this.wrInfo.game.names.japanese?this.wrInfo.game.names.japanese:this.wrInfo.game.names.international},primaryTimingMethod:function(){return this.wrInfo.times.primary_t===this.wrInfo.times.ingame_t?"IGT":this.wrInfo.times.primary_t===this.wrInfo.times.realtime_t?"RTA":"RTA (No Loads)"},formattedRuntime:function(){var e=this.wrInfo.times.primary_t,t=Math.floor(e/3600),a=Math.floor((e-3600*t)/60),i=e-3600*t-60*a;return t<10&&(t="0"+t),a<10&&(a="0"+a),i%1!=0&&(i=i.toFixed(3)),i<10&&(i="0"+i),t+":"+a+":"+i},windowLocationHref:function(){return window.location.hostname+":"+window.location.port+"/#"+this.wrInfo.runID},tooltipMessage:function(){return this.tooltipClicked?"URL Copied!":"Click here to copy the current run to your clipboard!"},tooltipContainerStyleObj:function(){return{width:this.tooltipClicked?"80px":"320px",marginLeft:this.tooltipClicked?"-40px":"-160px"}}},methods:{copyURLToClipboard:function(){this.urlToCopy=!0,this.$refs.urlTextArea.select(),document.execCommand("copy"),this.urlToCopy=!1}},template:'<section class="wr-info-container">                    <h2 class="wr-info-text"><a :href="wrInfo.src">{{ gameTitle }} - {{ wrInfo.category.name }}</a> in {{ formattedRuntime }} ({{ primaryTimingMethod }})</h2>                    <div class="tooltip" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false; tooltipClicked = false" @click="tooltipClicked = true">                        <img class="copy-url-button" src="dist/images/link.png" @click="copyURLToClipboard">                        <div class="tooltip-container" :style="tooltipContainerStyleObj" v-if="showTooltip">                            <p>{{ tooltipMessage }}</p>                        </div>                    </div>                    <textarea ref="urlTextArea" class="url-text-area">{{ windowLocationHref }}</textarea>                </section>'});