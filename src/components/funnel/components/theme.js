// Single source of truth for the funnel's visual language.
// Every colour used by the funnel shell, cards and buttons resolves here,
// so the palette can be re-skinned without touching component markup.

export const FUNNEL = {
  page: '#F6F0EF',        // warm cream — the content panel
  sidebar: '#FFFFFF',     // the left rail
  hairline: '#E9E0DC',    // stepper connectors, badges, dividers
  dot: '#D6C6BF',         // centre dot of an upcoming step
  ink: '#1F1B19',         // headlines, Next button
  brandText: '#A69A94',   // the wordmark, deliberately muted
  body: '#57504B',        // paragraph text
  muted: '#A2968F',       // captions, step descriptions, inactive numbers
  accent: '#F47C2C',      // orange — checks, active step, progress
  accentSoft: '#FDEEE2',  // orange at ~10% for tinted surfaces
  ring: '#EFC59B',        // tan outline on the selected card
  card: '#FFFFFF',
  cardShadow: '0 2px 12px rgba(31,27,25,0.05)',
  iconBg: '#EDF1E9',      // sage circle behind option icons
  iconFg: '#6B8E5A',
};

// The checkout pages run their own palette — a dark editorial panel beside a
// white form, with lime as the single accent. Kept here so both the
// professional and intern checkouts stay in step.
export const CHECKOUT = {
  page: '#F2F2EE',
  panel: '#151515',       // dark photo panel
  lime: '#C7F04B',        // selected pills, highlighted words, check marks
  limeDeep: '#2E3D12',    // CTA, badges — readable against lime
  card: '#FFFFFF',
  hairline: '#E6E6E1',
  ink: '#151515',
  body: '#5A5A54',
  muted: '#8E8E86',
  shadow: '0 2px 12px rgba(21,21,21,0.05)',
};

// The four funnel stages, in order, with the copy shown in the sidebar
// stepper. `quizConfig.js` only carries the stage name, so the supporting
// description is authored here.
export const STAGES = [
  { name: 'Profile', description: 'Some basic information we need to get to know you' },
  { name: 'Context', description: 'Where you are in your search and what is slowing it down' },
  { name: 'Targeting', description: 'The roles you want and how you are performing today' },
  { name: 'Plan', description: 'Your personalised application plan, built and ready' },
];
