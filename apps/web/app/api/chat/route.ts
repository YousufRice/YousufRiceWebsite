import { NextResponse } from 'next/server';
import { streamText, generateText, ModelMessage, stepCountIs } from 'ai';
import { yousufRiceModel, yousufRiceSystemPrompt, yousufRiceTools } from '@/lib/agents/yousufRiceAgent';
import { Client, Account } from 'appwrite';
import { serverSessionManager } from '@/lib/server-session-manager';

interface ChatRequest {
  userId: string;
  message: string;
  stream?: boolean;
  sessionId?: string; // Server-managed session ID
  userContext?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

/**
 * POST /api/chat
 * Main chat endpoint using Vercel AI SDK
 * Handles both streaming and non-streaming responses
 */
export async function POST(req: Request) {
  try {
    const { message, stream, sessionId: existingSessionId, userContext } = (await req.json()) as ChatRequest;

    // Initialize Appwrite client for this request
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    // Get JWT from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Set JWT on client
    client.setJWT(token);
    const account = new Account(client);

    let userId: string;
    try {
      const user = await account.get();
      userId = user.$id;
      // console.log('[API] User authenticated:', userId);
    } catch (error: any) {
      console.error('[API] Auth failed:', error.message);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Validate required message field
    if (!message) {
      return NextResponse.json(
        { error: 'Missing required fields: message is required' },
        { status: 400 }
      );
    }

    // Build context-aware message if user data is available
    let contextualMessage = message;
    if (userContext && (userContext.name || userContext.email || userContext.phone)) {
      const contextParts: string[] = [];
      if (userContext.name) contextParts.push(`Customer Name: ${userContext.name}`);
      if (userContext.email) contextParts.push(`Email: ${userContext.email}`);
      if (userContext.phone) contextParts.push(`Phone: ${userContext.phone}`);

      // Prepend context only on first message or when creating orders
      const needsContext = !existingSessionId ||
        message.toLowerCase().includes('order') ||
        message.toLowerCase().includes('buy') ||
        message.toLowerCase().includes('purchase');

      if (needsContext && contextParts.length > 0) {
        contextualMessage = `[User Context: ${contextParts.join(', ')}]\n\n${message}`;
      }
    }

    // Use the authenticated userId for session management
    console.log(`Authenticated user: ${userId}`);

    // Get or create server-managed session
    let sessionData;
    if (existingSessionId) {
      // Try to get existing session
      const existingSession = serverSessionManager.getSession(existingSessionId);
      if (!existingSession) {
        // Session expired or doesn't exist, create new one
        console.log(`Session ${existingSessionId} not found or expired, creating new session for user ${userId}`);
        sessionData = await serverSessionManager.getOrCreateSession(userId);
      } else {
        sessionData = existingSession;
      }
    } else {
      // Create new session
      sessionData = await serverSessionManager.getOrCreateSession(userId);
    }

    const { sessionId, messages } = sessionData;

    // Append new user message to conversation history
    const newMessages: ModelMessage[] = [
      ...messages,
      { role: 'user', content: contextualMessage }
    ];

    // Determine if we should stream
    const shouldStream = stream ?? true;

    if (shouldStream) {
      // Run the agent with streaming enabled
      const result = streamText({
        model: yousufRiceModel,
        system: yousufRiceSystemPrompt,
        messages: newMessages,
        tools: yousufRiceTools,
        stopWhen: stepCountIs(5),
        onFinish: ({ response }) => {
          // Save the conversation to session memory when the stream completes
          const session = serverSessionManager.getSession(sessionId);
          if (session) {
            // Re-fetch session messages in case they changed, though unlikely here
            // Note: serverSessionManager returns the array reference, but we can update it
            const currentSession = serverSessionManager.getSession(sessionId);
            if (currentSession && response && response.messages) {
              currentSession.messages = [...newMessages, ...response.messages];
            }
          }
        }
      });

      // Stream the raw text back to the frontend
      return result.toTextStreamResponse({
        headers: {
          'X-Session-Id': sessionId, // Send server session ID in header
        },
      });
    }

    // Non-streaming response
    const result = await generateText({
      model: yousufRiceModel,
      system: yousufRiceSystemPrompt,
      messages: newMessages,
      tools: yousufRiceTools,
      stopWhen: stepCountIs(5),
    });

    // Save to session memory
    const session = serverSessionManager.getSession(sessionId);
    if (session && result.response && result.response.messages) {
      session.messages = [...newMessages, ...result.response.messages];
    }

    return NextResponse.json({
      success: true,
      output: result.text,
      sessionId, // Return server session ID to store in frontend
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred while processing your request',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat?userId=xxx
 * Get user's chat sessions and server statistics
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get server session statistics
    const stats = serverSessionManager.getStats();

    return NextResponse.json({
      success: true,
      stats,
      userSessions: stats.sessionsByUser[userId] || 0,
    });
  } catch (error: any) {
    console.error('Get Sessions Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve sessions',
      },
      { status: 500 }
    );
  }
}
