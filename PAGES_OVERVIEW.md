# MovieNight Pages Overview

**Total Pages:** 23 routes | **Status:** Fully styled with TailwindCSS + Radix UI

---

## 🔐 Authentication Pages (Route Group: `(auth)`)

### 1. **Login Page** `/login`
- **Purpose:** User authentication
- **Features:**
  - Email/username input field
  - Password input with toggle visibility
  - Error message display
  - Sign up link redirect
  - Premium gradient background with glowing orbs
  - Clapperboard icon branding
  - Form state with `formData` (emailOrUsername, password)
- **Styling:** Dark gradient background, glassmorphism card, animated submit button
- **Components Used:** Input, Button, Link, Icons

### 2. **Signup Page** `/signup`
- **Purpose:** New user registration
- **Features:**
  - Username, email, password fields
  - Password confirmation validation
  - Form state management
  - Terms of service acceptance
  - Error/success handling
  - Redirect to login on success
- **Styling:** Matches login page design
- **Components Used:** Input, Button, Checkbox, Link

---

## 🏠 Home & Dashboard Pages (Route Group: `(app)`)

### 3. **Dashboard Page** `/` (Main)
- **Purpose:** Central hub with actionable insights
- **Features:**
  - Hero section with welcome message
  - Quick stat cards:
    - Total friends count
    - Active suggestions
    - Movies watched this week
    - Suggestion accuracy %
  - Smart nudge component (AI suggestions)
  - Trending movies carousel
  - Recent releases section
  - Social activity feed
  - Suggestion leaderboard
  - CTA buttons for key actions
- **Styling:** Multi-section layout with cards, trending gradient accents
- **Components Used:** Card, Button, Badge, Tabs, TrendingMovie display

### 4. **Alternative Dashboard** `/app` (Backup)
- **Purpose:** Secondary dashboard option
- **Features:** Similar to main dashboard but lighter
  - Stats overview
  - Recent movies
  - Trending section
  - Quick navigation links
- **Note:** Duplicate for A/B testing or fallback

---

## 🎬 Movie & Discovery Pages

### 5. **Movies Page** `/movies`
- **Purpose:** Browse and search entire movie catalog
- **Features:**
  - Search bar with real-time filtering
  - Genre filter sidebar (dynamic)
  - Movie grid display with poster images
  - Movie cards show:
    - Title & year
    - Rating (IMDb)
    - Genres as badges
    - Click to view details
  - Loading states
  - No results messaging
- **Styling:** Grid layout (responsive), search input with icon
- **Data:** Currently mock data (awaiting TMDB integration)
- **Components Used:** Input, Badge, Card, Spinner, Icons

### 6. **Movie Details Page** `/movies/[id]`
- **Purpose:** Detailed movie information & quick actions
- **Features:**
  - Poster image display
  - Movie title, year, genres
  - Full description/synopsis
  - Ratings (IMDb/RT if available)
  - Streaming platform info
  - Runtime & language
  - Cast/crew (if available)
  - Action buttons:
    - Add to watchlist
    - Suggest to friends
    - Rate movie
  - Related movies sidebar
- **Styling:** Hero section with poster, content below
- **Components Used:** Card, Button, Badge, Image

### 7. **Releases Page** `/releases`
- **Purpose:** Upcoming movie releases & new content
- **Features:**
  - Calendar view of upcoming releases
  - Platform filtering (Netflix, Disney+, etc.)
  - Release date sorting
  - Platform color indicators
  - Genre tags
  - "Notify me" buttons
  - Streaming platform badges
- **Styling:** Timeline/calendar layout
- **Data:** Currently mock (awaiting TMDB integration)
- **Components Used:** Card, Badge, Button, Calendar

---

## 👥 Social & Friends Pages

### 8. **Friends Page** `/friends`
- **Purpose:** Manage friend relationships
- **Features:**
  - Three-tab layout:
    - **Friends List:** Current friends with avatars
    - **Incoming Requests:** Pending friend requests (accept/reject)
    - **Outgoing Requests:** Sent requests awaiting acceptance
  - Search functionality:
    - Search users across platform
    - Instant results
    - Add friend button for each user
  - Friend action buttons:
    - Remove friend
    - View profile
    - Send message
  - User avatars & names
  - Request timestamps
- **Styling:** Clean card-based UI, tabbed interface
- **Components Used:** Tabs, Card, Button, Input, Badge, Icons

### 9. **Squad Page** `/squad`
- **Purpose:** View friend group profile
- **Features:**
  - Group name & description
  - Squad members grid
  - Shared watching statistics
  - Group watch parties
  - Collaborative playlist
  - Squad achievements
- **Styling:** Hero section for group, member grid below
- **Components Used:** Card, Badge, Avatar, Button

### 10. **Profile Page** `/profile`
- **Purpose:** User profile management
- **Features:**
  - User avatar (large)
  - Name, username, email display
  - Bio/about section
  - Stats showcase:
    - Movies watched
    - Suggestions made
    - Friends count
    - Joined date
  - Edit profile button (if own profile)
  - Preference toggles
  - Logout button
- **Styling:** Card-based with avatar header
- **Components Used:** Card, Button, Input, Avatar, Badge

---

## 🎥 Suggestion & Watchlist Pages

### 11. **Suggest Page** `/suggest`
- **Purpose:** Create & manage movie suggestions
- **Features:**
  - **Top Section - Suggest Movies:**
    - Movie search bar (real-time)
    - Search results dropdown
    - Selected movie display
    - "How much do you want to watch?" slider (1-10)
    - Friend multiselect (checkboxes)
    - Optional comment textarea
    - "Suggest to Friends" button
  - **Bottom Section - Incoming Suggestions:**
    - Cards for each suggestion received
    - Movie details & suggested by info
    - Rating slider for response
    - Accept/Ignore buttons
    - Time ago display
  - Pre-selection from home page
- **Styling:** Two-column layout with search dropdown
- **Components Used:** Card, Input, Slider, Checkbox, Button, Textarea, Badge

### 12. **Watchlist Page** `/watchlist`
- **Purpose:** Track movies to watch & viewing history
- **Features:**
  - **Section 1 - Your Watchlist:**
    - Cards for unwatched movies
    - Desire score slider (editable)
    - Who to watch with (friend selector)
    - Platform indicator with color
    - Release date display
    - Suggested by info
    - "Mark as Watched" button
  - **Section 2 - Viewing History:**
    - Timeline view of watched movies
    - Filter by genre dropdown
    - Filter by friend who watched
    - Expected vs actual rating comparison
    - Watch date, friends watched with
    - Reaction emoji indicators
  - "Mark as Watched" dialog with friend selector
- **Styling:** Two-section page with timeline for history
- **Components Used:** Card, Slider, Checkbox, Select, Dialog, Badge, Button

### 13. **Suggestions Page** `/suggestions`
- **Purpose:** Aggregate view of all suggestions
- **Features:**
  - All incoming suggestions
  - Filtering options
  - Sorting (recent, top-rated, etc.)
  - Bulk actions (accept/reject multiple)
  - Suggestion details quick view
- **Styling:** List or grid of suggestion cards
- **Components Used:** Card, Button, Badge, Filter UI

---

## 📅 Events & Activities Pages

### 14. **Events Page** `/events`
- **Purpose:** Movie night events & group watching
- **Features:**
  - List of upcoming movie events
  - Event cards showing:
    - Movie title
    - Date & time
    - Friends attending
    - RSVP status
  - Create event button (prominent CTA)
  - Filter by:
    - Your events
    - Invited to
    - Past events
  - Event thumbnails with backdrop images
- **Styling:** Card grid, event cards
- **Components Used:** Card, Button, Badge, Avatar (friend list), Icons

### 15. **Event Details Page** `/events/[id]`
- **Purpose:** Full event information
- **Features:**
  - Event banner image
  - Movie being watched
  - Event date/time with timezone
  - Location (if in-person)
  - Attendees list with avatars
  - Description/notes
  - Chat/comments section
  - RSVP buttons (Going, Maybe, Can't Go)
  - Edit/delete options (if organizer)
  - Reminder notifications
- **Styling:** Hero section with event details below
- **Components Used:** Card, Button, Avatar, Badge, Textarea, Icons

### 16. **Create Event Page** `/events/create`
- **Purpose:** New event creation
- **Features:**
  - Movie selector (search)
  - Date & time picker
  - Timezone selector
  - Location input
  - Friend invitations (multiselect)
  - Event description
  - Notes field
  - Create button with loading state
- **Styling:** Form-focused page, similar to suggest page
- **Components Used:** Input, Select, DatePicker, Checkbox, Button, Textarea

### 17. **Calendar Page** `/calendar`
- **Purpose:** Month/week view of all events
- **Features:**
  - Calendar grid showing:
    - Movie night events
    - New releases
    - Friend birthdays (if integrated)
  - Color-coded by category
  - Click day to see details
  - Week/month/day view toggle
  - Navigation arrows
  - Today button
  - Event indicators (number of events per day)
- **Styling:** Calendar grid UI
- **Components Used:** Calendar component, Badge, Button

---

## 📊 Analytics & Stats Pages

### 18. **Stats Page** `/stats`
- **Purpose:** Personal & squad statistics
- **Features:**
  - **Personal Stats Tab:**
    - Total movies watched
    - Total suggestions made
    - Suggestion acceptance rate %
    - Average watch desire score
    - Favorite genre
    - Favorite streaming platform
    - Top 5 most watched genres
  - **Squad Rankings Tab:**
    - Leaderboard of friends:
      - Rank badge
      - Name
      - Total watched count
      - Suggestions made
      - Average rating
      - Average desire score
    - Your ranking highlighted
  - **Achievements Tab:** (future)
    - Badges earned
    - Milestones reached
- **Styling:** Multi-tab interface with stat cards
- **Components Used:** Card, Tabs, Badge, BarChart (if implemented), Trophy icon

---

## ⚙️ Settings & Configuration Pages

### 19. **Settings Page** `/settings`
- **Purpose:** User preferences & account settings
- **Features:**
  - Tabs for different settings:
    - **Account Tab:**
      - Email change
      - Password change
      - Username edit
      - Avatar upload
    - **Notifications Tab:**
      - Email notification toggles
      - In-app notification toggles
      - Notification frequency
      - Notification types (suggestions, friends, events)
    - **Preferences Tab:**
      - Default streaming platforms
      - Preferred genres
      - Content restrictions (if any)
      - Language preference
    - **Privacy Tab:**
      - Profile visibility
      - Friend request handling
      - Share watching history
      - Data export option
    - **Danger Zone:**
      - Delete account button
      - Logout all sessions
- **Styling:** Tab-based form interface
- **Components Used:** Tabs, Input, Toggle/Switch, Button, Select, Alert

### 20. **Movie Night Page** `/movie-night`
- **Purpose:** Quick movie night organizer
- **Features:**
  - Rapid event creation
  - Quick friend selector
  - Movie quick pick (random or filters)
  - Time estimation
  - Platform availability check
- **Styling:** Compact, focused interface
- **Components Used:** Button, Select, Card

---

## 🛡️ Admin Pages

### 21. **Admin Dashboard** `/admin`
- **Purpose:** Admin panel for platform management
- **Features:**
  - **Tabs:**
    - **Overview:**
      - Total users
      - Total admins
      - Total movies in system
      - Active suggestions
      - System health indicator
    - **Users Tab:**
      - User list with table
      - User info: id, email, username, role
      - Search/filter users
      - Action buttons:
        - Promote to admin
        - Reset password
        - Delete user
      - Alert dialogs for confirmations
    - **Moderation Tab:**
      - Flagged content
      - Inappropriate suggestions
      - Block/unblock users
    - **System Tab:**
      - Server health
      - Database status
      - API rate limits
      - Error logs
- **Styling:** Professional admin UI with tables
- **Components Used:** Tabs, Table, Button, AlertDialog, Badge, Card, Input

### 22. **User Management Routes** (Admin API backing)
- `/api/admin/users` - List users
- `/api/admin/users/[id]` - Delete user
- `/api/admin/users/[id]/promote` - Promote to admin
- `/api/admin/users/[id]/reset-password` - Password reset
- `/api/admin/stats` - System statistics

---

## 🎯 Watch & Tracking Pages

### 23. **Watches Page** `/watches`
- **Purpose:** View personal watch history
- **Features:**
  - List/timeline of watched content
  - Filter by:
    - Date range
    - Genre
    - Friends watched with
    - Platform
  - Each entry shows:
    - Movie poster/thumbnail
    - Title & year
    - Date watched
    - Friends watched with (avatars)
    - Your rating
    - Platform watched on
- **Styling:** Timeline or list view
- **Components Used:** Card, Badge, Filter, Avatar

---

## 🔄 Additional Pages

### Special Pages:
- **Not Found** `*` - 404 page with redirect to home
- **Loading States** - Spinner during data fetches
- **Error Pages** - Error boundary displays

---

## 🎨 Design System Summary

### Color Palette:
- **Background:** Dark gradients (#0D0D0D, #1a1a2e, #0f0f1e)
- **Primary:** Electric blue (used for accents, buttons)
- **Secondary:** Muted colors for disabled states
- **Success/Error:** Green/Red badges

### Typography:
- **Headers:** Bold, large sizes (h1-h3)
- **Body:** Regular weight, responsive sizes
- **Muted:** Foreground-muted for secondary text

### Components Used Across All Pages:
- **Card** - Page sections
- **Button** - CTA, actions
- **Badge** - Tags, status
- **Input/Select** - Form fields
- **Slider** - Numeric input (ratings)
- **Checkbox** - Multiple selection
- **Dialog** - Confirmations
- **Tabs** - Sectioned content
- **Avatar** - User display
- **Separator** - Visual division
- **Alert** - Messages

### Icons:
- Lucide React for all icons
- Consistent 16-24px sizes
- Color-coded by section

---

## 📱 Responsive Design

All pages are fully responsive:
- **Mobile:** Single column, full-width
- **Tablet:** 2 columns, adjusted spacing
- **Desktop:** Multi-column, optimized layout
- **Breakpoints:** TailwindCSS defaults (sm, md, lg, xl)

---

## 🚀 Data Flow

### Data Sources:
1. **Authentication:** AuthContext (local storage)
2. **API Calls:** `/api/*` routes
3. **Mock Data:** Hardcoded for demo features
4. **Real Data:** Database (Prisma)

### State Management:
- **React Hooks:** useState, useEffect, useContext
- **Auth State:** AuthContext global
- **Local State:** Component-level for UI

### Loading Patterns:
- `isLoading` flags
- Skeleton/spinner displays
- Fallback UI

---

## ✨ Key Features by Page

| Page | Key Feature | Status |
|------|-------------|--------|
| Dashboard | Smart suggestions | ✅ Ready |
| Movies | Search & filter | ⚠️ Awaiting TMDB |
| Friends | Request management | ✅ Ready |
| Suggest | Two-way suggestions | ✅ Ready |
| Watchlist | Desire & history tracking | ✅ Ready |
| Stats | Leaderboard | ✅ Ready |
| Events | Movie night planning | ✅ Ready |
| Admin | User management | ✅ Ready |

---

**Last Updated:** November 25, 2025  
**Total Pages:** 23 routes (16 main pages + 7 nested routes)  
**Styling:** 100% TailwindCSS + Radix UI  
**Status:** Production ready (minus TMDB integration)
