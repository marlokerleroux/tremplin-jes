import React, { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { ArrowUp, ArrowUpRight, ArrowRight, AudioLines, Check, ChevronDown, Copy, Info, Mic2, Mic, Square, LoaderCircle, Minus, RotateCcw, Ticket, Users, X, CalendarDays, ExternalLink, Heart, Trophy, ShieldCheck } from 'lucide-react';
import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource/montserrat/latin-800.css';
import '@fontsource/montserrat/latin-900.css';
import './styles.css';
import { API_BASE, assetUrl } from './runtime';
import { useVoiceRecorder } from './useVoiceRecorder';

const SITE='https://www.tremplin-jeunes-en-scene.fr';
type Source={id:string;title:string;url?:string};
type Message={id:string;role:'user'|'assistant';content:string;sources?:Source[]};
const prompts=[
  {icon:Ticket,label:'Comment participer ?',question:'Comment m’inscrire à l’édition 2027 du Tremplin ?'},
  {icon:Users,label:'Est-ce que je peux m’inscrire ?',question:'Quelles sont les conditions pour participer au Tremplin ?'},
  {icon:Mic2,label:'Les auditions, ça se passe comment ?',question:'Quand et où ont lieu les auditions 2027, et comment se passent-elles ?'},
];
function Mark({small=false}:{small?:boolean}) {return <span className={`brand-mark ${small?'small':''}`} aria-hidden="true"><span className="mark-back"/><span className="mark-front"><AudioLines strokeWidth={2.5}/></span></span>;}
function SourceLinks({sources}:{sources:Source[]}) {return <div className="sources"><span className="sources-caption"><ShieldCheck size={12}/> Sources de cette réponse</span>{sources.map(s=>s.url&&/^https:\/\//.test(s.url)?<a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ArrowUpRight size={13}/></a>:<span className="document-source" key={s.id}>{s.title}</span>)}</div>;}
function AssistantMessage({message}:{message:Message}) {
  const [copied,setCopied]=useState(false);
  async function copy(){try{await navigator.clipboard.writeText(message.content);setCopied(true);setTimeout(()=>setCopied(false),1800);}catch{setCopied(false);}}
  return <article className="assistant-message"><div className="message-byline"><Mark small/><span>En coulisses</span><span className="ai-label">IA</span></div><div className="answer-body"><Markdown skipHtml disallowedElements={['img','iframe','script']} components={{a:({children})=><span>{children}</span>}}>{message.content}</Markdown></div>{!!message.sources?.length&&<SourceLinks sources={message.sources}/>}<button className="copy-button" onClick={copy} aria-label={copied?'Réponse copiée':'Copier la réponse'}>{copied?<Check size={13}/>:<Copy size={13}/>}<span>{copied?'Copié !':'Copier'}</span></button></article>;
}
function Chat() {
  const params=new URLSearchParams(location.search);
  const standalone=!params.has('embed');
  const [open,setOpen]=useState(standalone||params.get('open')==='1');
  const [messages,setMessages]=useState<Message[]>([]);
  const [input,setInput]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const [info,setInfo]=useState(false);const [sourceState,setSourceState]=useState<{documents:number;indexedAt:string}|null>(null);
  const scrollRef=useRef<HTMLDivElement>(null);const inputRef=useRef<HTMLTextAreaElement>(null);const launchRef=useRef<HTMLButtonElement>(null);
  const conversationId=useRef(crypto.randomUUID());
  const requestRef=useRef<AbortController|null>(null);const sendingRef=useRef(false);
  const voice=useVoiceRecorder(text=>{setInput(text);setTimeout(()=>inputRef.current?.focus(),0);});
  const hasText=!!input.trim();
  const actionLabel=voice.state==='recording'?'Arrêter et transcrire le vocal':voice.state==='permission'?'Autorisation du micro en attente':voice.state==='transcribing'?'Transcription en cours':hasText?'Envoyer la question':'Enregistrer un vocal';
  const voiceHint=voice.state==='recording'?'Appuie sur stop pour transcrire · 1 min max':voice.state==='permission'?'Autorise le micro dans ton navigateur.':voice.state==='transcribing'?'Ton vocal devient un texte à relire.':'';
  const parentOrigin=params.get('parent')||location.origin;
  useEffect(()=>{document.documentElement.classList.add('chat-document');if(standalone)document.documentElement.classList.add('standalone');return()=>{document.documentElement.classList.remove('chat-document','standalone');};},[]);
  useEffect(()=>{
    if(window.parent!==window)window.parent.postMessage({type:'tremplin:resize',open},parentOrigin);
  },[open,parentOrigin]);
  useEffect(()=>{
    const listener=(e:MessageEvent)=>{if(e.source===window.parent&&e.origin===parentOrigin&&e.data?.type==='tremplin:open'){setOpen(true);setTimeout(()=>inputRef.current?.focus(),100);}};
    window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener);
  },[parentOrigin]);
  useEffect(()=>{fetch(`${API_BASE}/sources`).then(r=>r.ok?r.json():null).then(setSourceState).catch(()=>{});return()=>requestRef.current?.abort();},[]);
  useEffect(()=>{const node=scrollRef.current;if(node)node.scrollTo({top:messages.length?node.scrollHeight:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});},[messages,busy,error]);
  useEffect(()=>{const node=inputRef.current;if(node){node.style.height='auto';node.style.height=`${Math.min(node.scrollHeight,96)}px`;}},[input,voice.state]);
  function close(){voice.cancel();setOpen(false);setInfo(false);setTimeout(()=>launchRef.current?.focus(),30);}
  function toggle(){if(open)close();else{setOpen(true);setTimeout(()=>inputRef.current?.focus(),150);}}
  function reset(){if(busy)return;conversationId.current=crypto.randomUUID();voice.cancel();setMessages([]);setError('');setInput('');setInfo(false);inputRef.current?.focus();}
  async function submit(question:string,retry=false) {
    const text=question.trim();if(!text||text.length>1500||sendingRef.current)return;
    voice.cancel();
    sendingRef.current=true;setBusy(true);setError('');setInfo(false);
    const next=retry?messages:[...messages,{id:crypto.randomUUID(),role:'user' as const,content:text}];
    setMessages(next);setInput('');if(inputRef.current)inputRef.current.style.height='auto';
    const controller=new AbortController();requestRef.current=controller;
    try {
      const response=await fetch(`${API_BASE}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversationId:conversationId.current,messages:next.slice(-12).map(({role,content})=>({role,content}))}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(85000)])});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'La connexion a été interrompue. Réessaie dans un instant.');
      if(typeof data.answer!=='string')throw new Error('La réponse n’a pas pu être lue. Réessaie dans un instant.');
      setMessages([...next,{id:crypto.randomUUID(),role:'assistant',content:data.answer,sources:data.sources}]);
    }catch(e){if(!controller.signal.aborted)setError(e instanceof Error&&e.name!=='TimeoutError'&&e.name!=='TypeError'?e.message:'La connexion prend plus de temps que prévu. Tu peux réessayer.');}
    finally{sendingRef.current=false;setBusy(false);requestRef.current=null;}
  }
  return <div className={`widget-shell ${open?'is-open':''}`} onKeyDown={e=>{if(e.key==='Escape'&&open){e.preventDefault();if(voice.active)voice.cancel();else close();}}}>
    {open&&<section className="chat-panel" aria-label="Discussion avec En coulisses">
      <header className="chat-header"><div className="header-main"><Mark/><div className="header-name"><h1>En coulisses<span className="title-dot">.</span></h1><p>L’assistant du Tremplin</p></div><div className="header-actions"><button onClick={reset} disabled={busy||!messages.length} aria-label="Nouvelle conversation" title="Nouvelle conversation"><RotateCcw size={17}/></button><button onClick={close} aria-label="Réduire la discussion" title="Réduire"><Minus size={22}/></button></div></div><div className="header-bottom"><span className="header-note"><span/> Du premier doute au premier live.</span><AudioLines size={18}/></div><div className="brand-tabs" aria-hidden="true"><i/><i/><i/></div></header>
      <div className="chat-scroll" ref={scrollRef}>
        {messages.length===0?<div className="welcome"><div className="welcome-title"><h2>Ta scène.<br/>Tes questions.</h2><span className="hello-sticker">À TOI<br/>DE JOUER <ArrowUpRight size={19}/></span></div><p className="welcome-copy">Salut ! Une envie de monter sur scène ?<br/>Je t’aide à faire le premier pas.</p><div className="prompt-list"><p>On commence par quoi ?</p>{prompts.map(({icon:Icon,label,question},i)=><button key={label} onClick={()=>submit(question)} className={`prompt prompt-${i}`}><span className="prompt-icon"><Icon size={19} strokeWidth={1.8}/></span><span>{label}</span><ArrowUpRight size={16}/></button>)}</div><div className="welcome-foot"><Heart size={14}/><span>Tous les styles. Toutes les questions.</span></div></div>:<><div className="conversation-date"><span/>C’est à toi<span/></div><div role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions">{messages.map(message=>message.role==='user'?<div className="user-message" key={message.id}><span className="sr-only">Toi : </span>{message.content}</div>:<AssistantMessage key={message.id} message={message}/>)}</div>{busy&&<div className="typing" role="status"><Mark small/><div><span>Je regarde dans les coulisses</span><span className="typing-dots"><i/><i/><i/></span></div></div>}{error&&<div className="chat-error" role="alert"><p>{error}</p><button onClick={()=>submit(messages.at(-1)?.content||'',true)}><RotateCcw size={14}/>Réessayer</button></div>}{!busy&&!error&&messages.at(-1)?.role==='assistant'&&<div className="followups"><button onClick={()=>submit('Quelles sont les dates importantes de l’édition 2027 ?')}>Les dates à retenir<ArrowRight size={13}/></button><button onClick={()=>submit('Comment contacter l’association ?')}>Contacter l’équipe<ArrowRight size={13}/></button></div>}</>}
      </div>
      {info&&<aside className="info-panel" aria-label="À propos de l’assistant"><button className="info-close" onClick={()=>setInfo(false)} aria-label="Fermer les informations"><X size={15}/></button><strong>Un coup de main, sources à l’appui.</strong><p>Je suis un assistant IA : mes réponses s’appuient sur les pages publiques du Tremplin et les documents fournis par l’association. Elles peuvent contenir des erreurs.</p>{sourceState?.indexedAt&&<p>{sourceState.documents} sources documentaires · Mise à jour le {new Date(sourceState.indexedAt).toLocaleDateString('fr-FR')}.</p>}<p>Évite les informations personnelles. Tes messages sont transmis à OpenRouter pour générer les réponses. Si tu utilises le micro, ton vocal y est aussi envoyé pour être transcrit ; il n’est pas enregistré sur notre serveur. Les questions et les réponses sont conservées dans un espace privé de l’association pour améliorer l’assistant et préparer sa communication. Les adresses e-mail et numéros de téléphone français détectés sont masqués avant cet enregistrement. La discussion affichée ici disparaît au rechargement.</p><a href={`${SITE}/privacy`} target="_blank" rel="noopener noreferrer">Confidentialité du site<ArrowUpRight size={12}/></a></aside>}
      <footer className="chat-footer">
        <form className={voice.state==='recording'?'is-recording':''} onSubmit={e=>{e.preventDefault();if(busy)return;if(voice.state==='recording')voice.stop();else if(!voice.active){if(hasText)submit(input);else void voice.start();}}}>
          <label htmlFor="chat-input" className="sr-only">Ta question sur le Tremplin</label>
          {voice.active?<div className="voice-capture"><AudioLines size={20} aria-hidden="true"/><span>{voice.state==='recording'?'Je t’écoute…':voice.state==='permission'?'Accès au micro…':'Je transcris…'}</span>{voice.state==='recording'&&<time aria-label={`${voice.seconds} secondes enregistrées`}>{Math.floor(voice.seconds/60)}:{String(voice.seconds%60).padStart(2,'0')}</time>}</div>:<textarea ref={inputRef} id="chat-input" rows={1} maxLength={1500} value={input} placeholder="Écris ou enregistre ta question…" onChange={e=>{setInput(e.target.value);voice.clearError();}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();if(hasText)submit(input);}}}/>}
          <button className={`send-button ${voice.state==='recording'?'is-recording':''}`} type="submit" disabled={busy||voice.state==='permission'||voice.state==='transcribing'} aria-label={actionLabel} title={actionLabel}>
            {voice.state==='recording'?<Square size={16} fill="currentColor"/>:voice.active?<LoaderCircle className="voice-spinner" size={21}/>:hasText?<ArrowUp size={21} strokeWidth={2.4}/>:<Mic size={21} strokeWidth={2}/>}
          </button>
        </form>
        <p className="voice-hint" role="status" aria-live="polite">{voiceHint}</p>
        {voice.error&&<p className="voice-error" role="alert">{voice.error}</p>}
        <div className="footer-note"><span>Assistant IA <i/> Questions conservées pour l’équipe</span><button aria-label="Informations et confidentialité de l’assistant" aria-expanded={info} onClick={()=>setInfo(!info)}><Info size={14}/></button></div>{input.length>1350&&<span className="character-count">{input.length}/1 500</span>}
      </footer>
    </section>}
    <button ref={launchRef} className={`launcher ${open?'launcher-open':''}`} onClick={toggle} aria-label={open?'Fermer le chatbot':'Ouvrir le chatbot En coulisses'} aria-expanded={open}>{open?<><span>On reste dans le coin.</span><span className="launcher-close"><ChevronDown size={23}/></span></>:<><Mark small/><span>On en parle ?<small>Entre dans les coulisses</small></span><span className="launcher-notification" aria-hidden="true"/></>}</button>
  </div>;
}
function Preview() {
  useEffect(()=>{const script=document.createElement('script');script.src='/widget.js';script.dataset.open='true';document.body.appendChild(script);return()=>{script.remove();document.getElementById('tremplin-chat-frame')?.remove();};},[]);
  return <div className="site-preview"><header className="site-header"><a href="#" aria-label="Accueil du Tremplin"><img src={assetUrl('assets/logo.png')} alt="Tremplin Jeunes en Scène" width="120" height="49"/></a><nav aria-label="Navigation principale"><a href="#participer">Comment ça marche</a><a href={`${SITE}/#palmares`} target="_blank" rel="noopener noreferrer">Palmarès</a><a href={`${SITE}/#partenaires`} target="_blank" rel="noopener noreferrer">Partenaires</a><a href={`${SITE}/a-propos`} target="_blank" rel="noopener noreferrer">À propos<ArrowUpRight size={13}/></a></nav></header>
    <main><section className="site-hero"><img className="concert-photo" src={assetUrl('assets/concert.jpg')} alt="Les jeunes artistes du Tremplin en concert sous les projecteurs" fetchPriority="high"/><div className="hero-shade"/><div className="hero-content"><img className="hero-logo" src={assetUrl('assets/logo.png')} alt="" width="200" height="82"/><span className="edition-sticker">ÉDITION 2027</span><h1>BIENTÔT<br/>DE RETOUR<span>!</span></h1><p>La scène t’attend.<br className="mobile-break"/> L’aventure commence ici.</p><div className="opening-date"><CalendarDays size={18}/><span>Ouverture des inscriptions<br/><strong>21 octobre 2026 · 12h</strong></span></div><a className="hero-cta" href="#participer">COMMENT PARTICIPER<ArrowUpRight size={18}/></a></div><div className="hero-side-note">BRETAGNE · MUSIQUE LIVE · JEUNES TALENTS</div><div className="hero-bottom"><span>13—23 ANS</span><span>GRATUIT</span><span>TOUS LES STYLES</span></div></section>
    <section id="participer" className="participate-section"><div className="section-heading"><h2>Du talent.<br/><span>Et un premier pas.</span></h2><p>Tu as entre 13 et 23 ans et tu vis en Bretagne ?<br/>En solo ou en groupe, fais entendre ce qui t’anime.</p></div><div className="steps"><article><Ticket/><h3>Inscris-toi</h3><p>Du 21 octobre au 31 décembre 2026, rejoins l’aventure gratuitement.</p></article><article><Mic2/><h3>Monte sur scène</h3><p>Les 23 et 24 janvier 2027, les auditions se passent en live à Brest.</p></article><article><AudioLines/><h3>Trouve ta voix</h3><p>Six finalistes accompagnés par des professionnels pour préparer la suite.</p></article><article><Trophy/><h3>Fais vibrer le public</h3><p>Rendez-vous au printemps 2027 pour la grande finale à Brest.</p></article></div><button className="ask-cta" onClick={()=>window.dispatchEvent(new Event('tremplin:open'))}>Une question avant de te lancer ?<ArrowRight size={19}/></button></section></main><footer className="site-footer"><img src={assetUrl('assets/logo.png')} alt="Tremplin Jeunes en Scène" width="105"/><p>Une aventure de l’association Pass’Musique.</p><a href={SITE} target="_blank" rel="noopener noreferrer">Aller sur le site officiel<ExternalLink size={14}/></a><span className="preview-label">Aperçu local du chatbot</span></footer></div>;
}

export default function App() { return (location.pathname==='/chat'||location.pathname.endsWith('/chatbot/index.html'))?<Chat/>:<Preview/>; }
