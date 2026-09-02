const POST_LOGIN_WELCOME_KEY = 'tellara.post-login-welcome';

/** Mark the next authenticated shell mount as an interactive sign-in. */
export function markPostLoginWelcome(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(POST_LOGIN_WELCOME_KEY, '1');
  }
}

/** Consume the one-time sign-in marker so refreshes do not replay the screen. */
export function consumePostLoginWelcome(): boolean {
  if (typeof window === 'undefined') return false;
  const shouldShow = window.sessionStorage.getItem(POST_LOGIN_WELCOME_KEY) === '1';
  if (shouldShow) window.sessionStorage.removeItem(POST_LOGIN_WELCOME_KEY);
  return shouldShow;
}
