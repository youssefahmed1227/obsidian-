import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  Filter,
  Flame,
  Award,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CustomerRecord, DashboardMetrics, StageType, CRMNotification } from '../types';
import { formatCurrency, formatExactCurrency, ALL_STAGES, STAGE_CONFIG } from '../utils/metrics';

interface KPICardsProps {
  metrics: DashboardMetrics;
  newLeadsCount: number;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics, newLeadsCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Accounts */}
      <div
        id="kpi-total-accounts"
        className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#111827] p-5 shadow-sm dark:shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:border-slate-700"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Accounts
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
            <Users className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {metrics.totalAccounts}
          </h2>
          {newLeadsCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/30">
              <Sparkles className="h-3 w-3" />
              +{newLeadsCount} new
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Directory live</span>
          )}
        </div>

        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <span>Active client portfolios in registry</span>
        </p>
      </div>

      {/* Pipeline Value */}
      <div
        id="kpi-active-pipeline"
        className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#111827] p-5 shadow-sm dark:shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:border-slate-700"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pipeline Value
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(metrics.activePipelineValue)}
          </h2>
          <span className="rounded-full bg-blue-50 dark:bg-blue-500/15 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/30">
            Active Deals
          </span>
        </div>

        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          In Lead, Qualified & Negotiation
        </p>
      </div>

      {/* Total Deal Volume */}
      <div
        id="kpi-deal-volume"
        className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#111827] p-5 shadow-sm dark:shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:border-slate-700"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Deal Volume
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
            <DollarSign className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(metrics.totalDealVolume)}
          </h2>
          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            Portfolio Gross
          </span>
        </div>

        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Total contracted and potential value
        </p>
      </div>

      {/* Conversion Rate */}
      <div
        id="kpi-conversion-rate"
        className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#111827] p-5 shadow-sm dark:shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:border-slate-700"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Conversion Rate
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
            <Target className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {metrics.conversionRate}%
          </h2>
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
            Win Ratio
          </span>
        </div>

        <div className="mt-2.5">
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(metrics.conversionRate, 5), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface StageDistributionCardProps {
  metrics: DashboardMetrics;
  selectedStageFilter: StageType | 'ALL';
  onSelectStageFilter: (stage: StageType | 'ALL') => void;
}

export const StageDistributionCard: React.FC<StageDistributionCardProps> = ({
  metrics,
  selectedStageFilter,
  onSelectStageFilter,
}) => {
  return (
    <div className="bg-[#1f2937] p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-200">Stage Distribution</h3>
        {selectedStageFilter !== 'ALL' && (
          <button
            onClick={() => onSelectStageFilter('ALL')}
            className="text-[10px] text-[#6366f1] uppercase font-bold hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-3">
        {ALL_STAGES.map((stage) => {
          const data = metrics.stageBreakdown[stage];
          const config = STAGE_CONFIG[stage];
          const isSelected = selectedStageFilter === stage;

          return (
            <div
              key={stage}
              onClick={() => onSelectStageFilter(isSelected ? 'ALL' : stage)}
              className={`group cursor-pointer rounded p-1.5 transition-all ${
                isSelected ? 'bg-slate-800/90 ring-1 ring-[#6366f1]' : 'hover:bg-slate-800/40'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectStageFilter(isSelected ? 'ALL' : stage);
                }
              }}
              aria-label={`Filter by ${stage}: ${data.count} deals, ${data.percentage}%`}
            >
              <div className="flex justify-between text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                <span className="group-hover:text-slate-200 flex items-center gap-1.5 font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor || 'bg-[#6366f1]'}`} />
                  {stage}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-300">{data.percentage}%</span>
                  <span className="text-[10px] text-slate-500 font-mono">({data.count})</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${config.barColor || 'bg-[#6366f1]'}`}
                  style={{ width: `${Math.max(data.percentage, data.count > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface RecentEventsCardProps {
  notifications: CRMNotification[];
  onClearNotifications: () => void;
}

export const RecentEventsCard: React.FC<RecentEventsCardProps> = ({
  notifications,
  onClearNotifications,
}) => {
  return (
    <div className="bg-[#1f2937] p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-200">Recent Events</h3>
        {notifications.length > 0 && (
          <span
            onClick={onClearNotifications}
            className="text-[10px] text-[#6366f1] uppercase font-bold cursor-pointer hover:underline"
          >
            Clear All
          </span>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">No recent events recorded</p>
        ) : (
          notifications.slice(0, 4).map((notif) => (
            <div key={notif.id} className="flex items-start gap-3">
              <div className="w-1 bg-emerald-500 rounded-full shrink-0 self-stretch my-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200">
                  {notif.title.includes(':') ? (
                    <>
                      {notif.title.split(':')[0]}:{' '}
                      <span className="underline decoration-[#6366f1] decoration-1">
                        {notif.title.split(':')[1]}
                      </span>
                    </>
                  ) : (
                    notif.title
                  )}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 flex-wrap">
                  {notif.dayName && (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 font-semibold text-[9px] border border-indigo-500/20">
                      {notif.dayName}
                    </span>
                  )}
                  <span>{notif.date || notif.timestamp}</span>
                  {notif.time && <span className="text-slate-500 font-mono">• {notif.time}</span>}
                  <span className="text-slate-500 truncate">• {notif.description}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface ConversionFunnelCardProps {
  metrics: DashboardMetrics;
}

export const ConversionFunnelCard: React.FC<ConversionFunnelCardProps> = ({ metrics }) => {
  return (
    <div className="bg-[#1f2937] p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200">Conversion Funnel</h3>
        <span className="text-[10px] font-mono text-emerald-400 font-bold">
          {metrics.conversionRate}% Win Rate
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-400 py-1 border-b border-slate-800/60">
          <span>Inquiries / Leads</span>
          <span className="font-mono text-slate-200 font-semibold">
            {metrics.stageBreakdown['Lead'].count}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400 py-1 border-b border-slate-800/60">
          <span>Qualified & Proposals</span>
          <span className="font-mono text-slate-200 font-semibold">
            {metrics.stageBreakdown['Qualified'].count + metrics.stageBreakdown['Proposal'].count}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400 py-1 border-b border-slate-800/60">
          <span>Negotiation</span>
          <span className="font-mono text-amber-400 font-semibold">
            {metrics.stageBreakdown['Negotiation'].count}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-400 py-1">
          <span className="text-emerald-400 font-medium">Closed Won ARR</span>
          <span className="font-mono text-emerald-300 font-bold">
            {formatExactCurrency(metrics.closedWonValue)}
          </span>
        </div>
      </div>
    </div>
  );
};

interface ExecutiveDashboardProps {
  metrics: DashboardMetrics;
  selectedStageFilter: StageType | 'ALL';
  onSelectStageFilter: (stage: StageType | 'ALL') => void;
  onOpenAddCustomerModal: () => void;
  newLeadsCount: number;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  metrics,
  selectedStageFilter,
  onSelectStageFilter,
  onOpenAddCustomerModal,
  newLeadsCount,
}) => {
  return (
    <div className="space-y-4">
      <KPICards metrics={metrics} newLeadsCount={newLeadsCount} />
    </div>
  );
};
