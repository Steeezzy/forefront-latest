import { FastifyInstance } from 'fastify';
import { medicineController } from './medicine.controller.js';

export default async function medicineRoutes(app: FastifyInstance) {
    app.post('/create', medicineController.createReminder.bind(medicineController));
    
    // Scoped by workspaceId
    app.get('/:workspaceId/reminders', medicineController.getReminders.bind(medicineController));
    app.get('/:workspaceId/followups', medicineController.getFollowups.bind(medicineController));
    app.get('/:workspaceId/compliance', medicineController.getCompliance.bind(medicineController));
    
    // Scoped by specific interactions
    app.post('/:reminderId/mark-taken', medicineController.markTaken.bind(medicineController));
    app.post('/:reminderId/mark-missed', medicineController.markMissed.bind(medicineController));
    
    app.post('/followups/:followupId/confirm', medicineController.confirmFollowup.bind(medicineController));
}
