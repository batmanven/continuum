import { useEffect, useRef, useCallback, useState } from "react";
import { driver, DriveStep, Driver, Config, State } from "driver.js";
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
const MODAL_SETTLE_MS = 420; // matches typical CSS transition durations
const NAV_SETTLE_MS = 800;
const INITIAL_DELAY_MS = 1200;

// ─── Route-to-label map ─────────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
  "/app": "Dashboard",
  "/app/guardians": "Guardians",
  "/app/medications": "Medications",
  "/app/health-memory": "Health Memory",
  "/app/bill-explainer": "Bill Explainer",
  "/app/previous-bills": "Previous Bills",
  "/app/doctor-summaries": "Doctor Summaries",
  "/app/symptom-checker": "Symptom Checker",
  "/app/profile": "Profile",
  "/app/settings": "Settings",
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

// ─── Tour section types ─────────────────────────────────────────────
interface TourSection {
  key: string;
  label: string;
  route: string;
  steps: DriveStep[];
}

// ─── Tour sections ──────────────────────────────────────────────────
const TOUR_SECTIONS: TourSection[] = [
  {
    key: "welcome",
    label: "Welcome",
    route: "/app",
    steps: [
      {
        popover: {
          title: "👋 Welcome to Continuum Health!",
          description:
            "Continuum is your AI-powered family health companion. This guided tour will walk you through <strong>every feature</strong> in detail. Use the Next/Back buttons to navigate.",
        },
      },
      {
        element: "#tour-profile-switcher",
        popover: {
          title: "👤 Profile Switcher",
          description:
            "Switch between <strong>your own profile</strong> and any <strong>dependents</strong> you manage (children, parents, etc). All data across the entire app is automatically scoped to whoever is selected here.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-theme-toggle",
        popover: {
          title: "🌙 Theme Toggle",
          description:
            "Switch between <strong>Light</strong> and <strong>Dark</strong> mode instantly. Your preference is remembered across sessions.",
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
          title: "📊 Dashboard",
          description:
            "Your central command center. View <strong>health trends</strong>, <strong>expenses</strong>, and <strong>insights</strong> at a glance.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-dashboard-completion",
        popover: {
          title: "🛡️ Secure Your Identity",
          description:
            "Always keep an eye on this <strong>Completion Alert</strong>. It identifies missing clinical information that is vital for first responders to save your life in an emergency.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#tour-dashboard-score",
        popover: {
          title: "📈 Continuum Score",
          description:
            "This is your <strong>holistic health index</strong>. It dynamically aggregates your symptoms, medication adherence, and sleep patterns into a single weighted score. Click \"Get Insights\" for a deep AI analysis of what's driving your score today.",
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
          description:
            "Manage health profiles for your <strong>entire family</strong>. Unlike traditional apps, Continuum allows you to securely \"Link\" existing users to view their real-time medical data.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-guard-add",
        popover: {
          title: "➕ Add Family Members",
          description:
            "Start here to expand your circle. You can add children, dependents, or link other adult Continuum users.",
          side: "bottom",
          align: "end",
        },
        onDeselected: (_el, _step, _opts) => emit(EVENTS.CLOSE_ADD_MODAL),
      },
      // ── Modal steps: element is resolved after the modal opens ──
      {
        element: "#tour-guard-connect-btn",
        popover: {
          title: "🔗 Smart Account Linking",
          description:
            "When adding a member, choose <em>\"Connect Existing User\"</em> to link their actual Continuum account via <strong>OTP Verification</strong>. This ensures a high-trust connection before any sensitive data is shared.",
          side: "bottom",
          align: "center",
        },
        onHighlightStarted: (_el, _step, _opts) => {
          emit(EVENTS.OPEN_ADD_MODAL);
          setTimeout(() => emit(EVENTS.REFRESH), MODAL_SETTLE_MS);
        },
        onDeselected: (_el, _step, _opts) => emit(EVENTS.CLOSE_ADD_MODAL),
      },
      {
        element: "#tour-guard-manual-btn",
        popover: {
          title: "📝 Manual vs Shadow Profiles",
          description:
            "Use this for children or relatives without accounts. <strong>Pro Tip:</strong> If you enter their email here, we'll create a \"Shadow Account\" so they can claim their data later!",
          side: "bottom",
          align: "center",
        },
        onHighlightStarted: (_el, _step, _opts) => {
          emit(EVENTS.OPEN_ADD_MODAL);
          setTimeout(() => emit(EVENTS.REFRESH), MODAL_SETTLE_MS);
        },
        onDeselected: (_el, _step, _opts) => emit(EVENTS.CLOSE_ADD_MODAL),
      },
      {
        element: "#tour-guard-cards",
        popover: {
          title: "🔄 Deep Data Synchronization",
          description:
            "Once linked, the <strong>\"Active Profile\"</strong> indicator confirms you are viewing their <strong>actual medical data</strong> — including their real medications and symptoms — in real-time.",
          side: "top",
          align: "center",
        },
        onHighlightStarted: (_el, _step, _opts) => emit(EVENTS.CLOSE_ADD_MODAL),
      },
      {
        element: "#tour-guard-cards",
        popover: {
          title: "🛡️ Emergency Health Passports",
          description:
            "Generate QR-based <strong>Medical Passports</strong> for any profile. First responders can instantly access critical info — even if you or your dependent are incapacitated.",
          side: "top",
          align: "center",
        },
      },
    ],
  },
  {
    key: "medications",
    label: "Medications",
    route: "/app/medications",
    steps: [
      {
        element: "#tour-nav-medications",
        popover: {
          title: "💊 Smart Medications",
          description:
            "Track your prescriptions and let AI <strong>cross-reference them against the OpenFDA drug database</strong> for dangerous interactions.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-med-add",
        popover: {
          title: "➕ Add a Medication",
          description:
            "Click here to register a new prescription. Enter the <strong>drug name, dosage, and frequency</strong>. AI will automatically query the <strong>OpenFDA API</strong> and check for interactions. If a conflict is found, you'll see a <strong>red severity alert</strong>.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#tour-med-cards",
        popover: {
          title: "📋 Your Medication Cards",
          description:
            "Each card shows a medication's <strong>name, dosage, frequency</strong>, and its <strong>FDA safety status</strong>. You can <strong>Stop/Resume</strong> medications or delete them. Stopped medications are excluded from future interaction checks.",
          side: "top",
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
          description:
            "A conversational health journal. Chat naturally and AI organizes everything into <strong>structured medical data</strong>.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-hm-chat",
        popover: {
          title: "💬 Health Chat",
          description:
            "Type messages like <em>\"I had a headache at 3PM\"</em> or <em>\"Took Paracetamol 500mg\"</em>. AI extracts <strong>symptoms, medications, mood, sleep data, and vitals</strong> automatically. Also supports <strong>🎤 Voice</strong>, <strong>📷 Camera</strong>, and <strong>🖼️ Image</strong> input.",
          side: "left",
          align: "start",
        },
      },
      {
        element: "#tour-hm-timeline",
        popover: {
          title: "📅 Health Timeline",
          description:
            "Every chat message becomes a <strong>structured health entry</strong> here — tagged by type with timestamps. This is your <strong>living medical record</strong> that grows over time.",
          side: "left",
          align: "start",
        },
      },
      {
        element: "#tour-hm-summary-btn",
        popover: {
          title: "📋 Generate Doctor Summary",
          description:
            "Click this to ask AI to compile a <strong>comprehensive patient summary</strong> from your recent entries. Summaries are saved permanently under Doctor Summaries.",
          side: "bottom",
          align: "end",
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
          description:
            "Upload complex hospital bills and let AI break them down into <strong>plain language</strong> with itemized breakdowns.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-bill-dropzone",
        popover: {
          title: "📤 Upload a Bill",
          description:
            "<strong>Drag & drop</strong> a PDF, image (JPG/PNG), or text file of your medical bill here. <strong>OCR automatically extracts text</strong> from images. You can also click to browse files.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#tour-bill-textarea",
        popover: {
          title: "📝 Or Paste Text",
          description:
            "If you have the bill text copied from an email or document, <strong>paste it directly here</strong>. AI will parse <strong>line items, hospital info, dates, costs</strong>, and categorize charges.",
          side: "top",
          align: "center",
        },
      },
      {
        element: "#tour-bill-insurance",
        popover: {
          title: "⚙️ Custom Cost Calculation",
          description:
            "Configure your specific insurance rules to get highly accurate out-of-pocket estimates before analyzing a bill.",
          side: "bottom",
          align: "end",
        },
        // Close the dialog if the user backed up here from the dialog steps.
        onHighlightStarted: (_el, _step, _opts) => emit(EVENTS.CLOSE_INSURANCE),
      },
      // ── Insurance dialog step 1: Deductible & Copay ────────────────
      // Targets #tour-insurance-deductible-copay inside the open dialog —
      // exact same pattern as #tour-guard-connect-btn inside the add-family modal.
      {
        element: "#tour-insurance-deductible-copay",
        popover: {
          title: "💰 Deductible & Copay",
          description:
            "Set your <strong>Deductible Remaining</strong> — the amount you pay before insurance kicks in — and your <strong>Copay / Coinsurance %</strong>, the share you pay on covered charges after the deductible.",
          side: "right",
          align: "start",
        },
        onHighlightStarted: (_el, _step, _opts) => emit(EVENTS.OPEN_INSURANCE),
        onDeselected: (_el, _step, _opts) => emit(EVENTS.CLOSE_INSURANCE),
      },
      // ── Insurance dialog step 2: Covered Categories ────────────────
      {
        element: "#tour-insurance-categories",
        popover: {
          title: "🏷️ Covered Categories",
          description:
            "Select which charge types your plan covers — <strong>Consultation, Tests, Procedures, Medicine, Other</strong>. Unchecked categories count as fully out-of-pocket when estimating your bill.",
          side: "right",
          align: "start",
        },
        onHighlightStarted: (_el, _step, _opts) => emit(EVENTS.OPEN_INSURANCE),
        onDeselected: (_el, _step, _opts) => emit(EVENTS.CLOSE_INSURANCE),
      },
    ],
  },
  {
    key: "previous-bills",
    label: "Previous Bills",
    route: "/app/previous-bills",
    steps: [
      {
        element: "#tour-nav-previous-bills",
        popover: {
          title: "📂 Previous Bills",
          description:
            "All your processed bills are <strong>archived here</strong>. Search by patient name, hospital, or line items. Click any bill to view its full AI analysis with <strong>insurance breakdown, line items, and anomaly detection</strong>.",
          side: "right",
          align: "start",
        },
      },
    ],
  },
  {
    key: "doctor-summaries",
    label: "Doctor Summaries",
    route: "/app/doctor-summaries",
    steps: [
      {
        element: "#tour-nav-doctor-summaries",
        popover: {
          title: "📋 Doctor Summaries",
          description:
            "Browse all AI-generated <strong>patient summaries</strong>. <strong>Star your favorites</strong> for quick access, search by keyword, and share them with your healthcare provider.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-ds-hero",
        popover: {
          title: "👨‍⚕️ AI Consultation Prep",
          description:
            "Never forget a symptom again. <strong>Consultation Prep</strong> generates a high-density \"Pre-Visit Brief\" that highlights <strong>longitudinal patterns</strong> and suggests specific clinical questions for your doctor.",
          side: "top",
          align: "center",
        },
      },
    ],
  },
  {
    key: "symptom-checker",
    label: "Symptom Checker",
    route: "/app/symptom-checker",
    steps: [
      {
        element: "#tour-nav-symptom-checker",
        popover: {
          title: "🫀 Intelligence-Driven Symptom Tracking",
          description:
            "Track symptoms with <strong>severity, triggers, and duration</strong> while AI discovers hidden correlations with your sleep and stress levels.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-sc-add-btn",
        popover: {
          title: "➕ Detail-Rich Logging",
          description:
            "Log new symptoms with high precision. Capture not just what hurts, but what triggered it and how it affected your day. This data is vital for identifying <strong>environmental triggers</strong>.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#tour-sc-heatmap",
        popover: {
          title: "🔥 Clinical Heatmap",
          description:
            "Visualize your pain points on an <strong>interactive anatomical model</strong>. Deeper red zones indicate chronic issues.",
          side: "right",
          align: "center",
        },
      },
      {
        element: "#tour-sc-heatmap",
        popover: {
          title: "🖱️ Point-and-Shoot Logging",
          description:
            "<strong>Pro Tip:</strong> Click any body part on the model to instantly open a pre-filled symptom log for that specific region. It's the fastest way to track localized pain.",
          side: "right",
          align: "center",
        },
      },
      {
        element: "#tour-sc-analyze",
        popover: {
          title: "🔬 Discover Patterns",
          description:
            "Our analysis engine groups symptoms into <strong>Patterns</strong>. See if your headaches correlate with \"Lisinopril\" doses or \"Late night working\" sessions automatically.",
          side: "bottom",
          align: "start",
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
          title: "👤 Your Medical ID",
          description:
            "This is your official <strong>Medical Profile</strong> — a read-only view of exactly what first responders and guardians see.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-profile-provenance",
        popover: {
          title: "🔍 Data Provenance",
          description:
            "Every clinical detail here is interactive. Hover over any entry to see its <strong>Source and Verification Date</strong> (e.g., AI Extraction or Manual Verification).",
          side: "top",
          align: "center",
        },
      },
      {
        element: "#tour-profile-settings",
        popover: {
          title: "⚙️ Management Mode",
          description:
            "Need to make changes? Use the <strong>Settings Gear</strong> to switch to Editing Mode and update your medical credentials.",
          side: "left",
          align: "start",
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
          title: "⚙️ Clinical Settings",
          description:
            "Update your official medical identity, including gender, blood group, and contact information.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-settings-care-circle",
        popover: {
          title: "🤝 Emergency Care Circle",
          description:
            "Continuum supports <strong>multiple emergency contacts</strong>. Add family, friends, or medical proxies to your care network.",
          side: "top",
          align: "center",
        },
      },
      {
        element: "#tour-settings-add-contact-btn",
        popover: {
          title: "➕ Multi-Contact Editing",
          description:
            "Add as many responders as you need. You can also click the <strong>Pencil icon</strong> on existing contacts to update them instantly.",
          side: "left",
          align: "center",
        },
      },
      {
        element: "#tour-settings-save",
        popover: {
          title: "💾 Sticky Save Bar",
          description:
            "Changes are never lost! This <strong>fixed save bar</strong> is always available so you can synchronize your medical record the second you're done editing.",
          side: "top",
          align: "center",
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
          title: "🎉 You're All Set!",
          description:
            "That covers every feature of <strong>Continuum Health</strong>! Remember, you can always re-launch this tour by clicking the <strong>\"Take Tour\"</strong> button in the bottom-right corner. Stay healthy! 💚",
        },
      },
    ],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────

function getSectionIndexByRoute(route: string): number {
  return TOUR_SECTIONS.findIndex((s) => s.route === route);
}

interface StepMap {
  allSteps: DriveStep[];
  /** step index → route to navigate to before showing that step */
  routeMap: Record<number, string>;
}

function buildStepsAndRouteMap(startSectionIndex = 0): StepMap {
  const allSteps: DriveStep[] = [];
  // Every step index maps to the route it belongs to.
  // Storing on ALL steps (not just section boundaries) ensures both
  // forward AND backward navigation always resolves the correct route.
  const routeMap: Record<number, string> = {};

  for (let si = startSectionIndex; si < TOUR_SECTIONS.length; si++) {
    const section = TOUR_SECTIONS[si];
    section.steps.forEach((step) => {
      const idx = allSteps.length;
      allSteps.push(step);
      if (section.route) {
        routeMap[idx] = section.route;
      }
    });
  }

  return { allSteps, routeMap };
}

/**
 * Waits up to `timeoutMs` for `selector` to appear in the DOM.
 * Resolves with the element or null on timeout.
 */
function waitForElement(
  selector: string,
  timeoutMs = 2000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(found);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

function waitForElementPainted(
  selector: string,
  timeoutMs = 3000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;

    function check() {
      const el = document.querySelector(selector);
      if (el) {
        const { width, height } = el.getBoundingClientRect();
        if (width > 0 && height > 0) return resolve(el);
      }
      if (Date.now() < deadline) {
        requestAnimationFrame(check);
      } else {
        resolve(el ?? null);
      }
    }

    requestAnimationFrame(check);
  });
}


export function WalkthroughOverlay() {
  const isInitialized = useRef(false);
  const driverRef = useRef<Driver | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [tourVisible, setTourVisible] = useState(true);

  useEffect(() => {
    document.body.classList.toggle("continuum-tour-hidden", !tourVisible);
    return () => document.body.classList.remove("continuum-tour-hidden");
  }, [tourVisible]);

  // ── Global refresh listener (fired after modal animations settle) ──
  useEffect(() => {
    const handleRefresh = () => {
      setTimeout(() => driverRef.current?.refresh(), 50);
    };
    window.addEventListener(EVENTS.REFRESH, handleRefresh);
    return () => window.removeEventListener(EVENTS.REFRESH, handleRefresh);
  }, []);

  // ── Navigate then invoke callback once settled ──────────────────
  const navigateThen = useCallback(
    (targetRoute: string, cb: () => void) => {
      if (window.location.pathname !== targetRoute) {
        navigate(targetRoute);
        setTimeout(cb, NAV_SETTLE_MS);
      } else {
        cb();
      }
    },
    [navigate]
  );

  // ── Core tour launcher ──────────────────────────────────────────
  const launchTour = useCallback(
    (startSectionIndex = 0) => {
      const { allSteps, routeMap } = buildStepsAndRouteMap(startSectionIndex);
      const startRoute = TOUR_SECTIONS[startSectionIndex]?.route || "/app";

      const moveToStep = async (targetIdx: number) => {
        if (targetIdx < 0 || targetIdx >= allSteps.length) {
          driverObj.destroy();
          return;
        }

        // routeMap has an entry for every step index, so both forward and
        // backward navigation always resolves the correct route.
        const targetRoute = routeMap[targetIdx];
        const step = allSteps[targetIdx];

        const proceed = async () => {
          const selector = typeof step.element === "string" ? step.element : null;

          if (selector) {
            const alreadyInDom = document.querySelector(selector);

            if (!alreadyInDom) {
              // Element isn't mounted yet (e.g. modal not open).
              // Fire onHighlightStarted so the app opens the modal,
              // then wait for the element to appear in the DOM.
              step.onHighlightStarted?.(document.body, step, {
                config: driverObj.getConfig(),
                state: driverObj.getState(),
                driver: driverObj,
              });
              const found = await waitForElement(selector);
              if (!found) {
                console.warn(`[Tour] element not found: ${selector} — floating popover fallback`);
              }
            }

            // Whether already in DOM or just mounted, wait until the element
            // has real painted dimensions. This prevents the "dialog exists but
            // driver.js still centers the popover" bug caused by CSS open
            // transitions where getBoundingClientRect() returns 0×0 initially.
            await waitForElementPainted(selector);
          }

          // Unhide popover + overlay before moving so they appear already
          // positioned on the new page, not fading in from the wrong place.
          setTourVisible(true);
          driverObj.moveTo(targetIdx);
        };

        const needsNav = targetRoute && window.location.pathname !== targetRoute;
        if (needsNav) {
          // Hide the stale popover + stage highlight immediately so the user
          // doesn't see the old step content floating over the new page.
          setTourVisible(false);
          navigate(targetRoute);
          setTimeout(proceed, NAV_SETTLE_MS);
        } else {
          await proceed();
        }
      };

      const driverObj = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        doneBtnText: "Finish Tour 🎉",
        nextBtnText: "Next",
        prevBtnText: "Back",
        popoverClass: "continuum-tour-popover",
        stagePadding: 10,
        stageRadius: 12,
        overlayColor: "rgba(0, 0, 0, 0.85)",
        steps: allSteps,

        onNextClick: () => {
          const current = driverObj.getActiveIndex() ?? -1;
          moveToStep(current + 1);
        },

        onPrevClick: () => {
          const current = driverObj.getActiveIndex() ?? 0;
          if (current <= 0) return;
          moveToStep(current - 1);
        },

        onDestroyed: () => {
          emit(EVENTS.CLOSE_ADD_MODAL);
          emit(EVENTS.CLOSE_INSURANCE);
          setTourVisible(true);
        },
      });

      driverRef.current = driverObj;

      navigateThen(startRoute, () => {
        driverObj.drive();
      });
    },
    [navigate, navigateThen]
  );

  // ── Auto-launch on first visit ──────────────────────────────────
  useEffect(() => {
    if (!isInitialized.current && location.pathname.startsWith("/app")) {
      if (!localStorage.getItem(TOUR_SEEN_KEY)) {
        setTimeout(() => {
          launchTour(0);
          localStorage.setItem(TOUR_SEEN_KEY, "true");
        }, INITIAL_DELAY_MS);
      }
      isInitialized.current = true;
    }
  }, [location.pathname, launchTour]);

  // ── Current page context for "Start from here" ──────────────────
  const currentPageLabel = ROUTE_LABELS[location.pathname];
  const currentSectionIndex = getSectionIndexByRoute(location.pathname);

  return (
    <>
      {/* ── Driver.js theme overrides ── */}
      <style>{`
        /* Hide the entire driver overlay + popover during cross-route transitions.
           We toggle the continuum-tour-hidden class on <body> from React state. */
        body.continuum-tour-hidden .driver-overlay,
        body.continuum-tour-hidden .driver-popover-wrapper,
        body.continuum-tour-hidden .driver-popover,
        body.continuum-tour-hidden .driver-stage-no-animation,
        body.continuum-tour-hidden #driver-highlighted-element-stage,
        body.continuum-tour-hidden #driver-popover-item {
          opacity: 0 !important;
          pointer-events: none !important;
          transition: none !important;
        }
        .continuum-tour-popover {
          background: hsl(var(--card)) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 16px !important;
          box-shadow:
            0 24px 48px -8px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(255, 255, 255, 0.04) !important;
          max-width: 380px !important;
          padding: 20px 22px !important;
        }

        .continuum-tour-popover .driver-popover-title {
          font-size: 17px !important;
          font-weight: 700 !important;
          line-height: 1.4 !important;
          margin-bottom: 2px !important;
          color: hsl(var(--foreground)) !important;
        }

        .continuum-tour-popover .driver-popover-description {
          font-size: 13px !important;
          line-height: 1.75 !important;
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
          font-size: 11.5px !important;
          color: hsl(var(--muted-foreground)) !important;
          opacity: 0.6 !important;
          letter-spacing: 0.02em !important;
        }

        .continuum-tour-popover .driver-popover-navigation-btns {
          gap: 10px !important;
          margin-top: 22px !important;
        }

        .continuum-tour-popover .driver-popover-navigation-btns button {
          border-radius: 10px !important;
          font-size: 13px !important;
          padding: 9px 20px !important;
          font-weight: 700 !important;
          transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease !important;
          letter-spacing: -0.01em !important;
          border: none !important;
          text-shadow: none !important;
        }

        .continuum-tour-popover .driver-popover-next-btn {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35) !important;
        }

        .continuum-tour-popover .driver-popover-next-btn:hover {
          transform: translateY(-1px) !important;
          filter: brightness(1.06) !important;
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.42) !important;
        }

        .continuum-tour-popover .driver-popover-next-btn:active {
          transform: translateY(0) !important;
        }

        .continuum-tour-popover .driver-popover-prev-btn {
          background: hsl(var(--secondary)) !important;
          color: hsl(var(--secondary-foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
        }

        .continuum-tour-popover .driver-popover-prev-btn:hover {
          background: hsl(var(--secondary) / 0.75) !important;
          border-color: hsl(var(--primary) / 0.35) !important;
        }

        .continuum-tour-popover .driver-popover-close-btn {
          color: hsl(var(--muted-foreground)) !important;
          font-size: 18px !important;
          font-weight: 300 !important;
          opacity: 0.7 !important;
          transition: opacity 0.15s, color 0.15s !important;
        }

        .continuum-tour-popover .driver-popover-close-btn:hover {
          color: hsl(var(--destructive)) !important;
          opacity: 1 !important;
        }

        /* Ensure popovers above modal overlays */
        .driver-popover-wrapper {
          z-index: 10000 !important;
        }

        /* Soften the stage overlay slightly */
        .driver-overlay {
          z-index: 9999 !important;
        }
      `}</style>

      {/* ── Floating Tour Button ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="rounded-full shadow-lg shadow-primary/25 gap-2 pr-5 transition-transform hover:scale-105 active:scale-95"
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