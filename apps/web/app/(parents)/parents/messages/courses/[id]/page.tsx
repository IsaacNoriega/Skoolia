import CourseMessageConversation from '@/components/parents/CourseMessageConversation';


export default async function ParentsCourseMessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseMessageConversation courseId={id} />;
}
