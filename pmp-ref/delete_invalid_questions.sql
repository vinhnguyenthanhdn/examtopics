
-- SQL to remove incomplete/Drag & Drop questions from the database
-- These questions are missing standard answers or are not supported.

BEGIN;

DELETE FROM pmp_questions WHERE id IN (
    '172',
    '352',
    '356',
    '606',
    '608',
    '609',
    '610',
    '611',
    '614',
    '615',
    '617',
    '619',
    '632',
    '673',
    '767',
    '871',
    '872',
    '873',
    '874',
    '1139',
    '1259',
    '1312',
    '1315',
    '1329',
    '1359',
    '1373',
    '1380',
    '1399'
);

COMMIT;
