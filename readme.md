# SynergySphere

SynergySphere is an advanced team collaboration platform.

## Demo Video

Check out the demo video below to see SynergySphere in action:

# Round 1: 
https://github.com/user-attachments/assets/eddf39f4-5298-4161-9e4a-f560f90eb25e

# Final Round demo:
https://youtu.be/baCzpVf0wYM

<!-- 
To add your demo video:
1. Create an 'assets' folder in your GitHub repository
2. Upload your demo video to this folder
3. Replace the placeholder URL above with the actual URL to your video
4. Alternatively, upload your video to a service like YouTube and embed it here
-->

## Project Vision

SynergySphere is built on a simple idea: teams do their best work when their tools truly support how they think, communicate, and move forward together. This platform aims to go beyond traditional project management software by becoming an intelligent backbone for teams — helping them stay organized, communicate better, manage resources more effectively, and make informed decisions without friction.

At its core, SynergySphere is about helping teams operate at their best — continuously improving, staying aligned, and working smarter every day.

## Round 1 MVP Focus

The initial focus is on laying the foundation with a Core Collaboration MVP. This includes:
- User registration/login
- Project creation and management
- Adding team members to projects
- Task assignment with deadlines and statuses (To-Do, In Progress, Done)
- Project-specific threaded discussions
- Visualization of task progress
- Basic notifications for important events

## Tech Stack (Initial - subject to change)

- Full-stack framework: Next.js 15
- UI: Tailwind CSS v4
- Component library: Shadcn UI
- Authentication: better-auth (to be evaluated for suitability)
- Database: postgres
- ORM: drizzle-orm 

## Features

The chat system includes:
- Project-level and task-level chat rooms
- User mentions with notifications (@username)
- Message reactions
- Read receipts
- Unread message counts

## Frontend Integration

The frontend components are integrated into the SynergySphere Next.js application:

- `ChatProvider`: Context provider for chat functionality
- `ChatInput`: Input component with @mentions support
- `ChatWindow`: Message display component
- `ChatTab`: Project-level chat UI
- `TaskChatTab`: Task-level chat UI

### Features

- **User Tagging**: Type @ to mention users, which sends notifications
- **Mentions Tracking**: Mentions are tracked and displayed in the inbox
- **Persistent History**: All messages are stored in the database

## Database Schema

The chat system uses the following database tables:

- `chatMessage`: Stores all chat messages
- `notification`: Stores notifications, including @mentions

## Getting Started

1. Set up the frontend:
   ```bash
   # Install the dependencies
   npm install
   
   # Run the Next.js app
   npm run dev
   ```

2. Access the chat through project or task pages in the SynergySphere application.

made with ✨ by Exelciors team