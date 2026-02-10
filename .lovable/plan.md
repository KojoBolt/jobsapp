

# Service Deployment Dashboard

## What Changes

When a user clicks **"Deploy Professional Submission"** from the Add Application chooser, instead of staying in the small modal, they will be taken to a **dedicated full-page deployment dashboard** with a clean, spacious layout.

## The Deployment Page Layout

### Top Section: Identity Vault Sync Toggle
- A prominent toggle switch: **"Use Identity Vault details for this application"**
- **Toggle ON**: Shows a clean summary card with the user's Name, Email, LinkedIn, Resume info, Target Roles, Industries, Tone of Voice, and Salary Range -- all pulled from the Identity Vault. Redundant form fields are hidden.
- **Toggle OFF**: Expands the full form with all fields (name, email, LinkedIn, targeting preferences, role type, salary, etc.) so the user can manually fill everything for a one-time custom application.

### Middle Section: Application Details
- Company Name and Position Title (always visible)
- Job Link field (hidden if "Find for me" AI Discovery is selected)
- Plan 2 users: "Find a job for me" toggle for AI + Human discovery
- Plan 1 users: Upgrade nudge for discovery feature

### Mission Logic Section
- Targeting Preferences (role type, salary minimum, industry focus) -- shown only when vault toggle is OFF
- Special Instructions textarea: "Anything specific you want us to mention to this recruiter?"

### Bottom Section: Credit Info and Submit
- Shows remaining credits (e.g., "7 of 10 credits remaining")
- Submit button: "Deploy Professional Submission"

## Navigation Flow

1. User clicks "Add Application" in Job Tracker
2. Chooser modal appears (Manual Entry vs Deploy)
3. Clicking "Deploy Professional Submission" **navigates to `/job-tracker/deploy`** instead of opening a form in the modal
4. After successful submission, user is redirected back to `/job-tracker`

## Validation Guards (preserved)
- Credit check: blocks if no remaining credits
- Vault check: if toggle is ON but vault is incomplete, shows warning with link to Identity Vault
- Name + LinkedIn required for vault-based deployment

---

## Technical Details

### New Files
- **`src/pages/DeployMission.tsx`** -- Full-page deployment dashboard using `DashboardLayout`, styled with the same purple-blue gradient and serif typography. Contains the toggle, vault summary, form fields, and submission logic.

### Modified Files
- **`src/components/tracker/AddJobModal.tsx`** -- The "Deploy Professional Submission" button in the chooser modal will call `navigate("/job-tracker/deploy")` and close the modal, instead of setting `mode` to `"deploy"`.
- **`src/App.tsx`** -- Add route for `/job-tracker/deploy` pointing to `DeployMission`.

### Data Flow
- `DeployMission` page reads `profile.identity_vault_data` from `useAuth()` for the vault toggle.
- On submit, it inserts directly into the `job_applications` table via Supabase, increments `monthly_usage_count`, and navigates back to `/job-tracker`.
- All existing credit validation, vault completeness checks, and Plan 2 AI Discovery logic are preserved and moved to the new page.

