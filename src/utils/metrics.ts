import { CustomerRecord, DashboardMetrics, StageType } from '../types';

export const ALL_STAGES: StageType[] = [
  'Lead',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];

export const STAGE_CONFIG: Record<
  StageType,
  {
    color: string;
    bg: string;
    border: string;
    barColor: string;
    textColor: string;
    badgeBg: string;
    dotColor: string;
  }
> = {
  Lead: {
    color: '#60a5fa', // blue-400
    bg: 'rgba(30, 58, 138, 0.4)',
    border: 'rgba(30, 64, 175, 0.5)',
    barColor: 'bg-[#6366f1]',
    textColor: 'text-blue-400',
    badgeBg: 'bg-blue-900/40 text-blue-400 border-blue-800/50',
    dotColor: 'bg-blue-400',
  },
  Qualified: {
    color: '#94a3b8', // slate-400
    bg: 'rgba(30, 41, 59, 0.7)',
    border: 'rgba(51, 65, 85, 0.8)',
    barColor: 'bg-[#6366f1]/80',
    textColor: 'text-slate-400',
    badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
    dotColor: 'bg-slate-400',
  },
  Proposal: {
    color: '#c084fc', // purple-400
    bg: 'rgba(88, 28, 135, 0.4)',
    border: 'rgba(107, 33, 168, 0.5)',
    barColor: 'bg-[#6366f1]/70',
    textColor: 'text-purple-400',
    badgeBg: 'bg-purple-900/40 text-purple-400 border-purple-800/50',
    dotColor: 'bg-purple-400',
  },
  Negotiation: {
    color: '#fb923c', // orange-400
    bg: 'rgba(124, 45, 18, 0.4)',
    border: 'rgba(154, 52, 18, 0.5)',
    barColor: 'bg-[#6366f1]/50',
    textColor: 'text-orange-400',
    badgeBg: 'bg-orange-900/40 text-orange-400 border-orange-800/50',
    dotColor: 'bg-orange-400',
  },
  'Closed Won': {
    color: '#34d399', // emerald-400
    bg: 'rgba(6, 78, 59, 0.4)',
    border: 'rgba(6, 95, 70, 0.5)',
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50',
    dotColor: 'bg-emerald-400',
  },
  'Closed Lost': {
    color: '#f87171', // rose-400
    bg: 'rgba(136, 19, 55, 0.4)',
    border: 'rgba(159, 18, 57, 0.5)',
    barColor: 'bg-rose-500',
    textColor: 'text-rose-400',
    badgeBg: 'bg-rose-900/40 text-rose-400 border-rose-800/50',
    dotColor: 'bg-rose-400',
  },
};

export function calculateMetrics(records: CustomerRecord[]): DashboardMetrics {
  const totalAccounts = records.length;

  let activePipelineValue = 0;
  let totalDealVolume = 0;
  let closedWonValue = 0;
  let closedLostValue = 0;
  let closedWonCount = 0;
  let closedLostCount = 0;
  let newLeadsCount = 0;

  const stageBreakdown: DashboardMetrics['stageBreakdown'] = {
    Lead: { count: 0, value: 0, percentage: 0 },
    Qualified: { count: 0, value: 0, percentage: 0 },
    Proposal: { count: 0, value: 0, percentage: 0 },
    Negotiation: { count: 0, value: 0, percentage: 0 },
    'Closed Won': { count: 0, value: 0, percentage: 0 },
    'Closed Lost': { count: 0, value: 0, percentage: 0 },
  };

  records.forEach((rec) => {
    const val = Number(rec.dealValue) || 0;
    totalDealVolume += val;

    if (rec.newLead) {
      newLeadsCount++;
    }

    if (stageBreakdown[rec.statusStage]) {
      stageBreakdown[rec.statusStage].count++;
      stageBreakdown[rec.statusStage].value += val;
    }

    if (rec.statusStage === 'Closed Won') {
      closedWonValue += val;
      closedWonCount++;
    } else if (rec.statusStage === 'Closed Lost') {
      closedLostValue += val;
      closedLostCount++;
    } else {
      // Active pipeline stages
      activePipelineValue += val;
    }
  });

  // Calculate percentages
  ALL_STAGES.forEach((st) => {
    stageBreakdown[st].percentage =
      totalAccounts > 0 ? Math.round((stageBreakdown[st].count / totalAccounts) * 100) : 0;
  });

  const resolvedDeals = closedWonCount + closedLostCount;
  const conversionRate = resolvedDeals > 0 ? Math.round((closedWonCount / resolvedDeals) * 100) : (totalAccounts > 0 ? Math.round((closedWonCount / totalAccounts) * 100) : 0);
  const averageDealSize = totalAccounts > 0 ? Math.round(totalDealVolume / totalAccounts) : 0;

  return {
    totalAccounts,
    activePipelineValue,
    totalDealVolume,
    closedWonValue,
    closedLostValue,
    conversionRate,
    averageDealSize,
    newLeadsCount,
    stageBreakdown,
  };
}

export function formatCurrency(val: number): string {
  if (val >= 1_000_000) {
    return `£${(val / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatExactCurrency(val: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(val);
}
