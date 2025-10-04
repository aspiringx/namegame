# Chat System Design

**Date:** October 3, 2025  
**Status:** Planning Phase  

## Overview

Design and implement a real-time chat system for NameGame that supports both direct messages and group conversations, with emoji reactions but without message threading to keep the UI simple.

## Key Design Decisions

### Chat vs Content Messages
- **Chat**: Real-time conversations (this system)
- **Content Messages**: Notification delivery system (existing `Message` model)
- These are separate concepts with different purposes

### Scope Definition
- ✅ **Include**: Basic real-time chat, direct messages, group chats, emoji reactions, read status
- ❌ **Exclude**: Message replies/threading (keeps UI simple like Mac Messages app)

## Database Schema

### New Models to Add

#### 1. ChatConversation
Container for chat threads
- `id`: Unique identifier
- `type`: 'direct' (person-to-person) or 'group' (all group members)
- `groupId`: NULL for direct messages, set for group chats
- `name`: Optional name for group conversations
- `createdAt`, `updatedAt`, `lastMessageAt`: Timestamps for sorting by activity

#### 2. ChatParticipant
Tracks who's in each conversation
- `conversationId`: Links to ChatConversation
- `userId`: Links to User
- `joinedAt`: When they joined the conversation
- `lastReadAt`: For unread message tracking

#### 3. ChatMessage
Individual chat messages
- `conversationId`: Links to ChatConversation
- `authorId`: Links to User (message sender)
- `content`: Message text
- `type`: 'text', 'image', 'system' (default: 'text')
- `createdAt`, `updatedAt`: Timestamps
- `deletedAt`: Soft delete capability

#### 4. ChatMessageReaction
Emoji reactions to messages
- `messageId`: Links to ChatMessage
- `userId`: Links to User (who reacted)
- `emoji`: Unicode emoji character (👍, ❤️, 😂, etc.)
- `createdAt`: When reaction was added

## Technical Implementation

### Real-time Architecture
- **Socket.io** for WebSocket connections
- **PostgreSQL LISTEN/NOTIFY** for pub/sub messaging across chat servers
- **JWT authentication** for socket connections

### Emoji System
- Use standard Unicode emoji characters
- Consider `emoji-js` or `node-emoji` library for emoji picker UI
- Store reactions as Unicode strings in database

### Chat Types
1. **Direct Messages**: 2+ people, private conversation
2. **Group Chat**: All members of a NameGame group, tied to `groupId`

## User Experience

### Core Features
- Send/receive real-time messages
- See who's online/typing (future enhancement)
- React to messages with emojis
- Track unread message counts
- Message history persistence

### UI Simplicity
- No message threading (like Mac Messages)
- Clean, familiar chat interface
- Emoji reaction display below messages
- Clear distinction between direct and group chats

## Implementation Phases

### Phase 1: Database & Backend
1. Add chat models to Prisma schema
2. Update chat handler to use new models
3. Test Socket.io server with new schema

### Phase 2: Basic Chat UI
1. Create chat interface components
2. Implement message sending/receiving
3. Add conversation list

### Phase 3: Reactions & Polish
1. Add emoji reaction system
2. Implement unread message tracking
3. Polish UI and add typing indicators

## Integration Points

### With Existing System
- Leverages existing User and Group models
- Separate from content notification system
- Uses same authentication (NextAuth.js)

### Future Considerations
- Integration with push notifications for offline users
- Message search functionality
- File/image sharing in chat
- Chat moderation tools for group admins

## Success Criteria
- Real-time message delivery works reliably
- Users can easily switch between direct and group chats
- Emoji reactions feel natural and responsive
- UI remains simple and uncluttered
- System scales to handle multiple concurrent conversations
