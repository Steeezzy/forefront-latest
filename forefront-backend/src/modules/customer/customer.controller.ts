import { FastifyRequest, FastifyReply } from 'fastify';
import { customerService } from './customer.service.js';

export class CustomerController {
  /**
   * List customers with filters
   * GET /api/customers/:workspaceId
   */
  async listCustomers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const filters = request.query as any;

      const result = await customerService.listCustomers(workspaceId, filters);
      return reply.send(result);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * Get a single customer profile
   * GET /api/customers/:workspaceId/:profileId
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { profileId } = request.params as { profileId: string };

      const profile = await customerService.getProfile(profileId);
      const recentInteractions = await customerService.getHistory(profileId, 10);

      return reply.send({
        profile,
        recentInteractions,
        aiNotes: profile.ai_notes
      });
    } catch (error: any) {
      request.log.error(error);
      if (error.message.includes('not found')) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * Get customer interaction history
   * GET /api/customers/:workspaceId/:profileId/history
   */
  async getHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { profileId } = request.params as { profileId: string };
      const { limit } = request.query as { limit?: string };

      const interactions = await customerService.getHistory(
        profileId,
        limit ? parseInt(limit) : 50
      );

      const timeline = await customerService.getCustomerTimeline(profileId);

      return reply.send({
        interactions,
        timeline
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * Sync a customer interaction
   * POST /api/customers/:workspaceId/sync
   */
  async syncInteraction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const {
        phone,
        name,
        email,
        channel,
        transcript,
        outcome,
        revenue
      } = request.body as {
        phone: string;
        name?: string;
        email?: string;
        channel: string;
        transcript?: string;
        outcome?: string;
        revenue?: number;
      };

      // Validate required fields
      if (!phone || !channel) {
        return reply.status(400).send({
          error: 'Missing required fields: phone and channel are required'
        });
      }

      // Find or create customer profile
      const profile = await customerService.findOrCreateProfile(
        workspaceId,
        phone,
        name,
        email
      );

      // Log the interaction
      const interaction = await customerService.logInteraction(
        workspaceId,
        profile.id,
        {
          channel,
          raw_transcript: transcript,
          outcome,
          revenue
        }
      );

      // Analyze the interaction with Claude
      let analysis = null;
      try {
        analysis = await customerService.analyzeInteraction(
          profile.id,
          interaction.id
        );
      } catch (analysisError: any) {
        request.log.warn({ err: analysisError }, 'Failed to analyze interaction');
        // Continue even if analysis fails
      }

      // Get updated profile
      const updatedProfile = await customerService.getProfile(profile.id);

      return reply.send({
        profile: updatedProfile,
        interaction,
        analysis,
        nextAction: updatedProfile.next_action
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * Update customer notes
   * PUT /api/customers/:workspaceId/:profileId/notes
   */
  async updateNotes(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { profileId } = request.params as { profileId: string };
      const { notes } = request.body as { notes: string };

      const updated = await customerService.updateNotes(profileId, notes);

      return reply.send({ updated: true, profile: updated });
    } catch (error: any) {
      request.log.error(error);
      if (error.message.includes('not found')) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * Create a customer action
   * POST /api/customers/:workspaceId/:profileId/action
   */
  async createAction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId, profileId } = request.params as {
        workspaceId: string;
        profileId: string;
      };
      const { actionType, actionDetail, scheduledDate } = request.body as {
        actionType: string;
        actionDetail: string;
        scheduledDate?: string;
      };

      if (!actionType || !actionDetail) {
        return reply.status(400).send({
          error: 'Missing required fields: actionType and actionDetail are required'
        });
      }

      const action = await customerService.createAction(
        workspaceId,
        profileId,
        actionType,
        actionDetail,
        scheduledDate
      );

      return reply.send({
        actionId: action.id,
        status: action.status
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * Get risky customers
   * GET /api/customers/:workspaceId/risky
   */
  async getRiskyCustomers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { limit } = request.query as { limit?: string };

      const customers = await customerService.getRiskyCustomers(
        workspaceId,
        limit ? parseInt(limit) : 20
      );

      return reply.send({ customers });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }

  /**
   * Get upcoming actions
   * GET /api/customers/:workspaceId/upcoming-actions
   */
  async getUpcomingActions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { days } = request.query as { days?: string };

      const actions = await customerService.getUpcomingActions(
        workspaceId,
        days ? parseInt(days) : 7
      );

      return reply.send({ actions });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }
}

export const customerController = new CustomerController();
