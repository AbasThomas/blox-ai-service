'use client';

import { useEffect, useRef, useState } from 'react';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { ContactForm } from './shared/ContactForm';
import { ResumeDownloadButton } from './shared/ResumeDownloadButton';

interface AlchemistTemplateProps {
  profile: PublicProfilePayload;
  subdomain: string;
}

declare global {
  interface Window { THREE: any; }
}

const asStr = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const ArrowDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
  </svg>
);
const ArrowUpRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
  </svg>
);

export function AlchemistTemplate({ profile, subdomain }: AlchemistTemplateProps) {
  const { user, sections } = profile;
  const canvasRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const rendererRef = useRef<any>(null);
  const [clock, setClock] = useState('--:--');

  const name = user.fullName || 'Digital Artisan';
  const nameParts = name.toUpperCase().split(' ');
  const headline = user.headline || 'Digital Alchemist';
  const headlineWords = headline.split(' ');
  const heroWord1 = headlineWords[0] || 'Digital';
  const heroWord2 = headlineWords.slice(1).join(' ') || 'Alchemist';

  const about = asStr(sections.about) || asStr(asRecord(sections.hero).body) || '';
  const skills = sections.skills ?? [];
  const contact = asRecord(sections.contact ?? {});
  const smartLinks = sections.links ?? [];
  const findLink = (...keys: string[]) => {
    const lower = keys.map((k) => k.toLowerCase());
    return smartLinks.find((l) => lower.some((k) => l.label?.toLowerCase().includes(k) || l.url?.toLowerCase().includes(k)))?.url || '#';
  };
  const location = asStr(contact.location) || 'Remote';
  const contactEmail = asStr(contact.email) || '';

  const estYear = (() => {
    const exp = sections.experience ?? [];
    if (exp.length > 0) {
      const dates = exp.map((e) => asStr(asRecord(e).startDate || asRecord(e).date)).filter(Boolean);
      const years = dates.map((d) => parseInt(d.slice(0, 4))).filter((y) => !isNaN(y));
      if (years.length > 0) return Math.min(...years);
    }
    return new Date().getFullYear() - 5;
  })();

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      try {
        const t = new Intl.DateTimeFormat('en-US', {
          hour: '2-digit', minute: '2-digit', hour12: false,
        }).format(now);
        setClock(t);
      } catch {
        setClock(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Three.js torus knot
  useEffect(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current;

    const loadThree = () => {
      if (window.THREE) { initScene(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = initScene;
      script.onerror = () => console.warn('[AlchemistTemplate] Three.js failed to load');
      document.head.appendChild(script);
    };

    const initScene = () => {
      const THREE = window.THREE;
      if (!THREE || !container) return;

      // Scene
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050505, 0.002);

      // Camera
      const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.z = 30;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Torus Knot
      const tubularSegments = 120;
      const radialSegments = 16;
      const geometry = new THREE.TorusKnotGeometry(9, 2.5, tubularSegments, radialSegments);
      const material = new THREE.MeshPhysicalMaterial({
        color: 0x888888,
        emissive: 0x111111,
        metalness: 0.9,
        roughness: 0.1,
        wireframe: true,
      });
      const torusKnot = new THREE.Mesh(geometry, material);
      scene.add(torusKnot);

      // Sparks
      const sparkCount = 100;
      const sparkGeo = new THREE.CircleGeometry(0.15, 3);
      sparkGeo.rotateY(-Math.PI / 2);
      const sparkMat = new THREE.MeshBasicMaterial({
        color: 0xD4AF37,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        depthTest: false,
      });
      const sparks = new THREE.InstancedMesh(sparkGeo, sparkMat, sparkCount);
      torusKnot.add(sparks);

      const dummy = new THREE.Object3D();
      const sparkData: { speed: number; progress: number; pathIndex: number }[] = [];
      for (let i = 0; i < sparkCount; i++) {
        sparkData.push({
          speed: 0.001 + Math.random() * 0.002,
          progress: Math.random(),
          pathIndex: Math.floor(Math.random() * radialSegments),
        });
      }

      const posAttr = geometry.attributes.position;
      const stride = radialSegments + 1;
      const v1 = new THREE.Vector3();
      const v2 = new THREE.Vector3();

      const updateSparks = () => {
        sparkData.forEach((spark, i) => {
          spark.progress += spark.speed;
          if (spark.progress >= 1) spark.progress = 0;
          const exactInd = spark.progress * tubularSegments;
          const u = Math.floor(exactInd);
          const nextU = (u + 1) % tubularSegments;
          const vIdx = spark.pathIndex;
          v1.fromArray(posAttr.array as number[], (u * stride + vIdx) * 3);
          v2.fromArray(posAttr.array as number[], (nextU * stride + vIdx) * 3);
          v1.lerp(v2, exactInd - u);
          dummy.position.copy(v1);
          dummy.lookAt(v2);
          dummy.updateMatrix();
          sparks.setMatrixAt(i, dummy.matrix);
        });
        sparks.instanceMatrix.needsUpdate = true;
      };

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const pl1 = new THREE.PointLight(0xD4AF37, 2, 50);
      pl1.position.set(10, 10, 10);
      scene.add(pl1);
      const pl2 = new THREE.PointLight(0xC0C0C0, 2, 50);
      pl2.position.set(-10, -10, 10);
      scene.add(pl2);

      // Mouse interaction
      let mouseX = 0, mouseY = 0;
      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.001;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.001;
      };
      window.addEventListener('mousemove', onMouseMove);

      // Resize
      const onResize = () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener('resize', onResize);

      // Animate
      const animate = () => {
        animFrameRef.current = requestAnimationFrame(animate);
        torusKnot.rotation.y += 0.003;
        torusKnot.rotation.x += 0.001;
        torusKnot.rotation.y += 0.05 * (mouseX * 0.5 - torusKnot.rotation.y) * 0.1;
        torusKnot.rotation.x += 0.05 * (mouseY * 0.5 - torusKnot.rotation.x) * 0.1;
        updateSparks();
        renderer.render(scene, camera);
      };
      animate();

      // Fade in
      setTimeout(() => {
        if (container) container.style.opacity = '1';
      }, 500);

      // Cleanup stored for return
      (container as any).__threeCleanup = () => {
        cancelAnimationFrame(animFrameRef.current);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', onResize);
        geometry.dispose();
        material.dispose();
        sparkGeo.dispose();
        sparkMat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    };

    loadThree();

    return () => {
      const cleanup = (container as any).__threeCleanup;
      if (cleanup) cleanup();
    };
  }, []);

  const displaySkills = skills.length > 0
    ? skills.slice(0, 6)
    : ['Three.js', 'React', 'TypeScript', 'Node.js', 'Tailwind', 'Next.js'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        .alch-root { font-family: 'Merriweather', serif; }
        .alch-display { font-family: 'Playfair Display', serif; }
        .alch-root ::selection { background: rgba(212,175,55,0.3); color: white; }
        .alch-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0; transition: opacity 1.5s ease-out; }
        @keyframes alch-fade-up { to { opacity: 1; transform: translateY(0); } }
        .alch-fade { animation: alch-fade-up 1s ease-out forwards; opacity: 0; transform: translateY(20px); }
        .alch-d1 { animation-delay: 0.1s; }
        .alch-d2 { animation-delay: 0.2s; }
        .alch-d3 { animation-delay: 0.3s; }
        .alch-nav-num { opacity: 0; transform: translateX(-8px); transition: all 0.3s; color: #D4AF37; font-size: 11px; }
        .alch-nav-link:hover .alch-nav-num { opacity: 1; transform: translateX(0); }
        .alch-nav-link:hover { color: #D4AF37; }
        .alch-social:hover { color: #D4AF37; }
        .alch-social:hover .alch-social-icon { opacity: 1; }
        .alch-social-icon { opacity: 0; transition: opacity 0.2s; }
        .alch-cta-fill { transform: scaleX(0); transform-origin: left; transition: transform 0.5s ease; }
        .alch-cta:hover .alch-cta-fill { transform: scaleX(1); }
        .alch-cta:hover { border-color: rgba(212,175,55,0.5); }
        .alch-cta:hover .alch-cta-text { color: white; }
        .alch-cta:hover .alch-cta-arrow { color: #D4AF37; }
      `}</style>

      <div className="alch-root" style={{ background: '#050505', color: '#e5e5e5', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>

        {/* ── 3D Canvas ── */}
        <div ref={canvasRef} className="alch-canvas" />

        {/* ── Header ── */}
        <header style={{ position: 'relative', zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '24px 48px 24px' }}>
          <div style={{ maxWidth: 1800, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24, alignItems: 'start' }}>

            {/* Logo */}
            <div className="alch-fade" style={{ display: 'flex', flexDirection: 'column' }}>
              <a href="#" className="alch-display" style={{ fontSize: 'clamp(16px, 2vw, 22px)', letterSpacing: '-0.01em', color: '#ffffff', textDecoration: 'none', fontWeight: 600, transition: 'color 0.5s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF37')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}>
                {nameParts.join(' ')}
              </a>
              <span style={{ fontSize: 11, color: '#737373', fontStyle: 'italic', marginTop: 4 }}>Est. {estYear}</span>
            </div>

            {/* Status */}
            <div className="alch-fade alch-d1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="alch-display" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#737373' }}>Current Status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11 }}>Accepting Commissions</span>
              </div>
            </div>

            {/* Location + Clock */}
            <div className="alch-fade alch-d2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="alch-display" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#737373' }}>Location</span>
              <span style={{ fontSize: 11 }}>
                {location}
                <span style={{ color: '#737373', marginLeft: 8, fontWeight: 300 }}>{clock}</span>
              </span>
            </div>

            {/* Nav */}
            <div className="alch-fade alch-d3" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {['Work', 'Expertise', 'Contact'].map((item, i) => (
                  <a key={item} href={`#alch-${item.toLowerCase()}`} className="alch-nav-link alch-display"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ffffff', textDecoration: 'none', transition: 'color 0.3s' }}>
                    <span className="alch-nav-num">0{i + 1}</span>
                    {item}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <main id="alch-work" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 10, padding: '0 24px', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mixBlendMode: 'overlay', opacity: 0.9 }}>
            <h1 className="alch-display alch-fade alch-d1" style={{ fontSize: 'clamp(3rem, 10vw, 9rem)', fontWeight: 500, letterSpacing: '-0.02em', color: '#ffffff', lineHeight: 0.9, margin: 0 }}>
              {heroWord1}
            </h1>
            <div style={{ height: 'clamp(16px, 3vw, 48px)' }} />
            <h1 className="alch-display alch-fade alch-d2" style={{ fontSize: 'clamp(3rem, 10vw, 9rem)', fontWeight: 500, letterSpacing: '-0.02em', color: '#ffffff', lineHeight: 0.9, margin: 0, fontStyle: 'italic' }}>
              {heroWord2}
            </h1>
          </div>

          <div className="alch-fade alch-d3" style={{ marginTop: 'clamp(48px, 8vw, 96px)', pointerEvents: 'auto' }}>
            <a href="#alch-contact" className="alch-cta"
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 16, padding: '16px 32px', border: '1px solid #262626', borderRadius: 9999, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)', textDecoration: 'none', transition: 'border-color 0.5s', overflow: 'hidden' }}>
              <span className="alch-cta-fill" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)' }} />
              <span className="alch-cta-text" style={{ fontSize: 13, color: '#a3a3a3', position: 'relative', zIndex: 1, letterSpacing: '0.05em', transition: 'color 0.3s', fontFamily: 'Merriweather, serif' }}>
                Explore Selected Works
              </span>
              <span className="alch-cta-arrow" style={{ color: '#737373', position: 'relative', zIndex: 1, transition: 'color 0.3s', display: 'flex' }}>
                <ArrowDown />
              </span>
            </a>
          </div>
        </main>

        {/* ── Skills / Expertise ── */}
        {skills.length > 0 && (
          <section id="alch-expertise" style={{ position: 'relative', zIndex: 20, padding: '64px 48px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ maxWidth: 1800, margin: '0 auto' }}>
              <h2 className="alch-display" style={{ fontSize: 13, color: '#ffffff', marginBottom: 24 }}>Expertise</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                {skills.slice(0, 12).map((skill, i) => (
                  <span key={i} style={{ fontSize: 11, color: '#737373', fontFamily: 'Merriweather, serif', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{skill}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Contact section ── */}
        <section id="alch-contact" style={{ position: 'relative', zIndex: 20, padding: '64px 48px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 className="alch-display" style={{ fontSize: 24, color: '#ffffff', marginBottom: 32, fontStyle: 'italic' }}>Start a Conversation</h2>
            <ContactForm
              recipientEmail={contactEmail || undefined}
              theme={{
                formClassName: 'space-y-4',
                labelClassName: 'mb-1 block text-[10px] uppercase tracking-widest text-neutral-500',
                inputClassName: 'w-full border border-neutral-800 bg-black/30 px-4 py-3 text-sm text-neutral-200 outline-none focus:border-yellow-700/50 focus:ring-1 focus:ring-yellow-700/20 font-light',
                textareaClassName: 'w-full border border-neutral-800 bg-black/30 px-4 py-3 text-sm text-neutral-200 outline-none focus:border-yellow-700/50 focus:ring-1 focus:ring-yellow-700/20 font-light',
                buttonClassName: 'w-full border border-[#D4AF37]/40 text-[#D4AF37] px-6 py-3 text-xs uppercase tracking-widest hover:bg-[#D4AF37]/10 transition-colors',
                successClassName: 'border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300',
                errorClassName: 'mt-1 text-xs text-rose-400',
              }}
            />
            {profile.resumeAssetId && (
              <div style={{ marginTop: 24 }}>
                <ResumeDownloadButton
                  subdomain={subdomain}
                  ownerName={name}
                  label="Download CV"
                  style={{ background: 'transparent', border: '1px solid #404040', color: '#a3a3a3', padding: '12px 32px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', width: '100%' }}
                />
              </div>
            )}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ position: 'relative', zIndex: 20, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 48px' }}>
          <div style={{ maxWidth: 1800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 48 }}>

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 12, color: '#737373', lineHeight: 1.8, maxWidth: 280, fontFamily: 'Merriweather, serif', fontWeight: 300 }}>
                {about || 'Crafting immersive digital experiences through code and design. Specializing in WebGL, interactive storytelling, and creative development.'}
              </p>
            </div>

            {/* Skills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 className="alch-display" style={{ fontSize: 13, color: '#ffffff' }}>Tech Stack</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {displaySkills.map((s, i) => (
                  <span key={i} style={{ fontSize: 11, color: '#737373', fontFamily: 'Merriweather, serif' }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Connect */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 className="alch-display" style={{ fontSize: 13, color: '#ffffff' }}>Connect</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'LinkedIn', url: findLink('linkedin') },
                  { label: 'GitHub', url: findLink('github') },
                  { label: 'Instagram', url: findLink('instagram') },
                ].map(({ label, url }) => (
                  <a key={label} href={url} target="_blank" rel="noreferrer" className="alch-social"
                    style={{ fontSize: 11, color: '#737373', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.3s', fontFamily: 'Merriweather, serif' }}>
                    {label}
                    <span className="alch-social-icon"><ArrowUpRight /></span>
                  </a>
                ))}
              </div>
            </div>

            {/* Copyright */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 4 }}>
              <span className="alch-display" style={{ fontSize: 18, color: '#ffffff' }}>© {new Date().getFullYear()}</span>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#525252', fontFamily: 'Merriweather, serif' }}>{name}</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
