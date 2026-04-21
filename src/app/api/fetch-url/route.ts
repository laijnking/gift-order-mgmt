import { NextRequest, NextResponse } from 'next/server';
import { FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

const config = new Config();

export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.SETTINGS_EDIT);
  if (authError) return authError;

  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    // Extract forward headers for proper request tracing
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const fetchClient = new FetchClient(config, customHeaders);
    
    const response = await fetchClient.fetch(url);
    
    return NextResponse.json({
      status_code: response.status_code,
      status_message: response.status_message,
      title: response.title,
      filetype: response.filetype,
      content: response.content,
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch URL',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
