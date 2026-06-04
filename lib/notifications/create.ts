import { prisma } from '@/lib/db';
import { NotificationType } from '@prisma/client';

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        href: params.href,
      }
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

export async function createNotificationForClass(params: {
  classId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
}) {
  try {
    const targetClass = await prisma.class.findUnique({
      where: { id: params.classId },
      include: { students: { select: { id: true } } }
    });

    if (!targetClass) return;

    const data = targetClass.students.map(s => ({
      userId: s.id,
      type: params.type,
      title: params.title,
      message: params.message,
      href: params.href,
    }));

    await prisma.notification.createMany({ data });
  } catch (error) {
    console.error('Failed to create notifications for class:', error);
  }
}
