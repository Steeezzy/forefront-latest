import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message } = body;

        // Echo back the message for now
        return NextResponse.json({
            role: 'assistant',
            content: `Echo: ${message}`
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
