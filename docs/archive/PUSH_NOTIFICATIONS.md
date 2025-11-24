# Push Notifications System

## 🔔 Overview

MovieNight now includes a comprehensive push notification system that allows users to receive real-time updates about movie suggestions, friend requests, movie nights, and more.

## ✨ Features

### **10 Notification Types:**

- 👥 **Friend Requests** - When someone sends a friend request
- ✅ **Friend Accepted** - When someone accepts your friend request
- 🎬 **Movie Suggestions** - When friends suggest movies
- 💬 **Suggestion Responses** - When friends respond to your suggestions
- 🍿 **Movie Night Invites** - When invited to movie nights
- ⏰ **Movie Night Reminders** - Reminders before movie nights
- 📺 **Movies Available** - When watchlist movies become available
- ✨ **Recommendations** - Personalized movie recommendations
- 📊 **Weekly Recap** - Weekly activity summaries
- 🔔 **System Updates** - App updates and announcements

### **Granular User Control:**

- Enable/disable each notification type individually
- Choose delivery methods: Push notifications and/or Email
- Customize timing (reminder hours, recap day)
- Test notifications to see how they look

### **PWA Integration:**

- Works seamlessly with the PWA install
- Offline notification queuing
- Rich notification actions (View, Dismiss, etc.)
- Smart notification grouping and cleanup

## 🛠 Technical Implementation

### **Client-Side:**

- `client/lib/notifications.ts` - Core notification management
- `client/hooks/usePushNotifications.ts` - React hooks for push state
- `client/pages/NotificationSettings.tsx` - User settings interface
- `client/components/PushNotificationPrompt.tsx` - Install prompts

### **Server-Side:**

- `server/routes/notifications.ts` - API endpoints for push subscriptions
- Database schema extended with `pushSubscriptions` and `notificationPreferences`
- VAPID key support for secure push delivery

### **Service Worker:**

- Enhanced `public/sw.js` with rich notification handling
- Smart action routing based on notification type
- Analytics tracking for notification engagement

## 🚀 Setup Instructions

### **1. Environment Variables**

```bash
# Generate VAPID keys
npx web-push generate-vapid-keys

# Add to .env
VITE_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
```

### **2. User Flow**

1. **Install PWA** - Users first install the app as a PWA
2. **Permission Prompt** - Smart prompt appears after 5 seconds of usage
3. **Settings Access** - Users can access notification settings via user menu
4. **Granular Control** - Customize exactly which notifications they want

### **3. Admin Controls**

- Access **Admin Dashboard > Notifications** tab
- Send test notifications to specific users
- Monitor notification delivery success/failure rates
- View push subscription statistics

## 🎯 User Experience

### **Smart Prompting:**

- Only shows to users who haven't granted/denied permission
- Respects user dismissals (won't show again for 1 week)
- Different UI for mobile vs desktop
- Non-intrusive with clear benefits

### **Rich Notifications:**

- Context-aware actions (View, Dismiss, etc.)
- Proper icons and branding
- Smart routing to relevant app sections
- Offline queuing when network is unavailable

### **Accessibility:**

- Full keyboard navigation in settings
- Screen reader friendly
- Clear visual indicators for notification states
- Respect system notification preferences

## 📊 Analytics & Monitoring

### **Tracked Events:**

- Notification displays
- User interactions (clicks, dismissals)
- Subscription success/failure rates
- Permission grant/deny rates

### **Cleanup & Maintenance:**

- Automatic cleanup of invalid subscriptions
- Retry logic for failed deliveries
- Subscription health monitoring

## 🔐 Security & Privacy

### **VAPID Keys:**

- Secure server-to-browser communication
- No third-party services required
- User subscriptions tied to device/browser

### **User Control:**

- Granular opt-in/opt-out controls
- Local storage of preferences
- Easy unsubscribe process

### **Data Handling:**

- Minimal data collection
- No personal info in notification payloads
- Respect Do Not Track preferences

## 🚀 Future Enhancements

### **Planned Features:**

- **Email Notifications** - Fallback for important notifications
- **Notification Scheduling** - Send at optimal times for users
- **A/B Testing** - Optimize notification content and timing
- **Advanced Analytics** - Engagement metrics and insights
- **Notification Templates** - Rich content with images/videos

### **Integration Opportunities:**

- **Movie Releases** - Auto-notify when watchlist movies release
- **Social Features** - Friend activity and social proof
- **Smart Suggestions** - ML-powered recommendation notifications
- **Calendar Integration** - Movie night scheduling and reminders

## 🎬 Usage Examples

### **For Users:**

```
🎬 New Movie Suggestion!
Sara suggested "Dune: Part Two" for you to watch
[View Movie] [Not Interested]
```

### **For Admins:**

- Send announcements about new features
- Notify about system maintenance
- Promote special movie events or releases

This notification system transforms MovieNight from a simple web app into an engaging, always-connected movie community platform! 🍿
