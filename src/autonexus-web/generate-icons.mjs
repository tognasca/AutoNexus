// generate-icons.mjs
import fs from 'fs';
import path from 'path';

// Garante que a pasta public/icons existe
fs.mkdirSync('public/icons', { recursive: true });

// 1. Criação do SVG Base do AutoNexus
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A0E1A" />
      <stop offset="50%" stop-color="#11192E" />
      <stop offset="100%" stop-color="#060911" />
    </linearGradient>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="50%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.9" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Fundo com cantos arredondados -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="url(#brandGrad)" stroke-width="3" stroke-opacity="0.3" />

  <!-- Logo AutoNexus (Monograma Aerodinâmico A + N + Velocidade/Conexão) -->
  <g filter="url(#glow)" transform="translate(0, 0)">
    <!-- Asa / Aerofólio Superior -->
    <path d="M 120 320 L 256 120 L 392 320 L 328 320 L 256 210 L 184 320 Z" fill="url(#brandGrad)" />
    <!-- Vértice Central / Nexus Core -->
    <polygon points="256,238 296,300 216,300" fill="url(#accentGrad)" />
    <!-- Linhas de Velocidade / Conexão Inferiores -->
    <path d="M 148 350 L 364 350 L 344 374 L 168 374 Z" fill="url(#brandGrad)" opacity="0.9" />
    <path d="M 190 392 L 322 392 L 308 408 L 204 408 Z" fill="url(#brandGrad)" opacity="0.6" />
  </g>
</svg>`;

// 2. Salva o masked-icon.svg (Monocromático/vetorial para Safari)
const maskedIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path d="M 120 320 L 256 120 L 392 320 L 328 320 L 256 210 L 184 320 Z" fill="#000000" />
  <polygon points="256,238 296,300 216,300" fill="#000000" />
  <path d="M 148 350 L 364 350 L 344 374 L 168 374 Z" fill="#000000" />
  <path d="M 190 392 L 322 392 L 308 408 L 204 408 Z" fill="#000000" />
</svg>`;

fs.writeFileSync('public/masked-icon.svg', maskedIconSvg);
console.log('✅ public/masked-icon.svg criado');

// 3. Renderiza os PNGs e Favicon usando Sharp
async function buildPngs() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (e) {
    console.log('\n⚠️  O pacote "sharp" é necessário para renderizar os PNGs.');
    console.log('👉 Execute: npm i -D sharp && node generate-icons.mjs\n');
    return;
  }

  const svgBuffer = Buffer.from(logoSvg);

  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/icons/pwa-192x192.png');
  console.log('✅ public/icons/pwa-192x192.png criado');

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/icons/pwa-512x512.png');
  console.log('✅ public/icons/pwa-512x512.png criado');

  // apple-touch-icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('✅ public/apple-touch-icon.png criado');

  // favicon.ico (64x64 PNG nomeado como .ico)
  await sharp(svgBuffer)
    .resize(64, 64)
    .toFormat('png')
    .toFile('public/favicon.ico');
  console.log('✅ public/favicon.ico criado');

  console.log('\n🚀 Todos os ícones do AutoNexus foram gerados com sucesso!');
}

buildPngs();