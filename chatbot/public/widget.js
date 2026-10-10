(() => {
  if (document.getElementById('tremplin-chat-frame')) return;
  const script = document.currentScript;
  const base = new URL(script.src).origin;
  const frame = document.createElement('iframe');
  const startOpen = script.dataset.open === 'true' && window.innerWidth > 640;
  frame.id = 'tremplin-chat-frame';
  frame.title = 'En coulisses — Assistant du Tremplin Jeunes en Scène';
  frame.src = `${base}/chat?embed=1&open=${startOpen ? '1' : '0'}&parent=${encodeURIComponent(location.origin)}`;
  frame.setAttribute('allow',`clipboard-write; microphone ${base}`);
  frame.style.cssText = 'position:fixed;bottom:0;right:0;width:254px;height:106px;border:0;z-index:2147483000;background:transparent;color-scheme:light;';
  let open = startOpen;
  function resize() {
    frame.style.width = open ? 'min(460px,100vw)' : '254px';
    frame.style.height = open ? 'min(810px,100dvh)' : '106px';
    frame.style.maxHeight = '100dvh';
  }
  window.addEventListener('message', e => {
    if (e.origin !== base || e.source !== frame.contentWindow || e.data?.type !== 'tremplin:resize') return;
    open = e.data.open === true; resize();
  });
  window.addEventListener('tremplin:open', () => frame.contentWindow?.postMessage({type:'tremplin:open'},base));
  resize();
  document.body.appendChild(frame);
})();
