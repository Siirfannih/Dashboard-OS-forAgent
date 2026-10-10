import React, { useState } from 'react';
import { 
  Home, 
  Bot,
  CheckSquare, 
  LayoutGrid, 
  MessageSquare, 
  Users, 
  DollarSign, 
  Shield, 
  Search, 
  ChevronDown, 
  Menu, 
  X 
} from 'lucide-react';
import { ActorAvatar } from '../common/Pill';

interface ShellProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  waitingDecisionsCount: number;
  blockedPipelineCount: number;
  chatsActionCount: number;
  onOpenSearch: () => void;
  onOpenKebijakan: () => void;
  children: React.ReactNode;
}

export function Shell({
  currentTab,
  onNavigate,
  waitingDecisionsCount,
  blockedPipelineCount,
  chatsActionCount,
  onOpenSearch,
  onOpenKebijakan,
  children,
}: ShellProps) {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Tab titles for breadcrumbs
  const getTabTitle = () => {
    switch (currentTab) {
      case 'home':
        return 'Home';
      case 'team-boarding':
        return 'Team Boarding';
      case 'keputusan':
        return 'Keputusan';
      case 'pipeline':
        return 'Pipeline';
      case 'percakapan':
        return 'Percakapan';
      case 'tim-agen':
        return 'Tim Agen';
      case 'biaya-kapasitas':
        return 'Biaya & Kapasitas';
      default:
        return 'Home';
    }
  };

  const handleTabClick = (tab: string) => {
    onNavigate(tab);
    setIsMobileNavOpen(false); // Close mobile drawer when link clicked
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F9FAFB] text-[#111827]">
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileNavOpen && (
        <div
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-40 lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* ================= LEFT NAV (Responsive Drawer on Mobile, Fixed on Desktop) ================= */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] lg:w-[240px] shrink-0 bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col justify-between select-none transition-transform duration-200 ease-in-out ${
          isMobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Workspace switcher & Navigation items */}
        <div className="flex flex-col">
          {/* Workspace switcher */}
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="relative flex-1 mr-1">
              <button
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E7EB] text-left hover:border-[#2563EB]/40 transition-colors shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-6 h-6 rounded-md bg-[#111827] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    J
                  </div>
                  <div className="truncate">
                    <div className="text-[13px] font-semibold text-[#111827] truncate">
                      Jadisatu Sales
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] font-mono leading-none">
                      Workspace · 2026
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#9CA3AF] shrink-0 group-hover:text-[#111827]" />
              </button>

              {workspaceMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-[#E5E7EB] shadow-lg p-1 z-30 space-y-1 text-[13px]">
                  <div className="px-2 py-1 text-[11px] font-semibold text-[#9CA3AF] uppercase">
                    Pilih Workspace
                  </div>
                  <button
                    onClick={() => setWorkspaceMenuOpen(false)}
                    className="w-full text-left px-2 py-1.5 rounded-md bg-[#EFF4FF] text-[#2563EB] font-medium flex items-center justify-between"
                  >
                    <span>Jadisatu Sales</span>
                    <span className="text-[10px] font-mono">Aktif</span>
                  </button>
                  <button
                    onClick={() => {
                      alert('Workspace Sambung CRM dalam pengembangan terpisah.');
                      setWorkspaceMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[#F3F4F6] text-[#6B7280] flex items-center justify-between"
                  >
                    <span>Sambung CRM</span>
                    <span className="text-[10px] font-mono text-[#9CA3AF]">v2.1</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileNavOpen(false)}
              className="lg:hidden p-1.5 text-[#6B7280] hover:text-[#111827] rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-4 overflow-y-auto">
            {/* Main Items: Home & Team Boarding */}
            <div className="space-y-1">
              <NavItem
                icon={Home}
                label="Home"
                isActive={currentTab === 'home'}
                onClick={() => handleTabClick('home')}
              />
              <NavItem
                icon={Bot}
                label="Team Boarding"
                badgeText="Asisten AI"
                badgeVariant="blue"
                isActive={currentTab === 'team-boarding'}
                onClick={() => handleTabClick('team-boarding')}
              />
            </div>

            {/* Overline: SALES */}
            <div className="space-y-1">
              <div className="px-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                SALES
              </div>
              <NavItem
                icon={CheckSquare}
                label="Keputusan"
                badgeText={waitingDecisionsCount > 0 ? String(waitingDecisionsCount) : undefined}
                badgeVariant="amber"
                isActive={currentTab === 'keputusan'}
                onClick={() => handleTabClick('keputusan')}
              />
              <NavItem
                icon={LayoutGrid}
                label="Pipeline"
                badgeText={blockedPipelineCount > 0 ? String(blockedPipelineCount) : undefined}
                badgeVariant="red"
                isActive={currentTab === 'pipeline'}
                onClick={() => handleTabClick('pipeline')}
              />
              <NavItem
                icon={MessageSquare}
                label="Percakapan"
                badgeText={chatsActionCount > 0 ? String(chatsActionCount) : undefined}
                badgeVariant="blue"
                isActive={currentTab === 'percakapan'}
                onClick={() => handleTabClick('percakapan')}
              />
            </div>

            {/* Overline: OPERASI */}
            <div className="space-y-1">
              <div className="px-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                OPERASI
              </div>
              <NavItem
                icon={Users}
                label="Tim Agen"
                hasRedDot={true}
                isActive={currentTab === 'tim-agen'}
                onClick={() => handleTabClick('tim-agen')}
              />
              <NavItem
                icon={DollarSign}
                label="Biaya & Kapasitas"
                isActive={currentTab === 'biaya-kapasitas'}
                onClick={() => handleTabClick('biaya-kapasitas')}
              />
            </div>
          </nav>
        </div>

        {/* Bottom Nav: Kebijakan, Cari ⌘K, User Avatar */}
        <div className="p-3 border-t border-[#E5E7EB] space-y-1 bg-[#F9FAFB]">
          <button
            onClick={() => {
              onOpenKebijakan();
              setIsMobileNavOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          >
            <Shield className="w-4 h-4 text-[#6B7280]" />
            <span>Kebijakan</span>
          </button>

          <button
            onClick={() => {
              onOpenSearch();
              setIsMobileNavOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-[#6B7280]" />
              <span>Cari</span>
            </div>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-white border border-[#E5E7EB] text-[#9CA3AF]">
              ⌘K
            </kbd>
          </button>

          <div className="pt-2 mt-1 border-t border-[#E5E7EB] flex items-center gap-2.5 px-3 py-1">
            <ActorAvatar actor="irfan" size={26} name="Irfan" />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[#111827] leading-snug truncate">
                Irfan
              </div>
              <div className="text-[10px] text-[#9CA3AF] leading-none">
                Founder · Bali
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN COLUMN (Top bar + Viewport) ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* TOP BAR - CLEAN, UNCLUTTERED */}
        <header className="h-14 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between shrink-0 select-none gap-2">
          {/* Left: Mobile Menu Button & Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-[#6B7280] hover:text-[#111827] rounded-md hover:bg-[#F3F4F6] transition-colors"
              title="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-[13px] truncate">
              <span className="hidden sm:inline text-[#6B7280]">Jadisatu Sales</span>
              <span className="hidden sm:inline text-[#D1D5DB]">/</span>
              <span className="font-semibold text-[#111827] truncate">{getTabTitle()}</span>
            </div>
          </div>

          {/* Right: Clean search & avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search ⌘K trigger */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md border border-[#E5E7EB] transition-colors"
              title="Cari ⌘K"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cari...</span>
              <kbd className="hidden sm:inline text-[10px] font-mono text-[#9CA3AF]">⌘K</kbd>
            </button>

            {/* Avatar */}
            <div title="Irfan (Founder)" className="shrink-0">
              <ActorAvatar actor="irfan" size={28} />
            </div>
          </div>
        </header>

        {/* VIEWPORT AREA - AUTOMATICALLY RESPONSIVE */}
        <main className="flex-1 flex overflow-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  badgeText,
  badgeVariant = 'gray',
  hasRedDot = false,
  isActive = false,
  onClick,
}: {
  icon: any;
  label: string;
  badgeText?: string;
  badgeVariant?: 'amber' | 'red' | 'blue' | 'gray';
  hasRedDot?: boolean;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
        isActive
          ? 'bg-[#F3F4F6] text-[#2563EB]'
          : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        <Icon
          className={`w-4 h-4 shrink-0 stroke-[1.5] ${
            isActive ? 'text-[#2563EB]' : 'text-[#6B7280]'
          }`}
        />
        <span className="truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {hasRedDot && (
          <span className="w-2 h-2 rounded-full bg-[#B42318] ring-2 ring-white" />
        )}
        {badgeText && (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-semibold tabular-nums ${
              badgeVariant === 'amber'
                ? 'bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]'
                : badgeVariant === 'red'
                ? 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]'
                : badgeVariant === 'blue'
                ? 'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]'
                : 'bg-[#F2F4F7] text-[#344054]'
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>
    </button>
  );
}
