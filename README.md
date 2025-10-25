# Neon Snake

Modern Snake arcade experience built with Next.js 14 and React. Navigate the glowing serpent, collect energy orbs, and climb the high-score ladder with responsive desktop and mobile controls.

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to start playing.

## Available Scripts

- `npm run dev` – start the development server with hot reload
- `npm run build` – generate the production build
- `npm run start` – serve the production build locally
- `npm run lint` – run ESLint using Next.js defaults

## Gameplay

- Use the arrow keys or WASD to steer the snake
- Mobile/touch users can tap the on-screen controls
- The game wraps around the arena, but colliding with your own tail ends the run
- High scores persist locally using `localStorage`

## Deployment

This project is ready to deploy on Vercel. Build and deploy with:

```bash
npm run build
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-6b3d28f6
```

After deployment, verify with:

```bash
curl https://agentic-6b3d28f6.vercel.app
```

Enjoy the glow!
