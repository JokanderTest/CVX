// C:\Users\JokanderX\cvx\web\src\types\resume-wizard.types.ts

// Types used by the Resume Creation Wizard (Step 1 & Step 2)
// These match the backend Prisma enum + API response structure.

// Must match Prisma enum InitialSource
export type InitialSource =
  | "SCRATCH"
  | "OLD_PROJECT"
  | "OLD_DOCUMENT"
  | "EXTERNAL_CV"
  | "LINKEDIN"
  | "CALL_AGENT";

// Payload sent from Next.js frontend to the backend API
export type BulkCreateWizardRequest = {
  initialSource: InitialSource;
  initialMeta?: any;
  languages: string[];
  templateId?: string | null;
};

// Response returned by the backend ResumeEngineController
export type BulkCreateWizardResponse = {
  groupId: string;
  groupName: string;
  cvIndex: number;
  projects: {
    id: string;
    language: string;
    name: string;
  }[];
};
