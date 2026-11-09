import { asset as serve } from "@odsuite/electron/assets";
// Legacy direct-HTTP fixture; the new host uses IPC with connect-src 'none'.
export function asset(root: string, request: Request): Promise<Response> {
  return serve(root, request, "http://127.0.0.1:*");
}
