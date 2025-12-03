// src/lib/resume-wizard-client.ts
"use client";

import {
  BulkCreateWizardRequest,
  BulkCreateWizardResponse,
} from "@/types/resume-wizard.types";

// ✅ التعديل هنا: استخدام ./ بدلاً من @/ لأن الملف في نفس المجلد
import { apiFetch } from "./api-client"; 

// دالة مساعدة لقراءة الكوكيز (لجلب CSRF Token)
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()!.split(";").shift() ?? null;
  }
  return null;
}

/**
 * Calls the backend Resume Engine wizard endpoint to create:
 * - one ProjectGroup
 * - multiple Projects (one per language)
 *
 * This function is used by the CV creation wizard (Step 2).
 */
export async function bulkCreateFromWizard(
  payload: BulkCreateWizardRequest,
): Promise<BulkCreateWizardResponse> {
  const csrfToken = getCookie("csrf_token") ?? "";

  // استخدام apiFetch (التي ستتعامل مع التوكن تلقائياً)
  const response = await apiFetch("/cvx/wizard/bulk-create", {
    method: "POST",
    headers: {
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    
    let errorMessage = `bulkCreateFromWizard failed with status ${response.status}`;
    try {
        const json = JSON.parse(text);
        if (json.message) errorMessage = json.message;
    } catch (e) {
        if (text) errorMessage += `: ${text}`;
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as BulkCreateWizardResponse;
}