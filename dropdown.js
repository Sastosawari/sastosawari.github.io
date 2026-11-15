/* In-page dropdowns: custom select and suggestion list, so menus always open under the field on every device. */
(function(){
function el(t,c,a){var e=document.createElement(t);if(c)e.className=c;if(a)for(var k in a)e.setAttribute(k,a[k]);return e}
var openOne=null;
function closeAll(except){if(openOne&&openOne!==except){openOne()}}
document.addEventListener('click',function(e){if(openOne&&!e.target.closest('.dd'))openOne()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&openOne)openOne()});

/* ---------- custom select ---------- */
function enhance(sel){
  if(!sel||sel._dd)return;sel._dd=true;
  var wrap=el('div','dd');sel.parentNode.insertBefore(wrap,sel);wrap.appendChild(sel);
  sel.classList.add('dd-native');sel.setAttribute('tabindex','-1');sel.setAttribute('aria-hidden','true');
  var lab=sel.id&&document.querySelector('label[for="'+sel.id+'"]');
  if(lab&&!lab.id)lab.id=sel.id+'-lab';
  var btn=el('button','dd-btn',{type:'button','aria-haspopup':'listbox','aria-expanded':'false'});
  btn.id=(sel.id||('dd'+Math.random().toString(36).slice(2,7)))+'-btn';
  if(lab)btn.setAttribute('aria-labelledby',lab.id+' '+btn.id);
  var list=el('ul','dd-list',{role:'listbox',tabindex:'-1'});list.hidden=true;
  wrap.appendChild(btn);wrap.appendChild(list);
  var idx=-1,isOpen=false;
  function label(){var o=sel.options[sel.selectedIndex];btn.textContent=o?o.textContent:'';}
  function build(){
    list.innerHTML='';
    [].forEach.call(sel.options,function(o,i){
      var li=el('li','dd-item',{role:'option','data-i':i});li.textContent=o.textContent;
      if(i===sel.selectedIndex){li.setAttribute('aria-selected','true')}
      li.addEventListener('mousedown',function(e){e.preventDefault()});
      li.addEventListener('click',function(){choose(i)});
      list.appendChild(li);
    });
    label();
  }
  function hl(i){
    var items=list.children;if(!items.length)return;
    idx=Math.max(0,Math.min(items.length-1,i));
    [].forEach.call(items,function(x,j){x.classList.toggle('on',j===idx)});
    items[idx].scrollIntoView({block:'nearest'});
  }
  function open(){
    closeAll(close);build();list.hidden=false;isOpen=true;btn.setAttribute('aria-expanded','true');openOne=close;
    hl(sel.selectedIndex>-1?sel.selectedIndex:0);
  }
  function close(){list.hidden=true;isOpen=false;btn.setAttribute('aria-expanded','false');if(openOne===close)openOne=null}
  function choose(i){sel.selectedIndex=i;sel.dispatchEvent(new Event('change',{bubbles:true}));label();close();btn.focus()}
  btn.addEventListener('click',function(){isOpen?close():open()});
  btn.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!isOpen)open();else hl(idx+(e.key==='ArrowDown'?1:-1))}
    else if((e.key==='Enter'||e.key===' ')&&isOpen){e.preventDefault();choose(idx)}
    else if(e.key==='Home'&&isOpen){e.preventDefault();hl(0)}
    else if(e.key==='End'&&isOpen){e.preventDefault();hl(list.children.length-1)}
    else if(e.key==='Tab'&&isOpen){close()}
  });
  sel.addEventListener('change',label);
  new MutationObserver(build).observe(sel,{childList:true});
  build();
}
function enhanceAll(root){[].forEach.call((root||document).querySelectorAll('select'),enhance)}

/* ---------- suggestions under a text input ---------- */
function suggest(input,getItems){
  if(!input||input._sg)return;input._sg=true;
  var wrap=el('div','dd');input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
  var list=el('ul','dd-list',{role:'listbox',id:(input.id||'f')+'-sg'});list.hidden=true;wrap.appendChild(list);
  input.setAttribute('autocomplete','off');input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');
  input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');
  var idx=-1,shown=[];
  function close(){list.hidden=true;input.setAttribute('aria-expanded','false');if(openOne===close)openOne=null}
  function render(){
    if(input._skip){input._skip=false;return}
    var q=input.value.trim().toLowerCase(),all=getItems()||[];
    shown=all.filter(function(x){return !q||x.toLowerCase().indexOf(q)>-1}).sort(function(a,b){
      var as=a.toLowerCase().indexOf(q)===0?0:1,bs=b.toLowerCase().indexOf(q)===0?0:1;return as-bs}).slice(0,8);
    if(!shown.length||(shown.length===1&&shown[0].toLowerCase()===q)){close();return}
    list.innerHTML='';
    shown.forEach(function(x,i){
      var li=el('li','dd-item',{role:'option'});li.textContent=x;
      li.addEventListener('mousedown',function(e){e.preventDefault()});
      li.addEventListener('click',function(){pick(i)});
      list.appendChild(li);
    });
    closeAll(close);list.hidden=false;openOne=close;input.setAttribute('aria-expanded','true');idx=-1;
  }
  function pick(i){input.value=shown[i];input._skip=true;input.dispatchEvent(new Event('input',{bubbles:true}));close()}
  function hl(i){var items=list.children;if(!items.length)return;idx=(i+items.length)%items.length;[].forEach.call(items,function(x,j){x.classList.toggle('on',j===idx)});items[idx].scrollIntoView({block:'nearest'})}
  input.addEventListener('input',render);
  input.addEventListener('blur',function(){setTimeout(close,120)});
  input.addEventListener('focus',render);
  input.addEventListener('keydown',function(e){
    if(list.hidden)return;
    if(e.key==='ArrowDown'){e.preventDefault();hl(idx+1)}
    else if(e.key==='ArrowUp'){e.preventDefault();hl(idx-1)}
    else if(e.key==='Enter'&&idx>-1){e.preventDefault();e.stopImmediatePropagation();pick(idx)}
    else if(e.key==='Enter'){close()}
  },true);
}
window.Dropdown={enhance:enhance,enhanceAll:enhanceAll,suggest:suggest};
})();
