export async function GET() {
  const script = `(function(){
    var script=document.currentScript;
    var id=script&&script.getAttribute('data-bot');
    if(!id||!/^[a-f0-9-]{36}$/i.test(id))return;
    if(document.querySelector('[data-knowledge-widget="'+id+'"]'))return;
    var origin=new URL(script.src).origin;
    var host=document.createElement('div');host.setAttribute('data-knowledge-widget',id);host.style.cssText='all:initial';document.body.appendChild(host);
    var frame=document.createElement('iframe');frame.src=origin+'/widget/'+encodeURIComponent(id);frame.title='Customer support assistant';frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
    frame.style.cssText='all:initial;display:none;position:fixed;right:16px;bottom:88px;width:min(390px,calc(100vw - 32px));height:min(600px,calc(100dvh - 120px));border:1px solid #3f3f46;border-radius:20px;box-shadow:0 15px 60px #0004;z-index:2147483646;background:#18181b';host.appendChild(frame);
    var button=document.createElement('button');button.type='button';button.textContent='Ask us a question';button.setAttribute('aria-expanded','false');button.style.cssText='all:initial;position:fixed;bottom:20px;right:16px;z-index:2147483646;border:0;border-radius:999px;background:#7c3aed;color:white;padding:16px 22px;font:600 14px system-ui;box-shadow:0 8px 30px #0003;cursor:pointer';host.appendChild(button);
    function close(){frame.style.display='none';button.textContent='Ask us a question';button.setAttribute('aria-expanded','false');button.focus();}
    button.onclick=function(){var open=frame.style.display==='none';frame.style.display=open?'block':'none';button.textContent=open?'Close chat':'Ask us a question';button.setAttribute('aria-expanded',String(open));};
    button.onfocus=function(){button.style.outline='3px solid #a78bfa';button.style.outlineOffset='3px';};button.onblur=function(){button.style.outline='none';};
    document.addEventListener('keydown',function(event){if(event.key==='Escape'&&frame.style.display!=='none')close();});
  })();`;
  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
