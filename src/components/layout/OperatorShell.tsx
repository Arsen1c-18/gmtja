import React from 'react';
import { Sidebar, type SectionId } from './Sidebar';
import { Topbar } from './Topbar';
import { SourceStrip } from './SourceStrip';
import { Footer } from './Footer';

export interface OperatorShellProps {
  currentSection: SectionId;
  onSelectSection: (section: SectionId) => void;
  day: string;
  onSelectDay: (day: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  hasError: boolean;
  isConnected: boolean;
  children: React.ReactNode;
}

export function OperatorShell({
  currentSection,
  onSelectSection,
  day,
  onSelectDay,
  onRefresh,
  isLoading,
  hasError,
  isConnected,
  children,
}: OperatorShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      {/* Desktop & Mobile Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={onSelectSection}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        isConnected={isConnected}
        hasError={hasError}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 bg-ink-50/20">
        <Topbar
          day={day}
          onSelectDay={onSelectDay}
          onRefresh={onRefresh}
          isLoading={isLoading}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <SourceStrip />

        {/* Only the content pane scrolls; the sidebar and top chrome stay pinned. */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
            <Footer />
          </main>
        </div>
      </div>
    </div>
  );
}
