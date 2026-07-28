# Design System: Gym Management System

A minimal, quiet, high-legibility visual design system tailored for gym operational workflows (member management, check-in tracking, membership status monitoring).

## 1. Palette & Surface System

| Role | Token / Value | Usage |
| :--- | :--- | :--- |
| **Background Base** | `#090A0F` | Main app canvas (dark slate background) |
| **Surface Card** | `#12141C` | Cards, sidebar, modal background |
| **Surface Hover** | `#1A1D29` | Interactive element hover state |
| **Border Accent** | `#222634` | Subtle container borders & divider lines |
| **Text Primary** | `#F3F4F6` | High contrast body & header typography |
| **Text Muted** | `#9CA3AF` | Labels, captions, secondary information |
| **Active Accent** | `#10B981` | Emerald green: active membership badge, quick check-in |
| **Warning Accent** | `#F59E0B` | Amber: expiring membership (< 7 days) |
| **Danger Accent** | `#EF4444` | Crimson: expired membership, overdue balance |

## 2. Typography Scale

- **Display & Headings**: `Inter` / system-ui (font-weight: 600/700, tracking: -0.02em)
- **Body & Controls**: `Inter` (font-weight: 400/500, leading: 1.5)
- **Data & Identifiers**: `Geist Mono` / `ui-monospace` for Member IDs, Check-in timestamps, pricing values.

## 3. Layout Structure

```
+-----------------------------------------------------------------------+
|  [Logo] Gym Management System    [Search...]   (+ Quick Check-in)  [User] |
+--------------+--------------------------------------------------------+
|  Dashboard   |  [ Stat: Active ]  [ Stat: Today ]  [ Stat: Revenue ]   |
|  Members     |  +---------------------------------------------------+  |
|  Plans       |  |  Recent Activity / Quick Check-In Stream          |  |
|  Classes     |  |  - John Doe  | Annual Pass | Active | 10:42 AM    |  |
|  Check-Ins   |  |  - Sarah Smith | Monthly Pass | Expired | 10:38 AM  |  |
|  Settings    |  +---------------------------------------------------+  |
+--------------+--------------------------------------------------------+
```

## 4. Component Token Mapping (shadcn/ui compatible)

- **Button**: Minimal flat surface (`#1A1D29`), active emerald accent for primary action (`#10B981`).
- **Badge**: Monospaced status pill (`.badge-active`, `.badge-expired`, `.badge-warning`).
- **Table**: Clean horizontal border separators (`#222634`), dense padding for desktop operations.
- **Dialog / Sheet**: Slide-over quick check-in drawer for front-desk staff.
