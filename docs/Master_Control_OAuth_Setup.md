# Master Control OAuth Setup

This repository is not yet configured for authenticated HUD-to-Master-Control
calls. The previous `VITE_*` shared-secret transport has been removed from the
HUD; the client now fails explicitly rather than making a request until the
approved OAuth connector is configured. Do not add or reuse a privileged
secret in a `VITE_*` variable.

The owner reports that the current Apps Script deployment is a Web App, while
OAuth client configuration and Apps Script API enablement are not complete.
The tagged router has been imported into `engines/master-control/` and locally
updated to use Workspace-user authorization and server-side allowlists. The
local manifest restricts Web App access to domain users. These changes have
not been deployed. The HUD should use the Google Apps Script API with a user
OAuth token only after the script is configured and deployed as an API
executable.

## Google Cloud and Apps Script prerequisites

1. In the authorized Apps Script project, open **Project Settings** and
   associate it with a standard Google Cloud project. Record the project ID
   locally; do not commit deployment IDs or credentials.
2. In that same Cloud project, enable the Google Apps Script API.
3. Configure the OAuth consent screen for the intended Workspace users. Prefer
   an internal audience when all users belong to the same Workspace
   organization.
4. Create a Google OAuth **Web application** client. Add only the actual HUD
   origins used for development and production as authorized JavaScript
   origins. An OAuth client ID is public configuration; do not create or ship
   a client secret for a browser application.
5. Deploy the authorized Apps Script project as an **API executable**. The
   Apps Script API calling application and script must share the standard
   Cloud project, and the user access token must include the script's required
   OAuth scopes.
6. Review `appsscript.json` and the full source to determine the actual
   required scopes. Use the narrowest scope set that supports the approved
   workflows; Apps Script API execution may require the union of scopes used
   by the script project.
7. Add explicit server-side authorization inside the script for allowed
   Workspace users and each action. Do not treat a client-supplied email,
   `overrideAuth` flag, or OAuth client ID as proof of user authorization.

Google's setup and execution requirements are documented in the [Apps Script
API execution guide](https://developers.google.com/apps-script/api/how-tos/execute),
[Apps Script web app guide](https://developers.google.com/apps-script/guides/web),
and [Google Identity Services overview](https://developers.google.com/identity/gsi/web/guides/overview).

## Local router status and remaining OAuth work

The existing `/exec` Web App URL is not itself an OAuth-enabled API executable
contract. The HUD's `doPost`-style `action` requests cannot be assumed to work
through `scripts.run`. The local router now provides explicit callable
wrappers:

- `getHudState` returns JSON-safe HUD state for an authorized user.
- `updateKanban` reads deposit status from `Finances`, MSA from `Clients`, and
  SOW from `Projects`, then evaluates the phase gate under the mutation lock.

Server authorization uses `AUTHORIZED_USER_EMAILS`; exceptions and the police
audit use separate allowlists. Internal helper functions use the Apps Script
private-function suffix. Lead graduation is disabled pending idempotency and
side-effect review, and payment recording is explicitly unimplemented. The
HUD transport remains disabled until OAuth is configured.

The local gate and handler integration tests pass with mocked Apps Script
services. They do not validate the live sheet schema, deployed version,
Workspace authorization, or Apps Script API execution.

## HUD OAuth client requirements

- Keep only the public OAuth client ID and non-sensitive API configuration in
  browser variables.
- Request only the reviewed OAuth scopes and only when the user starts an
  authenticated action.
- Keep access tokens in memory; do not put them in URLs, logs, local storage,
  analytics, or crash reports.
- Handle token expiration, denied consent, and authorization errors
  explicitly. Never silently fall back to the old shared-secret request.
- Protect each backend function independently. Hiding a button or restricting
  the React interface is not authorization.

## Credentials and deployment hygiene

- Keep approved Drive, Oracle, MCC, and template identifiers in Apps Script
  **Script Properties**. The local source does not set production properties.
- Rotate any secret that has been pasted into a chat, ticket, or source file
  before relying on it for production authorization.
- Keep the actual `.clasp.json`, project IDs where restricted, OAuth tokens,
  and private credentials out of version control.
- Do not deploy the local helper or enable provisioning, email dispatch,
  scheduled triggers, or other mutations until the authorized source and
  deployment settings have been reviewed and tested.

## Verification checklist

- [x] Tagged `Central_Router.gs` is present locally; credentials and
  deployment-specific IDs were removed from active source.
- [x] Browser `VITE_*` shared-secret transport is removed; the HUD makes no
  unauthenticated fallback requests.
- [x] Stage-gate helper is wired to the local `updateKanban` handler and
  covered by local mocks.
- [ ] Standard Cloud project is linked to Apps Script and is shared with the
  OAuth client.
- [ ] Apps Script API is enabled and an API-executable deployment exists.
- [ ] OAuth consent, authorized origins, user audience, and script scopes are
  approved.
- [x] Local server-side actor authorization is tested for allowed and denied
  users.
- [x] Phase-gate tests and handler integration tests pass locally.
- [ ] Browser bundle contains no API secret or access token.
- [ ] Production mutations remain disabled until the owner authorizes the
  verified deployment.
