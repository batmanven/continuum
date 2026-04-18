import { useEffect, useRef, useCallback, useState } from "react";
import { driver, DriveStep, Driver } from "driver.js";
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

// ─── Constants ─────────────────────────────────────────────────────
const TOUR_SEEN_KEY = "continuum_has_seen_tour";
const MODAL_SETTLE_MS = 420; 
const NAV_SETTLE_MS = 800;
const INITIAL_DELAY_MS = 1200;

// ─── Route-to-label map ─────────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
  "/app": "Dashboard",
  "/app/guardians": "Guardians",
  "/app/medications": "Medications",
  "/app/health-memory": "Health Memory",
  "/app/bill-explainer": "Bill Explainer",
  "/app/doctor-summaries": "Summaries",
  "/app/symptom-checker": "Symptoms",
  "/app/doctor-search": "Find Doctors",
  "/app/my-doctors": "My Doctors",
  "/app/chats": "Consultations",
  "/app/prescriptions": "Prescriptions",
  "/app/reports": "Medical Reports",
  "/app/profile": "Profile",
  "/app/settings": "Settings",
  // Doctor routes
  "/doctor": "Specialist Hub",
  "/doctor/patients": "Patients",
  "/doctor/consultations": "Master Archive",
  "/doctor/profile": "Specialist Profile",
  "/doctor/settings": "Portal Settings",
};

// ─── Custom events ──────────────────────────────────────────────────
const EVENTS = {
  REFRESH: "continuum-tour:refresh",
  OPEN_ADD_MODAL: "continuum-tour:open-add-modal",
  CLOSE_ADD_MODAL: "continuum-tour:close-add-modal",
  OPEN_INSURANCE: "continuum-tour:open-insurance-settings",
  CLOSE_INSURANCE: "continuum-tour:close-insurance-settings",
} as const;

function emit(name: string) {
  window.dispatchEvent(new CustomEvent(name));
}

interface TourSection {
  key: string;
  label: string;
  route: string;
  steps: DriveStep[];
}

// ─── CLINICAL PATIENT TOUR (28 CARDS) ───────────────────────────────
const PATIENT_TOUR_SECTIONS: TourSection[] = [
  {
    key: "welcome",
    label: "Welcome",
    route: "/app",
    steps: [
      {
        popover: {
          title: "👋 Welcome to Continuum!",
          description: "Continuum is your AI-powered family health companion. This tour highlights your <strong>clinical command center</strong>. Use Next/Back to navigate.",
        },
      },
      {
        element: "#tour-profile-switcher",
        popover: {
          title: "👤 Family Health Profiles",
          description: "Switch between <strong>your own profile</strong> and family members. Data across the app updates instantly to whoever is selected.",
          side: "bottom",
          align: "start",
        },
      },
    ],
  },
  {
    key: "dashboard",
    label: "Dashboard",
    route: "/app",
    steps: [
      {
        element: "#tour-nav-dashboard",
        popover: {
          title: "📊 Clinical Dashboard",
          description: "Your central hub for <strong>health trends</strong>, <strong>expenses</strong>, and immediate AI insights.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-dashboard-completion",
        popover: {
          title: "🛡️ Secure Your Identity",
          description: "This identifies missing <strong>vital information</strong> that first responders need to save lives in an emergency.",
          side: "bottom",
          align: "center",
        },
      },
    ],
  },
  {
    key: "health-memory",
    label: "Health Memory",
    route: "/app/health-memory",
    steps: [
      {
        element: "#tour-nav-health-memory",
        popover: {
          title: "🧠 Health Memory",
          description: "Chat naturally; AI extracts symptoms, sleep, and vitals into a <strong>structured health timeline</strong>.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-hm-chat",
        popover: {
          title: "💬 Intelligent Timeline",
          description: "Every message becomes a tagged entry in your <strong>living medical record</strong>, growing every day.",
          side: "left",
          align: "start",
        },
      },
      {
        element: "#tour-hm-summary-btn",
        popover: {
          title: "📋 Generate Doctor Summary",
          description: "Compile longitudinal entries into a <strong>professional patient summary</strong> to share with your provider.",
          side: "bottom",
          align: "end",
        },
      },
    ],
  },
  {
    key: "symptom-checker",
    label: "Symptoms",
    route: "/app/symptom-checker",
    steps: [
      {
        element: "#tour-nav-symptom-checker",
        popover: {
          title: "🫀 Intelligence-Driven Tracking",
          description: "Track symptoms while AI finds hidden <strong>stress and sleep correlations</strong>.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-sc-heatmap",
        popover: {
          title: "🔥 Pain Heatmap",
          description: "Visualize density on an <strong>interactive model</strong>. Red zones indicate high-severity areas.",
          side: "right",
          align: "center",
        },
      },
    ],
  },
  {
    key: "doctor-summaries",
    label: "Summaries",
    route: "/app/doctor-summaries",
    steps: [
      {
        element: "#tour-nav-doctor-summaries",
        popover: {
          title: "📋 History & Starred",
          description: "Access all your health summaries. <strong>Star favorites</strong> for immediate recall during visits.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-ds-hero",
        popover: {
          title: "👨‍⚕️ Pre-Visit Brief",
          description: "Generate <strong>high-density briefs</strong> that highlight clinical patterns to discuss with your doctor.",
          side: "top",
          align: "center",
        },
      },
    ],
  },
  {
    key: "bill-explainer",
    label: "Bill Explainer",
    route: "/app/bill-explainer",
    steps: [
      {
        element: "#tour-nav-bill-explainer",
        popover: {
          title: "🧾 Bill Explainer",
          description: "AI-powered OCR breaks down hospital bills into <strong>plain language</strong> line items.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-bill-dropzone",
        popover: {
          title: "📤 Upload & Parse",
          description: "Drag PDFs or images here. AI categorizes hospital fees, costs, and <strong>anomaly detection</strong>.",
          side: "bottom",
          align: "center",
        },
      },
    ],
  },
  {
    key: "doctor-search",
    label: "Find Doctors",
    route: "/app/doctor-search",
    steps: [
      {
        element: "#tour-nav-find-doctors",
        popover: {
          title: "🩺 Find Specialists",
          description: "Browse verified doctors and <strong>initiate secure consultations</strong> directly from the vault.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-doctor-search-box",
        popover: {
          title: "🔍 Precision Filtering",
          description: "Filter by <strong>specialization</strong>, <strong>hospital</strong>, or <strong>consultation fee</strong> to find your ideal match.",
          side: "bottom",
          align: "center",
        },
      },
    ],
  },
  {
    key: "my-doctors",
    label: "My Doctors",
    route: "/app/my-doctors",
    steps: [
      {
        element: "#tour-nav-my-doctors",
        popover: {
          title: "👥 My Specialist Network",
          description: "Quickly access the profiles of doctors you've <strong>already consulted</strong> or pinned.",
          side: "right",
          align: "start",
        },
      },
    ],
  },
  {
    key: "chats",
    label: "Consultations",
    route: "/app/chats",
    steps: [
      {
        element: "#tour-nav-my-consultations",
        popover: {
          title: "💬 Consultation History",
          description: "View and continue your active and archived <strong>clinical chat sessions</strong> with specialists.",
          side: "right",
          align: "start",
        },
      },
    ],
  },
  {
    key: "prescriptions",
    label: "Prescriptions",
    route: "/app/prescriptions",
    steps: [
      {
        element: "#tour-nav-my-prescriptions",
        popover: {
          title: "💊 Unified Script Vault",
          description: "A secure repository for both <strong>official digital prescriptions</strong> and self-uploaded physical scripts.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-prescriptions-list",
        popover: {
          title: "🛡️ Medication Integrity",
          description: "Clinical indicators verify the provenance of each entry, ensuring your <strong>records are audit-ready</strong>.",
          side: "top",
          align: "center",
        },
      },
    ],
  },
  {
    key: "reports",
    label: "Medical Reports",
    route: "/app/reports",
    steps: [
      {
        element: "#tour-nav-medical-reports",
        popover: {
          title: "📂 Diagnostic Document Vault",
          description: "Store, search, and analyze <strong>lab results</strong> and <strong>imaging reports</strong> in one encrypted home.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-reports-grid",
        popover: {
          title: "🧠 Intelligence Analysis",
          description: "Our AI engine highlights <strong>clinical trends</strong> across multiple diagnostic reports over time.",
          side: "top",
          align: "center",
        },
      },
    ],
  },
  {
    key: "guardians",
    label: "Guardians",
    route: "/app/guardians",
    steps: [
      {
        element: "#tour-nav-guardians",
        popover: {
          title: "👨‍👩‍👧‍👦 Circle of Care",
          description: "Manage and <strong>link family accounts</strong> to view their real-time medical data securely.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-guard-cards",
        popover: {
          title: "🛡️ Medical QR Codes",
          description: "Generate <strong>emergency QR codes</strong> so first responders can access critical info instantly.",
          side: "top",
          align: "center",
        },
      },
    ],
  },
  {
    key: "profile",
    label: "Profile",
    route: "/app/profile",
    steps: [
      {
        element: "#tour-nav-profile",
        popover: {
          title: "👤 Verified Medical ID",
          description: "The official view first responders see. A <strong>read-only medical vault</strong> of your primary credentials.",
          side: "right",
          align: "end",
        },
      },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    route: "/app/settings",
    steps: [
      {
        element: "#tour-nav-settings",
        popover: {
          title: "⚙️ Portal Configuration",
          description: "Update your official identity, blood group, and <strong>Responder Network</strong> settings.",
          side: "right",
          align: "end",
        },
      },
    ],
  },
  {
    key: "finish",
    label: "Finish",
    route: "/app",
    steps: [
      {
        popover: {
          title: "🚀 Mastery Achieved",
          description: "You're now ready to use Continuum as your <strong>clinical command center</strong>. Stay healthy!",
        },
      },
    ],
  },
];

// ─── CLINICAL DOCTOR TOUR (13 CARDS) ──────────────────────────────
const DOCTOR_TOUR_SECTIONS: TourSection[] = [
  {
    key: "welcome",
    label: "Welcome",
    route: "/doctor",
    steps: [
      {
        popover: {
          title: "🏥 Specialist Command Center",
          description: "Welcome to your clinical workspace. This tour highlights your <strong>unified consultation workflow</strong> and patient management tools.",
        },
      },
    ],
  },
  {
    key: "navigation",
    label: "Navigation",
    route: "/doctor",
    steps: [
      {
        element: "#tour-nav-patients",
        popover: {
          title: "👥 Patient Network",
          description: "View and manage your global patient list. Detailed longitudinal history is only a click away.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-nav-consultations",
        popover: {
          title: "🩺 Unified Consultations",
          description: "This is your primary hub. It merges <strong>live sessions</strong> and <strong>fused historical archives</strong> into one place.",
          side: "right",
          align: "start",
        },
      },
    ],
  },
  {
    key: "consultations",
    label: "Consultations",
    route: "/doctor/consultations",
    steps: [
      {
        element: "#tour-portal-tabs",
        popover: {
          title: "🚦 Intake Queue & active",
          description: "Manage <strong>Pending</strong> requests, <strong>Active</strong> sessions, and your <strong>Unified Archive</strong> from these tabs.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-portal-search",
        popover: {
          title: "🔍 Universal History Search",
          description: "Retrieve any record instantly. Searches across diagnoses, symptoms, and patient names in real-time.",
          side: "bottom",
          align: "end",
        },
      },
    ],
  },
  {
    key: "patient-review",
    label: "Patient Review",
    route: "/doctor/patients", // Helper will redirect if needed
    steps: [
      {
        element: "#tour-patient-identity",
        popover: {
          title: "🆔 Verified Medical ID",
          description: "Real-time verification of blood group, gender, and clinical activity history.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#tour-generate-summary-btn",
        popover: {
          title: "⚡ Clinical Synthesis",
          description: "Let AI synthesize weeks of patient history into key <strong>insights and recommendations</strong> in seconds.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#tour-patient-timeline",
        popover: {
          title: "📅 Longitudinal Record",
          description: "A complete timeline of every symptom, medication intake, and mood change reported by the patient.",
          side: "top",
          align: "center",
        },
      },
      {
        element: "#tour-write-consultation-btn",
        popover: {
          title: "📝 Write Consultation",
          description: "Log manual clinical entries for in-person visits or formal walk-in records.",
          side: "bottom",
          align: "end",
        },
      },
    ],
  },
  {
    key: "finish",
    label: "Finish",
    route: "",
    steps: [
      {
        popover: {
          title: "🛡️ Specialist Portal Activated",
          description: "You're all set to manage your clinical consultations with precision. Stay impactful! 🩺",
        },
      },
    ],
  },
]; 

export function WalkthroughOverlay() {
  const isInitialized = useRef(false);
  const driverRef = useRef<Driver | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [tourVisible, setTourVisible] = useState(true);

  // Serve correct tour sections based on route
  const isDoctorSite = location.pathname.startsWith("/doctor");
  const TOUR_SECTIONS = isDoctorSite ? DOCTOR_TOUR_SECTIONS : PATIENT_TOUR_SECTIONS;

  useEffect(() => {
    document.body.classList.toggle("continuum-tour-hidden", !tourVisible);
    return () => document.body.classList.remove("continuum-tour-hidden");
  }, [tourVisible]);

  useEffect(() => {
    const handleRefresh = () => setTimeout(() => driverRef.current?.refresh(), 50);
    window.addEventListener(EVENTS.REFRESH, handleRefresh);
    return () => window.removeEventListener(EVENTS.REFRESH, handleRefresh);
  }, []);

  const navigateThen = useCallback((targetRoute: string, cb: () => void) => {
    if (window.location.pathname !== targetRoute) {
      navigate(targetRoute);
      setTimeout(cb, NAV_SETTLE_MS);
    } else cb();
  }, [navigate]);

  const launchTour = useCallback(async (startSectionIndex = 0) => {
    const allSteps: DriveStep[] = [];
    const routeMap: Record<number, string> = {};

    for (let si = startSectionIndex; si < TOUR_SECTIONS.length; si++) {
      const section = TOUR_SECTIONS[si];
      section.steps.forEach((step) => {
        const idx = allSteps.length;
        allSteps.push(step);
        if (section.route) routeMap[idx] = section.route;
      });
    }

    const moveToStep = async (targetIdx: number) => {
      if (targetIdx < 0 || targetIdx >= allSteps.length) {
        driverObj.destroy();
        return;
      }

      let targetRoute = routeMap[targetIdx];
      
      // Special handling for Patient Review (redirect to first patient if on list)
      if (isDoctorSite && targetRoute === "/doctor/patients" && TOUR_SECTIONS[startSectionIndex]?.key === 'patient-review') {
         // This is a simplified logic, in reality we'd need a real patient ID.
         // For the tour, we assume the user might need to click a patient first, or we mock a link.
         // However, most tours start from a dashboard.
      }

      const step = allSteps[targetIdx];

      const proceed = async () => {
        const selector = typeof step.element === "string" ? step.element : null;
        if (selector && !document.querySelector(selector)) {
          step.onHighlightStarted?.(document.body, step, {
            config: driverObj.getConfig(),
            state: driverObj.getState(),
            driver: driverObj,
          });
          await new Promise(r => setTimeout(r, 200));
        }
        setTourVisible(true);
        driverObj.moveTo(targetIdx);
      };

      if (targetRoute && window.location.pathname !== targetRoute) {
        setTourVisible(false);
        navigate(targetRoute);
        setTimeout(proceed, NAV_SETTLE_MS);
      } else await proceed();
    };

    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      doneBtnText: "Finish 🎉",
      nextBtnText: "Next",
      prevBtnText: "Back",
      popoverClass: "continuum-tour-popover",
      stagePadding: 14,
      overlayColor: "rgba(0, 0, 0, 0.85)",
      steps: allSteps,
      onNextClick: () => moveToStep((driverObj.getActiveIndex() ?? -1) + 1),
      onPrevClick: () => {
        const current = driverObj.getActiveIndex() ?? 0;
        if (current > 0) moveToStep(current - 1);
      },
      onDestroyed: () => {
        setTourVisible(true);
        emit(EVENTS.CLOSE_ADD_MODAL);
        emit(EVENTS.CLOSE_INSURANCE);
      },
    });

    driverRef.current = driverObj;
    const startRoute = TOUR_SECTIONS[startSectionIndex]?.route || (isDoctorSite ? "/doctor" : "/app");
    navigateThen(startRoute, () => driverObj.drive());
  }, [navigate, navigateThen, TOUR_SECTIONS, isDoctorSite]);

  useEffect(() => {
    if (!isInitialized.current && location.pathname.startsWith(isDoctorSite ? "/doctor" : "/app")) {
      const seenKey = `${TOUR_SEEN_KEY}${isDoctorSite ? '_doc' : '_pat'}`;
      if (!localStorage.getItem(seenKey)) {
        setTimeout(() => {
          launchTour(0);
          localStorage.setItem(seenKey, "true");
        }, INITIAL_DELAY_MS);
      }
      isInitialized.current = true;
    }
  }, [location.pathname, launchTour, isDoctorSite]);

  const currentPageLabel = ROUTE_LABELS[location.pathname];
  const currentSectionIndex = TOUR_SECTIONS.findIndex(s => s.route === location.pathname);

  return (
    <>
      <style>{`
        body.continuum-tour-hidden .driver-overlay,
        body.continuum-tour-hidden .driver-popover-wrapper,
        body.continuum-tour-hidden .driver-popover,
        body.continuum-tour-hidden #driver-highlighted-element-stage {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        .continuum-tour-popover {
          background: hsl(var(--card)) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 16px !important;
          box-shadow: 0 24px 48px -8px rgba(0, 0, 0, 0.28) !important;
          max-width: 320px !important;
          padding: 16px !important;
        }
        .continuum-tour-popover .driver-popover-title {
          font-size: 16px !important;
          font-weight: 700 !important;
          color: hsl(var(--foreground)) !important;
        }
        .continuum-tour-popover .driver-popover-description {
          font-size: 13px !important;
          line-height: 1.6 !important;
          color: hsl(var(--muted-foreground)) !important;
          margin-top: 6px !important;
        }
        .continuum-tour-popover .driver-popover-next-btn {
          background: #0f172a !important;
          color: #ffffff !important;
          border: 1px solid #0f172a !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
          text-shadow: none !important;
        }
        .continuum-tour-popover .driver-popover-next-btn:hover {
          background: #1e293b !important;
          transform: none !important;
        }
        .continuum-tour-popover .driver-popover-prev-btn {
          background: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
        }
        .continuum-tour-popover .driver-popover-prev-btn:hover {
          background: #f8fafc !important;
          transform: none !important;
        }
        .driver-popover-wrapper { z-index: 10000 !important; }
        .driver-overlay { z-index: 9999 !important; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg shadow-primary/25 gap-2 pr-5">
              <HelpCircle className="h-5 w-5" />
              Take Tour
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-[200px] mb-2">
            <DropdownMenuItem onClick={() => launchTour(0)} className="gap-2 cursor-pointer">
              <RotateCcw className="h-4 w-4" /> Start Tour
            </DropdownMenuItem>
            {currentPageLabel && currentSectionIndex >= 0 && (
              <DropdownMenuItem onClick={() => launchTour(currentSectionIndex)} className="gap-2 cursor-pointer">
                <Play className="h-4 w-4" /> Resume here
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}