from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    # FIX: there was no rate limiting anywhere in the project - /token/
    # (login) accepted unlimited password attempts per second from a single
    # IP, which is a straightforward brute-force / credential-stuffing gap.
    # Keyed by IP (AnonRateThrottle's default), independent of username, so
    # rotating usernames against one IP doesn't bypass it.
    scope = 'login'
    rate = '5/min'


class RegisterRateThrottle(AnonRateThrottle):
    # Same gap on /register/ - nothing stopped scripted mass account creation.
    scope = 'register'
    rate = '5/min'
