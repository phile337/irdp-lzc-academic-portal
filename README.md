# IRDP Notes & Past Papers — v1.2 project package

## Important status

This ZIP includes a more complete **front-end + initial database/security scaffold** based on the requirements agreed with Phile. It is **not yet a fully deployed production system**. Do not enter real student information or upload confidential college files until the backend has been configured and independently tested.

No AI is included. All possible questions and model answers are to be written by lecturers.

## Included in this ZIP

- Responsive bilingual (English / Kiswahili) portal layout
- Student account request interface
- Sign-in interface
- Student library view with search and filters
- Lecturer workspace: assigned courses, upload notes/past papers, write possible questions and model answers, direct publish for assigned courses
- Admin workspace: student request list, published resource list, hide published material
- Supabase database schema and row-level security (RLS) starting point
- Private storage bucket policy starting point
- Netlify static hosting configuration
- PWA manifest
- Setup and verification notes

## Key requirements implemented in the design

- Levels: Degree, Master's, Non-Degree
- Hierarchy: programme, academic year, year of study, semester, course
- Student accounts require an administrator-controlled verification/approval workflow
- Lecturer accounts are created by the administrator
- Lecturer publishing is direct for assigned courses, with admin ability to hide material
- Students can read/download published resources after approval
- Accepted file types: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, WEBP
- No comments/discussion feature
- No AI feature
- Official IRDP logo is not bundled: obtain the correct file and permission before adding it

## Project files

- `index.html` — interface and forms
- `styles.css` — responsive styling
- `app.js` — frontend logic
- `config.js` — Supabase URL and public anon/publishable key placeholder
- `manifest.webmanifest` — basic PWA metadata
- `netlify.toml` — Netlify configuration and basic headers
- `supabase/schema.sql` — initial tables, RLS policies and private storage bucket
- `SETUP_CHECKLIST_SW.md` — step-by-step Swahili setup and test checklist

## What still requires setup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor. Review SQL and policies before production; database security needs a full test.
2. Put the Supabase project URL and public anon/publishable key into `config.js`. Never put a `service_role` key or secret key in browser files.
3. Create an initial admin account/profile using a controlled, secure process. Do not make an open signup path that can grant admin or lecturer roles.
4. Set up a secure process for admin to approve student requests and create auth users. For a real deployment, use an authenticated Edge Function/server workflow or a carefully controlled admin process.
5. Add official programmes, courses, academic periods, lecturer accounts and teaching assignments.
6. Verify RLS and storage policies with student, lecturer and admin test accounts, including attempts to access other programmes and direct file URLs.
7. Add rate limiting / CAPTCHA and privacy notices to the public student request form.
8. Confirm IRDP permission, logo use, copyright rights for past papers and data retention rules.
9. Configure backups, monitoring, recovery and a custom domain if needed.
10. Deploy to Netlify only after tests pass.

## Preview mode

Without `config.js` values, sign-in and account requests remain disabled and no personal information is sent. The public site still shows the layout. It is safe to inspect as a design prototype.

## Current limitations to resolve before production

- The admin account approval/creation flow is documented but not automated in this package.
- Admin CRUD for programmes, courses, semesters, users and assignments must be completed through the secure backend/admin workflow before this can be considered production-ready.
- This initial scaffold must be reviewed and security-tested by a competent developer before handling real student data.
- PWA manifest has no official icon yet; add approved IRDP branding assets when supplied.
- The exact academic structure and registration validation method must come from IRDP, not be guessed.

This is an independent prototype and does not claim official IRDP endorsement.
