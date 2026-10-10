import React, { useState } from 'react';
import { 
  Users, 
  Server, 
  Cpu, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Wrench,
  Clock,
  ArrowDown
} from 'lucide-react';
import { AgentNode, AgentService } from '../../types';
import { StatusPill, ActorAvatar } from '../common/Pill';

interface TimAgenProps {
  nodes: AgentNode[];
  services: AgentService[];
}

export function TimAgen({ nodes, services }: TimAgenProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('candra');

  const selectedAgent = nodes.find((n) => n.id === selectedAgentId) || nodes[1];

  const nodeIrfan = nodes.find((n) => n.id === 'irfan')!;
  const nodeCandra = nodes.find((n) => n.id === 'candra')!;
  const nodeWorker = nodes.find((n) => n.id === 'worker-pc')!;
  const nodeAngga = nodes.find((n) => n.id === 'angga')!;

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#F9FAFB]">
      {/* Main Content Area: Org chart & Services Table */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 border-r border-[#E5E7EB]">
        {/* Header */}
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">
            Tim Agen &amp; Infrastruktur
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Hierarki peran, kesehatan eksekusi agen, dan dependensi layanan sales
          </p>
        </div>

        {/* Section 1: Org Chart */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                ORGANISASI SISTEM
              </div>
              <h2 className="text-[16px] font-semibold text-[#111827]">
                Peta Wewenang &amp; Delegasi
              </h2>
            </div>
            <span className="text-[12px] text-[#6B7280]">
              Pilih kartu untuk melihat izin akses (Boleh / Tidak Boleh)
            </span>
          </div>

          {/* Org Chart Visualization */}
          <div className="relative max-w-[800px] mx-auto py-2">
            {/* Top Level: Irfan (Founder) & Side Branch to Angga */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Irfan Card */}
              <div className="flex flex-col items-center">
                <OrgNodeCard
                  node={nodeIrfan}
                  isSelected={selectedAgentId === 'irfan'}
                  onSelect={() => setSelectedAgentId('irfan')}
                />
                {/* Vertical Connector Down to Candra */}
                <div className="w-[1px] h-8 bg-[#E5E7EB] my-1" />
              </div>

              {/* Side Branch: Angga (Dashed line from Irfan level) */}
              <div className="relative pt-4 md:pt-0">
                <div className="hidden md:block absolute -left-8 top-12 w-8 border-t border-dashed border-[#9CA3AF]" />
                <div className="text-[11px] font-mono text-[#0E9384] mb-1 text-center md:text-left">
                  ── Jalur Maintenance (Bukan Sales) ──
                </div>
                <OrgNodeCard
                  node={nodeAngga}
                  isSelected={selectedAgentId === 'angga'}
                  onSelect={() => setSelectedAgentId('angga')}
                  isDashed
                />
              </div>
            </div>

            {/* Middle Level: Candra (Head Sales) */}
            <div className="flex flex-col items-center md:items-start md:w-1/2">
              <OrgNodeCard
                node={nodeCandra}
                isSelected={selectedAgentId === 'candra'}
                onSelect={() => setSelectedAgentId('candra')}
              />
              {/* Vertical Connector Down to Worker PC */}
              <div className="w-[1px] h-8 bg-[#E5E7EB] my-1 self-center" />
            </div>

            {/* Bottom Level: Worker Riset PC-1 */}
            <div className="flex flex-col items-center md:items-start md:w-1/2">
              <OrgNodeCard
                node={nodeWorker}
                isSelected={selectedAgentId === 'worker-pc'}
                onSelect={() => setSelectedAgentId('worker-pc')}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Table Layanan */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="p-4 px-5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                INFRASTRUKTUR TEKNIS
              </div>
              <h2 className="text-[16px] font-semibold text-[#111827]">
                Status Layanan &amp; Konektivitas
              </h2>
            </div>
            <span className="text-[12px] text-[#6B7280]">
              Monitoring otomatis setiap 60 detik
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#F9FAFB]/50 text-[12px]">
                  <th className="py-2.5 px-4 font-medium">Layanan</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Sejak</th>
                  <th className="py-2.5 px-4 font-medium">Catatan Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {services.map((srv, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#111827]">
                      {srv.name}
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill variant={srv.status}>
                        {srv.statusLabel}
                      </StatusPill>
                    </td>
                    <td className="py-3 px-4 text-[#6B7280] font-mono text-[12px]">
                      {srv.since}
                    </td>
                    <td className="py-3 px-4 text-[#4B5563]">
                      {srv.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= RIGHT RAIL: Detail Agent Terpilih ================= */}
      {selectedAgent && (
        <div className="hidden lg:block w-[300px] xl:w-[360px] shrink-0 h-full overflow-y-auto p-5 bg-white border-l border-[#E5E7EB] space-y-6">
          {/* Agent Header */}
          <div className="pb-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3 mb-2">
              <ActorAvatar actor={selectedAgent.id as any} size={36} />
              <div>
                <h3 className="text-[16px] font-semibold text-[#111827]">
                  {selectedAgent.name}
                </h3>
                <p className="text-[13px] text-[#6B7280]">{selectedAgent.role}</p>
              </div>
            </div>
            <div className="mt-2 text-[12px] text-[#6B7280] space-y-1">
              <div>
                Platform: <strong className="text-[#111827]">{selectedAgent.platform}</strong>
              </div>
              <div>
                Model / LLM: <span className="font-mono text-[#2563EB]">{selectedAgent.model}</span>
              </div>
            </div>
          </div>

          {/* Section: Boleh */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#027A48] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Boleh (Wewenang Diizinkan)</span>
            </div>
            <ul className="space-y-2">
              {selectedAgent.allowed.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-lg border border-[#D1FADF] bg-[#ECFDF3]/40 text-[12px] text-[#027A48] flex items-start gap-2"
                >
                  <span className="font-bold shrink-0 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section: Tidak Boleh */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#B42318] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Tidak Boleh (Dilarang Mandiri)</span>
            </div>
            <ul className="space-y-2">
              {selectedAgent.disallowed.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-lg border border-[#FECDCA] bg-[#FEF3F2]/40 text-[12px] text-[#B42318] flex items-start gap-2"
                >
                  <span className="font-bold shrink-0 mt-0.5">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section: Riwayat Aksi Terbaru */}
          <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
              AKSI TERBARU HARI INI
            </div>
            <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-[#E5E7EB]">
              {selectedAgent.recentActions.map((act, idx) => (
                <div key={idx} className="relative text-[12px]">
                  <span className="absolute -left-[14px] top-1 w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-white" />
                  <p className="font-medium text-[#111827]">{act.action}</p>
                  <span className="text-[11px] font-mono text-[#9CA3AF] mt-0.5 block">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgNodeCard({
  node,
  isSelected,
  onSelect,
  isDashed = false,
}: {
  node: AgentNode;
  isSelected: boolean;
  onSelect: () => void;
  isDashed?: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={`w-full max-w-[340px] p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'bg-[#EFF4FF] border-[#2563EB] shadow-xs ring-1 ring-[#2563EB]'
          : isDashed
          ? 'bg-white border-dashed border-[#0E9384] hover:border-solid'
          : 'bg-white border-[#E5E7EB] hover:border-[#2563EB]/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <ActorAvatar actor={node.id as any} size={32} />
          <div>
            <h4 className="text-[14px] font-semibold text-[#111827]">{node.name}</h4>
            <p className="text-[12px] text-[#6B7280]">{node.role}</p>
          </div>
        </div>

        <StatusPill variant={node.statusVariant}>
          {node.statusLabel}
        </StatusPill>
      </div>

      <div className="text-[11px] text-[#9CA3AF] font-mono mb-3">
        Heartbeat: {node.heartbeat}
      </div>

      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#F3F4F6] text-center font-mono">
        <div className="p-1 rounded-sm bg-[#F9FAFB]">
          <div className="text-[10px] text-[#9CA3AF]">Task</div>
          <div className="text-[13px] font-medium text-[#111827]">{node.tasksToday}</div>
        </div>
        <div className="p-1 rounded-sm bg-[#F9FAFB]">
          <div className="text-[10px] text-[#9CA3AF]">Rework</div>
          <div className="text-[13px] font-medium text-[#111827]">{node.reworkRate}</div>
        </div>
        <div className="p-1 rounded-sm bg-[#F9FAFB]">
          <div className="text-[10px] text-[#9CA3AF]">Biaya</div>
          <div className="text-[13px] font-medium text-[#111827]">{node.costRp}</div>
        </div>
      </div>

      {node.quotaUnknown && (
        <div className="mt-2 text-center">
          <StatusPill variant="unknown" dot={false} className="w-full justify-center">
            Kuota: tidak diketahui
          </StatusPill>
        </div>
      )}
    </div>
  );
}
