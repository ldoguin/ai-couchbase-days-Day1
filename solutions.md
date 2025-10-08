# Workshop Solutions: Enriching LLM Responses with Conversation History

This file provides the full solutions for each step in the workshop. Use these as reference answers or to check your implementation.

---

## 1. Storing Messages in Couchbase

**File:** `project/backend/services/conversationService.js`

```js
export async function addMessage(sessionId, message, role) {
  const cluster = await initCouchbase();
  const bucket = cluster.bucket(COUCHBASE_BUCKET_NAME);
  const scope = COUCHBASE_CONVERSATION_SCOPE || '_default';
  const collectionName = COUCHBASE_CONVERSATION_COLLECTION || 'conversations';
  const collection = bucket.scope(scope).collection(collectionName);

  const messageDoc = {
    sessionId,
    role, // 'user' or 'assistant'
    content: message,
    timestamp: new Date().toISOString(),
    type: 'chat_message',
  };
  const messageId = `${sessionId}_${Date.now()}_${role}`;
  await collection.insert(messageId, messageDoc);
}
```

---

## 2. Retrieving Conversation History

**File:** `project/backend/services/conversationService.js`

```js
export async function getConversationHistory(sessionId, limit = 10) {
  const cluster = await initCouchbase();
  const bucket = cluster.bucket(COUCHBASE_BUCKET_NAME);
  const scope = COUCHBASE_CONVERSATION_SCOPE || '_default';
  const query = `
    SELECT content, \`role\`, timestamp
    FROM \`${COUCHBASE_BUCKET_NAME}\`.\`${scope}\`.\`${COUCHBASE_CONVERSATION_COLLECTION || 'conversations'}\`
    WHERE sessionId = $sessionId AND type = 'chat_message'
    ORDER BY timestamp DESC
    LIMIT $limit
  `;
  const result = await cluster.query(query, { parameters: { sessionId, limit } });
  const messages = result.rows.map(row => ({
    role: row.role,
    content: row.content,
    timestamp: row.timestamp,
  }));
  messages.reverse(); // Chronological order
  return messages;
}
```

---

## 3. Formatting Conversation History for Prompt

**File:** `project/backend/services/conversationService.js`

```js
export function formatConversationHistory(messages) {
  if (!messages || messages.length === 0) {
    return 'No previous conversation history.';
  }
  return messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');
}
```

---

## 4. Clearing Conversation History

**File:** `project/backend/services/conversationService.js`

```js
export async function clearConversationHistory(sessionId) {
  const cluster = await initCouchbase();
  const bucket = cluster.bucket(COUCHBASE_BUCKET_NAME);
  const scope = COUCHBASE_CONVERSATION_SCOPE || '_default';
  const query = `
    DELETE FROM \`${COUCHBASE_BUCKET_NAME}\`.\`${scope}\`.\`${COUCHBASE_CONVERSATION_COLLECTION || 'conversations'}\`
    WHERE sessionId = $sessionId AND type = 'chat_message'
  `;
  await cluster.query(query, { parameters: { sessionId } });
}
```

---

## 5. Conversation History API Endpoints

**File:** `project/backend/routes/conversation.js`

### Retrieve History
```js
router.get('/history', async (req, res) => {
  const { sessionId, limit } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  try {
    const messages = await getConversationHistory(sessionId, parseInt(limit) || 10);
    res.json({ sessionId, messages, count: messages.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve conversation history' });
  }
});
```

### Clear History
```js
router.delete('/clear', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  try {
    await clearConversationHistory(sessionId);
    res.json({ success: true, message: `Conversation history cleared for session ${sessionId}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear conversation history' });
  }
});
```

---

## 6. Enriching LLM Prompt with Conversation History

**File:** `project/backend/routes/query.js`

```js
router.post('/', async (req, res) => {
  const { q, sessionId } = req.body;
  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'Query is required.' });
  }
  const session = sessionId || 'default-session';
  try {
    await addMessage(session, q, 'user');
    const conversationHistory = await getConversationHistory(session, 10);
    const formattedHistory = formatConversationHistory(conversationHistory);
    const embedding = await getEmbedding(q);
    const documents = await getRelevantDocuments(embedding);
    const documentList = documents.map((doc, index) =>
      `Document ${index + 1}:\nID: ${doc.id}\nFilepath: ${doc.filepath}\nScore: ${doc.score}\nContent: ${JSON.stringify(doc.content)}`
    ).join('\n\n');
    const prompt = `You are a Web MDN Documentation expert with access to the conversation history.\nGiven the user query, conversation history, and the following relevant documents, provide a helpful and accurate answer.\n\nCONVERSATION HISTORY:\n${formattedHistory}\n\nRELEVANT DOCUMENTS:\n${documentList}\n\nCURRENT USER QUERY: ${q}\n\nPlease provide a helpful response based on the documentation pages and conversation context.\nIf the user asks about previous questions or the conversation history, use the conversation history above.\nInclude references to the document IDs and filepaths when relevant.`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    const stream = await getCompletionStream(prompt);
    let fullResponse = '';
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        fullResponse += token;
        res.write(token);
      }
    }
    await addMessage(session, fullResponse, 'assistant');
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    } else {
      res.end();
    }
  }
});
```

---

## Summary
- Use the placeholders in the code files to implement each step yourself.
- Refer to this solutions.md for the exact code and logic for each part of the workshop.
- The key concept: **Enrich LLM responses by including previous conversation history in the prompt.**
