import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database | null = null

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS templates (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  title     TEXT    NOT NULL,
  content   TEXT    NOT NULL,
  category  TEXT,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used INTEGER
);

CREATE VIRTUAL TABLE IF NOT EXISTS templates_fts USING fts5(
  title,
  content,
  content='templates',
  content_rowid='id',
  tokenize='unicode61'
);

CREATE TRIGGER IF NOT EXISTS templates_ai
  AFTER INSERT ON templates BEGIN
    INSERT INTO templates_fts(rowid, title, content)
    VALUES (new.id, new.title, new.content);
  END;

CREATE TRIGGER IF NOT EXISTS templates_ad
  AFTER DELETE ON templates BEGIN
    INSERT INTO templates_fts(templates_fts, rowid, title, content)
    VALUES ('delete', old.id, old.title, old.content);
  END;

CREATE TRIGGER IF NOT EXISTS templates_au
  AFTER UPDATE ON templates BEGIN
    INSERT INTO templates_fts(templates_fts, rowid, title, content)
    VALUES ('delete', old.id, old.title, old.content);
    INSERT INTO templates_fts(rowid, title, content)
    VALUES (new.id, new.title, new.content);
  END;
`

const SEED_DATA = [
  {
    title: 'History (General)',
    category: 'Medical',
    content: `PC:  __COMPLAINT__ - __DURATION__
HPC:

ODQ:

PMHX: HPT-, DM-, PREV SURGERY-, TRANSFUSION-, PREV ADMISSION-

DHX: CURR MEDS: __MEDICATIONS__
     OTC: , HERBAL: , ALLERGIES: __ALLERGIES__

FHX: HPT, DM

SHX: A __OCCUPATION__, LIVES AT __LOCATION__ WITH __HOUSEHOLD__
     ALCOHOL: , SMOKING: , RECREATIONAL DRUGS:

ROS: CNS-, CVS-, RESP-, GIT-, GUS-, MSS-, SKIN-`,
  },
  {
    title: 'Emergency History',
    category: 'Medical',
    content: `PRESENTING COMPLAINT: __COMPLAINT__
ONSET: __ONSET__ | DURATION: __DURATION__

HPC:

Vitals on arrival:
  BP: __BP__  HR: __HR__  RR: __RR__  Temp: __TEMP__  SpO2: __SPO2__
  GCS: __GCS__/15
  Mode of arrival: __TRANSPORT__

PMHX: __PMHX__

DHX: __MEDICATIONS__ | ALLERGIES: __ALLERGIES__

PRIMARY SURVEY:
  Airway: Patent / Compromised
  Breathing: __BREATHING__
  Circulation: HR __HR__  BP __BP__  CRT < 2s / > 2s
  Disability: GCS __GCS__  PERLA: Y / N
  Exposure: __FINDINGS__

INITIAL MANAGEMENT:
  IV access:
  Fluids:
  Bloods: FBC, U&E, LFTs, Coags, __BLOODS__
  Imaging: __IMAGING__`,
  },
  {
    title: 'Pain History (SOCRATES)',
    category: 'Medical',
    content: `PAIN ASSESSMENT — SOCRATES

Site:         __SITE__
Onset:        __ONSET__ (__DURATION__ ago)
Character:    __CHARACTER__ (sharp / dull / burning / cramping / throbbing)
Radiation:    __RADIATION__
Associations: N&V- , SOB- , Diaphoresis- , __ASSOCIATIONS__
Timing:       __TIMING__ (constant / intermittent / episodic)
Exacerbating: __EXACERBATING__
Relieving:    __RELIEVING__
Severity:     __SEVERITY_REST__/10 at rest, __SEVERITY_ACTIVE__/10 on activity

Analgesia tried: __ANALGESIA__`,
  },
  {
    title: 'Physical Examination',
    category: 'Medical',
    content: `PHYSICAL EXAMINATION — __SYSTEM__

General: __GENERAL_APPEARANCE__
Vitals: BP __BP__ | HR __HR__ | RR __RR__ | Temp __TEMP__ | SpO2 __SPO2__ | BMI __BMI__

Inspection:
__INSPECTION__

Palpation:
__PALPATION__

Percussion:
__PERCUSSION__

Auscultation:
__AUSCULTATION__

IMPRESSION:
__IMPRESSION__

PLAN:
__PLAN__`,
  },
  {
    title: 'Discharge Summary',
    category: 'Medical',
    content: `DISCHARGE SUMMARY

Patient:            __PATIENT_NAME__
DOB: __DOB__        MRN: __MRN__
Admission: __ADMISSION_DATE__    Discharge: __DISCHARGE_DATE__
Admitting Consultant: __CONSULTANT__
Ward: __WARD__

ADMITTING DIAGNOSIS:  __ADMITTING_DIAGNOSIS__
DISCHARGE DIAGNOSIS:  __DISCHARGE_DIAGNOSIS__

SUMMARY OF ADMISSION:
__SUMMARY__

INVESTIGATIONS:
__INVESTIGATIONS__

MANAGEMENT:
__MANAGEMENT__

DISCHARGE MEDICATIONS:
__DISCHARGE_MEDS__

FOLLOW-UP:
  GP:         __GP_FOLLOWUP__
  Specialist: __SPECIALIST_FOLLOWUP__

PATIENT EDUCATION: __PATIENT_EDUCATION__`,
  },
  {
    title: 'Post-op Note',
    category: 'Surgical',
    content: `POST-OPERATIVE NOTE

Date/Time:    __DATETIME__
Surgeon:      __SURGEON__
Anaesthetist: __ANAESTHETIST__
Procedure:    __PROCEDURE__
Anaesthesia:  __ANAESTHESIA_TYPE__
Duration:     __DURATION__

OPERATIVE FINDINGS:
__FINDINGS__

COMPLICATIONS: __COMPLICATIONS__
SPECIMENS:     __SPECIMENS__

EBL:         __EBL__ mL
Fluids in:   __FLUIDS_IN__ mL    Urine out: __URINE_OUT__ mL

POST-OP ORDERS:
  Diet:           __DIET__
  Analgesia:      __ANALGESIA__
  DVT prophylaxis: __DVT_PROPHYLAXIS__
  Antibiotics:    __ANTIBIOTICS__
  Follow-up:      __FOLLOWUP__`,
  },
  {
    title: 'Referral Letter',
    category: 'Medical',
    content: `Dear Dr __RECIPIENT__,

Re: __PATIENT_NAME__, DOB __DOB__, MRN __MRN__

Thank you for seeing this __AGE__-year-old __SEX__ who presents with __COMPLAINT__.

HISTORY:
__HISTORY__

RELEVANT INVESTIGATIONS:
__INVESTIGATIONS__

CURRENT MEDICATIONS: __MEDICATIONS__
ALLERGIES: __ALLERGIES__

I would appreciate your expert opinion regarding __REFERRAL_REASON__.

__URGENCY__ referral. Please do not hesitate to contact me if you require further information.

Yours sincerely,
Dr __SENDER__
__SENDER_CONTACT__`,
  },
]

export function seedIfEmpty(database: Database.Database): void {
  const count = database.prepare('SELECT COUNT(*) as count FROM templates').get() as { count: number }
  if (count.count > 0) return

  const insert = database.prepare(
    'INSERT INTO templates (title, content, category) VALUES (?, ?, ?)'
  )

  const insertMany = database.transaction(() => {
    for (const seed of SEED_DATA) {
      insert.run(seed.title, seed.content, seed.category)
    }
  })

  insertMany()
}

export function getDatabase(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'cuedraft.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.exec(SCHEMA)
  seedIfEmpty(db)

  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

/** For testing only — inject a pre-configured in-memory database. */
export function _setDatabaseForTesting(testDb: Database.Database): void {
  db = testDb
}
