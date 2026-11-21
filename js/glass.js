// A rounded lens bends the backdrop only near the perimeter. Labels stay sharp.
(() => {
  const buttons = [...document.querySelectorAll('.hero-buttons .btn')];
  if (!buttons.length || !window.ResizeObserver || !CSS.supports('backdrop-filter','url(#lens)')) return;
  // WebKit and Gecko use the native translucent/blur finish in the shared stylesheet.
  if (!/Chrom(?:e|ium)\//.test(navigator.userAgent)) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns,'svg');
  svg.setAttribute('aria-hidden','true');
  svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  const defs = document.createElementNS(ns,'defs');
  svg.append(defs);
  document.body.append(svg);
  function primitive(parent, tag, attrs) {
    const node = document.createElementNS(ns,tag);
    for (const [key,value] of Object.entries(attrs)) node.setAttribute(key,value);
    parent.append(node);
    return node;
  }
  buttons.forEach((button,i) => {
    const id = 'syst-lens-' + i;
    const filter = primitive(defs,'filter',{id,x:0,y:0,width:'100%',height:'100%','color-interpolation-filters':'sRGB'});
    const map = primitive(filter,'feImage',{preserveAspectRatio:'none',result:'edge'});
    primitive(filter,'feDisplacementMap',{in:'SourceGraphic',in2:'edge',scale:15,xChannelSelector:'R',yChannelSelector:'G'});
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const observer = new ResizeObserver(() => {
      const w = button.offsetWidth, h = button.offsetHeight;
      if (!w || !h || (canvas.width === w && canvas.height === h)) return;
      canvas.width = w; canvas.height = h;
      const pixels = ctx.createImageData(w,h);
      const radius = Math.min(16,h/2,w/2);
      for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
        const dx=x+.5-Math.min(w-radius,Math.max(radius,x+.5));
        const dy=y+.5-Math.min(h-radius,Math.max(radius,y+.5));
        const distance=Math.hypot(dx,dy);
        const bend=Math.pow(Math.max(0,1-Math.abs(radius-distance)/8),1.5);
        const j=4*(y*w+x);
        pixels.data[j]=128+120*bend*dx/(distance||1);
        pixels.data[j+1]=128+120*bend*dy/(distance||1);
        pixels.data[j+3]=255;
      }
      ctx.putImageData(pixels,0,0);
      map.setAttribute('href',canvas.toDataURL());
      button.style.setProperty('--glass-optics','url(#'+id+') blur(1.4px) saturate(1.22)');
    });
    observer.observe(button);
  });
})();
