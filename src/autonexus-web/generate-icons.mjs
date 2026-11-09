// generate-icons.mjs
import fs from 'fs';
import path from 'path';

// Garante que a pasta public/icons existe
fs.mkdirSync('public/icons', { recursive: true });

// Os ícones quadrados usam a identidade AT MOTORS (monograma em escudo).
const appIconSvg = fs.readFileSync('public/atmotors-app-icon.svg');
const maskedIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path d="M256 34 438 82V238Q438 369 256 466Q74 369 74 238V82Z" fill="#000000"/>
  <path d="M155 324 249 151H291L385 324H325L270 218 215 324Z" fill="#ffffff"/>
  <path d="M218 333H353L328 375H194Z" fill="#ffffff"/>
</svg>`;
fs.writeFileSync('public/masked-icon.svg', maskedIconSvg);
console.log('AT MOTORS masked icon criado');

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

  const svgBuffer = appIconSvg;

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

  console.log('\n🚀 Todos os ícones do AT MOTORS foram gerados com sucesso!');
}

buildPngs();