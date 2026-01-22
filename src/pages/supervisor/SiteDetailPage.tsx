import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiMapPin, 
  FiActivity, 
  FiTool, 
  FiDroplet, 
  FiHome, 
  FiZap, 
  FiInfo,
  FiSave,
  FiArrowLeft,
  FiAlertCircle
} from 'react-icons/fi';
import { supervisorAPI, sitesAPI } from '@/api';

interface Generator {
  generator_number: number;
  brand: string;
  serial_number: string;
  kva: number;
  dg_age: number;
  actual_running_hours: number;
  last_running_hours: number;
  maintenance_cycle: number;
  load_1ph: number;
  load_2ph: number;
  load_3ph: number;
  dc_load: number;
  cph: string;
}

interface PowerCabinet {
  type: string;
  number_of_rectifiers: number;
  capacity_of_one_rectifier: number;
}

interface Battery {
  number_of_batteries: number;
  battery_capacity: string;
  battery_autonomy: number;
  battery_threshold_to_start_dg: number;
}

interface FuelSystem {
  Type_de_Tank: string;
  Tank_Capacity_1: number;
  Tank_Length: number;
  Tank_Width: number;
  Tank_Height: number;
  Tank_Bottom: number;
  Fuel_SQ_Check: string;
  Previous_Fuel_Quantity: number;
  Fuel_Quantity_Found: number;
  Height_Found_CM_1: number;
  Height_Found_CM_2: number;
  Fuel_Quantity_Added: number;
  Fuel_Quantity_Consumed: number;
}

interface ShelterInfo {
  Sites_Configuration_Outdoor_Indoor: string;
  Sites_Power_Topology: string;
  Alarm_Cable_Status: string;
  Company_in_charge_of_Security: string;
}

interface GridInfo {
  Earthing_OHM: number;
  ENEO_Working: string;
  Phase_Type: string;
  N_PH1_Voltage: number;
  N_PH2_Voltage: number;
  N_PH3_Voltage: number;
  ENEO_Meter_Number: string;
  ENEO_SQ_Check: string;
  Actual_Index: number;
  Previous_Index: number;
  Consumed_KWA: number;
  Comments_on_Grid: string;
}

interface SiteDetail {
  _id: string;
  IHS_ID_SITE: string;
  Site_Name: string;
  Region: string;
  Sites_Priority: string;
  Sites_Type: string;
  Latitude: number;
  Longitude: number;
  GRATO_Cluster: string;
  Technician_Name: string;
  Technician_Contact: string;
  Actual_Date_Visit: string;
  Previous_Date_Visit: string;
  Type_of_Visit: string;
  Number_of_Generators: number;
  Generators_Details: Generator[];
  Rectifiers: PowerCabinet[];
  Batteries: Battery[];
  Type_de_Tank?: string;
  Tank_Capacity_1?: number;
  Tank_Length?: number;
  Tank_Width?: number;
  Tank_Height?: number;
  Tank_Bottom?: number;
  Fuel_SQ_Check?: string;
  Previous_Fuel_Quantity?: number;
  Fuel_Quantity_Found?: number;
  Height_Found_CM_1?: number;
  Height_Found_CM_2?: number;
  Fuel_Quantity_Added?: number;
  Fuel_Quantity_Consumed?: number;
  Sites_Configuration_Outdoor_Indoor?: string;
  Sites_Power_Topology?: string;
  Alarm_Cable_Status?: string;
  Company_in_charge_of_Security?: string;
  Earthing_OHM?: number;
  ENEO_Working?: string;
  Phase_Type?: string;
  N_PH1_Voltage?: number;
  N_PH2_Voltage?: number;
  N_PH3_Voltage?: number;
  ENEO_Meter_Number?: string;
  ENEO_SQ_Check?: string;
  Actual_Index?: number;
  Previous_Index?: number;
  Consumed_KWA?: number;
  Comments_on_Grid?: string;
  Power_Cab_1_Type?: string;
  DG_Age_Check?: string;
  Hour_Meter_Check?: string;
  Automatization_Status?: string;
  Visit_Comments?: string;
}

type TabType = 'overview' | 'generators' | 'power_cabinet' | 'fuel' | 'grid' | 'shelter';

const SiteDetailPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSiteDetails();
  }, [siteId]);

  const fetchSiteDetails = async () => {
    try {
      setLoading(true);
      const response = await supervisorAPI.getSiteDetails(siteId!);
      setSite(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch site details');
      console.error('Error fetching site:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!site) return;
    
    try {
      setSaving(true);
      await sitesAPI.updateSite(siteId!, site);
      setHasChanges(false);
      alert('Site details updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update site');
      console.error('Error updating site:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setSite(prev => prev ? { ...prev, [field]: value } : null);
    setHasChanges(true);
  };

  const updateGenerator = (index: number, field: string, value: any) => {
    if (!site) return;
    const newGenerators = [...(site.Generators_Details || [])];
    if (!newGenerators[index]) {
      newGenerators[index] = { generator_number: index + 1 } as Generator;
    }
    newGenerators[index] = { ...newGenerators[index], [field]: value };
    setSite({ ...site, Generators_Details: newGenerators });
    setHasChanges(true);
  };

  const updateRectifier = (index: number, field: string, value: any) => {
    if (!site) return;
    const newRectifiers = [...(site.Rectifiers || [])];
    if (!newRectifiers[index]) {
      newRectifiers[index] = {} as PowerCabinet;
    }
    newRectifiers[index] = { ...newRectifiers[index], [field]: value };
    setSite({ ...site, Rectifiers: newRectifiers });
    setHasChanges(true);
  };

  const updateBattery = (index: number, field: string, value: any) => {
    if (!site) return;
    const newBatteries = [...(site.Batteries || [])];
    if (!newBatteries[index]) {
      newBatteries[index] = {} as Battery;
    }
    newBatteries[index] = { ...newBatteries[index], [field]: value };
    setSite({ ...site, Batteries: newBatteries });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="text-red-600 text-xl" />
          <span className="text-red-800">{error || 'Site not found'}</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: FiInfo },
    { id: 'generators' as TabType, label: 'Generators', icon: FiActivity },
    { id: 'power_cabinet' as TabType, label: 'Power Cabinet', icon: FiZap },
    { id: 'fuel' as TabType, label: 'Fuel System', icon: FiDroplet },
    { id: 'grid' as TabType, label: 'Grid Power', icon: FiZap },
    { id: 'shelter' as TabType, label: 'Shelter', icon: FiHome }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/supervisor/sites')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{site.Site_Name}</h1>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              <FiMapPin className="text-sm" />
              {site.IHS_ID_SITE} • {site.Region}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            hasChanges && !saving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <FiSave />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="text-lg" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <OverviewTab site={site} updateField={updateField} />
        )}
        {activeTab === 'generators' && (
          <GeneratorsTab 
            generators={site.Generators_Details || []} 
            updateGenerator={updateGenerator}
            dgAgeCheck={site.DG_Age_Check}
            hourMeterCheck={site.Hour_Meter_Check}
            automatizationStatus={site.Automatization_Status}
            updateField={updateField}
          />
        )}
        {activeTab === 'power_cabinet' && (
          <PowerCabinetTab 
            rectifiers={site.Rectifiers || []}
            batteries={site.Batteries || []}
            cabinetType={site.Power_Cab_1_Type}
            alarmStatus={site.Alarm_Cable_Status}
            updateRectifier={updateRectifier}
            updateBattery={updateBattery}
            updateField={updateField}
          />
        )}
        {activeTab === 'fuel' && (
          <FuelTab site={site} updateField={updateField} />
        )}
        {activeTab === 'grid' && (
          <GridTab site={site} updateField={updateField} />
        )}
        {activeTab === 'shelter' && (
          <ShelterTab site={site} updateField={updateField} />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ site: SiteDetail; updateField: (field: string, value: any) => void }> = ({ site, updateField }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InputField label="Site Name" value={site.Site_Name} onChange={(v) => updateField('Site_Name', v)} />
      <InputField label="Site ID" value={site.IHS_ID_SITE} disabled />
      <InputField label="Region" value={site.Region} onChange={(v) => updateField('Region', v)} />
      <InputField label="Priority" value={site.Sites_Priority} onChange={(v) => updateField('Sites_Priority', v)} />
      <InputField label="Site Type" value={site.Sites_Type} onChange={(v) => updateField('Sites_Type', v)} />
      <InputField label="Cluster" value={site.GRATO_Cluster} onChange={(v) => updateField('GRATO_Cluster', v)} />
      <InputField label="Latitude" type="number" value={site.Latitude} onChange={(v) => updateField('Latitude', parseFloat(v))} />
      <InputField label="Longitude" type="number" value={site.Longitude} onChange={(v) => updateField('Longitude', parseFloat(v))} />
      <InputField label="Technician" value={site.Technician_Name} disabled />
      <InputField label="Last Visit" type="date" value={site.Actual_Date_Visit ? new Date(site.Actual_Date_Visit).toISOString().split('T')[0] : ''} disabled />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Visit Comments</label>
      <textarea
        value={site.Visit_Comments || ''}
        onChange={(e) => updateField('Visit_Comments', e.target.value)}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  </div>
);

// Generators Tab Component
const GeneratorsTab: React.FC<{ 
  generators: Generator[]; 
  updateGenerator: (index: number, field: string, value: any) => void;
  dgAgeCheck?: string;
  hourMeterCheck?: string;
  automatizationStatus?: string;
  updateField: (field: string, value: any) => void;
}> = ({ generators, updateGenerator, dgAgeCheck, hourMeterCheck, automatizationStatus, updateField }) => {
  const generatorCount = generators.length || 1;

  return (
    <div className="space-y-6">
      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <SelectField 
          label="DG Age Check" 
          value={dgAgeCheck || 'ok'} 
          onChange={(v) => updateField('DG_Age_Check', v)}
          options={[
            { value: 'ok', label: 'OK' },
            { value: 'PROB', label: 'Problem' }
          ]}
        />
        <SelectField 
          label="Hour Meter Check" 
          value={hourMeterCheck || 'ok'} 
          onChange={(v) => updateField('Hour_Meter_Check', v)}
          options={[
            { value: 'ok', label: 'OK' },
            { value: 'PROB', label: 'Problem' }
          ]}
        />
        <SelectField 
          label="Automatization Status" 
          value={automatizationStatus || 'OK'} 
          onChange={(v) => updateField('Automatization_Status', v)}
          options={[
            { value: 'OK', label: 'OK' },
            { value: 'NOK', label: 'Not OK' }
          ]}
        />
      </div>

      {/* Generator Details */}
      {Array.from({ length: generatorCount }).map((_, index) => {
        const gen = generators[index] || {} as Generator;
        return (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Generator {index + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Brand" value={gen.brand} onChange={(v) => updateGenerator(index, 'brand', v)} />
              <InputField label="Serial Number" value={gen.serial_number} onChange={(v) => updateGenerator(index, 'serial_number', v)} />
              <InputField label="KVA" type="number" value={gen.kva} onChange={(v) => updateGenerator(index, 'kva', parseFloat(v) || 0)} />
              <InputField label="DG Age (years)" type="number" value={gen.dg_age} onChange={(v) => updateGenerator(index, 'dg_age', parseFloat(v) || 0)} />
              <InputField label="Actual Running Hours" type="number" value={gen.actual_running_hours} onChange={(v) => updateGenerator(index, 'actual_running_hours', parseFloat(v) || 0)} />
              <InputField label="Last Running Hours" type="number" value={gen.last_running_hours} onChange={(v) => updateGenerator(index, 'last_running_hours', parseFloat(v) || 0)} />
              <InputField label="Maintenance Cycle" type="number" value={gen.maintenance_cycle} onChange={(v) => updateGenerator(index, 'maintenance_cycle', parseFloat(v) || 0)} />
              <InputField label="CPH" value={gen.cph} onChange={(v) => updateGenerator(index, 'cph', v)} />
              <InputField label="Load Phase 1 (A)" type="number" value={gen.load_1ph} onChange={(v) => updateGenerator(index, 'load_1ph', parseFloat(v) || 0)} />
              <InputField label="Load Phase 2 (A)" type="number" value={gen.load_2ph} onChange={(v) => updateGenerator(index, 'load_2ph', parseFloat(v) || 0)} />
              <InputField label="Load Phase 3 (A)" type="number" value={gen.load_3ph} onChange={(v) => updateGenerator(index, 'load_3ph', parseFloat(v) || 0)} />
              <InputField label="DC Load (A)" type="number" value={gen.dc_load} onChange={(v) => updateGenerator(index, 'dc_load', parseFloat(v) || 0)} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Power Cabinet Tab Component
const PowerCabinetTab: React.FC<{
  rectifiers: PowerCabinet[];
  batteries: Battery[];
  cabinetType?: string;
  alarmStatus?: string;
  updateRectifier: (index: number, field: string, value: any) => void;
  updateBattery: (index: number, field: string, value: any) => void;
  updateField: (field: string, value: any) => void;
}> = ({ rectifiers, batteries, cabinetType, alarmStatus, updateRectifier, updateBattery, updateField }) => (
  <div className="space-y-6">
    {/* Cabinet Info */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
      <InputField label="Power Cabinet Type" value={cabinetType} onChange={(v) => updateField('Power_Cab_1_Type', v)} />
      <InputField label="Alarm Cable Status" value={alarmStatus} onChange={(v) => updateField('Alarm_Cable_Status', v)} />
    </div>

    {/* Rectifiers */}
    <div>
      <h3 className="text-lg font-semibold mb-4">Rectifiers</h3>
      {rectifiers.length === 0 ? (
        <p className="text-gray-500">No rectifiers configured</p>
      ) : (
        rectifiers.map((rect, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Type" value={rect.type} onChange={(v) => updateRectifier(index, 'type', v)} />
              <InputField label="Number of Rectifiers" type="number" value={rect.number_of_rectifiers} onChange={(v) => updateRectifier(index, 'number_of_rectifiers', parseInt(v) || 0)} />
              <InputField label="Capacity per Rectifier" type="number" value={rect.capacity_of_one_rectifier} onChange={(v) => updateRectifier(index, 'capacity_of_one_rectifier', parseFloat(v) || 0)} />
            </div>
          </div>
        ))
      )}
    </div>

    {/* Batteries */}
    <div>
      <h3 className="text-lg font-semibold mb-4">Batteries</h3>
      {batteries.length === 0 ? (
        <p className="text-gray-500">No batteries configured</p>
      ) : (
        batteries.map((battery, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Number of Batteries" type="number" value={battery.number_of_batteries} onChange={(v) => updateBattery(index, 'number_of_batteries', parseInt(v) || 0)} />
              <InputField label="Battery Capacity" value={battery.battery_capacity} onChange={(v) => updateBattery(index, 'battery_capacity', v)} />
              <InputField label="Battery Autonomy (hrs)" type="number" value={battery.battery_autonomy} onChange={(v) => updateBattery(index, 'battery_autonomy', parseFloat(v) || 0)} />
              <InputField label="DG Start Threshold (V)" type="number" value={battery.battery_threshold_to_start_dg} onChange={(v) => updateBattery(index, 'battery_threshold_to_start_dg', parseFloat(v) || 0)} />
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Fuel Tab Component
const FuelTab: React.FC<{ site: SiteDetail; updateField: (field: string, value: any) => void }> = ({ site, updateField }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SelectField 
        label="Tank Type" 
        value={site.Type_de_Tank} 
        onChange={(v) => updateField('Type_de_Tank', v)}
        options={[
          { value: 'INT', label: 'Internal' },
          { value: 'EXT', label: 'External' },
          { value: 'underground', label: 'Underground' },
          { value: 'surface', label: 'Surface' },
          { value: 'mobile', label: 'Mobile' }
        ]}
      />
      <SelectField 
        label="Fuel System Check" 
        value={site.Fuel_SQ_Check} 
        onChange={(v) => updateField('Fuel_SQ_Check', v)}
        options={[
          { value: 'OK', label: 'OK' },
          { value: 'ok', label: 'OK' },
          { value: 'PROB', label: 'Problem' }
        ]}
      />
      <InputField label="Tank Capacity (L)" type="number" value={site.Tank_Capacity_1} onChange={(v) => updateField('Tank_Capacity_1', parseFloat(v) || 0)} />
      <InputField label="Tank Length (m)" type="number" value={site.Tank_Length} onChange={(v) => updateField('Tank_Length', parseFloat(v) || 0)} />
      <InputField label="Tank Width (m)" type="number" value={site.Tank_Width} onChange={(v) => updateField('Tank_Width', parseFloat(v) || 0)} />
      <InputField label="Tank Height (m)" type="number" value={site.Tank_Height} onChange={(v) => updateField('Tank_Height', parseFloat(v) || 0)} />
      <InputField label="Tank Bottom (m)" type="number" value={site.Tank_Bottom} onChange={(v) => updateField('Tank_Bottom', parseFloat(v) || 0)} />
      <InputField label="Previous Fuel Quantity (L)" type="number" value={site.Previous_Fuel_Quantity} onChange={(v) => updateField('Previous_Fuel_Quantity', parseFloat(v) || 0)} />
      <InputField label="Fuel Quantity Found (L)" type="number" value={site.Fuel_Quantity_Found} onChange={(v) => updateField('Fuel_Quantity_Found', parseFloat(v) || 0)} />
      <InputField label="Height Found 1 (cm)" type="number" value={site.Height_Found_CM_1} onChange={(v) => updateField('Height_Found_CM_1', parseFloat(v) || 0)} />
      <InputField label="Height Found 2 (cm)" type="number" value={site.Height_Found_CM_2} onChange={(v) => updateField('Height_Found_CM_2', parseFloat(v) || 0)} />
      <InputField label="Fuel Quantity Added (L)" type="number" value={site.Fuel_Quantity_Added} onChange={(v) => updateField('Fuel_Quantity_Added', parseFloat(v) || 0)} />
      <InputField label="Fuel Consumed (L)" type="number" value={site.Fuel_Quantity_Consumed} onChange={(v) => updateField('Fuel_Quantity_Consumed', parseFloat(v) || 0)} />
    </div>
  </div>
);

// Grid Tab Component
const GridTab: React.FC<{ site: SiteDetail; updateField: (field: string, value: any) => void }> = ({ site, updateField }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputField label="Earthing (OHM)" type="number" value={site.Earthing_OHM} onChange={(v) => updateField('Earthing_OHM', parseFloat(v) || 0)} />
      <SelectField 
        label="ENEO Working" 
        value={site.ENEO_Working} 
        onChange={(v) => updateField('ENEO_Working', v)}
        options={[
          { value: 'YES', label: 'Yes' },
          { value: 'NO', label: 'No' }
        ]}
      />
      <SelectField 
        label="Phase Type" 
        value={site.Phase_Type} 
        onChange={(v) => updateField('Phase_Type', v)}
        options={[
          { value: 'TRI', label: 'Three Phase' },
          { value: 'Mono', label: 'Single Phase' },
          { value: 'single', label: 'Single' },
          { value: 'three', label: 'Three' }
        ]}
      />
      <InputField label="ENEO Meter Number" value={site.ENEO_Meter_Number} onChange={(v) => updateField('ENEO_Meter_Number', v)} />
      <SelectField 
        label="ENEO System Check" 
        value={site.ENEO_SQ_Check} 
        onChange={(v) => updateField('ENEO_SQ_Check', v)}
        options={[
          { value: 'OK', label: 'OK' },
          { value: 'ok', label: 'OK' },
          { value: 'PROB', label: 'Problem' }
        ]}
      />
      <InputField label="N-PH1 Voltage (V)" type="number" value={site.N_PH1_Voltage} onChange={(v) => updateField('N_PH1_Voltage', parseFloat(v) || 0)} />
      <InputField label="N-PH2 Voltage (V)" type="number" value={site.N_PH2_Voltage} onChange={(v) => updateField('N_PH2_Voltage', parseFloat(v) || 0)} />
      <InputField label="N-PH3 Voltage (V)" type="number" value={site.N_PH3_Voltage} onChange={(v) => updateField('N_PH3_Voltage', parseFloat(v) || 0)} />
      <InputField label="Actual Index" type="number" value={site.Actual_Index} onChange={(v) => updateField('Actual_Index', parseFloat(v) || 0)} />
      <InputField label="Previous Index" type="number" value={site.Previous_Index} onChange={(v) => updateField('Previous_Index', parseFloat(v) || 0)} />
      <InputField label="Consumed KWA" type="number" value={site.Consumed_KWA} onChange={(v) => updateField('Consumed_KWA', parseFloat(v) || 0)} />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Comments on Grid</label>
      <textarea
        value={site.Comments_on_Grid || ''}
        onChange={(e) => updateField('Comments_on_Grid', e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  </div>
);

// Shelter Tab Component
const ShelterTab: React.FC<{ site: SiteDetail; updateField: (field: string, value: any) => void }> = ({ site, updateField }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SelectField 
        label="Configuration" 
        value={site.Sites_Configuration_Outdoor_Indoor} 
        onChange={(v) => updateField('Sites_Configuration_Outdoor_Indoor', v)}
        options={[
          { value: 'Indoor', label: 'Indoor' },
          { value: 'Outdoor', label: 'Outdoor' },
          { value: 'Mixed', label: 'Mixed' }
        ]}
      />
      <InputField label="Power Topology" value={site.Sites_Power_Topology} onChange={(v) => updateField('Sites_Power_Topology', v)} />
      <InputField label="Alarm Cable Status" value={site.Alarm_Cable_Status} onChange={(v) => updateField('Alarm_Cable_Status', v)} />
      <InputField label="Security Company" value={site.Company_in_charge_of_Security} onChange={(v) => updateField('Company_in_charge_of_Security', v)} />
    </div>
  </div>
);

// Reusable Input Component
const InputField: React.FC<{
  label: string;
  value?: any;
  type?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}> = ({ label, value, type = 'text', onChange, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      }`}
    />
  </div>
);

// Reusable Select Component
const SelectField: React.FC<{
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}> = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">Select...</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default SiteDetailPage;
