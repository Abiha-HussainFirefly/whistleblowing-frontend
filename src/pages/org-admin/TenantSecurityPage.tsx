import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactElement } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRightLeft, Check, Copy, KeyRound, LockKeyhole, Loader2, Shield, ShieldCheck } from 'lucide-react';
import { Loader } from '@components/common/Loader';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Dialog } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { PageTitle } from '@components/ui/page-title';
import { getApiErrorMessage } from '@lib/api-error';
import { mfaService, type MfaEnrollResult } from '@features/auth/api/mfa.service';
import { useAuthStore } from '@store/authStore';
import { toast } from '@store/toastStore';

const SECURITY_QUERY_KEY = ['security', 'mfa'] as const;
const CODE_LENGTH = 6;
type EnrollmentStep = 'idle' | 'setup' | 'recovery' | 'done';

export function TenantSecurityPage(): ReactElement {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [step, setStep] = useState<EnrollmentStep>('idle');
  const [enrollment, setEnrollment] = useState<MfaEnrollResult | null>(null);
  const [digits, setDigits] = useState<string[]>(emptyCode());
  const [codeError, setCodeError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showManualKey, setShowManualKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const status = useQuery({ queryKey: SECURITY_QUERY_KEY, queryFn: mfaService.getStatus, staleTime: 30_000 });

  const enroll = useMutation({
    mutationFn: mfaService.enroll,
    onSuccess: (data) => {
      setEnrollment(data);
      setDigits(emptyCode());
      setCodeError(null);
      setShowManualKey(false);
      setStep('setup');
    },
    onError: (error) => setCodeError(getApiErrorMessage(error)),
  });

  const verify = useMutation({
    mutationFn: () => mfaService.verifyEnrollment(digits.join('')),
    onSuccess: (data) => {
      setRecoveryCodes(data.recoveryCodes);
      updateUser({ mfaEnabled: true });
      void queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEY });
      setStep('recovery');
      setCodeError(null);
    },
    onError: (error) => {
      setCodeError(getApiErrorMessage(error));
      setDigits(emptyCode());
      inputRefs.current[0]?.focus();
    },
  });

  const disable = useMutation({
    mutationFn: () => mfaService.disable(disableCode.trim()),
    onSuccess: () => {
      setDisableOpen(false);
      setDisableCode('');
      updateUser({ mfaEnabled: false });
      void queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEY });
      toast.success('Multi-factor authentication disabled.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const resetEnrollment = (): void => {
    setStep('idle');
    setEnrollment(null);
    setDigits(emptyCode());
    setCodeError(null);
    setRecoveryCodes([]);
    setShowManualKey(false);
  };

  const copySecret = async (): Promise<void> => {
    if (!enrollment?.secret) return;
    await navigator.clipboard.writeText(enrollment.secret);
    setCopiedSecret(true);
    window.setTimeout(() => setCopiedSecret(false), 2000);
  };

  if (status.isLoading) return <Loader label="Loading MFA settings..." />;
  if (status.error && step === 'idle') return <div className="mx-auto max-w-3xl"><div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">{getApiErrorMessage(status.error)}</div><button type="button" onClick={() => void status.refetch()} className="mt-3 text-sm font-medium text-brand-primary hover:underline">Try again</button></div>;

  if (step === 'setup' && enrollment) {
    const allFilled = digits.every((digit) => digit.length === 1);
    return <EnrollmentFlow enrollment={enrollment} digits={digits} setDigits={setDigits} inputRefs={inputRefs} codeError={codeError} showManualKey={showManualKey} setShowManualKey={setShowManualKey} copiedSecret={copiedSecret} copySecret={() => void copySecret()} submitting={verify.isPending} onBack={resetEnrollment} onContinue={() => { if (allFilled) verify.mutate(); }} />;
  }

  if (step === 'recovery') return <RecoveryCodes codes={recoveryCodes} onDone={() => { setStep('done'); void status.refetch(); }} />;
  if (step === 'done') return <div className="mx-auto max-w-2xl rounded-lg border border-border bg-white p-6 shadow-sm"><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold text-foreground">Two-Factor Authentication Enabled</h2><p className="mt-1 text-sm text-muted-foreground">Your account is now protected with multi-factor authentication.</p><button type="button" onClick={resetEnrollment} className="mt-4 text-sm font-medium text-brand-primary hover:underline">Back to MFA settings</button></div></div></div>;

  return <div className="mx-auto max-w-3xl space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-accent text-white"><LockKeyhole className="h-4 w-4" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent"></p><PageTitle as="h1" className="mt-1 text-foreground">Security & MFA</PageTitle><p className="mt-1 text-sm text-muted-foreground">Protect access to this organization&apos;s Whistleblowing workspace.</p></div></div>
      <Badge variant={status.data?.enabled ? 'success' : 'warning'}>{status.data?.enabled ? 'MFA enabled' : 'MFA not enabled'}</Badge>
    </div>
    <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent"><Shield className="h-4 w-4" /></span><div><h3 className="font-semibold text-foreground">Multi-factor authentication</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Use an authenticator app as an additional sign-in step. Recovery codes can be used if the device is unavailable.</p></div></div>{status.data?.enabled ? <Button variant="outline" onClick={() => { setDisableCode(''); setDisableOpen(true); }}>Disable MFA</Button> : <Button onClick={() => { setCodeError(null); enroll.mutate(); }} disabled={enroll.isPending}>{enroll.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Preparing...</> : 'Set up MFA'}</Button>}</div>
      {codeError && step === 'idle' && <p role="alert" className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{codeError}</p>}
      <div className="grid gap-3 p-5 sm:grid-cols-3"><SecurityFact label="Status" value={status.data?.enabled ? 'Protected' : 'Not protected'} /><SecurityFact label="Enrolled" value={status.data?.enrolledAt ? new Date(status.data.enrolledAt).toLocaleDateString() : 'Not yet'} /><SecurityFact label="Recovery codes" value={String(status.data?.remainingRecoveryCodes ?? 0)} /></div>
    </section>
    <Dialog isOpen={disableOpen} onClose={() => { if (!disable.isPending) setDisableOpen(false); }} title="Disable MFA" size="sm" footer={<div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setDisableOpen(false)} disabled={disable.isPending}>Cancel</Button><Button variant="destructive" onClick={() => disable.mutate()} disabled={disable.isPending || disableCode.trim().length !== CODE_LENGTH}>{disable.isPending ? 'Disabling...' : 'Disable MFA'}</Button></div>}><div className="space-y-3"><p className="text-sm text-muted-foreground">Enter the current authenticator code to confirm this security change.</p><Input aria-label="Current MFA code" inputMode="numeric" maxLength={CODE_LENGTH} value={disableCode} onChange={(event) => setDisableCode(event.target.value.replace(/\D/g, ''))} placeholder="6-digit code" /></div></Dialog>
  </div>;
}

function EnrollmentFlow({ enrollment, digits, setDigits, inputRefs, codeError, showManualKey, setShowManualKey, copiedSecret, copySecret, submitting, onBack, onContinue }: { enrollment: MfaEnrollResult; digits: string[]; setDigits: React.Dispatch<React.SetStateAction<string[]>>; inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>; codeError: string | null; showManualKey: boolean; setShowManualKey: (value: boolean) => void; copiedSecret: boolean; copySecret: () => void; submitting: boolean; onBack: () => void; onContinue: () => void }): ReactElement {
  const allFilled = digits.every((digit) => digit.length === 1);
  return <div className="mx-auto max-w-4xl rounded-2xl border border-[#e5e1ee] bg-white px-6 py-7 shadow-sm sm:px-12 sm:py-10"><div className="flex items-center justify-between"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-lg font-medium text-foreground hover:text-brand-accent"><ArrowLeft className="h-5 w-5" />Back</button><button type="button" onClick={onBack} className="text-lg font-medium text-brand-accent hover:underline">Skip</button></div><div className="mx-auto mt-12 max-w-3xl"><h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Add authenticator app</h1><h2 className="mt-10 text-xl font-semibold text-foreground sm:text-2xl">Step 1: Scan this QR code</h2><p className="mt-3 text-lg leading-8 text-muted-foreground">Scan the following QR code with your authenticator app, such as Google Authenticator, Duo Mobile, Authy, etc.</p><div className="mt-8 flex justify-center"><div className="rounded-xl border border-border bg-white p-4">{enrollment.qrCodeDataUrl ? <img src={enrollment.qrCodeDataUrl} alt="MFA QR code" className="h-52 w-52" /> : <KeyRound className="h-52 w-52 p-12 text-brand-accent" />}</div></div><button type="button" onClick={() => setShowManualKey(!showManualKey)} className="mx-auto mt-5 block text-lg font-semibold text-brand-accent hover:underline">Can&apos;t scan the QR code?</button>{showManualKey && <div className="mt-4 flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-sm text-foreground">{enrollment.secret}</code><button type="button" onClick={copySecret} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" aria-label="Copy setup key">{copiedSecret ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button></div>}<div className="my-10 border-t border-border" /><h2 className="text-xl font-semibold text-foreground sm:text-2xl">Step 2: Enter the one-time code</h2><p className="mt-3 text-lg leading-8 text-muted-foreground">Enter the 6-digit verification code generated by the authenticator app.</p>{codeError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{codeError}</p>}<TotpInput digits={digits} setDigits={setDigits} inputRefs={inputRefs} disabled={submitting} hasError={codeError !== null} /><Button className="mt-7 h-14 w-full justify-center text-lg" disabled={!allFilled || submitting} onClick={onContinue}>{submitting ? <><Loader2 className="h-5 w-5 animate-spin" />Verifying...</> : 'Continue'}</Button><div className="my-10 border-t border-border" /><button type="button" onClick={() => setShowManualKey(true)} className="inline-flex items-center gap-3 text-lg font-medium text-brand-accent hover:underline"><ArrowRightLeft className="h-5 w-5" />Switch to another method</button></div></div>;
}

function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }): ReactElement {
  const copyAll = (): void => { void navigator.clipboard.writeText(codes.join('\n')); toast.success('Recovery codes copied.'); };
  return <div className="mx-auto max-w-2xl rounded-lg border border-border bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-foreground">Step 3: Save Recovery Codes</h2><p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Save these codes somewhere safe. You won&apos;t be able to see them again, and each code can only be used once.</p><div className="mt-6 grid grid-cols-2 gap-2">{codes.map((code) => <code key={code} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-center font-mono text-sm">{code}</code>)}</div><div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={copyAll}><Copy className="h-4 w-4" />Copy all</Button><Button onClick={onDone}>I&apos;ve saved my codes</Button></div></div>;
}

function TotpInput({ digits, setDigits, inputRefs, disabled, hasError }: { digits: string[]; setDigits: React.Dispatch<React.SetStateAction<string[]>>; inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>; disabled: boolean; hasError: boolean }): ReactElement {
  const focus = useCallback((index: number) => inputRefs.current[index]?.focus(), [inputRefs]);
  useEffect(() => { inputRefs.current[0]?.focus(); }, [inputRefs]);
  const update = (index: number, value: string): void => { if (!/^\d?$/.test(value)) return; setDigits((previous) => { const next = [...previous]; next[index] = value; if (value && index < CODE_LENGTH - 1) focus(index + 1); return next; }); };
  const paste = (event: ClipboardEvent<HTMLInputElement>): void => { event.preventDefault(); const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH); if (!pasted) return; setDigits(Array.from({ length: CODE_LENGTH }, (_, index) => pasted[index] ?? '')); focus(Math.min(pasted.length, CODE_LENGTH - 1)); };
  return <div className="mt-6 flex justify-center gap-2 sm:gap-4" role="group" aria-label="TOTP code">{digits.map((digit, index) => <input key={index} ref={(element) => { inputRefs.current[index] = element; }} value={digit} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={1} disabled={disabled} aria-label={`Digit ${index + 1}`} onChange={(event) => update(index, event.target.value)} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Backspace' && !digit && index > 0) focus(index - 1); }} onPaste={index === 0 ? paste : undefined} className={`h-14 w-12 rounded-lg border bg-white text-center text-2xl font-semibold text-brand-primary outline-none transition-all focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 sm:h-16 sm:w-14 ${hasError && !digit ? 'border-red-300' : 'border-slate-300'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`} />)}</div>;
}

function SecurityFact({ label, value }: { label: string; value: string }): ReactElement { return <div className="rounded-lg border border-border bg-white p-4"><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-sm font-semibold text-foreground">{value}</p></div>; }
function emptyCode(): string[] { return Array.from({ length: CODE_LENGTH }, () => ''); }
