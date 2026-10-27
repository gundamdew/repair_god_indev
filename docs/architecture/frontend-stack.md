# Frontend Technology Stack & Architecture Proposal

> **Status:** APPROVED & ADOPTED  
> **Target Framework:** React Ecosystem (React Native for Mobile + React for Web)  
> **Target Project:** Repair God (`repair_god_indev`)  
> **Author:** Architecture Team  
> **Last Updated:** 2026-10-27

---

## 1. Executive Summary: "Can it be React?"

**Yes, absolutely.** In fact, an **all-React strategy** is the industry gold standard for multi-platform platforms like Repair God. 

By unifying around React and TypeScript, we combine **React Native (via Expo)** for native iOS/Android mobile apps with **React (Next.js / Vite)** for responsive web portals. Both platforms share the exact same component mental model, state management paradigms, API client hooks, and typed domain contracts.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            UNIFIED REACT FRONTEND STACK                          │
├──────────────────────────┬───────────────────────────────────────────────────────┤
│ Core Ecosystem           │ React 19 / TypeScript 5+                              │
│ Mobile Applications      │ React Native (managed via Expo SDK) for iOS & Android │
│ Web Portals & Landing    │ React (Next.js for SEO / Vite for Workshop & B2B Hub) │
│ Shared Code Shareability │ 60% – 80% (Hooks, API Client, State, Zod Schemas)     │
│ State & Server Cache     │ TanStack React Query (v5) + Zustand                   │
│ Form Management          │ React Hook Form + Zod (shared with backend DTOs)      │
│ Styling & Design Tokens  │ NativeWind (Tailwind CSS for React & React Native)    │
│ Navigation & Routing     │ Expo Router (Mobile) & Next.js / TanStack Router (Web)│
└──────────────────────────┴───────────────────────────────────────────────────────┘
```

---

## 2. Multi-Platform Requirements: Mobile vs. Web

Repair God serves multiple distinct user groups with different hardware and ergonomic needs:

| Application | Target Audience | Primary Platform | Why React / React Native? |
| :--- | :--- | :--- | :--- |
| **Customer App** | B2C Device Owners (Michał/Magdalena Kowalska) | **React Native (iOS & Android)** | Requires native camera access for damage inspection, push notifications (FCM/APNs) for repair milestones, Paczkomat QR code scanning, and native Apple Pay / Google Pay / BLIK. |
| **Public Web & Intake** | B2C & B2B Web Visitors | **React (Next.js SSR/SSG)** | High SEO visibility for search terms (e.g., *"wymiana baterii iPhone Warszawa"*), zero-install quick diagnostic quote wizard, and public order tracking by parcel number. |
| **Workshop Workspace** | Partner Technicians & Service Desk | **React (Vite SPA)** | Desktop/tablet-optimized dense operational interface for ticket queues, micro-soldering inspection photos, quote adjustments, and parts inventory. |
| **B2B Fleet Hub** | Corporate IT Fleet Managers | **React (Next.js / Vite)** | Desktop portal for multi-device fleet inventories, bulk intake CSV uploads, SLA tracking, and consolidated monthly VAT invoicing. |

---

## 3. Code Sharing & Monorepo Architecture

By leveraging a **Turborepo** or **pnpm workspace**, the entire frontend suite shares business logic, API queries, and contracts:

```
repair_god/
├── apps/
│   ├── mobile/                    # React Native / Expo (iOS & Android)
│   │   ├── src/
│   │   │   ├── app/               # Expo Router file-based screens
│   │   │   ├── components/        # Mobile-specific UI elements
│   │   │   └── hooks/             # Mobile camera, biometrics, notifications
│   │   └── package.json
│   ├── web-customer/              # Next.js (SEO Landing, Public Web Intake)
│   │   ├── src/app/               # App Router pages & server components
│   │   └── package.json
│   └── web-workshop/              # Vite SPA (Partner Workshop & Fleet Desk)
│       ├── src/views/             # Queue management, photo zoom inspection
│       └── package.json
├── packages/
│   ├── api-client/                # TanStack React Query hooks generated from OpenAPI
│   ├── contracts/                 # Shared Zod validation schemas & TypeScript interfaces
│   ├── ui-tokens/                 # Tailwind / NativeWind theme (colors, spacing, typography)
│   └── shared-utils/              # Price formatting (PLN), date math, FSM display helpers
```

### What is Shared vs. What is Platform-Specific:
- **100% Shared:**
  - TypeScript types and domain entities (`Order`, `Device`, `DiagnosticReport`, `Shipment`).
  - Validation schemas (`Zod`) for symptom reporting, pickup address, and payment forms.
  - Server state caching and synchronization (`TanStack React Query` query keys and mutations).
  - Client state stores (`Zustand` for active diagnostic session and user preferences).
  - Utility functions (currency formatting `formatPLN()`, IMEI checksum validation, order state helpers).
- **Platform-Specific (Isolated in apps):**
  - Navigation container (Expo Router vs. Next.js App Router).
  - Hardware APIs (React Native Camera / Expo Barcode Scanner vs. Web file picker).
  - Layout density (Mobile touch-first single column vs. Desktop multi-column data tables).

---

## 4. Frontend Technology Stack Breakdown

### 4.1. React Native Framework: Expo (Managed Workflow)
- **Why Expo?**
  - Production-ready native capabilities without raw Xcode/Android Studio boilerplate.
  - Continuous Over-The-Air (OTA) updates using EAS Update (critical for swift bug fixes without app store review delays).
  - Pre-built, battle-tested modules: `expo-camera` (damage inspection), `expo-notifications` (repair alerts), `expo-barcode-scanner` (Paczkomat & parcel QR intake).
  - Seamless integration with Polish mobile payment solutions (native BLIK modal sheets, Stripe / PayU SDKs).

### 4.2. State Management & Server Synchronization
- **Server State: [TanStack React Query v5](https://tanstack.com/query)**
  - Manages API caching, background re-fetching, and optimistic status updates.
  - Supports offline persistence: if a customer loses internet connection in a Paczkomat underground parking lot, cached repair history and drop-off QR codes remain accessible.
- **Client State: [Zustand](https://github.com/pmndrs/zustand)**
  - Ultra-lightweight store for local UI state:
    - Multi-step diagnostic questionnaire wizard state.
    - Temporary camera snapshot buffer before S3 upload.
    - Workshop dashboard table filters and sorting.

### 4.3. Form Handling & Validation: React Hook Form + Zod
- Device intake involves complex multi-step forms: brand selection, model series, symptom checklists, physical condition rating, pickup address (Paczkomat selector / courier address), and VAT invoice details.
- `react-hook-form` ensures minimal re-renders on low-end mobile devices.
- `zod` guarantees identical validation rules on the React Native client and NestJS backend.

### 4.4. Styling & Design System: NativeWind (Tailwind CSS)
- **Why NativeWind?**
  - Uses standard Tailwind CSS utility classes across both React Native (`apps/mobile`) and React Web (`apps/web-*`).
  - Enables a single design token system (`packages/ui-tokens`) for colors (e.g., Repair God primary emerald/safety orange), borderRadius, and typography.
  - Generates optimized native styles on mobile and atomic CSS classes on web.

### 4.5. Iconography & Visual Assets
- **Lucide Icons (`lucide-react` & `lucide-react-native`)**: Clean, consistent outline iconography across mobile and web for device categories (phones, laptops, consoles, wearables), repair states, and courier tracking.

---

## 5. Critical User Journeys (Frontend Implementation)

### 5.1. B2C Guided AI Diagnostic & Photo Intake (Mobile)
1. **Model Picker:** Instant search with fuzzy matching across catalog.
2. **Symptom Tree:** Interactive visual checklist (Screen cracked, Touch unresponsive, Battery drains fast, No sound).
3. **Smart Photo Capture:** Custom camera overlay with bounding guides instructing the user to snap front, rear, and side damage photos.
4. **Instant AI Quote Card:** Displays estimated price range (`240 - 320 PLN`), turnaround time (`24 - 48h`), and confidence score with clear breakdown (OEM vs. aftermarket parts).
5. **Logistics Selection:** Interactive InPost Paczkomaty map/list picker with closest locker auto-detection based on device geolocation (`expo-location`).

### 5.2. Live Repair & Courier Tracker (Mobile & Web)
- Real-time animated status timeline reflecting the backend FSM states (`In Transit` → `Received` → `Diagnostic Confirmed` → `In Repair` → `Quality Control` → `Return Transit`).
- WebSockets listener invalidates React Query cache immediately upon receiving tracking events or courier webhooks.
- In-app price adjustment modal: If internal damage is discovered, technician photos are displayed side-by-side with an "Approve (+60 PLN)" or "Decline & Return Device" one-tap action.

### 5.3. Workshop Desk Interface (Web)
- High-density Kanban board of intake orders categorized by urgency and parts availability.
- One-click QR parcel check-in using USB 2D scanner or webcam.
- High-resolution pan-and-zoom inspection viewer for macro photos.
- Standardized QC checklist signoff before initiating return label generation.

---

## 6. Development & Deployment Roadmap

| Milestone | Deliverables |
| :--- | :--- |
| **M1: Design System & Core Monorepo** | Set up Turborepo, `@repair-god/ui-tokens`, shared Zod contracts, NativeWind theme. |
| **M2: Customer Intake & Diagnostic Flow** | Expo mobile app: Device selector, symptom checklist, camera capture, instant quote preview. |
| **M3: InPost Picker & Checkout** | InPost Paczkomat selector component, BLIK / PayU payment sheet integration, order confirmation screen. |
| **M4: Live Order Tracking** | Real-time status timeline, WebSocket event listener, push notification handlers. |
| **M5: Workshop Web Workspace** | React (Vite) desktop portal: Order intake queue, photo viewer, quote adjustment editor. |
| **M6: B2B Fleet Manager Portal** | Next.js corporate portal: Bulk asset inventory, scheduled maintenance scheduler, invoice archive. |
