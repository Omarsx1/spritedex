# Username and password: the identity stops living in the browser

## Objective
Give every user a portable credential (username + password) so the collection survives a
cleared browser, a new phone and a domain change, without a backend, without touching RLS,
without touching friend_requests, and without changing the SDEX code that friends already use.

## Problem and why
110 of 125 identities in user_collections are anonymous. Their credential is the session stored
in one browser localStorage, so anything that clears or changes that origin strands their
progress (measured case: a colleague with 214 sprites). The domain move to spritedex.gg is still
pending and would strand every anonymous identity permanently once a redirect exists.

## Decisions taken (with the user, 2026-10-02)
- Progressive claim: the one-click anonymous start stays; the account is requested once there is
  something worth protecting. Identity-first would kill conversion; always-optional would leave
  88% of identities fragile.
- The SDEX code stays the public handle for friends. The username is the credential and the
  display name; friend_requests and the codes already handed out are untouched.
- Recovery in v1 is manual by the admin. Supabase allows one email per user, and an automated
  reset without an email sender could not prove ownership of the recovery address, so the UI
  promises nothing automatic.

## Mechanics
- `auth.users.email` = `<username>@spritedex.gg` (synthetic, never shown, never replaced: if it
  were replaced by a real address the username login could no longer be derived).
- Signup: `signUp({ email: usuarioAEmail(usuario), password, options: { data: { username, email_contacto } } })`.
- Sign in: `signInWithPassword({ email: usuarioAEmail(usuario), password })`. No redirect, so no
  supabase.co ever appears in the address bar.
- Claim (anonymous to permanent): `updateUser({ email: usuarioAEmail(usuario), password, data: {...} })`
  on the existing anonymous session. Same user_id, so collection, friend_code and friendships are
  preserved with no SQL and no row copying.
- Username rules: 3-16 chars, [a-z0-9_], starts with a letter, lowercased, no `__`, must not end
  in `_`, reserved list (admin, spritedex, soporte, moderador, equipo, oficial, sistema, sdex,
  www, api, login, root, dev, test). Uniqueness comes from Supabase's case-insensitive email.
- Availability check: RPC `usuario_libre(text) returns boolean`, SECURITY DEFINER, returns only a
  boolean and never leaks an address.

## Delivery order (one commit and one verification each)
- Commit 1: pure module `src/utils/usuario.js` (normalizarUsuario, validarUsuario, usuarioAEmail,
  esCorreoSintetico) plus `tests/usuario.test.js`, and the username form in `AuthModal` for
  signup, sign-in and the anonymous claim, with Google and real email kept as secondary paths.
  i18n keys land here.
- Commit 2: progressive claim — persistent banner for anonymous users with progress, one-time
  modal when the threshold is crossed or on the first visit to /amigos, and the identity line in
  the user menu.
- Commit 3: `supabase/migrations/2026-10-02_usuario_libre.sql` (the availability RPC) and this
  document's operational sections.

## Acceptance
- After claiming, the user_id does not change and user_collections keeps the same sprites and the
  same friend_code (check in Supabase before and after).
- A user created with username + password can sign in from a different browser and see the
  collection.
- Signing in or claiming never shows a supabase.co URL.
- `npm test`, `npm run lint` and `npm run build` green. Nothing is proven end to end without a
  live session: there is no test that mounts the components.

## Supabase dashboard settings (admin action, not code)
- **Confirm email: OFF.** Mandatory: with the synthetic domain a confirmation step would leave the
  user stuck (undeliverable address) and the conversion would never complete. Accepted
  consequence: `signUp` hands a live session to ANY address, so someone could pre-register a real
  person's address before its owner does. That is a pre-registration vector, not merely a "login
  alias without data access".
- **Minimum password length: 8.**
- Keep the existing rate limits on signups.

## Password reset playbook (v1, manual)
1. The user writes in and says which username they lost access to and which contact email they
   registered (if any).
2. In Supabase, Authentication, look up `<usuario>@spritedex.gg` and confirm
   `raw_user_meta_data.email_contacto` matches what they gave.
3. Only if it matches, send a password reset to that contact address from the Auth UI (or set a
   temporary one and force a change). Never reset on the strength of the username alone.
4. Record the action in this document. The UI must never promise an automatic reset, because there
   is no email sender.

## Domain gate (repeat before every domain move)
Do not enable the redirect to spritedex.gg while this returns rows:

    select count(*) as invitados_con_progreso
    from user_collections c
    where c.user_state->'_profile'->>'is_anonymous' = 'true'
      and (select count(*) from jsonb_each(c.user_state) e
            where e.key <> '_profile' and (e.value->>'owned')::boolean) >= 5
      and c.updated_at > now() - interval '30 days';

Reminder: with _profile written only since 2026-08-27, older rows never appear in this query;
check them with the marcados query in the release notes before moving the domain.

## Assumptions
- No backend, no email sender, no custom domain in this version.
- Google and real email stay available as secondary paths; the seven existing accounts are not
  touched.
- Claim threshold: 5 sprites marked, or the first visit to /amigos while anonymous.
- The availability hint only appears when there is no session (after signing out), because in
  production the guest session always exists.
- When the browser blocks localStorage, the once-per-browser modal degrades to once-per-visit.
- The username becomes the display name (`_profile.name`); the admin panel hides `@spritedex.gg`
  addresses and shows the username instead.
