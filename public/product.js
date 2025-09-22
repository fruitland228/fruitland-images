let product=null
let potMult=1
let qty=1

document.addEventListener('DOMContentLoaded',async()=>{
  initCartUI()
  const id=parseInt(new URL(location.href).searchParams.get('id')||'0',10)
  if(!id){location.href='./';return}
  product=await fetch('/api/products/'+id).then(r=>r.json()).catch(()=>null)
  if(!product||product.error){location.href='./';return}
  document.getElementById('pImg').src=product.image||''
  document.getElementById('pImg').alt=product.name
  document.getElementById('pName').textContent=product.name
  document.getElementById('pBasePrice').textContent=fmt(product.priceUAH)
  document.getElementById('pDesc').textContent=product.description||''
  document.getElementById('pCalc').textContent=fmt(calc())
  document.getElementById('pPot').addEventListener('change',e=>{
    const m=parseFloat(e.target.selectedOptions[0].dataset.mult||'1')
    potMult=isNaN(m)?1:m
    document.getElementById('pCalc').textContent=fmt(calc())
  })
  document.getElementById('qMinus').onclick=()=>{qty=Math.max(1,qty-1);document.getElementById('pQty').value=qty;document.getElementById('pCalc').textContent=fmt(calc())}
  document.getElementById('qPlus').onclick=()=>{qty+=1;document.getElementById('pQty').value=qty;document.getElementById('pCalc').textContent=fmt(calc())}
  document.getElementById('pQty').onchange=e=>{qty=Math.max(1,parseInt(e.target.value||'1',10));e.target.value=qty;document.getElementById('pCalc').textContent=fmt(calc())}
  document.getElementById('addToCart').onclick=()=>{
    const note=document.getElementById('pNote').value.trim()
    const pot=document.getElementById('pPot').value
    addToCart({id:product.id,name:product.name,basePrice:product.priceUAH,image:product.image||'',potSize:pot,potMult:potMult,qty:qty,note:note})
    toast('Додано в кошик')
  }
})

function calc(){return Math.round(product.priceUAH*potMult)*qty}
function fmt(v){return new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:0}).format(v).replace(',00','')}
