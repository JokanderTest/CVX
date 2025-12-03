// -----------------------------------------------------------------------------
// cv-document.types.ts
//
// Unified shape for all CV data inside CVX.
//
// هذا الملف يحدد الشكل الموحد والنهائي لبيانات السيرة الذاتية (CV Document).
// هذا الشكل هو المرجع الأساسي الذي يُستخدم في:
//
// 1. التخزين في قاعدة البيانات داخل Project.data (JSON)
// 2. التخزين لدى المستخدم الضيف داخل localStorage
// 3. محرر السيرة الذاتية (CV Builder)
// 4. نقل بيانات الضيف عند تسجيل الدخول (guest → DB migration)
// 5. عمليات التصدير (PDF – DOCX – JSON)
// 
// وجود هذا النوع ضروري لتجنب أي اختلاف أو تضارب في شكل البيانات بين
// الواجهة الأمامية والباكند ووضعية الضيف ووضعية المستخدم المسجل.
//
// NOTE: This file contains TYPE DEFINITIONS ONLY. No logic.
// -----------------------------------------------------------------------------

export interface CvPersonalInfo {
  fullName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  pictureUrl?: string;
}

export interface CvExperience {
  id: string;
  title: string;
  company?: string;
  location?: string;
  startDate?: string;   // ISO Date
  endDate?: string;     // ISO Date or null
  currentlyWorking?: boolean;
  description?: string;
}

export interface CvEducation {
  id: string;
  degree: string;
  school?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface CvSkill {
  id: string;
  name: string;
  level?: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface CvLanguage {
  id: string;
  name: string;
  level: "A1"|"A2"|"B1"|"B2"|"C1"|"C2"|"native";
}

export interface CvMeta {
  language: string;      // "en" | "fr" | "ar" | ...
  templateId?: string | null;
  lastModified?: string; // ISO date updated on save
}

export interface CvDocument {
  personalInfo: CvPersonalInfo;
  summary?: string;

  experiences: CvExperience[];
  education: CvEducation[];
  skills: CvSkill[];
  languages: CvLanguage[];

  meta: CvMeta;

  // For future expansion (custom sections)
  customSections?: Array<{
    id: string;
    title: string;
    items: string[];
  }>;
}
