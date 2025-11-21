# MovieNight Calendar & Events Feature

## Overview

The Calendar & Events feature allows users to:

1. **Plan Movie Nights** - Create events for watching movies with friends
2. **Track Watch History** - View all movies watched (solo or with others)
3. **Unified Calendar** - See all movie activities on one calendar view
4. **Manage Invitations** - Invite friends to movie nights and manage participants

## Architecture

### Database Schema

#### New Table: `movienight."Event"`

```sql
CREATE TABLE movienight."Event" (
  id uuid PRIMARY KEY,
  movieId uuid NOT NULL REFERENCES movienight."Movie"(id),
  hostUserId text NOT NULL REFERENCES auth."User"(id),
  participants text[] NOT NULL,           -- JSON array of internal user IDs
  date timestamp NOT NULL,
  notes text,
  createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL
);
```

**Key Design Notes:**
- `hostUserId` - Always a user's internal ID
- `participants` - Array of internal user IDs (stored as JSON text)
- `date` - The scheduled movie night datetime
- Permissions: Only the host can edit or delete

### Related Tables

#### `movienight."WatchedMovie"` (Enhanced)

Already has `watchedAt` timestamp which is used by the calendar to display solo watch history.

## API Routes

### `POST /api/events`

Create a new movie night event.

**Request:**
```json
{
  "movieId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2025-01-25T19:00:00Z",
  "notes": "Bring popcorn!",
  "participants": ["user-puid-1", "user-puid-2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "movieId": "movie-uuid",
    "hostUserId": "host-puid",
    "participants": ["host-puid", "user-puid-1", "user-puid-2"],
    "date": "2025-01-25T19:00:00Z",
    "notes": "Bring popcorn!",
    "createdAt": "2025-01-18T10:00:00Z",
    "updatedAt": "2025-01-18T10:00:00Z"
  }
}
```

**Behavior:**
- Automatically includes the current user as host
- Validates all participant IDs (puid) exist in auth.User
- Returns error with list of invalid user IDs if validation fails
- Stores internal IDs internally, returns external IDs (puid) to client

### `GET /api/events`

List all events for the current user (as host or participant).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-uuid",
      "movieId": "movie-uuid",
      "movieTitle": "The Matrix",
      "moviePoster": "https://...",
      "hostUserId": "host-puid",
      "hostUsername": "alice",
      "participants": ["alice-puid", "bob-puid"],
      "date": "2025-01-25T19:00:00Z",
      "notes": "Bring popcorn!",
      "createdAt": "2025-01-18T10:00:00Z",
      "updatedAt": "2025-01-18T10:00:00Z"
    }
  ]
}
```

### `GET /api/events/[id]`

Get detailed information about a single event.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "movieId": "movie-uuid",
    "movieTitle": "The Matrix",
    "moviePoster": "https://...",
    "movieYear": 1999,
    "movieDescription": "...",
    "movieGenres": ["Science Fiction", "Action"],
    "hostUserId": "host-puid",
    "hostUsername": "alice",
    "participants": ["alice-puid", "bob-puid"],
    "date": "2025-01-25T19:00:00Z",
    "notes": "Bring popcorn!",
    "isHost": true,
    "createdAt": "2025-01-18T10:00:00Z",
    "updatedAt": "2025-01-18T10:00:00Z"
  }
}
```

**Permissions:**
- Returns 403 if user is not the host or a participant
- `isHost` field indicates if current user is the host

### `PATCH /api/events/[id]`

Update an event (host only).

**Request:**
```json
{
  "date": "2025-01-26T19:00:00Z",
  "notes": "Updated notes",
  "participants": ["user-puid-1", "user-puid-2"]
}
```

**Response:**
Same as GET event detail with updated fields.

**Permissions:**
- Returns 403 if current user is not the host
- Only host can modify date, notes, and participants

### `DELETE /api/events/[id]`

Delete an event (host only).

**Response:**
```json
{
  "success": true,
  "data": { "message": "Event deleted" }
}
```

**Permissions:**
- Returns 403 if current user is not the host

## Frontend Pages

### `/calendar`

**Features:**
- Month view calendar grid
- Displays events and watch history on their respective dates
- Color-coded: 🎬 Movie Night (blue) vs ✓ Watched (green)
- Month navigation buttons
- Click events to view details
- "Create Movie Night" button
- Legend showing what each color means

**Data Sources:**
- Fetches from `/api/events` (scheduled movie nights)
- Fetches from `/api/watch/history` (watched movies)
- Combines both into unified calendar

**Implementation:**
- Generates a 6-week calendar grid (starts previous month, ends next month)
- Groups entries by date
- Shows day-of-month numbers with event list below
- Non-current-month days grayed out
- Uses ISO date format for consistent date grouping

### `/events/create`

**Features:**
- Form to create a new movie night
- Movie dropdown (fetches from `/api/movies`)
- Date/time picker
- Notes textarea
- Friend checkboxes for invitations
- Optional pre-fill from suggestion (via URL params)

**URL Parameters:**
- `movieId` - Pre-select a movie
- `fromUserId` - Pre-select a friend as participant

**Behavior:**
- On success, redirects to event detail page
- Validates all inputs with Zod before submission
- Shows validation errors inline
- Submit button disabled while saving

### `/events/[id]`

**Features:**
- Display full event details with movie info
- Show all participants
- Host can edit or delete
- Non-hosts can view but not edit
- Participants list with visual indicator
- Edit mode for hosts (form to modify date, notes, participants)

**Host Permissions:**
- Edit button (updates date, notes, participants)
- Delete button (removes event entirely)

**Non-Host Permissions:**
- View-only mode (no edit/delete buttons)

## User ID Mapping Strategy

The system uses two types of user IDs:

### Internal ID (`auth."User".id`)
- UUID stored in database
- Used internally for all database joins
- Stored in `Event.hostUserId` and `Event.participants[]`
- Never exposed to frontend (except in API responses)

### Public ID (`auth."User".puid`)
- UUID generated during signup
- Exposed to frontend and used in URLs
- Used in API request bodies (e.g., participant arrays)
- Mapped to internal ID on the backend

### Mapping Flow

**Creating an Event:**
1. Client sends `participants: ["puid-1", "puid-2", ...]`
2. Server maps each puid → internal id
3. Server validates internal ids exist in auth.User
4. Server stores internal ids in database
5. Server returns response with puids for frontend

**Getting an Event:**
1. Server fetches event with internal ids
2. Server maps internal ids → puids
3. Server returns response with puids
4. Frontend displays puids to user

## Integration with Suggestions

Users can convert a suggestion into a movie night event:

1. Navigate to `/suggestions`
2. See pending suggestion with "Book Movie Night" button
3. Click button → redirects to `/events/create?movieId=...&fromUserId=...`
4. Form pre-fills with:
   - Movie from the suggestion
   - Suggester as a participant
   - Original suggestion message in notes

**Behavior:**
- Only shows "Book Movie Night" for pending suggestions
- Clicking button creates an event with the suggester as a participant

## Integration with Watch History

Solo movie watches are automatically included in the calendar:

1. User marks a movie as watched via `/api/watch/mark-watched`
2. Record created in `movienight."WatchedMovie"` with `watchedAt` timestamp
3. Calendar page fetches `/api/watch/history`
4. Calendar displays watches on their respective dates
5. Watches show as "✓ Movie Title" (green indicator)

No additional action needed - watches appear automatically on the calendar.

## Permissions Summary

| Action | Host | Participant | Non-Member |
|--------|------|-------------|-----------|
| View Event | ✓ | ✓ | ✗ (403) |
| Create Event | ✓ (always host) | - | - |
| Edit Event | ✓ | ✗ (403) | ✗ (403) |
| Delete Event | ✓ | ✗ (403) | ✗ (403) |
| Add Participants | ✓ | ✗ | ✗ |

## Error Handling

### Common Errors

**Event Not Found (404)**
```json
{
  "success": false,
  "error": "Event not found"
}
```

**Unauthorized (403)**
```json
{
  "success": false,
  "error": "Only the host can edit this event"
}
```

**Invalid Participants (400)**
```json
{
  "success": false,
  "error": "Invalid user IDs: invalid-puid-1, invalid-puid-2"
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "error": [
    { "field": "date", "message": "Invalid date format" },
    { "field": "participants", "message": "Must be an array" }
  ]
}
```

## Best Practices

1. **Always map puid ↔ id**: Frontend uses puid, backend stores id
2. **Validate participant IDs**: Check they exist before creating/updating events
3. **Check host permission**: Only host can edit/delete
4. **Use session auth**: All routes require valid session
5. **Handle dates carefully**: Use ISO 8601 format, handle timezone conversion on frontend
6. **Show clear errors**: Explain why an action failed (invalid participants, not host, etc.)

## Future Enhancements

- [ ] Recurring events (weekly, monthly)
- [ ] RSVP system (accept/decline invitation)
- [ ] Event reminders (email, push notification)
- [ ] Collaborative movie selection (voting)
- [ ] Event sharing (generate shareable link)
- [ ] Calendar export (iCal format)
- [ ] Google Calendar sync
- [ ] Event ratings after watching together
- [ ] Movie night statistics (most watched genre, etc.)

## Testing Checklist

- [ ] Create event with valid movie and participants
- [ ] Create event with invalid participant ID (should error)
- [ ] List events filters correctly (only user's events)
- [ ] Get event detail shows correct permissions
- [ ] Host can edit event
- [ ] Non-host cannot edit event
- [ ] Host can delete event
- [ ] Non-host cannot delete event
- [ ] Calendar displays events correctly
- [ ] Calendar displays watch history correctly
- [ ] Calendar navigation works (prev/next month)
- [ ] Book from suggestion pre-fills correctly
- [ ] Date/time picker works correctly
- [ ] Participant checkboxes toggle correctly
