import { Button } from "@/components/ui/button";

export function AgentSettings() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Agent Settings</h3>
            <div className="grid gap-2">
                <label className="text-sm font-medium">Model</label>
                <select className="p-2 border rounded">
                    <option>GPT-4</option>
                    <option>Claude 3</option>
                </select>
            </div>
            <Button>Save Settings</Button>
        </div>
    );
}
