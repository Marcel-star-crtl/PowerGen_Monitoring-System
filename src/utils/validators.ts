export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Matches: 6XXXXXXXX or +2376XXXXXXXX
  const re = /^(\+237)?6\d{8}$/;
  return re.test(phone);
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const validateNumberRange = (value: any, min?: number, max?: number): boolean => {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};

export const validateFileType = (file: File, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/jpg']): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateVisitForm = (formData: any): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!validateRequired(formData.Actual_Date_Visit)) {
    errors.Actual_Date_Visit = 'Visit date is required';
  }

  if (!validateRequired(formData.Type_of_Visit)) {
    errors.Type_of_Visit = 'Visit type is required';
  }

  if (!validateRequired(formData.technician_id)) {
    errors.technician_id = 'Technician is required';
  }

  if (formData.Earthing_OHM && !validateNumberRange(formData.Earthing_OHM, 0, 1000)) {
    errors.Earthing_OHM = 'Invalid earthing value (0-1000 ohms)';
  }

  if (formData.Fuel_Quantity_Found && !validateNumberRange(formData.Fuel_Quantity_Found, 0, 10000)) {
    errors.Fuel_Quantity_Found = 'Invalid fuel quantity';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const sanitizeInput = (input: any): any => {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '');
};
