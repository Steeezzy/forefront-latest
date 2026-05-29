import os
import json

project_root = "/Users/karthikj/Downloads/forefrontthemeclone"
existing_graph_path = os.path.join(project_root, ".understand-anything/knowledge-graph.json")
output_batch_path = os.path.join(project_root, ".understand-anything/intermediate/batch-existing.json")

target_files = {
    "forefront-backend/package.json",
    "forefront-backend/src/app.ts",
    "forefront-backend/src/config/env.ts",
    "forefront-backend/src/modules/billing/plans.ts",
    "forefront-backend/src/modules/billing/services/StripeService.ts",
    "forefront-backend/src/modules/customer/customer.controller.ts",
    "forefront-backend/src/modules/customer/customer.routes.ts",
    "forefront-backend/src/modules/customer/customer.service.ts",
    "forefront-backend/src/modules/flow/flow.routes.ts",
    "forefront-backend/src/modules/integrations/integration-events.service.ts",
    "forefront-backend/src/modules/invoices/invoice.routes.ts",
    "forefront-backend/src/modules/invoices/invoice.service.ts",
    "forefront-backend/src/modules/usage/usage.service.ts",
    "forefront-backend/src/modules/voice/voice.routes.ts",
    "forefront-backend/src/modules/workspace/workspace.controller.ts",
    "forefront-backend/src/modules/workspace/workspace.routes.ts",
    "forefront-backend/src/webhooks/email.routes.ts",
    "forefront-backend/src/webhooks/facebook.routes.ts",
    "forefront-backend/src/webhooks/instagram.routes.ts",
    "forefront-backend/src/webhooks/whatsapp.routes.ts",
    "src/middleware.ts",
    "forefront-backend/src/modules/agent/managed-agents.routes.ts",
    "forefront-backend/src/modules/agent/managed-agents.service.ts",
    "forefront-backend/src/modules/vapi/vapi.routes.ts",
    "forefront-backend/src/modules/reviews/google-reviews.service.ts",
    "forefront-backend/src/modules/reviews/reviews.routes.ts",
    "forefront-backend/src/services/crm/CrmAutomationService.ts",
    "forefront-backend/src/modules/mcp/mcp.routes.ts",
    "forefront-backend/src/scripts/verify-stripe-config.ts",
    "forefront-backend/src/services/vapi.service.ts"
}

# Helper to check if a node ID belongs to any of our target files
def id_matches_target(node_id):
    if not isinstance(node_id, str):
        return False
    # Split by colon
    parts = node_id.split(":")
    if len(parts) >= 2:
        # e.g., file:src/app.ts -> src/app.ts
        # function:src/app.ts:main -> src/app.ts
        path_candidate = parts[1]
        if path_candidate in target_files:
            return True
    return False

if not os.path.exists(existing_graph_path):
    print("Warning: existing knowledge-graph.json does not exist. Creating empty batch-existing.json.")
    with open(output_batch_path, "w") as f:
        json.dump({"nodes": [], "edges": []}, f)
    exit(0)

with open(existing_graph_path, "r") as f:
    graph = json.load(f)

old_nodes = graph.get("nodes", [])
old_edges = graph.get("edges", [])

new_nodes = []
removed_nodes_count = 0

for node in old_nodes:
    node_id = node.get("id")
    file_path = node.get("filePath")
    
    if id_matches_target(node_id) or file_path in target_files:
        removed_nodes_count += 1
    else:
        new_nodes.append(node)

new_edges = []
removed_edges_count = 0

for edge in old_edges:
    src = edge.get("source")
    tgt = edge.get("target")
    
    if id_matches_target(src) or id_matches_target(tgt):
        removed_edges_count += 1
    else:
        new_edges.append(edge)

print(f"Removed {removed_nodes_count} obsolete nodes and {removed_edges_count} obsolete edges.")
print(f"Retained {len(new_nodes)} nodes and {len(new_edges)} edges in batch-existing.json.")

with open(output_batch_path, "w") as f:
    json.dump({"nodes": new_nodes, "edges": new_edges}, f, indent=2)

print("Successfully generated batch-existing.json.")
