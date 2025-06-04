import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectMember, user } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";

// Helper to check if current user is an admin of the project
async function isProjectAdmin(projectId: string, userId: string): Promise<boolean> {
  const [member] = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId), eq(projectMember.role, 'admin')));
  return !!member;
}

// DELETE /api/projects/[id]/members/[memberId] - Remove a member from a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, memberId } = await params;

    // Only project admins can remove members, OR a user can remove themselves
    const isAdmin = await isProjectAdmin(projectId, currentUser.id);
    
    if (!isAdmin && currentUser.id !== memberId) {
        return NextResponse.json({ error: "Forbidden: Only admins can remove other members, or you can remove yourself." }, { status: 403 });
    }

    // Prevent admin from removing the last admin if they are that admin
    if (isAdmin && currentUser.id === memberId) {
        const adminCountResult = await db.select({ count: sql<number>`count(*)::int` }).from(projectMember)
            .where(and(eq(projectMember.projectId, projectId), eq(projectMember.role, 'admin')));
        const adminCount = adminCountResult[0]?.count || 0;

        if (adminCount <= 1) {
            return NextResponse.json({ error: "Cannot remove the last admin of the project." }, { status: 400 });
        }
    }

    const [deletedMember] = await db
      .delete(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, memberId)))
      .returning({ deletedUserId: projectMember.userId });

    if (!deletedMember) {
      return NextResponse.json({ error: "Member not found in this project or already removed" }, { status: 404 });
    }

    return NextResponse.json({ success: true, removedUserId: deletedMember.deletedUserId });

  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json({ error: "Failed to remove project member" }, { status: 500 });
  }
}

// PATCH /api/projects/[id]/members/[memberId] - Update a member's role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { role } = await req.json();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, memberId } = await params;

    if (!role || (role !== 'admin' && role !== 'member')) {
        return NextResponse.json({ error: "Invalid role specified. Must be 'admin' or 'member'." }, { status: 400 });
    }

    // Only project admins can change roles
    if (!await isProjectAdmin(projectId, currentUser.id)) {
      return NextResponse.json({ error: "Forbidden: Only admins can change member roles" }, { status: 403 });
    }
    
    // Prevent changing own role if last admin to a non-admin role
    if (currentUser.id === memberId && role !== 'admin') {
        const adminCountResult = await db.select({ count: sql<number>`count(*)::int` }).from(projectMember)
            .where(and(eq(projectMember.projectId, projectId), eq(projectMember.role, 'admin')));
        const adminCount = adminCountResult[0]?.count || 0;

        const [currentMember] = await db.select().from(projectMember).where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id)));

        if (currentMember?.role === 'admin' && adminCount <= 1) {
            return NextResponse.json({ error: "Cannot change the role of the last admin to non-admin." }, { status: 400 });
        }
    }

    const [updatedMember] = await db
      .update(projectMember)
      .set({ role: role })
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, memberId)))
      .returning(); 

    if (!updatedMember) {
      return NextResponse.json({ error: "Member not found in this project or update failed" }, { status: 404 });
    }

    return NextResponse.json(updatedMember);

  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
  }
} 