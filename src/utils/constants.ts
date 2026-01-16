export const VISIT_TYPES = [
  { value: 'PM', label: 'Preventive Maintenance (PM)' },
  { value: 'END', label: 'Generator Endurance (END)' },
  { value: 'RF', label: 'Refueling (RF)' },
  { value: 'PM+END', label: 'PM + Endurance' },
  { value: 'PM+RF', label: 'PM + Refueling' },
  { value: 'RF+END', label: 'Refueling + Endurance' },
  { value: 'PM+RF+END', label: 'PM + RF + Endurance' },
];

export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'critical', label: 'Critical', color: 'red' },
];

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'in_progress', label: 'In Progress', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
];

export const PHOTO_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'before', label: 'Before Work' },
  { value: 'during', label: 'During Work' },
  { value: 'after', label: 'After Work' },
  { value: 'issue', label: 'Issue/Problem' },
  { value: 'parts', label: 'Parts Used' },
];

export const REGIONS = [
  'Adamawa',
  'Centre',
  'East',
  'Far North',
  'Littoral',
  'North',
  'Northwest',
  'South',
  'Southwest',
  'West',
];

export const FUEL_URGENCY = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'critical', label: 'Critical', color: 'red' },
];

export const PHASE_TYPES = [
  { value: 'single', label: 'Single Phase' },
  { value: 'three', label: 'Three Phase' },
];

export const ENEO_STATUS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'intermittent', label: 'Intermittent' },
];

export const TOPOLOGY_OPTIONS = [
  { value: 'Grid-Gen', label: 'Grid-Gen' },
  { value: 'Hybrid-Gen', label: 'Hybrid-Gen' },
  { value: 'Solar-Gen', label: 'Solar-Gen' },
  { value: 'Solar-Hybrid-Gen', label: 'Solar-Hybrid-Gen' },
  { value: 'Gen-Only', label: 'Gen-Only' },
  { value: 'Grid-Only', label: 'Grid-Only' },
];

export const TANK_TYPES = [
  { value: 'EXT', label: 'External' },
  { value: 'INT', label: 'Internal' },
];

export const OUTDOOR_INDOOR_OPTIONS = [
  { value: 'Outdoor', label: 'Outdoor' },
  { value: 'Indoor', label: 'Indoor' },
  { value: 'Mixed', label: 'Indoor/Outdoor' },
];

export const GEN_BRANDS = [
  { value: 'MAHINDRA', label: 'Mahindra' },
  { value: 'MIKANO', label: 'Mikano' },
  { value: 'Jubaili Bros', label: 'Jubaili Bros' },
  { value: 'SDMO', label: 'SDMO' },
  { value: 'CATERPILLAR', label: 'Caterpillar' },
  { value: 'GB POWER', label: 'GB Power' },
  { value: 'COLOR CERAMICA', label: 'Color Ceramica' },
  { value: 'ELCOS', label: 'Elcos' },
  { value: 'Other', label: 'Other' },
];
