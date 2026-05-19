#!/usr/bin/env node
/**
 * Converts cma_comp_details.json → cma_comp_details.csv
 * One row per property, columns for every CMA field.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, 'cma_comp_details.json');
const OUTPUT = path.join(__dirname, 'cma_comp_details.csv');

const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

// CSV helper — escape quotes
const esc = (v) => {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

const headers = [
  'Address',
  'Zip',
  'Style',
  'Exterior',
  'Roof',
  'Basement Total Sqft',
  'Basement Finished Sqft',
  'Basement Walkout',
  'Basement Notes',
  'Heating Type',
  'Heating Fuel',
  'Has AC',
  'Cooling Type',
  'Fireplace Count',
  'Fireplace Type',
  'Lot Features',
  'Extras',
  'Condition Notes',
  'Permits',
  'Listing Description',
  'Data Confidence',
  'Gaps',
  'Sources Checked',
];

const rows = data.properties.map(p => [
  p.address,
  p.zip,
  p.style,
  p.exterior,
  p.roof,
  p.basement.total_sqft,
  p.basement.finished_sqft,
  p.basement.walkout != null ? (p.basement.walkout ? 'Yes' : 'No') : '',
  p.basement.notes,
  p.heating.type,
  p.heating.fuel,
  p.cooling.has_ac != null ? (p.cooling.has_ac ? 'Yes' : 'No') : '',
  p.cooling.type,
  p.fireplace.count,
  p.fireplace.type,
  p.lot_features,
  p.extras.join('; '),
  p.condition_notes,
  p.permits.map(pm => `${pm.type}: ${pm.description} (${pm.issued || 'no date'})`).join('; '),
  p.listing_description?.slice(0, 300) || '',
  p.data_confidence,
  p.gaps.join('; '),
  p.sources_checked.join('; '),
]);

const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
fs.writeFileSync(OUTPUT, csv);
console.log(`Wrote ${rows.length} properties to ${OUTPUT}`);
