import { NextRequest, NextResponse } from 'next/server';
import {
  sendMetaEvent,
  prepareUserData,
  getClientIp,
  getCurrentTimestamp,
  type MetaEvent,
  type MetaCustomData,
} from '@/lib/meta';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      event_name,
      event_id,
      event_source_url,
      user_data,
      custom_data,
      test_event_code,
    } = body;

    // Validate required fields
    if (!event_name || !event_id) {
      return NextResponse.json(
        { error: 'Missing required fields: event_name, event_id' },
        { status: 400 }
      );
    }

    // Get client IP and user agent from request headers
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Prepare user data with hashing
    const preparedUserData = prepareUserData({
      email: user_data?.email,
      phone: user_data?.phone,
      firstName: user_data?.firstName,
      lastName: user_data?.lastName,
      city: user_data?.city,
      state: user_data?.state,
      zipCode: user_data?.zipCode,
      country: user_data?.country,
      clientIp,
      userAgent,
      fbp: user_data?.fbp,
      fbc: user_data?.fbc,
      externalId: user_data?.externalId,
    });

    // Construct Meta event
    const metaEvent: MetaEvent = {
      event_name,
      event_time: getCurrentTimestamp(),
      event_id,
      event_source_url: event_source_url || request.headers.get('referer') || undefined,
      action_source: 'website',
      user_data: preparedUserData,
      custom_data: custom_data as MetaCustomData,
    };

    // Send to Meta Conversions API
    const result = await sendMetaEvent(metaEvent, test_event_code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event_id,
      message: 'Event sent successfully',
    });
  } catch (error) {
    console.error('Meta Events API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
