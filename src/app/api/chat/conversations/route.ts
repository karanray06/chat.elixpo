import { NextRequest } from "next/server";
import { listConversations, deleteConversation, getConversation } from "@/lib/chat/db";
import { getUserId } from "@/lib/get-user-id";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const conversations = await listConversations(userId);
    return new Response(JSON.stringify(conversations), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error listing conversations:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return new Response("Missing id", { status: 400 });

    const conversation = await getConversation(id);
    if (!conversation || conversation.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    await deleteConversation(id);
    return new Response(JSON.stringify({ success: true }));
  } catch (error: unknown) {
    console.error("Error deleting conversation:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
