# Unified Message System Documentation

## Overview

The ASChat API has been upgraded to use a **Unified Message System** that combines user messages and bot messages into a single table for improved performance and simplified queries.

## Key Changes

### Before (Separate Tables)
- `messages` table for user messages
- `bot_messages` table for bot messages  
- Required separate queries and client-side merging
- Complex conversation reconstruction

### After (Unified Table)
- Single `Message` table for both user and bot messages
- Optional `channelMemberId` for user messages
- Optional `botChannelMemberId` for bot messages
- Single query returns complete conversation chronology
- Simplified client-side handling

## Database Schema

```sql
model Message {
  id                   Int      @id @default(autoincrement())
  content              String
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  channelId            Int
  channelMemberId      Int?     // For user messages
  botChannelMemberId   Int?     // For bot messages
  replyToMessageId     Int?
  
  // Relations
  channel              Channel           @relation(fields: [channelId], references: [id])
  author               ChannelMember?    @relation("UserMessages", fields: [channelMemberId], references: [id])
  botAuthor            BotChannelMember? @relation("BotMessages", fields: [botChannelMemberId], references: [id])
  replyToMessage       Message?          @relation("MessageReplies", fields: [replyToMessageId], references: [id])
  replies              Message[]         @relation("MessageReplies")
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
    "createdAt": "2025-06-02T10:00:00.000Z",
    "updatedAt": "2025-06-02T10:00:00.000Z",
    "channelId": 1,
    "type": "user",
    "author": {
      "id": 1,
      "name": "Alfredo Sumaran",
      "email": "alfredo@mail.test"
    },
    "channelMemberId": 1,
    "replyToMessageId": null
  },
  {
    "id": 2,
    "content": "#1 ¡Hola! 👋 ¿Cómo puedo ayudarte?",
    "createdAt": "2025-06-02T10:05:00.000Z",
    "updatedAt": "2025-06-02T10:05:00.000Z",
    "channelId": 1,
    "type": "bot",
    "author": {
      "id": 1,
      "name": "Assistant Bot"
    },
    "botChannelMemberId": 1,
    "replyToMessageId": 1
  }
]
```

### Get Bot Messages Only
**GET /bots/messages/channel/{channelId}**

Returns only bot messages with full relationship data:

```json
[
  {
    "id": 2,
    "content": "#1 ¡Hola! 👋 ¿Cómo puedo ayudarte?",
    "createdAt": "2025-06-02T10:05:00.000Z",
    "updatedAt": "2025-06-02T10:05:00.000Z",
    "channelId": 1,
    "botChannelMemberId": 1,
    "replyToMessageId": 1,
    "botAuthor": {
      "id": 1,
      "botId": 1,
      "channelId": 1,
      "bot": {
        "id": 1,
        "name": "Assistant Bot"
      }
    },
    "replyToMessage": {
      "id": 1,
      "content": "Hello everyone!",
      "createdAt": "2025-06-02T10:00:00.000Z",
      "updatedAt": "2025-06-02T10:00:00.000Z",
      "channelId": 1,
      "channelMemberId": 1
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
