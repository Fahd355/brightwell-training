// BrightWell Training — settings. This is the only file you need to edit to go live.
window.BW_CONFIG = {
  // Supabase → Project Settings → API Keys
  SUPABASE_URL: 'https://hkazorugtrnqppxyeatj.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_i3SYy5z3GUEHw-2hYY0Mvw_-sr9Xz3q', // the "anon public" (or "publishable") key. Safe to publish.

  VIDEO_SOURCE: 'github',              // 'github' = videos in the repo's videos/ folder · 'supabase' = Storage bucket below
  VIDEO_BUCKET: 'training-videos',     // Supabase Storage bucket (only used when VIDEO_SOURCE is 'supabase')
  USERNAME_DOMAIN: 'brightwell.training', // username "sara" signs in as sara@brightwell.training
  PASS_MARK: 80,          // % needed to pass an assessment
  VIDEO_DONE_AT: 0.9,     // share of a video that must be watched to count as complete
  SEQUENTIAL: true,       // true = a section unlocks only when the previous one is complete
  PROBLEM_NOTE_LIBRARY_URL: '' // optional: link to the Problem Note Library page
};
