// C:\Users\JokanderX\cvx\web\src\app\make-new-cv\page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  InitialSource,
  BulkCreateWizardRequest,
} from "@/types/resume-wizard.types";
import { bulkCreateFromWizard } from "@/lib/resume-wizard-client";

import Navbar from "../components/Navbar";

import type { FC, SVGProps } from "react"

import ScratchIcon from "@/icons/make-new-cv/step-1/scratch.svg";
import OldProjectIcon from "@/icons/make-new-cv/step-1/old-project.svg";
import OldDocumentIcon from "@/icons/make-new-cv/step-1/old-document.svg";
import ExternalCvIcon from "@/icons/make-new-cv/step-1/external-cv.svg";
import LinkedinIcon from "@/icons/make-new-cv/step-1/linkedin.svg";
import CallAgentIcon from "@/icons/make-new-cv/step-1/call-agent.svg";

import ScratchIconActive from "@/icons/make-new-cv/step-1/on-hover/scratch.svg";
import OldProjectIconActive from "@/icons/make-new-cv/step-1/on-hover/old-project.svg";
import OldDocumentIconActive from "@/icons/make-new-cv/step-1/on-hover/old-document.svg";
import ExternalCvIconActive from "@/icons/make-new-cv/step-1/on-hover/external-cv.svg";
import LinkedinIconActive from "@/icons/make-new-cv/step-1/on-hover/linkedin.svg";
import CallAgentIconActive from "@/icons/make-new-cv/step-1/on-hover/call-agent.svg";


import TnFlag from "@/icons/make-new-cv/step-2/tn.svg";
import FrFlag from "@/icons/make-new-cv/step-2/fr.svg";
import DeFlag from "@/icons/make-new-cv/step-2/de.svg";
import GbFlag from "@/icons/make-new-cv/step-2/gb.svg";
import ItFlag from "@/icons/make-new-cv/step-2/it.svg";
// ========== Step 1: Source cards ==========

type SourceCard = {
  id: InitialSource;
  title: string;
  description: string;
  IconDefault: FC<SVGProps<SVGSVGElement>>;
  IconActive: FC<SVGProps<SVGSVGElement>>;
};

const SOURCE_OPTIONS: SourceCard[] = [
  {
    id: "SCRATCH",
    title: "Start From Scratch",
    description: "Build a fresh CV with AI assistance.\nAll fields start empty and clean.",
    IconDefault: ScratchIcon,
    IconActive: ScratchIconActive,
  },
  {
    id: "OLD_PROJECT",
    title: "Start From Old Project",
    description: "Load any saved CVX projects stored\n in your cloud workspace.",
    IconDefault: OldProjectIcon,
    IconActive: OldProjectIconActive,
  },
  {
    id: "OLD_DOCUMENT",
    title: "Start From Old CVX Document",
    description: "Restore your exported CVX PDF/DOCX\n and rebuild it into an editable project.",
    IconDefault: OldDocumentIcon,
    IconActive: OldDocumentIconActive,
  },
  {
    id: "EXTERNAL_CV",
    title: "Start From Old CV",
    description: "Upload a PDF, DOCX, or photo and let our parser convert it into structured fields.",
    IconDefault: ExternalCvIcon,
    IconActive: ExternalCvIconActive,
  },
  {
    id: "LINKEDIN",
    title: "Start From LinkedIn",
    description: "Paste your LinkedIn profile URL and extract your professional data automatically.",
    IconDefault: LinkedinIcon,
    IconActive: LinkedinIconActive,
  },
  {
    id: "CALL_AGENT",
    title: "Start With a Live Call",
    description: "Let a CV expert assist you in a live call\n and build a tailored CV step by step.",
    IconDefault: CallAgentIcon,
    IconActive: CallAgentIconActive,
  },
];


// ========== Step 2: Languages + Templates ==========

type LanguageOption = {
  code: string;
  label: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "ar", label: "Arabic", Icon: TnFlag },
  { code: "fr", label: "French", Icon: FrFlag },
  { code: "en", label: "English", Icon: GbFlag },
  { code: "de", label: "German", Icon: DeFlag },
  { code: "it", label: "Italian", Icon: ItFlag },
];


// For now we use dummy template cards (MVP-UI only)
type TemplateCard = {
  id: string;
  name: string;
  previewLabel: string;
};

const TEMPLATE_OPTIONS: TemplateCard[] = [ 
  { id: "modern-1", name: "Modern Dark", previewLabel: "/CVs-templates/templates01.webp" }, 
  { id: "modern-2", name: "Clean Blue", previewLabel: "/CVs-templates/templates02.webp" }, 
  { id: "modern-3", name: "Contrast Yellow", previewLabel: "/CVs-templates/templates03.webp" }, 
  { id: "classic-1", name: "Classic With Photo", previewLabel: "/CVs-templates/templates04.webp" }, 
  { id: "classic-2", name: "Simple White", previewLabel: "/CVs-templates/templates05.webp" }, 
  { id: "sidebar-1", name: "Sidebar Green", previewLabel: "/CVs-templates/templates06.webp" }, ];



export default function MakeNewCvPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSource, setSelectedSource] = useState<InitialSource | null>(
    null,
  );

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // -------- Handlers: Step 1 --------

  function handleSelectSource(source: InitialSource) {
    setSelectedSource(source);
  }

  function goToStep2() {
    if (!selectedSource) return;
    setStep(2);
  }

  // -------- Handlers: Step 2 --------

  function toggleLanguage(code: string) {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function handleSelectTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
  }

  async function handleContinueToBuilder() {
    if (!selectedSource) return;
    if (selectedLanguages.length === 0) {
      setErrorMessage("Please choose at least one CV language.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload: BulkCreateWizardRequest = {
        initialSource: selectedSource,
        // Later we can fill this based on source (LinkedIn URL, file metadata, etc.)
        initialMeta: null,
        // Next.js frontend uses lowercase codes, backend can map them as needed.
        languages: selectedLanguages,
        // IMPORTANT FOR NOW:
        // We keep templateId as null because Template catalog is not wired to backend yet.
        templateId: null,
      };

      const result = await bulkCreateFromWizard(payload);

      if (!result.projects || result.projects.length === 0) {
        throw new Error("No projects were created");
      }

      const firstProject = result.projects[0];

      // Redirect to the editor for the first created project
      router.push(`/editor/${firstProject.id}`);
    } catch (err: any) {
      console.error("Error in handleContinueToBuilder:", err);
      setErrorMessage(
        err?.message ??
          "Something went wrong while creating your CV projects. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ========== Renders ==========

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* تم استبدال الدالة بالمكون الجديد */}
      <Navbar /> 
      
      {step === 1 ? renderStep1() : renderStep2()}
    </main>
  );

  function renderStep1() {
    return (
      <section className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold mb-2 text-primary">
                1. Choose Your Starting Point
            </h1>
            <p className="cv-wizard-description">
              Smart AI assistance built into every step. 
              Pick how you want to start, you can always adjust and refine later.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SOURCE_OPTIONS.map((option) => {
              const isActive = option.id === selectedSource;
              const IconToShow = isActive ? option.IconActive : option.IconDefault;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectSource(option.id)}
                  className={[
                  "relative flex flex-col items-center text-center rounded-xl px-4 py-5 md:px-4 md:py-8 transition",
                  "max-w-[340px]",
                  isActive ? "bg-primary/10 border-primary border-2" : "border border-white/40",
                  !isActive ? "hover:bg-primary/5" : "",
                  !isActive ? "hover:border-primary/70" : "",
                  ].join(" ")}
                >
                  <div className="mb-4 flex items-center justify-center mx-auto">
                    <IconToShow className="h-20 w-20" />
                  </div>



                  <h2 className="text-base md:text-lg font-semibold mb-2">
                    {option.title}
                  </h2>
                  <p className="text-xs md:text-sm text-foreground/70 px-4 whitespace-pre-line">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex justify-end">
            <button
              type="button"
              onClick={goToStep2}
              disabled={!selectedSource}
              className={[
                "px-6 py-2.5 rounded-lg text-sm font-medium",
                "bg-primary text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderStep2() {
    const canContinue = selectedLanguages.length > 0 && !isSubmitting;

    return (
      <section className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
          {/* Step 2: Languages */}
          <div>
              <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-primary">
                2. Choose Your CV Languages
              </h2>
              <p className="cv-wizard-description">
              Select one or multiple languages for your CV. You can fill all fields in whichever language is easiest for you.<br />
              Choosing CV languages will not change the website’s interface language.
              </p>
            </div>




            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {LANGUAGE_OPTIONS.map((lang) => {
                const isActive = selectedLanguages.includes(lang.code);
                const Icon = lang.Icon;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => toggleLanguage(lang.code)}
                    className={[
                      "relative flex flex-col items-center justify-center gap-5 rounded-xl px-4 py-7 transition select-none w-full",
                      isActive
                        ? "bg-primary/10 border-primary border-2"
                        : "border border-white/40",
                      !isActive ? "hover:bg-primary/5" : "",
                      !isActive ? "hover:border-primary/70" : "",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border-2 transition-shadow",
                        isActive
                          ? "border-4 border-primary shadow-md"
                          : "border border-foreground",
                      ].join(" ")}
                    >
                      <Icon className="w-full h-full" />
                    </div>

                    <span className="text-base md:text-lg font-semibold text-foreground">
                      {lang.label}
                    </span>
                  </button>
                );
              })}
            </div>






            
          </div>

          {/* Step 3: Templates (UI only for now) */}
          <div>
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-primary">
                3. Choose Your CV Template
              </h2>
              <p className="cv-wizard-description">
              Selecte the template based on the country you’re applying to and your preferred style. <br />
              You can change your template at any time.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Filters (UI only for now) */}
              <div className="w-full md:w-64 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-foreground/90">Filters</span>
                  <button type="button" className="text-base font-normal text-primary hover:underline">
                    Clear Filters
                  </button>
                </div>


                <div className="space-y-3 text-foreground/70">
                  {/* Region */}
                  <div>
                    <p className="cv-filter-heading">Region</p>
                    <div className="space-y-1">
                      <label className="cv-filter-option">
                        <input type="checkbox" className="accent-primary" />
                        <span>Global</span>
                      </label>
                      <label className="cv-filter-option">
                        <input type="checkbox" className="accent-primary" />
                        <span>Europe</span>
                      </label>
                      <label className="cv-filter-option">
                        <input type="checkbox" className="accent-primary" />
                        <span>Gulf</span>
                      </label>
                    </div>
                  </div>

                  {/* Layout */}
                  <div>
                    <p className="cv-filter-heading">Layout</p>
                    <div className="space-y-1">
                      <label className="cv-filter-option">
                        <input type="checkbox" className="accent-primary" />
                        <span>One Column</span>
                      </label>
                      <label className="cv-filter-option">
                        <input type="checkbox" className="accent-primary" />
                        <span>Two Columns</span>
                      </label>
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <p className="cv-filter-heading">Colors</p>
                    <div className="space-y-1">
                      <label className="cv-filter-option">
                        <input type="checkbox" className="accent-primary" />
                        <span>Monochrome</span>
                      </label>
                      <label className="cv-filter-option">
                        <input type="checkbox" className="accent-primary" />
                        <span>Colored</span>
                      </label>
                    </div>
                  </div>

                  {/* Photo */}
                  <div>
                    <p className="cv-filter-heading">Photo</p>
                    <div className="space-y-1">
                      <label className="cv-filter-option">
                        <input type="checkbox" className="accent-primary" />
                        <span>With Photo</span>
                      </label>
                      <label className="cv-filter-option">
                        <input type="checkbox" className="accent-primary" />
                        <span>Without Photo</span>
                      </label>
                    </div>
                  </div>

                </div>
              </div>

              {/* Templates grid (dummy cards) */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {TEMPLATE_OPTIONS.map((tpl) => {
                  const isActive = tpl.id === selectedTemplateId;
                  return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={[
                      "flex flex-col rounded-xl overflow-hidden bg-surface/70 transition text-left",
                      isActive ? "bg-primary/20 border border-primary/80 border-2" : "border border-white/40",
                      !isActive ? "hover:bg-surface hover:border-primary/70" : "",
                    ].join(" ")}
                  >

                      {/* Template preview placeholder */}

                      <div
                        className="aspect-[3/4]"
                      >
                        <img
                          src={tpl.previewLabel}
                          alt={tpl.name}
                          className="w-full h-full object-cover"
                        />
                      </div>


                      <div className="px-3 py-3 text-xs">
                        <p className="font-semibold text-foreground/90">
                          {tpl.name}
                        </p>
                        <p className="text-foreground/60 mt-1">
                          Preview only (MVP). Template selection will be fully
                          wired later.
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>




          </div>

          {/* Error + Actions */}
          {errorMessage && (
            <div className="text-sm text-red-400">{errorMessage}</div>
          )}

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg text-xs md:text-sm border border-white/15 text-foreground/80 hover:bg-surface"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleContinueToBuilder}
              disabled={!canContinue}
              className={[
                "px-6 py-2.5 rounded-lg text-sm font-medium",
                "bg-primary text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              {isSubmitting ? "Creating..." : "Continue to Builder"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      {step === 1 ? renderStep1() : renderStep2()}
    </main>
  );
}