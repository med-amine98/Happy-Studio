import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, AudioLines, Clapperboard, Film, LoaderCircle, Play, Plus, Sparkles, WandSparkles } from 'lucide-react';

const examples = [
  { tag: 'Nature', text: 'Un renard traverse une forêt de pins au lever du soleil, brume légère, travelling cinématographique.' },
  { tag: 'Sci-fi', text: 'Une astronaute contemple une mégapole futuriste depuis un toit sous la pluie, néons réfléchis, ambiance film noir.' },
  { tag: 'Produit', text: 'Une bouteille de parfum en verre posé sur une pierre noire, eau qui ruisselle, lumière studio dramatique.' },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('5');
  const [ratio, setRatio] = useState('16:9');
  const [resolution] = useState('480p');
  const [audio, setAudio] = useState(true);
  const [phase, setPhase] = useState('idle');
  const [statusText, setStatusText] = useState('');
  const [video, setVideo] = useState('');
  const [error, setError] = useState('');
  const [startedAt, setStartedAt] = useState(null);
  const stopPolling = useRef(false);

  useEffect(() => () => { stopPolling.current = true; }, []);

  async function createVideo(event) {
    event.preventDefault();
    if (phase === 'working' || prompt.trim().length < 3) return;
    setError(''); setVideo(''); setPhase('working'); setStatusText('Envoi de votre scène à Magic Hour…');
    setStartedAt(Date.now()); stopPolling.current = false;
    try {
      const response = await fetch('/api/videos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration: Number(duration), aspect_ratio: ratio, resolution, generate_audio: audio }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Impossible de démarrer la génération.');
      await poll(data.request_id);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.'); setPhase('error'); setStatusText('');
    }
  }

  async function poll(requestId) {
    const deadline = Date.now() + 12 * 60 * 1000;
    while (!stopPolling.current && Date.now() < deadline) {
      await wait(4000);
      if (stopPolling.current) return;
      const response = await fetch(`/api/videos/${encodeURIComponent(requestId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Impossible de récupérer le statut.');
      if (data.status === 'done' && data.video?.url) {
        setVideo(data.video.url); setPhase('done'); setStatusText('Votre vidéo est prête'); return;
      }
      if (data.status === 'failed') throw new Error(data.error || 'Magic Hour n’a pas pu générer cette vidéo. Essaie un autre prompt.');
      setStatusText('Magic Hour compose ta scène…');
    }
    if (!stopPolling.current) throw new Error('La génération prend plus de temps que prévu. La requête peut toujours être en cours chez Magic Hour.');
  }

  const elapsed = startedAt ? Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) : 0;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Grok Studio, accueil"><span className="brand-mark"><Clapperboard size={19} strokeWidth={2.2} /></span><span>grok<span className="brand-light">studio</span></span><span className="brand-dot" /></a>
        <div className="topbar-right"><span className="model-pill"><span className="live-dot" /> MAGIC HOUR · FREE TIER</span><span className="topbar-note">AI VIDEO WORKSPACE</span></div>
      </header>

      <section className="workspace" id="top">
        <aside className="control-panel">
          <div className="eyebrow"><span className="eyebrow-line" /> ATELIER DE CRÉATION <span className="step-number">01 / 02</span></div>
          <h1>Donnez une scène<br />à vos <em>idées.</em></h1>
          <p className="lede">Décris l’image que tu as en tête. Magic Hour lui donnera vie.</p>

          <form onSubmit={createVideo}>
            <div className="field-heading"><label htmlFor="prompt">VOTRE PROMPT</label><span>{prompt.length} / 2 000</span></div>
            <div className="prompt-wrap">
              <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value.slice(0, 2000))} placeholder="Un plan cinématographique de…" maxLength={2000} rows={5} disabled={phase === 'working'} />
              <Sparkles className="prompt-sparkle" size={15} />
            </div>
            <div className="suggestions-label">POUR COMMENCER</div>
            <div className="suggestions">
              {examples.map((item) => <button key={item.tag} type="button" className="suggestion" onClick={() => setPrompt(item.text)} disabled={phase === 'working'}><span>{item.tag}</span><Plus size={13} /></button>)}
            </div>

            <div className="settings-heading"><span>PARAMÈTRES</span><span className="settings-divider" /></div>
            <div className="settings-grid">
              <label className="select-field"><span>DURÉE</span><select value={duration} onChange={(e) => setDuration(e.target.value)} disabled={phase === 'working'}><option value="5">5 secondes</option><option value="8">8 secondes</option><option value="10">10 secondes</option></select></label>
              <label className="select-field"><span>FORMAT</span><select value={ratio} onChange={(e) => setRatio(e.target.value)} disabled={phase === 'working'}><option>16:9</option><option>9:16</option><option>1:1</option></select></label>
              <label className="select-field"><span>RÉSOLUTION</span><select value={resolution}><option value="480p">480p · palier gratuit</option></select></label>
              <button type="button" className={`audio-toggle ${audio ? 'is-on' : ''}`} onClick={() => setAudio(!audio)} disabled={phase === 'working'}><AudioLines size={16} /><span><b>Audio généré</b><small>Inclus avec LTX</small></span><span className="switch"><i /></span></button>
            </div>

            <button className="generate-button" type="submit" disabled={phase === 'working' || prompt.trim().length < 3}>
              {phase === 'working' ? <><LoaderCircle className="spin" size={17} /> Création en cours…</> : <><WandSparkles size={17} /> Générer la vidéo <span className="button-arrow">↗</span></>}
            </button>
            <p className="cost-note">Quota gratuit limité : un clip de 5 s en 480p consomme environ 120 crédits. Les crédits épuisés peuvent nécessiter un achat. <a href="https://docs.magichour.ai/api-reference/models.md" target="_blank" rel="noreferrer">Tarifs en crédits ↗</a></p>
          </form>
          <footer className="panel-footer"><span>PROPULSÉ PAR MAGIC HOUR</span><span>FAIT POUR EXPLORER <span className="footer-star">✳</span></span></footer>
        </aside>

        <section className="preview-panel" aria-label="Aperçu vidéo">
          <div className="preview-topline"><div className="preview-index"><span>02</span><span className="index-slash">/</span><span>APERÇU</span></div><span className="preview-badge"><span className="live-dot" /> ESPACE DE RENDU</span></div>
          <div className={`preview-stage ${video ? 'has-video' : ''}`}>
            {video ? <video className="video-player" src={video} controls autoPlay playsInline /> : (
              <div className="empty-stage">
                <div className="stage-grain" />
                <div className="frame-corner corner-tl" /><div className="frame-corner corner-tr" /><div className="frame-corner corner-bl" /><div className="frame-corner corner-br" />
                <div className="orbit orbit-one" /><div className="orbit orbit-two" />
                <div className="stage-center">
                  <div className="stage-icon"><Film size={22} strokeWidth={1.3} /></div>
                  {phase === 'working' ? <><p className="stage-title">L’image prend forme<span className="loading-dots">…</span></p><p className="stage-subtitle">{statusText} {elapsed > 0 && <span>· {elapsed}s</span>}</p><div className="progress-track"><i /></div><p className="stage-caption">Cela peut prendre quelques minutes</p></> : phase === 'error' ? <><p className="stage-title">Un contretemps est survenu</p><p className="stage-subtitle error-text">{error}</p><button className="retry-button" onClick={() => { setPhase('idle'); setError(''); }}>Réessayer</button></> : <><p className="stage-title">Votre prochaine scène<br />commence ici.</p><p className="stage-subtitle">Écrivez un prompt pour lancer<br />votre premier rendu.</p><div className="stage-caption"><span className="caption-rule" /> VOTRE CANVAS VOUS ATTEND</div></>}
                </div>
                <div className="stage-meta"><span>CANVAS 01</span><span>—</span><span>{ratio} · {resolution}</span></div>
              </div>
            )}
          </div>
          <div className="result-bar"><div className="result-info"><span className="result-icon"><Play size={14} fill="currentColor" /></span><div><b>{video ? 'Rendu terminé' : phase === 'working' ? 'Rendu en cours' : 'Aucun rendu pour le moment'}</b><small>{video ? `${duration}s · ${ratio} · ${resolution}` : phase === 'working' ? 'Vous pouvez garder cette page ouverte' : 'Le résultat apparaîtra dans cet espace'}</small></div></div>
            {video && <a className="download-button" href={video} target="_blank" rel="noreferrer" download><ArrowDownToLine size={16} /> Télécharger</a>}
          </div>
          <div className="preview-footnote"><span>LES IDÉES MÉRITENT DE BOUGER.</span><span className="footnote-mark">GS—01</span></div>
        </section>
      </section>
    </main>
  );
}
