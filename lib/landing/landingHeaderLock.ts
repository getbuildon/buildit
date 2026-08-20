const LANDING_NAV_LOCK_EVENT = "buildon:landing-nav-lock"

let navLockUntil = 0

export function lockLandingHeader(ms = 1400) {
  navLockUntil = Date.now() + ms

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LANDING_NAV_LOCK_EVENT))
  }
}

export function isLandingHeaderLocked() {
  return Date.now() < navLockUntil
}

export { LANDING_NAV_LOCK_EVENT }
