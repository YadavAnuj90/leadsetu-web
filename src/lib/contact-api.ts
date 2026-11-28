import axios from 'axios';

const publicHttp = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export async function submitPublicContactInquiryApi(payload: {
  name: string;
  company: string;
  email: string;
  phone?: string;
  topic?: string;
  message: string;
}): Promise<{
  inquiryId: string;
  name: string;
  company: string;
  email: string;
  topic: string;
  submittedAt: string;
}> {
  const { data } = await publicHttp.post('/public/contact/inquiries', payload);
  return data;
}
