"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

// --- أيقونات القائمة (Profile, Settings, Logout) ---
const IconProfile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// --- أيقونات الأعلام (SVG Flags) ---
const FlagUK = () => (
  <svg viewBox="0 0 60 30" className="w-5 h-auto rounded-[2px]" aria-hidden="true">
    <clipPath id="s">
      <path d="M0,0 v30 h60 v-30 z"/>
    </clipPath>
    <clipPath id="t">
      <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
    </clipPath>
    <g clipPath="url(#s)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

const FlagFR = () => (
  <svg viewBox="0 0 3 2" className="w-5 h-auto rounded-[2px]" aria-hidden="true">
    <rect width="1" height="2" x="0" fill="#002395"/>
    <rect width="1" height="2" x="1" fill="#fff"/>
    <rect width="1" height="2" x="2" fill="#ED2939"/>
  </svg>
);

const FlagTN = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 640 480" 
    className="w-5 h-auto rounded-[2px]" 
    aria-hidden="true"
  >
    <path fill="#e70013" d="M0 0h640v480H0z"/>
    <path fill="#fff" d="M320 119.2a1 1 0 0 0-1 240.3 1 1 0 0 0 1-240.3M392 293a90 90 0 1 1 0-107 72 72 0 1 0 0 107m-4.7-21.7-37.4-12.1-23.1 31.8v-39.3l-37.4-12.2 37.4-12.2V188l23.1 31.8 37.4-12.1-23.1 31.8z"/>
  </svg>
);


// دالة لاستخراج الأحرف الأولى
function getInitials(nameOrEmail: string | null | undefined): string {
  if (!nameOrEmail) return "GU";
  return nameOrEmail.substring(0, 2).toUpperCase();
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  // تحديد الاسم للعرض
  const displayName = user?.name || user?.email || "User";

  return (
    <header className="w-full border-b border-white/10 bg-black/20 relative z-50">
      <div className="w-full px-6 md:px-6 py-1 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center">
          <Image
            src="/LogoV1.1.png"
            alt="CVX Logo"
            width={120}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 text-sm relative">
          
          {/* Language Selector */}
          <div className="relative">
            <div 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 cursor-pointer group py-3 px-3 rounded-lg transition-colors hover:bg-black/30 active:bg-black/30 select-none"
            >
              {/* أيقونة العلم الحالية (UK) */}
              <FlagUK />
              
              <span className="text-foreground font-medium transition-colors group-hover:text-foreground-hover">
                EN
              </span>

              {/* Chevron Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-foreground/50 transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            {/* Language Dropdown Menu */}
            {isLangOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                
                <div className="absolute top-full right-0 mt-2 w-40 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-white/5 hover:text-foreground-hover flex items-center gap-3 transition-colors">
                      <FlagUK />
                      English
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-white/5 hover:text-foreground-hover flex items-center gap-3 transition-colors">
                      <FlagFR />
                      Français
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-white/5 hover:text-foreground-hover flex items-center gap-3 transition-colors">
                      <FlagTN />
                      العربية
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* User Profile Section */}
          {user ? (
            <div className="relative">
              {/* Trigger Button */}
              <div 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 cursor-pointer group py-1.5 px-3 rounded-lg transition-colors hover:bg-black/30 active:bg-black/30 select-none"
              >
                
                {/* Initials Circle */}
                <div className="h-9 w-9 rounded-full bg-foreground border-[3px] border-primary flex items-center justify-center text-sm md:text-base font-bold text-primary leading-none pb-[1px] transition-transform group-hover:scale-102">
                  {getInitials(displayName)}
                </div>

                {/* Username + Chevron */}
                <div className="flex items-center gap-1 pr-1">
                  <span className="text-foreground hidden sm:inline group-hover:text-foreground-hover transition-colors font-medium">
                    {displayName}
                  </span>
                  
                  {/* Chevron Down SVG */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-foreground/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* === DROPDOWN MENU === */}
              {isOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsOpen(false)} 
                  />

                  <div className="absolute top-full right-0 mt-2 w-56 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">

                    {/* Header: Name & Email */}
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-foreground/60 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="py-1">
                      <button className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-white/5 hover:text-foreground-hover flex items-center gap-3 transition-colors">
                        <IconProfile />
                        Profile
                      </button>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-white/5 hover:text-foreground-hover flex items-center gap-3 transition-colors">
                        <IconSettings />
                        Settings
                      </button>
                      
                      <div className="h-px bg-white/5 my-1"></div>
                      
                      <button 
                        onClick={() => logout()}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 transition-colors"
                      >
                        <IconLogout />
                        Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            !loading && <span className="text-foreground/50 text-xs">Guest</span>
          )}
        </div>
      </div>
    </header>
  );
}