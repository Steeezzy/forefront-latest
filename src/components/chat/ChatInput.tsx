import { Button } from "@/components/ui/button";

export function ChatInput() {
    return (
        <div className="p-4 border-t">
            <div className="flex gap-2">
                <input
                    className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Type a message..."
                />
                <Button>Send</Button>
            </div>
        </div>
    );
}
