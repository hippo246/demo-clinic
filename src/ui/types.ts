// ─── Core Domain Types ─────────────────────────────────────────────────────────

export type Gender = "Male" | "Female" | "Other";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
export type PatientStatus =
  | "New" | "Active" | "Follow-Up Due" | "Under Treatment"
  | "Observation" | "Inactive" | "VIP" | "Archived";
export type InsuranceStatus = "Active" | "Expiring" | "Expired" | "None";
export type AlertType =
  | "Allergy" | "Diabetic" | "Hypertension"
  | "Heart Condition" | "Pregnancy" | "High Risk";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type UserRole = "receptionist" | "doctor" | "admin";
export type FollowUpStatus = "Pending" | "Called" | "No Answer" | "Completed";

// ─── Advanced Medical Types ─────────────────────────────────────────────────────

export type MedicalConditionSeverity = "Mild" | "Moderate" | "Severe" | "Critical";
export type MedicationStatus = "Active" | "Discontinued" | "Completed";
export type LabResultStatus = "Pending" | "Completed" | "Abnormal" | "Critical";
export type AppointmentType = "Consultation" | "Follow-Up" | "Procedure" | "Emergency" | "Telehealth";
export type AppointmentStatus = "Scheduled" | "Confirmed" | "In Progress" | "Completed" | "Cancelled" | "No Show";
export type ClaimStatus = "Draft" | "Submitted" | "Processing" | "Approved" | "Rejected" | "Paid";
export type PaymentPlanStatus = "Active" | "Paused" | "Completed" | "Defaulted";
export type VitalSignType = "Blood Pressure" | "Heart Rate" | "Temperature" | "Weight" | "Height" | "BMI" | "Oxygen Saturation" | "Respiratory Rate";
export type DrugInteractionSeverity = "Minor" | "Moderate" | "Major" | "Contraindicated";

export interface TimelineEvent {
  id: string;
  type: string;
  label: string;
  icon: string;
  color: string;
  date: Date | string;
  note?: string | null;
  doctor?: string;
}

export interface PatientDocument {
  id: string;
  type: string;
  uploaded: string;
  size: string;
  verified?: boolean;
  expiry?: string | null;
}

export interface PatientNote {
  id: string;
  text: string;
  pinned: boolean;
  date: string;
  category?: string;
  author?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  patientId: string;
}

// ─── Advanced Medical Interfaces ─────────────────────────────────────────────────

export interface MedicalCondition {
  id: string;
  name: string;
  diagnosisDate: string;
  severity: MedicalConditionSeverity;
  status: "Active" | "Resolved" | "Chronic";
  doctor: string;
  notes?: string;
}

export interface Surgery {
  id: string;
  name: string;
  date: string;
  hospital: string;
  surgeon: string;
  notes?: string;
}

export interface Hospitalization {
  id: string;
  reason: string;
  admissionDate: string;
  dischargeDate?: string;
  hospital: string;
  notes?: string;
}

export interface Vaccination {
  id: string;
  name: string;
  date: string;
  dose: string;
  nextDue?: string;
  administeredBy: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string; // Oral, IV, Topical, etc.
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  prescribedBy: string;
  notes?: string;
  interactions?: string[];
}

export interface LabResult {
  id: string;
  testName: string;
  testDate: string;
  result: string;
  unit: string;
  referenceRange: string;
  status: LabResultStatus;
  orderedBy: string;
  notes?: string;
}

export interface ImagingRecord {
  id: string;
  type: string; // X-Ray, CT, MRI, Ultrasound, etc.
  bodyPart: string;
  date: string;
  radiologist: string;
  findings: string;
  impression: string;
  status: "Pending" | "Completed" | "Reviewed";
}

export interface VitalSign {
  id: string;
  type: VitalSignType;
  value: string;
  unit: string;
  date: string;
  recordedBy: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  prescribedBy: string;
  prescribedDate: string;
  status: "Active" | "Dispensed" | "Expired";
  notes?: string;
}

export interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: DrugInteractionSeverity;
  description: string;
  recommendation: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  type: AppointmentType;
  status: AppointmentStatus;
  date: string;
  time: string;
  duration: number; // in minutes
  reason: string;
  notes?: string;
  isRecurring: boolean;
  recurringPattern?: string; // "Weekly", "Monthly", etc.
  reminderSent: boolean;
  room?: string;
}

export interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
  addedDate: string;
  notes?: string;
}

export interface InsuranceClaim {
  id: string;
  patientId: string;
  patientName: string;
  claimNumber: string;
  serviceDate: string;
  serviceType: string;
  amount: number;
  insurer: string;
  policyNumber: string;
  status: ClaimStatus;
  submittedDate?: string;
  approvedDate?: string;
  paidDate?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface PreAuthorization {
  id: string;
  patientId: string;
  patientName: string;
  procedure: string;
  icdCode: string;
  cptCode: string;
  requestedDate: string;
  status: "Pending" | "Approved" | "Denied" | "Additional Info Required";
  decisionDate?: string;
  approvedAmount?: number;
  notes?: string;
}

export interface PaymentPlan {
  id: string;
  patientId: string;
  patientName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installmentAmount: number;
  frequency: "Weekly" | "Bi-Weekly" | "Monthly";
  startDate: string;
  endDate: string;
  status: PaymentPlanStatus;
  nextPaymentDate: string;
  notes?: string;
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  outstandingBalance: number;
  averageRevenuePerPatient: number;
  topServices: { name: string; revenue: number; count: number }[];
  revenueByDoctor: { doctor: string; revenue: number; patients: number }[];
  revenueByInsurance: { insurer: string; revenue: number; claims: number }[];
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  dob: string;
  age: number;
  gender: Gender;
  bloodGroup: BloodGroup;
  phone: string;
  email: string;
  address: string;
  nationality: string;

  // Emergency
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;

  // Insurance
  insurer: string;
  policyNumber: string | null;
  insuranceExpiry: string | null;
  insuranceStatus: InsuranceStatus;

  // Medical
  allergies: string;
  conditions: string[];
  medications: string[];
  alerts: AlertType[];
  alertsReviewed?: boolean;
  acknowledgedAlerts?: string[];

  // Advanced Medical History
  medicalConditions?: MedicalCondition[];
  surgeries?: Surgery[];
  hospitalizations?: Hospitalization[];
  vaccinations?: Vaccination[];
  activeMedications?: Medication[];
  labResults?: LabResult[];
  imagingRecords?: ImagingRecord[];
  vitalSigns?: VitalSign[];
  prescriptions?: Prescription[];

  // Status
  status: PatientStatus;
  doctor: string;
  lastVisit: string | null;
  nextAppointment: string | null;

  // Follow-up
  followUpDate: string | null;
  followUpReason: string | null;
  followUpStaff: string | null;
  followUpPriority: "High" | "Medium" | "Low" | null;
  followUpStatus: FollowUpStatus | null;
  callAttempts: number;
  lastContacted: string | null;
  followUpNotes: string | null;

  // Verification flags
  phoneVerified: boolean;
  insuranceVerified: boolean;
  idVerified: boolean;
  consentSigned: boolean;
  documentsComplete: boolean;

  // Sub-arrays
  timeline: TimelineEvent[];
  documents: PatientDocument[];
  notes: PatientNote[];
  family: FamilyMember[];

  // Optional extras
  flags?: Record<string, boolean>;
  consents?: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditEntry {
  id: string;
  patientId: string;
  message: string;
  type: string;
  user: string;
  timestamp: string;
}

export interface PatientStats {
  total: number;
  active: number;
  followUpDue: number;
  newPatients: number;
  insExpiring: number;
  criticalAlerts: number;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
}

export interface NextBestAction {
  label: string;
  detail: string;
  icon: string;
  color: string;
  bg: string;
  urgency: "critical" | "high" | "medium" | "low" | "none";
}

export interface VisitReadinessItem {
  key: string;
  label: string;
  done: boolean;
}

export interface VisitReadiness {
  items: VisitReadinessItem[];
  done: number;
  total: number;
  ready: boolean;
}
