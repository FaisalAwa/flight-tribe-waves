# Boilerplate Manifest
> READ THIS FIRST when you copy this boilerplate. Everything listed below is
> already built and wired. Do NOT rebuild it — update it.

---

## ✅ What Is Pre-Built (DO NOT REWRITE)

### Entry & Routing
| File | Status | What to do |
|------|--------|-----------|
| `src/main.tsx` | ✅ Complete | Lenis + GSAP + BrowserRouter + ReactDOM — **do not touch** |
| `src/App.tsx` | ✅ Shell | Add `<Route>` entries per site architecture |
| `vite.config.ts` | ✅ Complete | `@tailwindcss/vite` + `@/` alias — do not touch |

### Styling
| File | Status | What to do |
|------|--------|-----------|
| `src/styles/globals.css` | ✅ Complete | CSS reset + Tailwind import — do not touch |
| `src/styles/tokens.css` | ✅ Placeholder | **REPLACE ALL VALUES** from client brief in skill Step 2 |
| `index.html` | ✅ Shell | **Replace** fonts (Google Fonts URL) + page title per client |

### Foundation Components (all in `src/components/`)
| Component | Status | What to do |
|-----------|--------|-----------|
| `Nav.tsx` | ✅ Complete | Update `logo` prop + `links` array per client nav |
| `Footer.tsx` | ✅ Complete | Replace `<!-- CLIENT: ... -->` comments with real copy |
| `SplitText.tsx` | ✅ Complete | Use as-is on every hero headline |
| `MagneticBtn.tsx` | ✅ Complete | Use as-is on every primary CTA |
| `ScrollReveal.tsx` | ✅ Complete | Use as-is on body content sections |
| `VideoScrub.tsx` | ✅ Complete | Use as-is for Higgsfield video scenes |
| `index.ts` | ✅ Barrel | Add 21st.dev components here when pulled |

### Starter Page
| File | Status | What to do |
|------|--------|-----------|
| `src/pages/Home.tsx` | ✅ Shell | Build scenes per Step 5 architecture |

### Assets Folder
| Path | Status | What to do |
|------|--------|-----------|
| `public/assets/` | ✅ Created | Drop all Higgsfield videos + images here |

---

## ⚙️ Per-Client Setup Checklist (do these before building pages)

```
[ ] tokens.css  — update ALL CSS custom properties (colors, fonts)
[ ] index.html  — replace Google Fonts URL + page <title>
[ ] App.tsx     — add routes per site architecture
[ ] Nav.tsx     — update logo name + links array
[ ] Footer.tsx  — update brand name + tagline + copyright
[ ] public/assets/ — add Higgsfield videos + images
```

---

## 📦 Installed Packages

```
Runtime:
  react, react-dom, react-router-dom
  gsap, @gsap/react
  lenis
  framer-motion
  clsx, tailwind-merge

Dev / Build:
  vite, @vitejs/plugin-react
  tailwindcss, @tailwindcss/vite
  typescript, postcss, autoprefixer
  eslint (+ react-hooks, react-refresh plugins)
```

---

## 🏗️ Stack Reference

| Tool | Version | Role |
|------|---------|------|
| React | 19 | UI framework |
| Vite | 8 | Build tool |
| TypeScript | 6 | Type safety |
| Tailwind CSS | 4 | Utility classes (configured via CSS, not JS) |
| GSAP | 3.15 | Scroll animations, timelines, SplitText |
| Lenis | 1.3 | Smooth scroll (replaces native scroll on animated pages) |
| Framer Motion | 12 | Component transitions, spring physics, magnetic buttons |
| React Router | 7 | Client-side routing |

---

## 🔑 Key Conventions

```
Path alias:     '@/components'  →  src/components/
                '@/styles'      →  src/styles/
                '@/pages'       →  src/pages/

Asset paths:    '/assets/hero-video.mp4'  (from public/assets/)
                NOT: '../../public/assets/...'

Token usage:    var(--c-void), var(--t-hero), var(--gutter)
                NOT: hardcoded px/hex values in components

GSAP cleanup:   ALWAYS useLayoutEffect → return () => ctx.revert()
                NEVER leave dangling ScrollTrigger instances

Lenis rule:     NEVER use scroll-behavior: smooth in CSS
                Lenis owns smooth scroll — native browser scroll is banned
```

---

## 🚀 First Run

```bash
npm install   # already run — node_modules exists
npm run dev   # → localhost:5173
```
