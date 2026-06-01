# Graph Report - src  (2026-05-30)

## Corpus Check
- Corpus is ~2,997 words - fits in a single context window. You may not need a graph.

## Summary
- 84 nodes · 172 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Google Sign-In UI|Google Sign-In UI]]
- [[_COMMUNITY_Server Env & Admin Firebase|Server Env & Admin Firebase]]
- [[_COMMUNITY_Home Session Handling|Home Session Handling]]
- [[_COMMUNITY_Role-Based Access Control|Role-Based Access Control]]
- [[_COMMUNITY_Session Deletion & Client Auth|Session Deletion & Client Auth]]
- [[_COMMUNITY_Session Schema & Normalization|Session Schema & Normalization]]
- [[_COMMUNITY_App Layout|App Layout]]

## God Nodes (most connected - your core abstractions)
1. `getSafeRedirectPath()` - 10 edges
2. `canAccessProtectedArea()` - 6 edges
3. `SessionVerificationError` - 6 edges
4. `verifyCurrentSession()` - 6 edges
5. `hasAllowedEmailDomain()` - 6 edges
6. `isFirebaseClientConfigured()` - 6 edges
7. `toAppSession()` - 5 edges
8. `getCurrentUser()` - 5 edges
9. `getProtectedRouteRedirectUrl()` - 5 edges
10. `requireRole()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `middleware()` --calls--> `getProtectedRouteRedirectUrl()`  [EXTRACTED]
  middleware.ts → features/auth/server/protected-route.ts
- `Home()` --calls--> `hasAllowedEmailDomain()`  [EXTRACTED]
  app/page.tsx → lib/config/firebase-project.ts
- `OpportunitiesPage()` --calls--> `requireRole()`  [EXTRACTED]
  app/opportunities/page.tsx → features/auth/server/require-role.ts
- `SignInPage()` --calls--> `getSafeRedirectPath()`  [EXTRACTED]
  app/sign-in/page.tsx → lib/config/firebase-project.ts
- `GoogleSignInButton()` --calls--> `isFirebaseClientConfigured()`  [EXTRACTED]
  features/auth/components/google-sign-in-button.tsx → lib/firebase/client-app.ts

## Communities (8 total, 1 thin omitted)

### Community 0 - "Google Sign-In UI"
Cohesion: 0.21
Nodes (10): GoogleSignInButton(), GoogleSignInButtonProps, getAllowedEmailDomains(), getSafeRedirectPath(), hasAllowedEmailDomain(), getProtectedRouteRedirectUrl(), SignInPage(), SignInPageProps (+2 more)

### Community 1 - "Server Env & Admin Firebase"
Cohesion: 0.23
Nodes (11): env, envSchema, getAdminPrivateKey(), getServerEnv(), getAdminApp(), getAdminAuth(), createSessionDeletionResponse(), createSessionResponse() (+3 more)

### Community 2 - "Home Session Handling"
Cohesion: 0.29
Nodes (6): getHomeSession(), Home(), getCurrentUser(), SessionVerificationError, verifyCurrentSession(), VerifySessionCookie

### Community 3 - "Role-Based Access Control"
Cohesion: 0.26
Nodes (9): SignOutButton(), OpportunitiesPage(), AppSession, AccessSession, canAccessProtectedArea(), hasRequiredRole(), requireRole(), RequireRoleOptions (+1 more)

### Community 4 - "Session Deletion & Client Auth"
Cohesion: 0.38
Nodes (6): deleteServerSession(), getClientEnv(), getClientApp(), getClientAuth(), getGoogleProvider(), isFirebaseClientConfigured()

### Community 5 - "Session Schema & Normalization"
Cohesion: 0.43
Nodes (4): normalizeRoles(), SessionClaims, sessionSchema, toAppSession()

## Knowledge Gaps
- **11 isolated node(s):** `config`, `metadata`, `SignInPageProps`, `GoogleSignInButtonProps`, `sessionSchema` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSafeRedirectPath()` connect `Google Sign-In UI` to `Home Session Handling`, `Role-Based Access Control`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `getAdminAuth()` connect `Server Env & Admin Firebase` to `Home Session Handling`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `hasAllowedEmailDomain()` connect `Google Sign-In UI` to `Home Session Handling`, `Role-Based Access Control`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `config`, `metadata`, `SignInPageProps` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._