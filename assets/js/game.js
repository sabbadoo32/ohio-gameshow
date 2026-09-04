function initGame(BANK){
  "use strict";
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var ROUNDS=Math.min(6,BANK.length);
  var SEEN_KEY='fv_seen_v1';

  // ---------- host banter ----------
  var LINES={
    intro:["Welcome to the only game where the house is a <b>billionaire</b>! Let's play!",
           "Step right up! Every spin's a loser — just like his promises. Round one!",
           "You brought your tax dollars? <b>Adorable.</b> Let's give them away!"],
    pre:["Fact… or <b>Fiction</b>? Trust your gut. Your gut is about to cost you.",
         "Read it careful now. Lock in your answer!",
         "Here's your claim. What's it gonna be, contestant?"],
    guess:["Locking it in! Now give that wheel a spin!",
           "Bold choice! The wheel decides your wallet's fate…",
           "Ooh, confident! Let's see what the house says."],
    lossSmall:["Only a few hundred? He's just getting warmed up.",
               "Small loss. He'll make it up in volume, trust me.",
               "A little off the top for the house!"],
    lossBig:["<b>Ouch!</b> The house cleans up again!",
             "Big spin, bigger loss — for you!",
             "That's a chunk of your schools, folks!"],
    houseAll:["<b>HOUSE TAKES ALL!</b> He loves that wedge.",
              "And it's GONE. The house thanks you for your service."],
    rightGuess:["You nailed the fact… and lost anyway. <b>That's</b> the game!",
                "Correct! Doesn't matter one bit. Spin's a spin!"],
    wrongGuess:["Fell for the spin! Don't feel bad — that's the whole plan.",
                "Wrong! His talking points got you. They usually do."],
    outroBroke:["Cleaned out! <b>He always wins.</b>","Wallet: empty. Him: richer. Any of this sound familiar?"],
    outro:["And that's our show! The house went home richer. <b>Every time.</b>","Thanks for playing the rigged game. He'll see you at the ballot box."]
  };
  var lastLine={};
  function say(pool){var arr=LINES[pool],i;do{i=Math.floor(Math.random()*arr.length);}while(arr.length>1&&i===lastLine[pool]);lastLine[pool]=i;return arr[i];}
  function host(pool){document.getElementById('hostBubble').innerHTML=say(pool);}

  // ---------- audio (Web Audio, asset-free) ----------
  var actx=null, musicOn=false, musicTimer=null, musicStep=0;
  function ac(){ if(!actx){try{actx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}} if(actx&&actx.state==='suspended')actx.resume(); return actx; }
  function beep(freq,dur,type,vol){ var c=ac(); if(!c)return; var o=c.createOscillator(),g=c.createGain();
    o.type=type||'square'; o.frequency.value=freq; g.gain.value=0; o.connect(g); g.connect(c.destination);
    var t=c.currentTime; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol||0.06,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.start(t); o.stop(t+dur+0.02); }
  function sfxDing(){ beep(880,0.12,'square',0.07); setTimeout(function(){beep(1320,0.16,'square',0.07);},90); }
  function sfxBuzz(){ beep(150,0.35,'sawtooth',0.08); }
  var tickTimer=null;
  function startTicks(ms){ stopTicks(); var d=280; tickTimer=setInterval(function(){ beep(1200,0.03,'square',0.04); if(d<900){d+=40;} },140); setTimeout(stopTicks,ms); }
  function stopTicks(){ if(tickTimer){clearInterval(tickTimer);tickTimer=null;} }
  // simple synth music loop
  var BASS=[110,110,146.8,110,164.8,146.8,110,98];
  function musicTick(){ var f=BASS[musicStep%BASS.length]; beep(f,0.16,'triangle',0.05); if(musicStep%2===0)beep(f*2,0.08,'square',0.02); musicStep++; }
  function startMusic(){ if(!ac())return; musicOn=true; if(!musicTimer)musicTimer=setInterval(musicTick,260); }
  function stopMusic(){ musicOn=false; if(musicTimer){clearInterval(musicTimer);musicTimer=null;} }
  var musicBtn=document.getElementById('musicBtn');
  try{ if(localStorage.getItem('fv_music')==='on'){/* wait for gesture */} }catch(e){}
  musicBtn.addEventListener('click',function(){ if(musicOn){stopMusic();musicBtn.setAttribute('aria-pressed','false');try{localStorage.setItem('fv_music','off');}catch(e){}} else {startMusic();musicBtn.setAttribute('aria-pressed','true');try{localStorage.setItem('fv_music','on');}catch(e){}} });

  // ---------- wheel (every wedge loses) ----------
  var WEDGES=[{amt:500,label:"$500"},{amt:1500,label:"$1,500"},{amt:750,label:"$750"},{amt:2000,label:"$2,000"},
    {amt:1000,label:"$1,000"},{amt:3000,label:"HOUSE\nTAKES ALL"},{amt:1250,label:"$1,250"},{amt:900,label:"$900"}];
  var COLORS=['#1c2740','#e0454f','#1c2740','#3a6fe0','#1c2740','#f4b301','#1c2740','#3a6fe0'];
  var N=WEDGES.length,STEP=360/N,cx=100,cy=100,r=100,ns='http://www.w3.org/2000/svg';
  function pt(a,rad){var x=(a-90)*Math.PI/180;return[cx+rad*Math.cos(x),cy+rad*Math.sin(x)];}
  var svg=document.getElementById('wheel');
  WEDGES.forEach(function(w,i){var s=i*STEP,e=(i+1)*STEP,p0=pt(s,r),p1=pt(e,r);
    var path=document.createElementNS(ns,'path');
    path.setAttribute('d','M'+cx+' '+cy+' L'+p0[0]+' '+p0[1]+' A'+r+' '+r+' 0 0 1 '+p1[0]+' '+p1[1]+' Z');
    path.setAttribute('fill',COLORS[i]);path.setAttribute('stroke','#0b1020');path.setAttribute('stroke-width','1.2');svg.appendChild(path);
    var mid=s+STEP/2,lp=pt(mid,r*0.64),lines=w.label.split('\n');
    var text=document.createElementNS(ns,'text');text.setAttribute('x',lp[0]);text.setAttribute('y',lp[1]);
    text.setAttribute('fill',COLORS[i]==='#f4b301'?'#1a1205':'#fff');text.setAttribute('font-family',"'IBM Plex Mono',monospace");
    text.setAttribute('font-size',lines.length>1?'8':'11');text.setAttribute('font-weight','700');text.setAttribute('text-anchor','middle');
    text.setAttribute('transform','rotate('+mid+' '+lp[0]+' '+lp[1]+')');
    lines.forEach(function(ln,li){var ts=document.createElementNS(ns,'tspan');ts.setAttribute('x',lp[0]);ts.setAttribute('dy',li===0?(lines.length>1?-2:0):9);ts.textContent=ln;text.appendChild(ts);});
    svg.appendChild(text);});
  var bulbs=document.getElementById('bulbs');for(var b=0;b<28;b++){var el=document.createElement('i');el.style.animationDelay=(b*0.08)+'s';bulbs.appendChild(el);}

  // ---------- dynamic deck (no-repeat across plays) ----------
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function getSeen(){try{return JSON.parse(localStorage.getItem(SEEN_KEY)||'[]');}catch(e){return[];}}
  function setSeen(a){try{localStorage.setItem(SEEN_KEY,JSON.stringify(a));}catch(e){}}
  function buildDeck(){
    var seen=getSeen(); var fresh=BANK.filter(function(c){return seen.indexOf(c.id)===-1;});
    if(fresh.length<ROUNDS){ seen=[]; setSeen([]); fresh=BANK.slice(); }   // exhausted → reshuffle
    // rotate categories for variety
    var byCat={}; shuffle(fresh).forEach(function(c){(byCat[c.category]=byCat[c.category]||[]).push(c);});
    var cats=Object.keys(byCat), deck=[], i=0;
    while(deck.length<ROUNDS){ var cat=cats[i%cats.length]; if(byCat[cat].length)deck.push(byCat[cat].shift()); i++;
      if(i>200)break; }
    return deck.slice(0,ROUNDS);
  }

  // ---------- state ----------
  var pot=12000,house=0,deck=[],idx=0,rotation=0,spinning=false,guessed=null;
  var potV=document.getElementById('potV'),houseV=document.getElementById('houseV'),
      claimEl=document.getElementById('claim'),roundEl=document.getElementById('round'),catEl=document.getElementById('cat'),
      guessBox=document.getElementById('guess'),btnFact=document.getElementById('btnFact'),btnFiction=document.getElementById('btnFiction'),
      reveal=document.getElementById('reveal'),verdictEl=document.getElementById('verdict'),gresEl=document.getElementById('gres'),
      explEl=document.getElementById('expl'),lossEl=document.getElementById('loss'),srcEl=document.getElementById('src'),
      nextBtn=document.getElementById('nextBtn'),wheel=document.getElementById('wheel');
  var money=function(n){return '$'+Math.round(n).toLocaleString();};
  function tween(el,from,to,dur){ if(reduce){el.textContent=money(to);return;} var t0=null;
    function fr(t){if(!t0)t0=t;var p=Math.min((t-t0)/dur,1);el.textContent=money(from+(to-from)*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(fr);}
    requestAnimationFrame(fr); setTimeout(function(){el.textContent=money(to);},dur+80); }
  function flyMoney(){ if(reduce)return; var rect=houseV.getBoundingClientRect();
    for(var i=0;i<10;i++){(function(i){setTimeout(function(){var s=document.createElement('span');s.className='fly';s.textContent=Math.random()<.5?'💸':'$';
      s.style.left=(rect.left+Math.random()*rect.width)+'px';s.style.top=rect.top+'px';document.body.appendChild(s);setTimeout(function(){s.remove();},1500);},i*70);})(i);} }

  function showRound(){
    var c=deck[idx];
    roundEl.textContent='Round '+(idx+1)+' of '+ROUNDS;
    catEl.textContent=c.category;
    claimEl.textContent=c.claim;
    reveal.classList.remove('show');
    guessBox.style.display='';
    guessed=null;
    btnFact.disabled=false; btnFiction.disabled=false; btnFact.classList.remove('pick'); btnFiction.classList.remove('pick');
    host(idx===0?'intro':'pre');
  }

  function onGuess(e){
    if(guessed!==null||spinning)return;
    var btn=e.currentTarget; guessed=btn.getAttribute('data-val');
    btn.classList.add('pick'); btnFact.disabled=true; btnFiction.disabled=true;
    host('guess'); beep(660,0.08,'square',0.05);
    setTimeout(spin, reduce?150:650);
  }

  function spin(){
    if(spinning)return; spinning=true;
    var landed=Math.floor(Math.random()*N), turns=4+Math.floor(Math.random()*3);
    var target=turns*360+(360-(landed*STEP+STEP/2)); rotation+=target-(rotation%360);
    wheel.style.transform='rotate('+rotation+'deg)';
    var settle=reduce?600:4600; startTicks(settle);
    setTimeout(function(){
      stopTicks();
      var amt=WEDGES[landed].amt; if(amt>pot)amt=pot;
      var p0=pot,h0=house; pot-=amt; house+=amt;
      tween(potV,p0,pot,800); tween(houseV,h0,house,800); flyMoney(); sfxDing();
      var c=deck[idx], correct=(guessed===c.answer);
      verdictEl.className='verdict '+c.verdict; verdictEl.textContent=c.verdict;
      gresEl.className='gres '+(correct?'win':'lose');
      gresEl.textContent=correct?'✓ You guessed right — and lost anyway':'✗ You guessed wrong';
      explEl.textContent=c.explanation;
      lossEl.textContent='Wheel: '+WEDGES[landed].label.replace('\n',' ')+' → the house took '+money(amt)+' of your tax dollars.';
      srcEl.innerHTML='<span><a href="'+c.sourceUrl+'" target="_blank" rel="noopener">Read the source</a> <span class="pub">'+c.sourcePublisher+'</span></span>';
      reveal.classList.add('show');
      host(WEDGES[landed].amt>=3000?'houseAll':(amt>=1250?'lossBig':'lossSmall'));
      nextBtn.textContent=(idx+1<ROUNDS)?'Next round ▸':'See the damage ▸';
      // mark seen
      var seen=getSeen(); if(seen.indexOf(c.id)===-1){seen.push(c.id);setSeen(seen);}
      spinning=false;
    },settle);
  }

  function next(){
    idx++;
    if(idx<ROUNDS){ showRound(); document.getElementById('stage').scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}); }
    else{
      document.getElementById('stage').style.display='none';
      document.getElementById('scores').style.display='none';
      var end=document.getElementById('endcard'); end.classList.add('show');
      document.getElementById('endHost').innerHTML=say(pot<=0?'outroBroke':'outro');
      tween(document.getElementById('endTotal'),0,house,1000);
      if(house>0)sfxDing(); end.scrollIntoView({behavior:reduce?'auto':'smooth'});
    }
  }

  btnFact.addEventListener('click',onGuess); btnFiction.addEventListener('click',onGuess);
  nextBtn.addEventListener('click',next);
  document.getElementById('againBtn').addEventListener('click',function(){
    pot=12000;house=0;idx=0; potV.textContent=money(pot);houseV.textContent=money(house);
    deck=buildDeck();
    document.getElementById('endcard').classList.remove('show');
    document.getElementById('stage').style.display=''; document.getElementById('scores').style.display='';
    showRound(); window.scrollTo({top:0,behavior:'smooth'});
  });

  deck=buildDeck(); showRound();
}

fetch('data/claims.json').then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(initGame).catch(function(e){var b=document.getElementById('hostBubble');if(b)b.textContent='Could not load the questions. If viewing the file directly, run a local server (see README).';console.error('claims load failed:',e);});
