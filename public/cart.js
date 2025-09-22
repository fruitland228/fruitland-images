const CART_KEY='cart-v2'
let CART=loadCart()

function loadCart(){try{const raw=localStorage.getItem(CART_KEY);return raw?JSON.parse(raw):{}}catch(e){return {}}}
function saveCart(){localStorage.setItem(CART_KEY,JSON.stringify(CART));updateCartUI()}
function addToCart(item){
  const key=item.id+'|'+(item.potSize||'1')+'|'+(item.note||'')
  if(!CART[key]) CART[key]={...item}
  else CART[key].qty+=item.qty
  saveCart()
}
function removeFromCart(key){delete CART[key];saveCart()}
function setQty(key,v){CART[key].qty=Math.max(1,v);saveCart()}
function sum(){return Object.values(CART).reduce((s,i)=>s+Math.round(i.basePrice*(i.potMult||1))*i.qty,0)}
function count(){return Object.values(CART).reduce((s,i)=>s+i.qty,0)}
function fmt(v){return new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:0}).format(v).replace(',00','')}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]))}

function initCartUI(){
  document.querySelectorAll('.cart-icon').forEach(x=>x.onclick=openCart)
  const close=document.getElementById('closeCart')
  const ov=document.getElementById('drawerOverlay')
  const dr=document.getElementById('cartDrawer')
  if(close) close.onclick=closeCart
  if(ov) ov.addEventListener('click', ()=>{closeCart();})
  const clr=document.getElementById('clearCart')
  if(clr) clr.onclick=()=>{CART={};saveCart()}
  updateCartUI()
}
function openCart(){document.getElementById('cartDrawer').classList.add('open');document.getElementById('drawerOverlay').classList.add('open')}
function closeCart(){document.getElementById('cartDrawer').classList.remove('open');document.getElementById('drawerOverlay').classList.remove('open')}
function updateCartUI(){
  document.querySelectorAll('.cart-badge').forEach(b=>b.textContent=count())
  const list=document.getElementById('cartList'); if(!list) return
  const rows=Object.entries(CART).map(([key,i])=>{
    const line=Math.round(i.basePrice*(i.potMult||1))*i.qty
    return `<div class="cart-item">
      <img src="${i.image||''}" alt="">
      <div>
        <div style="font-weight:600">${i.name}</div>
        <div style="color:#6b7280">${fmt(i.basePrice)} • ${i.potSize||'1'} л${i.note?` • ${escapeHtml(i.note)}`:''}</div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
          <div class="qty">
            <button data-act="minus" data-key="${key}" class="btn">−</button>
            <input data-key="${key}" value="${i.qty}" min="1" type="number">
            <button data-act="plus" data-key="${key}" class="btn">+</button>
          </div>
          <button class="btn danger" data-act="remove" data-key="${key}">Прибрати</button>
        </div>
      </div>
      <div style="font-weight:700">${fmt(line)}</div>
    </div>`
  }).join('')
  list.innerHTML=rows||'<div style="color:#6b7280">Порожній кошик</div>'
  const totalEl=document.getElementById('cartTotal'); if(totalEl) totalEl.textContent=fmt(sum())
  list.querySelectorAll('button[data-act]').forEach(b=>{
    const key=b.dataset.key
    b.onclick=()=>{
      if(b.dataset.act==='remove') removeFromCart(key)
      if(b.dataset.act==='minus') setQty(key,Math.max(1,(CART[key]?.qty||1)-1))
      if(b.dataset.act==='plus') setQty(key,(CART[key]?.qty||1)+1)
    }
  })
  list.querySelectorAll('input[type="number"]').forEach(inp=>{
    inp.onchange=()=>{const v=Math.max(1,parseInt(inp.value||'1',10));setQty(inp.dataset.key,v)}
  })
}
function toast(t){const el=document.getElementById('toast');if(!el)return;el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1200)}
