#!/usr/bin/env node
/**
 * Creates a parent-research survey on Tally.so via the Tally API.
 *
 * WHY A SCRIPT: the Claude Code session that generated this could not
 * reach api.tally.so (network egress policy), so it could not run or
 * verify the call. Run this anywhere with open internet:
 *
 *     export TALLY_API_KEY=tly-xxxxxxxx   # your key (rotate the old one!)
 *     node scripts/create-tally-poll.mjs
 *
 * Requires Node 18+ (built-in fetch). Prints the created form's edit +
 * share URLs on success, or the full API error body on failure.
 *
 * NOTE: Tally's block schema is intricate and was written from their
 * documented model without live verification. If the API returns a 400,
 * paste the error back and it can be corrected quickly — the question
 * content below is the part that matters and is easy to re-map.
 */

import { randomUUID } from 'node:crypto';

const API_KEY = process.env.TALLY_API_KEY;
if (!API_KEY) {
  console.error('✗ Set TALLY_API_KEY first:  export TALLY_API_KEY=tly-...');
  process.exit(1);
}

// ---- The survey content (edit freely) -------------------------------
const FORM_NAME = 'How are you teaching your child to read the Qur’an?';

const QUESTIONS = [
  {
    title: 'How are you teaching your little one (under 7) to read the Qur’an right now?',
    multi: true,
    options: [
      'Family member teaches at home (parent / grandparent)',
      'Madrasa / maktab (in person)',
      'Online Quran tutor (1-on-1)',
      'Physical Qaida book (Noorani / Madani)',
      'An app or YouTube',
      'Not started yet / looking for a way',
    ],
  },
  {
    title: 'How old is the child you’re teaching?',
    multi: false,
    options: ['2–3', '4–5', '6–7', '8+'],
  },
  {
    title: 'What’s the hardest part of teaching them to read Qur’an?',
    multi: true,
    options: [
      'Keeping them interested / sitting still',
      'Correct pronunciation (makharij / tajweed)',
      'My own time & consistency',
      'Knowing what comes next (the order)',
      'Joining letters & harakat (after the alphabet)',
      'It’s going fine — no big struggles',
    ],
  },
  {
    title: 'If you use an app: which one, and what do you wish it did better?',
    open: true,
  },
];

// ---- Build Tally blocks ---------------------------------------------
const blocks = [];

// Form title block
blocks.push({
  uuid: randomUUID(),
  type: 'FORM_TITLE',
  groupUuid: randomUUID(),
  groupType: 'TEXT',
  payload: { title: FORM_NAME },
});

for (const q of QUESTIONS) {
  // Question heading
  const titleGroup = randomUUID();
  blocks.push({
    uuid: randomUUID(),
    type: 'TITLE',
    groupUuid: titleGroup,
    groupType: 'QUESTION',
    payload: { title: q.title },
  });

  if (q.open) {
    blocks.push({
      uuid: randomUUID(),
      type: 'TEXTAREA',
      groupUuid: randomUUID(),
      groupType: 'INPUT_TEXTAREA',
      payload: { isRequired: false, placeholder: 'Optional — type here' },
    });
    continue;
  }

  // Multiple-choice options share one group
  const optionGroup = randomUUID();
  q.options.forEach((text, i) => {
    blocks.push({
      uuid: randomUUID(),
      type: 'MULTIPLE_CHOICE_OPTION',
      groupUuid: optionGroup,
      groupType: 'MULTIPLE_CHOICE',
      payload: {
        index: i,
        text,
        isFirst: i === 0,
        isLast: i === q.options.length - 1,
        allowMultiple: !!q.multi,
        isRequired: false,
      },
    });
  });
}

// ---- Create the form -------------------------------------------------
const res = await fetch('https://api.tally.so/forms', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ status: 'PUBLISHED', name: FORM_NAME, blocks }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`✗ Tally API ${res.status}:\n${text}`);
  process.exit(1);
}

const form = JSON.parse(text);
console.log('✓ Form created!');
console.log('  id:    ', form.id);
console.log('  edit:  ', `https://tally.so/forms/${form.id}/edit`);
console.log('  share: ', form.id ? `https://tally.so/r/${form.id}` : '(check dashboard)');
