import { MainLayout } from '../components/layout/MainLayout'

const stats = [
  { label: 'À Venda', value: '0', color: 'text-nexus-accent' },
  { label: 'Em Troca', value: '0', color: 'text-nexus-warning' },
  { label: 'Vendidos', value: '0', color: 'text-nexus-success' },
  { label: 'Custo Total', value: 'R$ 0', color: 'text-nexus-danger' },
]

export function Dashboard() {
  return (
    <MainLayout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-nexus-card border border-nexus-border rounded-xl p-5"
          >
            <p className="text-sm text-nexus-text-muted mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-nexus-card border border-nexus-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Operações Recentes</h2>
        <p className="text-nexus-text-muted text-sm">
          Nenhuma operação registrada. Comece cadastrando um veículo.
        </p>
      </div>
    </MainLayout>
  )
}