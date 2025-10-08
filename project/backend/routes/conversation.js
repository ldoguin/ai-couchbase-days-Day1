import { Router } from 'express'
import { 
  getConversationHistory, 
  clearConversationHistory 
} from '../services/conversationService.js'

const router = Router()

/**
 * GET /api/conversation/history
 * Retrieve conversation history for a session
 */
// --- WORKSHOP PLACEHOLDER ---
// Implement GET /api/conversation/history to retrieve conversation history for a session
router.get('/history', async (req, res) => {
  // Mock implementation: return static conversation history
  const { sessionId, limit } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  const messages = await getConversationHistory(sessionId, parseInt(limit) || 10);
  res.json({ sessionId, messages, count: messages.length });
});

/**
 * DELETE /api/conversation/clear
 * Clear conversation history for a session
 */
// --- WORKSHOP PLACEHOLDER ---
// Implement DELETE /api/conversation/clear to clear conversation history for a session
router.delete('/clear', async (req, res) => {
  // Mock implementation: always succeed
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  await clearConversationHistory(sessionId);
  res.json({ success: true, message: `Conversation history cleared for session ${sessionId}` });
});

export default router
