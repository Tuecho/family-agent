import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Loader2, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { useStore } from '../store';
import { formatMoneyEs } from '../utils/format';

function DonutChart({ 
  income, 
  expense, 
  balance,
  size = 200, 
  strokeWidth = 30 
}: { 
  income: number; 
  expense: number;
  balance: number;
  size?: number;
  strokeWidth?: number;
}) {
  const total = income + expense;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const incomePercent = total > 0 ? (income / total) * 100 : 50;
  const expensePercent = total > 0 ? (expense / total) * 100 : 50;
  
  const incomeOffset = circumference - (incomePercent / 100) * circumference;
  const expenseOffset = circumference - (expensePercent / 100) * circumference;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl">📊</span>
            <span className="text-sm text-gray-500">Sin datos</span>
          </div>
        </div>
      </div>
    );
  }

  const isNegative = balance < 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#10B981"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={incomeOffset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#EF4444"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={expenseOffset}
            strokeLinecap="round"
            transform={`rotate(${-90 + (incomePercent / 100) * 360} ${size / 2} ${size / 2})`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${isNegative ? 'text-expense' : 'text-income'}`}>
            {isNegative ? '-' : ''}{formatMoneyEs(Math.abs(balance))}
          </span>
          <span className="text-sm text-gray-500">Balance</span>
        </div>
      </div>
      <div className="flex gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-income"></div>
          <span className="text-sm text-gray-600">Ingresos {Math.round(incomePercent)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-expense"></div>
          <span className="text-sm text-gray-600">Gastos {Math.round(expensePercent)}%</span>
        </div>
      </div>
    </div>
  );
}

function BalanceBar({ balance, income, expense }: { balance: number; income: number; expense: number }) {
  const total = income + expense;
  const incomeWidth = total > 0 ? (income / total) * 100 : 50;
  const expenseWidth = total > 0 ? (expense / total) * 100 : 50;

  return (
    <div className="space-y-3">
      <div className="flex h-8 rounded-full overflow-hidden bg-gray-200">
        <div 
          className="bg-income flex items-center justify-center text-white text-sm font-medium transition-all duration-700"
          style={{ width: `${incomeWidth}%` }}
        >
          {incomeWidth > 20 && `+${formatMoneyEs(income)}`}
        </div>
        <div 
          className="bg-expense flex items-center justify-center text-white text-sm font-medium transition-all duration-700"
          style={{ width: `${expenseWidth}%` }}
        >
          {expenseWidth > 20 && `-${formatMoneyEs(expense)}`}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <span className="text-income font-bold text-lg">{formatMoneyEs(income)}</span>
          <span className="text-gray-500 text-sm ml-2">ingresos</span>
        </div>
        <div className={`px-4 py-1 rounded-full ${balance >= 0 ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
          <span className="font-bold">{formatMoneyEs(balance)}</span>
          <span className="text-sm ml-1">balance</span>
        </div>
        <div>
          <span className="text-expense font-bold text-lg">{formatMoneyEs(expense)}</span>
          <span className="text-gray-500 text-sm ml-2">gastos</span>
        </div>
      </div>
    </div>
  );
}

function BudgetCard({ budget }: { budget: { concept: string; amount: number; spent: number; remaining: number; percentage: number } }) {
  const conceptLabels: Record<string, string> = {
    gasolina: '⛽ Gasolina',
    comida: '🛒 Comida',
    alquiler: '🏠 Alquiler',
    servicios: '💡 Servicios',
    ocio: '🎮 Ocio',
    otros: '📦 Otros'
  };

  const conceptColors: Record<string, string> = {
    gasolina: '#F59E0B',
    comida: '#10B981',
    alquiler: '#6366F1',
    servicios: '#8B5CF6',
    ocio: '#EC4899',
    otros: '#6B7280'
  };

  const isOverBudget = budget.percentage > 100;
  const isCompleted = budget.percentage === 100;
  const isWarning = budget.percentage >= 80 && budget.percentage < 100;
  
  const progressColor = isOverBudget ? '#EF4444' : '#10B981';
  const barColor = conceptColors[budget.concept] || '#6B7280';

  const circleSize = 80;
  const circleStroke = 8;
  const radius = (circleSize - circleStroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(budget.percentage, 100) / 100) * circumference;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="relative" style={{ width: circleSize, height: circleSize }}>
          <svg width={circleSize} height={circleSize} className="transform -rotate-90">
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={circleStroke}
            />
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="none"
              stroke={progressColor}
              strokeWidth={circleStroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color: progressColor }}>
              {budget.percentage}%
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800">{conceptLabels[budget.concept] || budget.concept}</span>
            {isOverBudget && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Excedido</span>}
            {isCompleted && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Completado</span>}
            {isWarning && !isCompleted && <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">Casi</span>}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">
              <span className="font-medium text-expense">{formatMoneyEs(budget.spent)}</span>
              <span className="mx-1">/</span>
              <span className="font-medium">{formatMoneyEs(budget.amount)}</span>
            </span>
          </div>
          
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ 
                width: `${Math.min(budget.percentage, 100)}%`,
                backgroundColor: barColor
              }}
            />
          </div>
        </div>
        
        <div className="text-right">
          <p className={`text-lg font-bold ${budget.remaining >= 0 ? 'text-income' : 'text-expense'}`}>
            {budget.remaining >= 0 ? formatMoneyEs(budget.remaining) : `-${formatMoneyEs(Math.abs(budget.remaining))}`}
          </p>
          <p className="text-xs text-gray-500">
            {budget.remaining >= 0 ? 'disponible' : 'excedido'}
          </p>
        </div>
      </div>
    </div>
  );
}

function MonthlyChart({ data }: { data: { month: number; year: number; label: string; income: number; expense: number; balance: number }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <span className="text-4xl mb-2 block">📈</span>
        <p>Sin datos históricos</p>
      </div>
    );
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const filteredData = data.filter(d => d.income > 0 || d.expense > 0);
  const maxValue = Math.max(...filteredData.map(d => Math.max(d.income, d.expense)));
  const chartHeight = 150;

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Sin datos para mostrar
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-3 mb-2">
        <div className="w-3 h-3 rounded bg-income"></div>
        <span className="text-xs text-gray-500">Ingresos</span>
        <div className="w-3 h-3 rounded bg-expense ml-2"></div>
        <span className="text-xs text-gray-500">Gastos</span>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-4">
        <div className="flex items-start justify-start md:justify-center gap-4 min-w-max pt-2">
          {filteredData.map((item, index) => {
            const isCurrentMonth = item.month === currentMonth && item.year === currentYear;
            const isHovered = hoveredIndex === index;
            const incomeHeight = maxValue > 0 ? Math.max(4, (item.income / maxValue) * chartHeight) : 0;
            const expenseHeight = maxValue > 0 ? Math.max(4, (item.expense / maxValue) * chartHeight) : 0;
            
            return (
              <div 
                key={index} 
                className="relative flex flex-col items-center flex-shrink-0 group"
                style={{ width: '80px' }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {isHovered && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <div className="font-semibold">{item.label}</div>
                    <div className="flex items-center gap-1 text-green-400">
                      <span>Ingresos:</span>
                      <span className="font-bold">{formatMoneyEs(item.income)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-400">
                      <span>Gastos:</span>
                      <span className="font-bold">{formatMoneyEs(item.expense)}</span>
                    </div>
                  </div>
                )}
                
                {isCurrentMonth && !isHovered && (
                  <span className="absolute -top-6 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                    ⭐
                  </span>
                )}
                
                <div className="relative flex items-end gap-1" style={{ height: `${chartHeight}px` }}>
                  <div 
                    className={`absolute bottom-0 w-8 rounded-t cursor-pointer transition-all duration-200 ${isHovered ? 'bg-income scale-110' : 'bg-income/70'}`}
                    style={{ height: `${incomeHeight}px` }}
                  />
                  <div 
                    className={`absolute bottom-0 w-8 rounded-t cursor-pointer transition-all duration-200 ${isHovered ? 'bg-expense scale-110' : 'bg-expense/70'}`}
                    style={{ height: `${expenseHeight}px`, left: '36px' }}
                  />
                </div>
                
                <div className={`mt-2 mx-1 text-center p-3 rounded-lg w-full ${isCurrentMonth ? 'ring-2 ring-primary bg-primary/10 ring-offset-1' : 'bg-gray-50'}`}>
                  <p className={`text-[10px] truncate ${isCurrentMonth ? 'text-primary font-bold' : 'text-gray-500'}`}>
                    {item.label}
                  </p>
                  <p className={`text-xs font-bold mt-1 ${item.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {item.balance >= 0 ? '+' : ''}{formatMoneyEs(item.balance)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-6" />
    </div>
  );
}

export function Dashboard() {
  const { 
    getTotals, 
    getMonthlyTransactions, 
    fetchTransactions, 
    fetchBudgets,
    fetchMonthlyData,
    budgets,
    monthlyData,
    loading, 
    selectedMonth, 
    selectedYear, 
    setSelectedMonthYear,
    concepts 
  } = useStore();
  
  useEffect(() => {
    fetchTransactions({ month: selectedMonth, year: selectedYear });
    fetchBudgets();
    fetchMonthlyData();
  }, [fetchTransactions, fetchBudgets, fetchMonthlyData, selectedMonth, selectedYear]);

  const totals = getTotals();
  const monthlyTransactions = getMonthlyTransactions();

  const expenseByConcept = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const concept = t.concept || 'otros';
      acc[concept] = (acc[concept] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const monthLabel = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  const changeMonth = (delta: number) => {
    const d = new Date(selectedYear, selectedMonth - 1, 1);
    d.setMonth(d.getMonth() + delta);
    setSelectedMonthYear(d.getMonth() + 1, d.getFullYear());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
  };

  const conceptLabelByKey = concepts.reduce((acc, c) => {
    acc[c.key] = c.label;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-500 capitalize">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          {!isCurrentMonth() && (
            <button
              onClick={() => {
                const now = new Date();
                setSelectedMonthYear(now.getMonth() + 1, now.getFullYear());
              }}
              className="px-3 py-2 rounded-lg border border-primary text-primary text-sm hover:bg-primary/5 transition-colors"
            >
              Mes actual
            </button>
          )}
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-income/10 flex items-center justify-center">
            <TrendingUp className="text-income" size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Ingresos</p>
            <p className="text-2xl font-bold text-income">{formatMoneyEs(totals.income)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-expense/10 flex items-center justify-center">
            <TrendingDown className="text-expense" size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Gastos</p>
            <p className="text-2xl font-bold text-expense">{formatMoneyEs(totals.expense)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            totals.balance >= 0 ? 'bg-income/10' : 'bg-expense/10'
          }`}>
            <Wallet className={totals.balance >= 0 ? 'text-income' : 'text-expense'} size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Balance</p>
            <p className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatMoneyEs(totals.balance)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-center">Distribución Ingresos vs Gastos</h3>
          <DonutChart income={totals.income} expense={totals.expense} balance={totals.balance} />
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Balance Mensual</h3>
          <BalanceBar balance={totals.balance} income={totals.income} expense={totals.expense} />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <Target className="text-primary" size={24} />
          <h3 className="text-lg font-semibold">Presupuestos del Mes</h3>
        </div>
        
        {budgets.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl mb-4 block">🎯</span>
            <p className="text-gray-500 mb-2">No hay presupuestos establecidos para este mes</p>
            <p className="text-sm text-gray-400">Ve a la sección de Presupuestos para crear uno</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-primary" size={24} />
          <h3 className="text-lg font-semibold">Evolución Mensual (Últimos 6 meses)</h3>
        </div>
        <MonthlyChart data={monthlyData} />
      </div>
    </div>
  );
}
