# Secrets

Every token lives in the **personal** Bitwarden account and is read by the
scripts when they run. Nothing is written to disk: no `.env`, no token file.

## The entries

The scripts read the **password** field of these entries, by exact name
(`scripts/operations/secret-entries.ts`):

| Entry                    | Holds                                                                                                                                                                                                                                | Read by                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `Cloudflare Pages token` | A Cloudflare API token that deploys Workers despite its name: the _Edit Cloudflare Workers_ template on the account, plus on the `adrienlcp.com` zone _Zone · Workers Routes · Edit_ and _DNS · Edit_, which the custom domain needs | `secrets:sync` (it becomes the CI's `CLOUDFLARE_API_TOKEN`) |
| `Github PAT`             | A GitHub token allowed to write the secrets of `AdrienLcp/scoreboard` (fine-grained: _Secrets · Read and write_ on the repository)                                                                                                   | `secrets:sync`                                              |

## Set up the Bitwarden CLI — once per machine

Prerequisite: the CLI, `pnpm add -g @bitwarden/cli`, then `bw --version`.

### A machine where `bw` is logged in to another account

On a work machine the default `bw` profile belongs to the work account, and
other tools rely on it: leave it alone. The personal account gets a profile of
its own in `~/bitwarden-personal`, which the scripts pick up by themselves
whenever that folder exists.

In a new PowerShell terminal:

```powershell
New-Item -ItemType Directory -Force "$HOME\bitwarden-personal"
```

```powershell
$env:BITWARDENCLI_APPDATA_DIR = "$HOME\bitwarden-personal"
```

```powershell
bw config server https://vault.bitwarden.eu
```

(use the server that hosts the personal account: `https://vault.bitwarden.com`
for the US region, `https://vault.bitwarden.eu` for the EU one)

```powershell
bw login
```

Then close that terminal. Never set `BITWARDENCLI_APPDATA_DIR` for the whole
user account: every `bw` on the machine, the work tools' included, would then
read the personal vault.

Expected: `bw login` answers `You are logged in!`. Checking it later, from
any terminal:

```powershell
$env:BITWARDENCLI_APPDATA_DIR = "$HOME\bitwarden-personal"; bw status
```

prints `"status":"locked"` or `"unlocked"` with the personal email.

### A machine with the personal account only

Nothing more: `bw config server …` and `bw login` in the default profile, as
above without the folder and the variable. With no `~/bitwarden-personal`
folder, the scripts use the default profile.

## Unlocking

Each script asks for the master password when the vault is locked, and keeps
the session for that run only. To type it once for several commands in a
row, unlock in the terminal that runs them:

```powershell
$env:BITWARDENCLI_APPDATA_DIR = "$HOME\bitwarden-personal"; $env:BW_SESSION = bw unlock --raw
```

That terminal's `bw` now speaks to the personal vault, unlocked. Close it when
done, or run `Remove-Item Env:BW_SESSION, Env:BITWARDENCLI_APPDATA_DIR`.
On a machine with the personal account only, drop the first assignment.

## Set the CI secrets

The `deploy` job of `.github/workflows/ci.yml` reads two repository secrets,
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. Without them its
`wrangler deploy` step fails; it is not skipped.

Prerequisites: the Bitwarden setup above; the entries `Github PAT` and
`Cloudflare Pages token`.

```powershell
pnpm secrets:sync
```

Expected: `CLOUDFLARE_ACCOUNT_ID set`, `CLOUDFLARE_API_TOKEN set`, then the
list of the repository's secrets with today's date beside both.

## Worker secrets

The Worker reads three secrets to call the FFTT's Smartping API:
`SMARTPING_APP_ID`, `SMARTPING_PASSWORD` and `SMARTPING_SERIAL`. Without all
three, every lookup in the federation's clubs, players and teams answers that
it is not configured. They are in no vault: they exist only as secrets of the
deployed Worker, which Cloudflare never shows again. To get them back:

- `SMARTPING_APP_ID` and `SMARTPING_PASSWORD` are issued by the FFTT with the
  Smartping key, the password by mail; ask the FFTT again.
- `SMARTPING_SERIAL` is drawn and registered with the FFTT by the script
  below, which reads the other two from `apps/worker/.dev.vars` (copied from
  `.dev.vars.example`):

  ```powershell
  pnpm --filter @scoreboard/worker smartping:init
  ```

  Expected: `Serial registered: <serial>`, then the line to add to
  `.dev.vars` and the three commands that set the secrets.

To set them on the Worker, unlock first (_Unlocking_), then in that terminal:

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = "431a529079f2d76802b95056e39950f0"; $env:CLOUDFLARE_API_TOKEN = bw get password "Cloudflare Pages token"
```

```powershell
pnpm --filter @scoreboard/worker exec wrangler secret put SMARTPING_APP_ID
```

and the same for `SMARTPING_PASSWORD` and `SMARTPING_SERIAL`; each asks for
its value. Expected: `Success! Uploaded secret <NAME>`. Close the terminal
afterwards: it holds the token. `SMARTPING_FAKE` never goes on the Worker: it
is for `.dev.vars` only.

## Renew a token

1. Create the new token on the provider, with the permissions in the table
   above (Cloudflare: _My Profile → API Tokens_; GitHub: _Settings →
   Developer settings → Personal access tokens_).
2. Paste it as the password of its Bitwarden entry, replacing the old one.
3. For `Cloudflare Pages token`: `pnpm secrets:sync`, so the CI deploys with
   it. `Github PAT` is read at each run and needs nothing more.
4. Revoke the old token on the provider.
5. Prove it: `pnpm ship` with a commit to ship, or re-run the last CI run
   (`gh run rerun <id>`).

## Common errors

| Message                                                                         | Meaning and fix                                                                                                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Bitwarden is logged out (…)`                                                   | The profile named in the message has never logged in, or was logged out: `bw login` in it, as in the setup above.                                                               |
| `Bitwarden did not unlock: wrong master password?`                              | Retry; the master password is the personal account's.                                                                                                                           |
| `Bitwarden is locked … no terminal to ask the master password`                  | The script ran without a terminal (from another tool): unlock first and set `BW_SESSION`, as in _Unlocking_.                                                                    |
| `no Bitwarden entry named "…"`                                                  | The entry is missing, renamed, or its password is empty in the profile the message names. The script already ran `bw sync`. Fix the entry name in Bitwarden to match the table. |
| `the Bitwarden CLI did not answer`                                              | `bw` is not installed or not on the `PATH`: `pnpm add -g @bitwarden/cli`.                                                                                                       |
| `Bitwarden: reading … from the default Bitwarden CLI profile` on a work machine | `~/bitwarden-personal` does not exist, so the work account was asked: stop, and do the setup above.                                                                             |
| `could not set CLOUDFLARE_…`                                                    | The `Github PAT` token expired or lacks _Secrets · Read and write_ on the repository: renew it.                                                                                 |
