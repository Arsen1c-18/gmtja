import { useEffect, useMemo, useRef, useState } from 'react';
import { OperatorShell } from './components/layout/OperatorShell';
import type { SectionId } from './components/layout/Sidebar';
import { SectionHeader } from './components/ui/SectionHeader';
import { Alert } from './components/ui/Alert';
import { Spinner } from './components/ui/Spinner';
import { Button } from './components/ui/Button';
import { OverviewView } from './features/overview/OverviewView';
import { ExplorerView } from './features/explorer/ExplorerView';
import { AccuracyView } from './features/accuracy/AccuracyView';
import { ProcurementView } from './features/procurement/ProcurementView';
import { HistoryView } from './features/history/HistoryView';
import { getDay, getMonthlyAccuracy } from './services/api';
import type { DailyMetric, DayData } from './types';
import { mergeChartIntervals } from './utils/chartHelpers';
import { dateFmt, JANUARY_2026_DAYS } from './utils/formatters';

const SECTION_CONFIG: Record<
  SectionId,
  { title: string; eyebrow: string; description: string }
> = {
  overview: {
    eyebrow: 'Wind generation outlook',
    title: 'Market supply and outturn',
    description: 'A comprehensive operational view of forecast wind supply and the latest observed outturn.',
  },
  explorer: {
    eyebrow: 'Granular half-hourly targets',
    title: 'Forecast explorer',
    description: 'Inspect half-hourly generation records, compare publication revisions, and export settlement intervals.',
  },
  accuracy: {
    eyebrow: 'Statistical outturn metrics',
    title: 'Forecast accuracy',
    description: 'Measure forecast deviation, error distributions, and time-of-day accuracy against outturn generation.',
  },
  procurement: {
    eyebrow: 'Volume balancing scenario',
    title: 'Procurement intelligence',
    description: 'Model illustrative demand baselines to calculate net residual procurement requirements.',
  },
  history: {
    eyebrow: 'Sequential model runs',
    title: 'Forecast evolution',
    description: 'Track how WINDFOR forecast iterations progressed toward the 11:00 day-ahead gate and delivery.',
  },
};

export default function App() {
  const [section, setSection] = useState<SectionId>('overview');
  const [day, setDay] = useState('2026-01-15');
  const [data, setData] = useState<DayData | null>(null);
  const [selectedVersion, setSelectedVersion] = useState('cutoff');
  const [demand, setDemand] = useState(30000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Monthly metrics state for Accuracy view
  const [monthlyMetrics, setMonthlyMetrics] = useState<DailyMetric[] | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyRequested, setMonthlyRequested] = useState(false);
  const [monthlyError, setMonthlyError] = useState(false);

  const loadSequence = useRef(0);

  const loadData = async (forceRefresh = false) => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError('');

    try {
      const result = await getDay(day, forceRefresh);
      if (sequence === loadSequence.current) {
        setData(result);
        setSelectedVersion('cutoff');
      }
    } catch (err) {
      if (sequence === loadSequence.current) {
        setError(err instanceof Error ? err.message : 'Could not load Elexon records.');
      }
    } finally {
      if (sequence === loadSequence.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData(false);
  }, [day]);

  // Arrow key navigation between days
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' && (e.altKey || !e.shiftKey)) {
        const idx = JANUARY_2026_DAYS.indexOf(day);
        if (idx > 0) {
          e.preventDefault();
          setDay(JANUARY_2026_DAYS[idx - 1]);
        }
      } else if (e.key === 'ArrowRight' && (e.altKey || !e.shiftKey)) {
        const idx = JANUARY_2026_DAYS.indexOf(day);
        if (idx < JANUARY_2026_DAYS.length - 1) {
          e.preventDefault();
          setDay(JANUARY_2026_DAYS[idx + 1]);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [day]);

  // Lazy-load monthly accuracy on navigating to accuracy section
  useEffect(() => {
    if (section !== 'accuracy' || monthlyRequested) return;
    setMonthlyRequested(true);
    setMonthlyLoading(true);
    void getMonthlyAccuracy()
      .then((res) => setMonthlyMetrics(res.days))
      .catch(() => setMonthlyError(true))
      .finally(() => setMonthlyLoading(false));
  }, [section, monthlyRequested]);

  // Active forecast version resolution
  const cutoffVersion = useMemo(
    () => data?.versions.find((v) => v.publish_time === data.eligible_publish_time) ?? null,
    [data]
  );

  const activeVersion = useMemo(() => {
    if (!data) return null;
    if (selectedVersion === 'cutoff') return cutoffVersion;
    return data.versions.find((v) => v.publish_time === selectedVersion) ?? cutoffVersion;
  }, [data, selectedVersion, cutoffVersion]);

  // Combined chart interval records
  const chartData = useMemo(
    () => mergeChartIntervals(data?.intervals ?? [], activeVersion),
    [data, activeVersion]
  );

  const paired = chartData.filter((row) => row.forecast != null && row.actual != null);
  const dayForecastMWh = chartData.reduce(
    (sum, row) => sum + (row.forecast ?? 0) * 0.5,
    0
  );
  const totalShortfall = chartData.reduce(
    (sum, row) => sum + (row.forecast == null ? 0 : (demand - row.forecast) * 0.5),
    0
  );
  const errors = paired.map((row) => ({
    label: row.label,
    time: row.time,
    error: (row.forecast ?? 0) - (row.actual ?? 0),
    absError: Math.abs((row.forecast ?? 0) - (row.actual ?? 0)),
  }));

  const meta = SECTION_CONFIG[section];

  return (
    <OperatorShell
      currentSection={section}
      onSelectSection={setSection}
      day={day}
      onSelectDay={setDay}
      onRefresh={() => void loadData(true)}
      isLoading={loading}
      hasError={Boolean(error)}
      isConnected={Boolean(data)}
    >
      <div className="space-y-6">
        <SectionHeader
          eyebrow={meta.eyebrow}
          title={meta.title}
          description={meta.description}
        />

        {/* Global Error Banner */}
        {error && (
          <Alert
            tone="error"
            title="Elexon data could not be loaded"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadData(true)}
              >
                Retry
              </Button>
            }
          >
            <div>
              <p>{error}. No synthetic values have been substituted.</p>
              {error.toLowerCase().includes('network') && (
                <p className="mt-1.5 font-mono text-[11px] text-rose-900 bg-rose-100/60 rounded px-2 py-1">
                  Tip: Verify FastAPI backend on port 8000 (e.g. <code>npm run dev:api</code>)
                </p>
              )}
            </div>
          </Alert>
        )}

        {/* Loading Spinner State */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center rounded-md border border-ink-200/80 bg-white p-12 text-center shadow-xs">
            <Spinner size="lg" label="Retrieving delivery records from Elexon BMRS public API…" />
          </div>
        )}

        {/* Loaded Data Views */}
        {data && (
          <>
            {data.intervals.length === 0 && (
              <Alert tone="info">
                No valid settlement interval records were returned for{' '}
                {dateFmt.format(new Date(`${day}T12:00:00Z`))}.
              </Alert>
            )}

            {section === 'overview' && (
              <OverviewView
                data={data}
                chartData={chartData}
                day={day}
                dayForecastMWh={dayForecastMWh}
                demand={demand}
                shortfall={totalShortfall}
                onNavigate={setSection}
              />
            )}

            {section === 'explorer' && (
              <ExplorerView
                data={data}
                chartData={chartData}
                activeVersion={activeVersion}
                selectedVersion={selectedVersion}
                onSelectVersion={setSelectedVersion}
              />
            )}

            {section === 'accuracy' && (
              <AccuracyView
                data={data}
                errors={errors}
                chartData={chartData}
                monthlyMetrics={monthlyMetrics}
                monthlyLoading={monthlyLoading}
                monthlyError={monthlyError}
                onSelectDay={setDay}
              />
            )}

            {section === 'procurement' && (
              <ProcurementView
                data={data}
                chartData={chartData}
                demand={demand}
                setDemand={setDemand}
                totalShortfall={totalShortfall}
              />
            )}

            {section === 'history' && (
              <HistoryView
                data={data}
                selectedVersion={selectedVersion}
                onSelectVersion={setSelectedVersion}
              />
            )}
          </>
        )}
      </div>
    </OperatorShell>
  );
}
