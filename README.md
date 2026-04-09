# TickShift Academy — Deployment Guide

Your full student portal, ready to go live in about 30 minutes.
No coding knowledge required — just follow each step.

---

## What You're Deploying

- Student portal: login, watch video courses, track progress, submit homework
- Mentor dashboard: add courses, add lessons (YouTube), create assignments, view student progress
- Real accounts with email/password login
- All data saved permanently in the cloud (free)

---

## STEP 1 — Set Up Your Free Database (Supabase)

Supabase stores all your student accounts, courses, progress, and submissions.

1. Go to https://supabase.com and click **Start for Free**
2. Create an account (GitHub login is easiest)
3. Click **New Project**
   - Name it: `tickshift-academy`
   - Set a strong database password (save it somewhere)
   - Choose the region closest to you (US East is fine)
   - Click **Create new project** — wait about 2 minutes
4. Once ready, click **SQL Editor** in the left sidebar
5. Click **New query**
6. Open the file `supabase/schema.sql` from this folder
7. Copy ALL of the contents and paste into the SQL editor
8. Click **Run** (the green button)
9. You should see "Success. No rows returned."

That's your database set up!

---

## STEP 2 — Get Your Supabase Keys

1. In your Supabase project, click **Settings** (gear icon, bottom left)
2. Click **API**
3. You'll see two values you need:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon / public key** — a long string starting with `eyJ...`
4. Copy both — you'll need them in Step 4

---

## STEP 3 — Deploy to Vercel (Free Hosting)

Vercel gives you a free live URL like `tickshift-academy.vercel.app`

1. Go to https://github.com and create a free account if you don't have one
2. Click the **+** button → **New repository**
   - Name it: `tickshift-academy`
   - Set to **Private**
   - Click **Create repository**
3. Upload all files from this folder to the repository:
   - Click **uploading an existing file**
   - Drag the entire contents of this folder in
   - Click **Commit changes**
4. Go to https://vercel.com and sign in with GitHub
5. Click **Add New Project**
6. Select your `tickshift-academy` repository
7. Click **Deploy** — Vercel will try to build (it will fail first — that's fine, continue to Step 4)

---

## STEP 4 — Add Your Environment Variables

This connects your live site to Supabase.

1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Add these two variables:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase Project URL from Step 2 |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key from Step 2 |

3. Click **Save** for each one
4. Go to **Deployments** → click the three dots on your latest deployment → **Redeploy**
5. Wait about 1 minute — your site is now live!

---

## STEP 5 — Make Yourself the Mentor/Admin

1. Go to your live site URL and create an account with your email
2. Go back to Supabase → **SQL Editor** → **New query**
3. Run this (replace with your actual email):

```sql
update profiles set role = 'admin' where email = 'your@email.com';
```

4. Sign out and sign back in — you'll now see the Mentor Dashboard

---

## STEP 6 — Get Your Free Domain (Optional)

Your site is live at `tickshift-academy.vercel.app` for free.

When you're ready for a custom domain like `academy.tickshift.com`:
1. Buy a domain at https://namecheap.com (~$10/year)
2. In Vercel → Settings → Domains → Add your domain
3. Follow the DNS instructions Vercel gives you
4. Done — your custom domain is live in minutes

---

## How to Add Your Content

**Adding a course:**
1. Log in as mentor → Courses → "+ Add Course"
2. Give it a title and description → Save

**Adding a lesson:**
1. Inside a course → "+ Add Lesson"
2. Title + paste the YouTube video ID (the part after `?v=` in any YouTube URL)
   - Example: `https://youtube.com/watch?v=dQw4w9WgXcQ` → ID is `dQw4w9WgXcQ`
3. Add duration → Save

**Adding homework:**
1. Assignments → "+ Add Assignment"
2. Pick the course, write instructions, set a due date → Save
3. Students will see it immediately on their dashboard

**Adding a student:**
Students sign up themselves at your site URL.
You can also invite them by sharing the link — they create their own account.

---

## File Structure Reference

```
tickshift-academy/
├── supabase/
│   └── schema.sql          ← Run this in Supabase once
├── src/
│   ├── components/
│   │   ├── Logo.jsx        ← TickShift SVG logo
│   │   └── Sidebar.jsx     ← Navigation sidebar
│   ├── context/
│   │   └── AuthContext.jsx ← Login state management
│   ├── pages/
│   │   ├── Login.jsx       ← Login & signup page
│   │   ├── student/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── CoursePlayer.jsx
│   │   │   └── Homework.jsx
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── Courses.jsx
│   │       ├── Assignments.jsx
│   │       └── Students.jsx
│   ├── App.jsx             ← Routing & auth guards
│   ├── main.jsx            ← Entry point
│   ├── supabase.js         ← Database connection
│   └── index.css           ← TickShift brand styles
├── .env.example            ← Copy to .env with your keys
├── vercel.json             ← Vercel routing config
├── vite.config.js
├── package.json
└── index.html
```

---

## Need Help?

If you get stuck on any step, just ask! Common issues:

- **White screen after deploy** → Check that both environment variables are set correctly in Vercel
- **Can't log in** → Make sure you ran the schema.sql in Supabase
- **Videos not playing** → Double-check the YouTube video ID (no extra characters)
- **Can't see mentor dashboard** → Run the SQL to set your role to 'admin'
