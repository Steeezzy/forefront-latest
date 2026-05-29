import os
import re
import json

project_root = "/Users/karthikj/Downloads/forefrontthemeclone"
scan_result_path = os.path.join(project_root, ".understand-anything/intermediate/scan-result.json")

# Load existing scan-result to get file inventory and initial import map
with open(scan_result_path, "r") as f:
    scan_data = json.load(f)

files_inventory = {f["path"] for f in scan_data.get("files", [])}
existing_import_map = scan_data.get("importMap", {})

target_files = [
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
]

# Patterns for extracting imports from TypeScript/JavaScript files
import_patterns = [
    re.compile(r'(?:import|export)\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]'),
    re.compile(r'import\s+[\'"]([^\'"]+)[\'"]'),
    re.compile(r'require\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)')
]

batch_import_data = {}

# Also add target files themselves to files inventory if not already present
for tf in target_files:
    files_inventory.add(tf)

for file_path in target_files:
    abs_path = os.path.join(project_root, file_path)
    if not os.path.exists(abs_path):
        print(f"Warning: File {file_path} does not exist on disk.")
        batch_import_data[file_path] = []
        continue

    # Initialize with existing imports or empty list
    imports = set(existing_import_map.get(file_path, []))

    if file_path.endswith((".ts", ".tsx", ".js", ".jsx", ".mjs")):
        try:
            with open(abs_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Find all import matches
            for pattern in import_patterns:
                for match in pattern.finditer(content):
                    imp_path = match.group(1)
                    
                    # We only care about internal imports (relative paths)
                    if imp_path.startswith("."):
                        # Get folder containing the file
                        dir_name = os.path.dirname(file_path)
                        # Resolve relative path
                        resolved = os.path.normpath(os.path.join(dir_name, imp_path))
                        
                        # In NodeNext, we might import config/db.js but the file is config/db.ts
                        # Let us check and canonicalize extensions
                        resolved_ts = resolved
                        if resolved.endswith(".js"):
                            resolved_ts = resolved[:-3] + ".ts"
                        elif resolved.endswith(".jsx"):
                            resolved_ts = resolved[:-4] + ".tsx"

                        # Try several extension fallbacks
                        candidates = [resolved, resolved_ts]
                        if not os.path.splitext(resolved)[1]:
                            candidates.extend([
                                resolved + ".ts",
                                resolved + ".tsx",
                                resolved + ".js",
                                resolved + "/index.ts",
                                resolved + "/index.js"
                            ])

                        # Check which candidate is in files_inventory or exists on disk
                        matched_path = None
                        for cand in candidates:
                            # Normalize path separators
                            cand_norm = cand.replace("\\", "/")
                            if cand_norm in files_inventory or os.path.exists(os.path.join(project_root, cand_norm)):
                                matched_path = cand_norm
                                break
                        
                        if matched_path:
                            imports.add(matched_path)
                        else:
                            # Even if not found on disk/inventory, if it is relative, add resolved path
                            imports.add(resolved.replace("\\", "/"))
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    batch_import_data[file_path] = sorted(list(imports))

# Save output
output_path = os.path.join(project_root, ".understand-anything/tmp/batchImportData.json")
with open(output_path, "w") as f:
    json.dump(batch_import_data, f, indent=2)

print(f"Successfully resolved imports for {len(target_files)} files. Saved to {output_path}")
