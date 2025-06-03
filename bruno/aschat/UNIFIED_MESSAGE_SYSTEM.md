# Unified Message System Documentation

## Overview

The ASChat API has been upgraded to use a **Unified Message and Membership System** that combines user messages and bot messages into a single table, and unifies user and bot channel membership through a single `ChannelMember` table for improved performance and simplified queries.

## Key Changes

### Before (Separate Tables)
- `messages` table for user messages
- `bot_messages` table for bot messages  
- `ChannelMember` table for user memberships
- `BotChannelMember` table for bot memberships
- Required separate queries and complex joins
- Complex conversation reconstruction

### After (Unified Tables)
- Single `Message` table for both user and bot messages
- Single `ChannelMember` table for both user and bot memberships
- ChannelMember can reference either a `userId` OR a `botId`
- Single query returns complete conversation chronology
- Simplified client-side handling and relationships

## Database Schema

```sql
model ChannelMember {
  id        Int     @id @default(autoincrement())
  
  // Member can be either a User or a Bot (only one should be set)
  user      User?   @relation(fields: [userId], references: [id])
  userId    Int?
  bot       Bot?    @relation(fields: [botId], references: [id])
  botId     Int?
  
  channel   Channel @relation(fields: [channelId], references: [id])
  channelId Int
  messages  Message[]

  // Ensure only one type of member is set and unique combinations
  @@unique([userId, channelId])
  @@unique([botId, channelId])
}

model Message {
  id                   Int      @id @default(autoincrement())
  content              String
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  // Author - unified through ChannelMember
  channelMemberId      Int
  channelId            Int
  replyToMessageId     Int?
  
  // Relations
  author               ChannelMember @relation(fields: [channelMemberId], references: [id])
  channel              Channel       @relation(fields: [channelId], references: [id])
  replyToMessage       Message?      @relation("MessageReplies", fields: [replyToMessageId], references: [id])
  replies              Message[]     @relation("MessageReplies")
}
```

## API Endpoints

### Get All Messages (Unified)
**GET /messages/{channelId}**

Returns both user and bot messages in chronological order with type discrimination:

```json
[
  {
    "id": 1,
    "content": "Hello everyone!",
    "createdAt": "2025-06-03T20:36:37.015Z",
    "updatedAt": "2025-06-03T20:36:37.015Z",
    "channelId": 1,
    "type": "user",
    "author": {
      "id": 1,
      "name": "Alfredo Sumaran",
      "email": "alfredo@mail.test"
    },
    "channelMemberId": 2,
    "replyToMessageId": null
  },
  {
    "id": 3,
    "content": "Hello humans! I am here to assist you.",
    "createdAt": "2025-06-03T20:36:37.017Z",
    "updatedAt": "2025-06-03T20:36:37.017Z",
    "channelId": 1,
    "type": "bot",
    "author": {
      "id": 1,
      "name": "Assistant Bot"
    },
    "channelMemberId": 5,
    "replyToMessageId": null
  }
]
```

### Get Bot Messages Only
**GET /bots/messages/channel/{channelId}**

Returns only bot messages with full relationship data:

```json
[
  {
    "id": 5,
    "content": "#1 ¿Has probado apagarlo y encenderlo de nuevo?",
    "createdAt": "2025-06-03T20:41:10.736Z",
    "updatedAt": "2025-06-03T20:41:10.736Z",
    "channelMemberId": 5,
    "channelId": 1,
    "replyToMessageId": 4,
    "author": {
      "id": 5,
      "userId": null,
      "botId": 1,
      "channelId": 1,
      "bot": {
        "id": 1,
        "name": "Assistant Bot",
        "isActive": true,
        "createdAt": "2025-06-03T20:36:37.008Z",
        "updatedAt": "2025-06-03T20:36:37.008Z"
      }
    },
    "replyToMessage": {
      "id": 4,
      "content": "Hey #1, how are you doing?",
      "createdAt": "2025-06-03T20:41:10.729Z",
      "updatedAt": "2025-06-03T20:41:10.729Z",
      "channelMemberId": 2,
      "channelId": 1,
      "replyToMessageId": null
    }
  }
]
```

### Create User Message
**POST /messages**

```json
{
  "channelId": 1,
  "channelMemberId": 1,
  "content": "Hey #1, how are you?"
}
```

Automatically triggers bot responses when mentions are detected.

### Delete Message
**DELETE /messages/{id}**

Works for both user and bot messages from the unified table.

## Message Types

### User Messages
- Have `channelMemberId` (not null)
- Have `botChannelMemberId` (null)
- Include author email in unified response
- Type: `"user"`

### Bot Messages  
- Have `botChannelMemberId` (not null)
- Have `channelMemberId` (null)
- No email in author object
- Type: `"bot"`

## Bot Mention System

### Triggering Bot Responses
Use `#{botId}` syntax in message content:
- `"Hey #1, how are you?"` → mentions bot with ID 1
- `"What do you think #2?"` → mentions bot with ID 2

### Mention Flow
1. User sends message with bot mention
2. System detects mention pattern via BotMentionService
3. Bot generates response with random content
4. Bot message stored with `botChannelMemberId` and `replyToMessageId`
5. Unified endpoint returns both messages in chronological order

## Benefits

### Performance Improvements
- **Single Query**: One database query instead of multiple
- **Reduced Joins**: Fewer complex relationships to resolve
- **Better Indexing**: Single table allows for more efficient indexes

### Development Benefits
- **Simplified Logic**: No client-side merging required
- **Type Safety**: Single interface handles both message types
- **Easier Testing**: Single endpoint to test complete conversations
- **Consistent Ordering**: Database handles chronological sorting

### Maintenance Benefits
- **Single Source of Truth**: All messages in one table
- **Easier Migrations**: Single table to modify for schema changes
- **Simplified Backups**: One table contains all message data

## Migration Notes

The migration from separate tables to unified table:
1. **Preserved all existing data** from both `messages` and `bot_messages` tables
2. **Maintained foreign key relationships** with proper mapping
3. **Ensured data integrity** with careful constraint handling
4. **Zero data loss** during the migration process

## Testing

### Bruno Test Files Updated
- `Get all Messages of a Channel.bru` - Tests unified endpoint
- `Get Bot Messages from Channel.bru` - Tests bot-only filtering  
- `Create a New Channel Message.bru` - Tests message creation
- `Delete a Message.bru` - Tests unified deletion
- `Test Bot Mention Flow.bru` - Tests complete mention workflow

### Testing Strategy
1. **Create user message** with bot mention
2. **Verify unified response** includes both user and bot messages
3. **Check bot-only endpoint** filters correctly
4. **Validate chronological ordering** is maintained
5. **Test deletion** works for both message types

## Future Considerations

### Potential Enhancements
- **Message threading**: Enhanced reply system
- **Reaction system**: Add emoji reactions to unified table
- **Message editing**: Support for message modifications
- **Rich content**: Support for media attachments
- **Message search**: Full-text search across unified content

### Monitoring
- **Query performance**: Monitor unified query response times
- **Memory usage**: Track impact of single-table queries
- **Bot response latency**: Measure mention-to-response timing
- **Data growth**: Monitor table size and index performance
