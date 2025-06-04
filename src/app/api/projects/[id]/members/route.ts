import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectMember, user, project } from "@/lib/db/schema";
import { and, eq, sql, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth/auth-utils";
import { v4 as uuidv4 } from "uuid";
import { createNotification } from "@/lib/notifications";

// Helper to check if current user is an admin of the project
async function isProjectAdmin(projectId: string, userId: string): Promise<boolean> {
  const [member] = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId), eq(projectMember.role, 'admin')));
  return !!member;
}

// GET /api/projects/[id]/members - Get all members of a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check if the current user is a member of the project
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id)));

    if (!member) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this project" }, { status: 403 });
    }

    // Fetch all members of the project with their user details
    const members = await db
      .select({
        id: projectMember.id,
        userId: projectMember.userId,
        projectId: projectMember.projectId,
        role: projectMember.role,
        joinedAt: projectMember.joinedAt,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(projectMember)
      .innerJoin(user, eq(projectMember.userId, user.id))
      .where(eq(projectMember.projectId, projectId))
      .orderBy(projectMember.joinedAt);

    return NextResponse.json(members);

  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json({ error: "Failed to fetch project members" }, { status: 500 });
  }
}

// POST /api/projects/[id]/members - Add a new member to a project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { email, role = 'member' } = await req.json();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (role !== 'admin' && role !== 'member') {
      return NextResponse.json({ error: "Invalid role. Must be 'admin' or 'member'" }, { status: 400 });
    }

    // Check if the current user is an admin of the project
    const [currentMember] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id), eq(projectMember.role, 'admin')));

    if (!currentMember) {
      return NextResponse.json({ error: "Forbidden: Only project admins can add members" }, { status: 403 });
    }

    // Find the user to add
    const [userToAdd] = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (!userToAdd) {
      return NextResponse.json({ error: "User not found with this email" }, { status: 404 });
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userToAdd.id)));

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 400 });
    }

    // Add the user as a member
    const [newMember] = await db
      .insert(projectMember)
      .values({
        projectId,
        userId: userToAdd.id,
        role,
      })
      .returning();

    // Return the new member with user details
    const memberWithDetails = await db
      .select({
        id: projectMember.id,
        userId: projectMember.userId,
        projectId: projectMember.projectId,
        role: projectMember.role,
        joinedAt: projectMember.joinedAt,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(projectMember)
      .innerJoin(user, eq(projectMember.userId, user.id))
      .where(eq(projectMember.id, newMember.id));

    return NextResponse.json(memberWithDetails[0], { status: 201 });

  } catch (error) {
    console.error("Error adding project member:", error);
    return NextResponse.json({ error: "Failed to add project member" }, { status: 500 });
  }
} 