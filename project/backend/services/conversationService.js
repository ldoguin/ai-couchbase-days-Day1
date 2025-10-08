import { connect } from 'couchbase'
import dotenv from 'dotenv'
dotenv.config()

const {
  COUCHBASE_CONNECTION_STRING,
  COUCHBASE_USERNAME,
  COUCHBASE_PASSWORD,
  COUCHBASE_BUCKET_NAME,
  COUCHBASE_CONVERSATION_SCOPE,
  COUCHBASE_CONVERSATION_COLLECTION
} = process.env

let cluster

async function initCouchbase() {
  if (!cluster) {
    cluster = await connect(COUCHBASE_CONNECTION_STRING, {
      username: COUCHBASE_USERNAME,
      password: COUCHBASE_PASSWORD,
      configProfile: 'wanDevelopment',
    })
  }
  return cluster
}

/**
 * Store a message in the conversation history
 * @param {string} sessionId - Unique identifier for the conversation session
 * @param {string} message - The message content
 * @param {string} role - Either 'user' or 'assistant'
 */
// TODO: Implement addMessage to store a message in Couchbase for the given session
export async function addMessage(sessionId, message, role) {
  // --- WORKSHOP PLACEHOLDER ---
  // Mock: Do nothing, just resolve
  return Promise.resolve();
}

/**
 * Retrieve conversation history for a session
 * @param {string} sessionId - Unique identifier for the conversation session
 * @param {number} limit - Maximum number of messages to retrieve (default: 10)
 * @returns {Array} Array of message objects ordered by timestamp
 */
// TODO: Implement getConversationHistory to retrieve messages for a session from Couchbase
export async function getConversationHistory(sessionId, limit = 10) {
  // --- WORKSHOP PLACEHOLDER ---
  // Mock: Return a static conversation history
  return [
    { role: 'user', content: 'What is JavaScript?', timestamp: new Date().toISOString() },
    { role: 'assistant', content: 'JavaScript is a programming language used for web development.', timestamp: new Date().toISOString() }
  ];
}

/**
 * Format conversation history for inclusion in prompt
 * @param {Array} messages - Array of message objects
 * @returns {string} Formatted conversation history
 */
// TODO: Implement formatConversationHistory to format messages for prompt enrichment
export function formatConversationHistory(messages) {
  // --- WORKSHOP PLACEHOLDER ---
  // Mock: Format messages as simple text
  if (!messages || messages.length === 0) {
    return 'No previous conversation history.';
  }
  return messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
}

/**
 * Clear conversation history for a session
 * @param {string} sessionId - Unique identifier for the conversation session
 */
// TODO: Implement clearConversationHistory to delete all messages for a session
export async function clearConversationHistory(sessionId) {
  // --- WORKSHOP PLACEHOLDER ---
  // Mock: Do nothing, just resolve
  return Promise.resolve();
}
