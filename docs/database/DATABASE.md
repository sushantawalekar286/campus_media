# Database Documentation

This document explains the redesigned production-ready MongoDB schemas, relationships, indexes, and unique constraints for the Campus Media social platform foundation.

---

## 📂 Collections Schema Reference

### 1. User
Stores authentication details, profile metadata, academic and professional information, statistics, and settings.
* **Fields**:
  * **Authentication**:
    * `fullname` (String, required)
    * `name` (String, required, legacy compatibility)
    * `username` (String, unique, sparse)
    * `email` (String, unique, required)
    * `password` (String, required)
    * `role` (String, enum: `['USER', 'ADMIN']`, default: `USER`)
    * `status` (String, enum: `['PENDING', 'ACTIVE', 'BLOCKED']`, default: `PENDING`)
    * `isVerified` (Boolean, default: `false`)
  * **Personal Information**:
    * `bio` (String, default: `''`)
    * `profilePicture` (String, default: `''`)
    * `coverPicture` (String, default: `''`)
    * `headline` (String, default: `''`)
    * `location` (String, default: `''`)
  * **Academic Information**:
    * `department` (String)
    * `course` (String)
    * `semester` (String)
    * `year` (String, default: `'1st Year'`)
    * `education` (Array of Objects: `school`, `degree`, `fieldOfStudy`, `startYear`, `endYear`)
  * **Professional Links**:
    * `github` (String)
    * `linkedin` (String)
    * `portfolio` (String)
    * `codingProfiles` (Map of Strings, e.g. `leetcode`, `hackerrank`)
  * **Skills & Certificates**:
    * `skills` (Array of Strings)
    * `programmingLanguages` (Array of Strings)
    * `certificates` (Array of Objects: `title`, `issuer`, `issueDate`, `credentialUrl`, `credentialId`)
  * **Privacy Settings**:
    * `profileVisibility` (String, enum: `['public', 'private']`, default: `'public'`)
    * `hideFollowers` (Boolean, default: `false`)
    * `hideFollowing` (Boolean, default: `false`)
    * `hideAchievements` (Boolean, default: `false`)
    * `hideProjects` (Boolean, default: `false`)
    * `hideResumeScore` (Boolean, default: `false`)
    * `hideInterviewScore` (Boolean, default: `false`)
  * **Notification Settings**:
    * `emailAlerts` (Boolean, default: `true`)
    * `pushAlerts` (Boolean, default: `true`)
  * **Statistics**:
    * `followersCount` (Number, default: `0`)
    * `followingCount` (Number, default: `0`)
    * `connectionCount` (Number, default: `0`)
    * `postsCount` (Number, default: `0`)
    * `achievementCount` (Number, default: `0`)
    * `projectCount` (Number, default: `0`)
  * **Status & Metrics**:
    * `onlineStatus` (String, enum: `['online', 'offline']`, default: `'offline'`)
    * `lastSeen` (Date, default: `Date.now`)
* **Indexes**:
  * `{ email: 1 }` (Unique)
  * `{ username: 1 }` (Unique, Sparse)

### 2. Post
Stores feed entries published by users.
* **Fields**:
  * `userId` (ObjectId, Ref: `User`, required)
  * `caption` (String, default: `''`)
  * `media` (Array of Objects: `url` String, `type` enum `['image', 'video']`, `public_id` String, `fileName` String, `fileSize` Number)
  * `hashtags` (Array of Strings)
  * `mentions` (Array of ObjectIds, Ref: `User`)
  * `visibility` (String, enum: `['public', 'connections', 'private']`, default: `'public'`)
  * `postType` (String, enum: `['text', 'image', 'video', 'project', 'achievement', 'certificate', 'event', 'placement', 'internship', 'resource', 'poll']`, default: `'text'`)
  * `likesCount` (Number, default: `0`)
  * `commentsCount` (Number, default: `0`)
  * `sharesCount` (Number, default: `0`)
  * `savesCount` (Number, default: `0`)
  * `viewsCount` (Number, default: `0`)
  * `reportsCount` (Number, default: `0`)
  * `status` (String, enum: `['active', 'reported', 'suspended']`, default: `'active'`)
* **Indexes**:
  * `{ createdAt: -1 }`
  * `{ userId: 1, createdAt: -1 }`
  * `{ hashtags: 1 }`

### 3. Comment
Stores nested, threaded comments on posts.
* **Fields**:
  * `userId` (ObjectId, Ref: `User`, required)
  * `postId` (ObjectId, Ref: `Post`, required)
  * `text` (String, required)
  * `parentComment` (ObjectId, Ref: `Comment`, default: `null`)
  * `mentions` (Array of ObjectIds, Ref: `User`)
  * `edited` (Boolean, default: `false`)
  * `likes` (Array of ObjectIds, Ref: `User`)
* **Indexes**:
  * `{ postId: 1, createdAt: 1 }`

### 4. Like
Stores post reaction records.
* **Fields**:
  * `userId` (ObjectId, Ref: `User`, required)
  * `postId` (ObjectId, Ref: `Post`, required)
  * `reactionType` (String, enum: `['like', 'heart', 'celebrate', 'insightful', 'funny']`, default: `'like'`)
* **Indexes**:
  * `{ userId: 1, postId: 1 }` (Unique)

### 5. Connection (Consolidated relationship schema)
Tracks peer networking status.
* **Fields**:
  * `requester` (ObjectId, Ref: `User`, required)
  * `recipient` (ObjectId, Ref: `User`, required)
  * `status` (String, enum: `['pending', 'accepted', 'rejected', 'blocked', 'cancelled']`, default: `'pending'`)
  * `mutualConnectionCount` (Number, default: `0`)
* **Indexes**:
  * `{ requester: 1, recipient: 1 }` (Unique)
  * `{ recipient: 1, status: 1 }`

### 6. Conversation
Represents a text/chat thread between multiple participants.
* **Fields**:
  * `participants` (Array of ObjectIds, Ref: `User`, required)
  * `lastMessage` (ObjectId, Ref: `ChatMessage`)
  * `unreadCount` (Map of UserIds to Numbers)
  * `pinned` (Array of ObjectIds, Ref: `User`)
  * `archived` (Array of ObjectIds, Ref: `User`)
  * `mute` (Array of ObjectIds, Ref: `User`)
  * `typingStatus` (Array of ObjectIds, Ref: `User`)
* **Indexes**:
  * `{ participants: 1 }`

### 7. ChatMessage
Logs message logs exchanged inside conversations.
* **Fields**:
  * `conversationId` (ObjectId, Ref: `Conversation`, required)
  * `senderId` (ObjectId, Ref: `User`, required)
  * `receiverId` (ObjectId, Ref: `User`, required)
  * `senderName` (String)
  * `content` (String, required)
  * `messageType` (String, enum: `['text', 'image', 'video', 'file', 'voice']`, default: `'text'`)
  * `seenStatus` (Boolean, default: `false`)
  * `deliveredStatus` (Boolean, default: `false`)
  * `edited` (Boolean, default: `false`)
  * `deleted` (Boolean, default: `false`)
  * `replyTo` (ObjectId, Ref: `ChatMessage`, default: `null`)
  * `reactions` (Array of reaction sub-objects: `userId` ObjectId, `reaction` String)
* **Indexes**:
  * `{ conversationId: 1, createdAt: -1 }`

### 8. Notification
Pushes alerts to students for social interactions.
* **Fields**:
  * `type` (String, enum: `['like', 'comment', 'reply', 'mention', 'follow', 'connection', 'message', 'achievement', 'resource_approval', 'system']`, required)
  * `senderId` (ObjectId, Ref: `User`)
  * `receiverId` (ObjectId, Ref: `User`, required)
  * `targetId` (ObjectId, required)
  * `readStatus` (Boolean, default: `false`)
  * `title` (String, required)
  * `message` (String, required)
* **Indexes**:
  * `{ receiverId: 1, readStatus: 1 }`

### 9. Resource (Upgrades Note.js)
Stores shared academic resource directories.
* **Fields**:
  * `title` (String, required)
  * `description` (String)
  * `category` (String, enum: `['note', 'pyq', 'assignment', 'lab_manual', 'ppt', 'book']`, required)
  * `fileUrl` (String, required)
  * `department` (String)
  * `course` (String)
  * `semester` (String)
  * `subject` (String)
  * `year` (String)
  * `uploaderId` (ObjectId, Ref: `User`, required)
  * `approvalStatus` (String, enum: `['pending', 'approved', 'rejected']`, default: `'pending'`)
  * `downloadsCount` (Number, default: `0`)
  * `bookmarksCount` (Number, default: `0`)
  * `ratings` (Array of rating sub-objects: `userId` ObjectId, `rating` Number)
* **Indexes**:
  * `{ department: 1, subject: 1 }`

### 10. Achievement
Tracks hackathon certificates, internships, publications, and awards.
* **Fields**:
  * `userId` (ObjectId, Ref: `User`, required)
  * `type` (String, enum: `['hackathon', 'competition', 'internship', 'placement', 'certification', 'publication', 'award']`, required)
  * `title` (String, required)
  * `description` (String)
  * `mediaUrl` (String)
  * `isVerified` (Boolean, default: `false`)
* **Indexes**:
  * `{ userId: 1 }`

### 11. Project
Detailed developer capstones built by students.
* **Fields**:
  * `userId` (ObjectId, Ref: `User`, required)
  * `name` (String, required)
  * `description` (String, required)
  * `techStack` (Array of Strings)
  * `githubUrl` (String)
  * `demoUrl` (String)
  * `media` (Array of Strings)
  * `teamMembers` (Array of ObjectIds or Strings)
  * `role` (String)
* **Indexes**:
  * `{ userId: 1 }`

---

## 🔗 Collection Relationships

```text
User
 ├── (1:N) -> Resume (caching resume audits)
 ├── (1:N) -> Post (authoring feed entries)
 ├── (1:N) -> Comment (commenting on feeds)
 ├── (1:N) -> Like (reacting to feeds)
 ├── (1:N) -> Connection (managing follows and friend requests)
 ├── (1:N) -> ChatMessage (exchanging peer messages)
 ├── (1:N) -> Achievement (certifications / Hackathons)
 └── (1:N) -> Project (individual portfolios)
```

---

## ⚡ Cascading Cleanups
To prevent orphan records, database operations run the following triggers:
* **Deleting a User**: Deletes all associated Posts, Comments, Likes, SavedPosts, Resumes, Connections, ChatMessages, and Notifications.
* **Deleting a Post**: Deletes all associated Comments, Likes, and SavedPosts.

---

## 🛠️ API & Migration Impact
* **Endpoints Mapping**: The notes endpoints (`/api/notes`) will call the `Resource` controller internally. No endpoint paths will change.
* **Legacy Follow Collection**: The `Follow` collection is consolidated into the `Connection` collection, mapping statuses appropriately.
