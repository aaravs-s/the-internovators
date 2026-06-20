// ── Shared mock data and types ────────────────────────────────────────────────

export const weekActivity = [
  { day: "Mon", routes: 2, km: 4.1 },
  { day: "Tue", routes: 1, km: 2.3 },
  { day: "Wed", routes: 3, km: 7.8 },
  { day: "Thu", routes: 0, km: 0 },
  { day: "Fri", routes: 2, km: 5.5 },
  { day: "Sat", routes: 4, km: 11.2 },
  { day: "Sun", routes: 1, km: 3.0 },
];

export const safetyRadar = [
  { subject: "Lighting", score: 88 },
  { subject: "Traffic",  score: 72 },
  { subject: "Crime",    score: 91 },
  { subject: "Footpath", score: 85 },
  { subject: "Crowding", score: 64 },
];

export const monthlyActivity = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  km: Math.max(0, Math.round((Math.sin(i * 0.4) * 4 + 4 + ((i * 7 + 3) % 5) * 0.4) * 10) / 10),
}));

export const notifications = [
  { id: 1, type: "safety",      title: "Safety Alert",                  body: "Elevated activity reported near Central Park. Consider an alternate route.", time: "2 min ago",  read: false },
  { id: 2, type: "social",      title: "Alex Rivera started following you", body: "You now have 90 followers.",                                               time: "14 min ago", read: false },
  { id: 3, type: "route",       title: "Route completed!",               body: "Downtown Loop — 8.7 mi · 25 min · Safety score 9.2",                         time: "1h ago",     read: false },
  { id: 4, type: "social",      title: "Maya Chen liked your route",     body: "Riverside Walk was liked by Maya Chen.",                                      time: "3h ago",     read: true  },
  { id: 5, type: "achievement", title: "Achievement unlocked",           body: "Night Walker — completed 5 routes after 9 PM.",                               time: "Yesterday",  read: true  },
  { id: 6, type: "route",       title: "New route suggestion",           body: "Harbour Promenade has been added to your recommendations.",                   time: "Yesterday",  read: true  },
  { id: 7, type: "system",      title: "App updated to v2.4.1",          body: "New features: route replays, live heatmaps, and improved notifications.",     time: "2 days ago", read: true  },
];

export const exploreRoutes = [
  { id: 1, name: "Harbour Promenade", distance: "6.4 mi", duration: "38 min", safety: 9.5, tags: ["Scenic",  "Flat"]    },
  { id: 2, name: "Old Town Circuit",  distance: "2.9 mi", duration: "20 min", safety: 8.8, tags: ["Historic","Busy"]    },
  { id: 3, name: "Park Ring",         distance: "4.1 mi", duration: "28 min", safety: 9.1, tags: ["Nature",  "Quiet"]   },
  { id: 4, name: "Night Mile",        distance: "1.2 mi", duration: "12 min", safety: 7.6, tags: ["Short",   "Lit"]     },
  { id: 5, name: "University Walk",   distance: "3.5 mi", duration: "24 min", safety: 9.3, tags: ["Safe",    "Busy"]    },
  { id: 6, name: "Industrial Loop",   distance: "5.8 mi", duration: "45 min", safety: 6.9, tags: ["Long",    "Quiet"]   },
];

export const reviews = [
  { author: "Maya C.",   rating: 5, text: "Great route, felt safe the whole time. Well lit!",                 time: "3 days ago",  initials: "M" },
  { author: "Jordan B.", rating: 4, text: "Nice scenery through downtown. A bit crowded on weekends.",        time: "1 week ago",  initials: "J" },
  { author: "Sam T.",    rating: 5, text: "My go-to morning walk. Highly recommend.",                          time: "2 weeks ago", initials: "S" },
];

export const socialUsers = [
  { id: 1, name: "Alex Rivera",  handle: "alexrivera",  routes: 128, initials: "A" },
  { id: 2, name: "Maya Chen",    handle: "mayachen",    routes:  74, initials: "M" },
  { id: 3, name: "Jordan Blake", handle: "jordanblake", routes: 203, initials: "J" },
  { id: 4, name: "Sam Torres",   handle: "samtorres",   routes:  56, initials: "S" },
  { id: 5, name: "Casey Park",   handle: "caseypark",   routes:  91, initials: "C" },
];

export const activityFeed = [
  { id: 1, user: "Alex Rivera",  initials: "A", action: "completed", route: "Harbour Promenade", distance: "6.4 mi", time: "20 min ago", likes: 7  },
  { id: 2, user: "Jordan Blake", initials: "J", action: "saved",     route: "Night Mile",        distance: "1.2 mi", time: "1h ago",     likes: 3  },
  { id: 3, user: "Maya Chen",    initials: "M", action: "completed", route: "Park Ring",         distance: "4.1 mi", time: "3h ago",     likes: 12 },
  { id: 4, user: "Casey Park",   initials: "C", action: "completed", route: "Old Town Circuit",  distance: "2.9 mi", time: "Yesterday",  likes: 5  },
];
