import React, { useState } from 'react';
import { Shell } from './components/layout/Shell';
import { Home } from './components/screens/Home';
import { TeamBoarding } from './components/screens/TeamBoarding';
import { Keputusan } from './components/screens/Keputusan';
import { Pipeline } from './components/screens/Pipeline';
import { Percakapan } from './components/screens/Percakapan';
import { TimAgen } from './components/screens/TimAgen';
import { BiayaKapasitas } from './components/screens/BiayaKapasitas';
import { JedaModal } from './components/modals/JedaModal';
import { CommandPalette } from './components/modals/CommandPalette';
import { KebijakanModal } from './components/modals/KebijakanModal';
import { 
  INITIAL_DECISION_ITEMS, 
  PIPELINE_CARDS, 
  CONVERSATIONS, 
  AGENT_NODES, 
  SYSTEM_SERVICES 
} from './data/mockData';
import { DecisionItem, PipelineCard } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [decisionItems, setDecisionItems] = useState<DecisionItem[]>(INITIAL_DECISION_ITEMS);
  const [pipelineCards, setPipelineCards] = useState<PipelineCard[]>(PIPELINE_CARDS);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [selectedContextId, setSelectedContextId] = useState<string | undefined>(undefined);

  // Modals state
  const [isJedaModalOpen, setIsJedaModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isKebijakanOpen, setIsKebijakanOpen] = useState<boolean>(false);

  // Approvals & Rejections
  const handleApprove = (id: string) => {
    setDecisionItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'disetujui',
              versionHistory: [
                ...item.versionHistory,
                {
                  version: item.version,
                  author: 'Irfan (Founder)',
                  timestamp: '07:48 WITA',
                  summary: `Disetujui untuk ${item.senderProfile} · hash ${item.versionHash}`,
                },
              ],
            }
          : item
      )
    );
  };

  const handleReject = (id: string, reason: string, scope: string, tags: string[]) => {
    setDecisionItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'ditolak',
              versionHistory: [
                ...item.versionHistory,
                {
                  version: `${item.version}-rev`,
                  author: 'Irfan (Founder)',
                  timestamp: '07:48 WITA',
                  summary: `Penolakan (${scope}): ${reason} [${tags.join(', ')}]`,
                },
              ],
            }
          : item
      )
    );
  };

  const handleNavigate = (tab: string, contextId?: string) => {
    setCurrentTab(tab);
    if (contextId) {
      setSelectedContextId(contextId);
    }
  };

  const waitingDecisionsCount = decisionItems.filter((i) => i.status === 'menunggu').length;
  const blockedPipelineCount = pipelineCards.filter((c) => c.status === 'terblokir' || c.status === 'revisi').length;
  const chatsActionCount = CONVERSATIONS.filter((c) => c.tab === 'butuh_kamu').length;

  return (
    <Shell
      currentTab={currentTab}
      onNavigate={handleNavigate}
      waitingDecisionsCount={waitingDecisionsCount}
      blockedPipelineCount={blockedPipelineCount}
      chatsActionCount={chatsActionCount}
      onOpenSearch={() => setIsSearchOpen(true)}
      onOpenKebijakan={() => setIsKebijakanOpen(true)}
    >
      {currentTab === 'home' && (
        <Home
          onNavigate={handleNavigate}
          waitingDecisionsCount={waitingDecisionsCount}
        />
      )}

      {currentTab === 'team-boarding' && (
        <TeamBoarding />
      )}

      {currentTab === 'keputusan' && (
        <Keputusan
          items={decisionItems}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {currentTab === 'pipeline' && (
        <Pipeline
          cards={pipelineCards}
          selectedCardId={selectedContextId}
        />
      )}

      {currentTab === 'percakapan' && (
        <Percakapan
          conversations={CONVERSATIONS}
          initialSelectedId={selectedContextId}
        />
      )}

      {currentTab === 'tim-agen' && (
        <TimAgen
          nodes={AGENT_NODES}
          services={SYSTEM_SERVICES}
        />
      )}

      {currentTab === 'biaya-kapasitas' && (
        <BiayaKapasitas />
      )}

      {/* Global Modals */}
      <JedaModal
        isOpen={isJedaModalOpen}
        onClose={() => setIsJedaModalOpen(false)}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
      />

      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      <KebijakanModal
        isOpen={isKebijakanOpen}
        onClose={() => setIsKebijakanOpen(false)}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
      />
    </Shell>
  );
}
