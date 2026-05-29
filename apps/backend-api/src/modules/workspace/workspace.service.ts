import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_WORKSPACE_CONFIG = {
  business_hours: {
    start: '09:00',
    end: '18:00',
  },
  slot_duration: 30,
  auto_confirm: true,
};

const APPOINTMENT_CONFIRMATION_AUTOMATION_KEY = 'appointment_confirmation';

type IndustryTemplateService = {
  name: string;
  duration?: number;
  price?: number;
  metadata?: Record<string, any>;
};

type IndustryTemplate = {
  services: IndustryTemplateService[];
  config: Record<string, any>;
  automations: string[];
};

function asObject(value: any): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value;
}

function normalizeIndustryId(industryId?: string | null): string {
  return String(industryId || '').trim().toLowerCase();
}

function getIndustryTemplatePaths(industryId: string): string[] {
  const fileName = `${industryId}.json`;
  return [
    path.resolve(process.cwd(), 'templates', 'industries', fileName),
    path.resolve(process.cwd(), '..', 'templates', 'industries', fileName),
    path.resolve(__dirname, '../../../../templates/industries', fileName),
  ];
}

async function loadIndustryTemplate(industryId?: string | null): Promise<IndustryTemplate | null> {
  const normalizedIndustry = normalizeIndustryId(industryId);
  if (!normalizedIndustry) {
    return null;
  }

  for (const templatePath of getIndustryTemplatePaths(normalizedIndustry)) {
    try {
      const raw = await fs.readFile(templatePath, 'utf8');
      const parsed = JSON.parse(raw);

      return {
        services: Array.isArray(parsed?.services) ? parsed.services : [],
        config: asObject(parsed?.config),
        automations: Array.isArray(parsed?.automations)
          ? parsed.automations.map((value: any) => String(value))
          : [],
      };
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        continue;
      }
      throw new Error(`Failed to load industry template ${normalizedIndustry}: ${error?.message || error}`);
    }
  }

  return null;
}

export class WorkspaceService {
  private buildWorkspaceConfig(config: any) {
    const input = asObject(config);
    const inputBusinessHours = asObject(input.business_hours);
    const slotDuration = Number(input.slot_duration);

    return {
      ...DEFAULT_WORKSPACE_CONFIG,
      ...input,
      business_hours: {
        ...DEFAULT_WORKSPACE_CONFIG.business_hours,
        ...inputBusinessHours,
      },
      slot_duration: Number.isFinite(slotDuration) && slotDuration > 0
        ? Math.trunc(slotDuration)
        : DEFAULT_WORKSPACE_CONFIG.slot_duration,
      auto_confirm: typeof input.auto_confirm === 'boolean'
        ? input.auto_confirm
        : DEFAULT_WORKSPACE_CONFIG.auto_confirm,
    };
  }

  private normalizeServiceDuration(duration: any): number | null {
    if (duration === null || duration === undefined || duration === '') {
      return null;
    }

    const numericDuration = Number(duration);
    if (!Number.isFinite(numericDuration) || numericDuration <= 0) {
      return null;
    }

    return Math.trunc(numericDuration);
  }

  private normalizeServicePrice(price: any): number | null {
    if (price === null || price === undefined || price === '') {
      return null;
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return null;
    }

    return numericPrice;
  }

  private async mergeWorkspaceConfig(id: string, configPatch: Record<string, any>) {
    const patch = asObject(configPatch);
    if (Object.keys(patch).length === 0) {
      return;
    }

    await pool.query(
      `UPDATE workspaces
       SET config = COALESCE(config, '{}'::jsonb) || $2::jsonb
       WHERE id = $1`,
      [id, JSON.stringify(patch)]
    );
  }

  private async seedIndustryServices(workspaceId: string, services: IndustryTemplateService[]) {
    let createdOrUpdated = 0;

    for (const service of services) {
      const name = String(service?.name || '').trim();
      if (!name) {
        continue;
      }

      const duration = this.normalizeServiceDuration(service.duration);
      const price = this.normalizeServicePrice(service.price);
      const metadata = asObject(service.metadata);

      const existing = await pool.query(
        `SELECT id
         FROM services
         WHERE workspace_id = $1
           AND lower(name) = lower($2)
         LIMIT 1`,
        [workspaceId, name]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE services
           SET duration = COALESCE($2, duration),
               price = COALESCE($3, price),
               metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
               is_active = true
           WHERE id = $1`,
          [existing.rows[0].id, duration, price, JSON.stringify(metadata)]
        );
        createdOrUpdated += 1;
        continue;
      }

      await pool.query(
        `INSERT INTO services (workspace_id, name, duration, price, is_active, metadata)
         VALUES ($1, $2, $3, $4, true, $5::jsonb)`,
        [workspaceId, name, duration, price, JSON.stringify(metadata)]
      );

      createdOrUpdated += 1;
    }

    return createdOrUpdated;
  }

  private async ensureTemplateAutomations(workspaceId: string, automations: string[]) {
    if (!automations.includes(APPOINTMENT_CONFIRMATION_AUTOMATION_KEY)) {
      return 0;
    }

    const existing = await pool.query(
      `SELECT id
       FROM automation_rules
       WHERE workspace_id::text = $1
         AND trigger_type = 'appointment_created'
         AND action_type = 'send_sms'
         AND COALESCE(is_active, true) = true
       LIMIT 1`,
      [workspaceId]
    );

    if (existing.rows.length > 0) {
      return 0;
    }

    await pool.query(
      `INSERT INTO automation_rules (
         workspace_id,
         agent_id,
         trigger_type,
         condition_config,
         conditions,
         action_type,
         action_config
       ) VALUES ($1, NULL, $2, $3, $4, $5, $6)`,
      [
        workspaceId,
        'appointment_created',
        JSON.stringify({}),
        JSON.stringify({}),
        'send_sms',
        JSON.stringify({
          message: 'Your appointment for {{service}} is confirmed on {{date}}.',
          source: 'industry_template',
        }),
      ]
    );

    return 1;
  }

  private async applyIndustryTemplate(workspaceId: string, industryId?: string | null, inlineConfig?: Record<string, any>) {
    const template = await loadIndustryTemplate(industryId);
    const baseConfig = this.buildWorkspaceConfig({
      ...(template?.config || {}),
      ...asObject(inlineConfig),
    });

    await this.mergeWorkspaceConfig(workspaceId, baseConfig);

    if (!template) {
      return {
        templateApplied: false,
        servicesSeeded: 0,
        automationsEnabled: 0,
      };
    }

    const servicesSeeded = await this.seedIndustryServices(workspaceId, template.services || []);
    const automationsEnabled = await this.ensureTemplateAutomations(workspaceId, template.automations || []);

    return {
      templateApplied: true,
      servicesSeeded,
      automationsEnabled,
    };
  }

  async createWorkspace(data: any) {
    const wsId = data.workspaceId || randomUUID();
    const workspaceName = data.name || data.businessName || 'New Workspace';

    let ownerId = data.ownerId;
    if (!ownerId) {
      const ownerResult = await pool.query(
        'SELECT id FROM users ORDER BY created_at ASC LIMIT 1'
      );

      if (!ownerResult.rows.length) {
        throw new Error('No users available to assign as workspace owner');
      }

      ownerId = ownerResult.rows[0].id;
    }

    const res = await pool.query(
      `INSERT INTO workspaces (id, name, owner_id, industry_id, business_name, phone, timezone, language, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        wsId,
        workspaceName,
        ownerId,
        data.industryId,
        data.businessName,
        data.phone,
        data.timezone || 'US/Eastern',
        data.language || 'en-IN',
        data.status || 'created'
      ]
    );

    // After insert, update the config metadata
    await this.updateConfig(wsId, {
      voice_agent_name: data.voiceAgentName,
      greeting: data.greeting,
      after_hours_message: data.afterHoursMessage,
      chatbot_title: data.chatbotTitle,
      chatbot_welcome: data.chatbotWelcome,
      chatbot_personality: data.chatbotPersonality,
      chatbot_temperature: data.chatbotTemperature
    });

    await this.applyIndustryTemplate(wsId, data.industryId, data.config);

    return await this.getWorkspace(wsId);
  }

  async getWorkspace(id: string) {
    const res = await pool.query(`SELECT * FROM workspaces WHERE id = $1`, [id]);
    if (res.rows.length === 0) throw new Error('Workspace not found');
    return res.rows[0];
  }

  async updateConfig(id: string, updates: any) {
    const patch = asObject(updates);
    const keys = Object.keys(patch).filter((k) => patch[k] !== undefined);
    if (keys.length === 0) {
      return await this.getWorkspace(id);
    }

    const columnsResult = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'workspaces'
         AND column_name = ANY($1::text[])`,
      [keys]
    );

    const validColumns = new Set(columnsResult.rows.map((row) => row.column_name));
    const directUpdateKeys = keys.filter((key) => validColumns.has(key) && key !== 'config');

    if (directUpdateKeys.length > 0) {
      const setCalls = directUpdateKeys.map((key, index) => `${key} = $${index + 2}`).join(', ');
      const values = directUpdateKeys.map((key) => patch[key]);

      await pool.query(
        `UPDATE workspaces
         SET ${setCalls}
         WHERE id = $1`,
        [id, ...values]
      );
    }

    await this.mergeWorkspaceConfig(id, patch);

    return await this.getWorkspace(id);
  }
}

export const workspaceService = new WorkspaceService();
