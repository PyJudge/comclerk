import { SessionView } from '@/components/session/session-view'

interface SessionPageProps {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params

  return <SessionView sessionId={id} />
}
