import { pool } from '../../config/db.js';

interface ProvisionBookingAvailabilityInput {
    workspaceId: string;
    agentId: string;
}

function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function buildSlot(date: Date, hour: number, minute: number, durationMinutes: number) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    return {
        slot_date: formatLocalDate(start),
        slot_start: start.toISOString(),
        slot_end: end.toISOString(),
    };
}

export async function provisionStarterAvailability(input: ProvisionBookingAvailabilityInput): Promise<number> {
    if (!input.workspaceId || !input.agentId) {
        return 0;
    }

    const existing = await pool.query(
        `SELECT id
         FROM availability_slots
         WHERE workspace_id = $1 AND agent_id = $2
         LIMIT 1`,
        [input.workspaceId, input.agentId]
    );

    if (existing.rows.length > 0) {
        return 0;
    }

    const slotTemplates = [
        { hour: 10, minute: 0, duration: 45 },
        { hour: 14, minute: 0, duration: 45 },
        { hour: 16, minute: 30, duration: 45 },
    ];

    const slots: Array<{ slot_date: string; slot_start: string; slot_end: string }> = [];
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (slots.length < 15) {
        cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
        const day = cursor.getDay();

        if (day === 0 || day === 6) {
            continue;
        }

        for (const template of slotTemplates) {
            slots.push(buildSlot(cursor, template.hour, template.minute, template.duration));
        }
    }

    for (const slot of slots.slice(0, 15)) {
        await pool.query(
            `INSERT INTO availability_slots (workspace_id, agent_id, slot_date, slot_start, slot_end)
             VALUES ($1, $2, $3, $4, $5)`,
            [input.workspaceId, input.agentId, slot.slot_date, slot.slot_start, slot.slot_end]
        );
    }

    return 15;
}
