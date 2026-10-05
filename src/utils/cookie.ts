/**
 * Cookie and Dual-Layer Storage Utility
 * Manages long-lived cookies (365 days) and synchronizes with localStorage
 * ensuring visitors are permanently remembered across sessions without needing a password.
 */

export function setCookie(name: string, value: string, days = 365): void {
  try {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value || '')}${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('Could not set cookie:', e);
  }
}

export function getCookie(name: string): string | null {
  try {
    const nameEQ = `${encodeURIComponent(name)}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
  } catch (e) {
    console.warn('Could not read cookie:', e);
  }
  return null;
}

export function deleteCookie(name: string): void {
  try {
    document.cookie = `${encodeURIComponent(name)}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
  } catch (e) {
    console.warn('Could not delete cookie:', e);
  }
}

/**
 * Unified persistent storage for visitor credentials (Email & Name)
 * Uses Cookie (365 days) + localStorage for 100% reliability
 */
export const VISITOR_COOKIE_EMAIL = 'visitor_buyer_email';
export const VISITOR_COOKIE_NAME = 'visitor_buyer_name';
export const VISITOR_DISMISSED_FLAG = 'visitor_email_dismissed';

export function getSavedVisitorEmail(): string {
  // 1. Check Cookie first
  const cookieEmail = getCookie(VISITOR_COOKIE_EMAIL);
  if (cookieEmail && cookieEmail.includes('@')) {
    // Sync to localStorage
    try {
      localStorage.setItem(VISITOR_COOKIE_EMAIL, cookieEmail);
    } catch {}
    return cookieEmail;
  }

  // 2. Fallback to localStorage
  try {
    const localEmail = localStorage.getItem(VISITOR_COOKIE_EMAIL);
    if (localEmail && localEmail.includes('@')) {
      // Sync back to Cookie
      setCookie(VISITOR_COOKIE_EMAIL, localEmail, 365);
      return localEmail;
    }
  } catch {}

  return '';
}

export function getSavedVisitorName(): string {
  const cookieName = getCookie(VISITOR_COOKIE_NAME);
  if (cookieName) return cookieName;

  try {
    const localName = localStorage.getItem(VISITOR_COOKIE_NAME);
    if (localName) {
      setCookie(VISITOR_COOKIE_NAME, localName, 365);
      return localName;
    }
  } catch {}

  return '';
}

export function saveVisitorInfo(email: string, name?: string): void {
  const cleanEmail = email.trim();
  const cleanName = (name || '').trim();

  if (cleanEmail) {
    setCookie(VISITOR_COOKIE_EMAIL, cleanEmail, 365);
    try {
      localStorage.setItem(VISITOR_COOKIE_EMAIL, cleanEmail);
    } catch {}
  }

  if (cleanName) {
    setCookie(VISITOR_COOKIE_NAME, cleanName, 365);
    try {
      localStorage.setItem(VISITOR_COOKIE_NAME, cleanName);
    } catch {}
  }

  // Clear dismissed flag if email is successfully set
  deleteCookie(VISITOR_DISMISSED_FLAG);
  try {
    localStorage.removeItem(VISITOR_DISMISSED_FLAG);
  } catch {}
}

export function clearVisitorInfo(): void {
  deleteCookie(VISITOR_COOKIE_EMAIL);
  deleteCookie(VISITOR_COOKIE_NAME);
  try {
    localStorage.removeItem(VISITOR_COOKIE_EMAIL);
    localStorage.removeItem(VISITOR_COOKIE_NAME);
  } catch {}
}

export function hasUserDismissedEmailPrompt(): boolean {
  return (
    getCookie(VISITOR_DISMISSED_FLAG) === 'true' ||
    Boolean(localStorage.getItem(VISITOR_DISMISSED_FLAG))
  );
}

export function markEmailPromptDismissed(): void {
  setCookie(VISITOR_DISMISSED_FLAG, 'true', 30);
  try {
    localStorage.setItem(VISITOR_DISMISSED_FLAG, 'true');
  } catch {}
}
