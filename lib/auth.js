/**
 * Shared auth utility for BetProExchange
 * Works on the client side (browser only)
 */

/**
 * Read session from localStorage.
 * @returns {object|null} session object or null
 */
export function getSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Returns the JWT token from the session, or null.
 */
export function getToken() {
  return getSession()?.token ?? null;
}

/**
 * Clear the session from both localStorage and the cookie,
 * then redirect to /login.
 */
export function logout() {
  if (typeof window === 'undefined') return;

  // Clear localStorage
  localStorage.removeItem('user_session');

  // Expire the cookie immediately
  document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';

  window.location.href = '/login';
}
