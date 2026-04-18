// ── js/08_display.js ──
// ║  CUSTOMER DISPLAY                                        ║
// ═══════════════════════════════════════════════════════════
function pushDisplayCart(){
  var sub=0,disc=0;for(var i=0;i<cart.length;i++)sub+=cart[i].price*cart[i].qty;
  var discEl=$('disc-in');if(discEl)disc=parseFloat(discEl.value)||0;
  var methEl=$('pay-method');
  localStorage.setItem('hashayshi_display_cart',JSON.stringify({active:cart.length>0,items:cart.map(function(it){return{name:it.name,price:it.price,qty:it.qty};}),total:Math.max(0,sub-disc),discount:disc,paymentMethod:cart.length>0?(methEl?methEl.value:null):null,paid:0,ts:Date.now()}));
}
function pushDisplayComplete(total){
  localStorage.setItem('hashayshi_display_complete',JSON.stringify({id:'sale_'+Date.now(),total:total,ts:Date.now()}));
  localStorage.setItem('hashayshi_display_cart',JSON.stringify({active:false,items:[],total:0}));
}

// ═══════════════════════════════════════════════════════════
