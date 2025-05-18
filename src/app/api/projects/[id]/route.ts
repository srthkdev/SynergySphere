import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { project, projectMember, user } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";

// GET /api/projects/:id - Get project by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const projectId = (await params).id;
    
    // Check if project exists and user is a member
    const [projectData] = await db
      .select({
        project: project,
        memberCount: sql<number>`count(distinct ${projectMember.userId})`,
        isMember: sql<number>`count(case when ${projectMember.userId} = ${currentUser.id} then 1 end)`,
      })
      .from(project)
      .leftJoin(
        projectMember,
        eq(project.id, projectMember.projectId)
      )
      .where(eq(project.id, projectId))
      .groupBy(project.id);
    
    if (!projectData) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Check if user is a member of the project
    if (projectData.isMember === 0) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }
    
    // Return formatted project data
    return NextResponse.json({
      id: projectData.project.id,
      name: projectData.project.name,
      description: projectData.project.description,
      createdAt: projectData.project.createdAt,
      updatedAt: projectData.project.updatedAt,
      memberCount: Number(projectData.memberCount),
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/:id - Update project
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description } = await req.json();
    const currentUser = await getUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const projectId = (await params).id;
    
    // Check if project exists and user is an admin
    const [projectMemberData] = await db
      .select({
        role: projectMember.role,
      })
      .from(projectMember)
      .where(
        sql`${projectMember.projectId} = ${projectId} AND ${projectMember.userId} = ${currentUser.id}`
      );
    
    if (!projectMemberData) {
      return NextResponse.json(
        { error: "Project not found or you don't have access" },
        { status: 404 }
      );
    }
    
    // Only allow admins to update project
    if (projectMemberData.role !== 'admin') {
      return NextResponse.json(
        { error: "You don't have permission to update this project" },
        { status: 403 }
      );
    }
    
    // Update project
    await db
      .update(project)
      .set({
        name: name,
        description: description,
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId));
    
    // Get updated project
    const [updatedProject] = await db
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
      
    // Return updated project
    return NextResponse.json({
      id: updatedProject.project.id,
      name: updatedProject.project.name,
      description: updatedProject.project.description,
      createdAt: updatedProject.project.createdAt,
      updatedAt: updatedProject.project.updatedAt,
      memberCount: Number(updatedProject.memberCount),
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/:id - Delete project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const projectId = (await params).id;
    
    // Check if project exists and user is an admin
    const [projectMemberData] = await db
      .select({
        role: projectMember.role,
      })
      .from(projectMember)
      .where(
        sql`${projectMember.projectId} = ${projectId} AND ${projectMember.userId} = ${currentUser.id}`
      );
    
    if (!projectMemberData) {
      return NextResponse.json(
        { error: "Project not found or you don't have access" },
        { status: 404 }
      );
    }
    
    // Only allow admins to delete project
    if (projectMemberData.role !== 'admin') {
      return NextResponse.json(
        { error: "You don't have permission to delete this project" },
        { status: 403 }
      );
    }
    
    // Delete project - this will cascade delete all related data due to foreign key constraints
    await db
      .delete(project)
      .where(eq(project.id, projectId));
    
    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
} 