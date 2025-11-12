// ATO Tax Calculator - Australian Taxation Office compliant tax calculations
// Based on ATO tax tables for 2024-25 financial year

/**
 * ATO Tax Tables for 2024-25 Financial Year
 * Source: https://www.ato.gov.au/rates/individual-income-tax-rates
 */

// Resident tax rates for 2024-25
const RESIDENT_TAX_RATES = [
  { min: 0, max: 18200, rate: 0, base: 0 },
  { min: 18201, max: 45000, rate: 0.19, base: 0 },
  { min: 45001, max: 120000, rate: 0.325, base: 5092 },
  { min: 120001, max: 180000, rate: 0.37, base: 29467 },
  { min: 180001, max: Infinity, rate: 0.45, base: 51667 }
];

// Medicare levy rates
const MEDICARE_LEVY_RATE = 0.02; // 2%
const MEDICARE_LEVY_SURCHARGE_THRESHOLDS = {
  single: 90000,
  family: 180000
};

// Superannuation guarantee rate (effective from 1 July 2024)
const SUPERANNUATION_GUARANTEE_RATE = 0.115; // 11.5%

// Low income tax offset (LITO) for 2024-25
const LITO_MAX = 700;
const LITO_THRESHOLD = 37500;
const LITO_REDUCTION_THRESHOLD = 45000;

/**
 * Calculate PAYG withholding tax based on ATO tax tables
 * @param {number} grossAmount - Gross pay amount
 * @param {string} payFrequency - 'weekly', 'fortnightly', 'monthly', 'yearly'
 * @param {object} employeeDetails - Employee details including TFN declaration
 * @returns {object} Tax calculation result
 */
function calculatePAYGWithholding(grossAmount, payFrequency, employeeDetails = {}) {
  if (!grossAmount || grossAmount <= 0) {
    return {
      taxWithheld: 0,
      medicareLevy: 0,
      netPay: grossAmount,
      breakdown: {
        grossAmount: 0,
        taxWithheld: 0,
        medicareLevy: 0,
        netPay: 0
      }
    };
  }

  // Convert to annual amount for tax calculation
  const annualMultipliers = {
    weekly: 52,
    fortnightly: 26,
    monthly: 12,
    yearly: 1
  };

  const annualGross = grossAmount * (annualMultipliers[payFrequency] || 52);
  
  // Calculate tax on annual amount
  const annualTax = calculateAnnualTax(annualGross);
  
  // Convert back to pay period
  const taxWithheld = annualTax / (annualMultipliers[payFrequency] || 52);
  
  // Calculate Medicare levy
  const medicareLevy = calculateMedicareLevy(annualGross, employeeDetails);
  const medicareLevyPerPeriod = medicareLevy / (annualMultipliers[payFrequency] || 52);
  
  // Calculate net pay
  const netPay = grossAmount - taxWithheld - medicareLevyPerPeriod;

  return {
    taxWithheld: Math.round(taxWithheld * 100) / 100,
    medicareLevy: Math.round(medicareLevyPerPeriod * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
    breakdown: {
      grossAmount: Math.round(grossAmount * 100) / 100,
      taxWithheld: Math.round(taxWithheld * 100) / 100,
      medicareLevy: Math.round(medicareLevyPerPeriod * 100) / 100,
      netPay: Math.round(netPay * 100) / 100
    }
  };
}

/**
 * Calculate annual tax based on ATO tax brackets
 * @param {number} annualIncome - Annual gross income
 * @returns {number} Annual tax amount
 */
function calculateAnnualTax(annualIncome) {
  let tax = 0;
  
  for (const bracket of RESIDENT_TAX_RATES) {
    if (annualIncome > bracket.min) {
      const taxableInBracket = Math.min(annualIncome, bracket.max) - bracket.min;
      tax += taxableInBracket * bracket.rate;
    }
  }
  
  // Apply Low Income Tax Offset (LITO)
  const lito = calculateLITO(annualIncome);
  tax = Math.max(0, tax - lito);
  
  return Math.round(tax * 100) / 100;
}

/**
 * Calculate Low Income Tax Offset (LITO)
 * @param {number} annualIncome - Annual gross income
 * @returns {number} LITO amount
 */
function calculateLITO(annualIncome) {
  if (annualIncome <= LITO_THRESHOLD) {
    return LITO_MAX;
  } else if (annualIncome <= LITO_REDUCTION_THRESHOLD) {
    return LITO_MAX - ((annualIncome - LITO_THRESHOLD) * 0.05);
  } else {
    return 0;
  }
}

/**
 * Calculate Medicare levy
 * @param {number} annualIncome - Annual gross income
 * @param {object} employeeDetails - Employee details
 * @returns {number} Medicare levy amount
 */
function calculateMedicareLevy(annualIncome, employeeDetails = {}) {
  // Basic Medicare levy
  let medicareLevy = annualIncome * MEDICARE_LEVY_RATE;
  
  // Medicare levy surcharge for high income earners without private health insurance
  if (employeeDetails.hasPrivateHealthInsurance !== true) {
    if (employeeDetails.maritalStatus === 'single' && annualIncome > MEDICARE_LEVY_SURCHARGE_THRESHOLDS.single) {
      medicareLevy += annualIncome * 0.01; // 1% surcharge
    } else if (employeeDetails.maritalStatus === 'family' && annualIncome > MEDICARE_LEVY_SURCHARGE_THRESHOLDS.family) {
      medicareLevy += annualIncome * 0.01; // 1% surcharge
    }
  }
  
  return Math.round(medicareLevy * 100) / 100;
}

/**
 * Calculate superannuation guarantee
 * @param {number} grossAmount - Gross pay amount
 * @returns {number} Superannuation amount
 */
function calculateSuperannuationGuarantee(grossAmount) {
  return Math.round((grossAmount * SUPERANNUATION_GUARANTEE_RATE) * 100) / 100;
}

/**
 * Validate TFN (Tax File Number) format
 * @param {string} tfn - Tax File Number
 * @returns {boolean} True if valid format
 */
function validateTFN(tfn) {
  if (!tfn || typeof tfn !== 'string') return false;
  
  // Remove spaces and non-numeric characters
  const cleanTFN = tfn.replace(/\D/g, '');
  
  // TFN must be 9 digits
  if (cleanTFN.length !== 9) return false;
  
  // Basic format validation (ATO TFN algorithm would be more complex)
  return /^\d{9}$/.test(cleanTFN);
}

/**
 * Generate ATO-compliant payment summary data
 * @param {object} employeeData - Employee data
 * @param {object} payrollData - Payroll data for the financial year
 * @returns {object} Payment summary data
 */
function generatePaymentSummary(employeeData, payrollData) {
  const totalGross = payrollData.reduce((sum, pay) => sum + pay.grossAmount, 0);
  const totalTaxWithheld = payrollData.reduce((sum, pay) => sum + pay.taxWithheld, 0);
  const totalSuperannuation = payrollData.reduce((sum, pay) => sum + pay.superannuation, 0);
  
  return {
    employeeId: employeeData.employeeId,
    tfn: employeeData.taxFileNumber,
    name: `${employeeData.firstName} ${employeeData.surname}`,
    address: employeeData.address,
    financialYear: '2024-25',
    totalGross: Math.round(totalGross * 100) / 100,
    totalTaxWithheld: Math.round(totalTaxWithheld * 100) / 100,
    totalSuperannuation: Math.round(totalSuperannuation * 100) / 100,
    netPay: Math.round((totalGross - totalTaxWithheld) * 100) / 100
  };
}

/**
 * Generate STP (Single Touch Payroll) data for ATO reporting
 * @param {object} payrollData - Payroll data
 * @returns {object} STP data structure
 */
function generateSTPData(payrollData) {
  return {
    businessId: payrollData.businessId,
    payrunId: payrollData.payrunId,
    payDate: payrollData.payDate,
    employees: payrollData.employees.map(emp => ({
      employeeId: emp.employeeId,
      tfn: emp.taxFileNumber,
      grossAmount: emp.grossAmount,
      taxWithheld: emp.taxWithheld,
      superannuation: emp.superannuation,
      netPay: emp.netPay
    })),
    totals: {
      totalGross: payrollData.employees.reduce((sum, emp) => sum + emp.grossAmount, 0),
      totalTaxWithheld: payrollData.employees.reduce((sum, emp) => sum + emp.taxWithheld, 0),
      totalSuperannuation: payrollData.employees.reduce((sum, emp) => sum + emp.superannuation, 0)
    }
  };
}

module.exports = {
  calculatePAYGWithholding,
  calculateSuperannuationGuarantee,
  validateTFN,
  generatePaymentSummary,
  generateSTPData,
  SUPERANNUATION_GUARANTEE_RATE,
  RESIDENT_TAX_RATES,
  MEDICARE_LEVY_RATE
};

