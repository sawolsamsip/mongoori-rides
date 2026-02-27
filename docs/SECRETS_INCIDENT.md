# Secrets Exposed in Git History – What to Do

## What happened

- `server/.env` (and possibly `client/.env`) was committed in past commits, so **secrets exist in git history**.
- Anyone who clones the repo (or has cloned it) can see them with `git log -p -- server/.env`.

## Do NOT delete the whole project or repo

You do **not** need to delete the repo or “전체 삭제 후 재배포.” You only need to:

1. **Rotate (replace) every exposed secret**
2. **Remove .env from git history** (optional but recommended)
3. **Redeploy** with the new env vars

---

## Step 1: Rotate every exposed secret

Assume **every key that ever appeared in any .env in history is compromised**. Replace every one.

| Secret | Where to rotate |
|--------|-----------------|
| **MongoDB** | Atlas: Database → Access → Edit user → New password. Update `MONGODB_URI` with the new password. |
| **JWT_SECRET** | Generate a new long random string (e.g. `openssl rand -base64 32`). Set new `JWT_SECRET` everywhere. All users will need to log in again. |
| **ImageKit** | ImageKit dashboard → API Keys → Regenerate private key. Update `IMAGEKIT_PRIVATE_KEY` (and public/endpoint if they changed). |
| **Stripe** | Stripe Dashboard → Developers → API keys → Roll keys. Update `STRIPE_SECRET_KEY` (and publishable if you rolled it). |
| **Tesla / Fleet** | If ever in .env: regenerate or revoke and create new tokens; update env. |
| **Any other keys** in `.env` or `.env.example` | Regenerate or change password and update env. |

Use the **new values only** in your deployment (e.g. Coolify, Vercel) and locally. Do not commit the new `.env` files.

---

## Step 2: Remove .env from git history (recommended)

This rewrites history so that `server/.env` and `client/.env` (and their contents) are no longer in any commit. After that, force-push.

**Option A – BFG Repo-Cleaner (simplest)**

```bash
# Install BFG (e.g. Homebrew)
brew install bfg

cd /path/to/mongoori-rides
git clone --mirror . .git-backup   # optional backup

# Remove these files from all commits
bfg --delete-files .env
bfg --delete-files server/.env
bfg --delete-files client/.env

git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

**Option B – git filter-repo (if you prefer)**

```bash
# Install git-filter-repo (e.g. pip install git-filter-repo)
git filter-repo --path server/.env --invert-paths
git filter-repo --path client/.env --invert-paths
git push --force
```

**Important**

- Everyone who has cloned the repo will need to **re-clone** or do a fresh clone; their old history will not match.
- If the repo is on GitHub, after force-push the old commits (with secrets) will no longer be on the default branch; they can still exist in forks or clones until those are updated.

---

## Step 3: Redeploy

- Update **all** env vars in your deployment (Coolify, Vercel, etc.) with the **new** rotated values.
- Redeploy the app. No need to delete the app or the repo; just redeploy with the new env.

---

## Step 4: Keep .env out of git from now on

- `.gitignore` already has `.env`, `server/.env`, `client/.env`. Do not remove them.
- Never run `git add .env` or `git add server/.env` (or `-f` to force add).
- Use only `.env.example` (with placeholder values) for documentation.

---

## Summary

| Question | Answer |
|----------|--------|
| Delete repo and re-create? | **No.** Rotate secrets and optionally clean history. |
| Delete app and redeploy from zero? | **No.** Just set new env vars and redeploy. |
| Do we need to rotate secrets? | **Yes.** Treat every exposed key as compromised. |
| Do we need to clean git history? | **Recommended.** So future clones don’t see old secrets. |

After rotating secrets, cleaning history (if you do it), and redeploying with new env, the “someone cloned and has .env and secrets” issue is addressed by making those old secrets useless and, if you clean history, removing them from the repo.
