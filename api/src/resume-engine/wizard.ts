// cvx/api/src/resume-engine/wizard.ts

import { prisma } from "../lib/prisma";
import { InitialSource } from "@prisma/client";

// Input type for the wizard bulk-create operation
export type BulkCreateFromWizardInput = {
  userId: string;

  initialSource: InitialSource;
  initialMeta?: any;

  languages: string[];        // e.g. ["en", "fr", "ar"]
  templateId?: string | null; // active template for all created projects (optional)

  // Later we can support per-language initial data if needed
  // initialDataByLanguage?: Record<string, any>;
};

// Output type returned to the API layer / frontend
export type BulkCreateFromWizardOutput = {
  groupId: string;
  groupName: string;
  cvIndex: number;
  projects: {
    id: string;
    language: string;
    name: string;
  }[];
};

// Core service: create ProjectGroup + Projects from wizard data
export async function bulkCreateFromWizard(
  input: BulkCreateFromWizardInput
): Promise<BulkCreateFromWizardOutput> {
  const { userId, initialSource, initialMeta, languages, templateId } = input;

  if (!userId) {
    throw new Error("bulkCreateFromWizard: userId is required");
  }

  if (!languages || languages.length === 0) {
    throw new Error("bulkCreateFromWizard: at least one language is required");
  }

  // 1) Find last cvIndex for this user to compute the next one
  const lastGroup = await prisma.projectGroup.findFirst({
    where: { userId },
    orderBy: { cvIndex: "desc" },
    select: { cvIndex: true },
  });

  const nextCvIndex = (lastGroup?.cvIndex ?? 0) + 1;
  const groupName = `CV ${nextCvIndex}`;

  // 2) Create ProjectGroup + Projects in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const group = await tx.projectGroup.create({
      data: {
        userId,
        name: groupName,
        cvIndex: nextCvIndex,
        initialSource,
        initialMeta: initialMeta === null ? undefined : initialMeta,
      },
    });

    // For now, all projects start with empty JSON data {}
    const projectsData = languages.map((lang) => ({
      userId,
      groupId: group.id,
      language: lang,
      name: `${groupName} – ${lang.toUpperCase()}`,
      templateId: templateId ?? null,
      data: {}, // TODO: plug real initial data later (Step 1 Start From)
    }));

    await tx.project.createMany({
      data: projectsData,
    });

    const createdProjects = await tx.project.findMany({
      where: {
        userId,
        groupId: group.id,
      },
      select: {
        id: true,
        language: true,
        name: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      group,
      projects: createdProjects,
    };
  });

  return {
    groupId: result.group.id,
    groupName,
    cvIndex: nextCvIndex,
    projects: result.projects,
  };
}
