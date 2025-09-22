const api = {
  async list(){ const r=await fetch('/api/products'); return r.json() },
  async product(id){ const r=await fetch('/api/products/'+id); return r.json() },
  async saveProduct(id, payload, t){
    const r=await fetch('/api/admin/products/'+id,{method:'PUT',headers:{'x-admin-token':t,'Content-Type':'application/json'},body:JSON.stringify(payload)})
    const txt=await r.text(); let data=null; try{ data=JSON.parse(txt) }catch(_){}
    if(!r.ok) throw new Error((data&&(data.detail||data.error))||('HTTP '+r.status+' '+txt.slice(0,200)))
    return data
  },
  async createProduct(payload, t){
    const r=await fetch('/api/admin/products',{method:'POST',headers:{'x-admin-token':t,'Content-Type':'application/json'},body:JSON.stringify(payload)})
    const txt=await r.text(); let data=null; try{ data=JSON.parse(txt) }catch(_){}
    if(!r.ok) throw new Error((data&&(data.detail||data.error))||('HTTP '+r.status+' '+txt.slice(0,200)))
    return data
  },
  async deleteProduct(id, t){
    const r=await fetch('/api/admin/products/'+id,{method:'DELETE',headers:{'x-admin-token':t}})
    const txt=await r.text(); let data=null; try{ data=JSON.parse(txt) }catch(_){}
    if(!r.ok) throw new Error((data&&(data.detail||data.error))||('HTTP '+r.status+' '+txt.slice(0,200)))
    return data
  },
  async upload(pid,files,t){
    const fd=new FormData()
    fd.append('productId', String(pid))
    ;[...files].forEach(f=>fd.append('images[]', f))
    const r=await fetch('/api/admin/upload-gh',{method:'POST',headers:{'x-admin-token':t},body:fd})
    const txt=await r.text(); let data=null; try{ data=JSON.parse(txt) }catch(_){}
    if(!r.ok) throw new Error((data&&(data.detail||data.error))||('HTTP '+r.status+' '+txt.slice(0,200)))
    return data
  }
}

const el={
  token:q('#token'), saveTokenBtn:q('#saveToken'), tokStatus:q('#tokStatus'),
  search:q('#productSearch'), suggest:q('#suggest'),
  prodName:q('#prodName'), prodCategory:q('#prodCategory'),
  price:q('#priceUAH'), desc:q('#description'),
  fileInput:q('#fileInput'), drop:q('#drop'), queueGrid:q('#queueGrid'), uploadStatus:q('#uploadStatus'),
  newName:q('#newName'), newCategory:q('#newCategory'), newPrice:q('#newPrice'), newDesc:q('#newDesc'),
  newFileInput:q('#newFileInput'), newDrop:q('#newDrop'), newQueueGrid:q('#newQueueGrid'), createDraftBtn:q('#createDraft'),
  cardPreview:q('#cardPreview'),
  changesList:q('#changesList'), filesList:q('#filesList'),
  markDeleteBtn:q('#markDelete'),
  exitNoSave:q('#exitNoSave'), applyAndExit:q('#applyAndExit')
}

let st={
  token:'', all:[], pid:0, prod:null,
  previews:{}, // key -> [dataURLs]
  // queues of files per key: 'id#123' | 'newDraft' | 'new#1'
  fileQ:{},
  // operations map and order
  ops:{}, opsOrder:[], // key -> {type:'create'|'update'|'delete', payload, name}
  // draft for new product before it becomes 'new#N'
  draft:{ name:'', category:'', priceUAH:0, description:'' },
  seq:0,
  previewKey:null // which key drives preview: 'id#123' | 'newDraft' | 'new#1'
}

init()

async function init(){
  st.token = localStorage.getItem('xAdminToken')||''
  el.token.value = st.token
  el.tokStatus.textContent = st.token ? '✓ Токен збережено' : ''
  st.all = await api.list()
  el.search.addEventListener('input', debounce(onSearch, 150))
  el.search.addEventListener('keydown', onSearchKeys)
  el.saveTokenBtn.onclick = ()=>{ st.token=el.token.value.trim(); localStorage.setItem('xAdminToken',st.token); el.tokStatus.textContent=st.token?'✓ Токен збережено':'' }

  el.price.addEventListener('input', debounce(stageUpdateSelected, 300))
  el.desc.addEventListener('input', debounce(stageUpdateSelected, 300))
  el.markDeleteBtn.onclick = stageDeleteSelected

  el.fileInput.onchange = e=> addFilesToKey(keyForId(st.pid), e.target.files)
  el.drop.ondragover = e=>{ e.preventDefault(); el.drop.classList.add('drag') }
  el.drop.ondragleave = ()=> el.drop.classList.remove('drag')
  el.drop.ondrop = e=>{ e.preventDefault(); el.drop.classList.remove('drag'); addFilesToKey(keyForId(st.pid), e.dataTransfer.files) }

  el.newName.addEventListener('input', ()=>{ st.draft.name = el.newName.value; if(st.previewKey==='newDraft') renderCardPreview() })
  el.newCategory.addEventListener('input', ()=>{ st.draft.category = el.newCategory.value; if(st.previewKey==='newDraft') renderCardPreview() })
  el.newPrice.addEventListener('input', ()=>{ st.draft.priceUAH = parseInt(el.newPrice.value||'0',10); if(st.previewKey==='newDraft') renderCardPreview() })
  el.newDesc.addEventListener('input', ()=>{ st.draft.description = el.newDesc.value; if(st.previewKey==='newDraft') renderCardPreview() })
  el.newFileInput.onchange = e=> addFilesToKey('newDraft', e.target.files)
  el.newDrop.ondragover = e=>{ e.preventDefault(); el.newDrop.classList.add('drag') }
  el.newDrop.ondragleave = ()=> el.newDrop.classList.remove('drag')
  el.newDrop.ondrop = e=>{ e.preventDefault(); el.newDrop.classList.remove('drag'); addFilesToKey('newDraft', e.dataTransfer.files) }
  el.createDraftBtn.onclick = addNewDraftToChanges

  el.exitNoSave.onclick = ()=> window.location.assign('/')
  el.applyAndExit.onclick = applyAllAndExit

  if (st.all.length){ chooseProduct(st.all[0].id) }
  st.previewKey = 'id#'+st.pid
  renderFilesList()
}

function keyForId(id){ return id ? 'id#'+id : null }
function newKey(){ st.seq+=1; return 'new#'+st.seq }

async function chooseProduct(id){
  if(!id) return
  st.pid = id
  st.prod = await api.product(id)
  el.search.value = st.prod?.name || ''
  el.prodName.textContent = st.prod?.name || '—'
  el.prodCategory.textContent = st.prod?.category || '—'
  el.price.value = st.prod?.priceUAH ?? ''
  el.desc.value = st.prod?.description ?? ''
  st.previewKey = keyForId(id)
  renderQueues()
  renderCardPreview()
}

function onSearch(){
  const q = norm(el.search.value)
  if (!q){ closeSuggest(); return }
  const list = st.all.filter(p=> norm(p.name).includes(q) || norm(p.category).includes(q)).slice(0,8)
  st.sList = list; st.sIdx = -1
  if (!list.length){ el.suggest.innerHTML='<div class="suggest-empty">Немає результатів</div>'; el.suggest.classList.add('open'); return }
  el.suggest.innerHTML = list.map((p,i)=>`<div class="suggest-item${i===st.sIdx?' hover':''}" data-id="${p.id}">${esc(p.name)} <span style="color:var(--text-secondary)">· ${esc(p.category)}</span></div>`).join('')
  el.suggest.classList.add('open')
  el.suggest.querySelectorAll('.suggest-item').forEach(d=> d.onmousedown = e=>{ e.preventDefault(); closeSuggest(); chooseProduct(parseInt(d.dataset.id,10)) })
}
function onSearchKeys(e){
  const sItems = [...el.suggest.querySelectorAll('.suggest-item')]
  if (!sItems.length) return
  if (e.key==='ArrowDown'){ e.preventDefault(); moveHover(1,sItems) }
  else if (e.key==='ArrowUp'){ e.preventDefault(); moveHover(-1,sItems) }
  else if (e.key==='Enter'){ e.preventDefault(); const h = sItems.find(x=>x.classList.contains('hover'))||sItems[0]; if(h){ closeSuggest(); chooseProduct(parseInt(h.dataset.id,10)) } }
  else if (e.key==='Escape'){ closeSuggest() }
}
function moveHover(dir, nodes){
  const cur = nodes.findIndex(n=>n.classList.contains('hover'))
  const next = Math.max(0, Math.min(nodes.length-1, cur+dir))
  nodes.forEach(n=>n.classList.remove('hover'))
  nodes[next].classList.add('hover')
  nodes[next].scrollIntoView({block:'nearest'})
}
function closeSuggest(){ el.suggest.classList.remove('open'); el.suggest.innerHTML='' }

function stageUpdateSelected(){
  if(!st.pid) return
  const key = keyForId(st.pid)
  const payload = { priceUAH: parseInt(el.price.value||'0',10), description: el.desc.value||'' }
  stageOp(key, 'update', payload, st.prod?.name||('Товар '+st.pid))
  renderCardPreview()
}
function stageDeleteSelected(){
  if(!st.pid) return
  const key = keyForId(st.pid)
  stageOp(key, 'delete', {}, st.prod?.name||('Товар '+st.pid))
  renderCardPreview()
}

function addNewDraftToChanges(){
  const name = el.newName.value.trim(), category = el.newCategory.value.trim()
  const priceUAH = parseInt(el.newPrice.value||'0',10)
  const description = el.newDesc.value||''
  if(!name || !category){ alert('Назва і категорія обовʼязкові'); return }
  const key = newKey()
  st.ops[key] = { type:'create', payload:{ name, category, priceUAH, description }, name }
  pushToOrderEnd(key)
  if (st.fileQ['newDraft']?.length){
    st.fileQ[key] = st.fileQ['newDraft'].slice()
    st.previews[key] = st.previews['newDraft']?.slice()||[]
    st.fileQ['newDraft'] = []
    st.previews['newDraft'] = []
  }
  el.newName.value=''; el.newCategory.value=''; el.newPrice.value=''; el.newDesc.value=''
  st.draft = { name:'', category:'', priceUAH:0, description:'' }
  renderQueues()
  renderChanges()
  renderFilesList()
  st.previewKey = key
  renderCardPreview()
}

function stageOp(key, type, payload, name){
  if(!key) return
  st.ops[key] = { type, payload: payload||{}, name: name||'' }
  pushToOrderEnd(key)
  renderChanges()
}

function pushToOrderEnd(key){
  const i = st.opsOrder.indexOf(key)
  if (i>=0) st.opsOrder.splice(i,1)
  st.opsOrder.push(key)
}

function addFilesToKey(key, fileList){
  if(!key){ alert('Оберіть товар або додайте новий'); return }
  const files=[...fileList||[]].filter(f=>/^image\//.test(f.type))
  if(!files.length) return
  st.fileQ[key] = st.fileQ[key]||[]
  st.previews[key] = st.previews[key]||[]
  files.forEach(f=>{
    st.fileQ[key].push(f)
    const r=new FileReader()
    r.onload=e=>{ st.previews[key].push(e.target.result); if(st.previewKey===key) renderCardPreview(); renderFilesList(); renderQueues() }
    r.readAsDataURL(f)
  })
  if(st.previewKey===key) renderCardPreview()
  renderFilesList()
  renderQueues()
}

function renderQueues(){
  const key = keyForId(st.pid)
  const list = st.fileQ[key]||[]
  el.queueGrid.innerHTML = list.map((f,i)=>`
    <div class="qitem">
      <img src="${st.previews[key]?.[i]||''}" alt="">
      <button class="rm" data-i="${i}">×</button>
      <div class="cap" style="padding:6px">${esc(f.name)}</div>
    </div>
  `).join('')
  el.queueGrid.querySelectorAll('button.rm').forEach(b=> b.onclick=()=>{ const i=parseInt(b.dataset.i,10); list.splice(i,1); st.previews[key].splice(i,1); renderQueues(); renderFilesList(); if(st.previewKey===key) renderCardPreview() })

  const nlist = st.fileQ['newDraft']||[]
  el.newQueueGrid.innerHTML = nlist.map((f,i)=>`
    <div class="qitem">
      <img src="${st.previews['newDraft']?.[i]||''}" alt="">
      <button class="rm" data-i="${i}">×</button>
      <div class="cap" style="padding:6px">${esc(f.name)}</div>
    </div>
  `).join('')
  el.newQueueGrid.querySelectorAll('button.rm').forEach(b=> b.onclick=()=>{ const i=parseInt(b.dataset.i,10); nlist.splice(i,1); st.previews['newDraft'].splice(i,1); renderQueues(); renderFilesList(); if(st.previewKey==='newDraft') renderCardPreview() })
}

function renderChanges(){
  el.changesList.innerHTML = st.opsOrder.map(k=>{
    const op = st.ops[k]; if(!op) return ''
    const badge = op.type==='create' ? '<span class="ch-badge b-add">додано</span>' : op.type==='update' ? '<span class="ch-badge b-upd">змінено</span>' : '<span class="ch-badge b-del">видалено</span>'
    const title = esc(op.name || titleForKey(k))
    return `<div class="ch-item" data-key="${k}">${badge}<div>${title}</div><div class="filecap">${op.type!=='delete' && (st.fileQ[k]?.length||0) ? ' · фото: '+(st.fileQ[k].length) : ''}</div><div style="margin-left:auto"><button class="btn ghost" data-del="${k}">скасувати</button></div></div>`
  }).join('')
  el.changesList.querySelectorAll('.ch-item').forEach(n=>{
    n.onclick = e=>{
      if(e.target.closest('button')) return
      const k = n.dataset.key
      st.previewKey = k
      if(k.startsWith('id#')){ const id=parseInt(k.split('#')[1],10); chooseProduct(id) } else { renderCardPreview() }
    }
  })
  el.changesList.querySelectorAll('button[data-del]').forEach(b=>{
    b.onclick = e=>{
      e.stopPropagation()
      const k = b.dataset.del
      delete st.ops[k]
      const i = st.opsOrder.indexOf(k); if(i>=0) st.opsOrder.splice(i,1)
      delete st.fileQ[k]; delete st.previews[k]
      renderChanges(); renderFilesList(); renderQueues()
      if(st.previewKey===k){ st.previewKey = keyForId(st.pid); renderCardPreview() }
    }
  })
}

function renderFilesList(){
  const items=[]
  for(const k of Object.keys(st.fileQ)){
    const files = st.fileQ[k]
    const name = titleForKey(k)
    const prevs = st.previews[k]||[]
    files.forEach((f,i)=>{
      items.push({k,i,name,file:f,src:prevs[i]||''})
    })
  }
  el.filesList.innerHTML = items.map((it,idx)=>`
    <div class="filecard" data-k="${it.k}" data-i="${it.i}">
      <img src="${it.src}" alt="">
      <div>
        <div><b>${esc(it.file.name)}</b></div>
        <div class="filecap">${esc(it.name)}</div>
      </div>
      <div style="margin-left:auto"><button class="btn ghost" data-rm="${idx}">×</button></div>
    </div>
  `).join('')
  el.filesList.querySelectorAll('button[data-rm]').forEach((b,idx)=>{
    b.onclick=()=>{
      const it = items[idx]
      st.fileQ[it.k].splice(it.i,1)
      st.previews[it.k].splice(it.i,1)
      renderFilesList(); renderQueues(); if(st.previewKey===it.k) renderCardPreview()
    }
  })
}

function titleForKey(k){
  if(k==='newDraft') return 'Новий товар (чернетка)'
  if(k.startsWith('new#')){ const op=st.ops[k]; return op?.name?('Новий: '+op.name):k }
  if(k.startsWith('id#')){ const id=parseInt(k.split('#')[1],10); const p=st.all.find(x=>x.id===id); return p?p.name:('Товар '+id) }
  return k
}

function renderCardPreview(){
  let name='', category='', price=0, description='', img=''
  const k = st.previewKey
  if(k==='newDraft'){
    name = st.draft.name; category = st.draft.category; price = st.draft.priceUAH||0; description = st.draft.description
    img = st.previews['newDraft']?.[0] || ''
  } else if(k && k.startsWith('new#')){
    const op = st.ops[k]
    name = op?.payload?.name||''; category = op?.payload?.category||''; price = op?.payload?.priceUAH||0; description = op?.payload?.description||''
    img = st.previews[k]?.[0] || ''
  } else {
    name = st.prod?.name||''; category = st.prod?.category||''; price = st.prod?.priceUAH||0; description = st.prod?.description||''
    img = (st.previews[keyForId(st.pid)]?.[0]) || (st.prod?.image||'')
  }
  const priceText = price ? formatPrice(price) : ''
  const deleted = (k && st.ops[k]?.type==='delete') || (k===keyForId(st.pid) && st.ops[keyForId(st.pid)]?.type==='delete')
  el.cardPreview.innerHTML = `
    <div class="product-card" style="max-width:260px; position:relative; opacity:${deleted?0.5:1}">
      ${deleted?'<div style="position:absolute;top:8px;left:8px;background:#ef4444;color:#fff;padding:4px 8px;border-radius:8px;font-size:12px;z-index:2">Позначено на видалення</div>':''}
      <div class="product-image-container">
        ${img ? `<img class="product-image" src="${img}${img.startsWith('http')?'':'?t='+Date.now()}" alt="${esc(name)}">` : `<div class="skeleton" style="width:100%;height:100%"></div>`}
      </div>
      <div class="product-info">
        <h3 class="product-name">${esc(name||'Без назви')}</h3>
        <div class="product-price">${priceText}</div>
        <p class="product-description">${esc(description||'')}</p>
      </div>
    </div>
  `
}

async function applyAllAndExit(){
  if(!st.token){ alert('Введіть токен'); return }
  try{
    for(const k of st.opsOrder){
      const op = st.ops[k]; if(!op) continue
      if(op.type==='create'){
        const res = await api.createProduct(op.payload, st.token)
        const newId = res.id
        if(st.fileQ[k]?.length){ await api.upload(newId, st.fileQ[k], st.token) }
      }else if(op.type==='update'){
        const id = parseInt(k.split('#')[1],10)
        await api.saveProduct(id, op.payload, st.token)
        if(st.fileQ[k]?.length){ await api.upload(id, st.fileQ[k], st.token) }
      }else if(op.type==='delete'){
        const id = parseInt(k.split('#')[1],10)
        await api.deleteProduct(id, st.token)
      }
    }
    window.location.assign('/')
  }catch(e){
    alert(e.message||'Помилка застосування змін')
  }
}

function formatPrice(n){ try{ return Number(n).toLocaleString('uk-UA')+' грн' }catch(_){ return n+' грн' } }
function norm(s){ return (s||'').toString().toLowerCase().replace(/і|ї/g,'i').replace(/є/g,'e').replace(/ґ/g,'g') }
function esc(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])) }
function q(sel){ return document.querySelector(sel) }
function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms) } }
