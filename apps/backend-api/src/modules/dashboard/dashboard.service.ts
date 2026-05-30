import { pool } from '../../config/db.js';

export class DashboardService {
  async getDashboard(workspaceId: string, period: string = '7d') {
    // A simplified Dashboard aggregator mimicking complex SQL CTEs for the MVP
    
    // 1. Fetch the overarching workspace metrics
    const wsRes = await pool.query(
      `SELECT total_calls, total_chats, appointments_booked, leads_captured, revenue_influenced, cost_savings 
       FROM workspaces WHERE id = $1`,
      [workspaceId]
    );

    const ws = wsRes.rows[0] || {
      total_calls: 0, total_chats: 0, appointments_booked: 0, 
      leads_captured: 0, revenue_influenced: 0, cost_savings: 0
    };

    // 2. Fetch Manual entries
    const manualRes = await pool.query(
      `SELECT COUNT(*) as count, SUM(revenue) as revenue
       FROM manual_entries WHERE workspace_id = $1`,
      [workspaceId]
    );
    const manual = manualRes.rows[0];

    const totalInteractions = parseInt(ws.total_calls) + parseInt(ws.total_chats) + parseInt(manual.count || 0);
    const onlineInteractions = parseInt(ws.total_calls) + parseInt(ws.total_chats);
    const offlineInteractions = parseInt(manual.count || 0);

    const totalRevenue = parseFloat(ws.revenue_influenced) + parseFloat(manual.revenue || 0);

    // AI resolution rate mock logic
    const aiResolutionRate = onlineInteractions > 0 ? 85 : 0; 
    
    return {
      period,
      summary: {
        totalInteractions,
        onlineInteractions,
        offlineInteractions,
        aiResolutionRate,
        satisfactionScore: 4.8
      },
      revenue: {
        totalRevenue,
        fromOnline: parseFloat(ws.revenue_influenced),
        fromOffline: parseFloat(manual.revenue || 0)
      },
      profit: {
        grossRevenue: totalRevenue,
        aiCost: totalInteractions * 0.15, // Mock 15c per interaction cost
        humanCostReplaced: parseFloat(ws.cost_savings) || (totalInteractions * 4.50), // Mock $4.50 replacing human contact
        savings: (parseFloat(ws.cost_savings) || (totalInteractions * 4.50)) - (totalInteractions * 0.15),
        roiPercentage: totalRevenue > 0 ? Math.round(((totalRevenue - (totalInteractions * 0.15)) / (totalInteractions * 0.15)) * 100) : 0
      },
      calls: {
        total: parseInt(ws.total_calls),
        booked: parseInt(ws.appointments_booked),
        answered: Math.round(parseInt(ws.total_calls) * 0.9),
        missed: Math.round(parseInt(ws.total_calls) * 0.1),
        transferred: 0
      },
      chats: {
        total: parseInt(ws.total_chats),
        leadsCaptured: parseInt(ws.leads_captured)
      },
      charts: {
        dailyVolume: [],
        hourlyDistribution: [],
        outcomes: [],
        topIntents: []
      }
    };
  }
}

export const dashboardService = new DashboardService();
