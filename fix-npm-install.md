# Fix for npm install EPERM + ERR_INVALID_ARG_TYPE

## Why this happens

1. **EPERM (operation not permitted)**  
   Something is locking files inside `node_modules` as npm writes them (Cursor’s file watcher, antivirus, or Windows indexing). npm then fails when it cleans or overwrites those files.

2. **ERR_INVALID_ARG_TYPE ("file" must be string, received undefined)**  
   After the failed cleanup, npm hits a code path with an undefined path. Both errors come from the same broken run.

---

## Fix 1: Use pnpm (recommended)

pnpm uses a different install strategy (store + symlinks) and usually avoids this EPERM/npm bug on Windows.

**Do this with Cursor fully closed** (so nothing locks the folder). Use **Command Prompt** or **PowerShell**:

```bash
cd C:\Dashboard\ticketly_dashboard
npx --yes rimraf node_modules package-lock.json
corepack enable
pnpm install
```

Then reopen the project in Cursor. Use `pnpm dev`, `pnpm build`, etc. instead of `npm run dev`, `npm run build`.

---

## Fix 2: Use npm with Cursor closed

If you prefer to keep using npm:

1. **Quit Cursor completely** (not just the terminal).
2. Open **Command Prompt** or **PowerShell** (optionally “Run as administrator” if you still get EPERM).
3. Run:

```bash
cd C:\Dashboard\ticketly_dashboard
npx --yes rimraf node_modules package-lock.json
npm cache clean --force
npm install
```

4. Reopen the project in Cursor.

---

## If EPERM still happens

- **Antivirus / Windows Defender**  
  Add an exclusion for `C:\Dashboard\ticketly_dashboard` (or at least `...\ticketly_dashboard\node_modules`) in real-time scanning.

- **This repo’s settings**  
  `.vscode/settings.json` is set to exclude `node_modules` and `.next` from the file watcher so the editor is less likely to lock those files. Reload the window after the first successful install.
