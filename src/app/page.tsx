
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/restaurant');
  return null;
}
