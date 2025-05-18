import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { project, projectMember, user } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";
import { v4 as uuidv4 } from "uuid";

// GET /api/projects - Get all projects for the current user
export async function GET() {
  try {
    const currentUser = await getUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all projects where the user is a member
    const userProjects = await db
      .select({
        project: project,
        memberCount: sql<number>`count(distinct ${projectMember.userId})`,
      })
      .from(project)
      .leftJoin(
        projectMember,
        eq(project.id, projectMember.projectId)
      )
      // Only get projects where the user is a member
      .where(
        eq(projectMember.userId, currentUser.id)
      )
      .groupBy(project.id)
      .orderBy(desc(project.createdAt));

    // Format the response
    const formattedProjects = userProjects.map((item) => ({
      id: item.project.id,
      name: item.project.name,
      description: item.project.description,
      createdAt: item.project.createdAt,
      updatedAt: item.project.updatedAt,
      memberCount: Number(item.memberCount),
    }));

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, description } = await req.json();
    
    // Validate input
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create the project with a UUID
    const projectId = uuidv4();
    const now = new Date();
    
    // Insert the project
    await db.insert(project).values({
      id: projectId,
      name,
      description,
      createdById: currentUser.id,
      createdAt: now,
      updatedAt: now,
    });
    
    // Add the current user as a project member with admin role
    await db.insert(projectMember).values({
      id: uuidv4(),
      projectId,
      userId: currentUser.id,
      role: "admin",
      joinedAt: now,
    });

    // Get the created project with member count
    const [createdProject] = await db
      .select({
        project: project,
        memberCount: sql<number>`count(distinct ${projectMember.userId})`,
      })
      .from(project)
      .leftJoin(
        projectMember,
        eq(project.id, projectMember.projectId)
      )
      .where(eq(project.id, projectId))
      .groupBy(project.id);

    // Return the created project
    return NextResponse.json({
      id: createdProject.project.id,
      name: createdProject.project.name,
      description: createdProject.project.description,
      createdAt: createdProject.project.createdAt,
      updatedAt: createdProject.project.updatedAt,
      memberCount: Number(createdProject.memberCount),
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
} 