// C:\Users\JokanderX\cvx\api\src\resume-engine\resume-engine.controller.ts

import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport"; // ✅ هذا هو الـ Guard الصحيح

import { bulkCreateFromWizard, BulkCreateFromWizardOutput } from "./wizard";
import { InitialSource } from "@prisma/client";

type BulkCreateFromWizardRequestBody = {
  initialSource: InitialSource;
  initialMeta?: any;
  languages: string[];
  templateId?: string | null;
};

@Controller("cvx/wizard")
export class ResumeEngineController {
  // ✅ نحمي هذا الـ endpoint بـ JWT Auth
  @UseGuards(AuthGuard("jwt"))
  @Post("bulk-create")
  async bulkCreateFromWizard(
    @Body() body: BulkCreateFromWizardRequestBody,
    @Req() req: any
  ): Promise<BulkCreateFromWizardOutput> {
    // JwtStrategy يرجع لك user بهذا الشكل:
    // { id: payload.sub, email, role, name }
    const userId: string | undefined = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException("User not authenticated");
    }

    const { initialSource, initialMeta, languages, templateId } = body;

    if (!languages || languages.length === 0) {
      throw new Error("At least one language is required");
    }

    const result = await bulkCreateFromWizard({
      userId,
      initialSource,
      initialMeta,
      languages,
      templateId,
    });

    return result;
  }
}
