import os
import json
import subprocess

project_root = "/Users/karthikj/Downloads/forefrontthemeclone"
plugin_root = "/Users/karthikj/Downloads/diagram/understand-anything-plugin"
skill_dir = os.path.join(plugin_root, "skills/understand")

# Load batchImportData
with open(os.path.join(project_root, ".understand-anything/tmp/batchImportData.json"), "r") as f:
    batch_import_data = json.load(f)

# Define target files and metadata
files_metadata = [
    {"path": "forefront-backend/package.json", "language": "json", "sizeLines": 58, "fileCategory": "config"},
    {"path": "forefront-backend/src/app.ts", "language": "typescript", "sizeLines": 379, "fileCategory": "code"},
    {"path": "forefront-backend/src/config/env.ts", "language": "typescript", "sizeLines": 47, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/billing/plans.ts", "language": "typescript", "sizeLines": 163, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/billing/services/StripeService.ts", "language": "typescript", "sizeLines": 400, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/customer/customer.controller.ts", "language": "typescript", "sizeLines": 311, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/customer/customer.routes.ts", "language": "typescript", "sizeLines": 36, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/customer/customer.service.ts", "language": "typescript", "sizeLines": 574, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/flow/flow.routes.ts", "language": "typescript", "sizeLines": 319, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/integrations/integration-events.service.ts", "language": "typescript", "sizeLines": 298, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/invoices/invoice.routes.ts", "language": "typescript", "sizeLines": 127, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/invoices/invoice.service.ts", "language": "typescript", "sizeLines": 188, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/usage/usage.service.ts", "language": "typescript", "sizeLines": 125, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/voice/voice.routes.ts", "language": "typescript", "sizeLines": 247, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/workspace/workspace.controller.ts", "language": "typescript", "sizeLines": 80, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/workspace/workspace.routes.ts", "language": "typescript", "sizeLines": 59, "fileCategory": "code"},
    {"path": "forefront-backend/src/webhooks/email.routes.ts", "language": "typescript", "sizeLines": 250, "fileCategory": "code"},
    {"path": "forefront-backend/src/webhooks/facebook.routes.ts", "language": "typescript", "sizeLines": 238, "fileCategory": "code"},
    {"path": "forefront-backend/src/webhooks/instagram.routes.ts", "language": "typescript", "sizeLines": 238, "fileCategory": "code"},
    {"path": "forefront-backend/src/webhooks/whatsapp.routes.ts", "language": "typescript", "sizeLines": 287, "fileCategory": "code"},
    {"path": "src/middleware.ts", "language": "typescript", "sizeLines": 44, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/agent/managed-agents.routes.ts", "language": "typescript", "sizeLines": 49, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/agent/managed-agents.service.ts", "language": "typescript", "sizeLines": 84, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/vapi/vapi.routes.ts", "language": "typescript", "sizeLines": 684, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/reviews/google-reviews.service.ts", "language": "typescript", "sizeLines": 69, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/reviews/reviews.routes.ts", "language": "typescript", "sizeLines": 47, "fileCategory": "code"},
    {"path": "forefront-backend/src/services/crm/CrmAutomationService.ts", "language": "typescript", "sizeLines": 66, "fileCategory": "code"},
    {"path": "forefront-backend/src/modules/mcp/mcp.routes.ts", "language": "typescript", "sizeLines": 521, "fileCategory": "code"},
    {"path": "forefront-backend/src/scripts/verify-stripe-config.ts", "language": "typescript", "sizeLines": 77, "fileCategory": "code"},
    {"path": "forefront-backend/src/services/vapi.service.ts", "language": "typescript", "sizeLines": 326, "fileCategory": "code"}
]

# Prepare input JSON
input_data = {
    "projectRoot": project_root,
    "batchFiles": files_metadata,
    "batchImportData": batch_import_data
}

input_json_path = os.path.join(project_root, ".understand-anything/tmp/ua-file-analyzer-input-1.json")
with open(input_json_path, "w") as f:
    json.dump(input_data, f, indent=2)

print(f"Prepared input JSON at {input_json_path}")

# Run the extraction script
output_json_path = os.path.join(project_root, ".understand-anything/tmp/ua-file-extract-results-1.json")
extract_script = os.path.join(skill_dir, "extract-structure.mjs")

cmd = ["node", extract_script, input_json_path, output_json_path]
print(f"Running command: {' '.join(cmd)}")

result = subprocess.run(cmd, capture_output=True, text=True)

if result.returncode != 0:
    print("Error running extraction script:")
    print(result.stderr)
else:
    print("Extraction script completed successfully.")
    if os.path.exists(output_json_path) and os.path.getsize(output_json_path) > 0:
        print(f"Output generated successfully at {output_json_path}")
    else:
        print("Error: Output file is empty or missing.")
