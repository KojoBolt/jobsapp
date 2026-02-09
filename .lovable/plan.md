

## Enhanced Job Trackr Dashboard

A comprehensive upgrade to the Job Tracker with new data fields, search/filter functionality, expanded statuses, a refreshed visual design, and collapsible contact sections.

---

### 1. Database Migration

Add new columns to the `job_applications` table:

- `salary_range` (text, nullable) -- e.g. "$80k - $100k"
- `location` (text, nullable) -- e.g. "Remote", "New York, NY"
- `contact_name` (text, nullable)
- `contact_email` (text, nullable)
- `contact_phone` (text, nullable)

No new tables needed. Existing data is unaffected since all new columns are nullable.

---

### 2. Status System Update

Replace the current 6 statuses with 7 color-coded statuses using the specified palette:

| Status | Text Color | Background |
|--------|-----------|------------|
| Applied | #4A90E2 | #E8F4FD |
| Screening | #9B59B6 | #F4ECFF |
| Interview | #F39C12 | #FFF4E6 |
| Offer | #27AE60 | #E8F8F0 |
| Rejected | #E74C3C | #FFEBEE |
| Accepted | #16A085 | #E0F2F1 |
| Declined | #95A5A6 | #F5F5F5 |

---

### 3. Component Changes

**`TrackerStats.tsx`** -- Update stat definitions:
- Total Applications, Active Applications (applied + screening + interview + offer), Interviews, Offers

**`JobCardFeed.tsx`** -- Major rewrite:
- Add search bar (company/position) and status filter dropdown at the top
- Redesign cards: white background with rounded corners, hover lift effect, soft shadows
- Show calendar icon + date, dollar icon + salary, map pin + location on each card
- Add collapsible section for contact info (name, email, phone) and notes
- Clickable job URL with external link icon
- Color-coded status badge pills using the new palette
- Empty states: friendly message with briefcase icon when no apps exist; "No applications found" when filters return empty
- Sort by most recent `applied_at` first

**`AddJobModal.tsx`** -- Expand form:
- Add fields: salary range, location, contact name, contact email, contact phone
- Use 2-column grid layout for related fields (e.g. company + position, contact name + email)
- Update status dropdown with all 7 statuses
- Add date picker for `applied_at` (default to today)

**`JobTracker.tsx`** -- Minor updates:
- Pass search/filter state down or let `JobCardFeed` manage it internally
- Update active applications filter to include the new "accepted" status where relevant
- Update heading font to use "Cormorant Garamond" (loaded via Google Fonts in `index.html`)

---

### 4. Design Implementation

- Background: purple-blue gradient (`from #1e3c72 through #2a5298 to #7e22ce at 135deg`) applied to the tracker page content area
- Heading font: "Cormorant Garamond" serif for company names and main title
- Body font: "Inter" sans-serif (already in use)
- Cards: white/light background with 16px border radius, soft shadow, hover lift with deeper shadow
- Primary buttons: purple gradient (`#667eea` to `#764ba2`) with hover lift
- Status badges: rounded pills, uppercase text, color-coded per the table above
- Smooth framer-motion animations on cards and stats (already partially in place)
- Add Google Font link for "Cormorant Garamond" in `index.html`

---

### 5. Files to Create/Modify

| File | Action |
|------|--------|
| `index.html` | Add Google Font link for Cormorant Garamond |
| Database migration | Add 5 new columns to `job_applications` |
| `src/components/tracker/TrackerStats.tsx` | Update stat labels and active filter logic |
| `src/components/tracker/JobCardFeed.tsx` | Full rewrite with search, filter, new card design, collapsible sections, empty states |
| `src/components/tracker/AddJobModal.tsx` | Add new form fields, 2-column grid, all 7 statuses, date picker |
| `src/pages/JobTracker.tsx` | Update active apps filter, pass new props, apply gradient background |

---

### Technical Notes

- The `job_applications` table type in `types.ts` will auto-update after the migration runs
- Until auto-update, we use `as any` casts for new columns (consistent with existing pattern in the codebase)
- The collapsible contact section will use `@radix-ui/react-collapsible` (already installed)
- Search and status filter will be client-side filtering on the already-fetched applications array
- All animations use framer-motion (already installed)

