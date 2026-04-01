import { pool } from '../config/db.js';
import { claudeService } from '../services/claude.service.js';

/**
 * Memory Agent: Core intelligence for customer relationship management
 * Analyzes interactions and maintains long-term customer memory
 */
export class MemoryAgent {
  /**
   * Analyze a customer interaction and extract insights
   */
  async analyzeInteraction(
    profileId: string,
    interactionId: string,
    options: {
      includeHistory?: boolean;
      maxHistoryItems?: number;
    } = {}
  ) {
    const includeHistory = options.includeHistory !== false;
    const maxHistoryItems = options.maxHistoryItems || 10;

    // Get customer profile
    const profileResult = await pool.query(
      `SELECT * FROM customer_profiles WHERE id = $1`,
      [profileId]
    );

    if (profileResult.rows.length === 0) {
      throw new Error('Customer profile not found');
    }

    const profile = profileResult.rows[0];

    // Get recent interactions if requested
    let history: any[] = [];
    if (includeHistory) {
      const historyResult = await pool.query(
        `SELECT * FROM interaction_logs
         WHERE customer_profile_id = $1 AND id != $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [profileId, interactionId, maxHistoryItems]
      );
      history = historyResult.rows;
    }

    // Get current interaction
    const currentResult = await pool.query(
      `SELECT * FROM interaction_logs WHERE id = $1`,
      [interactionId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Interaction not found');
    }

    const currentInteraction = currentResult.rows[0];

    // Build context for AI analysis
    const context = {
      customer: {
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        total_interactions: profile.total_interactions,
        lifetime_value: parseFloat(profile.lifetime_value || 0),
        preferences: profile.preferences,
        sentiment_trend: profile.sentiment_trend,
        current_notes: profile.ai_notes,
        risk_score: parseFloat(profile.risk_score || 0),
        tags: profile.tags || []
      },
      history: history.map(h => ({
        date: h.created_at,
        channel: h.channel,
        summary: h.summary,
        sentiment: h.sentiment,
        outcome: h.outcome,
        revenue: parseFloat(h.revenue || 0)
      })),
      current: {
        channel: currentInteraction.channel,
        transcript: currentInteraction.raw_transcript || '',
        outcome: currentInteraction.outcome,
        revenue: parseFloat(currentInteraction.revenue || 0)
      }
    };

    // Create analysis prompt
    const prompt = `You are a customer relationship analyst. Analyze this interaction and provide actionable insights.

Customer Context:
- Name: ${context.customer.name || 'Unknown'}
- Phone: ${context.customer.phone}
- Total Interactions: ${context.customer.total_interactions}
- Lifetime Value: $${context.customer.lifetime_value}
- Current Risk Score: ${context.customer.risk_score}/100
- Existing Notes: ${context.customer.current_notes || 'None'}

Previous Interactions (${context.history.length} recent):
${context.history.map((h, i) => `${i + 1}. ${h.date}: ${h.channel} - ${h.summary || 'No summary'} (${h.sentiment})`).join('\n')}

Current Interaction:
- Channel: ${context.current.channel}
- Outcome: ${context.current.outcome || 'Unknown'}
- Revenue: $${context.current.revenue}
- Transcript: ${context.current.transcript || 'No transcript available'}

Analyze this interaction and respond with ONLY a valid JSON object (no markdown, no additional text):
{
  "summary": "2-line summary of what happened in this interaction",
  "sentiment": "positive|neutral|negative",
  "preferences_detected": {"preference_key": "preference_value"},
  "risk_score": 0-100 (likelihood customer will churn or have issues),
  "next_action": "follow_up|win_back|review|upsell|none",
  "next_action_date": "YYYY-MM-DD" or null,
  "tags_to_add": ["tag1", "tag2"],
  "notes_update": "Brief note about this interaction to append to customer record"
}`;

    try {
      const response = await claudeService.generateResponse(
        profile.workspace_id,
        prompt,
        [],
        {
          business_name: 'Memory Agent',
          voice_agent_name: 'Memory AI',
          chatbot_personality: 'analytical and insightful'
        }
      );

      // Parse Claude's response - extract JSON
      let analysis;
      try {
        // Remove markdown code blocks if present
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/```\n?/g, '');
        }

        // Try to find JSON object
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('Failed to parse Claude response, using defaults:', parseError);
        // Fallback analysis
        analysis = {
          summary: currentInteraction.summary || 'Interaction recorded',
          sentiment: currentInteraction.sentiment || 'neutral',
          preferences_detected: {},
          risk_score: profile.risk_score || 0,
          next_action: 'none',
          next_action_date: null,
          tags_to_add: [],
          notes_update: ''
        };
      }

      return analysis;
    } catch (error: any) {
      console.error('Error in memory agent analysis:', error);
      throw error;
    }
  }

  /**
   * Calculate customer risk score based on behavior patterns
   */
  async calculateRiskScore(profileId: string): Promise<number> {
    const profileResult = await pool.query(
      `SELECT * FROM customer_profiles WHERE id = $1`,
      [profileId]
    );

    if (profileResult.rows.length === 0) {
      return 0;
    }

    const profile = profileResult.rows[0];

    // Get recent interactions
    const interactionsResult = await pool.query(
      `SELECT * FROM interaction_logs
       WHERE customer_profile_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [profileId]
    );

    const interactions = interactionsResult.rows;

    let riskScore = 0;

    // Factor 1: Time since last interaction (max 30 points)
    if (profile.last_interaction) {
      const daysSinceLastInteraction = Math.floor(
        (Date.now() - new Date(profile.last_interaction).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastInteraction > 90) riskScore += 30;
      else if (daysSinceLastInteraction > 60) riskScore += 20;
      else if (daysSinceLastInteraction > 30) riskScore += 10;
    } else {
      riskScore += 30; // No interactions at all
    }

    // Factor 2: Sentiment trend (max 30 points)
    const sentimentTrend = profile.sentiment_trend || [];
    const recentNegativeSentiments = sentimentTrend
      .slice(-5)
      .filter((s: any) => s.sentiment === 'negative').length;
    riskScore += recentNegativeSentiments * 6; // 6 points per negative interaction

    // Factor 3: Interaction frequency declining (max 20 points)
    if (interactions.length >= 3) {
      const recent3 = interactions.slice(0, 3);
      const older3 = interactions.slice(3, 6);
      if (older3.length === 3) {
        const recentAvgDays = this.averageDaysBetweenInteractions(recent3);
        const olderAvgDays = this.averageDaysBetweenInteractions(older3);
        if (recentAvgDays > olderAvgDays * 1.5) {
          riskScore += 20;
        } else if (recentAvgDays > olderAvgDays) {
          riskScore += 10;
        }
      }
    }

    // Factor 4: Low lifetime value with high interaction count (max 20 points)
    const lifetimeValue = parseFloat(profile.lifetime_value || 0);
    const totalInteractions = profile.total_interactions || 0;
    if (totalInteractions > 5 && lifetimeValue < 100) {
      riskScore += 20;
    } else if (totalInteractions > 3 && lifetimeValue < 50) {
      riskScore += 10;
    }

    // Cap at 100
    return Math.min(100, Math.max(0, riskScore));
  }

  /**
   * Helper: Calculate average days between interactions
   */
  private averageDaysBetweenInteractions(interactions: any[]): number {
    if (interactions.length < 2) return 0;

    let totalDays = 0;
    for (let i = 0; i < interactions.length - 1; i++) {
      const date1 = new Date(interactions[i].created_at).getTime();
      const date2 = new Date(interactions[i + 1].created_at).getTime();
      totalDays += Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
    }

    return totalDays / (interactions.length - 1);
  }

  /**
   * Recommend next best action for a customer
   */
  async recommendNextAction(profileId: string): Promise<{
    action: string;
    actionDate: string | null;
    reason: string;
  }> {
    const profileResult = await pool.query(
      `SELECT * FROM customer_profiles WHERE id = $1`,
      [profileId]
    );

    if (profileResult.rows.length === 0) {
      throw new Error('Customer profile not found');
    }

    const profile = profileResult.rows[0];
    const riskScore = parseFloat(profile.risk_score || 0);

    // High risk - win back campaign
    if (riskScore > 70) {
      const actionDate = new Date();
      actionDate.setDate(actionDate.getDate() + 1);
      return {
        action: 'win_back',
        actionDate: actionDate.toISOString().split('T')[0],
        reason: 'High risk of churn - immediate outreach recommended'
      };
    }

    // Medium risk - follow up
    if (riskScore > 40) {
      const actionDate = new Date();
      actionDate.setDate(actionDate.getDate() + 3);
      return {
        action: 'follow_up',
        actionDate: actionDate.toISOString().split('T')[0],
        reason: 'Moderate risk - proactive follow-up recommended'
      };
    }

    // Check if it's time for a review request
    const totalInteractions = profile.total_interactions || 0;
    const lifetimeValue = parseFloat(profile.lifetime_value || 0);
    if (totalInteractions >= 3 && lifetimeValue > 100) {
      const actionDate = new Date();
      actionDate.setDate(actionDate.getDate() + 7);
      return {
        action: 'review',
        actionDate: actionDate.toISOString().split('T')[0],
        reason: 'Satisfied customer - good candidate for review request'
      };
    }

    // No action needed
    return {
      action: 'none',
      actionDate: null,
      reason: 'Customer engagement is healthy'
    };
  }
}

export const memoryAgent = new MemoryAgent();
