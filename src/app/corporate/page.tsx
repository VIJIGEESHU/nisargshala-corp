import { redirect } from 'next/navigation';

/**
 * Customer HR Dashboard has been temporarily disabled.
 * Any access attempt to /corporate is cleanly redirected to the main Corporate Products page.
 */
export default function CorporatePage() {
  redirect('/');
}
