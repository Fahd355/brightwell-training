# BrightWell Training — setup guide

A login-protected e-learning site: 6 modules. Each section has a video, then an assessment and/or an assignment. Trainees also get a Reference tab, a Q&A board, live sessions (Google Meet links) and notifications for trainer feedback. Progress is saved per trainee in Supabase. The site itself is hosted free on GitHub Pages.

Files in this folder:
- `index.html`, `app.js`, `styles.css`, `logo.svg` — the website (don't need editing)
- `config.js` — your settings (Supabase key, pass mark, etc.)
- `content.js` — modules, sections, tasks and quiz questions (edit to change content)
- `supabase-setup.sql` — run once in Supabase

Until you paste a Supabase key into `config.js`, the site runs in **demo mode** (any login works, progress stays in the browser).

---

## Part A — Supabase (database + logins + videos)

You already have the project `hkazorugtrnqppxyeatj`.

1. **Create the tables.** Supabase → **SQL Editor** → **New query** → paste all of `supabase-setup.sql` → **Run**. You should see "Success. No rows returned".
2. **Copy your key.** **Project Settings → API Keys** → copy the **anon public** key (or the **publishable** key, starts `sb_publishable_`). Open `config.js` and replace `PASTE_YOUR_ANON_KEY_HERE` with it. Never use the `service_role` / secret key.
3. **Stop public sign-ups.** **Authentication → Sign In / Providers** → turn **off** "Allow new users to sign up" → Save. Keep the Email provider enabled.
4. **Create logins.** **Authentication → Users → Add user → Create new user**
   - Email: `username@brightwell.training` (e.g. `sara@brightwell.training` → she signs in with **sara**)
   - Password: a temporary password
   - Tick **Auto Confirm User** → **Create user**
   - Trainees can change their password after signing in ("Change password" in the header).
5. **Make yourself a trainer.** Create your own login the same way, then in SQL Editor run:
   `update public.profiles set is_admin = true where username = 'yourname';`
   Trainers see a **Team progress** tab with every trainee's progress and a CSV download.
6. **Upload videos.** **Storage → training-videos → Upload file.** Name each file exactly as below.

| Section | File name |
|---|---|
| 1.1 Introduction | `m1-scribe-role.mp4` |
| 1.2 CCM in Detail | `m1-ccm-detail.mp4` |
| 1.3 3 Example Conditions | `m2-conditions.mp4` |
| 1.4 Reference Material | `m1-reference.mp4` |
| 1.5 Task Portal | `m6-task-portal.mp4` |
| 2.1 Login and Locating Pt’s Profile | `m3-login-profile.mp4` |
| 2.2 Eligibility Checks | `m3-eligibility-checks.mp4` |
| 2.3.1 Condition and Medications | `m2-pn-condition-meds.mp4` |
| 2.3.2 Medication Adherence | `m2-pn-adherence.mp4` |
| 2.3.3 Lifestyle Modifications | `m2-pn-lifestyle.mp4` |
| 2.3.4 Trending of Labs and Vitals | `m2-pn-labs-vitals.mp4` |
| 2.3.5 Risk Factors, Complications, Symptoms and Falls | `m2-pn-risks.mp4` |
| 2.3.6 Provider Visits, Hospitalizations / ER Visits, Referrals | `m2-pn-visits.mp4` |
| 2.3.7 Medication Changes and Escalations | `m2-pn-changes.mp4` |
| 2.4 Submit the Complete Problem Note | no video |
| 3.1 Creating a Patient Profile | `m4-create-profile.mp4` |
| 3.2.1 Enrollment and Consent | `m4-enrollment-consent.mp4` |
| 3.2.2 General Health Questionnaire | `m4-ghq.mp4` |
| 3.2.3 Support | `m4-support.mp4` |
| 3.2.4 Allergies | `m4-allergies.mp4` |
| 3.2.5 Medications | `m4-medications.mp4` |
| 3.2.6 Numbers to Track | `m4-numbers.mp4` |
| 3.3.1 Conditions and Allergies | `m4-conditions-allergies.mp4` |
| 3.3.2 Lab Results, Medications and Immunizations | `m4-labs-meds-imm.mp4` |
| 3.4.1 Allergies, Medications and Numbers to Track | `m4-review-meds-numbers.mp4` |
| 3.4.2 Resources and Support, Other Provider and Appointments | `m4-review-resources.mp4` |
| 3.5 GBIs and Problem Note | `m4-gbis.mp4` |
| 3.6 LogTime and Exporting the File | `m4-logtime.mp4` |
| 3.7 Module Assessment | no video |
| 4.1 PracticeFusion and Billing | `m5-pf-billing.mp4` |
| 5.1 Different Documentation Standards between FU and Scratch Pts | `m6-fu-vs-scratch.mp4` |
| 6.1 Alternative EHR System | `m7-matrixcare.mp4` |

Module 3 (TC Navigation) keeps its `m4-…` file names, so the videos already in `videos/` play without re-uploading. Sections showing “Video coming soon” are waiting for their file.

**Captions:** upload each `.srt` next to its video, named `<file name>.en.srt` (e.g. `m4-ghq.en.srt`). The site converts it automatically and adds a CC button to the player. Sections without a caption file play normally.

**Video size:** the Supabase free plan rejects files over **50 MB** (this was your earlier upload error). A 15-minute screen recording fits if you compress it in HandBrake (free): preset **Fast 720p30** → Video tab: **Avg Bitrate 350 kbps**, tick **2-Pass** → Audio tab: **AAC, 64 kbps, Mono**. Screen recordings stay sharp at this rate.

---

## Part B — GitHub (hosting the website)

1. Go to **github.com** and sign in (or **Sign up** — free).
2. Top-right **+** → **New repository**.
   - Repository name: `brightwell-training`
   - Visibility: **Public** (free GitHub Pages needs a public repo; trainee data stays private in Supabase)
   - Leave everything else unticked → **Create repository**.
3. On the new empty repo page, click the link **"uploading an existing file"**.
4. Unzip the downloaded folder. Open it, select **all the files inside** (`index.html`, `app.js`, `config.js`, `content.js`, `styles.css`, `logo.svg`, `supabase-setup.sql`, `README.md`) and drag them into the GitHub page. Don't drag the folder itself — `index.html` must sit at the top level of the repo.
5. Scroll down → **Commit changes**.
6. Repo **Settings** (top tab) → **Pages** (left menu).
   - Source: **Deploy from a branch**
   - Branch: **main**, folder **/ (root)** → **Save**.
7. Wait 1–2 minutes and refresh the Pages screen. It shows **"Your site is live at https://YOUR-GITHUB-NAME.github.io/brightwell-training/"**. Share that link with trainees.

### Videos on GitHub (VIDEO_SOURCE: 'github', the default)
GitHub limits: the **website upload box accepts files up to 25 MB**, **GitHub Desktop accepts up to 100 MB per file**, and the whole published site should stay **under 1 GB**. With 21 videos, aim for **≤ 45 MB each** (HandBrake settings in Part A, step 6).

1. Install **GitHub Desktop** (desktop.github.com) and sign in with your GitHub account.
2. **File → Clone repository** → pick `brightwell-training` → choose a folder on your PC → **Clone**.
3. In that folder on your PC, create a folder called `videos`.
4. Copy your compressed videos into `videos`, named exactly as in the table in Part A (e.g. `m1-scribe-role.mp4`).
5. Back in GitHub Desktop: the videos appear under **Changes**. Type a summary (e.g. "Add Module 1 videos") → **Commit to main** → **Push origin**.
6. Wait 1–2 minutes. The videos now play on the site.

### Making changes later
- Open a file in the repo (e.g. `config.js` or `content.js`) → pencil icon **Edit** → change → **Commit changes**. The site updates in about a minute (hard-refresh with Ctrl+Shift+R).
- To check the build: repo **Actions** tab — a green tick means it's live.

---

## Updating an existing Supabase project
Re-run all of `supabase-setup.sql` in the SQL Editor after pulling this version. It adds the `feedback`, `questions` and `meetings` tables, two new progress columns and a private `submissions` bucket. It's safe to run more than once. Until you do, saving progress will fail.

## Trainer features
- **Team progress** → click a trainee to see every video, assessment answer, assignment response and uploaded file, and send feedback per section. The trainee sees it under the bell icon and on that section's page.
- **Q&A** → trainees post questions; your answer is shared with every trainee. The tab shows a badge with the number of unanswered questions.
- **Live sessions** → create the event in Google Calendar with "Add Google Meet", paste the link, publish. Trainees see it on their home page and get a notification.

## Settings in `config.js`
- `PASS_MARK` — % needed to pass an assessment (default 80).
- `VIDEO_DONE_AT` — share of a video that counts as watched (default 0.9). Trainees can't skip ahead until they've watched it through.
- `SEQUENTIAL` — `true` locks each section until the previous one is complete. Set to `false` while videos are still being uploaded, otherwise trainees will be held at the first missing video.
- `TRAINING_PT_SHEET_URL` — Google Sheet with the training pt's information (shown in 2.1 and 2.2).
- `PF_PT_SHEET_URL` — Google Sheet with the pt information for PracticeFusion (4.1).
- `PROBLEM_NOTE_LIBRARY_URL` — optional, shown in 2.3.1.

## Editing content (`content.js`)
- The **first option** of every quiz question is the correct one; the site shuffles the order for trainees.
- Remove a `task:` line to make a section assessment-only; remove `quiz:` to make it assignment-only.
- `quiz: { pending: 10 }` shows "Assessment coming soon" and doesn't block progress. Replace it with the question list when ready.
- Assignment types: plain text, `{ kind: 'tick', text }` for Tick completed, `{ kind: 'upload', text }` for a file upload.
- Reference links live at the bottom of `content.js` (`BW_REFERENCES`).
- Don't rename a section `id` once trainees have started — progress is stored against it.
- The questions are a starting draft. Have an SME review them before launch.

## Resetting a password
Supabase → **Authentication → Users** → click the user → **⋯** → reset or set a new password, then tell the trainee.
