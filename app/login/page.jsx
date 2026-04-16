import LoginForm from '@/components/LoginForm';
import { Metadata } from 'next';

export const metadata = {
  title: 'Login - BpExch',
  description: 'Login to BpExch betting platform',
};

export default function LoginPage() {
  return <LoginForm />;
}
