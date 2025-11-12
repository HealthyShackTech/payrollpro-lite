// Audit Trail System for ATO Compliance
// Tracks all payroll changes and maintains compliance records

const mongoose = require('mongoose');

// Audit Trail Schema
const auditTrailSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'payroll_created',
      'payroll_updated',
      'payroll_deleted',
      'payslip_created',
      'payslip_updated',
      'payslip_deleted',
      'tax_calculation',
      'stp_submission',
      'payment_summary_generated',
      'employee_tax_declaration',
      'system_configuration_change'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['payroll', 'payslip', 'employee', 'system']
  },
  entityId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  previousValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  complianceFlags: {
    atoCompliant: {
      type: Boolean,
      default: true
    },
    taxCalculationVerified: {
      type: Boolean,
      default: false
    },
    stpSubmitted: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
auditTrailSchema.index({ entityType: 1, entityId: 1 });
auditTrailSchema.index({ timestamp: -1 });
auditTrailSchema.index({ action: 1, timestamp: -1 });
auditTrailSchema.index({ userId: 1, timestamp: -1 });

const AuditTrail = mongoose.model('AuditTrail', auditTrailSchema);

/**
 * Log an audit trail entry
 * @param {Object} auditData - Audit trail data
 */
async function logAuditTrail(auditData) {
  try {
    const auditEntry = new AuditTrail(auditData);
    await auditEntry.save();
    return auditEntry;
  } catch (error) {
    console.error('Error logging audit trail:', error);
    throw error;
  }
}

/**
 * Log payroll changes
 * @param {String} action - Action performed
 * @param {String} entityId - Entity ID
 * @param {String} userId - User ID
 * @param {Object} changes - Changes made
 * @param {Object} previousValues - Previous values
 * @param {Object} newValues - New values
 * @param {Object} metadata - Additional metadata
 */
async function logPayrollChange(action, entityId, userId, changes = {}, previousValues = {}, newValues = {}, metadata = {}) {
  return await logAuditTrail({
    action,
    entityType: 'payroll',
    entityId,
    userId,
    changes,
    previousValues,
    newValues,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    complianceFlags: {
      atoCompliant: true,
      taxCalculationVerified: metadata.taxCalculationVerified || false,
      stpSubmitted: metadata.stpSubmitted || false
    },
    metadata
  });
}

/**
 * Log payslip changes
 * @param {String} action - Action performed
 * @param {String} entityId - Payslip ID
 * @param {String} userId - User ID
 * @param {Object} changes - Changes made
 * @param {Object} previousValues - Previous values
 * @param {Object} newValues - New values
 * @param {Object} metadata - Additional metadata
 */
async function logPayslipChange(action, entityId, userId, changes = {}, previousValues = {}, newValues = {}, metadata = {}) {
  return await logAuditTrail({
    action,
    entityType: 'payslip',
    entityId,
    userId,
    changes,
    previousValues,
    newValues,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    complianceFlags: {
      atoCompliant: true,
      taxCalculationVerified: metadata.taxCalculationVerified || false,
      stpSubmitted: metadata.stpSubmitted || false
    },
    metadata
  });
}

/**
 * Log tax calculation events
 * @param {String} entityId - Entity ID
 * @param {String} userId - User ID
 * @param {Object} calculationData - Tax calculation data
 * @param {Object} metadata - Additional metadata
 */
async function logTaxCalculation(entityId, userId, calculationData, metadata = {}) {
  return await logAuditTrail({
    action: 'tax_calculation',
    entityType: 'payslip',
    entityId,
    userId,
    changes: {
      taxCalculation: calculationData
    },
    newValues: {
      taxWithheld: calculationData.taxWithheld,
      medicareLevy: calculationData.medicareLevy,
      netPay: calculationData.netPay
    },
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    complianceFlags: {
      atoCompliant: true,
      taxCalculationVerified: true,
      stpSubmitted: false
    },
    metadata: {
      ...metadata,
      calculationMethod: 'ATO_TAX_TABLES_2024_25',
      superannuationRate: 0.115
    }
  });
}

/**
 * Log STP submission
 * @param {String} payrunId - Payrun ID
 * @param {String} userId - User ID
 * @param {Object} stpData - STP data submitted
 * @param {Object} metadata - Additional metadata
 */
async function logSTPSubmission(payrunId, userId, stpData, metadata = {}) {
  return await logAuditTrail({
    action: 'stp_submission',
    entityType: 'payroll',
    entityId: payrunId,
    userId,
    changes: {
      stpSubmission: stpData
    },
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    complianceFlags: {
      atoCompliant: true,
      taxCalculationVerified: true,
      stpSubmitted: true
    },
    metadata: {
      ...metadata,
      submissionDate: new Date(),
      atoSubmissionId: metadata.atoSubmissionId || 'PENDING'
    }
  });
}

/**
 * Get audit trail for an entity
 * @param {String} entityType - Entity type
 * @param {String} entityId - Entity ID
 * @param {Object} options - Query options
 */
async function getAuditTrail(entityType, entityId, options = {}) {
  const query = { entityType, entityId };
  
  if (options.startDate) {
    query.timestamp = { $gte: options.startDate };
  }
  
  if (options.endDate) {
    query.timestamp = { ...query.timestamp, $lte: options.endDate };
  }
  
  if (options.action) {
    query.action = options.action;
  }
  
  const limit = options.limit || 100;
  const skip = options.skip || 0;
  
  return await AuditTrail.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip);
}

/**
 * Get compliance report
 * @param {String} startDate - Start date
 * @param {String} endDate - End date
 */
async function getComplianceReport(startDate, endDate) {
  const query = {
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  const auditEntries = await AuditTrail.find(query).sort({ timestamp: -1 });
  
  const report = {
    totalEntries: auditEntries.length,
    complianceFlags: {
      atoCompliant: auditEntries.filter(entry => entry.complianceFlags.atoCompliant).length,
      taxCalculationVerified: auditEntries.filter(entry => entry.complianceFlags.taxCalculationVerified).length,
      stpSubmitted: auditEntries.filter(entry => entry.complianceFlags.stpSubmitted).length
    },
    actions: {},
    entities: {},
    timeline: auditEntries.map(entry => ({
      timestamp: entry.timestamp,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      userId: entry.userId,
      complianceFlags: entry.complianceFlags
    }))
  };
  
  // Count actions
  auditEntries.forEach(entry => {
    report.actions[entry.action] = (report.actions[entry.action] || 0) + 1;
  });
  
  // Count entities
  auditEntries.forEach(entry => {
    report.entities[entry.entityType] = (report.entities[entry.entityType] || 0) + 1;
  });
  
  return report;
}

/**
 * Export audit trail for ATO compliance
 * @param {String} startDate - Start date
 * @param {String} endDate - End date
 */
async function exportAuditTrail(startDate, endDate) {
  const auditEntries = await AuditTrail.find({
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ timestamp: -1 });
  
  return auditEntries.map(entry => ({
    timestamp: entry.timestamp,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    userId: entry.userId,
    changes: entry.changes,
    complianceFlags: entry.complianceFlags,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent
  }));
}

module.exports = {
  AuditTrail,
  logAuditTrail,
  logPayrollChange,
  logPayslipChange,
  logTaxCalculation,
  logSTPSubmission,
  getAuditTrail,
  getComplianceReport,
  exportAuditTrail
};




















