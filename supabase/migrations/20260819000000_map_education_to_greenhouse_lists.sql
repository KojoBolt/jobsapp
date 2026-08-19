-- =====================================================================
--  Repoint stored degree and discipline values at Greenhouse's real lists.
--
--  The Identity Vault originally offered lists I chose rather than the ones
--  employers actually use. Those dropdowns match on exact option text, so a
--  vault holding "Information Technology" matched nothing against a list whose
--  nearest entry is "Information Systems" — and the failure was silent, because
--  typing an absent value filters the menu to empty, which reads as "no options
--  yet" rather than "no such option".
--
--  The lists in src/pages/IdentityVault.tsx are now read verbatim from a live
--  Greenhouse form. This migrates the values people already saved.
--
--  ONLY UNAMBIGUOUS RENAMES ARE MAPPED. "English" → "English Studies" is the
--  same subject under a different label. "Data Science", "Design", "Marketing",
--  "Nursing" and "Supply Chain" have no clean equivalent — mapping those would
--  mean quietly changing what someone studied, on a real job application. Those
--  are cleared instead, so the field shows as empty and the candidate picks
--  again deliberately.
-- =====================================================================

BEGIN;

-- ── Degrees ────────────────────────────────────────────────────────────
-- Every one of these is the same qualification, worded differently.
UPDATE public.profiles
SET identity_vault_data = jsonb_set(
      identity_vault_data,
      '{education}',
      (
        -- ORDER BY ord: without it the aggregate has no defined order,
        -- and reshuffling a candidate's education entries would change which
        -- one counts as their most recent.
        SELECT jsonb_agg(
          CASE entry->>'degree'
            WHEN 'MBA'                        THEN jsonb_set(entry, '{degree}', '"Master of Business Administration (M.B.A.)"')
            WHEN 'Doctorate (PhD)'            THEN jsonb_set(entry, '{degree}', '"Doctor of Philosophy (Ph.D.)"')
            WHEN 'High School Diploma'        THEN jsonb_set(entry, '{degree}', '"High School"')
            WHEN 'Professional Certification' THEN jsonb_set(entry, '{degree}', '"Other"')
            ELSE entry
          END
          ORDER BY ord
        )
        FROM jsonb_array_elements(identity_vault_data->'education') WITH ORDINALITY AS t(entry, ord)
      )
    )
WHERE jsonb_typeof(identity_vault_data->'education') = 'array'
  AND jsonb_array_length(identity_vault_data->'education') > 0;

-- ── Disciplines ────────────────────────────────────────────────────────
UPDATE public.profiles
SET identity_vault_data = jsonb_set(
      identity_vault_data,
      '{education}',
      (
        -- ORDER BY ord: without it the aggregate has no defined order,
        -- and reshuffling a candidate's education entries would change which
        -- one counts as their most recent.
        SELECT jsonb_agg(
          CASE entry->>'discipline'
            -- Same subject, different label.
            WHEN 'Information Technology'  THEN jsonb_set(entry, '{discipline}', '"Information Systems"')
            WHEN 'English'                 THEN jsonb_set(entry, '{discipline}', '"English Studies"')
            WHEN 'Environmental Science'   THEN jsonb_set(entry, '{discipline}', '"Environmental Studies"')
            WHEN 'Human Resources'         THEN jsonb_set(entry, '{discipline}', '"Human Resources Management"')
            WHEN 'Health Sciences'         THEN jsonb_set(entry, '{discipline}', '"Health Services"')
            WHEN 'Communications'          THEN jsonb_set(entry, '{discipline}', '"Communications & Film"')
            WHEN 'Statistics'              THEN jsonb_set(entry, '{discipline}', '"Statistics & Decision Theory"')
            WHEN 'Public Health'           THEN jsonb_set(entry, '{discipline}', '"Health Services"')
            -- No honest equivalent. Cleared so the field reads as empty and
            -- gets chosen deliberately, rather than guessed at here.
            WHEN 'Data Science'            THEN jsonb_set(entry, '{discipline}', '""')
            WHEN 'Design'                  THEN jsonb_set(entry, '{discipline}', '""')
            WHEN 'Marketing'               THEN jsonb_set(entry, '{discipline}', '""')
            WHEN 'Nursing'                 THEN jsonb_set(entry, '{discipline}', '""')
            WHEN 'Supply Chain'            THEN jsonb_set(entry, '{discipline}', '""')
            ELSE entry
          END
          ORDER BY ord
        )
        FROM jsonb_array_elements(identity_vault_data->'education') WITH ORDINALITY AS t(entry, ord)
      )
    )
WHERE jsonb_typeof(identity_vault_data->'education') = 'array'
  AND jsonb_array_length(identity_vault_data->'education') > 0;

COMMIT;
