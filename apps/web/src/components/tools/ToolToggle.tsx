import { Switch } from "@/components/ui/switch";

export function ToolToggle() {
    // Assuming a Switch component exists or I can use a formatted checkbox
    // I saw switch.tsx in the ls output, so imports should work if casing is correct (usually lowercase 'switch').
    return (
        <div className="flex items-center justify-between p-2 border rounded">
            <span className="font-medium">Enable Tool</span>
            <input type="checkbox" className="toggle" />
        </div>
    );
}
