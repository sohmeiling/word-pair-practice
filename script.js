'use strict';
(() => {
  const KEY = 'memory-lab-word-pairs-v1', VERSION = 1;
  const pairs = window.MEMORY_PAIRS, app = document.getElementById('app');
  const timing = { study:6, retrieval:6, feedback:2, restudy:8, final:6 };
  let state = null, saved = null, timer = null, storageOK = true;
  const now = () => Date.now();
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const random = n => {const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n;};
  const shuffle = values => {const a=[...values];for(let i=a.length-1;i>0;i--){const j=random(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
  const normalize = value => String(value).normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const condition = id => (id%2 === (state.counterbalance==='A'?0:1)) ? 'retrieval' : 'restudy';
  const current = () => state.trials[state.index];
  function save() {
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;}
    const warning=document.getElementById('storage-warning');
    if(warning)warning.textContent=storageOK?'':'Browser saving is unavailable. Keep this page open and download a backup before leaving.';
  }
  function shell(html) {
    clearInterval(timer);timer=null;
    app.innerHTML=html+'<p id="storage-warning" class="small saving" role="status"></p>';
    if(!storageOK)document.getElementById('storage-warning').textContent='Browser saving is unavailable. Download a backup before leaving.';
    app.focus();
  }
  const action=(id,fn)=>document.getElementById(id).addEventListener('click',fn);
  function download(content,type,name) {
    const url=URL.createObjectURL(new Blob([content],{type}));
    const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function backup(){download(JSON.stringify(state,null,2),'application/json',`retrieval-practice-${state.id}.json`);}
  function welcome() {
    const urlVersion=new URLSearchParams(location.search).get('version');
    shell(`<p class="eyebrow">Lecture 6 · Learning & memory</p><h1>Can you remember<br>the other word?</h1>
      <p class="lead">Learn 24 word pairs, practise them in two different ways, and discover what you remember later.</p>
      <div class="steps"><div class="step"><span class="number">01</span><b>Learn</b><p>Study each pair and connect its two words.</p></div><div class="step"><span class="number">02</span><b>Practise</b><p>Two rounds of restudying or recalling.</p></div><div class="step"><span class="number">03</span><b>Recall & compare</b><p>Take the final test and see your results.</p></div></div>
      <div class="card"><h2>Before you begin</h2><p>For each pair, learn which second word goes with the first. During recall, type only the second word. Work without notes, search, or AI. Keep this tab open and stay focused.</p><p>All trials are timed and advance automatically. You may submit an answer early, but the next word will wait for the timer.</p>
      <label for="delay">When will you take the final test?</label><select id="delay"><option value="lecture">Later in this lecture · 15 minutes after practice</option><option value="24h">After 24 hours</option><option value="48h">After 48 hours</option></select>
      <p class="small">About 11–12 minutes of active task time, plus your chosen delay. Your answers are saved in this browser. Nothing is sent to a server; downloads contain your answers.</p>
      <details><summary>Instructor settings</summary><label for="version">Word-pair assignment</label><select id="version"><option value="random">Randomly choose version A or B</option><option value="A">Version A</option><option value="B">Version B</option></select><p class="small">A and B reverse which 12 pairs receive retrieval practice. Assign half the class to each version for balanced coverage.</p></details>
      <div class="actions"><button id="begin">Begin activity →</button>${saved?'<button id="resume" class="secondary">Resume saved activity</button>':''}</div>${saved?'<p class="small">Starting again replaces the saved browser copy. Download it first if you want to keep it.</p>':''}</div>
      <details><summary>Restore a downloaded backup</summary><p class="small">Use your own JSON backup to return on another device or browser.</p><input type="file" id="import" accept=".json,application/json"><p class="error" id="import-error" role="alert"></p></details>
      <p class="small">A classroom adaptation inspired by <a href="https://doi.org/10.1111/j.1467-9280.2006.01693.x" target="_blank" rel="noopener">Roediger & Karpicke (2006)</a>. This word-pair task includes feedback and is not a replication of their passage experiment.</p>`);
    if(['A','B'].includes(urlVersion))document.getElementById('version').value=urlVersion;
    action('begin',()=>{
      if(saved&&!confirm('Replace your saved browser activity?'))return;
      const choice=document.getElementById('version').value;
      state={schemaVersion:VERSION,id:crypto.randomUUID(),counterbalance:choice==='random'?(random(2)?'A':'B'):choice,
        delay:document.getElementById('delay').value,createdAt:now(),phase:'ready',stage:'study',index:0,
        trials:shuffle(pairs.map(p=>p.id)),responses:[],predictions:{},ratings:{},events:[],followupDone:false};
      save();render();
    });
    if(saved)action('resume',()=>{state=saved;state.events.push({type:'resume',at:now(),stage:state.stage,index:state.index});save();render();});
    document.getElementById('import').onchange=async event=>{
      try{
        const file=event.target.files[0];if(!file)return;
        if(file.size>2000000)throw Error('Choose a Memory Lab word-pair backup smaller than 2 MB.');
        const imported=JSON.parse(await file.text());validate(imported);
        if(saved&&!confirm('Replace your saved browser activity with this backup?'))return;
        state=imported;state.events.push({type:'import',at:now()});save();render();
      }catch(e){document.getElementById('import-error').textContent=e.message;}
    };
  }
  function validate(s) {
    const stages=['study','practice1','practice2','final','followup'];
    if(!s||s.schemaVersion!==VERSION||!['A','B'].includes(s.counterbalance)||!['lecture','24h','48h'].includes(s.delay)||
      !['ready','trial','prediction','waiting','results'].includes(s.phase)||!stages.includes(s.stage)||
      !Array.isArray(s.trials)||s.trials.length!==24||new Set(s.trials).size!==24||!s.trials.every(id=>Number.isInteger(id)&&id>=0&&id<24)||
      !Number.isInteger(s.index)||s.index<0||s.index>=24||!Array.isArray(s.responses)||!Array.isArray(s.events)||
      !s.predictions||!s.ratings||!s.responses.every(r=>r&&typeof r.answer==='string'&&stages.includes(r.stage)&&Number.isInteger(r.pairId)&&r.pairId>=0&&r.pairId<24)||
      (s.phase==='trial'&&(!Number.isFinite(s.startedAt)||!Number.isFinite(s.deadline)))||
      (s.phase==='waiting'&&!Number.isFinite(s.dueAt))||
      (s.phase==='results'&&s.responses.filter(r=>r.stage==='final').length!==24))throw Error('This is not a compatible word-pair experiment backup.');
  }
  function render(){({ready,prediction,waiting,results,trial:trial})[state.phase]();}
  function stageName(){return {study:'Learn the pairs',practice1:'Practice · round 1 of 2',practice2:'Practice · round 2 of 2',final:'Final cued-recall test',followup:'Follow-up cued-recall test'}[state.stage];}
  function ready(){
    const practice=state.stage.startsWith('practice'),test=['final','followup'].includes(state.stage);
    shell(`<p class="eyebrow">${practice?'Practice':test?'Memory test':'Study'}</p><h1>${stageName()}</h1><div class="card"><p>${practice?'For some pairs, read both words again. For the others, type the missing second word; the correct pair will then appear briefly. There are 24 pairs in this round.':test?'You will see the first word from each of the 24 pairs. Type the second word from memory. No answers or feedback will be shown during this test.':'Each of the 24 pairs appears for 6 seconds. Learn which second word belongs with each first word. You can try forming a mental image connecting them.'}</p>
      <p class="small">${practice?'Each trial lasts 8 seconds: either 8 seconds of restudy, or 6 seconds of recall followed by 2 seconds of feedback.':test?'You have 6 seconds per pair. If unsure, make your best attempt or leave it blank. Case and punctuation do not affect scoring.':'The next pair appears automatically. There is no need to press a key.'}</p><button id="start">Start →</button></div>`);
    action('start',()=>{state.phase='trial';startTrial();});
  }
  function startTrial(){
    const id=current(), practice=state.stage.startsWith('practice');
    const seconds=state.stage==='study'?timing.study:practice?timing.restudy:timing.final;
    state.startedAt=now();state.deadline=state.startedAt+seconds*1000;state.draft='';state.submitted=false;state.submittedAt=null;
    state.phase='trial';save();trial();
  }
  function trial(){
    const id=current(),p=pairs[id],practice=state.stage.startsWith('practice'),retrieval=practice&&condition(id)==='retrieval';
    const study=state.stage==='study'||(practice&&!retrieval),answerCutoff=retrieval?state.startedAt+timing.retrieval*1000:state.deadline;
    shell(`<div class="task-top"><div><p class="eyebrow">${stageName()}</p><span class="small">Pair ${state.index+1} of 24</span></div><div class="timer" id="timer" role="timer" aria-label="Time remaining"></div></div><div class="progress" aria-hidden="true"><div style="width:${state.index/24*100}%"></div></div>
      <div class="card word-card"><p class="eyebrow" id="trial-label">${study?(practice?'Restudy this pair':'Learn this pair'):'Recall the second word'}</p><div class="word-pair"><span>${p.cue}</span><span class="dash">—</span><span id="target">${study?p.target:'?'}</span></div>
      ${study?'<p class="small">Make a connection between the two words.</p>':`<form id="recall-form"><label for="answer" class="sr-only">Second word paired with ${p.cue}</label><input id="answer" type="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" maxlength="100" placeholder="Type the second word" value="${esc(state.draft||'')}"><div class="actions"><button id="submit">Submit answer</button></div></form><p id="feedback" class="status" role="status"></p>`}</div>`);
    const input=document.getElementById('answer');
    function lock(){if(input){input.disabled=true;document.getElementById('submit').disabled=true;}}
    if(input){
      input.disabled=state.submitted;document.getElementById('submit').disabled=state.submitted;
      input.oninput=()=>{if(now()>=answerCutoff)return;state.draft=input.value;save();};
      document.getElementById('recall-form').onsubmit=e=>{
        e.preventDefault();if(state.submitted||now()>=answerCutoff)return;
        state.draft=input.value;state.submitted=true;state.submittedAt=now();save();lock();
        document.getElementById('feedback').textContent=retrieval?'Answer saved. The correct pair will appear when recall time ends.':'Answer saved. Waiting for the next pair.';
      };
      if(!state.submitted)input.focus();
    }
    let feedbackShown=false;
    function tick(){
      if(state.phase!=='trial')return;
      const t=now();
      if(retrieval&&t>=answerCutoff&&!feedbackShown){
        feedbackShown=true;lock();document.getElementById('target').textContent=p.target;
        document.getElementById('trial-label').textContent='Check the correct pair';
        const correct=normalize(state.draft)===normalize(p.target);
        document.getElementById('feedback').textContent=correct?'Correct.':state.draft.trim()?'Compare your answer with the correct pair above.':'The correct pair is shown above.';
      }
      document.getElementById('timer').textContent=`${Math.max(0,Math.ceil(((retrieval&&!feedbackShown?answerCutoff:state.deadline)-t)/1000))}s`;
      if(t>=state.deadline)finishTrial();
    }
    timer=setInterval(tick,100);tick();
  }
  function finishTrial(){
    if(state.phase!=='trial')return;clearInterval(timer);
    const id=current(),p=pairs[id],practice=state.stage.startsWith('practice'),c=condition(id);
    const tested=['final','followup'].includes(state.stage)||(practice&&c==='retrieval');
    const answer=state.draft||'';
    state.responses.push({stage:state.stage,pairId:id,cue:p.cue,target:p.target,condition:c,answer,
      correct:tested?normalize(answer)===normalize(p.target):null,submitted:state.submitted,
      startedAt:state.startedAt,submittedAt:state.submittedAt,scheduledEnd:state.deadline,endedAt:now(),
      responseTimeMs:state.submittedAt?state.submittedAt-state.startedAt:null});
    if(state.index<23){state.index++;startTrial();return;}
    if(state.stage==='study'){setStage('practice1');}
    else if(state.stage==='practice1'){setStage('practice2');}
    else if(state.stage==='practice2'){state.learningEndedAt=now();state.phase='prediction';}
    else{if(state.stage==='followup')state.followupDone=true;state.phase='results';state.completedAt=now();}
    save();render();
  }
  function setStage(stage){state.stage=stage;state.index=0;state.trials=shuffle(pairs.map(p=>p.id));state.phase='ready';}
  function prediction(){
    shell(`<p class="eyebrow">Practice complete</p><h1>How much will you remember?</h1><p class="lead">Predict your final test performance before you see any scores.</p><form class="card" id="prediction"><h2>Your predictions</h2><p>There were 12 pairs in each practice condition. How many do you expect to recall correctly on the final test?</p><div class="fields">${['restudy','retrieval'].map(c=>`<div><label for="predict-${c}">${c==='restudy'?'Restudy':'Retrieval practice'} · out of 12</label><input id="predict-${c}" type="number" min="0" max="12" step="1" required><label for="ease-${c}">How easy did it feel?</label><select id="ease-${c}" required><option value="">Choose a rating</option>${[1,2,3,4,5,6,7].map(n=>`<option value="${n}">${n}${n===1?' · very difficult':n===7?' · very easy':''}</option>`).join('')}</select></div>`).join('')}</div><div class="actions"><button>Save predictions →</button></div></form>`);
    document.getElementById('prediction').onsubmit=e=>{
      e.preventDefault();for(const c of ['restudy','retrieval']){
        const value=Number(document.getElementById(`predict-${c}`).value);if(!Number.isInteger(value)||value<0||value>12)return;
        state.predictions[c]=value;state.ratings[c]=Number(document.getElementById(`ease-${c}`).value);
      }
      state.predictedAt=now();const ms=state.delay==='lecture'?900000:state.delay==='24h'?86400000:172800000;
      state.dueAt=state.learningEndedAt+ms;state.phase='waiting';save();waiting();
    };
  }
  function waiting(){
    const due=new Date(state.dueAt).toLocaleString(undefined,{dateStyle:'full',timeStyle:'short'});
    const followup=state.pendingFollowup;
    shell(`<p class="eyebrow">${followup?'Optional follow-up':'Take a break'}</p><h1>${followup?'Come back tomorrow.':'Let some time pass.'}</h1><div class="card"><h2>${followup?'Your follow-up test':'Your final recall test'}</h2><p>Available on or after <strong>${esc(due)}</strong>.</p><p>${state.delay==='lecture'&&!followup?'Continue with the lecture and start when your lecturer asks you to.':'Return using the same browser and device, or restore your downloaded backup.'} Avoid reviewing the word pairs during the break.</p><p class="small">The activity is saved in this browser. You can close this page and resume later. There is no reminder or server account.</p><p class="small" id="countdown-label">Time until your test</p><div id="delay-countdown" class="delay-countdown" role="timer" aria-labelledby="countdown-label"></div><p id="wait-status" class="status" role="status"></p><div class="actions"><button id="return" disabled>Begin ${followup?'follow-up':'final'} test →</button><button id="backup" class="secondary">Download backup</button></div>${followup?'<button id="show-results" class="secondary">View first-test results</button>':''}</div>`);
    action('backup',backup);
    function check(){
      const left=Math.max(0,state.dueAt-now()), seconds=Math.ceil(left/1000);
      const hours=Math.floor(seconds/3600), minutes=Math.floor((seconds%3600)/60), remaining=seconds%60;
      const pad=n=>String(n).padStart(2,'0');
      document.getElementById('delay-countdown').textContent=hours>0?`${pad(hours)}:${pad(minutes)}:${pad(remaining)}`:`${pad(minutes)}:${pad(remaining)}`;
      const button=document.getElementById('return');
      button.disabled=left>0;
      button.classList.toggle('delay-ready',left===0);
      const status=document.getElementById('wait-status');
      const message=left>0?'The button will become available when the countdown reaches zero.':'Your test is ready. You can proceed now.';
      if(status.textContent!==message)status.textContent=message;
    }
    action('return',()=>{if(now()<state.dueAt)return;setStage(followup?'followup':'final');if(followup)state.followupStartedAt=now();else state.finalStartedAt=now();state.pendingFollowup=false;save();render();});
    if(followup)action('show-results',()=>{state.phase='results';save();results();});
    timer=setInterval(check,1000);check();
  }
  function score(stage,c){return state.responses.filter(r=>r.stage===stage&&r.condition===c&&r.correct===true).length;}
  const percent=n=>Math.round(n/12*100);
  function chart(data,caption){
    return `<div class="card"><h2>${caption}</h2><p class="small">Correct targets out of 12 per condition. Percentages are rounded.</p><div class="chart" role="img" aria-label="${esc(data.map(d=>`${d.label}: ${percent(d.n)}%`).join('; '))}"><div class="axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div class="plot">${data.map((d,i)=>`<div class="bar-group"><span class="bar-value" style="bottom:calc(${d.n/12*100}% + 4px)">${percent(d.n)}%</span><div class="bar ${i?'gold':''}" style="height:${d.n/12*100}%"></div></div>`).join('')}</div></div><div class="chart-labels">${data.map(d=>`<div>${d.label}<br><strong>${d.n} / 12</strong></div>`).join('')}</div></div>`;
  }
  function results(){
    const stage=state.followupDone?'followup':'final',restudy=score(stage,'restudy'),retrieval=score(stage,'retrieval');
    const difference=retrieval-restudy;
    const t=state.responses.find(r=>r.stage===stage)?.startedAt||now(),minutes=(t-state.learningEndedAt)/60000;
    const finding=difference>0?`You recalled ${difference} more ${difference===1?'pair':'pairs'} after retrieval practice.`:difference<0?`You recalled ${-difference} more ${difference===-1?'pair':'pairs'} after restudy.`:'You recalled the same number of pairs in both conditions.';
    shell(`<p class="eyebrow">Your results · ${stage==='followup'?'follow-up':'first final test'}</p><h1>What stayed with you?</h1><p class="lead">${finding}</p>
      ${chart([{label:'Restudy',n:restudy},{label:'Retrieval practice',n:retrieval}],stage==='followup'?'Follow-up recall':'Final recall')}
      <div class="card"><p class="eyebrow">Interpretation</p><h2>Practice can feel different from learning.</h2><p>${minutes<1440?'This was a same-day test. It tells you about shorter-delay performance; it does not establish a long-term benefit.':'This was a delayed test. It gives you information about recall after a longer interval.'} ${difference>0?'Your score favoured retrieval practice in this session.':difference<0?'Your score favoured restudy in this session.':'Neither method produced a higher score in this session.'}</p><p>One student and 12 pairs per condition cannot establish a reliable effect. Item difficulty, attention, and chance can affect the result. Compare the class across versions A and B.</p><p>Retrieval practice with feedback combines trying to remember with seeing the correct answer. This activity compares that combination with restudy; it cannot separate the effects of retrieval and feedback.</p><p class="note">Study takeaway: try answering with the material closed, check the answer, and revisit it later. Feeling fluent while reading is not the same measure as remembering without help.</p>${state.followupDone?'<p class="small">You already completed a final test on every pair before this follow-up. That earlier test gave both conditions additional retrieval practice, so the follow-up is not a pure comparison of the initial practice methods.</p>':''}</div>
      <div class="card"><h2>Did your predictions match?</h2><table><caption class="sr-only">Predictions and first final-test results</caption><thead><tr><th>Method</th><th>Predicted</th><th>First test</th><th>Felt easy</th></tr></thead><tbody>${['restudy','retrieval'].map(c=>`<tr><td>${c==='restudy'?'Restudy':'Retrieval'}</td><td>${state.predictions[c]} / 12</td><td>${score('final',c)} / 12</td><td>${state.ratings[c]} / 7</td></tr>`).join('')}</tbody></table><p class="small">Predictions were made for the first final test. Ease rating: 1 = very difficult, 7 = very easy.</p><h3>Retrieval accuracy during practice</h3><p>Round 1: ${score('practice1','retrieval')} / 12 · Round 2: ${score('practice2','retrieval')} / 12.</p><p class="small">Restudy trials had no recall response, so practice accuracy is not available for that condition.</p></div>
      ${state.followupDone?chart([{label:'Restudy · first test',n:score('final','restudy')},{label:'Retrieval · first test',n:score('final','retrieval')}],'Your earlier test'):''}
      <p class="small">Version ${state.counterbalance}. Time since the end of practice: ${minutes<120?minutes.toFixed(1)+' minutes':(minutes/60).toFixed(1)+' hours'}. ${state.events.length?'Tab changes or resumptions were recorded; review timing logs before class analysis.':''}</p>
      <div class="actions"><button id="csv">Download results (CSV)</button><button id="json" class="secondary">Download full record (JSON)</button><button id="again" class="secondary">New activity</button></div>
      ${!state.followupDone?`<div class="card"><h2>Optional delayed follow-up</h2><p>Test all 24 pairs again after 24 or 48 hours. The first test itself gives both conditions additional retrieval practice, which changes how follow-up results should be interpreted.</p><div class="actions"><button id="follow24" class="secondary">${state.pendingFollowup?'Return to scheduled follow-up':'Schedule after 24 hours'}</button>${!state.pendingFollowup?'<button id="follow48" class="secondary">Schedule after 48 hours</button>':''}</div></div>`:''}
      <details><summary>Discuss your results</summary><p>Which practice felt easier? Which produced better later recall? Did your confidence predict your performance? Would the outcome change after a longer delay?</p><p>Scoring accepts differences in case, spaces, and punctuation. It requires the correct target word; spelling mistakes and synonyms are marked incorrect. The raw answers are included in downloads for instructor review.</p><p><a href="README.md">Instructor guide and hosting instructions</a> · <a href="https://doi.org/10.1111/j.1467-9280.2006.01693.x" target="_blank" rel="noopener">Related paper</a></p></details>`);
    action('json',backup);action('csv',exportCSV);action('again',()=>{saved=state;welcome();});
    if(!state.followupDone){
      function follow(hours){if(!state.pendingFollowup){state.dueAt=now()+hours*3600000;state.pendingFollowup=true;}state.phase='waiting';save();waiting();}
      action('follow24',()=>follow(24));if(!state.pendingFollowup)action('follow48',()=>follow(48));
    }
  }
  function exportCSV(){
    const headers=['session_id','version','planned_delay','stage','pair_id','cue','target','condition','response','correct','submitted','response_time_ms','started_at','ended_at','scheduled_end','prediction_out_of_12','ease_out_of_7','attention_events'];
    const rows=state.responses.map(r=>[state.id,state.counterbalance,state.delay,r.stage,r.pairId,r.cue,r.target,r.condition,r.answer,r.correct===null?'':r.correct,r.submitted,r.responseTimeMs??'',new Date(r.startedAt).toISOString(),new Date(r.endedAt).toISOString(),new Date(r.scheduledEnd).toISOString(),state.predictions[r.condition]??'',state.ratings[r.condition]??'',state.events.length]);
    const cell=value=>'"'+String(value).replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
    download('\uFEFF'+[headers,...rows].map(row=>row.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8',`retrieval-practice-${state.id}.csv`);
  }
  document.addEventListener('visibilitychange',()=>{
    if(state&&state.phase==='trial'){state.events.push({type:document.hidden?'hidden':'visible',at:now(),stage:state.stage,index:state.index});save();}
  });
  try{const raw=localStorage.getItem(KEY);if(raw){saved=JSON.parse(raw);validate(saved);}}catch{saved=null;}
  welcome();
})();
