(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const NOTES_KEY='unfollow_notes_v10';
  const MISSING_KEY='unfollow_missing_v10';

  const start=()=>{
    const focus=q('.focusPanel');
    if(focus&&!focus.querySelector('.shortcutGuide')){
      const guide=document.createElement('div');
      guide.className='shortcutGuide';
      [['D','취소 완료'],['K','유지'],['L','나중에'],['C','아이디 복사']].forEach(([key,label])=>{
        const item=document.createElement('span');
        const kbd=document.createElement('kbd');
        kbd.textContent=key;
        item.append(kbd,document.createTextNode(` ${label}`));
        guide.appendChild(item);
      });
      focus.appendChild(guide);
    }

    const actions=q('.focusActions');
    if(actions&&!q('#copyUsernameBtn')){
      const copy=document.createElement('button');
      copy.id='copyUsernameBtn';
      copy.type='button';
      copy.className='btn ghost';
      copy.textContent='아이디 복사';
      copy.addEventListener('click',copyUsername);
      actions.appendChild(copy);
    }

    if(focus&&!q('#focusLocalTools')){
      const tools=document.createElement('div');
      tools.id='focusLocalTools';
      tools.className='focusLocalTools';

      const label=document.createElement('label');
      label.setAttribute('for','accountMemo');
      label.textContent='이 계정 메모';

      const memo=document.createElement('textarea');
      memo.id='accountMemo';
      memo.rows=3;
      memo.placeholder='예: 지인, 작업 계정, 나중에 다시 확인';
      memo.addEventListener('input',()=>{
        const value=username();
        if(!value) return;
        const notes=readJson(NOTES_KEY,{});
        if(memo.value.trim()) notes[value]=memo.value;
        else delete notes[value];
        localStorage.setItem(NOTES_KEY,JSON.stringify(notes));
      });

      const row=document.createElement('div');
      row.className='focusLocalRow';
      const missing=document.createElement('button');
      missing.id='markMissingBtn';
      missing.type='button';
      missing.className='btn ghost';
      missing.textContent='프로필을 찾을 수 없음';
      missing.addEventListener('click',markMissing);
      const state=document.createElement('small');
      state.id='localAccountState';
      state.setAttribute('aria-live','polite');
      row.append(missing,state);
      tools.append(label,memo,row);
      focus.appendChild(tools);
      syncLocalTools();

      let syncTimer;
      new MutationObserver(()=>{
        clearTimeout(syncTimer);
        syncTimer=setTimeout(syncLocalTools,80);
      }).observe(focus,{subtree:true,childList:true,characterData:true,attributes:true});
    }

    document.addEventListener('keydown',event=>{
      if(event.metaKey||event.ctrlKey||event.altKey||typing(event.target)) return;
      const key=event.key.toLowerCase();
      const selectors={d:'#focusDoneBtn',k:'#focusKeepBtn',l:'#focusLaterBtn'};
      if(selectors[key]&&q(selectors[key])){
        event.preventDefault();
        q(selectors[key]).click();
      }
      if(key==='c'){
        event.preventDefault();
        copyUsername();
      }
    });

    document.querySelectorAll('.returnSheetV8').forEach(dialog=>{
      dialog.setAttribute('role','dialog');
      dialog.setAttribute('aria-modal','true');
      dialog.setAttribute('aria-label','Instagram 처리 결과 선택');
    });

    document.querySelectorAll('button').forEach(button=>{
      if(!button.getAttribute('aria-label')&&!button.textContent.trim()) button.setAttribute('aria-label','버튼');
    });
  };

  const typing=target=>target&&target.matches&&target.matches('input,textarea,select,[contenteditable="true"]');

  function username(){
    const link=q('.focusPanel a[href*="instagram.com"],a[data-action="open"][href*="instagram.com"]');
    if(link){
      try{return new URL(link.href).pathname.split('/').filter(Boolean)[0]||'';}catch{}
    }
    const candidates=document.querySelectorAll('.focusPanel [data-username],.focusPanel .username,.focusPanel strong');
    for(const el of candidates){
      const raw=el.dataset.username||el.textContent.trim();
      const match=raw.match(/@?([A-Za-z0-9._]{2,30})/);
      if(match) return match[1];
    }
    return '';
  }

  function readJson(key,fallback){
    try{return JSON.parse(localStorage.getItem(key)||'')||fallback;}catch{return fallback;}
  }

  function syncLocalTools(){
    const value=username();
    const memo=q('#accountMemo');
    const state=q('#localAccountState');
    const missing=q('#markMissingBtn');
    if(!memo||!state||!missing) return;
    const notes=readJson(NOTES_KEY,{});
    const missingList=readJson(MISSING_KEY,[]);
    if(document.activeElement!==memo) memo.value=value?notes[value]||'':'';
    const marked=value&&missingList.includes(value);
    missing.classList.toggle('active',Boolean(marked));
    missing.textContent=marked?'프로필 없음 기록 취소':'프로필을 찾을 수 없음';
    state.textContent=value?(marked?'프로필 없음으로 로컬 기록됨':notes[value]?'메모가 저장되어 있습니다':'브라우저에 자동 저장됩니다'):'';
  }

  function markMissing(){
    const value=username();
    if(!value){toast('현재 계정의 아이디를 찾지 못했습니다.');return;}
    const list=readJson(MISSING_KEY,[]);
    const index=list.indexOf(value);
    if(index>=0){
      list.splice(index,1);
      toast(`@${value} 프로필 없음 기록을 취소했습니다.`);
    }else{
      list.push(value);
      toast(`@${value} 프로필 없음으로 기록했습니다.`);
      setTimeout(()=>q('#focusLaterBtn')?.click(),250);
    }
    localStorage.setItem(MISSING_KEY,JSON.stringify(list));
    syncLocalTools();
  }

  async function copyUsername(){
    const value=username();
    if(!value){toast('현재 계정의 아이디를 찾지 못했습니다.');return;}
    try{
      await navigator.clipboard.writeText(value);
      toast(`@${value} 복사 완료`);
    }catch{
      toast('아이디를 복사하지 못했습니다.');
    }
  }

  let timer;
  function toast(message){
    let el=q('#v10Toast');
    if(!el){
      el=document.createElement('div');
      el.id='v10Toast';
      el.className='v10Toast';
      el.setAttribute('role','status');
      el.setAttribute('aria-live','polite');
      document.body.appendChild(el);
    }
    el.textContent=message;
    el.classList.add('show');
    clearTimeout(timer);
    timer=setTimeout(()=>el.classList.remove('show'),3200);
  }

  window.unfollowToast=toast;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
