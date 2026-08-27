import { NextRequest, NextResponse } from 'next/server';
import {
  getTempmdPreview,
  publishTempmdPreview,
  revokeTempmdPreview,
  TempmdShareError,
  toPublicTempmdShareError,
} from '@/lib/share/tempmd';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

type PublishBody = {
  taskId?: unknown;
  html?: unknown;
};

type RevokeBody = {
  taskId?: unknown;
};

export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get('taskId') ?? '';
    return NextResponse.json(await getTempmdPreview(taskId), {
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await parseJson(request)) as PublishBody;
    if (typeof body.taskId !== 'string') {
      throw new TempmdShareError('Missing or invalid taskId.', 400, 'invalid_task_id');
    }
    if (typeof body.html !== 'string') {
      throw new TempmdShareError('Missing or invalid HTML.', 400, 'invalid_html');
    }
    return NextResponse.json(
      await publishTempmdPreview({
        taskId: body.taskId,
        html: body.html,
      }),
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await parseJson(request)) as RevokeBody;
    if (typeof body.taskId !== 'string') {
      throw new TempmdShareError('Missing or invalid taskId.', 400, 'invalid_task_id');
    }
    return NextResponse.json(await revokeTempmdPreview(body.taskId), {
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new TempmdShareError('Invalid JSON body.', 400, 'invalid_json');
  }
}

function errorResponse(error: unknown): NextResponse {
  const response = toPublicTempmdShareError(error);
  return NextResponse.json(response.body, {
    status: response.status,
    headers: NO_STORE_HEADERS,
  });
}
