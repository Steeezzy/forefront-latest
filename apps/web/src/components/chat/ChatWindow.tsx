export function ChatWindow() {
    return (
        <div className="flex-1 flex flex-col h-full bg-background">
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex justify-start mb-4">
                    <div className="bg-muted p-3 rounded-lg max-w-[80%]">Targeted message content</div>
                </div>
                <div className="flex justify-end mb-4">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[80%]">User message content</div>
                </div>
            </div>
        </div>
    );
}
