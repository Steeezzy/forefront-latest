import { startV2ExecutionWorkers } from '../jobs/v2_execution_workers.js';

export function startAutomationWorkerProcess() {
  startV2ExecutionWorkers();
}
