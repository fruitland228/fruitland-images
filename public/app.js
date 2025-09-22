let allProducts=[]
let currentCategory='all'
let searchQuery=''
let currentSlide=0
let currentTheme=''
let currentCardStyle='card-classic'

document.addEventListener('DOMContentLoaded',()=>{
  initCartUI()
  loadAndRender()
  const s1=document.getElementById('searchInput')
  const s2=document.getElementById('searchInputMobile')
  if(s1) s1.addEventListener('input',onSearch)
  if(s2) s2.addEventListener('input',onSearch)
})

async function loadAndRender(){
  allProducts = await fetch('/api/products').then(r=>r.json()).catch(()=>[])
  renderCategories()
  renderGrid()
}

function onSearch(e){
  searchQuery=e.target.value.toLowerCase().trim()
  const s1=document.getElementById('searchInput')
  const s2=document.getElementById('searchInputMobile')
  if(s1 && s1!==e.target) s1.value=e.target.value
  if(s2 && s2!==e.target) s2.value=e.target.value
  renderGrid()
  renderCategories()
}

function renderCategories(){
  const byCat=allProducts.reduce((m,p)=>{m[p.category]=(m[p.category]||0)+1;return m},{})
  const list=Object.entries(byCat).filter(([,n])=>n>0).sort((a,b)=>a[0].localeCompare(b[0],'uk'))
  const make=(active)=>['all',...list.map(([c])=>c)].map(c=>{
    const cnt=c==='all'?allProducts.length:(byCat[c]||0)
    const act=(active===c)?' active':''
    const label=c==='all'?'Усі товари':c
    return `<li class="category-item${act}" data-category="${c}">${label}${cnt?'' : ''}</li>`
  }).join('')
  const el1=document.getElementById('categoryList')
  const el2=document.getElementById('mobileCategoryList')
  if(el1) el1.innerHTML=make(currentCategory)
  if(el2) el2.innerHTML=make(currentCategory)
  ;[el1,el2].forEach(el=>{
    if(!el) return
    el.querySelectorAll('.category-item').forEach(it=>it.onclick=()=>{
      currentCategory=it.dataset.category
      renderCategories()
      renderGrid()
      if(el.id==='mobileCategoryList') toggleMobileDrawer()
    })
  })
}

function renderGrid(){
  const grid=document.getElementById('productsGrid'); if(!grid) return
  const q=searchQuery
  const list=allProducts.filter(p=>{
    const okCat=currentCategory==='all'||p.category===currentCategory
    const okQ=!q||p.name.toLowerCase().includes(q)
    return okCat&&okQ
  })
  grid.innerHTML=list.map(p=>{
    const price=new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:0}).format(p.priceUAH).replace(',00','')
    return `<article class="product-card" data-id="${p.id}">
      <div class="product-image-container skeleton">
        <img class="product-image" src="${p.image||''}" alt="${p.name}">
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <div class="product-price">${price}</div>
        <p class="product-description">${p.description||''}</p>
      </div>
    </article>`
  }).join('')
  grid.querySelectorAll('.product-card').forEach(c=>c.onclick=()=>{location.href='product.html?id='+c.dataset.id})
}

function moveCarousel(dir){
  const inner=document.getElementById('carouselInner'); if(!inner) return
  const slides=inner.children.length
  currentSlide+=dir
  if(currentSlide<0) currentSlide=slides-1
  if(currentSlide>=slides) currentSlide=0
  inner.style.transform=`translateX(-${currentSlide*100}%)`
}

function toggleMobileDrawer(){
  const dr=document.getElementById('mobileDrawer')
  const ov=document.getElementById('drawerOverlay')
  if(!dr||!ov) return
  const open=!dr.classList.contains('open')
  dr.classList.toggle('open',open)
  ov.classList.toggle('open',open)
}
function toggleContactPopup(){
  const p=document.getElementById('contactPopup')
  const ov=document.getElementById('drawerOverlay')
  if(!p||!ov) return
  const open=!p.classList.contains('open')
  p.classList.toggle('open',open)
  ov.classList.toggle('open',open)
}
function closeOverlays(){
  const md=document.getElementById('mobileDrawer')
  const cp=document.getElementById('contactPopup')
  const cd=document.getElementById('cartDrawer')
  const ov=document.getElementById('drawerOverlay')
  if(md) md.classList.remove('open')
  if(cp) cp.classList.remove('open')
  if(cd) cd.classList.remove('open')
  if(ov) ov.classList.remove('open')
}

function toggleStyleSwitcher(){
  const o=document.getElementById('styleOptions'); if(o) o.classList.toggle('open')
}
function setTheme(theme){
  document.body.className=document.body.className.replace(/theme-\w+/g,'')
  if(theme) document.body.classList.add(theme)
  currentTheme=theme
  document.querySelectorAll('.theme-btn').forEach(b=>{b.classList.toggle('active',b.dataset.theme===theme)})
  document.body.classList.add(currentCardStyle)
}
function setCardStyle(style){
  document.body.className=document.body.className.replace(/card-\w+/g,'')
  document.body.classList.add(style)
  currentCardStyle=style
  document.querySelectorAll('.card-btn').forEach(b=>{b.classList.toggle('active',b.dataset.card===style)})
  if(currentTheme) document.body.classList.add(currentTheme)
}
