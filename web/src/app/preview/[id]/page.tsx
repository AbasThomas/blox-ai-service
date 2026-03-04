import { redirect } from 'next/navigation';

export default function PreviewRedirect({ params }: { params: { id: string } }) {
  redirect(`/portfolios/${params.id}?tab=preview`);
}
