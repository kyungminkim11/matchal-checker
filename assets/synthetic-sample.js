(()=>{
  const SAMPLE_KEY='unfollow_synthetic_sample_v1';
  const encoder=new TextEncoder();
  let lastFocusedElement=null;

  document.addEventListener('click',event=>{
    const trigger=event.target.closest('button,a');
    if(!trigger) return;

    const isSample=trigger.matches('[data-v8="sample"],#sideSampleBtn,[data-sample]')||/샘플로\s*(먼저\s*)?(보기|체험)/.test(trigger.textContent||'');
    if(isSample){
      event.preventDefault();
      event.stopImmediatePropagation();
      loadSyntheticSample();
      return;
    }

    if(sessionStorage.getItem(SAMPLE_KEY)==='1'&&isProfileTrigger(trigger)){
      event.preventDefault();
      event.stopImmediatePropagation();
      showProfileModal(getTargetUsername(trigger));
    }
  },true);

  document.addEventListener('change',event=>{
    const input=event.target.closest?.('input[type="file"]');
    const file=input?.files?.[0];
    if(!file||file.name.startsWith('instagram-lava-demo-')) return;
    leaveSyntheticMode();
  },true);

  async function loadSyntheticSample(){
    const input=document.querySelector('input[type="file"]');
    if(!input){notify('ZIP 파일 입력 영역을 찾지 못했습니다. 페이지를 새로고침해 주세요.');return;}

    try{
      const suffix=randomSuffix();
      const now=Math.floor(Date.now()/1000);
      const mutual=makeNames('mutual',6,suffix);
      const followingOnly=makeNames('following',7,suffix);
      const followerOnly=makeNames('follower',4,suffix);

      const following={relationships_following:[...mutual,...followingOnly].map((name,index)=>followingItem(name,now-index*86400))};
      const followers=[...mutual,...followerOnly].map((name,index)=>followerItem(name,now-index*93600));

      const zip=createZip([
        ['connections/followers_and_following/following.json',JSON.stringify(following,null,2)],
        ['connections/followers_and_following/followers_1.json',JSON.stringify(followers,null,2)]
      ]);

      const file=new File([zip],`instagram-lava-demo-${suffix}.zip`,{type:'application/zip',lastModified:Date.now()});
      const transfer=new DataTransfer();
      transfer.items.add(file);
      input.files=transfer.files;
      sessionStorage.setItem(SAMPLE_KEY,'1');
      input.dispatchEvent(new Event('change',{bubbles:true}));
      showSampleBanner();
      notify('실제 계정과 무관한 가상 샘플 데이터를 불러왔습니다.');
      setTimeout(disableSampleProfileLinks,100);
      setTimeout(disableSampleProfileLinks,600);
      setTimeout(disableSampleProfileLinks,1500);
    }catch(error){
      console.error(error);
      notify('가상 샘플을 만드는 중 문제가 발생했습니다.');
    }
  }

  function makeNames(group,count,suffix){
    return Array.from({length:count},(_,index)=>`lava_demo_${group}_${suffix}_${String(index+1).padStart(2,'0')}`);
  }

  function followingItem(name,timestamp){
    return {title:name,string_list_data:[{href:`https://www.instagram.com/${name}/`,value:name,timestamp}]};
  }

  function followerItem(name,timestamp){
    return {title:'',media_list_data:[],string_list_data:[{href:`https://www.instagram.com/${name}/`,value:name,timestamp}]};
  }

  function randomSuffix(){
    const bytes=new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes,b=>b.toString(36).padStart(2,'0')).join('').slice(0,6);
  }

  function showSampleBanner(){
    let banner=document.getElementById('syntheticSampleBanner');
    if(!banner){
      banner=document.createElement('div');
      banner.id='syntheticSampleBanner';
      banner.className='syntheticSampleBanner';
      banner.setAttribute('role','status');
      banner.innerHTML='<strong>가상 샘플 모드</strong><span>모든 계정명과 팔로우 관계는 브라우저에서 무작위로 생성되며 실제 인물·계정과 무관합니다. 프로필 열기를 누르면 샘플 안내가 표시됩니다.</span>';
      const panel=document.getElementById('appPanel')||document.querySelector('.uploadPanel')||document.querySelector('.main');
      panel?.prepend(banner);
    }
    banner.hidden=false;
  }

  function disableSampleProfileLinks(){
    if(sessionStorage.getItem(SAMPLE_KEY)!=='1') return;
    document.querySelectorAll('a[href*="instagram.com"],[data-action="open"],#focusOpenBtn').forEach(markSyntheticTrigger);
    document.querySelectorAll('button,a').forEach(element=>{
      if(/^(Instagram\s*)?프로필\s*열기$/.test((element.textContent||'').trim())) markSyntheticTrigger(element);
    });
    showSampleBanner();
  }

  function markSyntheticTrigger(element){
    element.dataset.syntheticSample='true';
    element.setAttribute('aria-label','가상 샘플 계정 — 실제 Instagram 프로필은 열리지 않음');
    element.setAttribute('title','가상 샘플 계정 안내 보기');
    element.removeAttribute('target');
  }

  function isProfileTrigger(trigger){
    if(trigger.matches('[data-synthetic-sample="true"],a[href*="instagram.com"],[data-action="open"],#focusOpenBtn')) return true;
    return /^(Instagram\s*)?프로필\s*열기$/.test((trigger.textContent||'').trim());
  }

  function getTargetUsername(trigger){
    const scope=trigger.closest('tr,[role="row"],.row,.accountRow,.resultRow,.focusPanel,.workPanel')||document;
    const explicit=scope.querySelector?.('[data-username]')?.dataset.username||scope.querySelector?.('.username')?.textContent||'';
    const text=`${explicit} ${scope.textContent||''}`;
    const match=text.match(/@([A-Za-z0-9._]{2,60})/);
    return match?match[1]:'';
  }

  function showProfileModal(username=''){
    const modal=ensureProfileModal();
    const account=modal.querySelector('[data-sample-account]');
    account.textContent=username?`@${username}`:'현재 가상 샘플 계정';
    lastFocusedElement=document.activeElement;
    modal.hidden=false;
    document.body.classList.add('sampleModalOpen');
    modal.querySelector('[data-modal-close]')?.focus();
  }

  function ensureProfileModal(){
    let modal=document.getElementById('syntheticProfileModal');
    if(modal) return modal;

    modal=document.createElement('div');
    modal.id='syntheticProfileModal';
    modal.className='syntheticProfileModal';
    modal.hidden=true;
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','syntheticProfileModalTitle');
    modal.innerHTML=`
      <div class="syntheticProfileModalCard">
        <button type="button" class="syntheticProfileModalClose" data-modal-close aria-label="팝업 닫기">×</button>
        <div class="syntheticProfileModalIcon" aria-hidden="true">◎</div>
        <p class="syntheticProfileModalEyebrow">가상 샘플 모드</p>
        <h2 id="syntheticProfileModalTitle">실제 Instagram 프로필은 열 수 없어요</h2>
        <strong class="syntheticProfileAccount" data-sample-account>현재 가상 샘플 계정</strong>
        <p>이 계정은 맞팔체커의 분석·분류·작업 흐름을 체험할 수 있도록 브라우저에서 만든 가상 계정입니다. 실제 Instagram 계정이 아니므로 연결되는 프로필이 없습니다.</p>
        <div class="syntheticProfileModalInfo">
          <span>샘플에서 가능한 기능</span>
          <b>필터 · 상태 선택 · 진행 저장 · 아이디 복사</b>
          <span>실제 ZIP 사용 시 가능한 기능</span>
          <b>각 계정의 Instagram 프로필 열기</b>
        </div>
        <div class="syntheticProfileModalActions">
          <button type="button" class="btn ghost" data-modal-close>샘플 계속 보기</button>
          <button type="button" class="btn primary" data-use-own-zip>내 ZIP으로 분석하기</button>
        </div>
      </div>`;

    modal.addEventListener('click',event=>{
      if(event.target===modal||event.target.closest('[data-modal-close]')) closeProfileModal();
      if(event.target.closest('[data-use-own-zip]')){
        closeProfileModal();
        const input=document.querySelector('input[type="file"]');
        const upload=input?.closest('.uploadPanel,.drop,section')||input;
        upload?.scrollIntoView?.({behavior:'smooth',block:'center'});
        setTimeout(()=>input?.click(),350);
      }
    });

    modal.addEventListener('keydown',event=>{
      if(event.key==='Escape') closeProfileModal();
      if(event.key==='Tab') trapModalFocus(event,modal);
    });

    document.body.appendChild(modal);
    return modal;
  }

  function closeProfileModal(){
    const modal=document.getElementById('syntheticProfileModal');
    if(!modal||modal.hidden) return;
    modal.hidden=true;
    document.body.classList.remove('sampleModalOpen');
    lastFocusedElement?.focus?.();
  }

  function trapModalFocus(event,modal){
    const focusable=[...modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&!el.hidden);
    if(!focusable.length) return;
    const first=focusable[0];
    const last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }

  function leaveSyntheticMode(){
    sessionStorage.removeItem(SAMPLE_KEY);
    document.getElementById('syntheticSampleBanner')?.setAttribute('hidden','');
    document.querySelectorAll('[data-synthetic-sample="true"]').forEach(element=>{
      delete element.dataset.syntheticSample;
      element.removeAttribute('title');
      element.removeAttribute('aria-label');
    });
    closeProfileModal();
  }

  new MutationObserver(()=>disableSampleProfileLinks()).observe(document.documentElement,{subtree:true,childList:true});

  function createZip(entries){
    const files=entries.map(([name,text])=>{
      const nameBytes=encoder.encode(name);
      const data=encoder.encode(text);
      return {nameBytes,data,crc:crc32(data),offset:0};
    });

    const localParts=[];
    let offset=0;
    files.forEach(file=>{
      file.offset=offset;
      const header=new Uint8Array(30+file.nameBytes.length);
      const view=new DataView(header.buffer);
      view.setUint32(0,0x04034b50,true);
      view.setUint16(4,20,true);
      view.setUint16(6,0,true);
      view.setUint16(8,0,true);
      view.setUint16(10,0,true);
      view.setUint16(12,0,true);
      view.setUint32(14,file.crc,true);
      view.setUint32(18,file.data.length,true);
      view.setUint32(22,file.data.length,true);
      view.setUint16(26,file.nameBytes.length,true);
      view.setUint16(28,0,true);
      header.set(file.nameBytes,30);
      localParts.push(header,file.data);
      offset+=header.length+file.data.length;
    });

    const centralOffset=offset;
    const centralParts=[];
    files.forEach(file=>{
      const header=new Uint8Array(46+file.nameBytes.length);
      const view=new DataView(header.buffer);
      view.setUint32(0,0x02014b50,true);
      view.setUint16(4,20,true);
      view.setUint16(6,20,true);
      view.setUint16(8,0,true);
      view.setUint16(10,0,true);
      view.setUint16(12,0,true);
      view.setUint16(14,0,true);
      view.setUint32(16,file.crc,true);
      view.setUint32(20,file.data.length,true);
      view.setUint32(24,file.data.length,true);
      view.setUint16(28,file.nameBytes.length,true);
      view.setUint16(30,0,true);
      view.setUint16(32,0,true);
      view.setUint16(34,0,true);
      view.setUint16(36,0,true);
      view.setUint32(38,0,true);
      view.setUint32(42,file.offset,true);
      header.set(file.nameBytes,46);
      centralParts.push(header);
      offset+=header.length;
    });

    const centralSize=offset-centralOffset;
    const end=new Uint8Array(22);
    const endView=new DataView(end.buffer);
    endView.setUint32(0,0x06054b50,true);
    endView.setUint16(4,0,true);
    endView.setUint16(6,0,true);
    endView.setUint16(8,files.length,true);
    endView.setUint16(10,files.length,true);
    endView.setUint32(12,centralSize,true);
    endView.setUint32(16,centralOffset,true);
    endView.setUint16(20,0,true);
    return new Blob([...localParts,...centralParts,end],{type:'application/zip'});
  }

  const crcTable=(()=>{
    const table=new Uint32Array(256);
    for(let n=0;n<256;n++){
      let c=n;
      for(let k=0;k<8;k++) c=(c&1)?0xedb88320^(c>>>1):c>>>1;
      table[n]=c>>>0;
    }
    return table;
  })();

  function crc32(bytes){
    let crc=0xffffffff;
    for(const byte of bytes) crc=crcTable[(crc^byte)&0xff]^(crc>>>8);
    return (crc^0xffffffff)>>>0;
  }

  function notify(message){
    if(typeof window.unfollowToast==='function') window.unfollowToast(message);
    else console.info(message);
  }
})();
