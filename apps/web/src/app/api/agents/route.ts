import { NextResponse } from 'next/server';

const mockAgents = [
    { id: '1', name: 'General Assistant', description: 'A helpful AI assistant' },
    { id: '2', name: 'Code Expert', description: 'Specialized in programming tasks' },
];

export async function GET() {
    return NextResponse.json({ agents: mockAgents });
}
