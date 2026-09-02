import { useCallback } from 'react';
import Shepherd, {
  type StepOptions,
  type StepOptionsButton,
  type Tour,
  type TourOptions,
} from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import '@features/whistleblowing/hooks/shepherd-custom.css';

const PRIMARY_BUTTON =
  'rounded-md bg-brand-accent px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-accent/90';
const SECONDARY_BUTTON =
  'rounded-md border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60';

interface TourStep {
  id: string;
  title: string;
  text: string;
  attachTo?: { element: string; on: 'top' | 'bottom' | 'left' | 'right' };
  first?: boolean;
  last?: boolean;
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '👋 Managing your team',
    text: 'Every member\'s access comes down to three things: which Portal they log into, their Role, and the Region they work in. This quick tour shows where each lives.',
    first: true,
  },
  {
    id: 'tabs',
    title: '🗂️ Members vs Invitations',
    text: 'Members are people already in your organization. Invitations are pending email invites that have not been accepted yet.',
    attachTo: { element: '[data-tour="members-tabs"]', on: 'bottom' },
  },
  {
    id: 'access',
    title: '🔐 Portal, role, and region',
    text: 'Use the access guidance above when deciding what to assign. Portal selects the kind of work, role grants the relevant permissions, and region limits the data a member can access.',
    attachTo: { element: '[data-tour="members-actions"]', on: 'bottom' },
  },
  {
    id: 'invite',
    title: '✉️ Invite someone',
    text: 'Open Invitations to send an invite. Choose the Portal, Role, and Region that match the person\'s responsibilities. You can change a member\'s status or region later from Edit.',
    attachTo: { element: '[data-tour="members-invite"]', on: 'bottom' },
  },
  {
    id: 'done',
    title: '✅ That\'s it',
    text: 'Keep access least-privileged and review it when responsibilities change. Use How team access works for the full set of guidelines.',
    last: true,
  },
];

const TOUR_OPTIONS: TourOptions = {
  useModalOverlay: true,
  defaultStepOptions: {
    cancelIcon: { enabled: true },
    classes: 'shepherd-custom',
    modalOverlayOpeningRadius: 8,
    modalOverlayOpeningPadding: 6,
  },
};

function buildTour(): Tour {
  const tour = new Shepherd.Tour(TOUR_OPTIONS);

  for (const step of STEPS) {
    const back: StepOptionsButton = {
      text: step.first === true ? 'Skip tour' : 'Back',
      action(this: Tour) {
        if (step.first === true) {
          this.complete();
        } else {
          this.back();
        }
      },
      classes: SECONDARY_BUTTON,
    };
    const forward: StepOptionsButton = {
      text: step.last === true ? 'Done' : 'Next',
      action(this: Tour) {
        if (step.last === true) {
          this.complete();
        } else {
          this.next();
        }
      },
      classes: PRIMARY_BUTTON,
    };

    const options: StepOptions = {
      id: step.id,
      title: step.title,
      text: step.text,
      buttons: [back, forward],
      ...(step.attachTo === undefined
        ? { modalOverlayOpeningPadding: 0 }
        : { attachTo: step.attachTo, scrollTo: { behavior: 'smooth', block: 'center' } }),
    };
    tour.addStep(options);
  }

  return tour;
}

export function useTeamMembersTour(): { startTour: () => void } {
  const startTour = useCallback(() => {
    void buildTour().start();
  }, []);

  return { startTour };
}
