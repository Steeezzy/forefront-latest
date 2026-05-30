export function ChatList() {
    return (
        <div className="p-4 border-r h-full">
            <h2 className="font-semibold mb-4">Chats</h2>
            <div className="space-y-2">
                <div className="p-2 bg-accent rounded">New Chat</div>
                <div className="p-2 hover:bg-accent rounded">Previous Chat</div>
            </div>
        </div>
    );
}
