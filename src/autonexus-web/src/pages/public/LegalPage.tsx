import { useEffect, useState } from 'react';
import { billingService, LegalDocument } from '../../services/billingService';

const TITLES = { termos: 'Termos de Uso', privacidade: 'Política de Privacidade', cookies: 'Política de Cookies' } as const;

export function LegalPage({ slug }: { slug: keyof typeof TITLES }) {
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    billingService.getLegal(slug).then(setDoc).catch(() => setError(true));
  }, [slug]);

  return (
    <div className="min-h-screen bg-nexus-dark text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <a href="/precos" className="text-xs text-slate-400 hover:text-white">← Voltar</a>
        <h1 className="mt-3 text-2xl font-bold text-white">{TITLES[slug]}</h1>
        {doc && <p className="text-xs text-slate-500 mt-1">Versão {doc.version} — publicada em {new Date(doc.publishedAt).toLocaleDateString('pt-BR')}</p>}
        {error && <p className="mt-6 text-sm text-red-400">Não foi possível carregar este documento agora.</p>}
        {!doc && !error && <p className="mt-6 text-sm text-slate-400">Carregando...</p>}
        {doc && <pre className="mt-6 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">{doc.content}</pre>}
      </div>
    </div>
  );
}
