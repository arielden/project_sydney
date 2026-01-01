import pool from '../config/database';
import { PoolClient } from 'pg';

export interface QuizSession {
  id: string;
  user_id: string;
  session_type: 'practice' | 'diagnostic' | 'timed' | 'quick-test';
  start_time: Date;
  end_time?: Date;
  is_paused: boolean;
  paused_at?: Date;
  resumed_at?: Date;
  total_pause_duration: number; // seconds
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  total_time_spent?: number; // seconds
  created_at: Date;
}

export interface CreateSessionData {
  userId: string;
  sessionType: 'practice' | 'diagnostic' | 'timed' | 'quick-test';
}

class QuizSessionModel {
  /**
   * Create a new quiz session
   */
  static async createSession(data: CreateSessionData): Promise<QuizSession> {
    const { userId, sessionType } = data;
    
    const insertQuery = `
      INSERT INTO quiz_sessions (user_id, session_type, start_time, is_paused, status)
      VALUES ($1, $2, NOW(), false, 'active')
    `;
    
    try {
      await pool.query(insertQuery, [userId, sessionType]);
      
      // Get the inserted session
      const selectQuery = `
        SELECT * FROM quiz_sessions 
        WHERE user_id = $1 AND session_type = $2 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const result = await pool.query(selectQuery, [userId, sessionType]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating quiz session:', error);
      throw new Error('Failed to create quiz session');
    }
  }

  /**
   * Get session details by ID
   */
  static async getSession(sessionId: string): Promise<QuizSession | null> {
    const query = `
      SELECT * FROM quiz_sessions 
      WHERE id = $1
    `;
    
    try {
      const result = await pool.query(query, [sessionId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching quiz session:', error);
      throw new Error('Failed to fetch quiz session');
    }
  }

  /**
   * Pause a quiz session
   */
  static async pauseSession(sessionId: string): Promise<QuizSession> {
    const query = `
      UPDATE quiz_sessions 
      SET is_paused = true, paused_at = NOW(), status = 'paused'
      WHERE id = $1 AND status = 'active'
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [sessionId]);
      if (result.rows.length === 0) {
        throw new Error('Session not found or not active');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error pausing quiz session:', error);
      throw new Error('Failed to pause quiz session');
    }
  }

  /**
   * Resume a paused quiz session
   */
  static async resumeSession(sessionId: string): Promise<QuizSession> {
    const client: PoolClient = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current session data
      const sessionQuery = 'SELECT * FROM quiz_sessions WHERE id = $1';
      const sessionResult = await client.query(sessionQuery, [sessionId]);
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found');
      }
      
      const session = sessionResult.rows[0];
      
      if (!session.is_paused) {
        throw new Error('Session is not paused');
      }
      
      // Calculate pause duration
      const pauseStart = new Date(session.paused_at);
      const now = new Date();
      const pauseDurationSeconds = Math.floor((now.getTime() - pauseStart.getTime()) / 1000);
      
      // Update session
      const updateQuery = `
        UPDATE quiz_sessions 
        SET is_paused = false, 
            resumed_at = NOW(),
            status = 'active',
            total_pause_duration = total_pause_duration + $1
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [pauseDurationSeconds, sessionId]);
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error resuming quiz session:', error);
      throw new Error('Failed to resume quiz session');
    } finally {
      client.release();
    }
  }

  /**
   * Complete a quiz session
   */
  static async completeSession(sessionId: string): Promise<QuizSession> {
    const client: PoolClient = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current session
      const sessionQuery = 'SELECT * FROM quiz_sessions WHERE id = $1';
      const sessionResult = await client.query(sessionQuery, [sessionId]);
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found');
      }
      
      const session = sessionResult.rows[0];
      
      // Check if already completed
      if (session.status === 'completed') {
        await client.query('COMMIT');
        return session;
      }
      
      let totalPauseDuration = session.total_pause_duration;
      
      // If session is currently paused, add final pause duration
      if (session.is_paused && session.paused_at) {
        const pauseStart = new Date(session.paused_at);
        const now = new Date();
        const finalPauseDuration = Math.floor((now.getTime() - pauseStart.getTime()) / 1000);
        totalPauseDuration += finalPauseDuration;
      }
      
      // Update session as completed
      const updateQuery = `
        UPDATE quiz_sessions 
        SET status = 'completed',
            end_time = NOW(),
            is_paused = false,
            total_pause_duration = $1
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [totalPauseDuration, sessionId]);
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error completing quiz session:', error);
      throw new Error('Failed to complete quiz session');
    } finally {
      client.release();
    }
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserActiveSessions(userId: string): Promise<QuizSession[]> {
    const query = `
      SELECT * FROM quiz_sessions 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching user active sessions:', error);
      throw new Error('Failed to fetch user active sessions');
    }
  }

  /**
   * Calculate total elapsed time for a session (excluding pauses)
   */
  static async getSessionElapsedTime(sessionId: string): Promise<number> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    const startTime = new Date(session.start_time);
    let endTime: Date;
    
    if (session.status === 'completed' && session.end_time) {
      endTime = new Date(session.end_time);
    } else {
      endTime = new Date(); // Current time for active sessions
    }
    
    const totalTimeSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const elapsedTimeSeconds = totalTimeSeconds - session.total_pause_duration;
    
    return Math.max(0, elapsedTimeSeconds);
  }

  /**
   * Abandon a session (mark as abandoned)
   */
  static async abandonSession(sessionId: string): Promise<QuizSession> {
    const query = `
      UPDATE quiz_sessions 
      SET status = 'abandoned', end_time = NOW()
      WHERE id = $1 AND status = 'active'
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [sessionId]);
      if (result.rows.length === 0) {
        throw new Error('Session not found or not active');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error abandoning quiz session:', error);
      throw new Error('Failed to abandon quiz session');
    }
  }
}

export default QuizSessionModel;