interface StoreHeroProps {
  template: string;
  name: string;
  title?: string | null;
  welcome?: string | null;
  image?: string;
  color: string;
  onStock?: () => void;
  onContact?: () => void;
  featured?: { name: string; price: string; image?: string };
  onFeatured?: () => void;
}
export function StoreHero({ template, name, title, welcome, image, color, onStock, onContact, featured, onFeatured }: StoreHeroProps) {
  const hex = /^#[0-9a-f]{6}$/i.test(color) ? color.slice(1) : '16324f';
  const brightness = (parseInt(hex.slice(0, 2), 16) * 299 + parseInt(hex.slice(2, 4), 16) * 587 + parseInt(hex.slice(4, 6), 16) * 114) / 1000;
  const ink = brightness > 155 ? '#0f172a' : '#ffffff';
  const stockButton = <button type="button" onClick={onStock} className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950">Explorar estoque</button>;
  const contactButton = onContact && <button type="button" onClick={onContact} style={template === 'commercial' ? { color: ink, borderColor: ink } : undefined} className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white">Falar com a loja</button>;
  if (template === 'essential') return <section className="border-b border-slate-200 bg-white text-slate-950">
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:grid-cols-[1.4fr_1fr] md:items-center md:py-12">
      <div><p className="mb-3 text-sm font-semibold" style={{ color }}>{welcome || name}</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{title || 'Seu próximo veículo está aqui.'}</h1>
        <p className="my-4 text-sm text-slate-600">Compare as opções disponíveis e converse com nossa equipe.</p>
        <button type="button" onClick={onStock} style={{ backgroundColor: color, color: ink }} className="rounded-lg px-5 py-3 text-sm font-semibold text-white">Buscar veículo</button>
      </div>
      {image && <img src={image} alt="" className="h-48 w-full rounded-xl object-cover md:h-60" />}
    </div>
  </section>;
  if (template === 'commercial') return <section style={{ backgroundColor: color, color: ink }}>
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-2 md:items-center">
      <div><p className="mb-3 text-sm">{welcome || name}</p>
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">{title || 'Encontre o carro para a sua próxima conquista.'}</h1>
        <p className="my-5 text-sm opacity-85">Conheça o estoque e consulte as condições com nossa equipe.</p>
        <div className="flex flex-wrap gap-3">{stockButton}{contactButton}</div>
      </div>
      {featured ? <button type="button" onClick={onFeatured} className="overflow-hidden rounded-2xl bg-white text-left text-slate-950 shadow-xl">
        {featured.image && <img src={featured.image} alt={featured.name} className="h-52 w-full object-cover" />}
        <div className="space-y-2 p-5"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Em destaque no estoque</p><h2 className="text-xl font-bold">{featured.name}</h2><p className="text-2xl font-bold">{featured.price}</p><p className="text-sm underline">Conhecer veículo</p></div>
      </button> : image && <img src={image} alt="" className="h-64 w-full rounded-2xl object-cover" />}
    </div>
  </section>;
  return <section className="relative isolate overflow-hidden bg-slate-950 text-white">
    {image && <img src={image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />}
    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/20" />
    <div className="mx-auto max-w-7xl px-5 py-16 md:py-24">
      <p className="mb-5 text-sm font-medium tracking-widest">{welcome || name}</p>
      <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">{title || 'Escolhas que acompanham você.'}</h1>
      <p className="my-6 max-w-lg text-sm leading-relaxed text-slate-200">Conheça nossos veículos e encontre a opção que combina com o seu momento.</p>
      <div className="flex flex-wrap gap-3">{stockButton}{contactButton}</div>
    </div>
  </section>;
}
