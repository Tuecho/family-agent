# Family Agent - Technical Specification

## Project Overview

- **Project Name**: Family Agent
- **Type**: Full-stack Web Application
- **Core Functionality**: Complete family management system with accounting, agenda, tasks, meal planning, habits, inventory, and AI-powered chatbot
- **Target Users**: Families wanting to organize finances, schedules, tasks, and household management
- **Current Version**: 1.0.8 (April 2026)

---

## Tech Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **UI**: TailwindCSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: SQLite (sql.js - in-memory with file persistence)
- **File Upload**: Multer
- **Email**: Nodemailer (SMTP Gmail)
- **PDF Parsing**: pdf-parse
- **Spreadsheets**: xlsx
- **Web Push**: web-push
- **Scheduled Tasks**: node-cron

### Infrastructure
- **Container**: Docker + Docker Compose
- **Reverse Proxy**: Nginx Proxy Manager
- **AI**: Groq API (LLaMA 3.3)

---

## Project Structure

```
family-agent/
├── backend/
│   ├── server.js           # Main server (~10,000 lines)
│   ├── package.json
│   ├── Dockerfile
│   ├── family_agent.db     # SQLite database
│   ├── database/           # DB mount point
│   └── backups/            # Auto backups (daily at 3AM)
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # 41 page components
│   │   ├── components/     # Reusable components
│   │   ├── store/          # Zustand state
│   │   ├── utils/          # Auth, formatting utilities
│   │   ├── i18n/           # Internationalization
│   │   └── types/          # TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── docker-compose.yml      # Multi-container setup
├── .env                    # Environment variables
└── SPEC.md
```

---

## Database Schema

### Core Tables
| Table | Description |
|-------|-------------|
| `auth_user` | User accounts with hashed passwords |
| `user_profile` | User profile data (name, family, currency, etc.) |
| `password_reset_codes` | Password recovery codes |
| `notification_settings` | Email/push notification preferences |
| `app_settings` | Application configuration |
| `global_module_settings` | Module visibility settings |

### Finance Tables
| Table | Description |
|-------|-------------|
| `transactions` | Income/expense entries |
| `budgets` | Monthly budget limits by category |
| `expense_concepts` | Custom expense categories |
| `savings_pigs` | Savings jars (legacy) |
| `savings_goals` | Savings goals with progress tracking |
| `internal_debts` | Family member debts |
| `utility_bills` | Utility bills comparison (electricity, water, gas) |
| `subscriptions` | Recurring subscriptions management |

### Organization Tables
| Table | Description |
|-------|-------------|
| `family_members` | Family member profiles |
| `family_events` | Calendar events with recurrence |
| `family_tasks` | Task management with assignments |
| `shopping_lists` | Multiple shopping lists with colors |
| `shopping_items` | Items in shopping lists |
| `birthdays` | Birthday reminders |
| `anniversaries` | Anniversary dates |
| `family_contacts` | External contacts |
| `family_gifts` | Gift tracking |
| `family_organization` | General family organization |

### Home Management Tables
| Table | Description |
|-------|-------------|
| `home_inventory` | Household items with warranty tracking |
| `home_inventory_categories` | Item categories |
| `home_maintenance` | Recurring maintenance tasks |
| `pet_tracker` | Pet profiles |
| `pet_vaccines` | Vaccination records |
| `pet_medications` | Medication schedules |

### Travel Tables
| Table | Description |
|-------|-------------|
| `travel_manager` | Trip planning |
| `trip_members` | Trip participants |
| `trip_activities` | Activities during trips |

### Education Tables
| Table | Description |
|-------|-------------|
| `family_library` | Book tracking (physical/ebook) |
| `books` | Books (legacy) |
| `movies` | Movies (legacy) |
| `extra_school_manager` | Extracurricular activities |

### Lifestyle Tables
| Table | Description |
|-------|-------------|
| `habits` | Habit definitions |
| `habit_logs` | Daily habit tracking |
| `habit_categories` | Habit categories |
| `recipes` | Meal recipes |
| `meal_plans` | Weekly meal planning |
| `favorite_restaurants` | Restaurant favorites |
| `work_shifts` | Work hour tracking |
| `work_settings` | Work configuration |
| `interesting_places` | Places to visit |

### Content Tables
| Table | Description |
|-------|-------------|
| `family_notes` | Notes with board organization |
| `note_boards` | Note boards with colors |
| `family_gallery` | Photo albums |

### Sharing & Communication
| Table | Description |
|-------|-------------|
| `invitations` | User invitations with data sharing settings |
| `user_shares` | Active data shares between users |
| `contact_messages` | Contact form submissions |
| `sales_contacts` | Business inquiries |
| `faqs` | FAQ content |
| `suggestions` | User suggestions |

---

## Pages & Features (41 pages)

### Core Modules (Always visible)
1. **Dashboard** (`Dashboard.tsx`)
   - Monthly balance summary with donut chart
   - 6-month income/expense evolution chart
   - Today's/tomorrow's events
   - Top 5 urgent tasks
   - Budget status
   - Birthday reminders
   - Motivational quotes

2. **Accounting** (`Accounting.tsx`)
   - Transaction CRUD (income/expense)
   - Filter by month/year/type
   - Excel/CSV import
   - PDF invoice parsing
   - Category management

3. **Budgets** (`Budgets.tsx`)
   - Monthly budgets by category
   - Visual progress bars
   - Recurring budget support

4. **Agenda** (`Agenda.tsx`)
   - Event CRUD with recurrence
   - Weekly/monthly views
   - Multi-day events
   - Event sharing

5. **Family Tasks** (`FamilyTasks.tsx`)
   - Task CRUD with priorities (urgent/high/normal/low)
   - Member assignment
   - Due dates
   - Filtering

6. **Shopping List** (`ShoppingList.tsx`)
   - Multiple lists with colors
   - Item management
   - Share via WhatsApp/Telegram/Email

7. **Notes** (`Notes.tsx`)
   - Multiple boards with colors
   - Notes with categories
   - List/grid views
   - Search functionality

8. **Birthdays** (`Birthdays.tsx`)
   - Family member birthdays
   - External contact birthdays
   - Upcoming birthdays list

### Home Management Modules
9. **Home Inventory** (`HomeInventory.tsx`)
   - Appliances/furniture/electronics
   - Purchase date, warranty tracking
   - Manual URL
   - Expiration alerts

10. **Home Maintenance** (`HomeMaintenance.tsx`)
    - Recurring maintenance (boiler, A/C filters, vehicle ITV)
    - Frequency configuration
    - Overdue alerts

11. **Subscription Manager** (`SubscriptionManager.tsx`)
    - Streaming, music, gym, insurance
    - Monthly/annual cost tracking
    - Next payment date

12. **Pet Tracker** (`PetTracker.tsx`)
    - Pet profiles (species, breed, weight, microchip)
    - Vaccination records
    - Medication schedules

### Finance Modules
13. **Savings Goals** (`SavingsGoals.tsx`)
    - Goal creation with icons
    - Progress bars
    - Contribution tracking

14. **Internal Debts** (`InternalDebts.tsx`)
    - Family member debts
    - Active/paid status
    - History

15. **Utility Bills** (`UtilityBills.tsx`)
    - Electricity, water, gas tracking
    - Month-over-month comparison
    - Anomaly detection (>30% change)

### Education Modules
16. **Family Library** (`FamilyLibrary.tsx`)
    - Book tracking
    - Physical/ebook format
    - Reading status
    - Ratings

17. **Extra School Manager** (`ExtraSchoolManager.tsx`)
    - Activity tracking
    - Schedule, location
    - Teacher contact
    - Payment tracking

### Lifestyle Modules
18. **Habit Tracker** (`HabitTracker.tsx`)
    - Habit definitions with icons
    - Daily/week scheduling
    - Category grouping
    - Streak tracking
    - Export/share

19. **Work Hours** (`WorkHours.tsx`)
    - Shift tracking (start/end)
    - Weekly/monthly targets
    - Accumulated hours
    - Report generation

20. **Meal Planning** (`MealPlanning.tsx`)
    - Recipe management
    - Weekly planning drag-and-drop
    - Restrictions (vegetarian, vegan, gluten-free, lactose-free)

21. **Travel Manager** (`TravelManager.tsx`)
    - Trip planning
    - Flight/hotel/activity booking
    - Budget tracking
    - Packing checklist

22. **Sites of Interest** (`SitesOfInterest.tsx`)
    - Places to visit
    - Notes and details

23. **Family Organization** (`FamilyOrganization.tsx`)
    - General family organization features

### Premium/Extra Modules
24. **Premium** (`Premium.tsx`)
    - Photo gallery with albums
    - Contacts management
    - Books & movies tracking
    - Sales contact form

25. **Chat Bot Page** (`ChatBotPage.tsx`)
    - AI chatbot interface
    - Groq API integration (LLaMA 3.3)

26. **Family Gallery** (`FamilyGallery.tsx`)
    - Photo upload
    - Album management
    - Lightbox view

27. **Favorite Restaurants** (`FavoriteRestaurants.tsx`)
    - Restaurant management
    - Ratings and notes

28. **Books & Movies** (`BooksMovies.tsx`)
    - Book and movie collection
    - Status tracking

29. **Gifts** (`Gifts.tsx`)
    - Gift tracking by person/occasion

30. **Anniversaries** (`Anniversaries.tsx`)
    - Anniversary date tracking

### System Pages
31. **Profile** (`Profile.tsx`)
    - User settings
    - Family name, currency
    - Notification configuration
    - Data sharing
    - Password change
    - Language selection (ES/EN/PT)

32. **Module Manager** (`ModuleManager.tsx`)
    - Enable/disable modules
    - Module ordering

33. **Admin Page** (`AdminPage.tsx`)
    - User management
    - Invitations
    - FAQ management

34. **About** (`About.tsx`)
35. **How It Works** (`HowItWorks.tsx`)
36. **FAQ** (`FAQ.tsx`)
37. **Contact** (`Contact.tsx`)
38. **Sales Contact** (`SalesContact.tsx`)
39. **Terms** (`Terms.tsx`)
40. **Privacy** (`Privacy.tsx`)
41. **Family Tasks** (`Tasks.tsx`) - Alternative view

---

## UI/UX Specification

### Layout Structure
- **Sidebar**: Fixed left sidebar (collapsible: 240px expanded, 64px collapsed)
- **Main Content**: Flexible content area with responsive padding
- **Mobile Menu**: Hamburger button (top-left), slide-in drawer
- **Chat Widget**: Floating button (bottom-right), expands to chat window

### Visual Design
- **Primary Color**: `#4F46E5` (indigo)
- **Secondary Color**: `#10B981` (emerald for income/positive)
- **Danger Color**: `#EF4444` (red for expenses/negative)
- **Background**: `#F9FAFB` (light gray)
- **Cards**: White with subtle shadow, 8px border radius
- **Buttons**: 6px border radius
- **Typography**: System font stack
- **Glass Effect**: `backdrop-blur-sm bg-white/80` for modals

### Color Palette
| Purpose | Color |
|---------|-------|
| Primary | #4F46E5 (indigo-600) |
| Income | #10B981 (emerald-500) |
| Expense | #EF4444 (red-500) |
| Warning | #F59E0B (amber-500) |
| Info | #3B82F6 (blue-500) |
| Background | #F9FAFB (gray-50) |
| Card | #FFFFFF |
| Text Primary | #1F2937 (gray-800) |
| Text Secondary | #6B7280 (gray-500) |

### Responsive Breakpoints
- **Mobile**: < 768px (hide sidebar, hamburger menu)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px (show sidebar)

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with code
- `PUT /api/auth/change-password` - Change password

### User Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

### Finance
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Other Modules
- `GET/POST/PUT/DELETE` endpoints for all modules (events, tasks, notes, etc.)

### Notifications
- `GET /api/notifications/settings` - Get notification settings
- `POST /api/notifications/settings` - Update settings
- `POST /api/notifications/test` - Send test email

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/invitations` - Create invitation
- `PUT /api/admin/users/:id` - Update user

### Data Management
- `POST /api/backup` - Create backup
- `GET /api/export/json` - Export data as JSON
- `GET /api/export/db` - Export database

### AI
- `POST /api/ai/chat` - Chat with AI (Groq API)
- `POST /api/ai/sql` - Natural language SQL query

---

## Scheduled Tasks (node-cron)

### Daily Notification (every minute)
- Sends email digest at user's configured time
- Includes: events, tasks, budgets, meals, birthdays
- Configurable per-user

### Backup (daily at 3 AM)
- Creates SQLite backup
- Keeps last 7 backups
- Location: `backend/backups/`

---

## Security Features

- **Password Hashing**: SHA-256 + salt
- **Password Validation**: 8+ chars, uppercase, lowercase, number
- **Session Timeout**: 5 minutes of inactivity
- **Data Isolation**: Users see only their data + shared data
- **Input Validation**: Server-side validation
- **CORS**: Configured for frontend origin

---

## Data Sharing

Users can share specific data types with other users:
- Dashboard, Accounting, Budgets, Agenda, Tasks, Notes
- Shopping, Contacts, Recipes, Restaurants, Gallery
- Habits, Home Inventory, Maintenance, Subscriptions
- Pet Tracker, Travel, Savings Goals, Debts, Bills
- Library, Extra School, Places, Anniversaries, Work Hours

---

## Docker Configuration

### Services
1. **frontend**: React app (port 5173)
2. **api**: Express backend (port 3000)
3. **nginx-proxy-manager**: Reverse proxy (ports 80, 443, 81)

### Volumes
- `api-db`: Database persistence
- `npm-data`, `npm-letsencrypt`: Nginx Proxy Manager data

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key for AI chatbot | No |
| `SMTP_PASSWORD` | Gmail app password for emails | No |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare Tunnel token | No |
| `PORT` | Backend port (default: 3000) | No |

---

## Acceptance Criteria

### Core
- [ ] User registration and authentication works
- [ ] Dashboard displays correct summaries
- [ ] All 41 pages are accessible and functional
- [ ] Data persists in SQLite database
- [ ] Docker deployment works

### Finance
- [ ] Can add/edit/delete transactions
- [ ] Budget tracking shows progress
- [ ] Excel/CSV import works
- [ ] PDF invoice parsing works

### Organization
- [ ] Tasks can be assigned and prioritized
- [ ] Events support recurrence
- [ ] Shopping lists can be created and shared
- [ ] Notes can be organized in boards

### Integration
- [ ] Email notifications work with Gmail SMTP
- [ ] AI chatbot responds (with Groq key)
- [ ] Data can be exported

### Security
- [ ] Passwords are hashed
- [ ] Sessions expire after 5 minutes
- [ ] Users only see their own data
