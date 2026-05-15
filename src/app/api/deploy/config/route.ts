import { NextRequest, NextResponse } from "next/server";
import {
  DeployError,
  isDeployProviderId,
  publicDeployConfigForProvider,
  readDeployConfig,
  writeDeployConfig,
  type DeployConfig,
  type DeployProviderId,
} from "@/lib/deploy/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET  /api/deploy/config?provider=vercel
 *   → public-shape config (token masked)
 * PUT  /api/deploy/config?provider=vercel
 *   body: { token?, teamId?, teamSlug?, accountId? }
 *   → updated public-shape config
 *
 * Tokens never leave the server in plaintext. Once configured, GET returns
 * `tokenMask: "saved-vercel-token"` (or the cloudflare equivalent); the
 * client sends that mask back unchanged when it wants to keep the existing
 * value during a partial update of `teamId` etc.
 */

function deployErrorResponse(err: unknown): NextResponse {
  if (err instanceof DeployError) {
    return NextResponse.json(
      { error: err.message, code: err.code, details: err.details },
      { status: err.status },
    );
  }
  const msg = err instanceof Error ? err.message : String(err);
  return NextResponse.json({ error: msg }, { status: 500 });
}

function readProvider(req: NextRequest): DeployProviderId {
  const provider = req.nextUrl.searchParams.get("provider") ?? "vercel";
  if (!isDeployProviderId(provider)) {
    throw new DeployError(`Unknown deploy provider: ${provider}`, 400);
  }
  return provider;
}

export async function GET(req: NextRequest) {
  try {
    const providerId = readProvider(req);
    const config = await readDeployConfig(providerId);
    return NextResponse.json(publicDeployConfigForProvider(providerId, config));
  } catch (err) {
    return deployErrorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const providerId = readProvider(req);
    let body: Partial<DeployConfig>;
    try {
      body = (await req.json()) as Partial<DeployConfig>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }
    const updated = await writeDeployConfig(providerId, body);
    return NextResponse.json(updated);
  } catch (err) {
    return deployErrorResponse(err);
  }
}
