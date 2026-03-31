import React from 'react';
import { Badge } from './Badge';
import { PhotoGallery } from './PhotoGallery';
import { formatDate, formatDateTime } from '../../utils/formatters';

interface ReportDetailViewProps {
  report: any;
}

export const ReportDetailView: React.FC<ReportDetailViewProps> = ({ report }) => {
  if (!report) return null;

  const checks = report.equipment_checks || {};
  const entry = Array.isArray(report.site_entries)
    ? report.site_entries
        .slice()
        .sort((a: any, b: any) => new Date(b.entry_time || 0).getTime() - new Date(a.entry_time || 0).getTime())[0]
    : null;

  const renderSectionHeader = (title: string, icon: string) => (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b-2 border-blue-500 flex items-center">
      <span className="text-2xl mr-3">{icon}</span>
      <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
    </div>
  );

  const renderField = (label: string, value: any, type: 'text' | 'boolean' | 'status' = 'text', trueLabel = 'Yes', falseLabel = 'No') => {
    if (value === undefined || value === null || value === '') return null;

    let content = value;
    if (type === 'boolean') {
      content = (
        <Badge variant={value ? 'green' : 'red'} size="sm">
          {value ? trueLabel : falseLabel}
        </Badge>
      );
    } else if (type === 'status') {
      // Assuming boolean status often means OK (true) vs Not OK (false)
      content = (
        <Badge variant={value ? 'green' : 'red'} size="sm">
          {value ? 'OK' : 'Not OK'}
        </Badge>
      );
    }

    return (
      <div className="flex flex-col mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-medium text-gray-900">{content}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
        {/* Overview Section */}
          <div id="overview" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Visit Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderField('Site Name', report.site_details?.Site_Name || report.site_name)}
          {renderField('Site ID', report.site_id)}
          {renderField('Technician', report.technician?.fullName || report.technician_name)}
          {renderField('Date', formatDate(report.visit_date))}
          {renderField('Visit Type', <Badge variant="blue">{report.visit_type}</Badge>)}
          {renderField('Priority', (
             <Badge variant={['high','critical'].includes(report.priority) ? 'red' : 'gray'}>
               {report.priority}
             </Badge>
          ))}
          {renderField('Status', <Badge variant="blue">{report.status}</Badge>)}
          {renderField('Entry Time', formatDateTime(entry?.entry_time))}
          {renderField('Exit Time', formatDateTime(entry?.exit_time))}
        </div>
        {report.work_performed && (
          <div className="mt-4">
             {renderField('Work Performed', report.work_performed)}
          </div>
        )}
      </div>

      {/* Generator Checks */}
      {checks.generator_checks && Array.isArray(checks.generator_checks) && checks.generator_checks.length > 0 && (
        <div id="generator" className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {renderSectionHeader('Generator Inspection', '⚙️')}
          <div className="p-6 space-y-8">
            {checks.generator_checks.map((gen: any, idx: number) => (
              <div key={idx} className="border-b last:border-0 pb-8 last:pb-0">
                <div className="bg-blue-50 px-4 py-2 rounded-lg mb-4">
                  <h4 className="font-bold text-blue-900 text-base">Generator #{idx + 1}</h4>
                </div>

                {/* Status Checks */}
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Equipment Status</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(gen.batteryStatus !== undefined || gen.battery_status !== undefined) && renderField('Battery Check', gen.batteryStatus ?? gen.battery_status, 'status')}
                    {(gen.fanBeltStatus !== undefined || gen.fan_belt_status !== undefined) && renderField('Fan Belt', gen.fanBeltStatus ?? gen.fan_belt_status, 'status')}
                    {(gen.radiatorStatus !== undefined || gen.radiator_status !== undefined) && renderField('Radiator', gen.radiatorStatus ?? gen.radiator_status, 'status')}
                    {(gen.coolantStatus !== undefined || gen.coolant_status !== undefined) && renderField('Coolant Level', gen.coolantStatus ?? gen.coolant_status, 'status')}
                  </div>
                </div>

                {/* Additional Generator Checks */}
                {(gen.runningHours || gen.running_hours ||
                  gen.fuelFilterChanged !== undefined || gen.fuel_filter_changed !== undefined ||
                  gen.oilFilterChanged !== undefined || gen.oil_filter_changed !== undefined ||
                  gen.airFilterChanged !== undefined || gen.air_filter_changed !== undefined ||
                  gen.oilLevelMax !== undefined || gen.oil_level_max !== undefined ||
                  gen.oilQualityChecked !== undefined || gen.oil_quality_checked !== undefined ||
                  gen.fuelLeakageChecked !== undefined || gen.fuel_leakage_checked !== undefined ||
                  gen.alarmsStatusChecked !== undefined || gen.alarms_status_checked !== undefined
                ) && (
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Additional Generator Checks</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(gen.runningHours || gen.running_hours) && renderField('Running Hours', gen.runningHours ?? gen.running_hours)}
                      {(gen.fuelFilterChanged !== undefined || gen.fuel_filter_changed !== undefined) && renderField('Fuel Filter Changed', gen.fuelFilterChanged ?? gen.fuel_filter_changed, 'boolean')}
                      {(gen.oilFilterChanged !== undefined || gen.oil_filter_changed !== undefined) && renderField('Oil Filter Changed', gen.oilFilterChanged ?? gen.oil_filter_changed, 'boolean')}
                      {(gen.airFilterChanged !== undefined || gen.air_filter_changed !== undefined) && renderField('Air Filter Changed', gen.airFilterChanged ?? gen.air_filter_changed, 'boolean')}
                      {(gen.oilLevelMax !== undefined || gen.oil_level_max !== undefined) && renderField('Oil Level Max', gen.oilLevelMax ?? gen.oil_level_max, 'boolean')}
                      {(gen.oilQualityChecked !== undefined || gen.oil_quality_checked !== undefined) && renderField('Oil Quality Checked', gen.oilQualityChecked ?? gen.oil_quality_checked, 'boolean')}
                      {(gen.fuelLeakageChecked !== undefined || gen.fuel_leakage_checked !== undefined) && renderField('Fuel Leakage Checked', gen.fuelLeakageChecked ?? gen.fuel_leakage_checked, 'boolean')}
                      {(gen.alarmsStatusChecked !== undefined || gen.alarms_status_checked !== undefined) && renderField('Alarms Status Checked', gen.alarmsStatusChecked ?? gen.alarms_status_checked, 'boolean')}
                    </div>
                  </div>
                )}

                {(gen.batteryStatusComment || gen.battery_status_comment ||
                  gen.fanBeltStatusComment || gen.fan_belt_status_comment ||
                  gen.radiatorStatusComment || gen.radiator_status_comment ||
                  gen.coolantStatusComment || gen.coolant_status_comment ||
                  gen.fuelFilterChangedComment || gen.fuel_filter_changed_comment ||
                  gen.oilFilterChangedComment || gen.oil_filter_changed_comment ||
                  gen.airFilterChangedComment || gen.air_filter_changed_comment ||
                  gen.oilLevelMaxComment || gen.oil_level_max_comment ||
                  gen.oilQualityCheckedComment || gen.oil_quality_checked_comment ||
                  gen.fuelLeakageCheckedComment || gen.fuel_leakage_checked_comment ||
                  gen.alarmsStatusCheckedComment || gen.alarms_status_checked_comment
                ) && (
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Issue Comments</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(gen.batteryStatusComment || gen.battery_status_comment) && renderField('Battery Comment', gen.batteryStatusComment ?? gen.battery_status_comment)}
                      {(gen.fanBeltStatusComment || gen.fan_belt_status_comment) && renderField('Fan Belt Comment', gen.fanBeltStatusComment ?? gen.fan_belt_status_comment)}
                      {(gen.radiatorStatusComment || gen.radiator_status_comment) && renderField('Radiator Comment', gen.radiatorStatusComment ?? gen.radiator_status_comment)}
                      {(gen.coolantStatusComment || gen.coolant_status_comment) && renderField('Coolant Comment', gen.coolantStatusComment ?? gen.coolant_status_comment)}
                      {(gen.fuelFilterChangedComment || gen.fuel_filter_changed_comment) && renderField('Fuel Filter Comment', gen.fuelFilterChangedComment ?? gen.fuel_filter_changed_comment)}
                      {(gen.oilFilterChangedComment || gen.oil_filter_changed_comment) && renderField('Oil Filter Comment', gen.oilFilterChangedComment ?? gen.oil_filter_changed_comment)}
                      {(gen.airFilterChangedComment || gen.air_filter_changed_comment) && renderField('Air Filter Comment', gen.airFilterChangedComment ?? gen.air_filter_changed_comment)}
                      {(gen.oilLevelMaxComment || gen.oil_level_max_comment) && renderField('Oil Level Comment', gen.oilLevelMaxComment ?? gen.oil_level_max_comment)}
                      {(gen.oilQualityCheckedComment || gen.oil_quality_checked_comment) && renderField('Oil Quality Comment', gen.oilQualityCheckedComment ?? gen.oil_quality_checked_comment)}
                      {(gen.fuelLeakageCheckedComment || gen.fuel_leakage_checked_comment) && renderField('Fuel Leakage Comment', gen.fuelLeakageCheckedComment ?? gen.fuel_leakage_checked_comment)}
                      {(gen.alarmsStatusCheckedComment || gen.alarms_status_checked_comment) && renderField('Alarms Comment', gen.alarmsStatusCheckedComment ?? gen.alarms_status_checked_comment)}
                    </div>
                  </div>
                )}
                
                {/* Readings */}
                {((gen.v1 || gen.v2 || gen.v3) || (gen.i1 || gen.i2 || gen.i3)) && (
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Electrical Readings</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(gen.v1 || gen.v2 || gen.v3) && (
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                          <p className="text-xs font-bold text-yellow-800 mb-3 flex items-center">
                            <span className="mr-2">⚡</span>
                            VOLTAGE READINGS
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                              <span className="text-xs text-gray-600 block mb-1">Phase 1</span>
                              <div className="text-lg font-bold text-gray-900">{gen.v1 || '--'}</div>
                              <span className="text-xs text-gray-500">Volts</span>
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-gray-600 block mb-1">Phase 2</span>
                              <div className="text-lg font-bold text-gray-900">{gen.v2 || '--'}</div>
                              <span className="text-xs text-gray-500">Volts</span>
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-gray-600 block mb-1">Phase 3</span>
                              <div className="text-lg font-bold text-gray-900">{gen.v3 || '--'}</div>
                              <span className="text-xs text-gray-500">Volts</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {(gen.i1 || gen.i2 || gen.i3) && (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                          <p className="text-xs font-bold text-blue-800 mb-3 flex items-center">
                            <span className="mr-2">🔋</span>
                            CURRENT READINGS
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                              <span className="text-xs text-gray-600 block mb-1">Phase 1</span>
                              <div className="text-lg font-bold text-gray-900">{gen.i1 || '--'}</div>
                              <span className="text-xs text-gray-500">Amps</span>
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-gray-600 block mb-1">Phase 2</span>
                              <div className="text-lg font-bold text-gray-900">{gen.i2 || '--'}</div>
                              <span className="text-xs text-gray-500">Amps</span>
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-gray-600 block mb-1">Phase 3</span>
                              <div className="text-lg font-bold text-gray-900">{gen.i3 || '--'}</div>
                              <span className="text-xs text-gray-500">Amps</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {gen.comments && (
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Observations</h5>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{gen.comments}</p>
                    </div>
                  </div>
                )}
                
                {/* Photos */}
                {gen.photos && gen.photos.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide flex items-center">
                      <span className="mr-2">📸</span>
                      Photos ({gen.photos.length})
                    </h5>
                    <PhotoGallery photos={gen.photos} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Power Cabinet Checks */}
      {checks.power_cabinet_checks && Array.isArray(checks.power_cabinet_checks) && checks.power_cabinet_checks.length > 0 && (
        <div id="power-cabinet" className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {renderSectionHeader('Power Cabinet', '🔌')}
          <div className="p-6 space-y-8">
            {checks.power_cabinet_checks.map((cab: any, idx: number) => (
              <div key={idx} className="border-b last:border-0 pb-8 last:pb-0">
                 <div className="bg-purple-50 px-4 py-2 rounded-lg mb-4">
                   <h4 className="font-bold text-purple-900 text-base">Cabinet #{idx + 1}</h4>
                 </div>

                 {(cab.rectifierSummary || cab.modulesFound || cab.modulesMissing || cab.rectifierTypeCapacity || cab.outputVoltage || cab.breakersChecked !== undefined || cab.cablingStatusGood !== undefined) && (
                   <div className="mb-6">
                     <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Rectifier Summary</h5>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {renderField('Modules Found', cab.rectifierSummary?.modulesFound ?? cab.modulesFound ?? cab.modules_found)}
                       {renderField('Modules Missing', cab.rectifierSummary?.modulesMissing ?? cab.modulesMissing ?? cab.modules_missing)}
                       {renderField('Type & Capacity', cab.rectifierSummary?.rectifierTypeCapacity ?? cab.rectifierTypeCapacity ?? cab.rectifier_type_capacity)}
                       {renderField('Output Voltage', cab.rectifierSummary?.outputVoltage ?? cab.outputVoltage ?? cab.output_voltage)}
                       {(cab.rectifierSummary?.breakersChecked !== undefined || cab.breakersChecked !== undefined || cab.breakers_checked !== undefined) && renderField('Breakers Checked', cab.rectifierSummary?.breakersChecked ?? cab.breakersChecked ?? cab.breakers_checked, 'boolean')}
                       {(cab.rectifierSummary?.cablingStatusGood !== undefined || cab.cablingStatusGood !== undefined || cab.cabling_status_good !== undefined) && renderField('Cabling Status Good', cab.rectifierSummary?.cablingStatusGood ?? cab.cablingStatusGood ?? cab.cabling_status_good, 'boolean')}
                     </div>
                   </div>
                 )}
                 
                 {/* Rectifiers */}
                 {cab.rectifiers && Array.isArray(cab.rectifiers) && cab.rectifiers.length > 0 && (
                   <div className="mb-6">
                     <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Rectifiers ({cab.rectifiers.length})</h5>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {cab.rectifiers.map((rect: any, rIdx: number) => (
                         <div key={rIdx} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                           <div className="flex justify-between items-center mb-3">
                             <span className="font-bold text-gray-700">Rectifier #{rIdx+1}</span>
                             {rect.capacitor && <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{rect.capacitor} kW</span>}
                           </div>
                           <div className="grid grid-cols-2 gap-3 mb-2">
                             <div>
                               <span className="text-xs text-gray-500 block mb-1">Status</span>
                               <Badge variant={rect.status ? 'green' : 'red'} size="sm">{rect.status ? 'OK' : 'Faulty'}</Badge>
                             </div>
                             <div>
                               <span className="text-xs text-gray-500 block mb-1">Cleanliness</span>
                               <Badge variant={rect.cleanliness ? 'green' : 'red'} size="sm">{rect.cleanliness ? 'Clean' : 'Dirty'}</Badge>
                             </div>
                           </div>
                           {(rect.statusComment || rect.status_comment || rect.cleanlinessComment || rect.cleanliness_comment) && (
                             <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                               {rect.statusComment || rect.status_comment ? (
                                 <p className="text-xs text-gray-700">Status: {rect.statusComment || rect.status_comment}</p>
                               ) : null}
                               {rect.cleanlinessComment || rect.cleanliness_comment ? (
                                 <p className="text-xs text-gray-700">Cleanliness: {rect.cleanlinessComment || rect.cleanliness_comment}</p>
                               ) : null}
                             </div>
                           )}
                           {rect.comments && (
                             <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                               <p className="text-xs text-gray-700 italic">{rect.comments}</p>
                             </div>
                           )}
                           {rect.photos && rect.photos.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 font-semibold mb-2">Photos ({rect.photos.length})</p>
                                <PhotoGallery photos={rect.photos} />
                              </div>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Batteries */}
                 {cab.batteries && Array.isArray(cab.batteries) && cab.batteries.length > 0 && (
                   <div className="mb-6">
                     <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Batteries ({cab.batteries.length})</h5>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                         {cab.batteries.map((bat: any, bIdx: number) => (
                             <div key={bIdx} className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                                <div className="font-bold text-green-900 mb-2">{bat.brand || 'Battery #' + (bIdx + 1)}</div>
                                <div className="text-sm text-gray-700">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-gray-600">Capacity:</span>
                                    <span className="font-semibold">{bat.capacity} Ah</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Autonomy:</span>
                                    <span className="font-semibold">{bat.autonomy} hrs</span>
                                  </div>
                                </div>
                             </div>
                         ))}
                     </div>
                   </div>
                 )}

                 {(cab.batterySummary || cab.outputChecked !== undefined || cab.autonomyTestDone !== undefined || cab.autonomyEstimated) && (
                   <div className="mb-6">
                     <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Battery Summary</h5>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {(cab.batterySummary?.outputChecked !== undefined || cab.outputChecked !== undefined || cab.output_checked !== undefined) && renderField('Output Checked', cab.batterySummary?.outputChecked ?? cab.outputChecked ?? cab.output_checked, 'boolean')}
                       {(cab.batterySummary?.autonomyTestDone !== undefined || cab.autonomyTestDone !== undefined || cab.autonomy_test_done !== undefined) && renderField('Autonomy Test Done', cab.batterySummary?.autonomyTestDone ?? cab.autonomyTestDone ?? cab.autonomy_test_done, 'boolean')}
                       {renderField('Autonomy Estimated', cab.batterySummary?.autonomyEstimated ?? cab.autonomyEstimated ?? cab.autonomy_estimated)}
                     </div>
                   </div>
                 )}

                 {/* Cooling & Controller */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cab.cooling && (
                         <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <h6 className="text-sm font-bold text-blue-900 mb-3 uppercase tracking-wide">🌡️ Cooling System</h6>
                            {cab.cooling.status !== undefined && (
                              <div className="mb-2">
                                <span className="text-xs text-gray-600 block mb-1">Status</span>
                                <Badge variant={cab.cooling.status ? 'green' : 'red'} size="sm">
                                  {cab.cooling.status ? 'OK' : 'Faulty'}
                                </Badge>
                              </div>
                            )}
                            {cab.cooling.comments && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-600 block mb-1">Notes</span>
                                <p className="text-sm text-gray-700">{cab.cooling.comments}</p>
                              </div>
                            )}
                         </div>
                    )}
                    {cab.controller && (
                         <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                            <h6 className="text-sm font-bold text-orange-900 mb-3 uppercase tracking-wide">🎛️ Controller</h6>
                            {cab.controller.status !== undefined && (
                              <div className="mb-2">
                                <span className="text-xs text-gray-600 block mb-1">Status</span>
                                <Badge variant={cab.controller.status ? 'green' : 'red'} size="sm">
                                  {cab.controller.status ? 'OK' : 'Faulty'}
                                </Badge>
                              </div>
                            )}
                            {cab.controller.comments && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-600 block mb-1">Notes</span>
                                <p className="text-sm text-gray-700">{cab.controller.comments}</p>
                              </div>
                            )}
                         </div>
                    )}
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid Checks */}
      {checks.grid_checks && (
        <div id="grid" className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
           {renderSectionHeader('Grid Power', '⚡')}
           <div className="p-6">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {(checks.grid_checks.gridIndex !== undefined || checks.grid_checks.grid_index !== undefined) &&
                renderField('Grid Index', checks.grid_checks.gridIndex ?? checks.grid_checks.grid_index)}
              {(checks.grid_checks.gridConnectedOperational !== undefined || checks.grid_checks.grid_connected_operational !== undefined) &&
                renderField('Grid Connected & Operational', checks.grid_checks.gridConnectedOperational ?? checks.grid_checks.grid_connected_operational, 'boolean')}
              {(checks.grid_checks.gridStable !== undefined || checks.grid_checks.grid_stable !== undefined) &&
                renderField('Grid Stable', checks.grid_checks.gridStable ?? checks.grid_checks.grid_stable, 'boolean')}
                {(checks.grid_checks.gridStatus !== undefined || checks.grid_checks.status !== undefined) && 
                  renderField('Grid Status', checks.grid_checks.gridStatus || checks.grid_checks.status, 'status')}
                {(checks.grid_checks.breakerStatus !== undefined || checks.grid_checks.breaker_status !== undefined) && 
                  renderField('Breaker Status', checks.grid_checks.breakerStatus || checks.grid_checks.breaker_status, 'status')}
             </div>
             {(checks.grid_checks.status_comment || checks.grid_checks.gridStatusComment || checks.grid_checks.breaker_status_comment || checks.grid_checks.breakerStatusComment || checks.grid_checks.grid_connected_operational_comment || checks.grid_checks.gridConnectedOperationalComment || checks.grid_checks.grid_stable_comment || checks.grid_checks.gridStableComment) && (
               <div className="mb-6">
                 <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Issue Comments</h5>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {(checks.grid_checks.status_comment || checks.grid_checks.gridStatusComment) && renderField('Grid Status Comment', checks.grid_checks.status_comment ?? checks.grid_checks.gridStatusComment)}
                   {(checks.grid_checks.breaker_status_comment || checks.grid_checks.breakerStatusComment) && renderField('Breaker Comment', checks.grid_checks.breaker_status_comment ?? checks.grid_checks.breakerStatusComment)}
                   {(checks.grid_checks.grid_connected_operational_comment || checks.grid_checks.gridConnectedOperationalComment) && renderField('Grid Connected Comment', checks.grid_checks.grid_connected_operational_comment ?? checks.grid_checks.gridConnectedOperationalComment)}
                   {(checks.grid_checks.grid_stable_comment || checks.grid_checks.gridStableComment) && renderField('Grid Stable Comment', checks.grid_checks.grid_stable_comment ?? checks.grid_checks.gridStableComment)}
                 </div>
               </div>
             )}
             {checks.grid_checks.meter_photos && checks.grid_checks.meter_photos.length > 0 && (
               <div className="border-t pt-6">
                 <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide flex items-center">
                   <span className="mr-2">📸</span>
                   Meter Photos ({checks.grid_checks.meter_photos.length})
                 </h5>
                 <PhotoGallery photos={checks.grid_checks.meter_photos} />
               </div>
             )}
           </div>
        </div>
      )}

      {/* Shelter Checks */}
      {checks.shelter_checks && (
        <div id="shelter" className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
           {renderSectionHeader('Shelter', '🏠')}
           <div className="p-6">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
               {(checks.shelter_checks.shelterStatus !== undefined || checks.shelter_checks.status !== undefined) &&
                 renderField('Shelter Status', checks.shelter_checks.shelterStatus || checks.shelter_checks.status, 'status')}
               {(checks.shelter_checks.doorStatus !== undefined || checks.shelter_checks.door_status !== undefined) &&
                 renderField('Door Status', checks.shelter_checks.doorStatus || checks.shelter_checks.door_status, 'status')}
               {(checks.shelter_checks.controllerStatus !== undefined || checks.shelter_checks.controller_status !== undefined) &&
                 renderField('Controller Status', checks.shelter_checks.controllerStatus ?? checks.shelter_checks.controller_status, 'status')}
               {checks.shelter_checks.temperature && (
                 <div className="flex flex-col">
                   <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Temperature</span>
                   <span className="text-2xl font-bold text-orange-600">{checks.shelter_checks.temperature}°C</span>
                 </div>
               )}
             </div>

             {(checks.shelter_checks.status_comment || checks.shelter_checks.shelterStatusComment || checks.shelter_checks.door_status_comment || checks.shelter_checks.doorStatusComment || checks.shelter_checks.controller_status_comment || checks.shelter_checks.controllerStatusComment) && (
               <div className="mb-6">
                 <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Issue Comments</h5>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {(checks.shelter_checks.status_comment || checks.shelter_checks.shelterStatusComment) && renderField('Shelter Comment', checks.shelter_checks.status_comment ?? checks.shelter_checks.shelterStatusComment)}
                   {(checks.shelter_checks.door_status_comment || checks.shelter_checks.doorStatusComment) && renderField('Door Comment', checks.shelter_checks.door_status_comment ?? checks.shelter_checks.doorStatusComment)}
                   {(checks.shelter_checks.controller_status_comment || checks.shelter_checks.controllerStatusComment) && renderField('Controller Comment', checks.shelter_checks.controller_status_comment ?? checks.shelter_checks.controllerStatusComment)}
                 </div>
               </div>
             )}
             
             {checks.shelter_checks.ac_units && Array.isArray(checks.shelter_checks.ac_units) && checks.shelter_checks.ac_units.length > 0 && (
               <div className="border-t pt-6">
                 <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Air Conditioners ({checks.shelter_checks.ac_units.length})</h5>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {checks.shelter_checks.ac_units.map((ac: any, i: number) => (
                        <div key={i} className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg border border-cyan-200 flex justify-between items-center">
                           <span className="font-semibold text-cyan-900">AC Unit #{i+1}</span>
                           <Badge variant={ac.status ? 'green' : 'red'} size="sm">{ac.status ? 'Working' : 'Faulty'}</Badge>
                        </div>
                    ))}
                 </div>
               </div>
             )}

             {(checks.shelter_checks.ac_type || checks.shelter_checks.internal_filter_cleaned !== undefined || checks.shelter_checks.outdoor_compressor_cleaned !== undefined || checks.shelter_checks.high_low_pressure_measured !== undefined || checks.shelter_checks.temperature_recorded || checks.shelter_checks.amps_measured !== undefined || checks.shelter_checks.condenser_evaporator_cleaned !== undefined || checks.shelter_checks.outdoor_fan_checked !== undefined) && (
               <div className="border-t pt-6">
                 <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">AC Maintenance</h5>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {checks.shelter_checks.ac_type && renderField('AC Type', checks.shelter_checks.ac_type)}
                   {(checks.shelter_checks.internal_filter_cleaned !== undefined) && renderField('Internal Filter Cleaned', checks.shelter_checks.internal_filter_cleaned, 'boolean')}
                   {(checks.shelter_checks.outdoor_compressor_cleaned !== undefined) && renderField('Outdoor Compressor Cleaned', checks.shelter_checks.outdoor_compressor_cleaned, 'boolean')}
                   {(checks.shelter_checks.high_low_pressure_measured !== undefined) && renderField('High/Low Pressure Measured', checks.shelter_checks.high_low_pressure_measured, 'boolean')}
                   {checks.shelter_checks.temperature_recorded && renderField('Recorded Temperature', checks.shelter_checks.temperature_recorded)}
                   {(checks.shelter_checks.amps_measured !== undefined) && renderField('Amps Measured', checks.shelter_checks.amps_measured, 'boolean')}
                   {(checks.shelter_checks.condenser_evaporator_cleaned !== undefined) && renderField('Condenser/Evaporator Cleaned', checks.shelter_checks.condenser_evaporator_cleaned, 'boolean')}
                   {(checks.shelter_checks.outdoor_fan_checked !== undefined) && renderField('Outdoor Fan Checked', checks.shelter_checks.outdoor_fan_checked, 'boolean')}
                 </div>
               </div>
             )}

             {(checks.shelter_checks.internal_filter_cleaned_comment || checks.shelter_checks.internalFilterCleanedComment || checks.shelter_checks.outdoor_compressor_cleaned_comment || checks.shelter_checks.outdoorCompressorCleanedComment || checks.shelter_checks.high_low_pressure_measured_comment || checks.shelter_checks.highLowPressureMeasuredComment || checks.shelter_checks.temperature_recorded_comment || checks.shelter_checks.temperatureRecordedComment || checks.shelter_checks.amps_measured_comment || checks.shelter_checks.ampsMeasuredComment || checks.shelter_checks.condenser_evaporator_cleaned_comment || checks.shelter_checks.condenserEvaporatorCleanedComment || checks.shelter_checks.outdoor_fan_checked_comment || checks.shelter_checks.outdoorFanCheckedComment) && (
               <div className="mt-4">
                 <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">AC Maintenance Comments</h5>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {(checks.shelter_checks.internal_filter_cleaned_comment || checks.shelter_checks.internalFilterCleanedComment) && renderField('Internal Filter Comment', checks.shelter_checks.internal_filter_cleaned_comment ?? checks.shelter_checks.internalFilterCleanedComment)}
                   {(checks.shelter_checks.outdoor_compressor_cleaned_comment || checks.shelter_checks.outdoorCompressorCleanedComment) && renderField('Outdoor Compressor Comment', checks.shelter_checks.outdoor_compressor_cleaned_comment ?? checks.shelter_checks.outdoorCompressorCleanedComment)}
                   {(checks.shelter_checks.high_low_pressure_measured_comment || checks.shelter_checks.highLowPressureMeasuredComment) && renderField('Pressure Comment', checks.shelter_checks.high_low_pressure_measured_comment ?? checks.shelter_checks.highLowPressureMeasuredComment)}
                   {(checks.shelter_checks.temperature_recorded_comment || checks.shelter_checks.temperatureRecordedComment) && renderField('Recorded Temp Comment', checks.shelter_checks.temperature_recorded_comment ?? checks.shelter_checks.temperatureRecordedComment)}
                   {(checks.shelter_checks.amps_measured_comment || checks.shelter_checks.ampsMeasuredComment) && renderField('Amps Comment', checks.shelter_checks.amps_measured_comment ?? checks.shelter_checks.ampsMeasuredComment)}
                   {(checks.shelter_checks.condenser_evaporator_cleaned_comment || checks.shelter_checks.condenserEvaporatorCleanedComment) && renderField('Condenser/Evaporator Comment', checks.shelter_checks.condenser_evaporator_cleaned_comment ?? checks.shelter_checks.condenserEvaporatorCleanedComment)}
                   {(checks.shelter_checks.outdoor_fan_checked_comment || checks.shelter_checks.outdoorFanCheckedComment) && renderField('Outdoor Fan Comment', checks.shelter_checks.outdoor_fan_checked_comment ?? checks.shelter_checks.outdoorFanCheckedComment)}
                 </div>
               </div>
             )}
           </div>
        </div>
      )}

      {/* Cleaning Checks */}
      {checks.cleaning_checks && (
        <div id="cleaning" className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
           {renderSectionHeader('Site Cleaning & Security', '🧹')}
           <div className="p-6">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {(checks.cleaning_checks.isClean !== undefined || checks.cleaning_checks.is_clean !== undefined) &&
                  renderField('Site Clean', checks.cleaning_checks.isClean || checks.cleaning_checks.is_clean, 'boolean', 'Yes', 'No')}
                {checks.cleaning_checks.spillage !== undefined &&
                  renderField('Spillage Present', checks.cleaning_checks.spillage, 'boolean', 'Yes', 'No')}
                {(checks.cleaning_checks.insideClean !== undefined || checks.cleaning_checks.inside_clean !== undefined) &&
                  renderField('Inside Clean', checks.cleaning_checks.insideClean ?? checks.cleaning_checks.inside_clean, 'boolean', 'Yes', 'No')}
                {(checks.cleaning_checks.outsidePerimeterClean !== undefined || checks.cleaning_checks.outside_perimeter_clean !== undefined) &&
                  renderField('Outside Perimeter Clean', checks.cleaning_checks.outsidePerimeterClean ?? checks.cleaning_checks.outside_perimeter_clean, 'boolean', 'Yes', 'No')}
                {(checks.cleaning_checks.shelterCleaned !== undefined || checks.cleaning_checks.shelter_cleaned !== undefined) &&
                  renderField('Shelter Cleaned', checks.cleaning_checks.shelterCleaned ?? checks.cleaning_checks.shelter_cleaned, 'boolean', 'Yes', 'No')}
                {(checks.cleaning_checks.outdoorEquipmentCleaned !== undefined || checks.cleaning_checks.outdoor_equipment_cleaned !== undefined) &&
                  renderField('Outdoor Equipment Cleaned', checks.cleaning_checks.outdoorEquipmentCleaned ?? checks.cleaning_checks.outdoor_equipment_cleaned, 'boolean', 'Yes', 'No')}
                {(checks.cleaning_checks.airBlowerUsed !== undefined || checks.cleaning_checks.air_blower_used !== undefined) &&
                  renderField('Air Blower Used', checks.cleaning_checks.airBlowerUsed ?? checks.cleaning_checks.air_blower_used, 'boolean', 'Yes', 'No')}
                {(checks.cleaning_checks.securityLight !== undefined || checks.cleaning_checks.security_light !== undefined) &&
                  renderField('Security Light', checks.cleaning_checks.securityLight || checks.cleaning_checks.security_light, 'boolean', 'Working', 'Faulty')}
                {(checks.cleaning_checks.guardPresent !== undefined || checks.cleaning_checks.guard_present !== undefined) &&
                  renderField('Security Guard', checks.cleaning_checks.guardPresent || checks.cleaning_checks.guard_present, 'boolean', 'Present', 'Absent')}
                {(checks.cleaning_checks.securityBox !== undefined || checks.cleaning_checks.security_box !== undefined) &&
                  renderField('Security Box', checks.cleaning_checks.securityBox || checks.cleaning_checks.security_box, 'boolean', 'Present', 'Absent')}
             </div>

             {(checks.cleaning_checks.is_clean_comment || checks.cleaning_checks.isCleanComment || checks.cleaning_checks.spillage_comment || checks.cleaning_checks.spillageComment || checks.cleaning_checks.security_light_comment || checks.cleaning_checks.securityLightComment || checks.cleaning_checks.guard_present_comment || checks.cleaning_checks.guardPresentComment || checks.cleaning_checks.security_box_comment || checks.cleaning_checks.securityBoxComment || checks.cleaning_checks.inside_clean_comment || checks.cleaning_checks.insideCleanComment || checks.cleaning_checks.outside_perimeter_clean_comment || checks.cleaning_checks.outsidePerimeterCleanComment || checks.cleaning_checks.shelter_cleaned_comment || checks.cleaning_checks.shelterCleanedComment || checks.cleaning_checks.outdoor_equipment_cleaned_comment || checks.cleaning_checks.outdoorEquipmentCleanedComment || checks.cleaning_checks.air_blower_used_comment || checks.cleaning_checks.airBlowerUsedComment) && (
               <div className="mb-6">
                 <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Issue Comments</h5>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {(checks.cleaning_checks.is_clean_comment || checks.cleaning_checks.isCleanComment) && renderField('Site Clean Comment', checks.cleaning_checks.is_clean_comment ?? checks.cleaning_checks.isCleanComment)}
                   {(checks.cleaning_checks.spillage_comment || checks.cleaning_checks.spillageComment) && renderField('Spillage Comment', checks.cleaning_checks.spillage_comment ?? checks.cleaning_checks.spillageComment)}
                   {(checks.cleaning_checks.security_light_comment || checks.cleaning_checks.securityLightComment) && renderField('Security Light Comment', checks.cleaning_checks.security_light_comment ?? checks.cleaning_checks.securityLightComment)}
                   {(checks.cleaning_checks.guard_present_comment || checks.cleaning_checks.guardPresentComment) && renderField('Guard Comment', checks.cleaning_checks.guard_present_comment ?? checks.cleaning_checks.guardPresentComment)}
                   {(checks.cleaning_checks.security_box_comment || checks.cleaning_checks.securityBoxComment) && renderField('Security Box Comment', checks.cleaning_checks.security_box_comment ?? checks.cleaning_checks.securityBoxComment)}
                   {(checks.cleaning_checks.inside_clean_comment || checks.cleaning_checks.insideCleanComment) && renderField('Inside Clean Comment', checks.cleaning_checks.inside_clean_comment ?? checks.cleaning_checks.insideCleanComment)}
                   {(checks.cleaning_checks.outside_perimeter_clean_comment || checks.cleaning_checks.outsidePerimeterCleanComment) && renderField('Outside Perimeter Comment', checks.cleaning_checks.outside_perimeter_clean_comment ?? checks.cleaning_checks.outsidePerimeterCleanComment)}
                   {(checks.cleaning_checks.shelter_cleaned_comment || checks.cleaning_checks.shelterCleanedComment) && renderField('Shelter Cleaned Comment', checks.cleaning_checks.shelter_cleaned_comment ?? checks.cleaning_checks.shelterCleanedComment)}
                   {(checks.cleaning_checks.outdoor_equipment_cleaned_comment || checks.cleaning_checks.outdoorEquipmentCleanedComment) && renderField('Outdoor Equipment Comment', checks.cleaning_checks.outdoor_equipment_cleaned_comment ?? checks.cleaning_checks.outdoorEquipmentCleanedComment)}
                   {(checks.cleaning_checks.air_blower_used_comment || checks.cleaning_checks.airBlowerUsedComment) && renderField('Air Blower Comment', checks.cleaning_checks.air_blower_used_comment ?? checks.cleaning_checks.airBlowerUsedComment)}
                 </div>
               </div>
             )}
             
             {checks.cleaning_checks.comments && (
               <div className="mb-6">
                 <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Comments</h5>
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                   <p className="text-sm text-gray-700 whitespace-pre-wrap">{checks.cleaning_checks.comments}</p>
                 </div>
               </div>
             )}
             
             {checks.cleaning_checks.photos && checks.cleaning_checks.photos.length > 0 && (
               <div className="border-t pt-6">
                  <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide flex items-center">
                    <span className="mr-2">📸</span>
                    Site Photos ({checks.cleaning_checks.photos.length})
                  </h5>
                  <PhotoGallery photos={checks.cleaning_checks.photos} />
               </div>
             )}
           </div>
        </div>
      )}
      
      {/* Fuel Tank Checks */}
      {checks.fuel_tank_checks && (
        <div id="fuel-tank" className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
           {renderSectionHeader('Fuel Tank', '⛽')}
           <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
             {(checks.fuel_tank_checks.tankStatus !== undefined || checks.fuel_tank_checks.status !== undefined) &&
               renderField('Tank Status', checks.fuel_tank_checks.tankStatus || checks.fuel_tank_checks.status, 'status')}
             {(checks.fuel_tank_checks.waterInTank !== undefined || checks.fuel_tank_checks.water_in_tank !== undefined) &&
               renderField('Water In Tank', checks.fuel_tank_checks.waterInTank || checks.fuel_tank_checks.water_in_tank, 'boolean', 'Yes', 'No')}
             {(checks.fuel_tank_checks.separatingFilter !== undefined || checks.fuel_tank_checks.separating_filter !== undefined) &&
               renderField('Separating Filter', checks.fuel_tank_checks.separatingFilter || checks.fuel_tank_checks.separating_filter, 'status')}
             {(checks.fuel_tank_checks.isWaterproof !== undefined || checks.fuel_tank_checks.is_waterproof !== undefined) &&
               renderField('Waterproof', checks.fuel_tank_checks.isWaterproof || checks.fuel_tank_checks.is_waterproof, 'boolean', 'Yes', 'No')}
           </div>
        </div>
      )}
    </div>
  );
};
