# Website Structure

Updated: 2026-03-31T18:16:01.174Z

## Summary

- Entry point: Landing → Login → Workspaces
- Top-level sections: 6
- Total nodes: 41
- Total routes in App.tsx: 10

```text
Landing
├ Features
├ Pricing
├ Changelog
├ Resources
│ ├ Documentation
│ ├ Guides
│ ├ Blog
│ └ Community
├ Legal
│ ├ Terms
│ └ Privacy
└ Login
  └ Workspace
    ├ Student Workspace
    │ ├ Dashboard
    │ │ ├ Active Projects
    │ │ ├ Tasks Today
    │ │ └ Progress Overview
    │ ├ Projects
    │ │ ├ Board
    │ │ ├ AI Planner
    │ │ ├ Insights
    │ │ ├ Members
    │ │ ├ Files
    │ │ ├ Timeline
    │ │ └ Calendar
    │ ├ Members
    │ └ Settings
    ├ Lecturer Workspace
    │ ├ Overview
    │ ├ Groups
    │ │ └ Group Detail
    │ ├ Deadlines
    │ └ Settings
    └ Admin Workspace
      ├ Users
      ├ AI
      ├ Analytics
      ├ Audit Log
      └ Config
```

Source: generated from UX-facing routes and workspace navigation in src/App.tsx and dashboard views.
