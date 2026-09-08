import React, { useMemo, useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  Shield,
  Filter,
  CheckCircle2,
  Sparkles,
  Layers,
  PieChart,
} from 'lucide-react';
import { CustomerRecord, SheetUser, AgentLeaderboardStats, StageType } from '../types';
import { formatCurrency, formatExactCurrency, calculateMetrics } from '../utils/metrics';
import { StageDistributionCard, ConversionFunnelCard } from './ExecutiveDashboard';

interface LeaderboardViewProps {
  customers: CustomerRecord[];
  currentUser: SheetUser;
  availableUsers?: SheetUser[];
  onFilterByAgent: (agentName: string) => void;
  onBackToDashboard: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  customers,
  currentUser,
  availableUsers = [],
  onFilterByAgent,
  onBackToDashboard,
}) => {
  const [selectedStageFilter, setSelectedStageFilter] = useState<StageType | 'ALL'>('ALL');
  const metrics = useMemo(() => calculateMetrics(customers), [customers]);

  // Aggregate metrics per agent
  const leaderboardData: AgentLeaderboardStats[] = useMemo(() => {
    const map = new Map<
      string,
      {
        agentName: string;
        agentEmail: string;
        totalAccounts: number;
        closedWonDeals: number;
        closedWonValue: number;
        closedLostDeals: number;
        activePipelineValue: number;
        totalDealVolume: number;
      }
    >();

    // Seed real users from the sheet so they appear on the board
    availableUsers.forEach((u) => {
      map.set(u.userName, {
        agentName: u.userName,
        agentEmail: u.email,
        totalAccounts: 0,
        closedWonDeals: 0,
        closedWonValue: 0,
        closedLostDeals: 0,
        activePipelineValue: 0,
        totalDealVolume: 0,
      });
    });

    // Populate from customer records
    customers.forEach((rec) => {
      const agent = rec.assignedTo || 'Unassigned';
      if (!map.has(agent)) {
        map.set(agent, {
          agentName: agent,
          agentEmail: rec.assignedToEmail || (agent === 'Unassigned' ? 'unassigned@crm.com' : `${agent.toLowerCase().replace(/\s+/g, '.')}@crm.com`),
          totalAccounts: 0,
          closedWonDeals: 0,
          closedWonValue: 0,
          closedLostDeals: 0,
          activePipelineValue: 0,
          totalDealVolume: 0,
        });
      }

      const item = map.get(agent)!;
      item.totalAccounts += 1;
      const val = Number(rec.dealValue) || 0;
      item.totalDealVolume += val;

      if (rec.statusStage === 'Closed Won') {
        item.closedWonDeals += 1;
        item.closedWonValue += val;
      } else if (rec.statusStage === 'Closed Lost') {
        item.closedLostDeals += 1;
      } else {
        item.activePipelineValue += val;
      }
    });

    // Sort by Closed Won Revenue descending
    const list = Array.from(map.values())
      .map((item) => {
        const resolved = item.closedWonDeals + item.closedLostDeals;
        const winRate =
          resolved > 0
            ? Math.round((item.closedWonDeals / resolved) * 100)
            : item.totalAccounts > 0
            ? Math.round((item.closedWonDeals / item.totalAccounts) * 100)
            : 0;

        const averageDealSize =
          item.totalAccounts > 0 ? Math.round(item.totalDealVolume / item.totalAccounts) : 0;

        return {
          agentName: item.agentName,
          agentEmail: item.agentEmail,
          totalAccounts: item.totalAccounts,
          closedWonDeals: item.closedWonDeals,
          closedWonValue: item.closedWonValue,
          activePipelineValue: item.activePipelineValue,
          winRate,
          averageDealSize,
          rank: 0,
        };
      })
      .sort((a, b) => {
        if (b.closedWonValue !== a.closedWonValue) {
          return b.closedWonValue - a.closedWonValue;
        }
        return b.closedWonDeals - a.closedWonDeals;
      });

    // Assign rank
    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [customers]);

  const topThree = leaderboardData.slice(0, 3);
  const currentAgentStats = leaderboardData.find(
    (a) =>
      a.agentName.toLowerCase() === currentUser.userName.toLowerCase() ||
      a.agentEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  return (
    <div id="leaderboard-view" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Executive Sales Leaderboard
            </h2>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
              Live Team Rankings
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time performance rankings by closed revenue, won deal volume, and conversion efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Back to Directory
          </button>
        </div>
      </div>

      {/* Personal Rank Highlight for Current User if Sales Agent */}
      {currentUser.role === 'Sales Agent' && currentAgentStats && (
        <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/50 via-[#1f2937] to-indigo-950/30 p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6366f1] text-white shadow-lg shadow-indigo-600/30 font-bold text-lg">
              #{currentAgentStats.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                  Your Current Standing
                </span>
                <span className="rounded bg-indigo-500/20 px-2 py-0.2 text-[10px] text-indigo-300 font-mono">
                  Rank {currentAgentStats.rank} of {leaderboardData.length}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{currentUser.userName}</h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-slate-800 sm:border-t-0 pt-3 sm:pt-0">
            <div>
              <p className="text-[10px] uppercase text-slate-400">Closed Won</p>
              <p className="text-sm font-bold text-emerald-400">
                {formatCurrency(currentAgentStats.closedWonValue)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400">Deals Won</p>
              <p className="text-sm font-bold text-white font-mono">
                {currentAgentStats.closedWonDeals} deals
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400">Win Rate</p>
              <p className="text-sm font-bold text-indigo-400 font-mono">
                {currentAgentStats.winRate}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topThree.map((agent, index) => {
          const isGold = index === 0;
          const isSilver = index === 1;
          const isBronze = index === 2;

          const cardBorder = isGold
            ? 'border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-[#1f2937]'
            : isSilver
            ? 'border-slate-400/40 bg-gradient-to-b from-slate-400/10 to-[#1f2937]'
            : 'border-orange-600/40 bg-gradient-to-b from-orange-600/10 to-[#1f2937]';

          const medalIcon = isGold ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="h-5 w-5" />
            </div>
          ) : isSilver ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-400/20 text-slate-300 border border-slate-400/30">
              <Medal className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Award className="h-5 w-5" />
            </div>
          );

          const badgeLabel = isGold
            ? '1ST PLACE • TOP PERFORMER'
            : isSilver
            ? '2ND PLACE • RUNNER UP'
            : '3RD PLACE • BRONZE';

          return (
            <div
              key={agent.agentName}
              className={`relative rounded-xl border p-5 shadow-xl backdrop-blur-sm transition-all hover:scale-[1.01] ${cardBorder}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {badgeLabel}
                </span>
                {medalIcon}
              </div>

              <div className="mt-3">
                <h3 className="text-lg font-bold text-white">{agent.agentName}</h3>
                <p className="text-xs text-slate-400 font-mono">{agent.agentEmail}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400">Closed Won ARR</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    {formatCurrency(agent.closedWonValue)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Deals Won</span>
                  <span className="font-semibold text-slate-200 font-mono">
                    {agent.closedWonDeals} {agent.closedWonDeals === 1 ? 'deal' : 'deals'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Active Pipeline</span>
                  <span className="font-semibold text-[#6366f1] font-mono">
                    {formatCurrency(agent.activePipelineValue)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Win Rate</span>
                  <span className="font-semibold text-emerald-300 font-mono">{agent.winRate}%</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => onFilterByAgent(agent.agentName)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-800/90 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-[#6366f1] hover:text-white transition-colors"
                >
                  <Filter className="h-3 w-3" />
                  <span>Inspect Agent Directory</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Distribution & Conversion Funnel (Requested in Leaderboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <StageDistributionCard
            metrics={metrics}
            selectedStageFilter={selectedStageFilter}
            onSelectStageFilter={setSelectedStageFilter}
          />
        </div>
        <div className="flex flex-col">
          <ConversionFunnelCard metrics={metrics} />
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="rounded-xl border border-slate-800 bg-[#1f2937] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#111827]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Complete Sales Agent Leaderboard
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative metrics across all pipeline assignments.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Reps: {leaderboardData.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#111827]/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4 text-center w-14">Rank</th>
                <th className="py-3 px-4">Sales Agent</th>
                <th className="py-3 px-4 text-right">Closed Won</th>
                <th className="py-3 px-4 text-right">Deals Won</th>
                <th className="py-3 px-4 text-right">Active Pipeline</th>
                <th className="py-3 px-4 text-right">Accounts</th>
                <th className="py-3 px-4 text-right">Win Rate</th>
                <th className="py-3 px-4 text-right">Avg Deal</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {leaderboardData.map((agent) => {
                const isCurrent =
                  currentUser.userName.toLowerCase() === agent.agentName.toLowerCase() ||
                  currentUser.email.toLowerCase() === agent.agentEmail.toLowerCase();

                return (
                  <tr
                    key={agent.agentName}
                    className={`transition-colors hover:bg-slate-800/50 ${
                      isCurrent ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          agent.rank === 1
                            ? 'bg-amber-500 text-slate-950 font-extrabold'
                            : agent.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : agent.rank === 3
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {agent.rank}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-[#6366f1]">
                          {agent.agentName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white">{agent.agentName}</span>
                            {isCurrent && (
                              <span className="rounded bg-[#6366f1]/20 px-1.5 py-0.2 text-[10px] text-[#6366f1] font-semibold">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {agent.agentEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(agent.closedWonValue)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                      {agent.closedWonDeals}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[#6366f1]">
                      {formatCurrency(agent.activePipelineValue)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {agent.totalAccounts}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono text-emerald-400 font-semibold">
                          {agent.winRate}%
                        </span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(agent.winRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      {formatCurrency(agent.averageDealSize)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onFilterByAgent(agent.agentName)}
                        title={`Filter Directory by ${agent.agentName}`}
                        className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Filter className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
