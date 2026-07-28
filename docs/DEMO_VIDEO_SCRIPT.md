# 📹 XyntraPOS — Complete Video Demo Script & Production Guide

This document provides a scene-by-scene script, visual cues, voiceover dialog, and technical preparation steps to record a video demonstration of **XyntraPOS** (Enterprise Retail Point-of-Sale & Multi-Branch Management Workspace).

---

## 🎬 Video Overview

* **Target Length**: 3 to 5 minutes
* **Target Audience**: Store Owners, Retail Merchants, Investors, Software Engineers & Product Managers
* **Tone**: Professional, crisp, modern, high-energy
* **Key Features Covered**:
  1. One-Click Google OAuth & Seamless Merchant Onboarding
  2. High-Performance POS Checkout (F1/F2/F3 Hotkeys, Barcode Scanning)
  3. 58mm / 80mm Thermal Receipt Printing & Raw ESC/POS Export
  4. Offline Mode Outbox & Automatic Queue Re-Syncing
  5. Supabase Realtime Multi-Terminal Analytics & Shift Clocking
  6. Command Palette (`Ctrl+K`) & Responsive Touch Mobile Mode

---

## ⚙️ Pre-Demo Recording Checklist

### 1. Browser & Display Setup
- **Resolution**: 1920x1080 (1080p) or 3840x2160 (4K), 60 FPS.
- **Browser**: Google Chrome / Microsoft Edge (clean profile, extensions hidden).
- **Zoom Level**: 100% (reset with `Ctrl + 0`).
- **Initial Theme**: Start in **Dark Mode** for initial visual impact.

### 2. Audio & Environment
- Clear microphone (noise-canceling enabled or post-processed).
- Background music: Low-volume ambient tech beat (-22dB beneath voiceover).

### 3. Demo Data Checklist
- **Admin Account**: `admin@xyntra.com` (or Google Account ready).
- **Sample Catalog**: At least 8-12 products across 3 categories (e.g. Beverages, Electronics, Groceries) with images, SKUs, and barcodes (e.g., `SKU-1001`, `BAR-998877`).
- **Hardware/Scanner Setup**: USB or Bluetooth Barcode Scanner connected (or ready to type SKU rapidly).

---

## 📽️ Scene-by-Scene Script & Cues

### Scene 1: Introduction & Authentication (0:00 - 0:45)

| Time | Visual Action / On-Screen Cue | Voiceover Script (Word-for-Word) |
| :--- | :--- | :--- |
| **0:00 - 0:15** | Show opening title banner or landing login page in Dark Mode. Hover over the sleek UI. | *"Welcome to **XyntraPOS** — a next-generation, cloud-native Point of Sale and retail management workspace built for modern businesses."* |
| **0:15 - 0:35** | Click **"Sign in with Google"**. Watch the smooth OAuth redirect through `/auth/callback` back to the app without raw URL token exposure. | *"Security and convenience come standard. With our integrated OAuth 2.0 PKCE authentication, merchants can log in with one click via Google. URL access tokens are sanitized instantly, and user profiles are auto-provisioned in real time."* |
| **0:35 - 0:45** | Click the **Sun/Moon icon** in the top header to toggle between Dark Mode and Light Mode. | *"XyntraPOS features a fully dynamic design system supporting smooth dark and light mode themes tailored for all lighting environments."* |

---

### Scene 2: Merchant Onboarding & Workspace Initialization (0:45 - 1:15)

| Time | Visual Action / On-Screen Cue | Voiceover Script (Word-for-Word) |
| :--- | :--- | :--- |
| **0:45 - 1:00** | Navigate to `/onboarding`. Show the form with Business Name, Currency selection (`NGN ₦`, `USD $`, `EUR €`), Tax rate (7.5%), and Timezone. | *"Setting up a business takes seconds. Merchant owners can configure their store name, multi-currency settings, tax rates, and store branches during initial workspace creation."* |
| **1:00 - 1:15** | Fill in "Acme Retail Store" and click **Initialize Owner Workspace**. Show the interactive onboarding tutorial. | *"Once created, default store branches and tax parameters are automatically configured with automated RLS row-level security."* |

---

### Scene 3: POS Checkout, Barcode Scanning & Thermal Printing (1:15 - 2:30)

| Time | Visual Action / On-Screen Cue | Voiceover Script (Word-for-Word) |
| :--- | :--- | :--- |
| **1:15 - 1:35** | Navigate to `/pos`. Use category pills (`Beverages`, `Electronics`) and press `F1` to focus the search bar. | *"At the core of XyntraPOS is our high-performance checkout terminal. Cashiers can filter categories, use hotkeys like F1 for instant search, or set cart discounts with F2."* |
| **1:35 - 1:55** | Scan a physical barcode or type a SKU (`BAR-998877`). Item automatically jumps into the cart with toast confirmation *"Scanned: Cold Brew Coffee"*. | *"XyntraPOS includes a hardware barcode scanner engine. Handheld USB or Bluetooth scanners add items to cart at sub-30 millisecond speeds with zero extra clicks."* |
| **1:55 - 2:15** | Select a registered customer, view their loyalty points, and click **Process Checkout**. Select payment method (*Paystack / Cash / Transfer*). | *"Cashiers can attach customers to track loyalty points and store credit, execute split payments across payment methods, or process cards securely."* |
| **2:15 - 2:30** | The **Thermal Receipt Modal** pops up. Toggle between **80mm Standard** and **58mm Mini** paper preview. Click **"ESC/POS Raw"** copy button and **Print Thermal Receipt**. | *"Upon checkout completion, XyntraPOS generates thermal receipt previews for 58mm and 80mm paper, supporting direct browser printing and raw ESC/POS command formatting for physical thermal receipt printers."* |

---

### Scene 4: Offline Mode Resilience & Outbox Auto-Sync (2:30 - 3:15)

| Time | Visual Action / On-Screen Cue | Voiceover Script (Word-for-Word) |
| :--- | :--- | :--- |
| **2:30 - 2:45** | Disable Wi-Fi / simulate network disconnection. An amber **Offline Mode Active** banner animates at the top of the POS screen. | *"Retail stores can't stop checkouts when Wi-Fi drops. XyntraPOS features an offline outbox engine. When network connectivity is lost, an Offline banner alerts the cashier."* |
| **2:45 - 3:00** | Ring up a sale while offline. Click Checkout. Toast shows: *"Network offline. Sale saved to Local Offline Queue!"*. Queue counter shows `1 Queued Sale(s)`. | *"Cashiers continue ringing up sales seamlessly. Transactions are queued locally in IndexedDB outbox storage with local inventory updates."* |
| **3:00 - 3:15** | Re-enable Wi-Fi. Watch the background sync engine trigger automatically. Toast displays: *"Offline Sync Complete: 1 queued POS sale synced to database"*. | *"The moment network connectivity restores, the auto-sync manager flushes queued transactions to Supabase and updates store ledgers automatically."* |

---

### Scene 5: Supabase Realtime Analytics & Shift Management (3:15 - 4:15)

| Time | Visual Action / On-Screen Cue | Voiceover Script (Word-for-Word) |
| :--- | :--- | :--- |
| **3:15 - 3:45** | Open `/dashboard`. Complete a sale on a second tab/window. Watch the Dashboard revenue metrics and Recent Sales table update live in real-time. | *"Powered by Supabase Realtime subscriptions, store performance metrics update live. Daily revenue, total order volume, and inventory stock counts update instantly across all active cashier terminals."* |
| **3:45 - 4:00** | Show the **Shift Clocking** badge in the header (*Clocked In - Active Shift*) and navigate to `/staff`. Show One-Time Staff Access Code generation. | *"Staff management is robust and secure. Owners can assign roles — Admin, Manager, or Cashier — generate one-time access codes, and monitor staff shift clocking."* |
| **4:00 - 4:15** | Press `Ctrl + K` to open the **Command Palette**. Type *"Reports"* and press Enter to jump to `/reports`. | *"For power users, pressing Control+K opens the global Command Palette for rapid navigation and search across the workspace."* |

---

### Scene 6: Mobile Touch Mode & Closing (4:15 - 4:30)

| Time | Visual Action / On-Screen Cue | Voiceover Script (Word-for-Word) |
| :--- | :--- | :--- |
| **4:15 - 4:25** | Toggle mobile viewport (or click *Switch to Touch Mobile View*). Show the optimized mobile POS touch layout. | *"XyntraPOS is fully responsive, featuring a dedicated touch-optimized layout for mobile tablets and handheld POS devices."* |
| **4:25 - 4:30** | Show ending logo graphic (`/l.png` or `/logo.png`) with text: **XyntraPOS — The Future of Retail Management**. | *"Experience modern, resilient, and real-time retail management with XyntraPOS. Thank you for watching!"* |

---

## 🛠️ Post-Production & Editing Guidelines

1. **Lower Thirds Text**:
   - Add sleek animated text overlays when introducing key features:
     - `Google OAuth 2.0 PKCE Auth`
     - `Hardware Barcode Scanner Engine`
     - `58mm/80mm ESC/POS Thermal Printer Support`
     - `Offline Outbox & Auto-Sync Engine`
     - `Supabase Realtime Subscriptions`

2. **Pacing & Callouts**:
   - Zoom in 120% during barcode scanning and thermal receipt modal interactions to highlight crisp details.
   - Use subtle cursor highlight effects on button clicks.

3. **Export Settings**:
   - Format: MP4 (H.264 / AAC)
   - Resolution: 1920x1080 @ 60 FPS
   - Bitrate: 12-16 Mbps
