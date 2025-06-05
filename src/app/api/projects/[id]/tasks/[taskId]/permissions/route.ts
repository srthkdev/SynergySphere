import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/auth-utils";
import { canDeleteTask } from "@/lib/project-auth";

// GET /api/projects/[id]/tasks/[taskId]/permissions - Check task permissions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    // Check if the current user can delete this task
    const canDelete = await canDeleteTask(currentUser.id, taskId);

    return NextResponse.json({ canDelete });

  } catch (error) {
    console.error("Error checking task permissions:", error);
    return NextResponse.json({ error: "Failed to check permissions" }, { status: 500 });
  }
} 