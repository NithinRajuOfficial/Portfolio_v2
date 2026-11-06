# Nithin Raju — Portfolio

Personal portfolio website built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. Features a 3D interactive hero model, scroll-reveal animations, a marquee tech stack strip, and a fully responsive layout.

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router, static export)
- **UI** — [React 19](https://react.dev), [TypeScript 5](https://www.typescriptlang.org)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com), [Poppins](https://fonts.google.com/specimen/Poppins) via `next/font`
- **3D** — [Three.js 0.187](https://threejs.org) with GLTFLoader + MeshoptDecoder
- **Linting** — ESLint with `eslint-config-next` (Core Web Vitals + TypeScript rules)

## Features

- **3D hero model** — animated GLTF scene rendered with Three.js, lazy-loaded only on desktop (`ssr: false`) with a ResizeObserver-driven responsive canvas
- **Marquee tech strip** — seamless infinite scroll of 35+ tech icons, pauses on hover, respects `prefers-reduced-motion`
- **Scroll reveal** — sections and project cards fade + slide in as they enter the viewport via `IntersectionObserver`
- **Rotating role** — hero headline cycles through role titles with a fade transition, skipped for reduced-motion users
- **Active nav tracking** — intersection-based section detection with click-scroll lock to prevent fighting between user clicks and scroll events
- **Responsive** — mobile hamburger menu that auto-closes on viewport resize, desktop 3D model hidden on mobile

## Project Structure

```
app/
├── components/
│   ├── middleHeaderCom/
│   │   └── MiddleHeader.tsx   # Marquee tech stack strip
│   ├── Contact.tsx
│   ├── HeroModel.tsx          # Three.js 3D scene
│   ├── MainContentStatge.tsx  # About section
│   ├── Navbar.tsx
│   ├── Project.tsx
│   ├── ProjectCard.tsx
│   ├── RevealSection.tsx      # Scroll-reveal wrapper
│   ├── RotatingRole.tsx
│   └── SubHeader.tsx          # Hero section
├── hooks/
│   ├── useIntersectionObserver.ts
│   ├── useMediaQuery.ts
│   ├── usePrefersReducedMotion.ts
│   └── useScrollReveal.ts
├── utils/
│   └── commonImports.ts       # Tech list, project data, social links
├── assets/                    # Tech icons, project screenshots
├── globals.css                # Tailwind v4 theme (colours, fonts, animations)
├── layout.tsx                 # Root layout, metadata, Poppins font
└── page.tsx
public/
└── models/
    └── scene.glb              # 3D hero model
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
# Production build
pnpm build

# Start production server
pnpm start
```

## Deployment

The app is statically prerendered and deploys to [Vercel](https://vercel.com) with zero configuration. Just connect the repository and push.

Live at: [nithin-raju.vercel.app](https://nithin-raju.vercel.app)
