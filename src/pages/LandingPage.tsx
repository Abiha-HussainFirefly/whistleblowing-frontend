import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardCheck,
  KeyRound,
  MessagesSquare,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { BrandLogo } from '@components/common/BrandLogo';
import { ROUTES } from '@config/routes';
import type { ReactElement, ReactNode } from 'react';

/**
 * Public entry page.
 *
 * Positioning matters here as much as visual style: Tellara is sold as a
 * protected speak-up channel with structured review — NOT as a complaint
 * -management system (manual §02). Nothing on this page implies guilt, promises
 * absolute anonymity, or frames the reporter as adversarial to their employer.
 */
export function LandingPage(): ReactElement {
  const loggedIn = Boolean(localStorage.getItem('wb.internalToken'));
  const destination = loggedIn ? ROUTES.WHISTLEBLOWING : ROUTES.AUTH.LOGIN;

  const slug =
    (typeof localStorage === 'undefined' ? null : localStorage.getItem('wb.organizationSlug')) ??
    (import.meta.env.VITE_WB_ORGANIZATION_SLUG as string | undefined) ??
    '';
  const raiseConcernPath = slug.length > 0 ? ROUTES.REPORT.PORTAL(slug) : ROUTES.REPORT.TRACK;

  return (
    <div className="min-h-screen bg-ink text-porcelain">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
        <Link to={ROUTES.ROOT} aria-label="Tellara">
          <BrandLogo white className="h-10 w-auto" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-porcelain/60 md:flex">
          <a href="#how" className="inline-flex min-h-11 items-center rounded-md px-1 transition-colors hover:text-porcelain">
            How it works
          </a>
          <a href="#protection" className="inline-flex min-h-11 items-center rounded-md px-1 transition-colors hover:text-porcelain">
            Protection
          </a>
          <a href="#governance" className="inline-flex min-h-11 items-center rounded-md px-1 transition-colors hover:text-porcelain">
            Governance
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="onDark" size="sm">
            <Link to={destination}>{loggedIn ? 'Go to workspace' : 'Sign in'}</Link>
          </Button>
        </div>
      </header>

      {/* -------------------------------------------------- hero */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 55% 50% at 18% 20%, hsl(281 45% 34% / 0.5), transparent 62%),' +
              'radial-gradient(ellipse 50% 45% at 84% 72%, hsl(251 63% 59% / 0.25), transparent 65%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-porcelain/70">
            <span className="h-1.5 w-1.5 rounded-full bg-courage" aria-hidden="true" />
            Protected reporting · accountable action
          </span>

          <h1 className="type-display mt-7 text-porcelain md:text-[3.5rem] md:leading-[1.08]">
            Speak safely. <span className="text-signal-soft">Stay heard.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-porcelain/65">
            An independent channel for raising concerns about misconduct — with structured review,
            fair investigation and a traceable response. You can report without providing your
            identity, and return to your case whenever you need to.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to={raiseConcernPath}>
                Raise a concern
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="onDark" size="lg">
              <Link to={ROUTES.REPORT.TRACK}>
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Track my case
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-porcelain/45">
            Raising a concern does not require an account.
          </p>
        </div>
      </section>

      {/* -------------------------------------------------- lifecycle */}
      <Section
        id="how"
        eyebrow="The lifecycle"
        title="Receive. Assess. Address. Conclude."
        lede="Every report follows the same documented path, so the outcome depends on the facts rather than on who the reporter happens to know."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LIFECYCLE.map(({ icon: Icon, step, title, body }) => (
            <article
              key={title}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-signal-soft">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-porcelain/40">{step}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-porcelain">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-porcelain/60">{body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------- protection */}
      <Section
        id="protection"
        eyebrow="Protection"
        title="You control what you reveal."
        lede="Your private case credentials let you return, add information and receive updates without using a personal account."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {PROTECTIONS.map(({ title, body }) => (
            <article key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-base font-semibold text-porcelain">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-porcelain/60">{body}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-porcelain/45">
          No system can promise absolute anonymity. Tellara is built so that you are never required
          to identify yourself, and so that what you do share stays separated from your case record
          — the Trust Centre sets out exactly what is and is not collected.
        </p>
      </Section>

      {/* -------------------------------------------------- governance */}
      <Section
        id="governance"
        eyebrow="Governance"
        title="A report is an allegation, not a finding."
        lede="Fair process protects the reporter, the person named in the report, and the organization. Tellara's workflow mirrors ISO 37002's principles of trust, impartiality and protection."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {GOVERNANCE.map(({ title, body }) => (
            <article key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-base font-semibold text-porcelain">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-porcelain/60">{body}</p>
            </article>
          ))}
        </div>
      </Section>

      <footer className="border-t border-white/10 px-6 py-10 text-xs text-porcelain/45">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <BrandLogo white iconOnly className="h-6 w-6" />
            <p>© {new Date().getFullYear()} Tellara. Protected reporting · accountable action.</p>
          </div>
          <Link to={ROUTES.AUTH.ADMIN_LOGIN} className="inline-flex min-h-11 items-center rounded-md transition-colors hover:text-porcelain">
            System administrator sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const LIFECYCLE: { icon: LucideIcon; step: string; title: string; body: string }[] = [
  {
    icon: MessagesSquare,
    step: '01',
    title: 'Receive',
    body: 'A concern is raised through the channel and acknowledged with a private case reference.',
  },
  {
    icon: Scale,
    step: '02',
    title: 'Assess',
    body: 'A case manager reviews scope and routing, and checks for conflicts of interest.',
  },
  {
    icon: ClipboardCheck,
    step: '03',
    title: 'Address',
    body: 'Evidence is gathered and the investigation proceeds against a documented method.',
  },
  {
    icon: ShieldCheck,
    step: '04',
    title: 'Conclude',
    body: 'The case reaches a documented conclusion, with an audit trail of every decision.',
  },
];

const PROTECTIONS = [
  {
    title: 'Report without identifying yourself',
    body: 'Identity is optional at every step. Nothing in the intake form requires a name, an email address or a staff account.',
  },
  {
    title: 'Two-way follow-up stays open',
    body: 'Anonymity should not mean silence after submission. Case managers can ask you questions, and you can answer, through a protected mailbox.',
  },
  {
    title: 'Retaliation is out of bounds',
    body: 'Retaliation against a person who raises a concern in good faith is prohibited, and is itself a reportable matter.',
  },
];

const GOVERNANCE = [
  {
    title: 'Conflict-aware routing',
    body: 'If a report involves someone who would normally handle it, it is routed to an independent reviewer instead.',
  },
  {
    title: 'Role-based access',
    body: 'Case content is visible only to the people assigned to it, and every access is recorded.',
  },
  {
    title: 'Complete audit trail',
    body: 'Status changes, assignments, evidence and messages are all timestamped and attributable.',
  },
];

function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  children: ReactNode;
}): ReactElement {
  return (
    <section id={id} className="border-t border-white/10 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-courage">{eyebrow}</p>
        <h2 className="type-h1 mt-3 text-porcelain">{title}</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-porcelain/60">{lede}</p>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
