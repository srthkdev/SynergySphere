import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { task, projectMember } from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";
import { v4 as uuidv4 } from "uuid";

// GET /api/projects/[id]/tasks - Get all tasks for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = (await params).id;

    // Verify user is a member of the project
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id)));

    if (!member) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this project" }, { status: 403 });
    }

    const projectTasks = await db
      .select()
      .from(task)
      .where(eq(task.projectId, projectId))
      .orderBy(desc(task.createdAt));

    return NextResponse.json(projectTasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/projects/[id]/tasks - Create a new task for a project
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, description, status, dueDate, assigneeId, priority, attachmentUrl } = await req.json();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = (await params).id;

    // Verify user is a member of the project
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id)));
      
    if (!member) {
      return NextResponse.json({ error: "Forbidden: You can only create tasks for projects you are a member of" }, { status: 403 });
    }

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const taskId = uuidv4();
    const now = new Date();

    const newTask = {
      id: taskId,
      title,
      description,
      status: status || 'TODO',
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
      assigneeId,
      createdById: currentUser.id,
      createdAt: now,
      updatedAt: now,
      priority: priority || 'MEDIUM',
      attachmentUrl,
    };

    await db.insert(task).values(newTask);

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
} 