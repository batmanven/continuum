import { useEffect, useRef, useCallback, useState } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { HelpCircle, Play, RotateCcw } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Route-to-label map for contextual "Start from here" ──────────
const ROUTE_LABELS: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/guardians': 'Guardians',
  '/app/medications': 'Medications',
  '/app/health-memory': 'Health Memory',
  '/app/bill-explainer': 'Bill Explainer',
  '/app/previous-bills': 'Previous Bills',
  '/app/doctor-summaries': 'Doctor Summaries',
  '/app/symptom-checker': 'Symptom Checker',
  '/app/profile': 'Profile',
  '/app/settings': 'Settings',
};

// ─── Step groups keyed by section name ─────────────────────────────
// Each section has: route (to navigate to), steps (on that page)

interface TourSection {
  key: string;
  label: string;
  route: string;
  steps: DriveStep[];
}

const TOUR_SECTIONS: TourSection[] = [
  {
    key: 'welcome',
    label: 'Welcome',
    route: '/app',
    steps: [
      {
        popover: {
          title: '👋 Welcome to Continuum Health!',
          description: 'Continuum is your AI-powered family health companion. This guided tour will walk you through <strong>every feature</strong> in detail. Use the Next/Back buttons to navigate.',
        }
      },
      {
        element: '#tour-profile-switcher',
        popover: {
          title: '👤 Profile Switcher',
          description: 'Switch between <strong>your own profile</strong> and any <strong>dependents</strong> you manage (children, parents, etc). All data across the entire app is automatically scoped to whoever is selected here.',
          side: "bottom", align: 'start'
        }
      },
      {
        element: '#tour-theme-toggle',
        popover: {
          title: '🌙 Theme Toggle',
          description: 'Switch between <strong>Light</strong> and <strong>Dark</strong> mode instantly. Your preference is remembered across sessions.',
          side: "bottom", align: 'start'
        }
      },
    ]
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    route: '/app',
    steps: [
      {
        element: '#tour-nav-dashboard',
        popover: {
          title: '📊 Dashboard',
          description: 'Your central command center. View <strong>health trends</strong>, <strong>expenses</strong>, and <strong>insights</strong> at a glance.',
          side: "right", align: 'start'
        }
      },
      {
        element: '#tour-dashboard-completion',
        popover: {
          title: '🛡️ Secure Your Identity',
          description: 'Always keep an eye on this <strong>Completion Alert</strong>. It identifies missing clinical information that is vital for first responders to save your life in an emergency.',
          side: "bottom", align: "center"
        }
      },
    ]
  },
  {
    key: 'guardians',
    label: 'Guardians',
    route: '/app/guardians',
    steps: [
      {
        element: '#tour-nav-guardians',
        popover: {
          title: '👨‍👩‍👧‍👦 Circle of Care',
          description: 'Manage health profiles for your <strong>entire family</strong>. Unlike traditional apps, Continuum allows you to securely "Link" existing users to view their real-time medical data.',
          side: "right", align: 'start'
        }
      },
      {
        element: '#tour-guard-add',
        popover: {
          title: '🔗 Smart Account Linking',
          description: 'When adding a member, choose <em>"Connect Existing User"</em> to link their actual Continuum account via <strong>OTP Verification</strong>. This ensures a high-trust connection before any sensitive data is shared.',
          side: "bottom", align: 'end'
        },
        onHighlightStarted: () => {
          // Trigger the modal to open in the background so we can show next steps
          window.dispatchEvent(new CustomEvent('continuum-tour:open-add-modal'));
        }
      },
      {
        element: '#tour-guard-connect-btn',
        popover: {
          title: '🤝 Connect Real Users',
          description: 'Use this option if the person already has a Continuum account. You only need their email or phone number to request a secure link.',
          side: "top", align: 'center'
        }
      },
      {
        element: '#tour-guard-manual-btn',
        popover: {
          title: '📝 Manual vs Shadow Profiles',
          description: 'Use this for children or relatives without accounts. <strong>Pro Tip:</strong> If you enter their email here, we\'ll create a "Shadow Account" so they can claim their data later!',
          side: "top", align: 'center'
        }
      },
      {
        element: '#tour-guard-cards',
        popover: {
          title: '🔄 Deep Data Synchronization',
          description: 'Once linked, the <strong>"Active Profile"</strong> indicator (the glowing border and badge) confirms you are viewing their <strong>actual medical data</strong> — including theirs real medications and symptoms — in real-time.',
          side: "top", align: 'center'
        },
        onHighlightStarted: () => {
          // Close the modal when we move to the next part of the tour
          window.dispatchEvent(new CustomEvent('continuum-tour:close-add-modal'));
        }
      },
      {
        element: '#tour-guard-cards',
        popover: {
          title: '🛡️ Emergency Health Passports',
          description: 'Generate QR-based <strong>Medical Passports</strong> for any profile. First responders can instantly access critical info — even if you or your dependent are incapacitated.',
          side: "top", align: 'center'
        }
      },
    ]
  },
  {
    key: 'medications',
    label: 'Medications',
    route: '/app/medications',
    steps: [
      {
        element: '#tour-nav-medications',
        popover: {
          title: '💊 Smart Medications',
          description: 'Track your prescriptions and let AI <strong>cross-reference them against the OpenFDA drug database</strong> for dangerous interactions.',
          side: "right", align: 'start'
        }
      },
      {
        element: '#tour-med-add',
        popover: {
          title: '➕ Add a Medication',
          description: 'Click here to register a new prescription. Enter the <strong>drug name, dosage, and frequency</strong>. Before saving, AI will automatically query the <strong>OpenFDA API</strong> and use Gemini to check for interactions with your current medications. If a conflict is found, you\'ll see a <strong>red severity alert</strong>.',
          side: "bottom", align: 'end'
        }
      },
      {
        element: '#tour-med-cards',
        popover: {
          title: '📋 Your Medication Cards',
          description: 'Each card shows a medication\'s <strong>name, dosage, frequency</strong>, and its <strong>FDA safety status</strong> (green checkmark = safe, red shield = interaction detected). You can <strong>Stop/Resume</strong> medications or delete them. Stopped medications are excluded from future interaction checks.',
          side: "top", align: 'center'
        }
      },
    ]
  },
  {
    key: 'health-memory',
    label: 'Health Memory',
    route: '/app/health-memory',
    steps: [
      {
        element: '#tour-nav-health-memory',
        popover: {
          title: '🧠 Health Memory',
          description: 'A conversational health journal. Chat naturally and AI organizes everything into <strong>structured medical data</strong>.',
          side: "right", align: 'start'
        }
      },
      {
        element: '#tour-hm-chat',
        popover: {
          title: '💬 Health Chat',
          description: 'Type messages like <em>"I had a headache at 3PM"</em> or <em>"Took Paracetamol 500mg"</em>. AI extracts <strong>symptoms, medications, mood, sleep data, and vitals</strong> automatically. You can also use the <strong>🎤 Microphone</strong> for voice input, <strong>📷 Camera</strong> to snap prescriptions, or <strong>🖼️ Image upload</strong> for lab reports.',
          side: "left", align: 'start'
        }
      },
      {
        element: '#tour-hm-timeline',
        popover: {
          title: '📅 Health Timeline',
          description: 'Every chat message becomes a <strong>structured health entry</strong> here — tagged by type (symptom, medication, mood, sleep, etc.) with timestamps. This is your <strong>living medical record</strong> that grows over time.',
          side: "left", align: 'start'
        }
      },
      {
        element: '#tour-hm-summary-btn',
        popover: {
          title: '📋 Generate Doctor Summary',
          description: 'Click this to ask AI to compile a <strong>comprehensive patient summary</strong> from your recent entries. It produces <strong>key insights and recommendations</strong> you can share with your doctor before appointments. Summaries are saved permanently under Doctor Summaries.',
          side: "bottom", align: 'end'
        }
      },
    ]
  },
  {
    key: 'bill-explainer',
    label: 'Bill Explainer',
    route: '/app/bill-explainer',
    steps: [
      {
        element: '#tour-nav-bill-explainer',
        popover: {
          title: '🧾 Bill Explainer',
          description: 'Upload complex hospital bills and let AI break them down into <strong>plain language</strong> with itemized breakdowns.',
          side: "right", align: 'start'
        }
      },
      {
        element: '#tour-bill-dropzone',
        popover: {
          title: '📤 Upload a Bill',
          description: '<strong>Drag & drop</strong> a PDF, image (JPG/PNG), or text file of your medical bill here. For images, <strong>OCR automatically extracts the text</strong> first. You can also click to browse files from your device.',
          side: "bottom", align: 'center'
        }
      },
      {
        element: '#tour-bill-textarea',
        popover: {
          title: '📝 Or Paste Text',
          description: 'If you have the bill text copied from an email or document, <strong>paste it directly here</strong>. AI will parse <strong>line items, hospital info, dates, costs</strong>, and categorize charges (consultation, tests, procedures, medicine, etc.).',
          side: "top", align: 'center'
        }
      },
      {
        element: '#tour-bill-insurance',
        popover: {
          title: '🛡️ Insurance Settings',
          description: 'Configure your insurance plan here — set your <strong>copay percentage</strong>, <strong>remaining deductible</strong>, and select which <strong>categories are covered</strong>. After processing a bill, you\'ll see a beautiful visual bar chart showing what <strong>insurance covers vs. what you pay out-of-pocket</strong>.',
          side: "bottom", align: 'end'
        }
      },
    ]
  },
  {
    key: 'previous-bills',
    label: 'Previous Bills',
    route: '/app/previous-bills',
    steps: [
      {
        element: '#tour-nav-previous-bills',
        popover: {
          title: '📂 Previous Bills',
          description: 'All your processed bills are <strong>archived here</strong>. Search by patient name, hospital, or line items. Click any bill to view its full AI analysis with <strong>insurance breakdown, line items, and anomaly detection</strong>.',
          side: "right", align: 'start'
        }
      },
    ]
  },
  {
    key: 'doctor-summaries',
    label: 'Doctor Summaries',
    route: '/app/doctor-summaries',
    steps: [
      {
        element: '#tour-nav-doctor-summaries',
        popover: {
          title: '📋 Doctor Summaries',
          description: 'Browse all AI-generated <strong>patient summaries</strong> with insights and recommendations. <strong>Star your favorites</strong> for quick access, search by keyword, and share them with your healthcare provider before appointments.',
          side: "right", align: 'start'
        }
      },
    ]
  },
  {
    key: 'symptom-checker',
    label: 'Symptom Checker',
    route: '/app/symptom-checker',
    steps: [
      {
        element: '#tour-nav-symptom-checker',
        popover: {
          title: '🫀 Intelligence-Driven Symptom Tracking',
          description: 'Go beyond simple logging. Track symptoms with <strong>severity, triggers, and duration</strong> while AI discovers hidden correlations with your sleep and stress levels.',
          side: "right", align: 'start'
        }
      },
      {
        element: '#tour-sc-add-btn',
        popover: {
          title: '➕ Detail-Rich Logging',
          description: 'Log new symptoms with high precision. Capture not just what hurts, but what triggered it and how it affected your day.',
          side: "bottom", align: 'end'
        }
      },
      {
        element: '#tour-sc-analyze',
        popover: {
          title: '🔬 Discover Patterns',
          description: 'Our proprietary analysis engine group symptoms into <strong>Patterns</strong>. See if your headaches correlate with "Lisinopril" doses or "Late night working" sessions automatically.',
          side: "bottom", align: 'start'
        }
      },
      {
        element: '#tour-sc-heatmap',
        popover: {
          title: '🔥 Clinical Heatmap',
          description: 'Visualize your pain points on an <strong>interactive anatomical model</strong>. Deeper red zones indicate chronic or severe issues. Toggle views to pinpoint issues across the entire body.',
          side: "right", align: 'center'
        }
      },
    ]
  },
  {
    key: 'profile',
    label: 'Profile',
    route: '/app/profile',
    steps: [
      {
        element: '#tour-nav-profile',
        popover: {
          title: '👤 Your Medical ID',
          description: 'This is your official **Medical Profile**. It is a read-only view of exactly what first responders and guardians see.',
          side: "right", align: 'start'
        }
      },
      {
        element: '#tour-profile-provenance',
        popover: {
          title: '🔍 Data Provenance',
          description: 'Every clinical detail here is interactive. Hover over any entry to see its **Source and Verification Date** (e.g., AI Extraction or Manual Verification).',
          side: "top", align: 'center'
        }
      },
      {
        element: '#tour-profile-settings',
        popover: {
          title: '⚙️ Management Mode',
          description: 'Need to make changes? Use the **Settings Gear** to switch to Editing Mode and update your medical credentials.',
          side: "left", align: 'start'
        }
      },
    ]
  },
  {
    key: 'settings',
    label: 'Settings',
    route: '/app/settings',
    steps: [
      {
        element: '#tour-nav-settings',
        popover: {
          title: '⚙️ Clinical Settings',
          description: 'Update your official medical identity, including gender, blood group, and contact information.',
          side: "right", align: 'start'
        }
      },
      {
        element: '#tour-settings-care-circle',
        popover: {
          title: '🤝 Emergency Care Circle',
          description: 'Continuum now supports **multiple emergency contacts**. Add family, friends, or medical proxies to your care network.',
          side: "top", align: 'center'
        }
      },
      {
        element: '#tour-settings-add-contact-btn',
        popover: {
          title: '➕ Multi-Contact Editing',
          description: 'Add as many responders as you need. You can also click the **Pencil icon** on existing contacts to update them instantly.',
          side: "left", align: 'center'
        }
      },
      {
        element: '#tour-settings-save',
        popover: {
          title: '💾 Sticky Save Bar',
          description: 'Changes are never lost! This **fixed save bar** is always available so you can synchronize your medical record the second you\'re done editing.',
          side: "top", align: 'center'
        }
      },
    ]
  },
  {
    key: 'finish',
    label: 'Finish',
    route: '',
    steps: [
      {
        popover: {
          title: '🎉 You\'re All Set!',
          description: 'That covers every feature of <strong>Continuum Health</strong>! Remember, you can always re-launch this tour by clicking the <strong>"Take Tour"</strong> button in the bottom-right corner. Stay healthy! 💚',
        }
      },
    ]
  },
];

// ─── Helpers ───────────────────────────────────────────────────────
function getSectionIndexByRoute(route: string): number {
  return TOUR_SECTIONS.findIndex(s => s.route === route);
}

function buildStepsAndRouteMap(startSectionIndex: number = 0) {
  const allSteps: DriveStep[] = [];
  // Maps step index → route to navigate to BEFORE showing that step
  const routeMap: Record<number, string> = {};
  let prevRoute = '';

  for (let si = startSectionIndex; si < TOUR_SECTIONS.length; si++) {
    const section = TOUR_SECTIONS[si];
    for (let i = 0; i < section.steps.length; i++) {
      const stepIdx = allSteps.length;
      allSteps.push(section.steps[i]);

      // If first step of this section AND this section has a different route, mark navigation
      if (i === 0 && section.route && section.route !== prevRoute) {
        routeMap[stepIdx] = section.route;
      }
      // If not first step but still needs to be on the right page
      if (i > 0 && section.route && section.route !== prevRoute) {
        routeMap[stepIdx] = section.route;
      }
    }
    if (section.route) prevRoute = section.route;
  }

  return { allSteps, routeMap };
}

// ─── Component ─────────────────────────────────────────────────────

export function WalkthroughOverlay() {
  const isInitialized = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  const launchTour = useCallback((startSectionIndex: number = 0) => {
    const { allSteps, routeMap } = buildStepsAndRouteMap(startSectionIndex);
    const startRoute = TOUR_SECTIONS[startSectionIndex]?.route || '/app';

    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      doneBtnText: 'Finish Tour 🎉',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      popoverClass: 'continuum-tour-popover',
      stagePadding: 10,
      stageRadius: 12,
      overlayColor: 'rgba(0, 0, 0, 0.92)',
      steps: allSteps,
      onNextClick: () => {
        const currentIdx = driverObj.getActiveIndex();
        if (currentIdx === null || currentIdx === undefined) {
          driverObj.moveNext();
          return;
        }
        const nextIdx = currentIdx + 1;
        if (nextIdx >= allSteps.length) {
          driverObj.destroy();
          return;
        }
        const targetRoute = routeMap[nextIdx];
        if (targetRoute && window.location.pathname !== targetRoute) {
          navigate(targetRoute);
          setTimeout(() => driverObj.moveNext(), 450);
        } else {
          driverObj.moveNext();
        }
      },
      onPrevClick: () => {
        const currentIdx = driverObj.getActiveIndex();
        if (currentIdx === null || currentIdx === undefined || currentIdx <= 0) return;
        const prevIdx = currentIdx - 1;
        // Find which route the prev step belongs to
        let targetRoute = '';
        for (let i = prevIdx; i >= 0; i--) {
          if (routeMap[i]) { targetRoute = routeMap[i]; break; }
        }
        if (targetRoute && window.location.pathname !== targetRoute) {
          navigate(targetRoute);
          setTimeout(() => driverObj.movePrevious(), 450);
        } else {
          driverObj.movePrevious();
        }
      },
    });

    // Navigate to the starting route first
    if (window.location.pathname !== startRoute) {
      navigate(startRoute);
      setTimeout(() => driverObj.drive(), 500);
    } else {
      // Small delay for DOM settling
      setTimeout(() => driverObj.drive(), 100);
    }
  }, [navigate]);

  // Auto-launch on first login
  useEffect(() => {
    if (!isInitialized.current && location.pathname.startsWith('/app')) {
      const hasSeenTour = localStorage.getItem('continuum_has_seen_tour');
      if (!hasSeenTour) {
        setTimeout(() => {
          launchTour(0);
          localStorage.setItem('continuum_has_seen_tour', 'true');
        }, 1200);
      }
      isInitialized.current = true;
    }
  }, [location.pathname, launchTour]);

  // Find current page label for "Start from here"
  const currentPageLabel = ROUTE_LABELS[location.pathname];
  const currentSectionIndex = getSectionIndexByRoute(location.pathname);

  return (
    <>
      {/* Custom CSS for high-contrast highlighting */}
      <style>{`
        .driver-overlay svg path {
          fill-opacity: 0.85 !important;
        }
        .continuum-tour-popover {
          background: hsl(var(--card)) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 16px !important;
          box-shadow: 0 25px 60px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05) !important;
          max-width: 400px !important;
          padding: 20px !important;
        }
        .continuum-tour-popover .driver-popover-title {
          font-size: 18px !important;
          font-weight: 700 !important;
          line-height: 1.4 !important;
          margin-bottom: 4px !important;
        }
        .continuum-tour-popover .driver-popover-description {
          font-size: 13.5px !important;
          line-height: 1.7 !important;
          color: hsl(var(--muted-foreground)) !important;
          margin-top: 8px !important;
        }
        .continuum-tour-popover .driver-popover-description strong {
          color: hsl(var(--foreground)) !important;
          font-weight: 600 !important;
        }
        .continuum-tour-popover .driver-popover-description em {
          color: hsl(var(--primary)) !important;
          font-style: italic !important;
        }
        .continuum-tour-popover .driver-popover-progress-text {
          font-size: 12px !important;
          color: hsl(var(--muted-foreground)) !important;
          opacity: 0.7 !important;
        }
        .continuum-tour-popover .driver-popover-navigation-btns {
          gap: 12px !important;
          margin-top: 24px !important;
        }
        .continuum-tour-popover .driver-popover-navigation-btns button {
          border-radius: 12px !important;
          font-size: 13.5px !important;
          padding: 10px 22px !important;
          font-weight: 700 !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          text-transform: none !important;
          letter-spacing: -0.01em !important;
          border: none !important;
          text-shadow: none !important;
        }
        .continuum-tour-popover .driver-popover-next-btn {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39) !important;
          font-weight: 800 !important;
        }
        .continuum-tour-popover .driver-popover-next-btn:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45) !important;
          filter: brightness(1.05) !important;
        }
        .continuum-tour-popover .driver-popover-prev-btn {
          background: hsl(var(--secondary)) !important;
          color: hsl(var(--secondary-foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }
        .continuum-tour-popover .driver-popover-prev-btn:hover {
          background: hsl(var(--secondary)/0.8) !important;
          border-color: hsl(var(--primary)/0.3) !important;
        }
        .continuum-tour-popover .driver-popover-close-btn {
          color: hsl(var(--muted-foreground)) !important;
          font-size: 20px !important;
          font-weight: 300 !important;
        }
        .continuum-tour-popover .driver-popover-close-btn:hover {
          color: hsl(var(--destructive)) !important;
        }
      `}</style>

      {/* Floating Tour Button with Dropdown */}
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="rounded-full shadow-lg shadow-primary/30 gap-2 pr-5 transition-transform hover:scale-105 active:scale-95"
            >
              <HelpCircle className="h-5 w-5" />
              Take Tour
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-[220px] mb-2">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Start your guided tour
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => launchTour(0)}
              className="gap-2 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Begin from Start
            </DropdownMenuItem>

            {currentPageLabel && currentSectionIndex > 0 && (
              <DropdownMenuItem
                onClick={() => launchTour(currentSectionIndex)}
                className="gap-2 cursor-pointer"
              >
                <Play className="h-4 w-4" />
                Begin from {currentPageLabel}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
