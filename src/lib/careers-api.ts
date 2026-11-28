import axios from 'axios';

export type CareerTeam =
  | 'Engineering & AI'
  | 'Product & Design'
  | 'Growth & Success'
  | 'Operations & Trust';

export interface PublicCareerJob {
  id: string;
  slug: string;
  title: string;
  team: CareerTeam;
  location: string;
  experience: string;
  employmentType: 'Full-Time' | 'Contract' | 'Internship';
  compensation: string;
  summary: string;
  responsibilities: string[];
  skills: string[];
  featured: boolean;
  createdAt: string;
}

const publicHttp = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export async function fetchPublicCareerJobsApi(
  team?: string,
): Promise<{ data: PublicCareerJob[] }> {
  const { data } = await publicHttp.get<{ data: PublicCareerJob[] }>(
    '/public/careers/jobs',
    {
      params: {
        ...(team && team !== 'All' ? { team } : {}),
        _t: Date.now(),
      },
    },
  );
  return data;
}

export async function submitCareerApplicationApi(payload: {
  jobId?: string;
  jobTitle: string;
  jobTeam?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  noticePeriod?: string;
  portfolioUrl?: string;
  coverNote?: string;
  resumeFileName: string;
  resumeSizeBytes: number;
  resumeBase64: string;
}): Promise<{
  applicationId: string;
  jobTitle: string;
  candidateEmail: string;
  resumeFileName: string;
  submittedAt: string;
}> {
  const { data } = await publicHttp.post('/public/careers/apply', payload);
  return data;
}
