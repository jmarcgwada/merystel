
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/management/payment-methods');
  return null;
}
