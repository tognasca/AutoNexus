import { useEffect, useState } from 'react';
import { Globe2, Download, ShieldCheck, Save, Crown } from 'lucide-react';
import { premiumCatalogService, type PremiumCatalogPublication } from '../../services/premiumCatalogService';

export function PremiumCatalogPublicationPage() {
  const [publication, setPublication] = useState<PremiumCatalogPublication | null>(null);
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    premiumCatalogService.getPublication()
      .then(value => { setPublication(value); setDomain(value?.domain ?? ''); })
      .catch(e => setError(e instanceof Error ? e.message : 'Não foi possível carregar a publicação.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      const value = await premiumCatalogService.savePublication(domain);
      setPublication(value); setDomain(value.domain); setMessage('Domínio salvo. O catálogo já pode ser gerado.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar o domínio.'); }
    finally { setSaving(false); }
  };

  const download = async () => {
    setDownloading(true); setError(''); setMessage('');
    try { await premiumCatalogService.downloadPackage(); setMessage('Pacote gerado com sucesso.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível gerar o pacote.'); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="p-8 text-slate-500">Carregando publicação Premium...</div>;

  return <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
    <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white p-6 shadow-lg">
      <div className="flex items-center gap-3"><Crown /><span className="font-semibold">Recurso exclusivo Premium</span></div>
      <h1 className="text-2xl md:text-3xl font-bold mt-2">Catálogo no seu próprio domínio</h1>
      <p className="mt-2 text-amber-50">Hospede o visualizador na hospedagem da sua loja e continue usando o AutoNexus como fonte dos dados.</p>
    </div>
    <section className="bg-white rounded-2xl border p-6 space-y-5">
      <div className="flex gap-3"><Globe2 className="text-amber-600 shrink-0" /><div><h2 className="font-bold text-lg">Domínio da loja</h2><p className="text-sm text-slate-500">Ex.: www.minhaloja.com.br. Esse domínio será usado no pacote gerado.</p></div></div>
      <div className="flex flex-col md:flex-row gap-3"><input value={domain} onChange={e => setDomain(e.target.value)} placeholder="www.minhaloja.com.br" className="flex-1 rounded-xl border px-4 py-3" /><button onClick={save} disabled={saving || !domain.trim()} className="rounded-xl bg-slate-900 text-white px-5 py-3 flex items-center justify-center gap-2 disabled:opacity-50"><Save size={18}/>{saving ? 'Salvando...' : 'Salvar domínio'}</button></div>
      {publication?.lastGeneratedAt && <p className="text-sm text-slate-500">Última geração: {new Date(publication.lastGeneratedAt).toLocaleString('pt-BR')}</p>}
    </section>
    <section className="bg-white rounded-2xl border p-6 space-y-4">
      <h2 className="font-bold text-lg">Gerar catálogo</h2>
      <p className="text-sm text-slate-600">O ZIP contém somente arquivos públicos. Estoque, preços, fotos, identidade visual e WhatsApp continuam sendo carregados da API AutoNexus.</p>
      <div className="grid md:grid-cols-3 gap-3 text-sm"><div className="rounded-xl bg-slate-50 p-4"><strong>1. Gere</strong><br/>Baixe o pacote.</div><div className="rounded-xl bg-slate-50 p-4"><strong>2. Hospede</strong><br/>Extraia os arquivos.</div><div className="rounded-xl bg-slate-50 p-4"><strong>3. Aponte</strong><br/>Use seu domínio com HTTPS.</div></div>
      <button onClick={download} disabled={downloading || !publication?.domain} className="rounded-xl bg-amber-600 text-white px-5 py-3 flex items-center gap-2 disabled:opacity-50"><Download size={18}/>{downloading ? 'Gerando catálogo...' : 'Baixar catálogo Premium'}</button>
      <div className="flex gap-2 text-xs text-slate-500"><ShieldCheck size={16}/><span>Nenhuma senha, JWT ou chave privada é incluída no pacote.</span></div>
    </section>
    {message && <div className="rounded-xl bg-emerald-50 text-emerald-700 p-4">{message}</div>}
    {error && <div className="rounded-xl bg-red-50 text-red-700 p-4">{error}</div>}
  </div>;
}
