// src/resume-engine/resume-engine.module.ts

import { Module } from "@nestjs/common";
import { ResumeEngineController } from "./resume-engine.controller";

@Module({
  controllers: [ResumeEngineController],
})
export class ResumeEngineModule {}
