import { useCallback } from 'react';
import Shepherd, {
  type StepOptions,
  type StepOptionsButton,
  type Tour,
  type TourOptions,
} from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import './shepherd-custom.css';
import i18n from '@/i18n';

// Shared button chrome — mirrors the driver.js module tours so Back/Next look
// identical across every tour in the app.
const PRIMARY_BTN =
  'rounded-md bg-teal-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors';
const SECONDARY_BTN =
  'rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface StepDef {
  id: string;
  wizardStep: number;
  attachTo?: { element: string; on: Placement };
  first?: boolean;
  last?: boolean;
}

interface UseReportTourOptions {
  onStepChange?: (step: number) => void;
}

/** Step order + spotlight targets. Copy lives in the `tours` i18n namespace
 * (`reportConcern.<id>.title` / `.text`) and is resolved per language. */
const STEP_DEFS: StepDef[] = [
  { id: 'welcome', wizardStep: 0, first: true },
  { id: 'category', wizardStep: 0, attachTo: { element: '[data-tour="category"]', on: 'bottom' } },
  {
    id: 'description',
    wizardStep: 0,
    attachTo: { element: '[data-tour="description"]', on: 'bottom' },
  },
  { id: 'location', wizardStep: 1, attachTo: { element: '[data-tour="location"]', on: 'bottom' } },
  {
    id: 'relationship',
    wizardStep: 2,
    attachTo: { element: '[data-tour="relationship"]', on: 'bottom' },
  },
  { id: 'involved', wizardStep: 2, attachTo: { element: '[data-tour="involved"]', on: 'bottom' } },
  { id: 'dates', wizardStep: 2, attachTo: { element: '[data-tour="dates"]', on: 'top' } },
  {
    id: 'anonymous',
    wizardStep: 3,
    attachTo: { element: '[data-tour="anonymous"]', on: 'bottom' },
  },
  {
    id: 'conflict',
    wizardStep: 3,
    attachTo: { element: '[data-tour="conflict"]', on: 'bottom' },
  },
  {
    id: 'submit',
    wizardStep: 4,
    attachTo: { element: '[data-tour="submit"]', on: 'top' },
    last: true,
  },
];

const tourOptions: TourOptions = {
  useModalOverlay: true,
  defaultStepOptions: {
    cancelIcon: { enabled: true },
    classes: 'shepherd-custom',
    modalOverlayOpeningRadius: 8,
    modalOverlayOpeningPadding: 6,
  },
};

/** Build a fresh, fully-localized tour in the user's active language. */
function buildTour(options: UseReportTourOptions): Tour {
  const tt = (key: string): string => i18n.t(key, { ns: 'tours' });
  const tour = new Shepherd.Tour(tourOptions);

  for (const def of STEP_DEFS) {
    const back: StepOptionsButton = {
      text: def.first === true ? tt('nav.skip') : tt('nav.back'),
      action(this: Tour) {
        if (def.first === true) {
          this.complete();
        } else {
          this.back();
        }
      },
      classes: SECONDARY_BTN,
    };
    const forward: StepOptionsButton = {
      text: def.last === true ? tt('nav.done') : tt('nav.next'),
      action(this: Tour) {
        if (def.last === true) {
          this.complete();
        } else {
          this.next();
        }
      },
      classes: PRIMARY_BTN,
    };

    const step: StepOptions = {
      id: def.id,
      title: tt(`reportConcern.${def.id}.title`),
      text: tt(`reportConcern.${def.id}.text`),
      buttons: [back, forward],
      beforeShowPromise: () =>
        new Promise<void>((resolve) => {
          options.onStepChange?.(def.wizardStep);
          window.setTimeout(resolve, 120);
        }),
      ...(def.attachTo === undefined
        ? { modalOverlayOpeningPadding: 0 }
        : { attachTo: def.attachTo, scrollTo: { behavior: 'smooth', block: 'center' } }),
    };
    tour.addStep(step);
  }

  return tour;
}

export function useReportTour({ onStepChange }: UseReportTourOptions = {}): {
  startTour: () => void;
} {
  const startTour = useCallback(() => {
    void buildTour(onStepChange === undefined ? {} : { onStepChange }).start();
  }, [onStepChange]);

  return { startTour };
}
