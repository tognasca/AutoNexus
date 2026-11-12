import { useState, useEffect } from 'react';
import atMotorsHero from './public/hero/atmotors-hero/hero-atmotor.png';
import atMotorsLoadingVideo from './public/FinalAtMotorVideo.mp4';
import atMotorsLogo from './public/ATlogo.png';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { canAccessView, UserProfileEnum } from './utils/permissions';
import { LoginPage } from './pages/LoginPage'; import { DashboardPage } from './pages/DashboardPage'; import { CommercialDashboardPage } from './pages/CommercialDashboardPage'; import { VehiclesPage } from './pages/VehiclesPage'; import { TradesPage } from './pages/TradesPage'; import { LeadsPage } from './pages/LeadsPage'; import { SimulatorPage } from './pages/SimulatorPage'; import { FinancingProposalsPage } from './pages/FinancingProposalsPage'; import { DrePage } from './pages/reports/DrePage'; import { CommissionPage } from './pages/reports/CommissionPage'; import { BankConfigPage } from './pages/admin/BankConfigPage'; import { UsersPage } from './pages/admin/UsersPage'; import { ShieldAlert, Loader2, ShieldCheck, Sparkles } from 'lucide-react'; import { CompanyDocumentsPage } from './pages/admin/CompanyDocumentsPage'; import { PublicCatalogSaasPage } from './pages/PublicCatalogSaasPage'; import { TenantSettingsPage } from './pages/admin/TenantSettingsPage'; import { SubscriptionPage } from './pages/admin/SubscriptionPage'; import { SuperAdminPage } from './pages/admin/SuperAdminPage'; import { ProductionReadinessPage } from './pages/admin/ProductionReadinessPage'; import { LegalDocumentsAdminPage } from './pages/admin/LegalDocumentsAdminPage'; import { PremiumCatalogPublicationPage } from './pages/admin/PremiumCatalogPublicationPage'; import { PricingPage } from './pages/public/PricingPage'; import { SignupPage } from './pages/public/SignupPage'; import { LegalPage } from './pages/public/LegalPage'; import { ForgotPasswordPage, ResetPasswordPage } from './pages/public/PasswordPages';
import { OnboardingPage } from './pages/OnboardingPage'; import { CommercialHubPage } from './pages/CommercialHubPage'; import { SettingsCenterPage } from './pages/admin/SettingsCenterPage'; import { DemoPage } from './pages/public/DemoPage';
function AtMotorsLoadingScreen(){
  return (
    <main
      className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-[#06111f] px-5 py-10 text-slate-100"
      style={{ minHeight: '100vh', isolation: 'isolate', backgroundColor: '#06111f' }}
      aria-busy="true"
      aria-label="Carregando AT MOTORS"
    >
      <video
        src={atMotorsLoadingVideo}
        poster={atMotorsHero}
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center'
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(3,10,20,0.30) 0%, rgba(3,10,20,0.08) 48%, rgba(3,10,20,0.48) 100%)'
        }}
      />
      <div
        className="relative z-10 flex w-full justify-center"
        style={{ position: 'relative', zIndex: 2, width: '100%' }}
      >
        <img
          src={atMotorsLogo}
          alt="AT MOTORS"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{
            display: 'block',
            width: 'min(82vw, 360px)',
            height: 'auto',
            maxHeight: '170px',
            objectFit: 'contain',
            objectPosition: 'center',
            filter: 'drop-shadow(0 3px 18px rgba(0,0,0,0.75))'
          }}
        />
      </div>
      <div
        className="relative z-10 flex flex-col items-center text-center"
        style={{ position: 'relative', zIndex: 2 }}
      >
        <div className="mb-5 flex items-center justify-center gap-3 text-sm font-semibold tracking-wide text-white drop-shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          <span>Preparando seu ambiente...</span>
        </div>
        <div className="h-1.5 w-64 max-w-[80vw] overflow-hidden rounded-full bg-white/25">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 animate-pulse" />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white drop-shadow-lg">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" />Sessão segura</span>
          <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-400" />Carregando módulos</span>
        </div>
      </div>
    </main>
  );
}

function AppContent(){const{user,isAuthenticated,loading}=useAuth();const[currentView,setCurrentView]=useState(()=>{const requested=new URLSearchParams(window.location.search).get('view');return requested==='subscription'||requested==='production-readiness'||requested==='legal-documents'||requested==='premium-catalog'||requested==='onboarding'||requested==='commercial'||requested==='commercial-dashboard'||requested==='settings-center'||requested==='leads'?requested:'dashboard'});const[isPublicCatalogRoute,setIsPublicCatalogRoute]=useState(window.location.pathname==='/catalogo');useEffect(()=>{const h=()=>setIsPublicCatalogRoute(window.location.pathname==='/catalogo');window.addEventListener('popstate',h);return()=>window.removeEventListener('popstate',h)},[]);useEffect(()=>{if(window.location.pathname==='/app'&&user?.profile===UserProfileEnum.SuperAdmin)setCurrentView(view=>view==='dashboard'?'superadmin':view)},[user?.profile]);useEffect(()=>{const h=()=>setCurrentView('subscription');window.addEventListener('autonexus:subscription-required',h);return()=>window.removeEventListener('autonexus:subscription-required',h)},[]);const publicPath=window.location.pathname;if(publicPath==='/')return <PricingPage/>;if(publicPath==='/entrar')return <LoginPage/>;if(publicPath==='/precos')return <PricingPage/>;if(publicPath==='/demo')return <DemoPage/>;if(publicPath.startsWith('/loja/'))return <PublicCatalogSaasPage/>;if(publicPath==='/cadastro')return <SignupPage/>;if(publicPath==='/esqueci-senha')return <ForgotPasswordPage/>;if(publicPath==='/redefinir-senha')return <ResetPasswordPage/>;if(publicPath==='/termos')return <LegalPage slug="termos"/>;if(publicPath==='/privacidade')return <LegalPage slug="privacidade"/>;if(publicPath==='/cookies')return <LegalPage slug="cookies"/>;if(isPublicCatalogRoute)return <PublicCatalogSaasPage currentView="catalog" onNavigate={view=>{if(view!=='catalog'){window.history.pushState({},'', '/');setIsPublicCatalogRoute(false);setCurrentView(view)}}}/>;if(loading)return <AtMotorsLoadingScreen/>;if(!isAuthenticated||!user)return <PricingPage/>;const handleNavigate=(view:string)=>{if(view==='catalog'){window.history.pushState({},'', '/catalogo');setIsPublicCatalogRoute(true);return}if(canAccessView(user.profile,view))setCurrentView(view);else alert('Seu perfil de acesso não possui permissão para este módulo.')};const renderContent=()=>{if(!canAccessView(user?.profile,currentView)){const homeView=user?.profile===UserProfileEnum.SuperAdmin?'superadmin':'dashboard';return <div className="p-12 text-center text-slate-300 space-y-4"><ShieldAlert className="w-12 h-12 text-rose-500 mx-auto"/><h2 className="text-xl font-bold text-white">Acesso Não Autorizado</h2><p className="text-xs text-slate-400 max-w-md mx-auto">Seu perfil de acesso ({user?.profileName||'Usuário'}) não possui permissão para visualizar esta página.</p><button onClick={()=>setCurrentView(homeView)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">Voltar</button></div>}switch(currentView){case'dashboard':return <DashboardPage currentView={currentView} onNavigate={handleNavigate}/>;case'commercial-dashboard':return <CommercialDashboardPage currentView={currentView} onNavigate={handleNavigate}/>;case'vehicles':return <VehiclesPage currentView={currentView} onNavigate={handleNavigate}/>;case'trades':return <TradesPage currentView={currentView} onNavigate={handleNavigate}/>;case'leads':return <LeadsPage currentView={currentView} onNavigate={handleNavigate}/>;case'simulator':return <SimulatorPage currentView={currentView} onNavigate={handleNavigate}/>;case'financing':return <FinancingProposalsPage currentView={currentView} onNavigate={handleNavigate}/>;case'reports':return <DrePage currentView={currentView} onNavigate={handleNavigate}/>;case'commissions':return <CommissionPage currentView={currentView} onNavigate={handleNavigate}/>;case'bank-configs':return <BankConfigPage currentView={currentView} onNavigate={handleNavigate}/>;case'users':return <UsersPage currentView={currentView} onNavigate={handleNavigate}/>;case'company-documents':return <CompanyDocumentsPage currentView={currentView} onNavigate={handleNavigate}/>;case'catalog':return <PublicCatalogSaasPage currentView={currentView} onNavigate={handleNavigate}/>;case'tenant-settings':return <TenantSettingsPage currentView={currentView} onNavigate={handleNavigate}/>;case'subscription':return <SubscriptionPage currentView={currentView} onNavigate={handleNavigate}/>;case'superadmin':return <SuperAdminPage currentView={currentView} onNavigate={handleNavigate}/>;case'production-readiness':return <ProductionReadinessPage currentView={currentView} onNavigate={handleNavigate}/>;case'legal-documents':return <LegalDocumentsAdminPage currentView={currentView} onNavigate={handleNavigate}/>;case'premium-catalog':return <PremiumCatalogPublicationPage/>;case'onboarding':return <OnboardingPage currentView={currentView} onNavigate={handleNavigate}/>;case'commercial':return <CommercialHubPage currentView={currentView} onNavigate={handleNavigate}/>;case'settings-center':return <SettingsCenterPage currentView={currentView} onNavigate={handleNavigate}/>;default:return <DashboardPage currentView={currentView} onNavigate={handleNavigate}/>}};return <>{renderContent()}</>}
export default function App(){return <AuthProvider><AppContent/></AuthProvider>}
