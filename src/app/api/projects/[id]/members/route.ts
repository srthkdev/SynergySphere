import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectMember, user, project } from "@/lib/db/schema";
import { and, eq, sql, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";
import { v4 as uuidv4 } from "uuid";

// Helper to check if current user is an admin of the project
async function isProjectAdmin(projectId: string, userId: string): Promise<boolean> {
  const [member] = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId), eq(projectMember.role, 'admin')));
  return !!member;
}

// GET /api/projects/[id]/members - List all members of a project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = (await Promise.resolve(params)).id;

    // Verify current user is a member of the project to view other members
    const [isMember] = await db.select().from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id)));
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden: Not a project member" }, { status: 403 });
    }

    const members = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: projectMember.role,
        joinedAt: projectMember.joinedAt
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

// POST /api/projects/[id]/members - Add a new member to a project by email
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role = 'member' } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const projectId = (await Promise.resolve(params)).id;

    // Only project admins can add new members
    if (!await isProjectAdmin(projectId, currentUser.id)) {
      return NextResponse.json({ error: "Only project admins can add members" }, { status: 403 });
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, existingUser.id)
        )
      );

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 400 });
    }

    // Add member
    const [newMember] = await db
      .insert(projectMember)
      .values({
        projectId,
        userId: existingUser.id,
        role: role as 'admin' | 'member'
      })
      .returning();

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Error adding project member:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
} 