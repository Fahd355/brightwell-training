// BrightWell Training — course content.
// Edit freely. Rules:
//  • id      → also the video filename (id + ".mp4"). Don't change after trainees start.
//  • task    → text: a trainee writes a response · { text, kind:'tick' } a "Tick completed" box ·
//              { text, kind:'upload' } a file upload · { text, minChars } a short text answer.
//  • quiz    → list of questions. The FIRST option is always the correct one; the site shuffles them.
//              { pending: 10 } = assessment not written yet (shown as "coming soon", doesn't block progress).
//  • links   → links shown under the video: { label, url }. url 'CFG:NAME' reads BW_CONFIG.NAME (hidden if empty).
//  • video:false → section has no video (e.g. a module assessment).
//  • captions→ optional URL to a .srt/.vtt file; default is the video path with .en.srt. Set false to disable.
//  • lessons → sub-videos under one heading: { title, lessons: [ {id,…}, … ] } → numbered 3.2.1, 3.2.2 …
// Draft questions must be reviewed by an SME before launch.

const PT_SHEET = { label: 'Training pt’s information (Google Sheet)', url: 'CFG:TRAINING_PT_SHEET_URL' };

window.BW_MODULES = [
  { title: 'Introduction', sections: [
    { id: 'm1-scribe-role', title: 'Introduction', minutes: 12,
      summary: 'The role of medical scribe, SNF, pt population, EHR Systems.',
      quiz: [
        { q: 'What is the primary benefit of a medical scribe navigating the Electronic Health Record (EHR) in real time?', options: ['It allows the healthcare provider to focus entirely on direct patient care rather than data entry.', 'It automatically submits the superbill to the insurance company.', 'It allows the scribe to diagnose the patient’s condition.', 'It eliminates the need for the provider to review the patient’s history.'] },
        { q: 'Which of the following is a core responsibility of a medical scribe?', options: ['Retrieving and tracking data such as active medications, labs, and imaging from the chart.', 'Performing physical therapy routines with long-term residents.', 'Independently creating and signing clinical orders.', 'Administering medications to patients in the SNF.'] },
        { q: 'What type of care does a Skilled Nursing Facility (SNF) provide?', options: ['24-hour medical, nursing, and rehabilitative care for geriatric patients needing intensive monitoring.', 'Outpatient pediatric care and vaccinations.', 'Independent living apartments with no medical oversight.', 'Emergency surgical interventions.'] },
        { q: 'What are the two primary goals of the Chronic Care Management (CCM) program?', options: ['Patient stabilization and readmission prevention.', 'Rapid discharge and reducing medication costs.', 'Diagnosing new illnesses and emergency triage.', 'Surgical recovery and physical therapy.'] },
        { q: 'In the Brightwell workflow, what is the scope of focus for each patient’s monthly follow-up?', options: ['1 chronic condition per patient.', 'All conditions listed in the patient’s medical history.', 'Only the condition with the most recent hospital visit.', 'Up to 3 chronic conditions per patient.'] }
      ] },
    { id: 'm1-ccm-detail', title: 'CCM in Detail',
      summary: 'The Workflow of Brightwell and CCM.',
      quiz: { pending: 10 } },
    { id: 'm2-conditions', title: '3 Example Conditions',
      summary: 'The monitoring parameters of HTN, COPD and Depression.',
      links: [{ label: 'Outline of Care', url: 'https://docs.google.com/spreadsheets/d/1fMM8aA0m-hctRFn0ZLxi33pCnjZh7z-JdDqqRr0ZXRE/edit?usp=sharing' }, { label: 'CCM Tool', url: 'https://ccmclinical.pages.dev/' }],
      quiz: { pending: 10 } },
    { id: 'm1-reference', title: 'Reference Material',
      summary: 'The reference materials you will use on shift. All links are in the Reference tab.' }
  ]},
  { title: 'PCC Navigation', sections: [
    { id: 'm3-login-profile', title: 'Login and Locating Pt’s Profile', minutes: 10,
      summary: 'Sign in to PointClickCare, choose the right facility and open the correct resident.',
      links: [PT_SHEET],
      task: 'Locate this pt’s profile on PCC.' },
    { id: 'm3-eligibility-checks', title: 'Eligibility Checks', minutes: 12,
      summary: 'Confirm active diagnoses in PCC and decide whether the resident meets CCM criteria.',
      links: [PT_SHEET],
      quiz: [
        { q: 'Where in PCC do you verify the resident’s diagnoses?', options: ['Med Diag', 'Census', 'Progress Notes only', 'Face sheet photo'] },
        { q: 'Which diagnoses count toward eligibility?', options: ['Active chronic diagnoses', 'Resolved diagnoses', 'Any diagnosis ever recorded', 'Family history entries'] },
        { q: 'The list shows only resolved conditions. What next?', options: ['The resident does not meet criteria — flag per process', 'Enroll anyway', 'Add diagnoses yourself', 'Use last year’s list'] }
      ],
      task: 'Check the eligibility of the training pt.' },
    { title: 'Formulating the Care Plan’s Problem Note', lessons: [
      { id: 'm2-pn-condition-meds', title: 'Condition and Medications',
        summary: 'Document the CCM condition and its medications.',
        links: [{ label: 'Problem Note Library', url: 'CFG:PROBLEM_NOTE_LIBRARY_URL' }],
        task: 'Document the CCM condition and its medication in the box below and submit it.' },
      { id: 'm2-pn-adherence', title: 'Medication Adherence',
        summary: 'Document the pt’s medication adherence.',
        task: 'Document the pt adherence in the box below and submit it.' },
      { id: 'm2-pn-lifestyle', title: 'Lifestyle Modifications',
        summary: 'Document the pt’s lifestyle modifications.',
        task: 'Document pt’s lifestyle modifications in the box below and submit it.' },
      { id: 'm2-pn-labs-vitals', title: 'Trending of Labs and Vitals',
        summary: 'Trend the pt’s labs and vitals.',
        task: 'Trend the pt’s labs and vitals in the box below and submit it.' },
      { id: 'm2-pn-risks', title: 'Risk Factors, Complications, Symptoms and Falls',
        summary: 'Document risk factors, complications, symptoms and falls.',
        task: 'Document the Risk Factors, Complications, Symptoms and Falls in the box below and submit it.' },
      { id: 'm2-pn-visits', title: 'Provider Visits, Hospitalizations / ER Visits, Referrals',
        summary: 'Document provider visits, hospitalizations / ER visits and referrals.',
        task: 'Document Provider Visits, Hospitalizations / ER visits, Referrals in the box below and submit it.' },
      { id: 'm2-pn-changes', title: 'Medication Changes and Escalations',
        summary: 'Document medication changes and escalations. Final assessment on the problem note’s documentation standards.',
        quiz: { pending: 10 },
        task: 'Document Medication changes and Escalations in the box below and submit it.' }
    ]},
    { id: 'm2-pn-full', title: 'Submit the Complete Problem Note', video: false,
      summary: 'Put every part from 2.3 together into one problem note for the training pt.',
      task: 'Submit the whole problem note for this pt in the box below.' }
  ]},
  { title: 'TC Navigation', sections: [
    // Video files for this module keep their m4-… names.
    { id: 'm4-create-profile', title: 'Creating a Patient Profile', minutes: 10,
      summary: 'Set up a new resident in ThoroughCare without duplicates and with matching demographics.',
      task: { minChars: 10, text: 'Create a Pt profile on ThoroughCare using your OWN NAME and DATE OF BIRTH (for Example: Ahmed Mohamed, 10/10/2000) instead of the pt’s name and DOB, fill the remaining information (facility, provider, care manager, sex) according to the pt information you have. And submit in the box below the name and DOB of the pt profile you created. You will use this pt profile for the rest of the module to complete the training pt’s task as a Scratch pt.' } },
    { title: 'Enrollment and Consent, Initial Pt Assessment', lessons: [
      { id: 'm4-enrollment-consent', title: 'Enrollment and Consent', minutes: 8,
        summary: 'Enroll the resident in the CCM program and record consent before any service is billed.',
        task: { kind: 'tick', text: 'Enroll the pt, then Tick completed.' } },
      { id: 'm4-ghq', title: 'General Health Questionnaire', minutes: 8,
        summary: 'Complete the General Health Questionnaire that opens the initial assessment.',
        task: { kind: 'tick', text: 'Complete the General Health Questionnaire, then Tick completed.' } },
      { id: 'm4-support', title: 'Support', minutes: 6,
        summary: 'Record the resident’s support network and care contacts.',
        task: { kind: 'tick', text: 'Complete the Support section, then Tick completed.' } },
      { id: 'm4-allergies', title: 'Allergies', minutes: 6,
        summary: 'Enter the resident’s allergies so they match the PCC chart.',
        task: { kind: 'tick', text: 'Complete the allergies section, then Tick completed.' } },
      { id: 'm4-medications', title: 'Medications', minutes: 8,
        summary: 'Build the medication list in TC from the current active orders in PCC.',
        task: { kind: 'tick', text: 'Complete the Medications section, then Tick completed.' } },
      { id: 'm4-numbers', title: 'Numbers to Track', minutes: 6,
        summary: 'Set the vitals and labs to follow for each chronic condition.',
        task: { kind: 'tick', text: 'Complete the Numbers to Track section, then Tick completed.' } }
    ]},
    { title: 'Updating Clinical Data', lessons: [
      { id: 'm4-conditions-allergies', title: 'Conditions and Allergies', minutes: 8,
        summary: 'Keep conditions and allergies in TC in line with the current PCC chart.',
        task: { kind: 'tick', text: 'Complete the Conditions and Allergies section in Clinical data, then Tick completed.' } },
      { id: 'm4-labs-meds-imm', title: 'Lab Results, Medications and Immunizations', minutes: 10,
        summary: 'Update lab results, medications and immunizations from PCC.',
        task: { kind: 'tick', text: 'Complete the Lab Results, Medications and Immunizations section in Clinical data, then Tick completed.' } }
    ]},
    { title: 'Documenting the Monthly Clinical Review', lessons: [
      { id: 'm4-review-meds-numbers', title: 'Allergies, Medications and Numbers to Track', minutes: 8,
        summary: 'Review this month’s allergies, medications and tracked numbers in the review template.',
        task: { kind: 'tick', text: 'Complete the Allergies, Medications and Numbers to Track in Clinical Review, then Tick completed.' } },
      { id: 'm4-review-resources', title: 'Resources and Support, Other Provider and Appointments', minutes: 8,
        summary: 'Document resources and support, other providers and appointments for the month.',
        task: { kind: 'tick', text: 'Complete Resources and Support, Other Provider and Appointments in Clinical Review, then Tick completed.' } }
    ]},
    { id: 'm4-gbis', title: 'GBIs and Problem Note', minutes: 12,
      summary: 'Link Goals, Barriers and Interventions to each problem and carry the Problem Note into TC.',
      task: { kind: 'tick', text: 'Create the SNF Care Plan Problem note, add GBIs for the pt and update the note, then Tick completed.' } },
    { id: 'm4-logtime', title: 'LogTime and Exporting the File', minutes: 10,
      summary: 'Log time accurately against the month and export the completed file.',
      task: { kind: 'upload', text: 'LogTime, Export the Encounter and Upload it here, then Tick completed.' } },
    { id: 'm4-assessment', title: 'Module Assessment', video: false,
      summary: 'Assessment on all the documentation standards related to ThoroughCare, Scratch pt.',
      quiz: [
        { q: 'Before creating a profile in TC, you should…', options: ['Search to make sure the patient does not already exist', 'Create it and merge later', 'Ask the resident to sign up', 'Copy another patient’s profile'] },
        { q: 'Demographics in TC must match…', options: ['The PCC face sheet', 'Last month’s spreadsheet', 'What the facility told you verbally', 'The billing invoice'] },
        { q: 'When must consent be documented?', options: ['Before CCM services are billed', 'Within a year', 'Only if the resident asks', 'After the first claim is paid'] },
        { q: 'The initial assessment establishes…', options: ['The resident’s baseline for future monthly reviews', 'The billing amount', 'The facility’s staffing', 'The discharge date'] },
        { q: 'The medication list in TC should match…', options: ['Current active orders in PCC', 'The admission medication list', 'Last month’s TC list', 'The pharmacy’s catalogue'] },
        { q: 'A medication was discontinued in PCC. In TC you…', options: ['Remove it or mark it inactive', 'Leave it as active', 'Add a duplicate entry', 'Ignore it until next quarter'] },
        { q: 'The monthly review focuses on…', options: ['What changed since the last review', 'Repeating the admission history', 'Billing totals', 'Facility news'] },
        { q: 'A new hospital visit this month should be…', options: ['Documented with date and reason', 'Left for next month', 'Recorded only if the resident mentions it', 'Skipped if discharged'] },
        { q: 'GBI stands for…', options: ['Goals, Barriers, Interventions', 'General Baseline Information', 'Glucose, BP, Intake', 'Guided Billing Index'] },
        { q: 'A well-written goal is…', options: ['Specific and measurable', 'Broad and open-ended', 'Copied from another resident', 'Written without a timeframe'] },
        { q: 'Time logged in TC must reflect…', options: ['The actual time spent on that resident', 'A standard 20 minutes for everyone', 'Time estimated at month end', 'Time spent on any resident'] },
        { q: 'When do you export the file?', options: ['After the review is complete and saved', 'Before starting the review', 'Only at quarter end', 'Whenever the system is open'] }
      ] }
  ]},
  { title: 'PracticeFusion', sections: [
    { id: 'm5-pf-billing', title: 'PracticeFusion and Billing',
      summary: 'Locate the pt in PracticeFusion, upload the encounter and finish the bill.',
      links: [{ label: 'Pt information (Google Sheet)', url: 'CFG:PF_PT_SHEET_URL' }],
      task: { kind: 'tick', text: 'Use this pt information to locate that pt profile on PF and use it to upload the encounter, finish the bill.' } }
  ]},
  { title: 'Follow Up', sections: [
    { id: 'm6-fu-vs-scratch', title: 'Different Documentation Standards between FU and Scratch Pts',
      summary: 'The different documentation standards between a FU pt and a Scratch pt.',
      quiz: { pending: 15 } }
  ]},
  { title: 'Add-ons', sections: [
    { id: 'm7-matrixcare', title: 'Alternative EHR System',
      summary: 'MatrixCare as an alternative EHR system, with the final assessment on the whole training.',
      quiz: { pending: 25 } },
    { id: 'm6-task-portal', title: 'Task Portal',
      summary: 'The possible scenarios of submitting a case on the portal.',
      quiz: { pending: 5 } }
  ]}
];

// Reference tab
window.BW_REFERENCES = [
  { title: 'Reference Materials', links: [
    { label: 'Care Policy', url: 'https://docs.google.com/spreadsheets/d/1fMM8aA0m-hctRFn0ZLxi33pCnjZh7z-JdDqqRr0ZXRE/edit?usp=sharing', icon: 'ph-clipboard-text' },
    { label: 'PCC map', url: 'https://docs.google.com/spreadsheets/d/17jXUkcCOHp54RHEsNG3irsXvGyQc9Wz5KpwwtzL7BsA/edit?usp=sharing', icon: 'ph-map-trifold' },
    { label: 'CCM tool', url: 'https://ccmclinical.pages.dev/', icon: 'ph-stethoscope' },
    { label: 'BW essentials', url: 'https://docs.google.com/spreadsheets/d/1Qro5UvazoqgNQJYHrKM4o3JiNx9wAFOze2_vyMGCGxU/edit?usp=sharing', icon: 'ph-book-open-text' }
  ]},
  { title: 'Systems', links: [
    { label: 'PCC', url: 'https://pointclickcare.com/login/', icon: 'ph-desktop', color: '#0B7A5E' },
    { label: 'ThoroughCare', url: 'https://bwhc1.secure.thoroughcare.com/users/sign_in', icon: 'ph-desktop', color: '#1279F3' },
    { label: 'PracticeFusion', url: 'https://static.practicefusion.com/apps/ehr/index.html#/login', icon: 'ph-desktop', color: '#FF5700' },
    { label: 'MatrixCare', url: 'https://nhc.matrixcare.com/Login.jsp', icon: 'ph-desktop', color: '#4A5670' }
  ]}
];
