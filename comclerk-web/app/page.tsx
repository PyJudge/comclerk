// [COMCLERK-MODIFIED] 2024-12-01: 기본 페이지를 워크스페이스(3패널)로 변경
import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/workspace')
}
