// BrightWell Training — course content.
// Edit freely. Rules:
//  • id      → also the video filename in Supabase Storage (id + ".mp4"). Don't change after trainees start.
//  • task    → leave out (or set to null) if the section has no task.
//  • quiz    → list of questions. The FIRST option is always the correct one; the site shuffles them.
//  • video   → optional full URL to override the default Supabase video location.
//  • resource→ optional { label, url } link shown under the summary.
//  • video:false → section has no video (e.g. a module assessment).
//  • captions→ optional URL to a .srt/.vtt file; default is the video path with .en.srt. Set false to disable.
//  • lessons → put sub-videos under one heading: { title, lessons: [ {id,…}, … ] } → numbered 4.2.1, 4.2.2 …
// Content below is a starting draft — have an SME review every question before launch.

window.BW_MODULES = [
    { title: 'Introduction', sections: [
    { id: 'm1-scribe-role', title: 'Introduction to Brightwell', minutes: 12,
      summary: 'The role of a Medical Scribe, What BrightWell is, overview of SNF and CCM',
      quiz: [
        { q: 'What is the primary benefit of a medical scribe navigating the Electronic Health Record (EHR) in real time?', options: ['It allows the healthcare provider to focus entirely on direct patient care rather than data entry.', 'It automatically submits the superbill to the insurance company.', 'It allows the scribe to diagnose the patient’s condition.', 'It eliminates the need for the provider to review the patient’s history.'] },
        { q: 'Which of the following is a core responsibility of a medical scribe?', options: ['Retrieving and tracking data such as active medications, labs, and imaging from the chart.', 'Performing physical therapy routines with long-term residents.', 'Independently creating and signing clinical orders.', 'Administering medications to patients in the SNF.'] },
        { q: 'What type of care does a Skilled Nursing Facility (SNF) provide?', options: ['24-hour medical, nursing, and rehabilitative care for geriatric patients needing intensive monitoring.', 'Outpatient pediatric care and vaccinations.', 'Independent living apartments with no medical oversight.', 'Emergency surgical interventions.'] },
        { q: 'What are the two primary goals of the Chronic Care Management (CCM) program?', options: ['Patient stabilization and readmission prevention.', 'Rapid discharge and reducing medication costs.', 'Diagnosing new illnesses and emergency triage.', 'Surgical recovery and physical therapy.'] },
        { q: 'In the Brightwell workflow, what is the scope of focus for each patient’s monthly follow-up?', options: ['1 chronic condition per patient.', 'All conditions listed in the patient’s medical history.', 'Only the condition with the most recent hospital visit.', 'Up to 3 chronic conditions per patient.'] }
      ] }
  ]},
  { title: 'CCM in detail', sections: [
    { id: 'm2-eligibility', title: 'Eligibility Criteria', minutes: 12,
      summary: 'The rules that decide whether a resident qualifies for CCM, applied to real diagnosis lists.',
      task: 'A resident has type 2 diabetes, heart failure and an ankle fracture that healed two months ago. Which conditions count toward CCM eligibility, which do not, and why?',
      quiz: [
        { q: 'Which of these counts as a chronic condition for CCM?', options: ['Hypertension', 'Urinary tract infection', 'Seasonal flu', 'A healed wrist fracture'] },
        { q: 'A resident has one chronic condition. Are they eligible?', options: ['No — at least two are required', 'Yes, always', 'Yes, if they are over 65', 'Only with family consent'] },
        { q: 'Qualifying conditions place the resident at significant risk of…', options: ['Death, acute exacerbation or functional decline', 'Missing appointments', 'Higher pharmacy costs only', 'Changing facility'] }
      ] },
    { id: 'm2-monitoring', title: 'Monitoring Parameters', minutes: 12,
      summary: 'The vitals, labs and measurements that show whether each chronic condition is stable.',
      task: 'Pick one chronic condition. List three parameters you would monitor for it and where in the chart you would find each one.',
      quiz: [
        { q: 'Key lab for monitoring diabetes control:', options: ['HbA1c', 'Troponin', 'TSH', 'Vitamin D'] },
        { q: 'For heart failure, which measurement is tracked closely for fluid retention?', options: ['Weight', 'Height', 'Shoe size', 'Hearing test'] },
        { q: 'Kidney function in CKD is followed with…', options: ['eGFR and creatinine', 'Blood glucose only', 'Pulse oximetry', 'Cholesterol'] }
      ] },
    { id: 'm2-conditions', title: '3 Example Conditions', minutes: 15,
      summary: 'Diabetes, hypertension and heart failure walked end to end: what to look for and how to describe a trend.',
      task: 'Write a one-line trending statement for these BP readings: 152/90 (Jan), 144/86 (Feb), 136/82 (Mar).',
      quiz: [
        { q: 'A blood glucose below 70 mg/dL is generally considered…', options: ['Hypoglycaemia', 'Normal fasting', 'Hyperglycaemia', 'Not clinically relevant'] },
        { q: 'In heart failure, rapid weight gain over a few days suggests…', options: ['Fluid retention', 'Improved nutrition', 'Better heart function', 'Dehydration'] },
        { q: 'Hypertension is monitored primarily through…', options: ['Blood pressure readings over time', 'Weekly HbA1c', 'Oxygen saturation', 'Temperature'] }
      ] }
  ]},
  { title: 'PCC Navigation', sections: [
    { id: 'm3-login-profile', title: 'Login and Locating Pt’s Profile', minutes: 10,
      summary: 'Sign in to PointClickCare, choose the right facility and open the correct resident.',
      task: 'In the training environment, open the assigned resident’s profile. Write down the facility, the resident’s date of birth and admission date.',
      quiz: [
        { q: 'After logging in to PCC, what do you confirm first?', options: ['That the correct facility is selected', 'The resident’s billing status', 'Your time log', 'The lab panel'] },
        { q: 'How do you confirm you have the right resident?', options: ['Match at least two identifiers, e.g. name and date of birth', 'Match the first name only', 'Use the room number only', 'Pick the most recent admission'] }
      ] },
    { id: 'm3-eligibility-checks', title: 'Eligibility Checks', minutes: 12,
      summary: 'Confirm active diagnoses in PCC and decide whether the resident meets CCM criteria.',
      task: 'For the assigned resident, list every active diagnosis from Med Diag and mark which ones qualify as chronic for CCM.',
      quiz: [
        { q: 'Where in PCC do you verify the resident’s diagnoses?', options: ['Med Diag', 'Census', 'Progress Notes only', 'Face sheet photo'] },
        { q: 'Which diagnoses count toward eligibility?', options: ['Active chronic diagnoses', 'Resolved diagnoses', 'Any diagnosis ever recorded', 'Family history entries'] },
        { q: 'The list shows only resolved conditions. What next?', options: ['The resident does not meet criteria — flag per process', 'Enroll anyway', 'Add diagnoses yourself', 'Use last year’s list'] }
      ] },
    { id: 'm3-problem-note', title: 'Formulating the Care Plan’s Problem Note', minutes: 15,
      summary: 'Pull each part of the Problem Note from PCC and write it in the standard format.',
      resource: { label: 'Open the Problem Note Library', url: 'PROBLEM_NOTE_LIBRARY' },
      task: 'Draft a complete Problem Note for the assigned training resident using the Problem Note Library. Paste it below.',
      quiz: [
        { q: 'Problem Note content is sourced from…', options: ['PCC chart tabs such as Orders, Results and Progress Notes', 'Last month’s note without checking', 'The resident’s family', 'General guidelines only'] },
        { q: 'A lab value in the Problem Note should include…', options: ['The value, its date and the trend', 'The value only', 'The normal range only', 'The lab’s phone number'] }
      ] }
  ]},
  { title: 'TC Navigation', sections: [
    // Each lesson = one video + one task. The module assessment (4.7) comes after the last video.
    // A section with "lessons" groups sub-videos (4.2.1, 4.2.2 …). Captions: upload <id>.en.srt next to <id>.mp4.
    { id: 'm4-create-profile', title: 'Creating a Patient Profile', minutes: 10,
      summary: 'Set up a new resident in ThoroughCare without duplicates and with matching demographics.',
      task: 'Create the training resident’s profile in TC. List the fields you filled in and the PCC source you used for each.' },
    { title: 'Enrollment and Consent, Initial Pt Assessment', lessons: [
      { id: 'm4-enrollment-consent', title: 'Enrollment and Consent', minutes: 8,
        summary: 'Enroll the resident in the CCM program and record consent before any service is billed.',
        task: 'List, in order, the steps to enroll the training resident in TC and record their consent.' },
      { id: 'm4-ghq', title: 'General Health Questionnaire', minutes: 8,
        summary: 'Complete the General Health Questionnaire that opens the initial assessment.',
        task: 'Complete the General Health Questionnaire for the training resident. Note any answer you could not find in PCC and where you looked.' },
      { id: 'm4-support', title: 'Support', minutes: 6,
        summary: 'Record the resident’s support network and care contacts.',
        task: 'Fill in the Support section for the training resident. Write down who you listed and where in PCC you found them.' },
      { id: 'm4-allergies', title: 'Allergies', minutes: 6,
        summary: 'Enter the resident’s allergies so they match the PCC chart.',
        task: 'Enter every allergy for the training resident. List each one with its reaction, if recorded.' },
      { id: 'm4-medications', title: 'Medications', minutes: 8,
        summary: 'Build the medication list in TC from the current active orders in PCC.',
        task: 'Enter the training resident’s active medications. How many did you enter, and which PCC tab did you use?' },
      { id: 'm4-numbers', title: 'Numbers to Track', minutes: 6,
        summary: 'Set the vitals and labs to follow for each chronic condition.',
        task: 'Set up the Numbers to Track for the training resident. For each one, name the condition it monitors.' }
    ]},
    { title: 'Updating Clinical Data', lessons: [
      { id: 'm4-conditions-allergies', title: 'Conditions and Allergies', minutes: 8,
        summary: 'Keep conditions and allergies in TC in line with the current PCC chart.',
        task: 'Compare the training resident’s conditions and allergies in TC against PCC. List what you added, changed or removed.' },
      { id: 'm4-labs-meds-imm', title: 'Lab Results, Medications and Immunizations', minutes: 10,
        summary: 'Update lab results, medications and immunizations from PCC.',
        task: 'Update the training resident’s labs, medications and immunizations. List each change with its date.' }
    ]},
    { title: 'Documenting the Monthly Clinical Review', lessons: [
      { id: 'm4-review-meds-numbers', title: 'Allergies, Medications and Numbers to Track', minutes: 8,
        summary: 'Review this month’s allergies, medications and tracked numbers in the review template.',
        task: 'Write this month’s review of the training resident’s allergies, medications and Numbers to Track: what changed since last month?' },
      { id: 'm4-review-resources', title: 'Resources and Support, Other Provider and Appointments', minutes: 8,
        summary: 'Document resources and support, other providers and appointments for the month.',
        task: 'Document the training resident’s resources and support, other providers and appointments for this month.' }
    ]},
    { id: 'm4-gbis', title: 'GBIs and Problem Note', minutes: 12,
      summary: 'Link Goals, Barriers and Interventions to each problem and carry the Problem Note into TC.',
      task: 'For one problem (e.g. diabetes), write one measurable goal, one barrier and one intervention.' },
    { id: 'm4-logtime', title: 'LogTime and Exporting the File', minutes: 10,
      summary: 'Log time accurately against the month and export the completed file.',
      task: 'Log your time for the training resident and export the file. Write down the minutes logged and the file name.' },
    { id: 'm4-assessment', title: 'Module Assessment', video: false,
      summary: 'Questions covering every video in TC Navigation.',
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
  { title: 'PracticeFusion and Billing', sections: [
    { id: 'm5-monthly-encounter', title: 'Monthly Encounter', minutes: 12,
      summary: 'Find the patient in Practice Fusion and document the monthly CCM encounter.',
      task: 'List the steps to locate the patient in Practice Fusion and record this month’s encounter.',
      quiz: [
        { q: 'The monthly encounter is documented in…', options: ['Practice Fusion', 'PointClickCare', 'The task portal', 'Email'] },
        { q: 'To find the right patient in Practice Fusion, match…', options: ['Name and date of birth', 'First name only', 'Room number', 'Facility only'] }
      ] },
    { id: 'm5-billing', title: 'Billing Requirements', minutes: 12,
      summary: 'What must be true each month before a CCM claim can go out.',
      quiz: [
        { q: 'CPT 99490 covers…', options: ['The first 20 minutes of clinical staff CCM time in a month', 'Any phone call', 'A hospital admission', 'The initial consent only'] },
        { q: 'CPT 99439 is used for…', options: ['Each additional 20 minutes after 99490', 'Annual wellness visits', 'Lab draws', 'Transport'] },
        { q: 'Which is required before billing CCM?', options: ['Documented consent and a care plan', 'A specialist letter', 'A family meeting', 'A hospital discharge'] }
      ] }
  ]},
  { title: 'Additional Concepts', sections: [
    { id: 'm6-fu-vs-scratch', title: 'FU vs Scratch', minutes: 10,
      summary: 'When to update last month’s care plan (follow-up) and when to build one from scratch.',
      task: 'Describe one situation that calls for a follow-up note and one that calls for a note from scratch.',
      quiz: [
        { q: 'A follow-up (FU) note means…', options: ['Updating the prior month’s plan with this month’s data', 'Copying last month unchanged', 'Deleting the old plan', 'Writing only the time log'] },
        { q: 'A note from scratch is needed when…', options: ['There is no prior care plan, e.g. a new enrollment', 'The resident’s room changed', 'It is the end of the quarter', 'Any time you prefer'] }
      ] },
    { id: 'm6-task-portal', title: 'Task Portal', minutes: 10,
      summary: 'How work is assigned, picked up and closed out in the task portal.',
      task: 'Write down the steps to pick up, complete and close a task in the portal.',
      quiz: [
        { q: 'When should you check the task portal?', options: ['At the start of every shift', 'Once a week', 'Only when asked', 'At month end'] }
      ] },
    { id: 'm6-job-aids', title: 'Job Aids', minutes: 10,
      summary: 'The quick-reference guides you will keep open on shift, and when to use each one.',
      task: 'Open each job aid. Name the one you expect to use most and explain why in two sentences.' }
  ]}
];
