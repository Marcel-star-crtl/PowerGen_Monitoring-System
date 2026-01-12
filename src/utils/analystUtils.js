// analystUtils.js
export const processOutageData = (data) => {
    return data.map(item => {
      // Determine tenant type
      const isMTN = item.Tenant?.startsWith('T');
      const isOCM = item.Tenant?.startsWith('LIT');
      
      // Determine site type
      const isParent = !item['Parent Tenant Outage'];
      const isChild = !!item['Parent Tenant Outage'];
      
      // Filter condition
      const isAccessPassive = item['RCA 1'] === 'Access' || item['RCA 1'] === 'Passive';
      
      return {
        ...item,
        isMTN,
        isOCM,
        isParent,
        isChild,
        isAccessPassive,
        cascadedSitesCount: item['Cascaded Sites'] ? parseInt(item['Cascaded Sites']) : 0,
        cascadedTenantCount: item['Cascaded Tenant count'] ? parseInt(item['Cascaded Tenant count']) : 0
      };
    });
  };
  
  export const filterOutageData = (data) => {
    // First filter by RCA 1 = Access or Passive
    const filtered = data.filter(item => item.isAccessPassive);
    
    // Then categorize parent/child relationships
    const parents = filtered.filter(item => item.isParent);
    const children = filtered.filter(item => item.isChild);
    
    // Enhance parent records with child information
    const enhancedParents = parents.map(parent => {
      const relatedChildren = children.filter(child => 
        child['Parent Tenant Outage'] === parent['Tenant Site ID']
      );
      
      return {
        ...parent,
        childSites: relatedChildren,
        totalCascadedTenants: relatedChildren.reduce(
          (sum, child) => sum + (child.cascadedTenantCount || 0), 
          parent.cascadedTenantCount || 0
        )
      };
    });
    
    return {
      allData: filtered,
      parents: enhancedParents,
      children,
      mtnSites: filtered.filter(item => item.isMTN),
      ocmSites: filtered.filter(item => item.isOCM)
    };
  };
  
  export const calculateOutageStats = (filteredData) => {
    const { allData, parents, children, mtnSites, ocmSites } = filteredData;
    
    // Calculate durations in minutes
    const durations = allData.map(item => {
      const [hours, minutes] = item['Outage Duration'].split(':').map(Number);
      return hours * 60 + minutes;
    });
    
    const totalDuration = durations.reduce((sum, dur) => sum + dur, 0);
    const avgDuration = totalDuration / allData.length;
    
    // Format average duration
    const avgHours = Math.floor(avgDuration / 60);
    const avgMins = Math.round(avgDuration % 60);
    const formattedAvg = `${avgHours}:${avgMins.toString().padStart(2, '0')}`;
    
    // Count by priority
    const priorityCounts = allData.reduce((acc, item) => {
      acc[item.Priority] = (acc[item.Priority] || 0) + 1;
      return acc;
    }, {});
    
    // Count by RCA
    const rcaCounts = allData.reduce((acc, item) => {
      acc[item['RCA 1']] = (acc[item['RCA 1']] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalOutages: allData.length,
      parentOutages: parents.length,
      childOutages: children.length,
      mtnOutages: mtnSites.length,
      ocmOutages: ocmSites.length,
      avgOutageDuration: formattedAvg,
      maxOutageDuration: Math.max(...durations),
      priorityDistribution: priorityCounts,
      rcaDistribution: rcaCounts,
      totalCascadedTenants: parents.reduce((sum, p) => sum + (p.totalCascadedTenants || 0), 0)
    };
  };