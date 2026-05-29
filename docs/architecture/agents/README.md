# Agents

Agent taxonomy:
- routing agents: decide next action or handler
- task agents: execute a bounded operation
- memory agents: update and summarize context

Rules:
- workflow-engine owns orchestration of agents.
- ai-runtime executes model calls only.
- agent inputs/outputs must use shared-types contracts.
