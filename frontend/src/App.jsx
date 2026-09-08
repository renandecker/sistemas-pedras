import { Routes, Route, NavLink } from 'react-router-dom';
import { Gem, LayoutGrid, FileSpreadsheet, Boxes } from 'lucide-react';
import NovoOrcamento from './components/NovoOrcamento.jsx';
import KanbanOrdens from './components/KanbanOrdens.jsx';
import Materiais from './components/Materiais.jsx';

const navItems = [
  { to: '/', label: 'Novo Orçamento', icon: FileSpreadsheet, end: true },
  { to: '/producao', label: 'Produção', icon: LayoutGrid },
  { to: '/materiais', label: 'Materiais', icon: Boxes },
];

export default function App() {
  return (
    <div className="min-h-screen flex bg-[#f7f4ef]">
      <aside className="w-64 shrink-0 bg-[#171412] text-[#e9e2d8] flex flex-col">
        <div className="px-6 py-7 flex items-center gap-3 border-b border-white/10">
          <Gem className="w-6 h-6 text-copper-400" strokeWidth={1.5} />
          <div>
            <div className="font-display text-lg leading-tight">Marmoraria</div>
            <div className="text-xs text-white/40 tracking-wide">gestão de orçamentos</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-copper-500/20 text-copper-400'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-white/10 text-xs text-white/30">
          Perda técnica: 10–15% · Borda mín. recorte: 5cm
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<NovoOrcamento />} />
          <Route path="/producao" element={<KanbanOrdens />} />
          <Route path="/materiais" element={<Materiais />} />
        </Routes>
      </main>
    </div>
  );
}
