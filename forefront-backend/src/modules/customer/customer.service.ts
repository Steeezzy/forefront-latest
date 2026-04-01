import { pool } from '../../config/db.js';
import { claudeService } from '../../services/claude.service.js';

export class CustomerService {
  /**
   * Find or create a customer profile by phone and workspace
   */
  async findOrCreateProfile(workspaceId: string, phone: string, name?: string, email?: string) {
    // Try to find existing profile
    const existing = await pool.query(
      `SELECT * FROM customer_profiles
       WHERE workspace_id = $1 AND phone = $2
       LIMIT 1`,
      [workspaceId, phone]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Create new profile
    const result = await pool.query(
      `INSERT INTO customer_profiles
       (workspace_id, phone, name, email, language, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [workspaceId, phone, name || null, email || null, 'en-IN']
    );

    return result.rows[0];
  }

  /**
   * Log an interaction with a customer
   */
  async logInteraction(
    workspaceId: string,
    profileId: string,
    interactionData: {
      channel: string;
      summary?: string;
      sentiment?: string;
      outcome?: string;
      revenue?: number;
      raw_transcript?: string;
    }
  ) {
    const result = await pool.query(
      `INSERT INTO interaction_logs
       (workspace_id, customer_profile_id, channel, summary, sentiment, outcome, revenue, raw_transcript, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        workspaceId,
        profileId,
        interactionData.channel,
        interactionData.summary || null,
        interactionData.sentiment || 'neutral',
        interactionData.outcome || null,
        interactionData.revenue || 0,
        interactionData.raw_transcript || null
      ]
    );

    // Update profile stats
    await pool.query(
      `UPDATE customer_profiles
       SET total_interactions = total_interactions + 1,
           last_interaction = NOW(),
           lifetime_value = lifetime_value + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [interactionData.revenue || 0, profileId]
    );

    return result.rows[0];
  }

  /**
   * Analyze an interaction using Claude AI
   */
  async analyzeInteraction(profileId: string, interactionId: string) {
    // Get customer profile
    const profileResult = await pool.query(
      `SELECT * FROM customer_profiles WHERE id = $1`,
      [profileId]
    );

    if (profileResult.rows.length === 0) {
      throw new Error('Customer profile not found');
    }

    const profile = profileResult.rows[0];

    // Get recent interactions (last 10)
    const historyResult = await pool.query(
      `SELECT * FROM interaction_logs
       WHERE customer_profile_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [profileId]
    );

    // Get current interaction
    const currentResult = await pool.query(
      `SELECT * FROM interaction_logs WHERE id = $1`,
      [interactionId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Interaction not found');
    }

    const currentInteraction = currentResult.rows[0];

    // Build context for Claude
    const context = {
      customer: {
        name: profile.name,
        phone: profile.phone,
        total_interactions: profile.total_interactions,
        lifetime_value: profile.lifetime_value,
        preferences: profile.preferences,
        sentiment_trend: profile.sentiment_trend,
        ai_notes: profile.ai_notes,
        risk_score: profile.risk_score
      },
      history: historyResult.rows.map(h => ({
        date: h.created_at,
        channel: h.channel,
        summary: h.summary,
        sentiment: h.sentiment,
        outcome: h.outcome
      })),
      current: {
        channel: currentInteraction.channel,
        transcript: currentInteraction.raw_transcript,
        outcome: currentInteraction.outcome
      }
    };

    // Call Claude for analysis
    const prompt = `Analyze this customer interaction and provide insights in JSON format.

Customer Context:
${JSON.stringify(context, null, 2)}

Please analyze and return ONLY valid JSON with this structure:
{
  "summary": "2-line summary of the interaction",
  "sentiment": "positive|neutral|negative",
  "preferences_detected": {"key": "value pairs of any preferences"},
  "risk_score": 0-100,
  "next_action": "follow_up|win_back|review|none",
  "next_action_date": "YYYY-MM-DD or null",
  "tags_to_add": ["array", "of", "tags"],
  "notes_update": "Additional notes to append"
}`;

    try {
      const response = await claudeService.generateResponse(
        profile.workspace_id,
        prompt,
        [],
        { business_name: 'Customer Analysis', voice_agent_name: 'Analyst' }
      );

      // Parse Claude's response
      let analysis;
      try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback if Claude doesn't return valid JSON
        analysis = {
          summary: 'Analysis completed',
          sentiment: 'neutral',
          preferences_detected: {},
          risk_score: 0,
          next_action: 'none',
          next_action_date: null,
          tags_to_add: [],
          notes_update: ''
        };
      }

      // Update interaction with analysis
      await pool.query(
        `UPDATE interaction_logs
         SET ai_analysis = $1, summary = $2, sentiment = $3
         WHERE id = $4`,
        [analysis, analysis.summary, analysis.sentiment, interactionId]
      );

      // Update customer profile with insights
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (analysis.risk_score !== undefined) {
        updates.push(`risk_score = $${paramIndex++}`);
        values.push(analysis.risk_score);
      }

      if (analysis.next_action && analysis.next_action !== 'none') {
        updates.push(`next_action = $${paramIndex++}`);
        values.push(analysis.next_action);
      }

      if (analysis.next_action_date) {
        updates.push(`next_action_date = $${paramIndex++}`);
        values.push(analysis.next_action_date);
      }

      if (analysis.notes_update) {
        updates.push(`ai_notes = COALESCE(ai_notes, '') || $${paramIndex++}`);
        values.push('\n' + analysis.notes_update);
      }

      if (Object.keys(analysis.preferences_detected || {}).length > 0) {
        updates.push(`preferences = preferences || $${paramIndex++}::jsonb`);
        values.push(JSON.stringify(analysis.preferences_detected));
      }

      if (analysis.tags_to_add && analysis.tags_to_add.length > 0) {
        const currentTags = profile.tags || [];
        const newTags = [...new Set([...currentTags, ...analysis.tags_to_add])];
        updates.push(`tags = $${paramIndex++}::jsonb`);
        values.push(JSON.stringify(newTags));
      }

      // Add sentiment to trend
      const sentimentTrend = profile.sentiment_trend || [];
      sentimentTrend.push({
        date: new Date().toISOString(),
        sentiment: analysis.sentiment
      });
      updates.push(`sentiment_trend = $${paramIndex++}::jsonb`);
      values.push(JSON.stringify(sentimentTrend.slice(-20))); // Keep last 20

      updates.push(`updated_at = NOW()`);

      if (updates.length > 0) {
        values.push(profileId);
        await pool.query(
          `UPDATE customer_profiles
           SET ${updates.join(', ')}
           WHERE id = $${paramIndex}`,
          values
        );
      }

      return analysis;
    } catch (error: any) {
      console.error('Error analyzing interaction:', error);
      throw error;
    }
  }

  /**
   * Get customer timeline (interactions + actions)
   */
  async getCustomerTimeline(profileId: string) {
    const interactions = await pool.query(
      `SELECT * FROM interaction_logs
       WHERE customer_profile_id = $1
       ORDER BY created_at DESC`,
      [profileId]
    );

    const actions = await pool.query(
      `SELECT * FROM ai_actions_log
       WHERE customer_profile_id = $1
       ORDER BY created_at DESC`,
      [profileId]
    );

    // Merge and sort by date
    const timeline = [
      ...interactions.rows.map(i => ({ ...i, type: 'interaction' })),
      ...actions.rows.map(a => ({ ...a, type: 'action' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return timeline;
  }

  /**
   * Get risky customers for a workspace
   */
  async getRiskyCustomers(workspaceId: string, limit: number = 20) {
    const result = await pool.query(
      `SELECT cp.*,
              il.summary as last_interaction_summary,
              il.created_at as last_interaction_date
       FROM customer_profiles cp
       LEFT JOIN LATERAL (
         SELECT summary, created_at
         FROM interaction_logs
         WHERE customer_profile_id = cp.id
         ORDER BY created_at DESC
         LIMIT 1
       ) il ON true
       WHERE cp.workspace_id = $1 AND cp.risk_score > 60
       ORDER BY cp.risk_score DESC
       LIMIT $2`,
      [workspaceId, limit]
    );

    return result.rows;
  }

  /**
   * Get upcoming actions for a workspace
   */
  async getUpcomingActions(workspaceId: string, days: number = 7) {
    const result = await pool.query(
      `SELECT cp.*, cp.next_action, cp.next_action_date
       FROM customer_profiles cp
       WHERE cp.workspace_id = $1
         AND cp.next_action IS NOT NULL
         AND cp.next_action_date IS NOT NULL
         AND cp.next_action_date <= NOW() + INTERVAL '${days} days'
       ORDER BY cp.next_action_date ASC`,
      [workspaceId]
    );

    // Group by date
    const grouped: { [key: string]: any[] } = {};
    result.rows.forEach(row => {
      const date = new Date(row.next_action_date).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(row);
    });

    return grouped;
  }

  /**
   * List customers with search and filters
   */
  async listCustomers(
    workspaceId: string,
    filters: {
      search?: string;
      sentiment?: string;
      riskMin?: number;
      riskMax?: number;
      tag?: string;
      nextAction?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions = ['workspace_id = $1'];
    let params: any[] = [workspaceId];
    let paramIndex = 2;

    if (filters.search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.riskMin !== undefined) {
      whereConditions.push(`risk_score >= $${paramIndex}`);
      params.push(filters.riskMin);
      paramIndex++;
    }

    if (filters.riskMax !== undefined) {
      whereConditions.push(`risk_score <= $${paramIndex}`);
      params.push(filters.riskMax);
      paramIndex++;
    }

    if (filters.tag) {
      whereConditions.push(`tags @> $${paramIndex}::jsonb`);
      params.push(JSON.stringify([filters.tag]));
      paramIndex++;
    }

    if (filters.nextAction) {
      whereConditions.push(`next_action = $${paramIndex}`);
      params.push(filters.nextAction);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM customer_profiles WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get customers
    const result = await pool.query(
      `SELECT * FROM customer_profiles
       WHERE ${whereClause}
       ORDER BY last_interaction DESC NULLS LAST
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      customers: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get a single customer profile by ID
   */
  async getProfile(profileId: string) {
    const result = await pool.query(
      `SELECT * FROM customer_profiles WHERE id = $1`,
      [profileId]
    );

    if (result.rows.length === 0) {
      throw new Error('Customer profile not found');
    }

    return result.rows[0];
  }

  /**
   * Update customer notes
   */
  async updateNotes(profileId: string, notes: string) {
    const result = await pool.query(
      `UPDATE customer_profiles
       SET ai_notes = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [notes, profileId]
    );

    if (result.rows.length === 0) {
      throw new Error('Customer profile not found');
    }

    return result.rows[0];
  }

  /**
   * Create an AI action
   */
  async createAction(
    workspaceId: string,
    profileId: string,
    actionType: string,
    actionDetail: string,
    scheduledDate?: string
  ) {
    const result = await pool.query(
      `INSERT INTO ai_actions_log
       (workspace_id, customer_profile_id, action_type, action_detail, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW())
       RETURNING *`,
      [workspaceId, profileId, actionType, actionDetail]
    );

    // Update customer's next action if scheduled
    if (scheduledDate) {
      await pool.query(
        `UPDATE customer_profiles
         SET next_action = $1, next_action_date = $2, updated_at = NOW()
         WHERE id = $3`,
        [actionType, scheduledDate, profileId]
      );
    }

    return result.rows[0];
  }

  /**
   * Get customer history (recent interactions)
   */
  async getHistory(profileId: string, limit: number = 50) {
    const result = await pool.query(
      `SELECT * FROM interaction_logs
       WHERE customer_profile_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [profileId, limit]
    );

    return result.rows;
  }
}

export const customerService = new CustomerService();
