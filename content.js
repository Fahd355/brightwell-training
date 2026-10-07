// BrightWell Training — course content.
// Edit freely. Rules:
//  • id      → also the video filename in Supabase Storage (id + ".mp4"). Don't change after trainees start.
//  • task    → leave out (or set to null) if the section has no task.
//  • quiz    → list of questions. The FIRST option is always the correct one; the site shuffles them.
//  • video   → optional full URL to override the default Supabase video location.
//  • resource→ optional { label, url } link shown under the summary.
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
    { id: 'm4-create-profile', title: 'Creating a Patient Profile', minutes: 10,
      summary: 'Set up a new resident in ThoroughCare without duplicates and with matching demographics.',
      quiz: [
        { q: 'Before creating a profile in TC, you should…', options: ['Search to make sure the patient does not already exist', 'Create it and merge later', 'Ask the resident to sign up', 'Copy another patient’s profile'] },
        { q: 'Demographics in TC must match…', options: ['The PCC face sheet', 'Last month’s spreadsheet', 'What the facility told you verbally', 'The billing invoice'] }
      ] },
    { id: 'm4-enrollment', title: 'Enrollment and Consent, Initial Pt Assessment', minutes: 15,
      summary: 'Record enrollment and consent, then complete the initial assessment that sets the baseline.',
      task: 'List, in order, the steps to enroll a resident in TC, record consent and complete the initial assessment.',
      quiz: [
        { q: 'When must consent be documented?', options: ['Before CCM services are billed', 'Within a year', 'Only if the resident asks', 'After the first claim is paid'] },
        { q: 'The initial assessment establishes…', options: ['The resident’s baseline for future monthly reviews', 'The billing amount', 'The facility’s staffing', 'The discharge date'] }
      ] },
    { id: 'm4-clinical-data', title: 'Updating Clinical Data', minutes: 12,
      summary: 'Keep conditions, medications and allergies in TC in line with the current PCC chart.',
      quiz: [
        { q: 'The medication list in TC should match…', options: ['Current active orders in PCC', 'The admission medication list', 'Last month’s TC list', 'The pharmacy’s catalogue'] },
        { q: 'A medication was discontinued in PCC. In TC you…', options: ['Remove it or mark it inactive', 'Leave it as active', 'Add a duplicate entry', 'Ignore it until next quarter'] }
      ] },
    { id: 'm4-monthly-review', title: 'Documenting the Monthly Clinical Review', minutes: 15,
      summary: 'Capture what changed this month: vitals, labs, events and orders, in the review template.',
      task: 'Write the monthly review summary for the training resident: changes since last month, abnormal results and new orders.',
      quiz: [
        { q: 'The monthly review focuses on…', options: ['What changed since the last review', 'Repeating the admission history', 'Billing totals', 'Facility news'] },
        { q: 'A new hospital visit this month should be…', options: ['Documented with date and reason', 'Left for next month', 'Recorded only if the resident mentions it', 'Skipped if discharged'] }
      ] },
    { id: 'm4-gbis', title: 'GBIs and Problem Note', minutes: 12,
      summary: 'Link Goals, Barriers and Interventions to each problem and carry the Problem Note into TC.',
      task: 'For one problem (e.g. diabetes), write one measurable goal, one barrier and one intervention.',
      quiz: [
        { q: 'GBI stands for…', options: ['Goals, Barriers, Interventions', 'General Baseline Information', 'Glucose, BP, Intake', 'Guided Billing Index'] },
        { q: 'A well-written goal is…', options: ['Specific and measurable', 'Broad and open-ended', 'Copied from another resident', 'Written without a timeframe'] }
      ] },
    { id: 'm4-logtime', title: 'LogTime and Extracting the File', minutes: 10,
      summary: 'Log time accurately against the month and export the completed file.',
      quiz: [
        { q: 'Time logged in TC must reflect…', options: ['The actual time spent on that resident', 'A standard 20 minutes for everyone', 'Time estimated at month end', 'Time spent on any resident'] },
        { q: 'When do you extract the file?', options: ['After the review is complete and saved', 'Before starting the review', 'Only at quarter end', 'Whenever the system is open'] }
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
