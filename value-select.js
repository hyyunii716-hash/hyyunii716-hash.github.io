(function(){
  var list=document.querySelector('.values'); if(!list) return;
  var items=[].slice.call(list.children); if(items.length<2) return;
  var vp=document.createElement('div'); vp.className='values-viewport';
  list.parentNode.insertBefore(vp,list); vp.appendChild(list);
  list.classList.add('values--hselect');
  list.tabIndex=0; list.setAttribute('role','group'); list.setAttribute('aria-roledescription','carousel'); list.setAttribute('aria-label','三項理念');
  items.forEach(function(li,i){ li.style.setProperty('--vi',i); });
  vp.addEventListener('scroll',function(){ vp.scrollLeft=0; });   // 點卡片時瀏覽器會把整條軌道捲進視野，擋掉
  var dots=document.createElement('div'); dots.className='values-dots';
  items.forEach(function(_,i){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','第 '+(i+1)+' 項');b.addEventListener('click',function(){go(i);});dots.appendChild(b);});
  vp.parentNode.insertBefore(dots,vp.nextSibling);

  var cur=1, base=0;   // 預設選中間那張
  function render(){
    items.forEach(function(li,i){
      li.classList.toggle('is-active',i===cur); li.classList.toggle('is-prev',i<cur); li.classList.toggle('is-next',i>cur);
      li.setAttribute('aria-current',i===cur?'true':'false');
    });
    [].forEach.call(dots.children,function(b,i){ if(i===cur) b.setAttribute('aria-current','true'); else b.removeAttribute('aria-current'); });
    var a=items[cur], c=a.offsetLeft+a.offsetWidth/2;
    base=vp.clientWidth/2-c; list.style.transform='translate3d('+base+'px,0,0)';
    list.style.perspectiveOrigin=c+'px 50%';          // 消失點跟著目前選中的卡
  }
  function go(i){ cur=Math.max(0,Math.min(items.length-1,i)); render(); }

  items.forEach(function(li,i){ li.addEventListener('click',function(e){ if(moved){e.preventDefault();return;} if(i!==cur) go(i); }); });
  list.addEventListener('keydown',function(e){ if(e.key==='ArrowRight'){e.preventDefault();go(cur+1);} if(e.key==='ArrowLeft'){e.preventDefault();go(cur-1);} });

  var sx=0,sy=0,pid=null,moved=false,dx=0;
  list.addEventListener('pointerdown',function(e){ if(e.pointerType==='mouse'&&e.button!==0) return; pid=e.pointerId; sx=e.clientX; sy=e.clientY; dx=0; moved=false; });
  window.addEventListener('pointermove',function(e){
    if(e.pointerId!==pid) return; dx=e.clientX-sx;
    if(!moved && Math.abs(dx)>8 && Math.abs(dx)>Math.abs(e.clientY-sy)){ moved=true; list.classList.add('is-dragging'); }
    if(moved) list.style.transform='translate3d('+(base+dx)+'px,0,0)';
  });
  function end(e){
    if(e.pointerId!==pid) return; pid=null; list.classList.remove('is-dragging');
    if(moved){ var step=Math.abs(dx)>60?(dx<0?1:-1):0; go(cur+step); setTimeout(function(){moved=false;},0); }
  }
  window.addEventListener('pointerup',end); window.addEventListener('pointercancel',end);
  // 橫向滾輪切換；stopPropagation 避免 fullpage-snap.js 把橫向手勢當成往上翻頁
  vp.addEventListener('wheel',function(e){
    if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){ e.preventDefault(); e.stopPropagation(); if(Math.abs(e.deltaX)>30 && !wl){ wl=1; setTimeout(function(){wl=0;},450); go(cur+(e.deltaX>0?1:-1)); } }
  },{passive:false});
  var wl=0;
  window.addEventListener('resize',render);
  window.addEventListener('load',render); render();
})();